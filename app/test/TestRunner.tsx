"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type {
  AnswerReview,
  Confidence,
  Item,
  ReadingPassage,
  Skill,
  SkillStats,
  TestResult,
} from "@/lib/cefr";
import { CefrTestEngine } from "@/lib/cefr/engine";
import { getLevelGuide } from "@/lib/cefr/level-guide";
import {
  isCefrTestAnalysis,
  type CefrTestAnalysis,
} from "@/lib/cefr/test-analysis";
import { saveTestResult } from "./actions";
import {
  createTrialItemPool,
  trialBank,
} from "@/lib/cefr/bank/trial-bank";
import {
  CONFIDENCE_EXPLANATIONS,
  CONFIDENCE_NOTE,
  CONFIDENCE_TITLES,
  SKILL_TITLES,
  displayStem,
  instructionFor,
  progressPercent,
} from "@/lib/cefr/ui/presentation";

interface Session {
  engine: CefrTestEngine;
  item: Item;
  answered: number;
  seed: number;
}

interface AnswerStep {
  item: Item;
  selectedOptionId: string;
}

const SKILL_BADGES: Record<Skill, string> = {
  grammar: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  vocabulary: "border-violet-400/30 bg-violet-400/10 text-violet-200",
  reading: "border-amber-400/30 bg-amber-400/10 text-amber-200",
};

const CONFIDENCE_BADGES: Record<Confidence, string> = {
  high: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  medium: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  low: "border-zinc-400/30 bg-zinc-400/10 text-zinc-300",
};

function createSeed(): number {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function"
  ) {
    return crypto.getRandomValues(new Uint32Array(1))[0];
  }
  return Date.now() >>> 0;
}

