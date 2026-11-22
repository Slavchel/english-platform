import { NextResponse } from "next/server";

import { lessonTopicForTestTopic } from "@/lib/lessons/catalog";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const topics = searchParams
    .getAll("topic")
    .flatMap((topic) => topic.split(","))
    .map((topic) => topic.trim())
    .filter(Boolean)
    .slice(0, 50);

  const wanted = Array.from(
    new Set(
      topics
        .flatMap((topic) => {
          const normalized = topic.toLowerCase().replace(/-/g, "_");
          const mapped = lessonTopicForTestTopic(topic);
          return [mapped, normalized];
        })
        .filter((topic): topic is string => Boolean(topic)),
    ),
  );

  if (wanted.length === 0) {
    return NextResponse.json({ lessons: [] });
  }

  const rows = await prisma.lesson.findMany({
    where: { topic: { in: wanted } },
    select: {
      topic: true,
      title: true,
      level: true,
      category: true,
    },
  });
  const byTopic = new Map(rows.map((lesson) => [lesson.topic, lesson]));
  const lessons = wanted
    .map((topic) => byTopic.get(topic))
    .filter((lesson): lesson is NonNullable<typeof lesson> => Boolean(lesson))
    .map((lesson) => ({
      topic: lesson.topic,
      title: lesson.title,
      level: lesson.level,
      category: lesson.category ?? undefined,
    }));

  return NextResponse.json({ lessons });
}
