import Link from "next/link";
import type { CSSProperties } from "react";

export interface KnowledgeMapLesson {
  topic: string;
  title: string;
  level: string;
  mapX: number;
  mapY: number;
  color: string;
}

export interface KnowledgeMapConnection {
  from: string;
  to: string;
}

export interface KnowledgeMapProgram {
  id: string;
  title: string;
  color: string;
}

function englishMapTitle(title: string): string {
  return title
    .replace(/\s*\([^)]*\)\s*$/, "")
    .split(":")[0]
    .trim();
}

export default function KnowledgeMap({
  lessons,
  connections,
  programs,
}: {
  lessons: KnowledgeMapLesson[];
  connections: KnowledgeMapConnection[];
  programs: KnowledgeMapProgram[];
}) {
  const lessonByTopic = new Map(lessons.map((lesson) => [lesson.topic, lesson]));
  const visibleConnections = connections.filter(
    (connection) =>
      connection.from !== connection.to &&
      lessonByTopic.has(connection.from) &&
      lessonByTopic.has(connection.to),
  );
  const duplicateCounts = new Map<string, number>();
  const labelShifts = new Map<string, number>();
  for (const lesson of lessons) {
    const key = `${lesson.mapX}-${lesson.mapY}`;
    const index = duplicateCounts.get(key) ?? 0;
    labelShifts.set(lesson.topic, index);
    duplicateCounts.set(key, index + 1);
  }

  return (
    <section className="knowledge-section" aria-labelledby="knowledge-title">
      <div className="knowledge-section__head">
        <p className="eyebrow">Карта знаний</p>
        <h2 id="knowledge-title">Карта знаний</h2>
        <p>
          Каждая звезда — урок. Нажми на звезду или подпись, чтобы открыть тему.
          Связи показывают логичный порядок изучения.
        </p>
      </div>

      <div className="knowledge-map">
        <svg
          className="knowledge-map__connections"
          viewBox="0 0 1000 800"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {visibleConnections.map((connection) => {
            const from = lessonByTopic.get(connection.from);
            const to = lessonByTopic.get(connection.to);
            if (!from || !to) return null;

            return (
              <line
                key={`${connection.from}-${connection.to}`}
                x1={from.mapX * 10}
                y1={from.mapY * 8}
                x2={to.mapX * 10}
                y2={to.mapY * 8}
                stroke="#a1a1aa"
                strokeOpacity={0.2}
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>

        {lessons.map((lesson) => (
          <Link
            key={lesson.topic}
            href={`/lesson/${lesson.topic}?context=library`}
            className={`knowledge-node ${
              lesson.mapX > 88 ? "knowledge-node--flip" : ""
            }`}
            style={{
              left: `${lesson.mapX}%`,
              top: `${lesson.mapY}%`,
              "--node-color": lesson.color,
              "--label-shift": `${
                (labelShifts.get(lesson.topic) ?? 0) * 18
              }px`,
            } as CSSProperties}
            title={`${englishMapTitle(lesson.title)} · ${lesson.level}`}
          >
            <span className="knowledge-node__dot" aria-hidden="true" />
            <span className="knowledge-node__label">
              {englishMapTitle(lesson.title)}
            </span>
          </Link>
        ))}

        <div className="knowledge-map__legend">
          {programs.map((program) => (
            <span key={program.id}>
              <i style={{ background: program.color }} aria-hidden="true" />
              {program.title}
            </span>
          ))}
          <span>
            <i className="knowledge-map__legend-free" aria-hidden="true" />
            Отдельные темы
          </span>
        </div>
      </div>
    </section>
  );
}
