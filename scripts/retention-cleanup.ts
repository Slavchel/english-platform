import { prisma } from "../lib/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * DAY_MS);
}

function oneYearAgo(): Date {
  const date = new Date();
  date.setUTCFullYear(date.getUTCFullYear() - 1);
  return date;
}

async function activeHoldUserIds(userIds: string[]): Promise<Set<string>> {
  if (userIds.length === 0) return new Set();

  const now = new Date();
  const holds = await prisma.retentionHold.findMany({
    where: {
      userId: { in: userIds },
      releasedAt: null,
      OR: [{ endsAt: null }, { endsAt: { gt: now } }],
    },
    select: { userId: true },
  });

  return new Set(
    holds
      .map((hold) => hold.userId)
      .filter((id): id is string => Boolean(id)),
  );
}

async function main(): Promise<void> {
  const now = new Date();

  const tokens = await prisma.verificationToken.deleteMany({
    where: { expires: { lt: daysAgo(1) } },
  });

  const sessions = await prisma.session.deleteMany({
    where: { expires: { lt: daysAgo(1) } },
  });

  const expiredAccessTokens = await prisma.account.updateMany({
    where: {
      expires_at: { lt: Math.floor(daysAgo(7).getTime() / 1000) },
      access_token: { not: null },
    },
    data: { access_token: null },
  });

  const expiredAiUsage = await prisma.aiUsage.findMany({
    where: { createdAt: { lt: oneYearAgo() } },
    select: { id: true, userId: true },
  });
  const heldAiUsageUsers = await activeHoldUserIds(
    [...new Set(expiredAiUsage.map((row) => row.userId))],
  );
  const aiUsageToDelete = expiredAiUsage.filter(
    (row) => !heldAiUsageUsers.has(row.userId),
  );
  const aiUsage = await prisma.aiUsage.deleteMany({
    where: { id: { in: aiUsageToDelete.map((row) => row.id) } },
  });

  const expiredConsents = await prisma.userConsent.findMany({
    where: { retainUntil: { lte: now } },
    select: { id: true, userId: true },
  });
  const heldConsentUsers = await activeHoldUserIds(
    [...new Set(
      expiredConsents
        .map((row) => row.userId)
        .filter((id): id is string => Boolean(id)),
    )],
  );
  const consentsToDelete = expiredConsents.filter(
    (row) => !row.userId || !heldConsentUsers.has(row.userId),
  );
  const consents = await prisma.userConsent.deleteMany({
    where: { id: { in: consentsToDelete.map((row) => row.id) } },
  });

  console.log(
    [
      "[retention] completed",
      `verification_tokens=${tokens.count}`,
      `sessions=${sessions.count}`,
      `expired_oauth_access_tokens=${expiredAccessTokens.count}`,
      `ai_usage=${aiUsage.count}`,
      `consents=${consents.count}`,
      `held_ai_usage_skipped=${expiredAiUsage.length - aiUsageToDelete.length}`,
      `held_consents_skipped=${expiredConsents.length - consentsToDelete.length}`,
    ].join(" "),
  );
}

main()
  .catch((error) => {
    console.error(
      "[retention] failed",
      error instanceof Error ? error.message : "unknown error",
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
