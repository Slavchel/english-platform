import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
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

  const body = (await request.json().catch(() => null)) as {
    courseId?: unknown;
    topic?: unknown;
    currentStep?: unknown;
  } | null;

  const courseId = typeof body?.courseId === "string" ? body.courseId : "";
  const topic = typeof body?.topic === "string" ? body.topic : "";
  const currentStep = Math.max(
    0,
    Math.floor(Number(body?.currentStep ?? 0)),
  );

  if (!courseId || !topic || !Number.isFinite(currentStep)) {
    return NextResponse.json(
      { error: "courseId, topic and currentStep are required" },
      { status: 400 },
    );
  }

  const lesson = await prisma.lesson.findFirst({
    where: { topic, courseId },
    select: { id: true },
  });
  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  await prisma.userProgress.upsert({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId,
      },
    },
    update: {
      lessonId: lesson.id,
      currentStep,
    },
    create: {
      userId: user.id,
      courseId,
      lessonId: lesson.id,
      currentStep,
    },
  });

  return NextResponse.json({ ok: true, currentStep });
}
