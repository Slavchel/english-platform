export type SubscriptionTier = "FREE" | "PRO" | "NEURO_TUTOR";

export const PRO_PRICE_RUB = 199;

/**
 * Temporary launch mode: every authenticated user gets the Free tier and
 * full access to educational content. Limits stay on the Free plan.
 * Set to false when paid plans officially launch.
 */
export const TEMPORARY_FREE_ACCESS = true;

/**
 * Users created before this date keep full content access forever as
 * legacy_access. Override with MONETIZATION_LAUNCH_AT when paid plans launch.
 */
const DEFAULT_MONETIZATION_LAUNCH_AT = "2027-01-01T00:00:00.000Z";
const configuredLaunchAt = process.env.MONETIZATION_LAUNCH_AT;
const parsedLaunchAt = Date.parse(
  configuredLaunchAt || DEFAULT_MONETIZATION_LAUNCH_AT,
);

export const MONETIZATION_LAUNCH_AT = new Date(
  Number.isNaN(parsedLaunchAt)
    ? DEFAULT_MONETIZATION_LAUNCH_AT
    : parsedLaunchAt,
);

export function isLegacyAccess(createdAt: Date | null | undefined): boolean {
  return Boolean(createdAt && createdAt < MONETIZATION_LAUNCH_AT);
}

export function effectiveTierFor(
  tier: SubscriptionTier,
): SubscriptionTier {
  return TEMPORARY_FREE_ACCESS ? "FREE" : tier;
}

export function hasFullContentAccess({
  tier,
  legacyAccess,
  isAdmin,
}: {
  tier: SubscriptionTier;
  legacyAccess: boolean;
  isAdmin: boolean;
}): boolean {
  return (
    isAdmin ||
    TEMPORARY_FREE_ACCESS ||
    legacyAccess ||
    isPaidTier(tier)
  );
}

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
