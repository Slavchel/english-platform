"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type {
  AnswerReview,
  Confidence,
  Item,
  ReadingPassage,
  Skill,
  TestResult,
} from "@/lib/cefr";
import { CefrTestEngine } from "@/lib/cefr/engine";
import { getLevelGuide } from "@/lib/cefr/level-guide";
import {
  isCefrTestAnalysis,
  type CefrTestAnalysis,
} from "@/lib/cefr/test-analysis";
import LessonRecommendations from "@/app/components/LessonRecommendations";
import CefrAiAnalysisCard from "@/app/components/CefrAiAnalysisCard";
import UpgradeLimitModal from "@/app/components/UpgradeLimitModal";
import { saveTestResult } from "./actions";
import {
  createTrialItemPool,
  trialBank,
} from "@/lib/cefr/bank/trial-bank";
import { PENDING_RESULT_KEY } from "@/lib/cefr/pending-result";
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

export default function TestRunner({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
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
    if (typeof window === "undefined") return;
    if (
      new URLSearchParams(window.location.search).get("restore") !== "1"
    ) {
      return;
    }

    const raw = window.sessionStorage.getItem(PENDING_RESULT_KEY);
    if (!raw) return;

    let restored: TestResult;
    try {
      restored = JSON.parse(raw) as TestResult;
    } catch {
      window.sessionStorage.removeItem(PENDING_RESULT_KEY);
      return;
    }

    const timer = window.setTimeout(() => {
      setResult(restored);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!result || savedSeedRef.current === result.seed) return;
    savedSeedRef.current = result.seed;

    if (!isAuthenticated) {
      window.sessionStorage.setItem(PENDING_RESULT_KEY, JSON.stringify(result));
      return;
    }

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
          passageId: entry.item.passageId ?? null,
        };
      });

    const answers = result.review.map((entry) => {
      const selected = entry.item.options.find(
        (option) => option.id === entry.selectedOptionId,
      );
      const correct = entry.item.options.find(
        (option) => option.id === entry.item.correctOptionId,
      );
      return {
        skill: entry.item.skill,
        level: entry.item.cefrLevel,
        topic: entry.item.topic,
        question: entry.item.stem,
        correct: entry.correct,
        selectedAnswer: selected?.text ?? "",
        correctAnswer: correct?.text ?? "",
        passageId: entry.item.passageId ?? null,
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
      answers,
    })
      .then((response) => {
        if ("id" in response) {
          setSavedResultId(response.id);
          window.sessionStorage.removeItem(PENDING_RESULT_KEY);
        } else {
          setSaveError(response.error);
        }
      })
      .catch(() => {
        setSaveError("Не удалось сохранить результат.");
      });
  }, [isAuthenticated, result]);

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
        isAuthenticated={isAuthenticated}
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
             
