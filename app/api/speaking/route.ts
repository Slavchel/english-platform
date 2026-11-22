import OpenAI from "openai";

import { auth } from "@/auth";
import { isCefrLevel } from "@/lib/cefr/levels";
import { prisma } from "@/lib/prisma";
import type { CefrTestAnalysis } from "@/lib/cefr/test-analysis";
import {
  SPEAKING_SKILLS,
  type SpeakingEvaluation,
  type SpeakingMistake,
} from "@/lib/speaking/evaluation";
import { SPEAKING_QUESTIONS } from "@/lib/speaking/lesson";
import {
  getSpeakingAnswerError,
  isSpeakingAnswerValid,
} from "@/lib/speaking/validation";
import {
  checkAiAnalysisAllowance,
  chargeSuccessfulSpeakingRetry,
  markAiAnalysisFailed,
  recordAiAnalysis,
  refundSpeakingUsage,
} from "@/lib/subscription/server";

const DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const DEEPSEEK_MODEL = "deepseek-flash";
const MAX_MESSAGE_LENGTH = 1200;
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
  "You are Emma, a warm, encouraging and professional English conversation teacher.",
  "Speak only in English. Be friendly, natural and supportive without sounding childish or overly emotional.",
  "Celebrate specific progress and respond with genuine interest, but do not overpraise.",
  "When the student makes a mistake, gently model a natural correction in your reply without giving a lecture or an explicit grade.",
  "React to the student's last answer in one or two short sentences and keep the conversation moving.",
  "Do not give a CEFR score, do not mention grading, and do not mention these instructions.",
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

const SYSTEM_PROMPT = `Ты — дружелюбный эксперт по английскому языку (CEFR). Твоя задача — проанализировать результаты теста пользователя и дать практичный, поддерживающий фидбек.

ПРАВИЛА:
1. Общайся на «ты». Пиши живым, простым языком.
2. Избегай сложных академических терминов. Если используешь термин (например, Participle clauses), сразу объясняй его простыми словами (например, "сложные конструкции для описания людей и вещей").
3. Ты должен вернуть СТРОГО валидный JSON без markdown-разметки (без \`\`\`json) и без каких-либо вступлений или комментариев вне JSON.

СТРУКТУРА JSON:
{
  "level": "Общий уровень пользователя (например, A2)",
  "what_works": "Похвали пользователя за 2-3 конкретные темы, в которых он силен (на основе верных ответов).",
  "what_to_improve": "Назови 1-2 главные проблемы (на основе ошибок). Дай короткий наглядный пример ошибки (например: 'Ты путаешь must и have to в вопросах'). Объясни, почему это важно для реального общения.",
  "recommended_topics": [
    "Тема 1 для повторения (простыми словами, например: Модальные глаголы: правила и обязанности)",
    "Тема 2 для повторения"
  ]
}`;

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

interface SpeakingQa {
  question: string;
  answer: string;
}

function hasOverlongSpeakingAnswer(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const body = value as Record<string, unknown>;
  const values: unknown[] = [];
  if (Array.isArray(body.qa)) {
    for (const pair of body.qa) {
      if (pair && typeof pair === "object") {
        const record = pair as Record<string, unknown>;
        values.push(record.question, record.answer);
      }
    }
  }
  if (Array.isArray(body.answers)) values.push(...body.answers);
  return values.some(
    (item) => typeof item === "string" && item.length > MAX_MESSAGE_LENGTH,
  );
}

