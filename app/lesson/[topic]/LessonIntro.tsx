"use client";

import { useState } from "react";

import type { CourseStep, IntroType } from "@/lib/lessons/course";
import { shuffleWithSeed } from "@/lib/lessons/shuffle";

type IntroStep = Extract<CourseStep, { kind: "intro" }>;

interface LessonIntroProps {
  step: IntroStep;
  introType?: IntroType;
  onReady?: (ready: boolean) => void;
}

function splitMistakeWords(step: IntroStep): string[] {
  if (step.mistakeWords) return [...step.mistakeWords];
  if (!step.mistakeSentence) return [];
  return step.mistakeSentence.split(/\s+/);
}

export default function LessonIntro({
  step,
  introType: introTypeProp,
  onReady,
}: LessonIntroProps) {
  const introType = introTypeProp ?? step.introType ?? "question";
  const [choice, setChoice] = useState<string | null>(null);
  const [mistakeChoice, setMistakeChoice] = useState<number | null>(null);

  const chooseOption = (option: string) => {
    setChoice(option);
    onReady?.(true);
  };

  const chooseMistakeWord = (index: number) => {
    setMistakeChoice(index);
    if (index === (step.mistakeErrorIndex ?? -1)) {
      onReady?.(true);
    }
  };

  const optionButtons = () => (
    <div className="mt-6 grid gap-3 sm:grid-cols-2">
      {shuffleWithSeed(
        step.options,
        `intro-${step.title}-${introType}`,
      ).map((option, index) => {
        const selected = choice === option;
        const correct = option === step.correctOption;
        const answered = choice !== null;
        const stateClass = !answered
          ? ""
          : correct
            ? "lesson-option--correct"
            : selected
              ? "lesson-option--wrong"
              : "lesson-option--muted";
        return (
          <button
            key={option}
            type="button"
            onClick={() => chooseOption(option)}
            disabled={answered}
            className={`lesson-option group flex items-center gap-3 rounded-2xl border px-5 py-5 text-left text-sm transition-colors duration-200 ${stateClass}`}
          >
            <span className="lesson-option__marker" aria-hidden="true">
              {String.fromCharCode(65 + index)}
            </span>
            <span>{option}</span>
          </button>
        );
      })}
    </div>
  );

  const feedback = choice ? (
    <div
      className={`lesson-feedback mt-4 ${
        choice === step.correctOption
          ? "lesson-feedback--correct"
          : "lesson-feedback--wrong"
      }`}
    >
      <p className="lesson-feedback__label">
        <span aria-hidden="true">
          {choice === step.correctOption ? "✓" : "×"}
        </span>
        {choice === step.correctOption ? "Верно!" : "Пока неверно"}
      </p>
      {choice !== step.correctOption ? (
        <p className="lesson-feedback__answer">
          Правильный ответ: {step.correctOption}
        </p>
      ) : null}
      <p className="lesson-feedback__text">{step.explanation}</p>
    </div>
  ) : null;

  const heading = (text: string) => (
    <h1 className="mt-4 max-w-3xl [font-family:var(--font-display)] text-3xl leading-[1.08] font-medium tracking-tight text-[#f0efe9] break-words sm:text-5xl">
      {text}
    </h1>
  );

  if (introType === "scenario") {
    return (
      <div>
        {heading("Представь ситуацию")}
        <div className="lesson-scenario-card mt-6 rounded-2xl border border-white/[0.1] bg-white/[0.03] p-6">
          <p className="text-[0.58rem] tracking-[0.16em] text-[#c2a66d] uppercase">
            Ситуация
          </p>
          <p className="mt-2 text-sm leading-7 text-[#e4e0d6]">
            {step.scenario ?? step.lead}
          </p>
        </div>
        <h2 className="mt-7 max-w-2xl [font-family:var(--font-display)] text-2xl leading-tight text-[#f0efe9]">
          {step.title}
        </h2>
        <p className="mt-3 text-sm leading-7 text-[#a8afb5]">{step.lead}</p>
        {optionButtons()}
        {feedback}
      </div>
    );
  }

  if (introType === "mistake") {
    const words = splitMistakeWords(step);
    return (
      <div>
        {heading("Найди ошибку в предложении")}
        <p className="mt-5 max-w-2xl text-sm leading-7 text-[#a8afb5]">
          {step.lead}
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-x-2 gap-y-3 rounded-2xl border border-white/[0.09] bg-white/[0.025] px-5 py-6 text-xl leading-relaxed text-[#f0efe9] sm:text-2xl">
          {words.map((word, index) => {
            const chosen = mistakeChoice === index;
            const isError = index === (step.mistakeErrorIndex ?? -1);
            const className =
              chosen && isError
                ? "spot-sentence--wrong bg-rose-400/15 text-rose-200 line-through decoration-rose-300/70 decoration-2"
                : chosen
                  ? "bg-emerald-400/10 text-emerald-200"
                  : "hover:bg-white/[0.06] hover:text-white";
            return (
              <button
                key={`${word}-${index}`}
                type="button"
                onClick={() => chooseMistakeWord(index)}
                className={`rounded-lg px-1.5 py-0.5 transition-colors ${className}`}
              >
                {word}
              </button>
            );
          })}
        </div>
        {mistakeChoice !== null && mistakeChoice === (step.mistakeErrorIndex ?? -1) ? (
          <p className="mt-4 rounded-xl border border-rose-300/20 bg-rose-300/[0.06] px-4 py-3 text-sm leading-6 text-rose-100">
            {step.explanation}
          </p>
        ) : null}
      </div>
    );
  }

  if (introType === "comparison") {
    const first = step.comparison?.first ?? step.options[0] ?? step.example;
    const second = step.comparison?.second ?? step.options[1] ?? "";
    const choices = [first, second].filter(Boolean);
    if (step.comparisonTask) {
      return (
        <div>
          {heading("В чем разница?")}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {choices.map((sentence, index) => (
              <div
                key={`${sentence}-${index}`}
                className="rounded-2xl border border-white/[0.1] bg-white/[0.025] p-5"
              >
                <span className="text-[0.56rem] tracking-[0.16em] text-[#c2a66d] uppercase">
                  Вариант {index === 0 ? "A" : "B"}
                </span>
                <span className="mt-2 block [font-family:var(--font-display)] text-xl leading-snug text-[#f0efe9]">
                  {sentence}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm leading-7 text-[#a8afb5]">{step.lead}</p>
          {optionButtons()}
          {feedback}
        </div>
      );
    }
    return (
      <div>
        {heading("В чем разница?")}
        {step.scenario ? (
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#a8afb5]">
            {step.scenario}
          </p>
        ) : null}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {choices.map((sentence, index) => {
            const selected = choice === sentence;
            const correct = sentence === step.correctOption;
            const answered = choice !== null;
            const className = !answered
              ? "border-white/[0.1] bg-white/[0.025] hover:border-[#c2a66d]/40 hover:bg-[#c2a66d]/[0.05]"
              : correct
                ? "border-emerald-400/25 bg-emerald-400/[0.06]"
                : selected
                  ? "border-rose-300/25 bg-rose-300/[0.06]"
                  : "border-white/[0.06] bg-white/[0.015] opacity-55";
            return (
              <button
                key={`${sentence}-${index}`}
                type="button"
                onClick={() => chooseOption(sentence)}
                disabled={answered}
                aria-pressed={selected}
                className={`rounded-2xl border p-5 text-left transition-all duration-200 ${className}`}
              >
                <span className="text-[0.56rem] tracking-[0.16em] text-[#c2a66d] uppercase">
                  Вариант {index === 0 ? "A" : "B"}
                </span>
                <span className="mt-2 block [font-family:var(--font-display)] text-xl leading-snug text-[#f0efe9]">
                  {sentence}
                </span>
                <span className="mt-3 block text-[0.62rem] text-[#8f9a9f]">
                  Нажми, чтобы выбрать
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-6 text-sm leading-7 text-[#a8afb5]">{step.lead}</p>
        {feedback}
      </div>
    );
  }

  if (introType === "context") {
    return (
      <div>
        {heading(step.introHeading ?? "Как понять эту фразу?")}
        <blockquote className="relative mt-6 rounded-2xl border border-[#c2a66d]/25 bg-[#c2a66d]/[0.055] px-7 py-8">
          <span
            aria-hidden="true"
            className="absolute left-3 top-1 [font-family:var(--font-display)] text-5xl leading-none text-[#c2a66d]/35"
          >
            “
          </span>
          <p className="[font-family:var(--font-display)] text-2xl leading-snug text-[#f0efe9] sm:text-3xl">
            {step.quote ?? step.example}
          </p>
        </blockquote>
        <p className="mt-6 text-sm leading-7 text-[#a8afb5]">{step.lead}</p>
        {optionButtons()}
        {feedback}
      </div>
    );
  }

  return (
    <div>
      {heading(step.title)}
      <p className="mt-5 max-w-2xl text-sm leading-7 text-[#a8afb5]">
        {step.lead}
      </p>
      <div className="mt-6 rounded-2xl border border-[#c2a66d]/20 bg-[#c2a66d]/[0.05] p-5">
        <p className="[font-family:var(--font-display)] text-xl text-[#f0efe9]">
          {step.example}
        </p>
      </div>
      {optionButtons()}
      {feedback}
    </div>
  );
}
