import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type CSSProperties } from "react";
import { connection } from "next/server";

import LessonCard from "@/app/components/LessonCard";
import { auth } from "@/auth";
import { categoryTheme } from "@/lib/lessons/theme";
import { prisma } from "@/lib/prisma";
import LearningAuthGate from "./LearningAuthGate";
import KnowledgeMap, {
  type KnowledgeMapConnection,
} from "./KnowledgeMap";

export const metadata: Metadata = {
  title: "Обучение — English Platform",
  description:
    "Короткие уроки английского с теорией, практикой и шпаргалкой.",
};

const levelOrder: Record<string, number> = {
  "Pre-A1": 0,
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5,
  C2: 6,
};

interface CategoryConfig {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  accent: string;
  accentSoft: string;
  accentBorder: string;
}

export const CATEGORY_CONFIG: readonly CategoryConfig[] = [
  {
    id: "tenses",
    title: "Времена",
    subtitle: "Все английские времена по отдельности: форма, смысл и маркеры.",
    icon: "◷",
    accent: "#6f9fd8",
    accentSoft: "rgba(37, 70, 122, 0.22)",
    accentBorder: "rgba(111, 159, 216, 0.45)",
  },
  {
    id: "comparisons",
    title: "Сравнение времён",
    subtitle: "Где формы похожи и как выбрать правильную по смыслу.",
    icon: "⇄",
    accent: "#d98b93",
    accentSoft: "rgba(122, 37, 55, 0.22)",
    accentBorder: "rgba(217, 139, 147, 0.45)",
  },
  {
    id: "conditionals",
    title: "Условные предложения",
    subtitle: "Реальные, воображаемые и прошлые условия: First, Second, Third и Mixed.",
    icon: "◇",
    accent: "#d8c078",
    accentSoft: "rgba(122, 95, 37, 0.22)",
    accentBorder: "rgba(216, 192, 120, 0.45)",
  },
  {
    id: "syntax",
    title: "Сложные конструкции",
    subtitle: "Пассив, герундий, относительные и косвенные предложения.",
    icon: "⌘",
    accent: "#82c7c2",
    accentSoft: "rgba(24, 92, 88, 0.22)",
    accentBorder: "rgba(130, 199, 194, 0.45)",
  },
  {
    id: "modals",
    title: "Модальные глаголы",
    subtitle: "Способность, совет, вероятность и отношение к действию.",
    icon: "⚖",
    accent: "#c9a6e0",
    accentSoft: "rgba(88, 54, 122, 0.22)",
    accentBorder: "rgba(201, 166, 224, 0.45)",
  },
  {
    id: "connectors",
    title: "Союзы и связки",
    subtitle: "Как соединять идеи, причины, контрасты и результаты.",
    icon: "⌁",
    accent: "#d9a27c",
    accentSoft: "rgba(122, 67, 37, 0.22)",
    accentBorder: "rgba(217, 162, 124, 0.45)",
  },
  {
    id: "nouns",
    title: "Существительные и количество",
    subtitle: "Исчисляемое и неисчисляемое, both / either / neither.",
    icon: "◌",
    accent: "#8fbf9f",
    accentSoft: "rgba(40, 102, 63, 0.22)",
    accentBorder: "rgba(143, 191, 159, 0.45)",
  },
  {
    id: "determiners",
    title: "Указатели и принадлежность",
    subtitle: "This / that, притяжательные формы и вопрос whose.",
    icon: "◇",
    accent: "#b6a7d9",
    accentSoft: "rgba(73, 60, 122, 0.22)",
    accentBorder: "rgba(182, 167, 217, 0.45)",
  },
  {
    id: "articles",
    title: "Артикли и слова",
    subtitle: "Артикли, количество и конструкции с there is / there are.",
    icon: "◈",
    accent: "#7fc4a3",
    accentSoft: "rgba(28, 89, 69, 0.22)",
    accentBorder: "rgba(127, 196, 163, 0.45)",
  },
  {
    id: "basics",
    title: "База и предлоги",
    subtitle: "Минимальный фундамент: to be и предлоги времени.",
    icon: "✧",
    accent: "#d9b978",
    accentSoft: "rgba(122, 95, 37, 0.22)",
    accentBorder: "rgba(217, 185, 120, 0.45)",
  },
];

type LearningPageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default function LearningPage({ searchParams }: LearningPageProps) {
  return (
    <Suspense
      fallback={
        <section className="page-shell">
          <div className="container py-14">
            <p className="eyebrow">English Platform · обучение</p>
            <h1 className="learning-title">Обучение</h1>
            <p className="lead">Загружаем уроки…</p>
          </div>
        </section>
      }
    >
      <LearningContent searchParams={searchParams} />
    </Suspense>
  );
}

function normalizeMapTopic(topic: string): string {
  return topic === "present_perfect_regular" ? "present_perfect" : topic;
}

function readMapConnections(): KnowledgeMapConnection[] {
  const file = path.join(process.cwd(), "content", "map_coordinates.json");
  if (!fs.existsSync(file)) return [];
  const raw = JSON.parse(fs.readFileSync(file, "utf8")) as {
    connections?: Array<{ from: string; to: string }>;
  };
  return (raw.connections ?? []).map((connection) => ({
    from: normalizeMapTopic(connection.from),
    to: normalizeMapTopic(connection.to),
  }));
}