export default function TestRunner() {
  const [session, setSession] = useState<Session | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [finishOpen, setFinishOpen] = useState(false);
  const [history, setHistory] = useState<AnswerStep[]>([]);
  const [viewIndex, setViewIndex] = useState<number | null>(null);
  const lastSeed = useRef<number | null>(null);
  const savedSeedRef = useRef<number | null>(null);
  const [savedResultId, setSavedResultId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const startSession = () => {
    try {
      let seed = createSeed();
      if (seed === lastSeed.current) {
        seed = (seed + 1) >>> 0;
      }
      lastSeed.current = seed;
      const engine = new CefrTestEngine({
        bank: createTrialItemPool(),
        seed,
      });
      const item = engine.currentItem;
      if (!item) {
        throw new Error("Банк не вернул первое задание.");
      }
      setSession({
        engine,
        item,
        answered: engine.answeredCount,
        seed,
      });
      setHistory([]);
      setViewIndex(null);
      setSelected(null);
      setResult(null);
      setError(null);
      setFinishOpen(false);
      savedSeedRef.current = null;
      setSavedResultId(null);
      setSaveError(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Не удалось запустить тест.",
      );
    }
  };

  useEffect(() => {
    if (!result || savedSeedRef.current === result.seed) return;
    savedSeedRef.current = result.seed;

    const score =
      result.stats.answered > 0
        ? Math.round(
            (result.stats.correct / result.stats.answered) * 100,
          )
        : 0;

    const mistakes = result.review
      .filter((entry) => !entry.correct)
      .map((entry) => {
        const selected = entry.item.options.find(
          (option) => option.id === entry.selectedOptionId,
        );
        const correct = entry.item.options.find(
          (option) => option.id === entry.item.correctOptionId,
        );
        return {
          topic: entry.item.topic,
          skill: entry.item.skill,
          question: entry.item.stem,
          correctAnswer: correct?.text ?? "",
          selectedAnswer: selected?.text ?? "",
          explanation: entry.item.explanation ?? null,
        };
      });

    void saveTestResult({
      level: result.overall.level,
      status: result.overall.status,
      confidence: result.overall.confidence,
      score,
      correct: result.stats.correct,
      answered: result.stats.answered,
      total: result.total,
      completed: result.completed,
      seed: result.seed,
      algorithmVersion: result.algorithmVersion,
      mistakes,
    })
      .then((response) => {
        if ("id" in response) {
          setSavedResultId(response.id);
        } else {
          setSaveError(response.error);
        }
      })
      .catch(() => {
        setSaveError("Не удалось сохранить результат.");
      });
  }, [result]);

  const saveEditedAnswer = () => {
    if (!session || viewIndex === null || !selected) return;

    try {
      const engine = new CefrTestEngine({
        bank: createTrialItemPool(),
        seed: session.seed,
      });

      for (let index = 0; index < viewIndex; index += 1) {
        const step = history[index];
        if (!step || engine.currentItem?.id !== step.item.id) {
          throw new Error("Не удалось восстановить предыдущие ответы.");
        }
        engine.submitAnswer(step.selectedOptionId);
      }

      const edited = history[viewIndex];
      if (!edited || engine.currentItem?.id !== edited.item.id) {
        throw new Error("Не удалось вернуться к изменяемому вопросу.");
      }

      const outcome = engine.submitAnswer(selected);
      const nextHistory = [
        ...history.slice(0, viewIndex),
        { item: edited.item, selectedOptionId: selected },
      ];
      setHistory(nextHistory);

      if (outcome.finished) {
        setResult(engine.getResult());
        setSession(null);
        setViewIndex(null);
        setSelected(null);
        setFinishOpen(false);
        return;
      }

      if (!outcome.nextItem) {
        throw new Error("Банк не вернул следующее задание.");
      }

      setSession({
        engine,
        item: outcome.nextItem,
        answered: outcome.progress.answered,
        seed: session.seed,
      });
      setViewIndex(null);
      setSelected(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Не удалось сохранить изменённый ответ.",
      );
    }
  };

  const submit = () => {
    if (!session || !selected) return;

    if (viewIndex !== null) {
      saveEditedAnswer();
      return;
    }

    try {
      const step: AnswerStep = {
        item: session.item,
        selectedOptionId: selected,
      };
      const outcome = session.engine.submitAnswer(selected);
      setHistory((previous) => [...previous, step]);

      if (outcome.finished) {
        setResult(session.engine.getResult());
        setSession(null);
        setSelected(null);
        setFinishOpen(false);
        return;
      }

      if (!outcome.nextItem) {
        throw new Error("Банк не вернул следующее задание.");
      }

      setSession({
        engine: session.engine,
        item: outcome.nextItem,
        answered: outcome.progress.answered,
        seed: session.seed,
      });
      setSelected(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Не удалось сохранить ответ.",
      );
    }
  };

  const goBack = () => {
    if (!session) return;
    const index =
      viewIndex === null ? history.length - 1 : viewIndex - 1;
    if (index < 0 || !history[index]) return;
    setViewIndex(index);
    setSelected(history[index].selectedOptionId);
  };

  const cancelEdit = () => {
    setViewIndex(null);
    setSelected(null);
  };

  const finishEarly = () => {
    if (!session) return;

    try {
      setResult(session.engine.finishEarly());
      setSession(null);
      setSelected(null);
      setFinishOpen(false);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Не удалось завершить тест.",
      );
    }
  };

  if (error) {
    return (
      <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-6">
        <p className="text-sm font-medium text-red-200">
          Тест не удалось запустить
        </p>
        <p className="mt-2 text-sm text-red-200/80">{error}</p>
        <button
          type="button"
          onClick={startSession}
          className="mt-4 rounded-full bg-white px-5 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  if (result) {
    return (
      <ResultScreen
        result={result}
        onRestart={startSession}
        savedResultId={savedResultId}
        saveError={saveError}
      />
    );
  }

  if (!session) {
    return (
      <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-6 sm:p-8">
        <div className="mb-2 flex items-center justify-between text-xs text-zinc-400">
          <span>Перед началом</span>
          <span>0%</span>
        </div>
        <div
          role="progressbar"
          aria-label="Прогресс теста"
          aria-valuemin={0}
          aria-valuemax={30}
          aria-valuenow={0}
          className="h-2 w-full overflow-hidden rounded-full bg-white/10"
        >
          <div className="h-full w-0 rounded-full bg-emerald-400" />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-zinc-400">
          <span>Пройдено: 0 из 30</span>
          <span>Осталось: 30</span>
        </div>

        <h2 className="mt-6 text-xl font-semibold text-zinc-50">
          30 вопросов
        </h2>
        <ul className="mt-4 space-y-2 text-sm leading-6 text-zinc-400">
          <li>Grammar, Vocabulary и Reading — по 10 вопросов.</li>
          <li>
            Сложность подбирается адаптивно под каждого человека. Это не
            влияет на итоговую оценку: большое число верных ответов на
            лёгкие вопросы не равноценно такому же числу верных ответов на
            сложные.
          </li>
          <li>
            Правильные ответы не показываются до завершения теста.
          </li>
        </ul>

        <button
          type="button"
          onClick={startSession}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200"
        >
          Начать тест
        </button>
      </div>
    );
  }

  const total = session.engine.totalQuestions;
  const remaining = total - session.answered;
  const percent = progressPercent(session.answered, total);
  const questionInSkill = session.engine.progress.questionInSkill;
  const activeStep =
    viewIndex !== null ? history[viewIndex] : undefined;
  const editing = activeStep !== undefined;
  const activeItem = activeStep ? activeStep.item : session.item;
  const activeGroup = editing ? null : session.engine.readingGroup;
  const questionNumber =
    editing && viewIndex !== null
      ? viewIndex + 1
      : Math.min(session.answered + 1, total);
  const isLast = !editing && questionNumber === total;
  const passage = activeItem.passageId
    ? trialBank.passageById.get(activeItem.passageId)
    : undefined;
  const instruction = instructionFor(
    activeItem.skill,
    activeItem.format,
    activeItem.cefrLevel,
  );
  const stem = displayStem(activeItem);
  const canGoBack =
    viewIndex === null ? history.length > 0 : viewIndex > 0;

  return (
    <div>
      <div className="mb-3">
        <div className="mb-2 flex items-center justify-between text-xs text-zinc-400">
          <span>
            {SKILL_TITLES[activeItem.skill]} ·{" "}
            {editing
              ? `изменение ответа на вопрос ${questionNumber}`
              : `вопрос ${questionInSkill} из ${session.engine.totalQuestions / 3}`}
          </span>
          <span>{Math.round(percent)}%</span>
        </div>
        <div
          role="progressbar"
          aria-label="Прогресс теста"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={session.answered}
          className="h-2 w-full overflow-hidden rounded-full bg-white/10"
        >
          <div
            className="h-full rounded-full bg-emerald-400 transition-[width] duration-500 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-zinc-400">
          <span>
            Пройдено: {session.answered} из {total}
          </span>
          <span>Осталось: {remaining}</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={goBack}
            disabled={!canGoBack}
            className="inline-flex h-9 items-center justify-center rounded-full border border-white/20 px-4 text-xs font-semibold text-zinc-200 transition-colors hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:border-white/10 disabled:text-zinc-600"
          >
            ← Назад
          </button>
          {editing ? (
            <button
              type="button"
              onClick={cancelEdit}
              className="inline-flex h-9 items-center justify-center rounded-full border border-white/15 px-4 text-xs font-medium text-zinc-300 transition-colors hover:border-white/30 hover:text-white"
            >
              Вернуться к текущему
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setFinishOpen(true)}
              className="inline-flex h-9 items-center justify-center rounded-full bg-amber-400 px-4 text-xs font-semibold text-zinc-950 shadow-lg shadow-amber-950/30 transition-colors hover:bg-amber-300"
            >
              Завершить тест
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="mb-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs leading-5 text-amber-100">
          Вы изменяете ответ на вопрос {questionNumber}. После сохранения
          последующие ответы будут сброшены, а следующие вопросы подберутся
          заново.
        </div>
      ) : null}

      <section className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4 shadow-2xl shadow-black/20 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${SKILL_BADGES[activeItem.skill]}`}
          >
            {SKILL_TITLES[activeItem.skill]}
          </span>
          <span className="text-xs text-zinc-500">
            Вопрос {questionNumber} из {total}
            {activeGroup
              ? ` · текст ${activeGroup.number}, вопрос ${activeGroup.index} из ${activeGroup.size}`
              : ""}
          </span>
        </div>

        <p className="mt-3 text-xs font-medium tracking-[0.15em] text-zinc-500 uppercase">
          Инструкция
        </p>
        <p className="mt-1 text-sm text-zinc-400">{instruction}</p>

        {passage ? (
          activeGroup && activeGroup.index > 1 ? (
            <details className="mt-5 rounded-xl border border-white/10 bg-zinc-950/50 p-4">
              <summary className="cursor-pointer text-sm font-medium text-zinc-300">
                Показать текст ещё раз
              </summary>
              <div className="mt-3">
                <PassageContent passage={passage} />
              </div>
            </details>
          ) : (
            <article className="mt-5 rounded-xl border border-white/10 bg-zinc-950/50 p-4 sm:p-5">
              <PassageContent passage={passage} />
            </article>
          )
        ) : null}

        <h2 className="mt-4 text-lg leading-7 font-medium text-zinc-50 sm:text-xl">
          {stem}
        </h2>

        <div
          role="radiogroup"
          aria-label="Варианты ответа"
          className="mt-4 grid gap-2"
        >
          {activeItem.options.map((option) => {
            const active = selected === option.id;

            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSelected(option.id)}
                className={`flex w-full items-start gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                  active
                    ? "border-emerald-400 bg-emerald-400/10"
                    : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]"
                }`}
              >
                <span
                  className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                    active
                      ? "border-emerald-400 bg-emerald-400 text-zinc-950"
                      : "border-white/15 text-zinc-400"
                  }`}
                >
                  {option.id}
                </span>
                <span className="text-sm leading-6 text-zinc-100 sm:text-base">
                  {option.text}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-zinc-500">
            Правильные ответы появятся только после завершения теста.
          </p>
          <button
            type="button"
            onClick={submit}
            disabled={!selected}
            className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-zinc-500"
          >
            {editing
              ? "Сохранить и продолжить"
              : isLast
                ? "Показать результат"
                : "Ответить"}
          </button>
        </div>
      </section>

      {finishOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setFinishOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="finish-title"
            className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl"
          >
            <h2
              id="finish-title"
              className="text-lg font-semibold text-zinc-50"
            >
              Завершить тест?
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Вы ещё не ответили на все вопросы. Завершить тест и посмотреть
              результат?
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Отвечено: {session.answered} из {total}. Неотвеченные вопросы
              не будут считаться ошибками.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setFinishOpen(false)}
                className="inline-flex h-10 items-center justify-center rounded-full border border-white/15 px-5 text-sm font-medium text-zinc-300 transition-colors hover:border-white/30 hover:text-white"
              >
                Вернуться к тесту
              </button>
              <button
                type="button"
                onClick={finishEarly}
                className="inline-flex h-10 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200"
              >
                Завершить тест
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PassageContent({ passage }: { passage: ReadingPassage }) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs tracking-[0.12em] text-zinc-500 uppercase">
        <span>Reading text</span>
        <span>{passage.wordCount} words</span>
      </div>
      <h3 className="mt-2 text-lg font-semibold text-zinc-100">
        {passage.title}
      </h3>
      <p className="mt-3 text-sm leading-7 whitespace-pre-line text-zinc-300 sm:text-base">
        {passage.text}
      </p>
    </>
  );
}

