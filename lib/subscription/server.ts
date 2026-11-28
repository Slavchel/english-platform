import { prisma } from "@/lib/prisma";
import { getAccessByEmail } from "./access";
import {
  PLAN_LIMITS,
  effectiveTierFor,
  isLegacyAccess,
  isSameUtcDay,
  normalizeTier,
  type SubscriptionTier,
} from "./plans";

export interface SubscriptionSnapshot {
  id: string;
  tier: SubscriptionTier;
  speakingDialogsUsed: number;
  aiAnalysesUsed: number;
  lastSpeakingDate: Date | null;
  lastAiAnalysisDate: Date | null;
  freeLessonTopic: string | null;
  aiAnalysisRetryAfter: Date | null;
  legacyAccess: boolean;
}

export interface DailyAllowance {
  allowed: boolean;
  tier: SubscriptionTier;
  used: number;
  limit: number;
  retryAfter: number;
  message: string;
}

export async function getSubscriptionByEmail(
  email: string | null | undefined,
): Promise<SubscriptionSnapshot | null> {
  if (!email) return null;
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      createdAt: true,
      subscriptionTier: true,
      speakingDialogsUsed: true,
      aiAnalysesUsed: true,
      lastSpeakingDate: true,
      lastAiAnalysisDate: true,
      freeLessonTopic: true,
      aiAnalysisRetryAfter: true,
    },
  });
  if (!user) return null;
  return {
    id: user.id,
    tier: effectiveTierFor(normalizeTier(user.subscriptionTier)),
    speakingDialogsUsed: user.speakingDialogsUsed,
    aiAnalysesUsed: user.aiAnalysesUsed,
    lastSpeakingDate: user.lastSpeakingDate,
    lastAiAnalysisDate: user.lastAiAnalysisDate,
    freeLessonTopic: user.freeLessonTopic,
    aiAnalysisRetryAfter: user.aiAnalysisRetryAfter,
    legacyAccess: isLegacyAccess(user.createdAt),
  };
}

export async function checkAiAnalysisAllowance(
  email: string | null,
  isAdmin: boolean,
): Promise<DailyAllowance> {
  const user = await getSubscriptionByEmail(email);
  if (!user) {
    return {
      allowed: false,
      tier: "FREE",
      used: 0,
      limit: 1,
      retryAfter: 60,
      message: "Войдите, чтобы использовать AI-анализ.",
    };
  }

  if (isAdmin) {
    return {
      allowed: true,
      tier: user.tier,
      used: 0,
      limit: Infinity,
      retryAfter: 0,
      message: "",
    };
  }

  if (
    user.aiAnalysisRetryAfter &&
    user.aiAnalysisRetryAfter.getTime() > Date.now()
  ) {
    return {
      allowed: false,
      tier: user.tier,
      used: user.aiAnalysesUsed,
      limit: PLAN_LIMITS[user.tier].aiAnalysesPerDay,
      retryAfter: Math.ceil(
        (user.aiAnalysisRetryAfter.getTime() - Date.now()) / 1000,
      ),
      message: "Повторная попытка будет доступна позже.",
    };
  }

  const limit = PLAN_LIMITS[user.tier].aiAnalysesPerDay;
  const used = isSameUtcDay(user.lastAiAnalysisDate)
    ? user.aiAnalysesUsed
    : 0;

  if (Number.isFinite(limit) && used >= limit) {
    return {
      allowed: false,
      tier: user.tier,
      used,
      limit,
      retryAfter: 24 * 60 * 60,
      message:
        user.tier === "PRO"
          ? "Дневной лимит AI-разборов исчерпан"
          : "Лимит AI-анализов на сегодня исчерпан. Следующий разбор будет доступен завтра.",
    };
  }

  return {
    allowed: true,
    tier: user.tier,
    used,
    limit,
    retryAfter: 0,
    message: "",
  };
}

