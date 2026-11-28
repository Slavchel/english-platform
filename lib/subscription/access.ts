import { prisma } from "@/lib/prisma";

import {
  PLAN_LIMITS,
  TEMPORARY_FREE_ACCESS,
  effectiveTierFor,
  hasFullContentAccess,
  isLegacyAccess,
  normalizeTier,
  type SubscriptionTier,
} from "./plans";

export interface AccessSnapshot {
  authenticated: boolean;
  tier: SubscriptionTier;
  baseTier: SubscriptionTier;
  legacyAccess: boolean;
  fullContentAccess: boolean;
  limits: {
    aiAnalysesPerDay: number;
    speakingDialogsPerDay: number;
    lessons: number;
  };
}

const ANONYMOUS_ACCESS: AccessSnapshot = {
  authenticated: false,
  tier: "FREE",
  baseTier: "FREE",
  legacyAccess: false,
  fullContentAccess: false,
  limits: PLAN_LIMITS.FREE,
};

/**
 * Central entitlement resolver for all content and feature checks.
 * `TEMPORARY_FREE_ACCESS` controls the launch mode; when it is disabled,
 * legacy users keep content access forever and new users follow their tier.
 */
export async function getAccessByEmail(
  email: string | null | undefined,
  isAdmin = false,
): Promise<AccessSnapshot> {
  if (!email) return { ...ANONYMOUS_ACCESS };

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      createdAt: true,
      subscriptionTier: true,
    },
  });

  if (!user) return { ...ANONYMOUS_ACCESS };

  const baseTier = normalizeTier(user.subscriptionTier);
  const tier = effectiveTierFor(baseTier);
  const legacyAccess = isLegacyAccess(user.createdAt);

  return {
    authenticated: true,
    tier,
    baseTier,
    legacyAccess,
    fullContentAccess: hasFullContentAccess({
      tier: baseTier,
      legacyAccess,
      isAdmin,
    }),
    limits: PLAN_LIMITS[tier],
  };
}

export function isTemporaryFreeAccess(): boolean {
  return TEMPORARY_FREE_ACCESS;
}