function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative z-40 inline-flex max-w-full flex-col items-start">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${CONFIDENCE_BADGES[confidence]}`}
      >
        Уверенность: {CONFIDENCE_TITLES[confidence]}
        <button
          type="button"
          aria-label="Что означает уверенность"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center text-current"
        >
          <svg
            viewBox="0 0 20 20"
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          >
            <circle cx="10" cy="10" r="8" />
            <path d="M10 9.1v4.5" />
            <circle
              cx="10"
              cy="6.3"
              r="1.1"
              fill="currentColor"
              stroke="none"
            />
          </svg>
        </button>
      </span>
      {open ? (
        <div
          role="status"
          className="confidence-tooltip absolute top-full right-0 z-[100] mt-2 w-72 max-w-[calc(100vw-3rem)] rounded-xl border p-3 text-xs leading-5"
        >
          <p>{CONFIDENCE_EXPLANATIONS[confidence]}</p>
          <p className="mt-2 text-zinc-500">{CONFIDENCE_NOTE}</p>
        </div>
      ) : null}
    </div>
  );
}

function confidenceCaveat(confidence: Confidence): string {
  if (confidence === "high") {
    return "Оценка опирается на последовательные ответы, но на границе уровня небольшие колебания возможны.";
  }
  if (confidence === "medium") {
    return "Оценка вероятна, но часть ответов была неоднозначной — возможен соседний уровень.";
  }
  return "Рассматривайте результат как ориентир: данных или последовательности ответов недостаточно для точной оценки.";
}