export async function recordAiAnalysis(email: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      aiAnalysesUsed: true,
      lastAiAnalysisDate: true,
    },
  });
  if (!user) return;

  const used = isSameUtcDay(user.lastAiAnalysisDate)
    ? user.aiAnalysesUsed + 1
    : 1;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      aiAnalysesUsed: used,
      lastAiAnalysisDate: new Date(),
      aiAnalysisRetryAfter: null,
    },
  });
}

export async function markAiAnalysisFailed(email: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) return;
  await prisma.user.update({
    where: { id: user.id },
    data: {
      aiAnalysisRetryAfter: new Date(Date.now() + 10 * 60 * 1000),
    },
  });
}

export async function refundSpeakingUsage(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { speakingDialogsUsed: true, lastSpeakingDate: true },
  });
  if (!user) return;
  if (!isSameUtcDay(user.lastSpeakingDate)) return;
  if (user.speakingDialogsUsed <= 0) return;

  await prisma.user.update({
    where: { id: userId },
    data: { speakingDialogsUsed: user.speakingDialogsUsed - 1 },
  });
}

export async function chargeSuccessfulSpeakingRetry(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { speakingDialogsUsed: true, lastSpeakingDate: true },
  });
  if (!user) return;
  const used = isSameUtcDay(user.lastSpeakingDate)
    ? user.speakingDialogsUsed
    : 0;
  await prisma.user.update({
    where: { id: userId },
    data: {
      speakingDialogsUsed: used + 1,
      lastSpeakingDate: new Date(),
    },
  });
}

export async function consumeSpeakingDialog(
  email: string | null,
  isAdmin: boolean,
): Promise<DailyAllowance> {
  const user = await getSubscriptionByEmail(email);
  if (!user) {
    return {
      allowed: false,
      tier: "FREE",
      used: 0,
      limit: 1,
      retryAfter: 60,
      message: "Войдите, чтобы начать Speaking-диалог.",
    };
  }

  if (isAdmin) {
    return {
      allowed: true,
      tier: user.tier,
      used: 0,
      limit: Infinity,
      retryAfter: 0,
      message: "",
    };
  }

  const limit = PLAN_LIMITS[user.tier].speakingDialogsPerDay;
  const used = isSameUtcDay(user.lastSpeakingDate)
    ? user.speakingDialogsUsed
    : 0;

  if (Number.isFinite(limit) && used >= limit) {
    return {
      allowed: false,
      tier: user.tier,
      used,
      limit,
      retryAfter: 24 * 60 * 60,
      message:
        user.tier === "PRO"
          ? "Дневной лимит Speaking исчерпан. Следующий диалог будет доступен завтра."
          : "Лимит Speaking-диалогов на сегодня исчерпан. Следующий диалог будет доступен завтра.",
    };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      speakingDialogsUsed: used + 1,
      lastSpeakingDate: new Date(),
    },
  });

  return {
    allowed: true,
    tier: user.tier,
    used: used + 1,
    limit,
    retryAfter: 0,
    message: "",
  };
}

export async function canOpenLesson(
  email: string | null,
  topic: string,
  isAdmin: boolean,
): Promise<{
  allowed: boolean;
  freeLessonTopic: string | null;
  tier: SubscriptionTier;
}> {
  const access = await getAccessByEmail(email, isAdmin);
  if (!access.authenticated) {
    return { allowed: false, freeLessonTopic: null, tier: "FREE" };
  }

  const user = await getSubscriptionByEmail(email);
  if (!user) {
    return { allowed: false, freeLessonTopic: null, tier: "FREE" };
  }

  if (access.fullContentAccess) {
    return {
      allowed: true,
      freeLessonTopic: user.freeLessonTopic,
      tier: access.tier,
    };
  }

  // Future monetization fallback: Free users may open one library lesson.
  if (!user.freeLessonTopic) {
    await prisma.user.update({
      where: { id: user.id },
      data: { freeLessonTopic: topic },
    });
    return { allowed: true, freeLessonTopic: topic, tier: access.tier };
  }

  return {
    allowed: user.freeLessonTopic === topic,
    freeLessonTopic: user.freeLessonTopic,
    tier: access.tier,
  };
}
