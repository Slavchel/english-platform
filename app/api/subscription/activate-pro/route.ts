import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canUseProTestActivation } from "@/lib/subscription/test-access";

export async function POST() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Требуется вход." }, { status: 401 });
  }
  if (
    !canUseProTestActivation(
      session.user.email,
      Boolean(session.user.isAdmin),
    )
  ) {
    return NextResponse.json(
      { error: "Активация Pro доступна только тестовому аккаунту или администратору." },
      { status: 403 },
    );
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

  return NextResponse.json({ ok: true, tier: "PRO" });
}
