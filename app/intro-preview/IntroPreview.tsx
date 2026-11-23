"use client";

import { useState } from "react";

import LessonIntro from "@/app/lesson/[topic]/LessonIntro";
import type { CourseStep, IntroType } from "@/lib/lessons/course";

type IntroStep = Extract<CourseStep, { kind: "intro" }>;

const demos: Record<IntroType, IntroStep> = {
  question: {
    kind: "intro",
    introType: "question",
    eyebrow: "Предпросмотр · question",
    title: "Что происходит прямо сейчас?",
    lead: "Какая фраза точнее описывает действие в момент речи?",
    example: "I ___ a book right now.",
    options: ["I read a book.", "I am reading a book."],
    correctOption: "I am reading a book.",
    explanation: "Действие происходит сейчас — Present Continuous.",
  },
  scenario: {
    kind: "intro",
    introType: "scenario",
    eyebrow: "Предпросмотр · scenario",
    title: "Что ты скажешь?",
    lead: "Какая фраза лучше подходит для этого момента?",
    scenario:
      "Ты в маленьком кафе в Лондоне. Официант уже подошёл, и ты хочешь заказать кофе.",
    example: "I ___ a coffee, please.",
    options: ["I'll have a coffee.", "I have a coffee."],
    correctOption: "I'll have a coffee.",
    explanation: "Решение принимается прямо сейчас, в момент заказа.",
  },
  mistake: {
    kind: "intro",
    introType: "mistake",
    eyebrow: "Предпросмотр · mistake",
    title: "Найди ошибку",
    lead: "Нажми на слово, которое делает предложение неверным.",
    example: "She are reading a book.",
    options: [],
    correctOption: "",
    explanation: "С she нужна форма is: She is reading a book.",
    mistakeSentence: "She are reading a book.",
    mistakeWords: ["She", "are", "reading", "a", "book."],
    mistakeErrorIndex: 1,
  },
  comparison: {
    kind: "intro",
    introType: "comparison",
    eyebrow: "Предпросмотр · comparison",
    title: "Что происходит сейчас?",
    lead: "Какая фраза описывает процесс прямо сейчас?",
    example: "I read every evening.",
    options: ["I read every evening.", "I am reading now."],
    correctOption: "I am reading now.",
    explanation:
      "Вторая фраза описывает процесс в момент речи. Первая — регулярную привычку, поэтому там Present Simple.",
    scenario:
      "Два друга обсуждают свои привычки. Один говорит о том, что делает обычно, другой — о том, что происходит прямо сейчас.",
    comparison: {
      first: "I read every evening.",
      second: "I am reading now.",
    },
  },
  context: {
    kind: "intro",
    introType: "context",
    eyebrow: "Предпросмотр · context",
    title: "Пойми смысл",
    lead: "Что означает эта фраза в контексте разговора?",
    example: "I'll be back.",
    options: ["Я вернусь.", "Я вернулся."],
    correctOption: "Я вернусь.",
    explanation: "Will описывает будущее действие или обещание.",
    quote: "I'll be back.",
  },
};

const tabs: { type: IntroType; label: string }[] = [
  { type: "question", label: "Вопрос" },
  { type: "scenario", label: "Ситуация" },
  { type: "comparison", label: "Сравнение" },
  { type: "context", label: "Контекст" },
];

export default function IntroPreview() {
  const [active, setActive] = useState<IntroType>("question");
  const step = demos[active];

  return (
    <section className="page-shell lesson-page">
      <div className="container py-10 sm:py-14">
        <div className="mx-auto max-w-5xl">
          <p className="text-[0.62rem] tracking-[0.16em] text-[#c2a66d] uppercase">
            NeoLeng · дизайн-предпросмотр
          </p>
          <h1 className="mt-3 [font-family:var(--font-display)] text-3xl text-[#f0efe9] sm:text-4xl">
            Варианты первого экрана
          </h1>
          <p className="mt-2 text-sm text-[#a8afb5]">
            Переключай тип Intro и проверяй внешний вид. Все варианты используют
            один премиальный стиль.
          </p>

          <div className="mt-7 flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.type}
                type="button"
                onClick={() => setActive(tab.type)}
                className={`rounded-full border px-4 py-2 text-xs transition-colors ${
                  active === tab.type
                    ? "border-[#c2a66d]/60 bg-[#c2a66d]/[0.14] text-[#f0efe9]"
                    : "border-white/[0.1] bg-white/[0.025] text-[#a8afb5] hover:border-[#c2a66d]/35 hover:text-[#f0efe9]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-3xl border border-white/[0.09] bg-[#121214] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.34)] sm:p-9">
            <p className="text-[0.6rem] tracking-[0.16em] text-[#c2a66d] uppercase">
              {step.eyebrow}
            </p>
            <LessonIntro key={active} step={step} introType={active} />
          </div>
        </div>
      </div>
    </section>
  );
}