function readMapTopics(): Set<string> {
  const file = path.join(process.cwd(), "content", "map_coordinates.json");
  if (!fs.existsSync(file)) return new Set();
  const raw = JSON.parse(fs.readFileSync(file, "utf8")) as {
    nodes?: Record<string, unknown>;
  };
  return new Set(Object.keys(raw.nodes ?? {}).map(normalizeMapTopic));
}

async function LearningContent({ searchParams }: LearningPageProps) {
  await connection();
  const session = await auth();
  const { tab } = await searchParams;
  const activeTab = tab === "map" ? "map" : "programs";
  const [lessons, courses] = await Promise.all([
    prisma.lesson.findMany({
      select: {
        topic: true,
        title: true,
        level: true,
        category: true,
        mapX: true,
        mapY: true,
        course: { select: { color: true } },
      },
    }),
    prisma.course.findMany({
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: { modules: true, lessons: true },
        },
      },
    }),
  ]);

  const sorted = [...lessons].sort((left, right) => {
    const levelDifference =
      (levelOrder[left.level] ?? 99) - (levelOrder[right.level] ?? 99);
    if (levelDifference !== 0) return levelDifference;
    return left.title.localeCompare(right.title, "ru");
  });

  const totalLessons = sorted.length;
  const totalPrograms = courses.length;
  const mapTopics = activeTab === "map" ? readMapTopics() : new Set<string>();
  const mapLessons = sorted
    .filter((lesson) => mapTopics.has(lesson.topic))
    .map((lesson) => ({
      topic: lesson.topic,
      title: lesson.title,
      level: lesson.level,
      mapX: lesson.mapX,
      mapY: lesson.mapY,
      color:
        lesson.course?.color ?? categoryTheme(lesson.category).accent,
    }));
  const mapConnections = activeTab === "map" ? readMapConnections() : [];

  return (
    <section className="page-shell learning-page">
      <LearningAuthGate isAuthenticated={Boolean(session?.user)} />
      <div className="container py-12 sm:py-16">
        <header className="learning-hero">
          <div className="learning-map-decor" aria-hidden="true">
            <svg viewBox="0 0 620 300" role="presentation">
              <defs>
                <linearGradient id="learning-map-gold" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#d8c18e" stopOpacity="0.72" />
                  <stop offset="100%" stopColor="#b89a65" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="learning-map-blue" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#79a8cf" stopOpacity="0.62" />
                  <stop offset="100%" stopColor="#3c6387" stopOpacity="0.04" />
                </linearGradient>
                <linearGradient id="learning-map-violet" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#b49ad9" stopOpacity="0.58" />
                  <stop offset="100%" stopColor="#5d477e" stopOpacity="0.04" />
                </linearGradient>
                <radialGradient id="learning-map-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#c2a66d" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#c2a66d" stopOpacity="0" />
                </radialGradient>
              </defs>

              <circle cx="380" cy="128" r="150" fill="url(#learning-map-glow)" />

              <g fill="none" strokeLinecap="round">
                <path d="M54 204C112 204 126 138 190 138C242 138 255 96 318 96C378 96 394 56 472 56C524 56 548 38 588 38" stroke="url(#learning-map-gold)" strokeWidth="1" opacity="0.5" />
                <path d="M118 252C166 252 182 204 238 204C292 204 312 166 372 166C430 166 452 118 516 118C556 118 574 102 604 102" stroke="url(#learning-map-blue)" strokeWidth="0.9" opacity="0.44" />
                <path d="M88 92C142 92 160 124 218 124C278 124 286 174 348 174C408 174 426 222 492 222C536 222 560 238 598 238" stroke="url(#learning-map-violet)" strokeWidth="0.85" opacity="0.4" />
                <path d="M190 138C222 138 238 204 270 204C302 204 312 166 348 166" stroke="rgba(194, 166, 109, 0.18)" strokeWidth="0.8" />
                <path d="M318 96C356 96 372 56 410 56C446 56 458 38 472 38" stroke="rgba(121, 168, 207, 0.2)" strokeWidth="0.8" />
              </g>

              <g>
                {[
                  [54, 204, "#d8c18e", 0.5],
                  [190, 138, "#d8c18e", 0.9],
                  [318, 96, "#79a8cf", 0.75],
                  [472, 56, "#d8c18e", 0.55],
                  [238, 204, "#79a8cf", 0.8],
                  [372, 166, "#b49ad9", 0.85],
                  [516, 118, "#79a8cf", 0.55],
                  [348, 174, "#b49ad9", 0.55],
                  [492, 222, "#b49ad9", 0.7],
                  [88, 92, "#79a8cf", 0.45],
                  [410, 56, "#d8c18e", 0.4],
                  [598, 238, "#b49ad9", 0.35],
                ].map(([x, y, color, opacity]) => (
                  <g key={`${x}-${y}`}>
                    <circle cx={x} cy={y} r="8" fill={color as string} opacity={0.06} />
                    <circle
                      cx={x}
                      cy={y}
                      r={[190, 318, 372, 238, 516].includes(x as number) ? 3 : 2}
                      fill={color as string}
                      opacity={opacity as number}
                    />
                  </g>
                ))}
              </g>

              <g fill="none" stroke="#d8c18e" opacity="0.25">
                <circle cx="190" cy="138" r="12" />
                <circle cx="372" cy="166" r="16" />
                <circle cx="516" cy="118" r="10" />
              </g>
              <g fill="#f0dfb9" opacity="0.5">
                <circle cx="190" cy="138" r="1.4" />
                <circle cx="372" cy="166" r="1.4" />
                <circle cx="516" cy="118" r="1.2" />
              </g>
            </svg>
          </div>
          <div className="learning-hero__content">
            <p className="eyebrow">English Platform · обучение</p>
            <h1 className="learning-title">Обучение</h1>
            <p className="learning-lead">
              Хочешь системный подход? Выбери готовую программу. Или изучай
              отдельные темы, которые нужны именно тебе.
            </p>
            <dl className="learning-stats">
              <div>
                <dt>Уроков доступно</dt>
                <dd>{totalLessons}</dd>
              </div>
              <div>
                <dt>Программ</dt>
                <dd>{totalPrograms}</dd>
              </div>
              <div>
                <dt>Разделов</dt>
                <dd>{CATEGORY_CONFIG.length}</dd>
              </div>
            </dl>
          </div>
        </header>

        <nav className="learning-tabs" aria-label="Разделы обучения">
          <Link
            href="/learning"
            className={`learning-tab ${
              activeTab === "programs" ? "learning-tab--active" : ""
            }`}
          >
            Программы
          </Link>
          <Link
            href="/learning?tab=map"
            className={`learning-tab ${
              activeTab === "map" ? "learning-tab--active" : ""
            }`}
          >
            Карта знаний
          </Link>
        </nav>

        {activeTab === "map" ? (
          <KnowledgeMap
            lessons={mapLessons}
            connections={mapConnections}
            programs={courses.map((course) => ({
              id: course.id,
              title: course.title,
              color: course.color,
            }))}
          />
        ) : (
          <>
        {courses.length > 0 ? (
          <section
            className="learning-programs reveal-section"
            aria-labelledby="learning-programs-title"
          >
            <div className="learning-programs__head">
              <p className="eyebrow">Системный путь</p>
              <h2 id="learning-programs-title">Готовые программы</h2>
              <p>
                Последовательные модули, уроки и понятный прогресс — от
                фундамента до продвинутой грамматики.
              </p>
            </div>

            <div className="learning-programs__grid">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="program-card"
                  style={
                    {
                      "--program-accent": course.color,
                    } as CSSProperties
                  }
                >
                  <div className="program-card__top">
                    <span className="program-card__level">{course.level}</span>
                    <span className="program-card__count">
                      {course._count.modules} модулей
                    </span>
                  </div>
                  <h3>{course.title}</h3>
                  <p>{course.description}</p>
                  <div className="program-card__footer">
                    <span>
                      {course._count.lessons} уроков
                    </span>
                    <span className="program-card__cta">
                      Открыть программу <span aria-hidden="true">→</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <div className="learning-library__head">
          <p className="eyebrow">Свободное изучение</p>
          <h2>Библиотека тем</h2>
          <p>
            Все темы по категориям — можно учиться в любом порядке и возвращаться
            к нужному разделу.
          </p>
        </div>

        {sorted.length === 0 ? (
          <div className="learning-empty">
            Уроки пока не загружены. Запустите{" "}
            <code>npm run seed:lessons</code>.
          </div>
        ) : (
          <div className="learning-sections">
            {CATEGORY_CONFIG.map((category) => {
              const categoryLessons = sorted.filter(
                (lesson) => lesson.category === category.id,
              );

              return (
                <section
                  key={category.id}
                  id={category.id}
                  className="learning-section reveal-section"
                  aria-labelledby={`${category.id}-title`}
                  style={
                    {
                      "--accent": category.accent,
                      "--accent-soft": category.accentSoft,
                      "--accent-border": category.accentBorder,
                    } as CSSProperties
                  }
                >
                  <div className="learning-section__head">
                    <span className="learning-section__icon" aria-hidden="true">
                      {category.icon}
                    </span>
                    <div className="learning-section__text-block">
                      <h2
                        id={`${category.id}-title`}
                        className="learning-section__title"
                      >
                        {category.title}
                      </h2>
                      <p className="learning-section__text">
                        {category.subtitle}
                      </p>
                    </div>
                    <span className="learning-section__count">
                      {categoryLessons.length} тем
                    </span>
                  </div>

                  {categoryLessons.length === 0 ? (
                    <p className="learning-section__empty">
                      Темы этого раздела появятся скоро.
                    </p>
                  ) : (
                    <div className="learning-grid">
                      {categoryLessons.map((lesson) => (
                        <LessonCard
                          key={lesson.topic}
                          lesson={lesson}
                          href={`/lesson/${lesson.topic}?context=library`}
                        />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
          </>
        )}
      </div>
    </section>
  );
}
