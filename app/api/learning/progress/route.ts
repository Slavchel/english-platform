import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function currentUser() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;

  return prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
}

export async function GET() {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const progress = await prisma.lessonProgress.findMany({
    where: { userId: user.id },
    select: { lesson: { select: { topic: true } } },
  });

  return NextResponse.json({
    topics: progress.map((item) => item.lesson.topic),
  });
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    topic?: unknown;
    source?: unknown;
  } | null;
  const topic = typeof body?.topic === "string" ? body.topic : "";
  const source = body?.source === "library" ? "library" : "program";
  if (!topic) {
    return NextResponse.json({ error: "Topic is required" }, { status: 400 });
  }

  const lesson = await prisma.lesson.findUnique({
    where: { topic },
    select: { id: true },
  });
  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  await prisma.lessonProgress.upsert({
    where: {
      userId_lessonId: {
        userId: user.id,
        lessonId: lesson.id,
      },
    },
    update: { source },
    create: {
      userId: user.id,
      lessonId: lesson.id,
      source,
    },
  });

  return NextResponse.json({ ok: true });
}
