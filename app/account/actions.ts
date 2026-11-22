"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canResetTestAccount } from "@/lib/subscription/test-access";

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
  redirect("/");
}

export async function resetTestAccount(): Promise<void> {
  const session = await auth();
  const email = session?.user?.email;

  if (!canResetTestAccount(email) || !email) {
    redirect("/account");
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) redirect("/account");

  await prisma.$transaction([
    prisma.aiAnalysis.deleteMany({ where: { userId: user.id } }),
    prisma.aiUsage.deleteMany({ where: { userId: user.id } }),
    prisma.speakingDialog.deleteMany({ where: { userId: user.id } }),
    prisma.lessonProgress.deleteMany({ where: { userId: user.id } }),
    prisma.userProgress.deleteMany({ where: { userId: user.id } }),
    prisma.testResult.deleteMany({ where: { userId: user.id } }),
    prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionTier: "FREE",
        speakingDialogsUsed: 0,
        aiAnalysesUsed: 0,
        lastSpeakingDate: null,
        lastAiAnalysisDate: null,
        freeLessonTopic: null,
        aiAnalysisRetryAfter: null,
      },
    }),
  ]);

  revalidatePath("/account");
  revalidatePath("/learning");
  revalidatePath("/pricing");
  revalidatePath("/test");
  revalidatePath("/admin");
  redirect("/account?reset=1");
}
