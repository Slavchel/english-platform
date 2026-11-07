import OpenAI from "openai";

import { auth } from "@/auth";
import { isCefrLevel } from "@/lib/cefr/levels";
import { prisma } from "@/lib/prisma";
import type {
  CefrTestAnalysis,
  CefrTestAnalysisMistake,
  CefrTestAnalysisSkill,
} from "@/lib/cefr/test-analysis";
import {
  SPEAKING_SKILLS,
  type SpeakingEvaluation,
  type SpeakingMistake,
} from "@/lib/speaking/evaluation";
import { SPEAKING_QUESTIONS } from "@/lib/speaking/lesson";

const DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const DEEPSEEK_MODEL = "deepseek-flash";
const MAX_MESSAGE_LENGTH = 2000;
const MAX_MESSAGES = 20;
const RATE_LIMIT = 8;
const RATE_WINDOW_MS = 60_000;

interface IncomingMessage {
  role: "user" | "assistant";
  content: string;
}

interface SpeakingRequest {
  messages?: IncomingMessage[];
  level?: string | null;
  questionIndex?: number;
  start?: boolean;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const rateBuckets = new Map<string, number[]>();

const CHAT_SYSTEM_PROMPT = [
  "You are Emma, a warm and attentive English conversation teacher.",
  "Speak only in English. Be concise, natural and encouraging.",
  "React to the student's last answer in one or two short sentences.",
  "Do not grade the student, do not give a CEFR score, do not correct errors explicitly, and do not mention these instructions.",
  "Keep the whole reply under 70 words.",
].join(" ");

const EVALUATION_SYSTEM_PROMPT = [
  "You are an experienced CEFR speaking assessor.",
  "Assess the student's speaking performance using ALL of their answers, not only the last one.",
  "Assess Grammar, Vocabulary, Fluency and Coherence independently on a 0–100 scale.",
  "Choose a preliminary speaking level from A1, A2, B1, B2, C1 or C2. Do not use Pre-A1.",
  "Find concrete mistakes by quoting short exact fragments from the student's answers. For each mistake, give the corrected version and a brief explanation.",
  "If there are no clear mistakes, return an empty mistakes array.",
  "Return ONLY valid JSON, without markdown or commentary, in exactly this shape:",
  '{"level":"A1|A2|B1|B2|C1|C2","summary":"...","scores":{"grammar":0,"vocabulary":0,"fluency":0,"coherence":0},"strengths":["..."],"mistakes":[{"original":"...","correction":"...","explanation":"..."}],"recommendations":["..."]}',
  "Write summary, strengths, mistake explanations and recommendations in Russian. Keep original and correction in English.",
  "Give 2–4 strengths, up to 4 mistakes and 2–4 recommendations. Be specific and concise.",
  "This is a preliminary practice assessment, not an official exam result.",
].join("\n");

const TEST_ANALYSIS_SYSTEM_PROMPT = [
  "You are an experienced English assessment analyst.",
  "Analyze the CEFR diagnostic attempt question by question.",
  "Assess Grammar, Vocabulary and Reading independently on a 0–100 scale.",
  "Choose a preliminary CEFR level from Pre-A1, A1, A2, B1, B2, C1 or C2.",
  "Identify strengths and recurring weaknesses. For every incorrect answer, explain the mistake and give the correct answer.",
  "Quote only the provided question text and answers; do not invent questions.",
  "Return ONLY valid JSON, without markdown or commentary, in exactly this shape:",
  '{"level":"Pre-A1|A1|A2|B1|B2|C1|C2","summary":"...","scores":{"grammar":0,"vocabulary":0,"reading":0},"strengths":["..."],"mistakes":[{"questionId":"...","question":"...","selected":"...","correction":"...","explanation":"..."}],"recommendations":["..."]}',
  "Write summary, strengths, mistake explanations and recommendations in Russian. Keep question, selected and correction in English.",
  "Give 2–4 strengths, up to 8 mistakes and 2–4 recommendations.",
  "This is a preliminary practice analysis, not an official exam result.",
].join("\n");

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (rateBuckets.get(key) ?? []).filter(
    (timestamp) => now - timestamp < RATE_WINDOW_MS,
  );

