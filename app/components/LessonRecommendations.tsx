"use client";

import { useEffect, useState } from "react";

import LessonCard, {
  type LessonCardData,
} from "@/app/components/LessonCard";

export default function LessonRecommendations({
  topics,
}: {
  topics: readonly string[];
}) {
  const topicsKey = topics.join("\n");
  const [data, setData] = useState<{
    key: string;
    lessons: LessonCardData[];
  }>({ key: "", lessons: [] });

  useEffect(() => {
    if (!topicsKey) return;

    const controller = new AbortController();
    const params = new URLSearchParams();
    for (const topic of topicsKey.split("\n")) {
      if (topic) params.append("topic", topic);
    }

    async function load() {
      try {
        const response = await fetch(
          `/api/learning/recommendations?${params.toString()}`,
          {
            signal: controller.signal,
            cache: "no-store",
          },
        );
        if (!response.ok) return;

        const payload = (await response.json()) as {
          lessons?: unknown;
        };
        if (!Array.isArray(payload.lessons)) return;

        const lessons = payload.lessons.filter(
          (lesson): lesson is LessonCardData =>
            Boolean(lesson) &&
            typeof lesson === "object" &&
            typeof (lesson as { topic?: unknown }).topic === "string" &&
            typeof (lesson as { title?: unknown }).title === "string" &&
            typeof (lesson as { level?: unknown }).level === "string",
        );
        setData({ key: topicsKey, lessons });
      } catch {
        // Если рекомендации не загрузились, не ломаем страницу результата.
      }
    }

    void load();

    return () => controller.abort();
  }, [topicsKey]);

  const lessons = data.key === topicsKey ? data.lessons : [];

  if (lessons.length === 0) return null;

  return (
    <section className="lesson-recommendations">
      <div className="lesson-recommendations__head">
        <h2>Темы, которые стоит повторить</h2>
        <p>
          Мы заметили, что есть трудности с этими темами. Откройте урок — там
          теория, практика и шпаргалка.
        </p>
      </div>
      <div className="lesson-recommendations__grid">
        {lessons.map((lesson) => (
          <LessonCard
            key={lesson.topic}
            lesson={lesson}
            href={`/lesson/${lesson.topic}?context=library`}
          />
        ))}
      </div>
    </section>
  );
}
