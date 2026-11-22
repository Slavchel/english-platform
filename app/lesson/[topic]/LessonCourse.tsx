"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { AnimatePresence, motion } from "framer-motion";

import MarkdownContent from "./MarkdownContent";
import type { CourseStep } from "@/lib/lessons/course";
import { markLessonCompleted } from "@/lib/learning/progress";
import { shuffleWithSeed } from "@/lib/lessons/shuffle";
import { categoryTheme } from "@/lib/lessons/theme";
import type { LessonExperienceQuestion } from "./LessonExperience";
import LessonIntro from "./LessonIntro";
import TutorialOverlay from "./TutorialOverlay";

function tourSeen(
  key: string,
  userKey: string,
  courseId: string,
): boolean {
  if (typeof window === "undefined") return false;
  const raw = window.localStorage.getItem(key);
  if (!raw) return false;

  try {
    const values = JSON.parse(raw) as unknown;
    return (
      Array.isArray(values) && values.includes(`${userKey}:${courseId}`)
    );
  } catch {
    return false;
  }
}

function rememberTour(
  key: string,
  userKey: string,
  courseId: string,
): void {
  const raw = window.localStorage.getItem(key);
  let values: string[] = [];
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        values = parsed.filter(
          (value): value is string => typeof value === "string",
        );
      }
    } catch {
      values = [];
    }
  }
  const entry = `${userKey}:${courseId}`;
  if (!values.includes(entry)) values.push(entry);
  window.localStorage.setItem(key, JSON.stringify(values));
}

function rotateOptions<T>(options: readonly T[], seed: number): T[] {  if (options.length < 2) return [...options];
  const shift = (seed % (options.length - 1)) + 1;
  return options.map((_, index) => options[(index + shift) % options.length]);
}

function mixHex(from: string, to: string, amount: number): string {
  const parse = (hex: string) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const start = parse(from);
  const end = parse(to);
  const channels = start.map((channel, index) =>
    Math.round(channel + (end[index] - channel) * amount),
  );
  return `rgb(${channels.join(", ")})`;
}

function mixSpectrumColor(value: number): string {
  if (value <= 50) {
    return mixHex("#6f9fd8", "#a78bfa", value / 50);
  }
  return mixHex("#a78bfa", "#d9b978", (value - 50) / 50);
}

interface LessonCourseProps {
  title: string;
  level: string;
  topic: string;
  category?: string | null;
  content: string;
  introText?: string | null;
  outroText?: string | null;
  courseId?: string | null;
  nextLessonTopic?: string | null;
  context?: "program" | "library";
  initialStep?: number;
  moduleIndex?: number;
  lessonInModule?: number;
  tourUserKey?: string;
  tensesChart?: string;
  questions: readonly LessonExperienceQuestion[];
  course: readonly CourseStep[];
}