  if (recent.length >= RATE_LIMIT) {
    rateBuckets.set(key, recent);
    return true;
  }

  recent.push(now);
  rateBuckets.set(key, recent);
  return false;
}

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "local";
}

function buildChatContext(
  level: string | null,
  questionIndex: number,
  isStart: boolean,
): string {
  const current = SPEAKING_QUESTIONS[questionIndex];
  const next = SPEAKING_QUESTIONS[questionIndex + 1];
  const levelNote = level
    ? `Student CEFR level: ${level}. Use comfortable vocabulary and structures while keeping the conversation natural.`
    : "Student CEFR level: unknown. Keep the English clear and natural.";

  if (isStart) {
    return [
      "This is the opening turn.",
      levelNote,
      `Greet the student warmly, introduce yourself as Emma, and ask exactly one first question about: ${current.prompt}`,
      "Return only Emma's reply.",
    ].join("\n");
  }

  const nextNote = next
    ? `After reacting, ask exactly one follow-up question about: ${next.prompt}`
    : "This is the final turn. React warmly and close the conversation without asking another question.";

  return [
    `Conversation turn: ${questionIndex + 1} of ${SPEAKING_QUESTIONS.length}.`,
    levelNote,
    `Current topic: ${current.prompt}`,
    nextNote,
    "Return only Emma's reply.",
  ].join("\n");
}

function buildChatMessages(parsed: SpeakingRequest): ChatMessage[] {
  const isStart = parsed.start === true;
  const context = buildChatContext(
    parsed.level ?? null,
    parsed.questionIndex ?? 0,
    isStart,
  );
  const history: ChatMessage[] = (parsed.messages ?? []).map((message) => ({
    role: message.role,
    content: message.content,
  }));

  if (isStart || history.length === 0) {
    return [
      { role: "system", content: CHAT_SYSTEM_PROMPT },
      { role: "user", content: context },
    ];
  }

  const last = history[history.length - 1];
  if (last.role === "user") {
    last.content = `${last.content}\n\n${context}`;
    return [
      { role: "system", content: CHAT_SYSTEM_PROMPT },
      ...history,
    ];
  }

  return [
    { role: "system", content: CHAT_SYSTEM_PROMPT },
    ...history,
    { role: "user", content: context },
  ];
}

function parseBody(value: unknown): SpeakingRequest | null {
  if (!value || typeof value !== "object") return null;
  const body = value as Record<string, unknown>;
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const start = body.start === true;

  if ((!start && messages.length === 0) || messages.length > MAX_MESSAGES) {
    return null;
  }

  const parsedMessages: IncomingMessage[] = [];
  for (const raw of messages) {
    if (!raw || typeof raw !== "object") return null;
    const message = raw as Record<string, unknown>;
    if (message.role !== "user" && message.role !== "assistant") {
      return null;
    }
    if (typeof message.content !== "string") return null;
    const content = message.content.trim();
    if (!content || content.length > MAX_MESSAGE_LENGTH) return null;
    parsedMessages.push({ role: message.role, content });
  }

  const level =
    typeof body.level === "string" && isCefrLevel(body.level)
      ? body.level
      : null;
  const questionIndex =
    typeof body.questionIndex === "number" &&
    Number.isInteger(body.questionIndex) &&
    body.questionIndex >= 0 &&
    body.questionIndex < SPEAKING_QUESTIONS.length
      ? body.questionIndex
      : 0;

  return {
    messages: parsedMessages,
    level,
    questionIndex,
    start,
  };
}

function isEvaluationLevel(
  value: unknown,
): value is SpeakingEvaluation["level"] {
  return isCefrLevel(value) && value !== "Pre-A1";
}

