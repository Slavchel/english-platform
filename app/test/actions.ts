"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { isCefrLevel } from "@/lib/cefr/levels";
import { prisma } from "@/lib/prisma";

interface MistakeInput {
  topic: string;
  skill: string;
  question: string;
  correctAnswer: string;
  selectedAnswer: string;
  explanation: string | null;
  passageId: string | null;
}

interface AnswerInput {
  skill: string;
  level: string;
  topic: string;
  question: string;
  correct: boolean;
  selectedAnswer: string;
  correctAnswer: string;
  passageId: string | null;
}

interface ResultInput {
  level: string | null;
  status: string;
  confidence: string;
  score: number;
  correct: number;
  answered: number;
  total: number;
  completed: boolean;
  seed: number;
  algorithmVersion: string;
  mistakes: MistakeInput[];
  answers: AnswerInput[];
}

function cleanString(value: unknown, max = 4000): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function parseInput(value: unknown): ResultInput | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;

  const level =
    typeof input.level === "string" && isCefrLevel(input.level)
      ? input.level
      : null;
  const score = Number(input.score);
  const correct = Number(input.correct);
  const answered = Number(input.answered);
  const total = Number(input.total);
  const seed = Number(input.seed);

  if (
    !Number.isInteger(score) ||
    score < 0 ||
    score > 100 ||
    !Number.isInteger(correct) ||
    correct < 0 ||
    !Number.isInteger(answered) ||
    answered < 0 ||
    !Number.isInteger(total) ||
    total <= 0 ||
    !Number.isInteger(seed) ||
    typeof input.completed !== "boolean"
  ) {
    return null;
  }

  const rawMistakes = Array.isArray(input.mistakes)
    ? input.mistakes.slice(0, 100)
    : [];
  const mistakes: MistakeInput[] = [];

  for (const raw of rawMistakes) {
    if (!raw || typeof raw !== "object") return null;
    const mistake = raw as Record<string, unknown>;
    const topic = cleanString(mistake.topic, 160);
    const skill = cleanString(mistake.skill, 32);
    const question = cleanString(mistake.question, 4000);
    const correctAnswer = cleanString(mistake.correctAnswer, 2000);
    const selectedAnswer = cleanString(mistake.selectedAnswer, 2000);
    const explanation = cleanString(mistake.explanation, 4000) || null;
    const passageId = cleanString(mistake.passageId, 160) || null;

    if (!topic || !skill || !question || !correctAnswer) return null;
    mistakes.push({
      topic,
      skill,
      question,
      correctAnswer,
      selectedAnswer,
      explanation,
      passageId,
    });
  }

  const rawAnswers = Array.isArray(input.answers)
    ? input.answers.slice(0, 100)
    : [];
  const answers: AnswerInput[] = [];

  for (const raw of rawAnswers) {
    if (!raw || typeof raw !== "object") return null;
    const answer = raw as Record<string, unknown>;
    const skill = cleanString(answer.skill, 32);
    const answerLevel = cleanString(answer.level, 16);
    const topic = cleanString(answer.topic, 160);
    const question = cleanString(answer.question, 4000);
    const selectedAnswer = cleanString(answer.selectedAnswer, 2000);
    const correctAnswer = cleanString(answer.correctAnswer, 2000);
    const passageId = cleanString(answer.passageId, 160) || null;

    if (
      !skill ||
      !isCefrLevel(answerLevel) ||
      !topic ||
      !question ||
      !correctAnswer ||
      typeof answer.correct !== "boolean"
    ) {
      return null;
    }

    answers.push({
      skill,
      level: answerLevel,
      topic,
      question,
      correct: answer.correct,
      selectedAnswer,
      correctAnswer,
      passageId,
    });
  }

  return {
    level,
    status: cleanString(input.status, 32) || "insufficient",
    confidence: cleanString(input.confidence, 16) || "low",
    score,
    correct,
    answered,
    total,
    completed: input.completed,
    seed,
    algorithmVersion: cleanString(input.algorithmVersion, 64) || "unknown",
    mistakes,
    answers,
  };
}

export async function saveTestResult(
  value: unknown,
): Promise<{ id: string } | { error: string }> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return { error: "Войдите, чтобы сохранить результат." };
  }

  const input = parseInput(value);
  if (!input) {
    return { error: "Не удалось сохранить результат: некорректные данные." };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) {
    return { error: "Пользователь не найден." };
  }

  try {
    const result = await prisma.testResult.create({
      data: {
        userId: user.id,
        level: input.level,
        status: input.status,
        confidence: input.confidence,
        score: input.score,
        correct: input.correct,
        answered: input.answered,
        total: input.total,
        completed: input.completed,
        seed: BigInt(input.seed),
        algorithmVersion: input.algorithmVersion,
        mistakes: {
          create: input.mistakes,
        },
        answers: {
          create: input.answers,
        },
      },
      select: { id: true },
    });

    revalidatePath("/account");
    return { id: result.id };
  } catch (error) {
    console.error("[test] Failed to save result", error);
    return { error: "Не удалось сохранить результат." };
  }
}
