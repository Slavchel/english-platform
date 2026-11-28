import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { addConsentRetentionYears } from "@/lib/consent/constants";
import { buildSubjectRef } from "@/lib/consent/subject-ref";
import { summarizeUserAgent } from "@/lib/consent/user-agent";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) {
        return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }
  }

  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const latest = await prisma.userConsent.findFirst({
    where: { userId: user.id, type: "PERSONAL_DATA" },
    orderBy: { occurredAt: "desc" },
  });

  if (!latest || latest.action === "REVOKED") {
    return NextResponse.json({ ok: true, revoked: false });
  }

  const occurredAt = new Date();
  const requestHeaders = await headers();

  await prisma.userConsent.create({
    data: {
      userId: user.id,
      type: "PERSONAL_DATA",
      documentVersion: latest.documentVersion,
      action: "REVOKED",
      occurredAt,
      retainUntil: addConsentRetentionYears(occurredAt),
      userAgent: summarizeUserAgent(requestHeaders.get("user-agent")),
      subjectRef: buildSubjectRef(email),
      revokesConsentId: latest.id,
      revocationReason: "Отозвано пользователем в личном кабинете",
      ipAddress: null,
    },
  });

  return NextResponse.json({ ok: true, revoked: true });
}