function clampScore(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function parseEvaluationBody(value: unknown): {
  answers: string[];
  level: SpeakingEvaluation["level"] | null;
  messages: IncomingMessage[];
} | null {
  if (!value || typeof value !== "object") return null;
  const body = value as Record<string, unknown>;
  if (!Array.isArray(body.answers)) return null;

  const answers = body.answers.map((answer) =>
    typeof answer === "string" ? answer.trim() : "",
  );
  if (
    answers.length === 0 ||
    answers.length > SPEAKING_QUESTIONS.length ||
    answers.some((answer) => !answer || answer.length > MAX_MESSAGE_LENGTH)
  ) {
    return null;
  }

  const rawMessages = Array.isArray(body.messages) ? body.messages : [];
  if (rawMessages.length > MAX_MESSAGES) return null;
  const messages: IncomingMessage[] = [];
  for (const raw of rawMessages) {
    if (!raw || typeof raw !== "object") return null;
    const message = raw as Record<string, unknown>;
    if (message.role !== "user" && message.role !== "assistant") {
      return null;
    }
    if (typeof message.content !== "string") return null;
    const content = message.content.trim();
    if (!content || content.length > MAX_MESSAGE_LENGTH) return null;
    messages.push({ role: message.role, content });
  }

  const level =
    typeof body.level === "string" && isEvaluationLevel(body.level)
      ? body.level
      : null;

  return { answers, level, messages };
}

function buildEvaluationContext(
  level: string | null,
  answers: string[],
  messages: IncomingMessage[],
): string {
  const transcript =
    messages.length > 0
      ? messages.map((message) => ({
          role: message.role === "assistant" ? "Emma" : "Student",
          content: message.content,
        }))
      : answers.map((answer) => ({ role: "Student", content: answer }));

  return [
    level
      ? `Previous CEFR test result (context only): ${level}.`
      : "Previous CEFR test result: unknown.",
    "Full conversation transcript:",
    ...transcript.map(
      (message) => `${message.role}: ${message.content}`,
    ),
    "Student answers:",
    ...answers.map((answer, index) => `${index + 1}. ${answer}`),
    "Assess all answers and return the JSON result.",
  ].join("\n");
}

function extractJson(content: string): unknown {
  const cleaned = content
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("JSON not found");
  return JSON.parse(cleaned.slice(start, end + 1));
}

function normalizeEvaluation(
  raw: unknown,
  answers: string[],
  levelFromTest: SpeakingEvaluation["level"] | null,
): SpeakingEvaluation | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  if (!isEvaluationLevel(value.level)) return null;
  if (typeof value.summary !== "string" || !value.summary.trim()) return null;
  if (!value.scores || typeof value.scores !== "object") return null;

  const scoreSource = value.scores as Record<string, unknown>;
  const scores = Object.fromEntries(
    SPEAKING_SKILLS.map((skill) => [skill, clampScore(scoreSource[skill])]),
  ) as SpeakingEvaluation["scores"];

  const toStrings = (input: unknown): string[] =>
    Array.isArray(input)
      ? input
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

  const mistakes: SpeakingMistake[] = Array.isArray(value.mistakes)
    ? value.mistakes
        .filter((item): item is Record<string, unknown> => {
          if (!item || typeof item !== "object") return false;
          const mistake = item as Record<string, unknown>;
          return (
            typeof mistake.original === "string" &&
            typeof mistake.correction === "string" &&
            typeof mistake.explanation === "string"
          );
        })
        .map((mistake) => ({
          original: String(mistake.original).trim(),
          correction: String(mistake.correction).trim(),
          explanation: String(mistake.explanation).trim(),
        }))
        .filter(
          (mistake) =>
            mistake.original && mistake.correction && mistake.explanation,
        )
    : [];

  return {
    level: value.level,
    summary: value.summary.trim(),
    scores,
    strengths: toStrings(value.strengths),
    mistakes,
    recommendations: toStrings(value.recommendations),
    answered: answers.length,
    levelFromTest,
  };
}

interface TestAnalysisQuestion {
  id: string;
  skill: CefrTestAnalysisSkill;
  level: string;
  stem: string;
  selected: string;
  correct: string;
  isCorrect: boolean;
}

const TEST_ANALYSIS_SKILLS: readonly CefrTestAnalysisSkill[] = [
  "grammar",
  "vocabulary",
  "reading",
];

