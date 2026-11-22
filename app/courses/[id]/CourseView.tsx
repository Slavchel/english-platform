"use client";

import Link from "next/link";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import {
  getCompletedLessonTopics,
  subscribeToProgress,
} from "@/lib/learning/progress";

export interface CourseViewLesson {
  topic: string;
  title: string;
  level: string;
}

export interface CourseViewModule {
  id: string;
  title: string;
  order: number;
  lessons: CourseViewLesson[];
}

export interface CourseViewData {
  id: string;
  title: string;
  description: string;
  level: string;
  color: string;
  modules: CourseViewModule[];
}

interface CourseWelcome {
  eyebrow: string;
  title: string;
  subtitle: string;
  uniqueTitle: string;
  uniqueText: string;
  featuresTitle: string;
  features: Array<{ icon: string; title: string; text: string }>;
  howTitle: string;
  howText: string;
  button: string;
}

interface RouteLine {
  from: string;
  to: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  lit: boolean;
}

function orderByConnections(
  lessons: CourseViewLesson[],
  connections: Array<{ from: string; to: string }>,
): CourseViewLesson[] {
  const byTopic = new Map(lessons.map((lesson) => [lesson.topic, lesson]));
  const localEdges = connections.filter(
    (edge) => byTopic.has(edge.from) && byTopic.has(edge.to),
  );
  if (localEdges.length === 0) return lessons;

  const indegree = new Map(lessons.map((lesson) => [lesson.topic, 0]));
  const outgoing = new Map<string, string[]>();

  for (const edge of localEdges) {
    indegree.set(edge.to, (indegree.get(edge.to) ?? 0) + 1);
    const list = outgoing.get(edge.from) ?? [];
    list.push(edge.to);
    outgoing.set(edge.from, list);
  }

  const originalOrder = new Map(
    lessons.map((lesson, index) => [lesson.topic, index]),
  );
  const ready = lessons
    .filter((lesson) => (indegree.get(lesson.topic) ?? 0) === 0)
    .sort(
      (left, right) =>
        (originalOrder.get(left.topic) ?? 0) -
        (originalOrder.get(right.topic) ?? 0),
    );
  const result: CourseViewLesson[] = [];

  while (ready.length > 0) {
    const lesson = ready.shift();
    if (!lesson) break;
    result.push(lesson);

    for (const nextTopic of outgoing.get(lesson.topic) ?? []) {
      const remaining = (indegree.get(nextTopic) ?? 1) - 1;
      indegree.set(nextTopic, remaining);
      if (remaining === 0) {
        const next = byTopic.get(nextTopic);
        if (next) ready.push(next);
      }
    }
  }

  for (const lesson of lessons) {
    if (!result.some((item) => item.topic === lesson.topic)) {
      result.push(lesson);
    }
  }

  return result;
}