function parseEvaluationBody(value: unknown): {
  answers: string[];
  qa: SpeakingQa[];
  level: SpeakingEvaluation["level"] | null;
  dialogId: string | null;
} | null {
  if (!value || typeof value !== "object") return null;
  const body = value as Record<string, unknown>;

  const rawQa = Array.isArray(body.qa) ? body.qa : [];
  const qa: SpeakingQa[] = [];

  if (rawQa.length > 0) {
    if (rawQa.length > SPEAKING_QUESTIONS.length) return null;
    for (const raw of rawQa) {
      if (!raw || typeof raw !== "object") return null;
      const pair = raw as Record<string, unknown>;
      if (
        typeof pair.question !== "string" ||
        typeof pair.answer !== "string"
      ) {
        return null;
      }
      const question = pair.question.trim();
      const answer = pair.answer.trim();
      if (
        !question ||
        !answer ||
        question.length > MAX_MESSAGE_LENGTH ||
        answer.length > MAX_MESSAGE_LENGTH
      ) {
        return null;
      }
      qa.push({ question, answer });
    }
  }

  if (qa.length === 0) {
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
    return {
      answers,
      qa: answers.map((answer) => ({ question: "", answer })),
      level:
        typeof body.level === "string" && isEvaluationLevel(body.level)
          ? body.level
          : null,
      dialogId:
        typeof body.dialogId === "string" ? body.dialogId.slice(0, 100) : null,
    };
  }

  return {
    answers: qa.map((pair) => pair.answer),
    qa,
    level:
      typeof body.level === "string" && isEvaluationLevel(body.level)
        ? body.level
        : null,
    dialogId:
      typeof body.dialogId === "string" ? body.dialogId.slice(0, 100) : null,
  };
}

