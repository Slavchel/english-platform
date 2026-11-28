import { prisma } from "@/lib/prisma";
import {
  addConsentRetentionYears,
  PERSONAL_DATA_VERSION,
  PRIVACY_POLICY_VERSION,
} from "./constants";
import { clearConsentIntent, readConsentIntent, type ConsentStamp } from "./cookie";
import { buildSubjectRef } from "./subject-ref";

type ConsentEntry = {
  type: "PRIVACY_POLICY" | "PERSONAL_DATA";
  stamp: ConsentStamp;
};

export async function commitPendingConsents(
  userId: string,
  email: string,
): Promise<void> {
  const intent = await readConsentIntent();
  if (!intent) return;

  if (
    intent.privacy.version !== PRIVACY_POLICY_VERSION ||
    intent.personalData.version !== PERSONAL_DATA_VERSION
  ) {
    await clearConsentIntent();
    return;
  }

  const entries: ConsentEntry[] = [
    { type: "PRIVACY_POLICY", stamp: intent.privacy },
    { type: "PERSONAL_DATA", stamp: intent.personalData },
  ];

  const reference = buildSubjectRef(email);

  await prisma.$transaction(async (tx) => {
    for (const entry of entries) {
      const latest = await tx.userConsent.findFirst({
        where: { userId, type: entry.type },
        orderBy: { occurredAt: "desc" },
      });

      if (
        latest?.action === "GRANTED" &&
        latest.documentVersion === entry.stamp.version
      ) {
        continue;
      }

      const occurredAt = new Date(entry.stamp.acceptedAt);

      await tx.userConsent.create({
        data: {
          userId,
          type: entry.type,
          documentVersion: entry.stamp.version,
          action: "GRANTED",
          occurredAt,
          retainUntil: addConsentRetentionYears(occurredAt),
          userAgent: intent.userAgent.slice(0, 255),
          subjectRef: reference,
          // IP is intentionally not stored unless a documented need exists.
          ipAddress: null,
        },
      });
    }
  });

  await clearConsentIntent();
}