export default function CourseView({
  course,
  connections = [],
  welcome,
  firstLessonTopic,
  resume,
}: {
  course: CourseViewData;
  connections?: Array<{ from: string; to: string }>;
  welcome?: CourseWelcome | null;
  firstLessonTopic?: string | null;
  resume?: { topic: string; currentStep: number } | null;
}) {
  const [completed, setCompleted] = useState<Set<string>>(() => new Set());
  const [lines, setLines] = useState<RouteLine[]>([]);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const routeRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef(new Map<string, HTMLSpanElement>());

  useEffect(() => {
    if (!welcomeOpen) return;

    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setWelcomeOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [welcomeOpen]);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const topics = await getCompletedLessonTopics();
      if (active) setCompleted(topics);
    };
    void refresh();
    const unsubscribe = subscribeToProgress(() => {
      void refresh();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const orderedModules = useMemo(
    () =>
      course.modules.map((module) => ({
        ...module,
        lessons: orderByConnections(module.lessons, connections),
      })),
    [course.modules, connections],
  );

  const orderedLessons = useMemo(
    () => orderedModules.flatMap((module) => module.lessons),
    [orderedModules],
  );

  const edges = useMemo(() => {
    const moduleByTopic = new Map<string, string>();
    for (const courseModule of orderedModules) {
      for (const lesson of courseModule.lessons) {
        moduleByTopic.set(lesson.topic, courseModule.id);
      }
    }

    const configured = connections.filter((edge) => {
      const fromModule = moduleByTopic.get(edge.from);
      const toModule = moduleByTopic.get(edge.to);
      return Boolean(fromModule) && fromModule === toModule;
    });

    if (configured.length > 0) return configured;

    const local: Array<{ from: string; to: string }> = [];
    for (const courseModule of orderedModules) {
      courseModule.lessons.slice(1).forEach((lesson, index) => {
        local.push({
          from: courseModule.lessons[index].topic,
          to: lesson.topic,
        });
      });
    }
    return local;
  }, [connections, orderedModules]);

  const lessonNumbers = useMemo(() => {
    const numbers = new Map<string, number>();
    orderedLessons.forEach((lesson, index) => {
      numbers.set(lesson.topic, index + 1);
    });
    return numbers;
  }, [orderedLessons]);

  const currentTopic = orderedLessons.find(
    (lesson) => !completed.has(lesson.topic),
  )?.topic;
  const totalLessons = orderedLessons.length;
  const completedCount = orderedLessons.filter((lesson) =>
    completed.has(lesson.topic),
  ).length;
  const progress = totalLessons
    ? Math.round((completedCount / totalLessons) * 100)
    : 0;

  const startProgram = () => {
    if (!firstLessonTopic) return;
    void fetch("/api/learning/step", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId: course.id,
        topic: firstLessonTopic,
        currentStep: 0,
      }),
      keepalive: true,
    }).catch(() => undefined);
  };

  useLayoutEffect(() => {
    let frame = 0;

    const update = () => {
      const route = routeRef.current;
      if (!route) return;
      const routeRect = route.getBoundingClientRect();
      const nextLines: RouteLine[] = [];

      for (const edge of edges) {
        const from = nodeRefs.current.get(edge.from);
        const to = nodeRefs.current.get(edge.to);
        if (!from || !to) continue;
        const fromRect = from.getBoundingClientRect();
        const toRect = to.getBoundingClientRect();

        nextLines.push({
          from: edge.from,
          to: edge.to,
          x1: fromRect.left + fromRect.width / 2 - routeRect.left,
          y1: fromRect.top + fromRect.height / 2 - routeRect.top,
          x2: toRect.left + toRect.width / 2 - routeRect.left,
          y2: toRect.top + toRect.height / 2 - routeRect.top,
          lit: completed.has(edge.from),
        });
      }

      setLines(nextLines);
    };

    const schedule = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(update);
    };

    schedule();
    window.addEventListener("resize", schedule);

    const observer = new ResizeObserver(schedule);
    if (routeRef.current) observer.observe(routeRef.current);
    for (const node of nodeRefs.current.values()) observer.observe(node);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
    };
  }, [edges, completed]);

  const style = {
    "--course-color": course.color,
  } as CSSProperties;

  return (
    <section className="page-shell course-page" style={style}>
      <div className="container py-10 sm:py-14">
        <Link href="/learning" className="course-back">
          ← Все программы
        </Link>

        <header className="course-hero">
          <div className="course-hero__copy">
            <p className="eyebrow">Программа · {course.level}</p>
            <h1 className="course-title">{course.title}</h1>
            <p className="course-description">{course.description}</p>
          </div>

          <div className="course-progress">
            <div className="course-progress__top">
              <span>Прогресс программы</span>
              <strong>{progress}%</strong>
            </div>
            <div
              className="course-progress__bar"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Прогресс программы"
            >
              <span style={{ width: `${progress}%` }} />
            </div>
            <p>
              {completedCount} из {totalLessons} уроков пройдено
            </p>
            {resume ? (
              <Link
                href={`/lesson/${resume.topic}?context=program&step=${resume.currentStep}`}
                className="course-continue"
              >
                Продолжить обучение
                <span aria-hidden="true">→</span>
              </Link>
            ) : currentTopic ? (
              welcome ? (
                <button
                  type="button"
                  onClick={() => setWelcomeOpen(true)}
                  className="course-continue"
                >
                  Начать программу
                  <span aria-hidden="true">→</span>
                </button>
              ) : (
                <Link
                  href={`/lesson/${
                    firstLessonTopic ?? currentTopic
                  }?context=program&step=0`}
                  className="course-continue"
                >
                  Начать программу
                  <span aria-hidden="true">→</span>
                </Link>
              )
            ) : (
              <p className="course-complete">Программа полностью пройдена</p>
            )}
          </div>
        </header>

        <div className="program-route" ref={routeRef}>
          <svg className="program-route__lines" aria-hidden="true">
            {lines.map((line) => (
              <line
                key={`${line.from}-${line.to}`}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                className={`program-route__line ${
                  line.lit ? "program-route__line--lit" : ""
                }`}
              />
            ))}
          </svg>

          <div
            className={`program-modules program-modules--${course.modules.length}`}
          >
            {orderedModules.map((module, moduleIndex) => {
              const moduleDone = module.lessons.filter((lesson) =>
                completed.has(lesson.topic),
              ).length;
              const reverseSnake = moduleIndex % 2 === 1;

              return (
                <section
                  key={module.id}
                  className="program-module"
                  id={`module-${module.id}`}
                >
                  <div className="program-module__head">
                    <span>{String(moduleIndex + 1).padStart(2, "0")}</span>
                    <div>
                      <h2>{module.title}</h2>
                      <p>
                        {moduleDone} / {module.lessons.length} уроков
                      </p>
                    </div>
                  </div>

                  <div className="program-grid">
                    {module.lessons.map((lesson, lessonIndex) => {
                      const isCompleted = completed.has(lesson.topic);
                      const isCurrent = lesson.topic === currentTopic;
                      const isLocked = !isCompleted && !isCurrent;
                      const state = isCompleted
                        ? "done"
                        : isCurrent
                          ? "current"
                          : "future";
                      const row = Math.floor(lessonIndex / 3);
                      const positionInRow = lessonIndex % 3;
                      const column = reverseSnake
                        ? row % 2 === 0
                          ? positionInRow + 1
                          : 3 - positionInRow
                        : row % 2 === 0
                          ? positionInRow + 1
                          : 3 - positionInRow;

                      return (
                        <Link
                          key={lesson.topic}
                          href={
                            isLocked
                              ? "#"
                              : `/lesson/${lesson.topic}?context=program&step=0`
                          }
                          prefetch={false}
                          className={`program-node program-node--${state} ${
                            isLocked ? "program-node--locked" : ""
                          }`}
                          style={{
                            gridColumn: column,
                            gridRow: row + 1,
                          }}
                          onClick={(event) => {
                            if (isLocked) event.preventDefault();
                          }}
                          tabIndex={isLocked ? -1 : undefined}
                          aria-disabled={isLocked || undefined}
                          aria-label={`${lesson.title}. ${
                            isCompleted
                              ? "Пройден"
                              : isCurrent
                                ? "Текущий урок"
                                : "Заблокирован"
                          }`}
                          aria-current={isCurrent ? "step" : undefined}
                        >
                          <span
                            className="program-node__circle"
                            ref={(element) => {
                              if (element) {
                                nodeRefs.current.set(lesson.topic, element);
                              } else {
                                nodeRefs.current.delete(lesson.topic);
                              }
                            }}
                          >
                            <span className="program-node__number">
                              {String(
                                lessonNumbers.get(lesson.topic) ?? lessonIndex + 1,
                              ).padStart(2, "0")}
                            </span>
                            <span
                              className="program-node__status"
                              aria-hidden="true"
                            >
                              {isCompleted ? "✓" : isCurrent ? "▶" : "🔒"}
                            </span>
                          </span>
                          <span className="program-node__label">
                            {lesson.title
                              .replace(/\s*\([^)]*\)\s*$/, "")
                              .split(":")[0]
                              .trim()}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>

      {welcomeOpen && welcome && currentTopic ? (
        <div
          className="program-welcome"
          role="dialog"
          aria-modal="true"
          aria-labelledby="program-welcome-title"
          onClick={() => setWelcomeOpen(false)}
        >
          <div
            className="program-welcome__panel"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="program-welcome__close"
              onClick={() => setWelcomeOpen(false)}
              aria-label="Закрыть приветствие"
            >
              ×
            </button>

            <p className="program-welcome__eyebrow">{welcome.eyebrow}</p>
            <h2 id="program-welcome-title" className="program-welcome__title">
              {welcome.title}
            </h2>
            <p className="program-welcome__subtitle">{welcome.subtitle}</p>

            <div className="program-welcome__unique">
              <h3>{welcome.uniqueTitle}</h3>
              <p>{welcome.uniqueText}</p>
            </div>

            <h3 className="program-welcome__section-title">
              {welcome.featuresTitle}
            </h3>
            <div className="program-welcome__features">
              {welcome.features.map((feature) => (
                <div
                  key={feature.title}
                  className="program-welcome__feature"
                >
                  <span aria-hidden="true">{feature.icon}</span>
                  <div>
                    <h4>{feature.title}</h4>
                    <p>{feature.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="program-welcome__how">
              <h3>{welcome.howTitle}</h3>
              <p>{welcome.howText}</p>
            </div>

            <Link
              href={`/lesson/${
                firstLessonTopic ?? currentTopic
              }?context=program&step=0`}
              className="program-welcome__start"
              onClick={() => {
                startProgram();
                setWelcomeOpen(false);
              }}
            >
              {welcome.button}
            </Link>
          </div>
        </div>
      ) : null}
    </section>
  );
}
