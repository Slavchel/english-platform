import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { consumeSpeakingDialog } from "@/lib/subscription/server";

export async function POST() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Войдите, чтобы начать Speaking-диалог." },
      { status: 401 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (user) {
    const coolingDown = await prisma.speakingDialog.findFirst({
      where: {
        userId: user.id,
        status: "failed",
        retryAfter: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });
    if (coolingDown?.retryAfter) {
      const retryAfter = Math.max(
        1,
        Math.ceil((coolingDown.retryAfter.getTime() - Date.now()) / 1000),
      );
      return NextResponse.json(
        {
          error: "Повторная попытка будет доступна позже.",
          code: "COOLDOWN",
          feature: "speaking",
          retryAfter,
        },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfter) },
        },
      );
    }
  }

  const allowance = await consumeSpeakingDialog(
    session.user.email,
    Boolean(session.user.isAdmin),
  );

  if (!allowance.allowed) {
    return NextResponse.json(
      {
        error: allowance.message,
        code: "LIMIT_REACHED",
        feature: "speaking",
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

  if (user) {
    await prisma.speakingDialog.updateMany({
      where: { userId: user.id, status: "failed" },
      data: { status: "abandoned" },
    });
  }

  return NextResponse.json({
    ok: true,
    used: allowance.used,
    limit: allowance.limit,
    tier: allowance.tier,
  });
}
