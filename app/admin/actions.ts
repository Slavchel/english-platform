"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CefrTestEngine } from "@/lib/cefr/engine";
import { createTrialItemPool } from "@/lib/cefr/bank/trial-bank";
import { saveTestResult } from "@/app/test/actions";

const TEST_LEVELS = ["Pre-A1", "A1", "A2", "B1", "B2", "C1"] as const;

export async function activateProTest(): Promise<void> {
  const session = await auth();
  if (!session?.user?.isAdmin || !session.user.email) {
    redirect("/login");
  }

  await prisma.user.update({
    where: { email: session.user.email },
    data: {
      subscriptionTier: "PRO",
      speakingDialogsUsed: 0,
      aiAnalysesUsed: 0,
      lastSpeakingDate: null,
      lastAiAnalysisDate: null,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/pricing");
  revalidatePath("/account");
  redirect("/admin");
}

export async function runAdminTest(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    redirect("/login");
  }

  const requested = String(formData.get("level") ?? "");
  const level = TEST_LEVELS.includes(requested as (typeof TEST_LEVELS)[number])
    ? (requested as (typeof TEST_LEVELS)[number])
    : TEST_LEVELS[Math.floor(Math.random() * TEST_LEVELS.length)];
  const seed = (Date.now() + Math.floor(Math.random() * 1000)) >>> 0;
  const engine = new CefrTestEngine({
    bank: createTrialItemPool(),
    seed,
    config: { startLevel: level },
  });

  let guard = 0;
  while (engine.currentItem && guard < 100) {
    const item = engine.currentItem;
    const option =
      item.options.find(
        (candidate) => candidate.id === item.correctOptionId,
      ) ?? item.options[0];
    if (!option) break;
    engine.submitAnswer(option.id);
    guard += 1;
  }

  const result = engine.getResult();
  const answers = result.review.map((entry) => {
    const selected = entry.item.options.find(
      (option) => option.id === entry.selectedOptionId,
    );
    const correct = entry.item.options.find(
      (option) => option.id === entry.item.correctOptionId,
    );
    return {
      skill: entry.item.skill,
      level: entry.item.cefrLevel,
      topic: entry.item.topic,
      question: entry.item.stem,
      correct: entry.correct,
      selectedAnswer: selected?.text ?? "",
      correctAnswer: correct?.text ?? "",
      passageId: entry.item.passageId ?? null,
    };
  });
  const mistakes = result.review
    .filter((entry) => !entry.correct)
    .map((entry) => {
      const selected = entry.item.options.find(
        (option) => option.id === entry.selectedOptionId,
      );
      const correct = entry.item.options.find(
        (option) => option.id === entry.item.correctOptionId,
      );
      return {
        topic: entry.item.topic,
        skill: entry.item.skill,
        question: entry.item.stem,
        correctAnswer: correct?.text ?? "",
        selectedAnswer: selected?.text ?? "",
        explanation: entry.item.explanation ?? null,
        passageId: entry.item.passageId ?? null,
      };
    });

  const saved = await saveTestResult({
    level: result.overall.level,
    status: result.overall.status,
    confidence: result.overall.confidence,
    score:
      result.stats.answered > 0
        ? Math.round(
            (result.stats.correct / result.stats.answered) * 100,
          )
        : 0,
    correct: result.stats.correct,
    answered: result.stats.answered,
    total: result.total,
    completed: result.completed,
    seed: result.seed,
    algorithmVersion: result.algorithmVersion,
    mistakes,
    answers,
  });

  if ("id" in saved) {
    redirect(`/account/results/${saved.id}`);
  }

  redirect("/admin");
}