function parseTestAnalysisBody(
  value: unknown,
): { level: string | null; questions: TestAnalysisQuestion[] } | null {
  if (!value || typeof value !== "object") return null;
  const body = value as Record<string, unknown>;
  if (!Array.isArray(body.questions)) return null;
  if (body.questions.length === 0 || body.questions.length > 30) return null;

  const questions: TestAnalysisQuestion[] = [];
  for (const raw of body.questions) {
    if (!raw || typeof raw !== "object") return null;
    const question = raw as Record<string, unknown>;
    if (
      typeof question.id !== "string" ||
      typeof question.level !== "string" ||
      !isCefrLevel(question.level) ||
      typeof question.stem !== "string" ||
      typeof question.selected !== "string" ||
      typeof question.correct !== "string" ||
      typeof question.isCorrect !== "boolean" ||
      !TEST_ANALYSIS_SKILLS.includes(
        question.skill as CefrTestAnalysisSkill,
      )
    ) {
      return null;
    }
    const stem = question.stem.trim();
    const selected = question.selected.trim();
    const correct = question.correct.trim();
    if (
      !stem ||
      selected.length > MAX_MESSAGE_LENGTH ||
      correct.length > MAX_MESSAGE_LENGTH
    ) {
      return null;
    }
    questions.push({
      id: question.id,
      skill: question.skill as CefrTestAnalysisSkill,
      level: question.level,
      stem,
      selected,
      correct,
      isCorrect: question.isCorrect,
    });
  }

  const level =
    typeof body.level === "string" && isCefrLevel(body.level)
      ? body.level
      : null;

  return { level, questions };
}

function buildTestAnalysisContext(
  level: string | null,
  questions: TestAnalysisQuestion[],
): string {
  return [
    level
      ? `Adaptive test overall result (context only): ${level}.`
      : "Adaptive test overall result: unknown.",
    "Answered questions:",
    ...questions.map(
      (question, index) =>
        `${index + 1}. [${question.skill}, ${question.level}, ${question.isCorrect ? "correct" : "incorrect"}] ${question.stem}\n   Student: ${question.selected}\n   Correct: ${question.correct}`,
    ),
    "Analyze all answers and return the JSON result.",
  ].join("\n");
}

function normalizeTestAnalysis(
  raw: unknown,
  questions: TestAnalysisQuestion[],
): CefrTestAnalysis | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  if (!isCefrLevel(value.level)) return null;
  if (typeof value.summary !== "string" || !value.summary.trim()) return null;
  if (!value.scores || typeof value.scores !== "object") return null;

  const scoreSource = value.scores as Record<string, unknown>;
  const scores = Object.fromEntries(
    TEST_ANALYSIS_SKILLS.map((skill) => [
      skill,
      clampScore(scoreSource[skill]),
    ]),
  ) as CefrTestAnalysis["scores"];

  const toStrings = (input: unknown): string[] =>
    Array.isArray(input)
      ? input
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

  const mistakes: CefrTestAnalysisMistake[] = Array.isArray(value.mistakes)
    ? value.mistakes
        .filter((item): item is Record<string, unknown> => {
          if (!item || typeof item !== "object") return false;
          const mistake = item as Record<string, unknown>;
          return (
            typeof mistake.questionId === "string" &&
            typeof mistake.question === "string" &&
            typeof mistake.selected === "string" &&
            typeof mistake.correction === "string" &&
            typeof mistake.explanation === "string"
          );
        })
        .map((mistake) => ({
          questionId: String(mistake.questionId).trim(),
          question: String(mistake.question).trim(),
          selected: String(mistake.selected).trim(),
          correction: String(mistake.correction).trim(),
          explanation: String(mistake.explanation).trim(),
        }))
        .filter(
          (mistake) =>
            mistake.questionId &&
            mistake.question &&
            mistake.selected &&
            mistake.correction &&
            mistake.explanation,
        )
    : [];

  return {
    level: value.level,
    summary: value.summary.trim(),
    scores,
    strengths: toStrings(value.strengths),
    mistakes,
    recommendations: toStrings(value.recommendations),
    answered: questions.length,
  };
}

function createClient(apiKey: string): OpenAI {
  return new OpenAI({
    apiKey,
    baseURL: DEEPSEEK_BASE_URL,
  });
}

async function completeDeepSeek(
  apiKey: string,
  messages: ChatMessage[],
  options: {
    temperature: number;
    maxTokens: number;
    signal: AbortSignal;
    json?: boolean;
  },
): Promise<string> {
  const client = createClient(apiKey);
  const completion = await client.chat.completions.create(
    {
      model: DEEPSEEK_MODEL,
      messages,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      ...(options.json
        ? { response_format: { type: "json_object" as const } }
        : {}),
    },
    { signal: options.signal },
  );

  return completion.choices[0]?.message?.content?.trim() ?? "";
}