export default function LessonCourse({
  title,
  level,
  topic,
  category,
  content,
  introText,
  outroText,
  courseId,
  nextLessonTopic,
  context = "program",
  initialStep = 0,
  moduleIndex = -1,
  lessonInModule = -1,
  tourUserKey = "anonymous",
  tensesChart = "",
  questions,
  course: baseCourse,
}: LessonCourseProps) {
  const isLibrary = context === "library";
  const course = useMemo(() => {
    const steps = isLibrary || !introText || topic === "to_be_am_is_are"
      ? [...baseCourse]
      : [
          {
            kind: "theory" as const,
            eyebrow: "Введение",
            title: "Перед уроком",
            paragraphs: [introText],
          },
          ...baseCourse,
        ];
    return steps.map((step, index) => ({
      ...step,
      eyebrow: step.eyebrow.replace(/^Шаг \d+/u, `Шаг ${index + 1}`),
    }));
  }, [baseCourse, introText, isLibrary, topic]);
  const theme = categoryTheme(category);
  const [stepIndex, setStepIndex] = useState(() =>
    Math.min(Math.max(0, initialStep), Math.max(0, course.length - 1)),
  );
  const [introReady, setIntroReady] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [spotChoice, setSpotChoice] = useState<number | null>(null);
  const [spotShake, setSpotShake] = useState(0);
  const [sortAnswers, setSortAnswers] = useState<Record<number, string>>({});
  const [sortWrong, setSortWrong] = useState<number | null>(null);
  const [sortShake, setSortShake] = useState(0);
  const [dialogueAnswers, setDialogueAnswers] = useState<
    Record<number, string>
  >({});
  const [confidenceValue, setConfidenceValue] = useState(50);
  const [confidenceChoice, setConfidenceChoice] = useState<string | null>(null);
  const [spectrumValue, setSpectrumValue] = useState(50);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [matchingError, setMatchingError] = useState<string | null>(null);
  const [testIndex, setTestIndex] = useState(0);
  const [cheatsheetOpen, setCheatsheetOpen] = useState(false);
  const [tensesMapOpen, setTensesMapOpen] = useState(false);
  const [tour, setTour] = useState<"map" | "cheatsheet" | null>(null);
  const tensesMapButtonRef = useRef<HTMLButtonElement>(null);
  const cheatsheetButtonRef = useRef<HTMLButtonElement>(null);
  const showTensesMap =
    Boolean(tensesChart) &&
    category === "tenses" &&
    courseId !== "communication-a2-b1";
  const [wordBank, setWordBank] = useState<string[]>(() => {
    const wordOrder = course.find(
      (item): item is Extract<CourseStep, { kind: "word-order" }> =>
        item.kind === "word-order",
    );
    return [...(wordOrder?.initialWords ?? [])];
  });
  const [wordBuild, setWordBuild] = useState<string[]>([]);
  const [wordStatus, setWordStatus] = useState<
    "idle" | "correct" | "wrong"
  >("idle");
  const [wordReady, setWordReady] = useState(false);
  const assemblyRef = useRef<HTMLDivElement>(null);
  const wordTimers = useRef<number[]>([]);
  const savedStepRef = useRef(stepIndex);

  useEffect(() => {
    return () => {
      wordTimers.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const step = course[stepIndex];
  const totalSteps = course.length;
  const progress = ((stepIndex + 1) / totalSteps) * 100;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem("tour_revision") !== "3") {
      window.localStorage.removeItem("tour_tenses_map");
      window.localStorage.removeItem("tour_cheat_sheet");
      window.localStorage.setItem("tour_revision", "3");
    }
  }, []);

  useEffect(() => {
    if (isLibrary || !courseId) return;

    const timer = window.setTimeout(() => {
      const isFoundation = courseId === "foundation-a2";
      const isCommunication = courseId === "communication-a2-b1";
      const isAdvanced = courseId === "advanced-b1-b2";

      const showCheatSheetTour =
        (isFoundation || isCommunication) &&
        moduleIndex === 0 &&
        lessonInModule === 0 &&
        stepIndex === 1 &&
        !tourSeen("tour_cheat_sheet", tourUserKey, courseId);
      const showTensesMapTour =
        (isFoundation || isAdvanced) &&
        showTensesMap &&
        !tourSeen("tour_tenses_map", tourUserKey, courseId) &&
        ((isFoundation &&
          moduleIndex === 1 &&
          lessonInModule === 0 &&
          stepIndex === 0) ||
          (isAdvanced &&
            moduleIndex === 0 &&
            lessonInModule === 0 &&
            stepIndex === 1));

      if (showCheatSheetTour) {
        setTour("cheatsheet");
        return;
      }
      if (showTensesMapTour) {
        setTour("map");
        return;
      }
      setTour(null);
    }, 320);

    return () => window.clearTimeout(timer);
  }, [
    courseId,
    isLibrary,
    lessonInModule,
    moduleIndex,
    showTensesMap,
    stepIndex,
    tourUserKey,
  ]);

  const closeTour = () => {
    if (tour === "map" && courseId) {
      rememberTour("tour_tenses_map", tourUserKey, courseId);
    }
    if (tour === "cheatsheet" && courseId) {
      rememberTour("tour_cheat_sheet", tourUserKey, courseId);
    }
    setTour(null);
  };

  useEffect(() => {
    if (step?.kind === "result") {
      void markLessonCompleted(topic, isLibrary ? "library" : "program");
    }
  }, [isLibrary, step?.kind, topic]);

  useEffect(() => {
    if (isLibrary || !courseId) return;
    if (savedStepRef.current === stepIndex) return;
    savedStepRef.current = stepIndex;

    const controller = new AbortController();
    void fetch("/api/learning/step", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId,
        topic,
        currentStep: stepIndex,
      }),
      signal: controller.signal,
    }).catch(() => undefined);

    return () => controller.abort();
  }, [courseId, isLibrary, stepIndex, topic]);

  const practiceSteps = course.filter(
    (item): item is Extract<CourseStep, { kind: "practice" }> =>
      item.kind === "practice",
  );
  const resolvePracticeQuestion = (
    item: Extract<CourseStep, { kind: "practice" }>,
  ): LessonExperienceQuestion | null => {
    if (item.customQuestion) {
      return {
        ...item.customQuestion,
        options: shuffleWithSeed(
          item.customQuestion.options,
          `${topic}-practice-${item.customQuestion.id}`,
        ),
        explanation: item.customQuestion.explanation ?? null,
      };
    }
    if (item.questionIndex !== undefined) {
      const source = questions[item.questionIndex];
      return source
        ? {
            ...source,
            options: shuffleWithSeed(
              source.options,
              `${topic}-practice-${source.id}`,
            ),
          }
        : null;
    }
    return null;
  };
  const testStep = course.find(
    (item): item is Extract<CourseStep, { kind: "test" }> =>
      item.kind === "test",
  );
  const testQuestions: LessonExperienceQuestion[] = testStep
    ? (() => {
        const base = testStep.questionIndices
          .map((questionIndex) => questions[questionIndex])
          .filter(
            (item): item is LessonExperienceQuestion => Boolean(item),
          )
          .map((item) => ({
            ...item,
            options: shuffleWithSeed(
              item.options,
              `${topic}-test-${item.id}`,
            ),
          }));
        const extras = (testStep.extraQuestions ?? []).map((item) => ({
          ...item,
          options: shuffleWithSeed(
            item.options,
            `${topic}-test-${item.id}`,
          ),
        }));
        const at = Math.min(
          testStep.extraQuestionsAt ?? base.length,
          base.length,
        );
        return [...base.slice(0, at), ...extras, ...base.slice(at)];
      })()
    : [];

  const practiceScore = practiceSteps.reduce((total, item) => {
    const question = resolvePracticeQuestion(item);
    return (
      total +
      (question && answers[question.id] === question.correctAnswer ? 1 : 0)
    );
  }, 0);
  const testScore = testQuestions.reduce((total, question) => {
    return (
      total + (answers[question.id] === question.correctAnswer ? 1 : 0)
    );
  }, 0);

  const testQuestion =
    step?.kind === "test" ? testQuestions[testIndex] : null;
  const question =
    step?.kind === "practice"
      ? resolvePracticeQuestion(step)
      : testQuestion;
  const selected = question ? answers[question.id] : null;
  const allPairsMatched =
    step?.kind === "matching" &&
    Object.keys(matches).length === step.pairs.length;
  const allSorted =
    step?.kind === "sorting" &&
    Object.keys(sortAnswers).length === step.items.length;
  const sortingEntries = useMemo(
    () =>
      step?.kind === "sorting"
        ? shuffleWithSeed(
            step.items.map((item, index) => ({ item, index })),
            `${topic}-sorting-${stepIndex}`,
          )
        : [],
    [step, stepIndex, topic],
  );
  const allDialogueAnswered =
    step?.kind === "dialogue" &&
    step.turns.every((_, index) => Boolean(dialogueAnswers[index]));
  const confidenceBand =
    step?.kind === "confidence"
      ? (step.bands.find(
          (band) => confidenceValue >= band.min && confidenceValue <= band.max,
        ) ?? step.bands[step.bands.length - 1])
      : null;
  const spectrumZone =
    step?.kind === "spectrum"
      ? (step.zones.find(
          (zone) =>
            spectrumValue >= zone.min && spectrumValue <= zone.max,
        ) ?? step.zones[step.zones.length - 1])
      : null;
  const spectrumColor = mixSpectrumColor(spectrumValue);
  const matchingRightOptions = useMemo(
    () =>
      step?.kind === "matching"
        ? rotateOptions(step.rightOptions, stepIndex + 1)
        : [],
    [step, stepIndex],
  );

  const canContinue = (() => {
    if (!step) return false;
    if (step.kind === "intro") return introReady;
    if (step.kind === "practice" || step.kind === "test") {
      return Boolean(selected);
    }
    if (step.kind === "spot") {
      return spotChoice === step.errorIndex;
    }
    if (step.kind === "matching") return allPairsMatched;
    if (step.kind === "sorting") return allSorted;
    if (step.kind === "dialogue") return Boolean(allDialogueAnswered);
    if (step.kind === "confidence") return confidenceChoice !== null;
    if (step.kind === "spectrum") return true;
    if (step.kind === "word-order") return wordReady;
    return true;
  })();

  const chooseRight = (right: string) => {
    if (!step || step.kind !== "matching" || !selectedLeft) return;
    const pair = step.pairs.find((item) => item.left === selectedLeft);
    if (!pair) return;
    if (pair.right === right) {
      setMatches((current) => ({ ...current, [selectedLeft]: right }));
      setSelectedLeft(null);
      setMatchingError(null);
      return;
    }
    setMatchingError("Не подходит. Попробуй другую форму.");
  };

  const chooseSortCategory = (index: number, category: string) => {
    if (!step || step.kind !== "sorting" || sortAnswers[index]) return;
    const item = step.items[index];
    if (!item) return;
    if (item.category === category) {
      setSortAnswers((current) => ({ ...current, [index]: category }));
      setSortWrong(null);
      return;
    }
    setSortWrong(index);
    setSortShake((current) => current + 1);
  };

  const chooseDialogueOption = (index: number, option: string) => {
    if (!step || step.kind !== "dialogue" || dialogueAnswers[index]) return;
    setDialogueAnswers((current) => ({ ...current, [index]: option }));
  };

  const chooseConfidenceOption = (option: string) => {
    if (!step || step.kind !== "confidence") return;
    setConfidenceChoice(option);
  };

  const chooseSpotWord = (index: number) => {
    setSpotChoice(index);
    if (step.kind === "spot" && index !== step.errorIndex) {
      setSpotShake((current) => current + 1);
    }
  };

  const clearWordTimers = () => {
    wordTimers.current.forEach((timer) => window.clearTimeout(timer));
    wordTimers.current = [];
  };

  const resetWordOrder = () => {
    if (!step || step.kind !== "word-order") return;
    const shuffled = [...step.initialWords].sort(
      () => Math.random() - 0.5,
    );
    setWordBank(shuffled);
    setWordBuild([]);
    setWordStatus("idle");
    setWordReady(false);
  };

  const moveWord = (word: string, index: number, element: HTMLElement) => {
    if (!step || step.kind !== "word-order" || wordStatus !== "idle") return;

    const source = element.getBoundingClientRect();
    const target = assemblyRef.current?.getBoundingClientRect();
    if (target) {
      const ghost = document.createElement("span");
      ghost.textContent = word;
      ghost.className = "word-order-ghost";
      ghost.style.left = `${source.left}px`;
      ghost.style.top = `${source.top}px`;
      ghost.style.width = `${source.width}px`;
      ghost.style.height = `${source.height}px`;
      document.body.appendChild(ghost);
      requestAnimationFrame(() => {
        ghost.style.transform = `translate3d(${target.left + 12 - source.left}px, ${
          target.top + 12 - source.top
        }px, 0) scale(0.94)`;
        ghost.style.opacity = "0.18";
      });
      window.setTimeout(() => ghost.remove(), 420);
    }

    const nextBank = wordBank.filter((_, bankIndex) => bankIndex !== index);
    const nextBuild = [...wordBuild, word];
    setWordBank(nextBank);
    setWordBuild(nextBuild);

    if (nextBuild.length !== step.words.length) return;

    const correct =
      nextBuild.length === step.correct.length &&
      nextBuild.every((part, partIndex) => part === step.correct[partIndex]);

    if (correct) {
      setWordStatus("correct");
      setWordReady(false);
      const timer = window.setTimeout(() => setWordReady(true), 1000);
      wordTimers.current.push(timer);
      return;
    }

    setWordStatus("wrong");
    const resetTimer = window.setTimeout(() => {
      resetWordOrder();
    }, 650);
    wordTimers.current.push(resetTimer);
  };

  useEffect(() => {
    if (!cheatsheetOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCheatsheetOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [cheatsheetOpen]);

  if (!step) return null;

  if (!step) return null;

  const resetForWordOrder = (nextStep: CourseStep | undefined) => {
    if (!nextStep || nextStep.kind !== "word-order") return;
    wordTimers.current.forEach((timer) => window.clearTimeout(timer));
    wordTimers.current = [];
    setWordBank([...nextStep.initialWords]);
    setWordBuild([]);
    setWordStatus("idle");
    setWordReady(false);
  };

  const goNext = () => {
    if (!canContinue) return;
    if (step.kind === "test") {
      if (testIndex < testQuestions.length - 1) {
        setTestIndex((current) => current + 1);
        return;
      }
    }
    if (stepIndex < totalSteps - 1) {
      const nextIndex = stepIndex + 1;
      resetForWordOrder(course[nextIndex]);
      setStepIndex(nextIndex);
    }
  };

  const goBack = () => {
    if (step.kind === "test" && testIndex > 0) {
      setTestIndex((current) => current - 1);
      return;
    }
    if (stepIndex > 0) {
      const previousIndex = stepIndex - 1;
      resetForWordOrder(course[previousIndex]);
      setStepIndex(previousIndex);
    }
  };

  const nextLabel =
    step.kind === "pre-test"
      ? "Начать финальный тест"
      : step.kind === "test" &&
          testIndex === testQuestions.length - 1
        ? "К результату"
        : step.kind === "test"
          ? "Следующий вопрос"
          : "Дальше";

  return (
    <motion.section
      layoutId={topic}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.34,
        ease: "easeOut",
        layout: { type: "spring", stiffness: 260, damping: 34, mass: 0.85 },
      }}
      className="page-shell lesson-page lesson-themed"
      style={
        {
          "--lesson-accent": theme.accent,
          "--lesson-accent-soft": theme.accentSoft,
          "--lesson-accent-border": theme.accentBorder,
          "--lesson-accent-text": theme.accentText,
          "--lesson-glow": theme.glow,
        } as CSSProperties
      }
    >
      <div className="container py-5 sm:py-7">
        <div className="mx-auto max-w-5xl">
          <div className="lesson-surface">
            <div className={`lesson-toolbar ${tour ? "lesson-toolbar--tour" : ""}`}>
              <Link
                href="/learning"
                className="text-[0.68rem] tracking-[0.12em] text-zinc-500 uppercase transition-colors hover:text-zinc-200"
              >
                ← Все уроки
              </Link>
              <div className="lesson-toolbar__actions">
                {showTensesMap ? (
                  <button
                    ref={tensesMapButtonRef}
                    type="button"
                    onClick={() => setTensesMapOpen(true)}
                    className={`lesson-accent-chip flex items-center justify-center gap-2 whitespace-nowrap leading-none rounded-full border px-4 py-2 text-xs font-medium shadow-lg transition-colors ${
                      tour === "map"
                        ? "relative z-[110] ring-4 ring-white/20"
                        : ""
                    }`}
                  >
                    <span className="shrink-0 leading-none" aria-hidden="true">📊</span>
                    <span className="shrink-0 leading-none">Карта времен</span>
                  </button>
                ) : null}
                <button
                  ref={cheatsheetButtonRef}
                  type="button"
                  onClick={() => setCheatsheetOpen(true)}
                  className={`lesson-accent-chip flex items-center justify-center gap-2 whitespace-nowrap leading-none rounded-full border px-4 py-2 text-xs font-medium shadow-lg transition-colors ${
                    tour === "cheatsheet"
                      ? "relative z-[110] ring-4 ring-white/20"
                      : ""
                  }`}
                >
                  <span className="shrink-0 leading-none" aria-hidden="true">💡</span>
                  <span className="shrink-0 leading-none">Шпаргалка</span>
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="lesson-accent-badge">{level}</span>
                <span className="text-[0.58rem] tracking-[0.12em] text-zinc-500 uppercase">
                  {topic.replace(/_/g, " ")}
                </span>
              </div>
              <span className="text-[0.6rem] tracking-[0.14em] text-zinc-500 uppercase">
                {String(stepIndex + 1).padStart(2, "0")} / {String(totalSteps).padStart(2, "0")}
              </span>
            </div>

            <div className="mt-6 h-1 overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="lesson-progress-bar h-full rounded-full transition-[width] duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-4 flex gap-1.5" aria-label="Прогресс урока">
              {course.map((_, index) => (
                <span
                  key={index}
                  className={`lesson-step-dot h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                    index <= stepIndex
                      ? "lesson-step-dot--active"
                      : "bg-white/[0.09]"
                  }`}
                  aria-current={index === stepIndex ? "step" : undefined}
                />
              ))}
            </div>

            <div
              key={stepIndex}
              className={`${stepIndex > 0 ? "lesson-slide-anim " : ""}mt-9`}
            >
              <p className="lesson-accent-eyebrow text-[0.6rem] tracking-[0.18em] uppercase">
                {step.eyebrow}
              </p>

              {step.kind === "intro" ? (
                <LessonIntro
                  key={`${stepIndex}-${step.introType ?? "question"}`}
                  step={step}
                  onReady={setIntroReady}
                />
              ) : null}

              {step.kind === "theory" ? (
                <div>
                  <h1 className="mt-4 max-w-3xl [font-family:var(--font-display)] text-3xl leading-[1.08] font-medium tracking-tight text-[#f0efe9] break-words sm:text-5xl">
                    {step.title}
                  </h1>
                  <div className="mt-5 max-w-2xl space-y-4 text-sm leading-7 text-[#a8afb5]">
                    {step.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                  {step.examples ? (
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      {step.examples.map((example) => (
                        <div
                          key={example.en}
                          className="rounded-2xl border border-white/[0.09] bg-white/[0.025] p-4"
                        >
                          <p className="[font-family:var(--font-display)] text-lg leading-snug text-[#f0efe9]">
                            {example.en}
                          </p>
                          <p className="mt-2 text-xs leading-5 text-[#8f9a9f]">
                            {example.ru}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {step.note ? (
                    <p className="mt-5 border-l border-[#c2a66d]/40 pl-4 text-xs leading-6 text-[#c9b98d]">
                      {step.note}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {(step.kind === "practice" || step.kind === "test") && question ? (
                <div>
                  {step.kind === "test" ? (
                    <p className="mt-5 text-[0.6rem] tracking-[0.12em] text-zinc-500 uppercase">
                      Вопрос {testIndex + 1} из {testQuestions.length}
                    </p>
                  ) : null}
                  {step.kind === "practice" && step.example ? (
                    <div className="mt-5 rounded-2xl border border-[#c2a66d]/20 bg-[#c2a66d]/[0.05] p-4">
                      <p className="text-[0.56rem] tracking-[0.14em] text-[#c2a66d] uppercase">
                        Пример
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#e7e4da]">
                        {step.example.text}
                      </p>
                      {step.example.explanation ? (
                        <p className="mt-1 text-xs leading-5 text-[#a8afb5]">
                          {step.example.explanation}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  <h2 className="mt-4 max-w-3xl [font-family:var(--font-display)] text-2xl leading-tight font-medium text-[#f0efe9] sm:text-4xl">
                    {question.prompt}
                  </h2>
                  <div className="mt-7 grid gap-3 sm:grid-cols-2">
                    {question.options.map((option, index) => {
                      const active = selected === option;
                      const correct = option === question.correctAnswer;
                      const answered = Boolean(selected);
                      const stateClass = !answered
                        ? ""
                        : correct
                          ? "lesson-option--correct"
                          : active
                            ? "lesson-option--wrong"
                            : "lesson-option--muted";
                      return (
                        <button
                          key={option}
                          type="button"
                          disabled={answered}
                          onClick={() =>
                            setAnswers((current) => ({
                              ...current,
                              [question.id]: option,
                            }))
                          }
                          className={`lesson-option flex items-center gap-3 rounded-2xl border px-5 py-5 text-left text-sm transition-colors duration-200 ${stateClass}`}
                        >
                          <span
                            className="lesson-option__marker"
                            aria-hidden="true"
                          >
                            {String.fromCharCode(65 + index)}
                          </span>
                          <span>{option}</span>
                        </button>
                      );
                    })}
                  </div>
                  {selected ? (
                    <div
                      className={`lesson-feedback mt-4 transition-colors duration-300 ${
                        selected === question.correctAnswer
                          ? "lesson-feedback--correct"
                          : "lesson-feedback--wrong"
                      }`}
                    >
                      <p className="lesson-feedback__label">
                        <span aria-hidden="true">
                          {selected === question.correctAnswer ? "✓" : "×"}
                        </span>
                        {selected === question.correctAnswer
                          ? "Верно!"
                          : "Пока неверно"}
                      </p>
                      {selected !== question.correctAnswer ? (
                        <p className="lesson-feedback__answer">
                          Правильный ответ: {question.correctAnswer}
                        </p>
                      ) : null}
                      <p className="lesson-feedback__text">
                        {question.explanation}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {step.kind === "spot" ? (
                <div>
                  <h1 className="mt-4 max-w-3xl [font-family:var(--font-display)] text-3xl leading-[1.08] font-medium tracking-tight text-[#f0efe9] sm:text-5xl">
                    {step.title}
                  </h1>
                  <p className="mt-5 max-w-2xl text-sm leading-7 text-[#a8afb5]">
                    Нажми на слово, которое, по твоему мнению, делает
                    предложение неверным.
                  </p>
                  <div
                    key={`spot-${spotShake}`}
                    className={`mt-7 flex flex-wrap items-center gap-x-2 gap-y-3 rounded-2xl border px-5 py-6 text-xl leading-relaxed text-[#f0efe9] transition-colors duration-300 sm:text-2xl ${
                      spotChoice !== null &&
                      spotChoice !== step.errorIndex
                        ? "spot-sentence--wrong border-rose-300/35 bg-rose-300/[0.045]"
                        : "border-white/[0.09] bg-white/[0.025]"
                    }`}
                  >
                    {step.words.map((word, index) => {
                      const chosen = spotChoice === index;
                      const isError = index === step.errorIndex;
                      return (
                        <button
                          key={`${word}-${index}`}
                          type="button"
                          onClick={() => chooseSpotWord(index)}
                          className={`rounded-lg px-1.5 py-0.5 transition-colors ${
                            chosen && isError
                              ? "bg-rose-400/15 text-rose-200 line-through decoration-rose-300/70 decoration-2"
                              : chosen
                                ? "bg-rose-400/15 text-rose-200"
                                : "hover:bg-white/[0.06] hover:text-white"
                          }`}
                        >
                          {word}
                        </button>
                      );
                    })}
                  </div>
                  {spotChoice !== null && spotChoice === step.errorIndex ? (
                    <p className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-3 text-sm leading-6 text-emerald-100">
                      {step.explanation}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {step.kind === "matching" ? (
                <div>
                  <h1 className="mt-4 max-w-3xl [font-family:var(--font-display)] text-3xl leading-[1.08] font-medium tracking-tight text-[#f0efe9] sm:text-5xl">
                    {step.title}
                  </h1>
                  <p className="mt-5 max-w-2xl text-sm leading-7 text-[#a8afb5]">
                    {step.instruction}
                  </p>
                  <div className="mt-7 grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      {step.pairs.map((pair) => {
                        const matchedRight = matches[pair.left];
                        const active = selectedLeft === pair.left;
                        return (
                          <button
                            key={pair.left}
                            type="button"
                            disabled={Boolean(matchedRight)}
                            onClick={() => {
                              setSelectedLeft(pair.left);
                              setMatchingError(null);
                            }}
                            className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition-all ${
                              matchedRight
                                ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-100"
                                : active
                                  ? "border-[#c2a66d]/60 bg-[#c2a66d]/[0.1] text-[#f0efe9]"
                                  : "border-white/[0.1] bg-white/[0.025] text-[#c4c9c7] hover:border-[#c2a66d]/35"
                            }`}
                          >
                            <span>{pair.left}</span>
                            {matchedRight ? (
                              <span className="text-xs text-emerald-200">
                                {matchedRight} ✓
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                    <div className="space-y-2">
                      {matchingRightOptions.map((right) => {
                        const used = Object.values(matches).includes(right);
                        return (
                          <button
                            key={right}
                            type="button"
                            disabled={!selectedLeft || used}
                            onClick={() => chooseRight(right)}
                            className={`w-full rounded-2xl border px-4 py-3 text-sm transition-all ${
                              used
                                ? "border-emerald-400/15 bg-emerald-400/[0.04] text-emerald-200/50"
                                : "border-white/[0.1] bg-white/[0.025] text-[#f0efe9] hover:border-[#c2a66d]/45 hover:bg-[#c2a66d]/[0.07] disabled:cursor-not-allowed disabled:opacity-40"
                            }`}
                          >
                            {right}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {matchingError ? (
                    <p className="mt-4 text-sm text-rose-200">{matchingError}</p>
                  ) : null}
                  {allPairsMatched ? (
                    <p className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-3 text-sm text-emerald-100">
                      {step.successText ?? "Все пары собраны."}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {step.kind === "word-order" ? (
                <div>
                  <h1 className="mt-4 max-w-3xl [font-family:var(--font-display)] text-3xl leading-[1.08] font-medium tracking-tight text-[#f0efe9] sm:text-5xl">
                    {step.title}
                  </h1>
                  <p className="mt-5 max-w-2xl text-sm leading-7 text-[#a8afb5]">
                    Собери перевод на английский.
                  </p>
                  <p className="mt-4 [font-family:var(--font-display)] text-xl leading-snug text-[#d8c18e]">
                    {step.russian}
                  </p>

                  <div
                    ref={assemblyRef}
                    className={`word-order-panel mt-7 flex min-h-[78px] flex-wrap items-center gap-2 rounded-2xl border p-4 ${
                      wordStatus === "correct"
                        ? "word-order-panel--correct border-emerald-300/30 bg-emerald-300/[0.055]"
                        : wordStatus === "wrong"
                          ? "word-order-panel--wrong border-rose-300/30 bg-rose-300/[0.055]"
                          : "border-[#c2a66d]/25 bg-[#c2a66d]/[0.035]"
                    }`}
                  >
                    {wordBuild.map((word, index) => (
                      <span
                        key={`${word}-${index}`}
                        className="word-order-word word-order-word--assembled inline-flex min-h-9 items-center rounded-lg border border-[#c2a66d]/25 bg-[#c2a66d]/[0.08] px-3 text-sm text-[#f0efe9] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                      >
                        {word}
                      </span>
                    ))}
                    {wordStatus === "correct" ? (
                      <span className="ml-auto text-lg text-emerald-200" aria-hidden="true">
                        ✓
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {wordBank.map((word, index) => (
                      <button
                        key={`${word}-${index}`}
                        type="button"
                        disabled={wordStatus !== "idle"}
                        onClick={(event) =>
                          moveWord(word, index, event.currentTarget)
                        }
                        className="word-order-word word-order-word--bank inline-flex min-h-10 items-center rounded-xl border border-white/[0.11] bg-[#151a1f] px-4 text-sm text-[#e5e2d9] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-[transform,opacity,border-color,background] duration-300 hover:-translate-y-0.5 hover:border-[#c2a66d]/45 hover:bg-[#c2a66d]/[0.06] disabled:cursor-default disabled:opacity-0"
                      >
                        {word}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {step.kind === "sorting" ? (
                <div>
                  <h1 className="mt-4 max-w-3xl [font-family:var(--font-display)] text-3xl leading-[1.08] font-medium tracking-tight text-[#f0efe9] sm:text-5xl">
                    {step.title}
                  </h1>
                  <p className="mt-5 max-w-2xl text-sm leading-7 text-[#a8afb5]">
                    {step.instruction}
                  </p>
                  <div className="mt-7 space-y-3">
                    {sortingEntries.map(({ item, index }) => {
                      const selected = sortAnswers[index];
                      const wrong = sortWrong === index && !selected;
                      return (
                        <div
                          key={`${index}-${wrong ? sortShake : 0}`}
                          className={`sort-item rounded-2xl border p-4 transition-colors ${
                            selected
                              ? "border-emerald-400/20 bg-emerald-400/[0.045]"
                              : wrong
                                ? "sort-item--wrong border-rose-300/30 bg-rose-300/[0.045]"
                                : "border-white/[0.09] bg-white/[0.025]"
                          }`}
                        >
                          <p className="text-sm leading-6 text-[#e7e4da]">
                            {item.text}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {step.categories.map((category) => {
                              const isSelected = selected === category;
                              const isCorrect = category === item.category;
                              return (
                                <button
                                  key={category}
                                  type="button"
                                  disabled={Boolean(selected)}
                                  onClick={() =>
                                    chooseSortCategory(index, category)
                                  }
                                  className={`rounded-full border px-3 py-1.5 text-[0.66rem] transition-colors ${
                                    isSelected && isCorrect
                                      ? "border-emerald-400/30 bg-emerald-400/[0.1] text-emerald-100"
                                      : selected
                                        ? "border-white/[0.06] text-[#687378] opacity-50"
                                        : "border-white/[0.12] text-[#c4c9c7] hover:border-[#c2a66d]/45 hover:bg-[#c2a66d]/[0.07] hover:text-[#f0efe9]"
                                  }`}
                                >
                                  {category}
                                </button>
                              );
                            })}
                          </div>
                          {selected ? (
                            <p className="mt-2 text-xs leading-5 text-[#9fcfac]">
                              {item.explanation}
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                  {allSorted ? (
                    <p className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-3 text-sm text-emerald-100">
                      Все ситуации разложены верно. Теперь видно, какая форма
                      соответствует каждой ситуации.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {step.kind === "dialogue" ? (
                <div>
                  <h1 className="mt-4 max-w-3xl [font-family:var(--font-display)] text-3xl leading-[1.08] font-medium tracking-tight text-[#f0efe9] sm:text-5xl">
                    {step.title}
                  </h1>
                  <p className="mt-5 max-w-2xl text-sm leading-7 text-[#a8afb5]">
                    {step.instruction}
                  </p>
                  <div className="lesson-dialogue mt-7">
                    {step.turns.map((turn, index) => {
                      const answer = dialogueAnswers[index];
                      const firstUnanswered = step.turns.findIndex(
                        (_, turnIndex) => !dialogueAnswers[turnIndex],
                      );
                      const isCurrent = !answer && index === firstUnanswered;
                      if (!answer && !isCurrent) return null;

                      const isCorrect = answer === turn.correctOption;

                      return (
                        <div className="lesson-dialogue__turn" key={index}>
                          <div className="lesson-dialogue__row lesson-dialogue__row--a">
                            <span className="lesson-dialogue__avatar">
                              {step.speakerA ?? "A"}
                            </span>
                            <div>
                              <p className="lesson-dialogue__name">
                                {step.speakerA ?? "A"}
                              </p>
                              <p className="lesson-dialogue__bubble">
                                {turn.line}
                              </p>
                            </div>
                          </div>

                          {answer ? (
                            <div className="lesson-dialogue__row lesson-dialogue__row--b">
                              <span className="lesson-dialogue__avatar">
                                {step.speakerB ?? "B"}
                              </span>
                              <div>
                                <p className="lesson-dialogue__name">
                                  {step.speakerB ?? "B"}
                                </p>
                                <p
                                  className={`lesson-dialogue__bubble lesson-dialogue__bubble--b ${
                                    isCorrect
                                      ? "lesson-dialogue__bubble--correct"
                                      : "lesson-dialogue__bubble--wrong"
                                  }`}
                                >
                                  {answer}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="lesson-dialogue__options">
                              {shuffleWithSeed(
                                turn.options,
                                `${topic}-dialogue-${index}`,
                              ).map((option) => (
                                <button
                                  key={option}
                                  type="button"
                                  onClick={() =>
                                    chooseDialogueOption(index, option)
                                  }
                                  className="lesson-dialogue__option"
                                >
                                  {option}
                                </button>
                              ))}
                            </div>
                          )}

                          {answer ? (
                            <p
                              className={`lesson-dialogue__feedback ${
                                isCorrect
                                  ? "lesson-dialogue__feedback--correct"
                                  : "lesson-dialogue__feedback--wrong"
                              }`}
                            >
                              {isCorrect
                                ? "Верно. "
                                : `Лучший вариант: ${turn.correctOption}. `}
                              {turn.explanation}
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {step.kind === "spectrum" ? (
                <div
                  className="spectrum-step"
                  style={
                    {
                      "--spectrum-accent": spectrumColor,
                    } as CSSProperties
                  }
                >
                  <h1 className="mt-4 max-w-3xl [font-family:var(--font-display)] text-3xl leading-[1.08] font-medium tracking-tight text-[#f0efe9] sm:text-5xl">
                    {step.title}
                  </h1>
                  <p className="mt-5 max-w-2xl text-sm leading-7 text-[#a8afb5]">
                    {step.instruction}
                  </p>

                  <div className="spectrum-card mt-7">
                    <p className="spectrum-sentence">
                      <span>{step.baseBefore} </span>
                      <span className="spectrum-word">
                        <AnimatePresence mode="sync" initial={false}>
                          <motion.span
                            key={spectrumZone?.word}
                            initial={{
                              opacity: 0,
                              y: 6,
                              filter: "blur(12px)",
                              scale: 0.97,
                            }}
                            animate={{
                              opacity: 1,
                              y: 0,
                              filter: "blur(0px)",
                              scale: 1,
                              transition: {
                                duration: 0.55,
                                delay: 0.08,
                                ease: [0.22, 1, 0.36, 1],
                              },
                            }}
                            exit={{
                              opacity: 0,
                              y: -6,
                              filter: "blur(12px)",
                              scale: 1.03,
                              transition: {
                                duration: 0.45,
                                ease: [0.4, 0, 1, 1],
                              },
                            }}
                          >
                            {spectrumZone?.word}
                          </motion.span>
                        </AnimatePresence>
                      </span>
                      <span> {step.baseAfter}</span>
                    </p>

                    <AnimatePresence mode="wait" initial={false}>
                      <motion.p
                        key={spectrumZone?.label}
                        className="spectrum-translation"
                        initial={{ opacity: 0, y: 4, filter: "blur(6px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -4, filter: "blur(6px)" }}
                        transition={{ duration: 0.36, ease: "easeOut" }}
                      >
                        {spectrumZone?.translation}
                      </motion.p>
                    </AnimatePresence>
                  </div>

                  <div className="spectrum-control mt-6">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={spectrumValue}
                      onChange={(event) =>
                        setSpectrumValue(Number(event.target.value))
                      }
                      className="spectrum-slider"
                      aria-label="Оттенок уверенности"
                    />
                  </div>
                </div>
              ) : null}

              {step.kind === "confidence" ? (
                <div>
                  <h1 className="mt-4 max-w-3xl [font-family:var(--font-display)] text-3xl leading-[1.08] font-medium tracking-tight text-[#f0efe9] sm:text-5xl">
                    {step.title}
                  </h1>
                  <div className="lesson-scenario-card mt-6 rounded-2xl border border-white/[0.1] bg-white/[0.03] p-6">
                    <p className="text-[0.58rem] tracking-[0.16em] text-[#c2a66d] uppercase">
                      Ситуация
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[#e4e0d6]">
                      {step.situation}
                    </p>
                  </div>

                  <div className="confidence-panel mt-6">
                    <div className="confidence-panel__head">
                      <p>{step.prompt}</p>
                      <strong>{confidenceValue}%</strong>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={confidenceValue}
                      disabled={confidenceChoice !== null}
                      onChange={(event) => {
                        setConfidenceValue(Number(event.target.value));
                        setConfidenceChoice(null);
                      }}
                      className="confidence-slider"
                      aria-label="Уровень уверенности"
                    />
                    <p className="confidence-panel__band">
                      {confidenceBand?.label}
                    </p>

                    <div className="confidence-options">
                      {step.options.map((option) => {
                        const selected = confidenceChoice === option;
                        const correct = option === confidenceBand?.answer;
                        const answered = confidenceChoice !== null;
                        return (
                          <button
                            key={option}
                            type="button"
                            disabled={answered}
                            onClick={() => chooseConfidenceOption(option)}
                            className={`confidence-option ${
                              !answered
                                ? ""
                                : correct
                                  ? "confidence-option--correct"
                                  : selected
                                    ? "confidence-option--wrong"
                                    : "confidence-option--muted"
                            }`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>

                    {confidenceChoice ? (
                      <p
                        className={`confidence-feedback ${
                          confidenceChoice === confidenceBand?.answer
                            ? "confidence-feedback--correct"
                            : "confidence-feedback--wrong"
                        }`}
                      >
                        {confidenceChoice === confidenceBand?.answer
                          ? "Верно. "
                          : `При такой уверенности лучше: ${confidenceBand?.answer}. `}
                        {confidenceBand?.explanation}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {step.kind === "formula" ? (
                <div>
                  <h1 className="mt-4 max-w-3xl [font-family:var(--font-display)] text-3xl leading-[1.08] font-medium tracking-tight text-[#f0efe9] sm:text-5xl">
                    {step.title}
                  </h1>
                  <div className="mt-7 space-y-3">
                    {step.lines.map((line) => (
                      <div
                        key={line.label}
                        className="rounded-2xl border border-white/[0.09] bg-white/[0.025] p-4 sm:p-5"
                      >
                        <p className="text-[0.56rem] tracking-[0.14em] text-[#9aa6aa] uppercase">
                          {line.label}
                        </p>
                        <p className="mt-2 text-sm font-medium text-[#f0efe9] sm:text-base">
                          {line.formula}
                        </p>
                        <p className="mt-2 text-xs text-[#c2a66d]">
                          {line.example}
                        </p>
                      </div>
                    ))}
                  </div>
                  {step.note ? (
                    <p className="mt-5 text-xs leading-6 text-[#8f9a9f]">
                      {step.note}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {step.kind === "rules" ? (
                <div>
                  <h1 className="mt-4 max-w-3xl [font-family:var(--font-display)] text-3xl leading-[1.08] font-medium tracking-tight text-[#f0efe9] sm:text-5xl">
                    {step.title}
                  </h1>
                  <p className="mt-5 max-w-2xl text-sm leading-7 text-[#a8afb5]">
                    {step.intro}
                  </p>
                  <div className="mt-6 space-y-3">
                    {step.rules.map((rule) => (
                      <div
                        key={rule.pattern}
                        className="rounded-2xl border border-white/[0.09] bg-white/[0.025] p-4"
                      >
                        <p className="text-sm text-[#e8e5dc]">{rule.pattern}</p>
                        <p className="mt-2 text-xs text-[#c2a66d]">
                          {rule.example}
                        </p>
                      </div>
                    ))}
                  </div>
                  {step.note ? (
                    <p className="mt-5 border-l border-[#799eac]/40 pl-4 text-xs leading-6 text-[#b2c7cc]">
                      {step.note}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {step.kind === "pre-test" ? (
                <div>
                  <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#c2a66d]/30 bg-[#c2a66d]/[0.08] text-xl text-[#d8c18e]">
                    ✦
                  </div>
                  <h1 className="mt-5 [font-family:var(--font-display)] text-3xl leading-tight text-[#f0efe9] sm:text-5xl">
                    {step.title}
                  </h1>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-[#a8afb5]">
                    {step.lead}
                  </p>
                  <div className="mt-7 grid gap-3 sm:grid-cols-3">
                    {step.summary.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-2xl border border-white/[0.09] bg-white/[0.025] p-4"
                      >
                        <p className="text-[0.56rem] tracking-[0.14em] text-[#c2a66d] uppercase">
                          {item.label}
                        </p>
                        <p className="mt-2 text-xs leading-6 text-[#c8cdca]">
                          {item.text}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-7 flex items-center gap-3 rounded-2xl border border-[#c2a66d]/20 bg-[#c2a66d]/[0.05] px-4 py-3">
                    <span className="text-sm text-[#d8c18e]" aria-hidden="true">
                      ✓
                    </span>
                    <p className="text-xs leading-5 text-[#c9b98d]">
                      Финальный тест · {testQuestions.length} вопросов · закрепление материала
                    </p>
                  </div>
                </div>
              ) : null}

              {step.kind === "result" ? (
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#c2a66d]/30 bg-[#c2a66d]/[0.08] text-xl text-[#d8c18e]">
                    ✓
                  </div>
                  <h1 className="mt-5 [font-family:var(--font-display)] text-3xl leading-tight text-[#f0efe9] sm:text-5xl">
                    {step.title}
                  </h1>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-[#a8afb5]">
                    {step.lead}
                  </p>
                  {!isLibrary && outroText ? (
                    <div className="mt-6 rounded-2xl border border-[#7fc4a3]/20 bg-[#7fc4a3]/[0.05] p-5">
                      <p className="text-[0.56rem] tracking-[0.14em] text-[#9fd5b6] uppercase">
                        Что дальше
                      </p>
                      <p className="mt-3 text-sm leading-7 text-[#c8d4cd]">
                        {outroText}
                      </p>
                    </div>
                  ) : null}
                  <div className="mt-6 rounded-2xl border border-[#c2a66d]/20 bg-[#c2a66d]/[0.05] p-5">
                    <p className="text-[0.56rem] tracking-[0.14em] text-[#c2a66d] uppercase">
                      Короткая шпаргалка
                    </p>
                    <div className="mt-3 space-y-2 text-sm text-[#e4e0d6]">
                      {step.formula.map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </div>
                  </div>
                  <p className="mt-5 text-sm text-[#a8afb5]">
                    Практика: {practiceScore} из {practiceSteps.length} верно.
                    {testStep ? (
                      <>
                        {" "}
                        Финальный тест: {testScore} из{" "}
                        {testQuestions.length}.
                      </>
                    ) : null}
                  </p>
                  <p className="mt-2 text-xs text-[#c2a66d]">
                    Общий результат: {practiceScore + testScore} из{" "}
                    {practiceSteps.length + testQuestions.length}.
                  </p>
                  <div className="mt-7 flex flex-wrap items-center gap-3">
                    {courseId && !isLibrary ? (
                      <>
                        {nextLessonTopic ? (
                          <Link
                            href={`/lesson/${nextLessonTopic}?context=program&step=0`}
                            className="lesson-accent-button rounded-full px-6 py-3 text-sm font-semibold shadow-xl transition-colors"
                          >
                            Следующий урок →
                          </Link>
                        ) : (
                          <Link
                            href="/learning"
                            className="lesson-accent-button rounded-full px-6 py-3 text-sm font-semibold shadow-xl transition-colors"
                          >
                            Завершить программу →
                          </Link>
                        )}
                        <Link
                          href={`/courses/${courseId}`}
                          className="rounded-full border border-white/[0.1] bg-white/[0.025] px-5 py-2.5 text-xs font-medium text-[#c4c9c7] transition-colors hover:border-white/20 hover:text-white"
                        >
                          Вернуться к программе
                        </Link>
                      </>
                    ) : (
                      <Link
                        href="/learning"
                        className="lesson-accent-button rounded-full px-6 py-3 text-sm font-semibold shadow-xl transition-colors"
                      >
                        Вернуться к темам
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={goBack}
                      className="rounded-full border border-white/[0.1] bg-white/[0.025] px-5 py-2.5 text-xs font-medium text-[#c4c9c7] transition-colors hover:border-white/20 hover:text-white"
                    >
                      ← Назад
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        clearWordTimers();
                        resetWordOrder();
                        setAnswers({});
                        setIntroReady(false);
                        setSpotChoice(null);
                        setSpotShake(0);
                        setSortAnswers({});
                        setSortWrong(null);
                        setSortShake(0);
                        setDialogueAnswers({});
                        setConfidenceValue(50);
                        setConfidenceChoice(null);
                        setSpectrumValue(50);
                        setSelectedLeft(null);
                        setMatches({});
                        setMatchingError(null);
                        setTestIndex(0);
                        setStepIndex(0);
                      }}
                      className="text-xs text-[#8f9a9f] transition-colors hover:text-[#f0efe9]"
                    >
                      Пройти ещё раз
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            {step.kind !== "result" ? (
              <div className="mt-9 flex items-center justify-between gap-4 border-t border-white/[0.08] pt-5">
                <button
                  type="button"
                  onClick={goBack}
                  disabled={stepIndex === 0}
                  className="rounded-full border border-white/[0.1] bg-white/[0.025] px-5 py-2.5 text-xs font-medium text-[#c4c9c7] transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  ← Назад
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!canContinue}
                  className="lesson-accent-button rounded-full px-5 py-2.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-30"
                >
                  {nextLabel} →
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {tour ? (
          <TutorialOverlay
            key={tour}
            targetRef={
              tour === "map" ? tensesMapButtonRef : cheatsheetButtonRef
            }
            text={
              tour === "map"
                ? "Здесь ты всегда можешь подсмотреть структуру всех времен, если забудешь формулу"
                : "Если забудешь правило, просто открой шпаргалку. Там вся теория этого урока"
            }
            onClose={closeTour}
          />
        ) : null}
      </AnimatePresence>

      {cheatsheetOpen ? (
        <LessonModal
          id="course-cheatsheet-title"
          eyebrow="Шпаргалка"
          title={title}
          onClose={() => setCheatsheetOpen(false)}
        >
          <MarkdownContent content={content} />
        </LessonModal>
      ) : null}

      {tensesMapOpen && showTensesMap ? (
        <LessonModal
          id="course-tenses-map-title"
          eyebrow="Все времена"
          title="Все времена"
          onClose={() => setTensesMapOpen(false)}
          wide
          chart
        >
          <MarkdownContent content={tensesChart} />
        </LessonModal>
      ) : null}
    </motion.section>
  );
}

function LessonModal({
  id,
  eyebrow,
  title,
  onClose,
  wide = false,
  chart = false,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  onClose: () => void;
  wide?: boolean;
  chart?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby={id}
      onClick={onClose}
    >
      <div
        className={`lesson-modal relative flex max-h-[85vh] w-full flex-col overflow-hidden rounded-3xl ${
          wide ? "max-w-5xl" : "max-w-2xl"
        } ${chart ? "lesson-modal--chart" : ""}`}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть окно"
          className="lesson-modal__close"
        >
          ×
        </button>
        <div className="lesson-modal__head">
          <p className="lesson-modal__eyebrow">{eyebrow}</p>
          <h2
            id={id}
            className="mt-2 [font-family:var(--font-display)] text-3xl leading-tight text-zinc-50"
          >
            {title}
          </h2>
        </div>
        <div className="lesson-modal__body">
          {children}
        </div>
      </div>
    </div>
  );
}
