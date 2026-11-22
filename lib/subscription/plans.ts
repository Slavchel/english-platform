export type SubscriptionTier = "FREE" | "PRO" | "NEURO_TUTOR";

export const PRO_PRICE_RUB = 199;

export const PLAN_LIMITS: Record<
  SubscriptionTier,
  { aiAnalysesPerDay: number; speakingDialogsPerDay: number; lessons: number }
> = {
  FREE: { aiAnalysesPerDay: 1, speakingDialogsPerDay: 1, lessons: 1 },
  PRO: { aiAnalysesPerDay: 5, speakingDialogsPerDay: 3, lessons: Infinity },
  NEURO_TUTOR: {
    aiAnalysesPerDay: Infinity,
    speakingDialogsPerDay: Infinity,
    lessons: Infinity,
  },
};

export function normalizeTier(value: string | null | undefined): SubscriptionTier {
  if (value === "PRO" || value === "NEURO_TUTOR") return value;
  return "FREE";
}

export function isPaidTier(tier: SubscriptionTier): boolean {
  return tier === "PRO" || tier === "NEURO_TUTOR";
}

export function planTitle(tier: SubscriptionTier): string {
  if (tier === "PRO") return "Pro";
  if (tier === "NEURO_TUTOR") return "Neuro-Tutor";
  return "Free";
}

export function dailyKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function isSameUtcDay(a: Date | null, b: Date = new Date()): boolean {
  return Boolean(a) && dailyKey(a as Date) === dailyKey(b);
}