function errorStatus(error: unknown): number | undefined {
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status?: unknown }).status;
    if (typeof status === "number") return status;
  }
  return undefined;
}

function aiErrorResponse(
  error: unknown,
  aborted: boolean,
  context: "chat" | "evaluation" | "test",
): Response {
  const status = errorStatus(error);
  if (status === 429) {
    return Response.json(
      {
        error:
          "Лимит запросов DeepSeek исчерпан. Попробуйте позже.",
      },
      { status: 429, headers: { "Retry-After": "3600" } },
    );
  }

  if (aborted) {
    return Response.json(
      {
        error:
          context === "chat"
            ? "Emma отвечает слишком долго. Попробуйте ещё раз."
            : context === "evaluation"
              ? "Оценка Speaking занимает слишком много времени. Попробуйте ещё раз."
              : "AI-анализ занимает слишком много времени. Попробуйте ещё раз.",
      },
      { status: 502 },
    );
  }

  return Response.json(
    {
      error:
        context === "chat"
          ? "Не удалось связаться с Emma. Попробуйте ещё раз."
          : context === "evaluation"
            ? "Не удалось получить оценку Speaking. Попробуйте ещё раз."
            : "Не удалось получить AI-анализ. Попробуйте ещё раз.",
    },
    { status: 502 },
  );
}

async function persistAiAnalysis(
  email: string | null,
  type: "speaking" | "test",
  title: string,
  level: string | null,
  scores: number[],
  summary: string,
  payload: unknown,
  rawResponse: string,
): Promise<void> {
  if (!email) return;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) return;

    const average =
      scores.length > 0
        ? Math.round(
            scores.reduce((total, score) => total + score, 0) / scores.length,
          )
        : null;

    await prisma.aiAnalysis.create({
      data: {
        userId: user.id,
        type,
        title,
        level,
        score: average,
        summary,
        fullResponse: JSON.stringify({
          data: payload,
          raw: rawResponse,
        }),
      },
    });
  } catch (error) {
    console.error("[ai] Failed to save analysis", error);
  }
}