function ResultScreen({
  result,
  onRestart,
  savedResultId,
  saveError,
}: {
  result: TestResult;
  onRestart: () => void;
  savedResultId: string | null;
  saveError: string | null;
}) {
  const overallMissing = result.overall.level === null;
  const overallGuide = result.overall.level
    ? getLevelGuide(result.overall.level)
    : null;
  const early = !result.completed;
  const percent = early
    ? progressPercent(result.answered, result.total)
    : 100;
  const speakingHref = result.overall.level
    ? `/speaking?level=${encodeURIComponent(result.overall.level)}`
    : "/speaking";

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-5 sm:p-6">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>{early ? "Тест завершён досрочно" : "Тест завершён"}</span>
          <span>{Math.round(percent)}%</span>
        </div>
        <div
          role="progressbar"
          aria-label="Прогресс теста"
          aria-valuemin={0}
          aria-valuemax={result.total}
          aria-valuenow={result.answered}
          className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10"
        >
          <div
            className="h-full rounded-full bg-emerald-400 transition-[width] duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-zinc-400">
          <span>
            Пройдено: {result.answered} из {result.total}
          </span>
          <span>Осталось: {result.unanswered}</span>
        </div>
      </div>

      {savedResultId ? (
        <Link
          href={`/account/results/${savedResultId}`}
          className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-100 transition-colors hover:border-emerald-300/40 hover:bg-emerald-400/15"
        >
          <span>Результат сохранён в личном кабинете</span>
          <span aria-hidden="true">Открыть разбор →</span>
        </Link>
      ) : saveError ? (
        <p className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-5 py-4 text-sm text-amber-100">
          {saveError}
        </p>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-6 sm:p-8">
        <p className="text-xs font-medium tracking-[0.18em] text-zinc-500 uppercase">
          Общий уровень
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-4">
          <span className="text-3xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
            {overallMissing
              ? "Пока не удалось определить"
              : result.overall.level}
          </span>
          <ConfidenceBadge confidence={result.overall.confidence} />
        </div>

        <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400">
          {overallMissing
            ? early
              ? "Вы завершили тест досрочно. Для оценки общего уровня нужно ответить на большее число вопросов по всем трём навыкам. Это не оценка ваших способностей."
              : "Пока не удалось определить уровень английского. Попробуйте пройти тест ещё раз — это не оценка ваших способностей."
            : "Общий уровень рассчитан по трём навыкам. Это ориентировочная оценка, а не официальный экзамен."}
        </p>

        {overallGuide ? (
          <div className="mt-5 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium tracking-[0.12em] text-zinc-500 uppercase">
                Что это значит
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                {overallGuide.summary}
              </p>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                <span className="font-medium text-zinc-300">
                  Доступные задачи:{" "}
                </span>
                {overallGuide.tasks.join(" ")}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium tracking-[0.12em] text-zinc-500 uppercase">
                Что улучшить
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-sm leading-6 text-zinc-400">
                {overallGuide.improve.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs leading-5 text-zinc-500">
                {confidenceCaveat(result.overall.confidence)}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="speaking-result-cta">
        <div>
          <p className="speaking-result-cta__kicker">Speaking</p>
          <h2>Хотите проверить свой разговорный английский?</h2>
          <p>
            Короткий демо-диалог из пяти вопросов. Без микрофона и без
            настоящего ИИ — только текстовая практика.
          </p>
        </div>
        <Link href={speakingHref} className="button button--primary">
          Проверить Speaking
        </Link>
      </div>

      <CefrAiAnalysis result={result} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Правильно" value={result.stats.correct} />
        <StatCard label="Неправильно" value={result.stats.incorrect} />
        <StatCard label="Отвечено" value={result.stats.answered} />
        <StatCard label="Без ответа" value={result.stats.unanswered} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {(["grammar", "vocabulary", "reading"] as Skill[]).map((skill) => {
          const skillResult = result.skills[skill];
          const stats = result.stats.bySkill[skill];
          const skillGuide = skillResult.level
            ? getLevelGuide(skillResult.level)
            : null;

          return (
            <div
              key={skill}
              className="rounded-2xl border border-white/10 bg-zinc-900/70 p-5"
            >
              <p className="text-xs font-medium tracking-[0.15em] text-zinc-500 uppercase">
                {SKILL_TITLES[skill]}
              </p>
              <p className="mt-2 text-2xl font-semibold text-zinc-50">
                {skillResult.level ?? "Уровень пока не подтверждён"}
              </p>
              <div className="mt-3">
                <ConfidenceBadge confidence={skillResult.confidence} />
              </div>
              <p className="mt-3 text-xs text-zinc-500">
                Верно: {stats.correct} · Неверно: {stats.incorrect}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Отвечено: {stats.answered} из 10
                {stats.unanswered > 0
                  ? ` · Без ответа: ${stats.unanswered}`
                  : ""}
              </p>
              {skillResult.level === null ? (
                <p className="mt-2 text-xs leading-5 text-zinc-500">
                  {stats.answered === 0
                    ? "Вы не отвечали на вопросы этого раздела."
                    : "Уровень пока не подтверждён: системе не хватило последовательных ответов в этом разделе."}
                </p>
              ) : null}
              {skillGuide ? (
                <div className="mt-3 border-t border-white/10 pt-3">
                  <p className="text-xs leading-5 text-zinc-400">
                    <span className="font-medium text-zinc-300">
                      Ориентир уровня:{" "}
                    </span>
                    {skillGuide[skill]}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    <span className="font-medium text-zinc-400">
                      Что улучшить:{" "}
                    </span>
                    {skillGuide.improve[0]}
                  </p>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <ReviewSection result={result} />

      <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-xs leading-5 text-amber-100/80">
        <span className="font-medium text-amber-100">Важно: </span>
        тест даёт предварительную оценку: 30 вопросов не охватывают все
        языковые навыки и не заменяют полную диагностику или официальный
        экзамен.
      </div>

      <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5">
        <p className="text-xs leading-5 text-zinc-500">
          Это пробная версия теста. Результат ориентировочный и не является
          официальным экзаменом CEFR.
        </p>
        <button
          type="button"
          onClick={onRestart}
          className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200"
        >
          Пройти заново
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/70 p-4">
      <p className="text-2xl font-semibold text-zinc-50">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{label}</p>
    </div>
  );
}

function ReviewSection({ result }: { result: TestResult }) {
  if (result.review.length === 0) {
    return (
      <section className="rounded-2xl border border-white/10 bg-zinc-900/70 p-5">
        <h2 className="text-lg font-semibold text-zinc-50">
          Разбор ответов
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Вы не ответили ни на один вопрос, поэтому разбирать пока нечего.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-900/70 p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-zinc-50">
        Разбор ответов
      </h2>
      <p className="mt-2 text-sm text-zinc-400">
        Правильные ответы и объяснения доступны только после завершения
        теста. Неотвеченные вопросы не считаются ошибками.
      </p>

      <div className="mt-4 space-y-3">
        {(["grammar", "vocabulary", "reading"] as Skill[]).map(
          (skill) => {
            const entries = result.review.filter(
              (entry) => entry.item.skill === skill,
            );
            const stats: SkillStats = result.stats.bySkill[skill];

            return (
              <details
                key={skill}
                className="group rounded-xl border border-white/10 bg-zinc-950/40"
              >
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-zinc-200 [&::-webkit-details-marker]:hidden">
                  <span>{SKILL_TITLES[skill]}</span>
                  <span className="flex items-center gap-2 text-xs font-normal text-zinc-500">
                    <span>
                      Верно: {stats.correct} · Неверно: {stats.incorrect}
                      {stats.unanswered > 0
                        ? ` · Без ответа: ${stats.unanswered}`
                        : ""}
                    </span>
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </span>
                </summary>
                <div className="space-y-4 border-t border-white/10 p-4">
                  {entries.map((entry) => (
                    <ReviewItem key={entry.item.id} entry={entry} />
                  ))}
                  {stats.unanswered > 0 ? (
                    <p className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-xs leading-5 text-zinc-400">
                      Ещё {stats.unanswered} вопрос(а) этого раздела остались
                      без ответа. Они не засчитаны как ошибки.
                    </p>
                  ) : null}
                </div>
              </details>
            );
          },
        )}
      </div>
    </section>
  );
}

function ReviewItem({ entry }: { entry: AnswerReview }) {
  const selected = entry.item.options.find(
    (option) => option.id === entry.selectedOptionId,
  );
  const correct = entry.item.options.find(
    (option) => option.id === entry.item.correctOptionId,
  );
  const passage = entry.item.passageId
    ? trialBank.passageById.get(entry.item.passageId)
    : undefined;

  return (
    <article className="rounded-xl border border-white/10 bg-zinc-900/60 p-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span
          className={`rounded-full border px-2.5 py-1 font-medium ${
            entry.correct
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
              : "border-red-400/30 bg-red-400/10 text-red-200"
          }`}
        >
          {entry.correct ? "Верно" : "Неверно"}
        </span>
        <span className="text-zinc-500">Вопрос {entry.index}</span>
        <span className="text-zinc-500">
          {SKILL_TITLES[entry.item.skill]}
        </span>
      </div>

      <p className="mt-3 text-sm font-medium leading-6 text-zinc-100">
        {displayStem(entry.item)}
      </p>

      {passage ? (
        <details className="mt-3 rounded-lg border border-white/10 bg-zinc-950/40 p-3">
          <summary className="cursor-pointer text-xs font-medium text-zinc-400">
            Показать текст «{passage.title}»
          </summary>
          <div className="mt-3 text-sm leading-7 text-zinc-300">
            {passage.text}
          </div>
        </details>
      ) : null}

      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-zinc-500">Ваш ответ</dt>
          <dd
            className={
              entry.correct ? "text-emerald-200" : "text-red-200"
            }
          >
            {selected?.text ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-500">Правильный ответ</dt>
          <dd className="text-emerald-200">{correct?.text ?? "—"}</dd>
        </div>
      </dl>

      <p className="mt-3 text-sm leading-6 text-zinc-400">
        <span className="font-medium text-zinc-300">Объяснение: </span>
        {entry.item.explanation ?? "Объяснение пока не добавлено."}
      </p>
    </article>
  );
}


function CefrAiAnalysis({ result }: { result: TestResult }) {
  const [analysis, setAnalysis] = useState<CefrTestAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!loading) return;

    const timer = window.setInterval(() => {
      setElapsedSeconds((seconds) => seconds + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [loading]);

  const analyze = async () => {
    if (loading) return;

    const questions = result.review.map((entry) => {
      const selected = entry.item.options.find(
        (option) => option.id === entry.selectedOptionId,
      );
      const correct = entry.item.options.find(
        (option) => option.id === entry.item.correctOptionId,
      );
      return {
        id: entry.item.id,
        skill: entry.item.skill,
        level: entry.item.cefrLevel,
        stem: entry.item.stem,
        selected: selected?.text ?? "",
        correct: correct?.text ?? "",
        isCorrect: entry.correct,
      };
    });

    if (questions.length === 0) {
      setError("Нет отвеченных вопросов для анализа.");
      return;
    }

    setLoading(true);
    setError(null);
    setElapsedSeconds(0);

    try {
      const response = await fetch("/api/speaking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyze-test",
          level: result.overall.level,
          questions,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { analysis?: unknown; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          payload?.error || "Не удалось получить AI-анализ. Попробуйте ещё раз.",
        );
      }
      if (!isCefrTestAnalysis(payload?.analysis)) {
        throw new Error("Не удалось разобрать AI-анализ. Попробуйте ещё раз.");
      }

      setAnalysis(payload.analysis);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Не удалось получить AI-анализ. Попробуйте ещё раз.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (analysis) {
    return <CefrAiAnalysisPanel analysis={analysis} />;
  }

  if (error) {
    return (
      <section
        className="cefr-ai-panel cefr-ai-error-panel"
        role="alert"
      >
        <p className="cefr-ai-kicker">AI-анализ</p>
        <h2>Не удалось получить разбор</h2>
        <p className="cefr-ai-summary">{error}</p>
        <div className="cefr-ai-error-actions">
          <button
            type="button"
            className="button button--primary"
            onClick={() => void analyze()}
            disabled={loading || result.review.length === 0}
          >
            Попробовать снова
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="cefr-ai-cta">
      <div>
        <p className="cefr-ai-kicker">AI-анализ</p>
        <h2>Разобрать ответы по вопросам</h2>
        <p>
          Посмотрите, какие темы уже получаются, где теряются баллы и что
          стоит повторить. Анализ опирается на все отвеченные вопросы.
        </p>
        {error ? (
          <p className="cefr-ai-error" role="alert">
            {error}
          </p>
        ) : null}
        {result.review.length === 0 ? (
          <p className="cefr-ai-note">
            Для анализа нужно ответить хотя бы на один вопрос.
          </p>
        ) : null}
      </div>
      <button
        type="button"
        className="button button--primary"
        onClick={() => void analyze()}
        disabled={loading || result.review.length === 0}
      >
        {loading
          ? `Анализируем результат… ${elapsedSeconds} с`
          : error
            ? "Повторить"
            : "AI-анализ"}
      </button>
    </section>
  );
}

function CefrAiAnalysisPanel({
  analysis,
}: {
  analysis: CefrTestAnalysis;
}) {
  return (
    <section className="cefr-ai-panel">
      <div className="cefr-ai-panel__head">
        <div>
          <p className="cefr-ai-kicker">AI-анализ</p>
          <h2>Разбор ответов</h2>
          <p className="cefr-ai-summary">{analysis.summary}</p>
        </div>
        <div className="cefr-ai-level">
          <span>AI-уровень</span>
          <strong>{analysis.level}</strong>
          <small>{analysis.answered} ответов</small>
        </div>
      </div>

      <div className="cefr-ai-scores">
        {(["grammar", "vocabulary", "reading"] as Skill[]).map((skill) => (
          <div className="cefr-ai-score" key={skill}>
            <div>
              <span>{SKILL_TITLES[skill]}</span>
              <strong>{analysis.scores[skill]}</strong>
            </div>
            <div className="cefr-ai-score__bar">
              <span style={{ width: `${analysis.scores[skill]}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="cefr-ai-columns">
        <section>
          <h3>Сильные стороны</h3>
          <ul>
            {analysis.strengths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section>
          <h3>Рекомендации</h3>
          <ul>
            {analysis.recommendations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className="cefr-ai-mistakes">
        <h3>Ошибки по вопросам</h3>
        {analysis.mistakes.length > 0 ? (
          <div className="cefr-ai-mistakes__list">
            {analysis.mistakes.map((mistake, index) => (
              <article
                key={`${mistake.questionId}-${index}`}
                className="cefr-ai-mistake"
              >
                <p className="cefr-ai-mistake__question">
                  {mistake.question}
                </p>
                <p className="cefr-ai-mistake__line">
                  <span>Ваш ответ</span>
                  <del>{mistake.selected}</del>
                </p>
                <p className="cefr-ai-mistake__line">
                  <span>Правильно</span>
                  <ins>{mistake.correction}</ins>
                </p>
                <p className="cefr-ai-mistake__explanation">
                  {mistake.explanation}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="cefr-ai-note">
            Заметных ошибок в отвеченных вопросах не найдено.
          </p>
        )}
      </section>

      <p className="cefr-ai-note">
        Предварительный разбор по ответам. Он не заменяет официальный экзамен.
      </p>
    </section>
  );
}