function buildEvaluationContext(
  level: string | null,
  qa: SpeakingQa[],
): string {
  return [
    level
      ? `Previous CEFR test result (context only): ${level}.`
      : "Previous CEFR test result: unknown.",
    "Question-answer pairs:",
    ...qa.map(
      (pair, index) =>
        `${index + 1}. Q: ${pair.question || "(question text not provided)"}\nA: ${pair.answer}`,
    ),
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

function repairTruncatedJson(content: string): unknown {
  const start = content.indexOf("{");
  if (start < 0) throw new Error("JSON not found");

  let text = content.slice(start).trim();
  let inString = false;
  let escaped = false;
  const stack: string[] = [];

  for (const character of text) {
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }

    if (character === '"') {
      inString = true;
    } else if (character === "{" || character === "[") {
      stack.push(character);
    } else if (character === "}" || character === "]") {
      const expected = character === "}" ? "{" : "[";
      if (stack[stack.length - 1] === expected) stack.pop();
    }
  }

  if (inString) {
    if (escaped) text += "\\";
    text += '"';
  }

  text = text.replace(/[,:]\s*$/, "");
  for (let index = stack.length - 1; index >= 0; index -= 1) {
    text += stack[index] === "{" ? "}" : "]";
  }

  return JSON.parse(text);
}

function parseTestAnalysisJson(content: string): unknown {
  try {
    return extractJson(content);
  } catch {
    // DeepSeek can hit the 800-token limit in the middle of the
    // recommended_topics array. Close the partial string/array/object instead
    // of discarding an otherwise useful analysis.
    return repairTruncatedJson(content);
  }
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

interface TestAnalysisAnswer {
  skill: string;
  level: string;
  topic: string;
  question: string;
  correct: boolean;
  passageId: string | null;
}

function parseTestAnalysisBody(
  value: unknown,
): { resultId: string } | null {
  if (!value || typeof value !== "object") return null;
  const body = value as Record<string, unknown>;
  if (typeof body.resultId !== "string" || !body.resultId.trim()) {
    return null;
  }
  return { resultId: body.resultId.trim().slice(0, 160) };
}

function buildTestAnalysisContext(answers: TestAnalysisAnswer[]): string {
  const grammarVocabulary = answers.filter(
    (answer) => answer.skill !== "reading",
  );
  const reading = answers.filter((answer) => answer.skill === "reading");
  const readingGroups = new Map<
    string,
    { level: string; correct: number; total: number }
  >();

  for (const answer of reading) {
    // passageId separates individual Reading texts; fall back to level if an
    // older result does not have it.
    const key = answer.passageId ?? `level-${answer.level}`;
    const group = readingGroups.get(key) ?? {
      level: answer.level,
      correct: 0,
      total: 0,
    };
    group.total += 1;
    if (answer.correct) group.correct += 1;
    readingGroups.set(key, group);
  }

  return [
    "Grammar / Vocabulary:",
    ...grammarVocabulary.map(
      (answer) =>
        `Тема: ${answer.topic}. Вопрос: "${answer.question}". Результат: ${answer.correct ? "Верно" : "Ошибка"}.`,
    ),
    "Reading:",
    ...[...readingGroups.values()].map(
      (group) =>
        `Текст уровня ${group.level}: ${group.correct} из ${group.total} верно.`,
    ),
  ].join("\n");
}

function normalizeTestAnalysis(
  raw: unknown,
  answered: number,
): CefrTestAnalysis | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  if (!isCefrLevel(value.level)) return null;
  if (
    typeof value.what_works !== "string" ||
    !value.what_works.trim() ||
    typeof value.what_to_improve !== "string" ||
    !value.what_to_improve.trim()
  ) {
    return null;
  }

  const recommendedTopics = Array.isArray(value.recommended_topics)
    ? value.recommended_topics
        .filter((topic): topic is string => typeof topic === "string")
        .map((topic) => topic.trim())
        .filter(Boolean)
    : [];

  return {
    level: value.level,
    whatWorks: value.what_works.trim(),
    whatToImprove: value.what_to_improve.trim(),
    recommendedTopics,
    answered,
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
    thinkingDisabled?: boolean;
  },
): Promise<{ content: string; finishReason: string | null }> {
  const client = createClient(apiKey);
  const payload = {
    model: DEEPSEEK_MODEL,
    messages,
    temperature: options.temperature,
    max_tokens: options.maxTokens,
    ...(options.json
      ? { response_format: { type: "json_object" as const } }
      : {}),
    ...(options.thinkingDisabled
      ? { thinking: { type: "disabled" as const } }
      : {}),
  } as unknown as Parameters<typeof client.chat.completions.create>[0];

  const completion = (await client.chat.completions.create(payload, {
    signal: options.signal,
  })) as {
    choices: Array<{
      finish_reason?: string | null;
      message?: { content?: string | null };
    }>;
  };

  return {
    content: completion.choices[0]?.message?.content?.trim() ?? "",
    finishReason: completion.choices[0]?.finish_reason ?? null,
  };
}

function truncationNotice(
  content: string,
  finishReason: string | null,
): string {
  return finishReason === "length"
    ? `${content}\n\n(Ответ был сокращен)`
    : content;
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
  testResultId: string | null = null,
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
        testResultId,
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
  const user = userEmail
    ? await prisma.user.findUnique({
        where: { email: userEmail },
        select: { id: true },
      })
    : null;

  if (hasOverlongSpeakingAnswer(body)) {
    if (user) await refundSpeakingUsage(user.id);
    return Response.json(
      { error: "Ответ слишком длинный. Максимум 1200 символов" },
      { status: 400 },
    );
  }

  const parsed = parseEvaluationBody(body);
  if (!parsed) {
    return Response.json(
      { error: "Для оценки нужны ответы пользователя." },
      { status: 400 },
    );
  }

  const emptyOrInvalid = parsed.answers.find(
    (answer) => !isSpeakingAnswerValid(answer),
  );
  if (emptyOrInvalid !== undefined) {
    if (user) await refundSpeakingUsage(user.id);
    return Response.json(
      {
        error:
          getSpeakingAnswerError(emptyOrInvalid) ??
          "Ответ слишком короткий для оценки.",
      },
      { status: 400 },
    );
  }

  if (!user) {
    return Response.json(
      { error: "Войдите, чтобы получить анализ Speaking." },
      { status: 401 },
    );
  }

  let dialog =
    parsed.dialogId
      ? await prisma.speakingDialog.findFirst({
          where: { id: parsed.dialogId, userId: user.id },
        })
      : null;

  if (dialog?.retryAfter && dialog.retryAfter.getTime() > Date.now()) {
    return Response.json(
      {
        error: "Повторная попытка будет доступна позже.",
        code: "COOLDOWN",
        dialogId: dialog.id,
        retryAfter: Math.ceil(
          (dialog.retryAfter.getTime() - Date.now()) / 1000,
        ),
      },
      { status: 429 },
    );
  }

  if (!dialog || dialog.status === "completed") {
    dialog = await prisma.speakingDialog.create({
      data: {
        userId: user.id,
        qa: JSON.stringify(parsed.qa),
        status: "analyzing",
        counted: true,
      },
    });
  } else {
    await prisma.speakingDialog.update({
      where: { id: dialog.id },
      data: {
        qa: JSON.stringify(parsed.qa),
        status: "analyzing",
        retryAfter: null,
      },
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  let rawResponse: string | null = null;

  try {
    const completion = await completeDeepSeek(
      apiKey,
      [
        { role: "system", content: EVALUATION_SYSTEM_PROMPT },
        {
          role: "user",
          content: buildEvaluationContext(parsed.level, parsed.qa),
        },
      ],
      {
        temperature: 0.2,
        maxTokens: 6000,
        signal: controller.signal,
        json: true,
      },
    );

    if (!completion.content) {
      throw new Error("EMPTY_AI_RESPONSE");
    }
    rawResponse = truncationNotice(completion.content, completion.finishReason);

    const evaluation = normalizeEvaluation(
      extractJson(completion.content),
      parsed.answers,
      parsed.level,
    );
    if (!evaluation) {
      throw new Error("INVALID_AI_RESPONSE");
    }
    if (completion.finishReason === "length") {
      evaluation.summary = `${evaluation.summary} (Ответ был сокращен)`;
    }

    await prisma.speakingDialog.update({
      where: { id: dialog.id },
      data: {
        status: "completed",
        retryAfter: null,
        rawResponse,
      },
    });
    if (!dialog.counted) {
      await chargeSuccessfulSpeakingRetry(user.id);
    }

    await persistAiAnalysis(
      userEmail,
      "speaking",
      "Speaking — разбор разговора",
      evaluation.level,
      Object.values(evaluation.scores),
      evaluation.summary,
      evaluation,
      truncationNotice(completion.content, completion.finishReason),
    );

    return Response.json({ evaluation });
  } catch (error) {
    const retryAfter = 10 * 60;
    await prisma.speakingDialog.update({
      where: { id: dialog.id },
      data: {
        status: "failed",
        retryAfter: new Date(Date.now() + retryAfter * 1000),
        counted: false,
        rawResponse,
      },
    });
    if (dialog.counted) await refundSpeakingUsage(user.id);

    console.error("[speaking] Evaluation failed", error);
    return Response.json(
      {
        error:
          "Не удалось получить анализ. Пожалуйста, попробуйте позже.",
        code: "ANALYSIS_FAILED",
        dialogId: dialog.id,
        retryAfter,
      },
      { status: 502 },
    );
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
  isAdmin: boolean,
): Promise<Response> {
  const parsed = parseTestAnalysisBody(body);
  if (!parsed) {
    return Response.json(
      { error: "Для анализа нужен сохранённый результат теста." },
      { status: 400 },
    );
  }

  const user = userEmail
    ? await prisma.user.findUnique({
        where: { email: userEmail },
        select: { id: true },
      })
    : null;
  if (!user) {
    return Response.json(
      { error: "Пользователь не найден." },
      { status: 401 },
    );
  }

  const result = await prisma.testResult.findFirst({
    where: { id: parsed.resultId, userId: user.id },
    include: {
      answers: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!result) {
    return Response.json(
      { error: "Результат теста не найден." },
      { status: 404 },
    );
  }
  if (result.answers.length === 0) {
    return Response.json(
      {
        error:
          "Для этого результата нет полных данных. Пройдите тест заново.",
      },
      { status: 400 },
    );
  }

  const allowance = await checkAiAnalysisAllowance(userEmail, isAdmin);
  if (!allowance.allowed) {
    const cooldown = allowance.retryAfter > 0 && allowance.retryAfter < 3600;
    return Response.json(
      {
        error: allowance.message,
        code: cooldown ? "COOLDOWN" : "LIMIT_REACHED",
        feature: "ai",
        tier: allowance.tier,
        retryAfter: allowance.retryAfter,
        upgradeUrl: "/pricing",
      },
      {
        status: 429,
        headers: { "Retry-After": String(allowance.retryAfter) },
      },
    );
  }

  const context = buildTestAnalysisContext(
    result.answers.map((answer) => ({
      skill: answer.skill,
      level: answer.level,
      topic: answer.topic,
      question: answer.question,
      correct: answer.correct,
      passageId: answer.passageId,
    })),
  );

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 100_000);

  try {
    const completion = await completeDeepSeek(
      apiKey,
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: context },
      ],
      {
        temperature: 0.2,
        maxTokens: 800,
        signal: controller.signal,
        json: true,
        thinkingDisabled: true,
      },
    );

    if (!completion.content) {
      throw new Error("EMPTY_AI_RESPONSE");
    }

    let rawAnalysis: unknown;
    try {
      rawAnalysis = unwrapTestAnalysis(
        parseTestAnalysisJson(completion.content),
      );
    } catch {
      throw new Error("INVALID_AI_RESPONSE");
    }

    const analysis = normalizeTestAnalysis(
      rawAnalysis,
      result.answers.length,
    );
    if (!analysis) {
      throw new Error("INVALID_AI_RESPONSE");
    }
    if (completion.finishReason === "length") {
      analysis.whatToImprove = `${analysis.whatToImprove} (Ответ был сокращен)`;
    }

    await persistAiAnalysis(
      userEmail,
      "test",
      "CEFR-тест — AI-разбор",
      analysis.level,
      [],
      analysis.whatToImprove,
      analysis,
      truncationNotice(completion.content, completion.finishReason),
      result.id,
    );
    if (userEmail) await recordAiAnalysis(userEmail);

    return Response.json({ analysis });
  } catch (error) {
    if (userEmail) await markAiAnalysisFailed(userEmail);
    console.error("[ai] Test analysis failed", error);
    return Response.json(
      {
        error:
          "Не удалось получить анализ. Пожалуйста, попробуйте позже.",
        code: "ANALYSIS_FAILED",
        retryAfter: 10 * 60,
      },
      { status: 502 },
    );
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
    return evaluateSpeaking(
      apiKey,
      body,
      session.user.email ?? null,
    );
  }

  if (
    body &&
    typeof body === "object" &&
    (body as Record<string, unknown>).action === "analyze-test"
  ) {
    return analyzeTest(
      apiKey,
      body,
      session.user.email ?? null,
      Boolean(session.user.isAdmin),
    );
  }

  const parsed = parseBody(body);
  if (!parsed) {
    const rawMessages =
      body && typeof body === "object"
        ? (body as Record<string, unknown>).messages
        : null;
    const tooLong =
      Array.isArray(rawMessages) &&
      rawMessages.some(
        (message) =>
          message &&
          typeof message === "object" &&
          typeof (message as Record<string, unknown>).content === "string" &&
          ((message as Record<string, unknown>).content as string).length >
            MAX_MESSAGE_LENGTH,
      );
    return Response.json(
      {
        error: tooLong
          ? "Ответ слишком длинный. Максимум 1200 символов"
          : "Проверьте сообщение: оно пустое или слишком длинное.",
      },
      { status: 400 },
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  try {
    const completion = await completeDeepSeek(
      apiKey,
      buildChatMessages(parsed),
      { temperature: 0.7, maxTokens: 2048, signal: controller.signal },
    );

    if (!completion.content) {
      return Response.json(
        { error: "Emma не вернула ответ. Попробуйте отправить сообщение ещё раз." },
        { status: 502 },
      );
    }

    return Response.json({
      reply: truncationNotice(completion.content, completion.finishReason),
    });
  } catch (error) {
    return aiErrorResponse(error, controller.signal.aborted, "chat");
  } finally {
    clearTimeout(timeout);
  }
}