async function evaluateSpeaking(
  apiKey: string,
  body: unknown,
  userEmail: string | null,
): Promise<Response> {
  const parsed = parseEvaluationBody(body);
  if (!parsed) {
    return Response.json(
      { error: "Для оценки нужны ответы пользователя." },
      { status: 400 },
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  try {
    const content = await completeDeepSeek(
      apiKey,
      [
        { role: "system", content: EVALUATION_SYSTEM_PROMPT },
        {
          role: "user",
          content: buildEvaluationContext(
            parsed.level,
            parsed.answers,
            parsed.messages,
          ),
        },
      ],
      {
        temperature: 0.2,
        maxTokens: 6000,
        signal: controller.signal,
        json: true,
      },
    );

    if (!content) {
      return Response.json(
        { error: "Оценка Speaking не вернула результат. Попробуйте ещё раз." },
        { status: 502 },
      );
    }

    const evaluation = normalizeEvaluation(
      extractJson(content),
      parsed.answers,
      parsed.level,
    );
    if (!evaluation) {
      return Response.json(
        { error: "Не удалось разобрать оценку Speaking. Попробуйте ещё раз." },
        { status: 502 },
      );
    }

    await persistAiAnalysis(
      userEmail,
      "speaking",
      "Speaking — разбор разговора",
      evaluation.level,
      Object.values(evaluation.scores),
      evaluation.summary,
      evaluation,
      content,
    );

    return Response.json({ evaluation });
  } catch (error) {
    return aiErrorResponse(error, controller.signal.aborted, "evaluation");
  } finally {
    clearTimeout(timeout);
  }
}

function unwrapTestAnalysis(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  if (record.analysis && typeof record.analysis === "object") {
    return record.analysis;
  }
  if (record.result && typeof record.result === "object") {
    return record.result;
  }
  return value;
}

async function analyzeTest(
  apiKey: string,
  body: unknown,
  userEmail: string | null,
): Promise<Response> {
  const parsed = parseTestAnalysisBody(body);
  if (!parsed) {
    return Response.json(
      { error: "Для анализа нужны отвеченные вопросы." },
      { status: 400 },
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 100_000);

  try {
    let content = "";
    let analysis: CefrTestAnalysis | null = null;

    // DeepSeek occasionally returns a malformed first response, while a second
    // request is valid. Retry once automatically instead of making the user
    // press "AI-анализ" again.
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const retryInstruction =
        attempt === 0
          ? ""
          : "\n\nIMPORTANT: Return exactly one JSON object matching the schema. Do not wrap it in another object, do not use markdown, and do not add commentary.";

      try {
        content = await completeDeepSeek(
          apiKey,
          [
            { role: "system", content: TEST_ANALYSIS_SYSTEM_PROMPT },
            {
              role: "user",
              content:
                buildTestAnalysisContext(parsed.level, parsed.questions) +
                retryInstruction,
            },
          ],
          {
            temperature: attempt === 0 ? 0.2 : 0.1,
            maxTokens: 6000,
            signal: controller.signal,
            json: true,
          },
        );
      } catch (error) {
        if (
          attempt === 0 &&
          !controller.signal.aborted
        ) {
          console.warn(
            "[ai] CEFR analysis request failed, retrying once",
            error,
          );
          continue;
        }
        throw error;
      }

      if (!content) {
        console.warn(
          `[ai] CEFR analysis attempt ${attempt + 1} returned empty content`,
        );
        if (attempt === 0) continue;
        break;
      }

      try {
        const rawAnalysis = unwrapTestAnalysis(extractJson(content));
        analysis = normalizeTestAnalysis(rawAnalysis, parsed.questions);
      } catch (error) {
        console.warn(
          `[ai] CEFR analysis attempt ${attempt + 1} returned invalid JSON`,
          error,
        );
      }

      if (analysis) break;
      console.warn(
        `[ai] CEFR analysis attempt ${attempt + 1} did not match the schema`,
      );
    }

    if (!analysis) {
      return Response.json(
        {
          error:
            "AI дважды вернул некорректный разбор. Попробуйте ещё раз.",
        },
        { status: 502 },
      );
    }

    await persistAiAnalysis(
      userEmail,
      "test",
      "CEFR-тест — AI-разбор",
      analysis.level,
      Object.values(analysis.scores),
      analysis.summary,
      analysis,
      content,
    );

    return Response.json({ analysis });
  } catch (error) {
    return aiErrorResponse(error, controller.signal.aborted, "test");
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user) {
    return Response.json(
      {
        error:
          "Войдите или зарегистрируйтесь, чтобы использовать AI-функции.",
      },
      { status: 401 },
    );
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Emma временно недоступна. Попробуйте позже." },
      { status: 503 },
    );
  }

  if (isRateLimited(clientKey(request))) {
    return Response.json(
      { error: "Слишком много сообщений. Подождите минуту и попробуйте снова." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Некорректный запрос." },
      { status: 400 },
    );
  }

  if (
    body &&
    typeof body === "object" &&
    (body as Record<string, unknown>).action === "evaluate"
  ) {
    return evaluateSpeaking(apiKey, body, session.user.email ?? null);
  }

  if (
    body &&
    typeof body === "object" &&
    (body as Record<string, unknown>).action === "analyze-test"
  ) {
    return analyzeTest(apiKey, body, session.user.email ?? null);
  }

  const parsed = parseBody(body);
  if (!parsed) {
    return Response.json(
      { error: "Проверьте сообщение: оно пустое или слишком длинное." },
      { status: 400 },
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const content = await completeDeepSeek(
      apiKey,
      buildChatMessages(parsed),
      { temperature: 0.7, maxTokens: 2048, signal: controller.signal },
    );

    if (!content) {
      return Response.json(
        { error: "Emma не вернула ответ. Попробуйте отправить сообщение ещё раз." },
        { status: 502 },
      );
    }

    return Response.json({ reply: content.slice(0, MAX_MESSAGE_LENGTH) });
  } catch (error) {
    return aiErrorResponse(error, controller.signal.aborted, "chat");
  } finally {
    clearTimeout(timeout);
  }
}