{/* --- PREMIUM GLASS BANNER --- */}
<div className="group relative mt-8 isolate overflow-hidden rounded-2xl border border-white/[0.13] bg-gradient-to-br from-[#292126]/65 via-[#1c1b20]/55 to-[#11151a]/65 p-6 shadow-[0_12px_45px_rgba(0,0,0,0.22),inset_0_1px_1px_rgba(255,255,255,0.10)] backdrop-blur-2xl sm:p-8">

  {/* Золотистое отражение стекла */}
  <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[#c5a46d]/[0.12] blur-[100px]" />

  {/* Глубокое бордовое свечение */}
  <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-[#713344]/[0.14] blur-[100px]" />

  {/* Световой блик сверху */}
  <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#e8d3ae]/40 to-transparent" />

  {/* Внутреннее отражение */}
  <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.045] via-transparent to-transparent" />

  {/* Контент */}
  <div className="relative z-10">

    <h3 className="text-lg font-medium tracking-wide text-[#eee5d8]">
      Твой персональный план обучения
    </h3>

    <p className="mt-3 max-w-3xl text-sm leading-[1.85] text-[#c0b9b8]">
      Этот тест определит твой уровень и укажет на сильные и слабые стороны. На основе результатов ты получишь список тем для повторения. Все эти темы уже разобраны в наших интерактивных программах. После теста ты сможешь сразу перейти к их изучению.
    </p>

    <div className="mt-6">
      <a
        href="/learning"
        className="group/btn inline-flex items-center justify-center gap-3 rounded-full border border-[#c5a46d]/40 bg-gradient-to-r from-[#c5a46d]/[0.16] to-[#c5a46d]/[0.07] px-6 py-3 text-sm font-medium tracking-wide text-[#e5d1ac] shadow-[inset_0_1px_0_rgba(255,255,255,0.10)] backdrop-blur-xl transition-all duration-300 hover:border-[#d6b982]/65 hover:from-[#c5a46d]/[0.24] hover:to-[#c5a46d]/[0.12] hover:shadow-[0_0_25px_rgba(197,164,109,0.12)]"
      >
        Посмотреть программы обучения
        <span
          aria-hidden="true"
          className="transition-transform duration-300 group-hover/btn:translate-x-1"
        >
          →
        </span>
      </a>
    </div>

  </div>
</div>
{/* --- END PREMIUM GLASS BANNER --- */}

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

function ResultScreen({
  result,
  onRestart,
  savedResultId,
  saveError,
  isAuthenticated,
}: {
  result: TestResult;
  onRestart: () => void;
  savedResultId: string | null;
  saveError: string | null;
  isAuthenticated: boolean;
}) {
  const overallMissing = result.overall.level === null;
  const overallGuide = result.overall.level
    ? getLevelGuide(result.overall.level)
    : null;
  const early = !result.completed;
  const correctPercent =
    result.total > 0
      ? Math.round((result.stats.correct / result.total) * 100)
      : 0;
  const speakingHref = result.overall.level
    ? `/speaking?level=${encodeURIComponent(result.overall.level)}`
    : "/speaking";
  const mistakeTopics = result.review
    .filter((entry) => !entry.correct)
    .map((entry) => entry.item.topic);

  return (
    <div className="cefr-result">
      <div className="cefr-result-hero">
        <div className="cefr-result-hero__main">
          <p className="cefr-result-kicker">
            {early ? "Тест завершён досрочно" : "Тест завершён"}
          </p>
          <h2
            className={`cefr-result-level ${
              overallMissing ? "cefr-result-level--missing" : ""
            }`}
          >
            {overallMissing ? "Уровень пока не подтверждён" : result.overall.level}
          </h2>
          <div className="cefr-result-meta">
            <ConfidenceBadge confidence={result.overall.confidence} />
            {!isAuthenticated ? (
              <Link
                href={`/login?callbackUrl=${encodeURIComponent("/test?restore=1")}`}
                className="cefr-result-link"
              >
                Войдите, чтобы сохранить результат →
              </Link>
            ) : savedResultId ? (
              <Link
                href={`/account/results/${savedResultId}`}
                className="cefr-result-link"
              >
                Открыть разбор в ЛК →
              </Link>
            ) : saveError ? (
              <span className="cefr-result-link cefr-result-link--error">
                {saveError}
              </span>
            ) : null}
          </div>
          <p className="cefr-result-note">
            {overallMissing
              ? early
                ? "Для оценки общего уровня нужно ответить на большее число вопросов по всем трём навыкам. Это не оценка ваших способностей."
                : "Не хватило последовательных ответов. Попробуйте пройти тест ещё раз — это не оценка ваших способностей."
              : "Общий уровень рассчитан по трём навыкам. Это ориентировочная оценка, а не официальный экзамен."}
          </p>
        </div>

        <div className="cefr-result-hero__aside">
          <span className="cefr-result-percent">{correctPercent}%</span>
          <div
            role="progressbar"
            aria-label="Процент правильных ответов"
            aria-valuemin={0}
            aria-valuemax={result.total}
            aria-valuenow={result.stats.correct}
            className="cefr-result-progress"
          >
            <div
              className="cefr-result-progress__fill"
              style={{ width: `${correctPercent}%` }}
            />
          </div>
          <span className="cefr-result-progress__label">
            Правильных ответов: {result.stats.correct} из {result.total}
          </span>
        </div>
      </div>

      {overallGuide ? (
        <div className="cefr-result-guide">
          <p>
            <span>Что это значит</span>
            {overallGuide.summary}
          </p>
          <p>
            <span>Что улучшить</span>
            {overallGuide.improve.slice(0, 2).join(" · ")}
          </p>
        </div>
      ) : null}

      <div className="cefr-result-scoreboard">
        <div>
          <span>Правильно</span>
          <strong>{result.stats.correct}</strong>
        </div>
        <div>
          <span>Неправильно</span>
          <strong>{result.stats.incorrect}</strong>
        </div>
        <div>
          <span>Отвечено</span>
          <strong>{result.stats.answered}</strong>
        </div>
        <div>
          <span>Без ответа</span>
          <strong>{result.stats.unanswered}</strong>
        </div>
      </div>

      <LessonRecommendations topics={mistakeTopics} />

      <CefrAiAnalysis
        result={result}
        resultId={savedResultId}
        isAuthenticated={isAuthenticated}
      />

      <section className="cefr-result-skills">
        <h2 className="cefr-result-heading">Навыки</h2>
        <div className="cefr-result-skills__grid">
          {(["grammar", "vocabulary", "reading"] as Skill[]).map((skill) => {
            const skillResult = result.skills[skill];
            const stats = result.stats.bySkill[skill];
            const guide = skillResult.level
              ? getLevelGuide(skillResult.level)
              : null;
            const share =
              stats.answered > 0
                ? Math.round((stats.correct / stats.answered) * 100)
                : 0;

            return (
              <article key={skill} className="cefr-skill-col">
                <p className="cefr-skill-col__label">
                  {SKILL_TITLES[skill]}
                </p>
                <p className="cefr-skill-col__level">
                  {skillResult.level ?? "Не подтверждён"}
                </p>
                <div className="cefr-skill-col__meta">
                  <ConfidenceBadge confidence={skillResult.confidence} />
                  <span>
                    Верно: {stats.correct} из {stats.answered}
                  </span>
                </div>
                <div className="cefr-skill-bar">
                  <div
                    className="cefr-skill-bar__fill"
                    style={{ width: `${share}%` }}
                  />
                </div>
                <p className="cefr-skill-col__text">
                  {guide
                    ? guide[skill]
                    : stats.answered === 0
                      ? "Вы не отвечали на вопросы этого раздела."
                      : "Не хватило последовательных ответов, чтобы подтвердить уровень."}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <ReviewSection result={result} />

      <div className="speaking-result-cta speaking-result-cta--compact">
        <div>
          <p className="speaking-result-cta__kicker">Speaking</p>
          <h2>Проверить разговорный английский</h2>
        </div>
        <Link href={speakingHref} className="speaking-result-cta__button">
          Проверить Speaking
        </Link>
      </div>

      <div className="cefr-result-footer">
        <p>
          Тест даёт предварительную оценку: 30 вопросов не охватывают все
          языковые навыки и не заменяют официальный экзамен. Это пробная версия,
          результат ориентировочный.
        </p>
        <button
          type="button"
          onClick={onRestart}
          className="cefr-result-restart"
        >
          Пройти заново
        </button>
      </div>
    </div>
  );
}

function ReviewSection({ result }: { result: TestResult }) {
  return (
    <section className="cefr-result-review">
      <h2 className="cefr-result-heading">Разбор ответов</h2>
      <div className="cefr-review-groups">
        {(["grammar", "vocabulary", "reading"] as Skill[]).map((skill) => {
          const errors = result.review.filter(
            (entry) => entry.item.skill === skill && !entry.correct,
          );

          return (
            <details key={skill} className="cefr-review-group">
              <summary className="cefr-review-group__head">
                <span className="cefr-review-group__title">
                  {SKILL_TITLES[skill]}
                  <span className="cefr-review-group__count">
                    {errors.length} ошибок
                  </span>
                </span>
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="cefr-review-group__chevron"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </summary>

              <div className="cefr-review-group__body">
                {errors.length > 0 ? (
                  <div
                    className={`cefr-review-grid ${
                      skill === "reading" ? "cefr-review-grid--single" : ""
                    }`}
                  >
                    {errors.map((entry) => (
                      <ReviewErrorCard key={entry.item.id} entry={entry} />
                    ))}
                  </div>
                ) : (
                  <p className="cefr-review-empty">
                    В этом навыке нет ошибок.
                  </p>
                )}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}

function ReviewErrorCard({ entry }: { entry: AnswerReview }) {
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
    <article className="cefr-review-card">
      <p className="cefr-review-card__number">Вопрос {entry.index}</p>
      <p className="cefr-review-card__question">
        {displayStem(entry.item)}
      </p>
      {passage ? (
        <details className="cefr-review-card__passage">
          <summary>Показать текст «{passage.title}»</summary>
          <p>{passage.text}</p>
        </details>
      ) : null}
      <p className="cefr-review-card__answer cefr-review-card__answer--wrong">
        <span>Ваш ответ</span>
        {selected?.text ?? "—"}
      </p>
      <p className="cefr-review-card__answer cefr-review-card__answer--correct">
        <span>Правильный ответ</span>
        {correct?.text ?? "—"}
      </p>
      <p className="cefr-review-card__explanation">
        {entry.item.explanation ?? "Объяснение пока не добавлено."}
      </p>
    </article>
  );
}


function CefrAiAnalysis({
  result,
  resultId,
  isAuthenticated,
}: {
  result: TestResult;
  resultId: string | null;
  isAuthenticated: boolean;
}) {
  const [analysis, setAnalysis] = useState<CefrTestAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [showLimit, setShowLimit] = useState(false);
  const [limitTier, setLimitTier] = useState<string | null>(null);
  const [retryRemaining, setRetryRemaining] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!loading) return;

    const timer = window.setInterval(() => {
      setElapsedSeconds((seconds) => seconds + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [loading]);

  useEffect(() => {
    if (retryRemaining <= 0) return;

    const timer = window.setInterval(() => {
      setRetryRemaining((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [retryRemaining]);

  const analyze = async () => {
    if (loading || blocked) return;

    if (!resultId) {
      setError("Результат ещё сохраняется. Подождите пару секунд.");
      return;
    }

    if (result.review.length === 0) {
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
          resultId,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            analysis?: unknown;
            error?: string;
            code?: string;
            tier?: string;
            retryAfter?: number;
          }
        | null;

      if (!response.ok) {
        if (response.status === 429 && payload?.code === "LIMIT_REACHED") {
          setLimitTier(payload.tier ?? null);
          setShowLimit(true);
          setBlocked(true);
          return;
        }
        if (
          typeof payload?.retryAfter === "number" &&
          payload.retryAfter > 0
        ) {
          setRetryRemaining(payload.retryAfter);
        }
        if (response.status === 429 && payload?.code !== "COOLDOWN") {
          setBlocked(true);
        }
        throw new Error(
          payload?.error || "Не удалось получить AI-анализ. Попробуйте ещё раз.",
        );
      }
      if (!isCefrTestAnalysis(payload?.analysis)) {
        throw new Error("Не удалось разобрать AI-анализ. Попробуйте ещё раз.");
      }

      setBlocked(false);
      setRetryRemaining(0);
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

  if (!isAuthenticated) {
    return (
      <section className="cefr-ai-cta">
        <div>
          <p className="cefr-ai-kicker">AI-анализ</p>
          <h2>Войдите, чтобы получить разбор</h2>
          <p>
            Сохраните результат теста в аккаунте и получите персональный
            AI-разбор ошибок и рекомендаций.
          </p>
        </div>
        <Link
          href={`/login?callbackUrl=${encodeURIComponent("/test?restore=1")}`}
          className="button button--primary"
        >
          Войти и сохранить результат
        </Link>
      </section>
    );
  }

  if (analysis) {
    const mistakes = result.review
      .filter(
        (entry) =>
          !entry.correct && entry.item.skill !== "reading",
      )
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
          selectedAnswer: selected?.text ?? "",
          correctAnswer: correct?.text ?? "",
          explanation: entry.item.explanation ?? null,
        };
      });

    return (
      <CefrAiAnalysisCard analysis={analysis} mistakes={mistakes} />
    );
  }

  if (error) {
    return (
      <>
        {showLimit ? (
          <UpgradeLimitModal
            title={
              limitTier === "PRO"
                ? "Дневной лимит AI-анализов исчерпан"
                : "Лимит AI-анализов на сегодня исчерпан"
            }
            message={
              limitTier === "PRO"
                ? "На тарифе Pro доступно до 5 AI-разборов в день. Попробуйте снова завтра."
                : "На тарифе Free доступен один AI-разбор в день. Оформите Pro, чтобы получать больше разборов."
            }
            kicker={limitTier === "PRO" ? "Лимит Pro" : "Лимит Free"}
            upgradeLabel={
              limitTier === "PRO" ? "Посмотреть Neuro-Tutor" : "Перейти на Pro"
            }
            onClose={() => setShowLimit(false)}
          />
        ) : null}
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
              disabled={
                loading ||
                blocked ||
                retryRemaining > 0 ||
                !resultId ||
                result.review.length === 0
              }
            >
              {retryRemaining > 0
                ? `Повторить через ${Math.floor(retryRemaining / 60)}:${String(
                    retryRemaining % 60,
                  ).padStart(2, "0")}`
                : blocked
                  ? "Попробуйте позже"
                  : "Попробовать снова"}
            </button>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      {showLimit ? (
        <UpgradeLimitModal
          title={
            limitTier === "PRO"
              ? "Дневной лимит AI-анализов исчерпан"
              : "Лимит AI-анализов на сегодня исчерпан"
          }
          message={
            limitTier === "PRO"
              ? "На тарифе Pro доступно до 5 AI-разборов в день. Попробуйте снова завтра."
              : "На тарифе Free доступен один AI-разбор в день. Оформите Pro, чтобы получать больше разборов."
          }
          kicker={limitTier === "PRO" ? "Лимит Pro" : "Лимит Free"}
          upgradeLabel={
            limitTier === "PRO" ? "Посмотреть Neuro-Tutor" : "Перейти на Pro"
          }
          onClose={() => setShowLimit(false)}
        />
      ) : null}
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
          {!resultId ? (
            <p className="cefr-ai-note">
              Сохраняем результат — кнопка станет доступна через пару секунд.
            </p>
          ) : result.review.length === 0 ? (
            <p className="cefr-ai-note">
              Для анализа нужно ответить хотя бы на один вопрос.
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className="button button--primary"
          onClick={() => void analyze()}
          disabled={
            loading ||
            blocked ||
            retryRemaining > 0 ||
            !resultId ||
            result.review.length === 0
          }
        >
          {loading
            ? `Анализируем результат… ${elapsedSeconds} с`
            : retryRemaining > 0
              ? `Повторить через ${Math.floor(retryRemaining / 60)}:${String(
                  retryRemaining % 60,
                ).padStart(2, "0")}`
              : error
                ? "Повторить"
                : "AI-анализ"}
        </button>
      </section>
    </>
  );
}
