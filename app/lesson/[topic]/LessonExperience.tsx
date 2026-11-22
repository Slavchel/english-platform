"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import MarkdownContent from "./MarkdownContent";

export interface LessonExperienceQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation: string | null;
}

interface LessonExperienceProps {
  title: string;
  level: string;
  topic: string;
  content: string;
  question: LessonExperienceQuestion | null;
}

const steps = ["Теория", "Практика", "Результат"] as const;

function theoryPreview(content: string): string {
  const blocks = content
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
  return blocks.slice(0, 3).join("\n\n");
}

export default function LessonExperience({
  title,
  level,
  topic,
  content,
  question,
}: LessonExperienceProps) {
  const [slide, setSlide] = useState<0 | 1 | 2>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [cheatsheetOpen, setCheatsheetOpen] = useState(false);

  const progress = ((slide + 1) / 3) * 100;
  const isCorrect = selectedAnswer === question?.correctAnswer;

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

  return (
    <section className="page-shell lesson-page">
      <div className="container py-10 sm:py-14">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/learning"
              className="text-[0.68rem] tracking-[0.12em] text-zinc-500 uppercase transition-colors hover:text-zinc-200"
            >
              ← Все уроки
            </Link>
            <button
              type="button"
              onClick={() => setCheatsheetOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-300 shadow-lg backdrop-blur-xl transition-colors hover:border-white/25 hover:bg-white/10 hover:text-white"
            >
              <span aria-hidden="true">💡</span>
              Шпаргалка
            </button>
          </div>

          <div className="mt-7 rounded-3xl border border-white/10 bg-white/[0.045] p-5 shadow-2xl backdrop-blur-xl sm:p-9">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[#d4af37]/25 bg-[#d4af37]/10 px-3 py-1 text-[0.58rem] font-semibold tracking-[0.16em] text-[#e2c98f] uppercase">
                  {level}
                </span>
                <span className="text-[0.58rem] tracking-[0.12em] text-zinc-500 uppercase">
                  {topic.replace(/_/g, " ")}
                </span>
              </div>
              <span className="text-[0.6rem] tracking-[0.14em] text-zinc-500 uppercase">
                {String(slide + 1).padStart(2, "0")} / 03
              </span>
            </div>

            <div className="mt-6 h-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-linear-to-r from-[#b89a65] to-[#e5cd97] transition-[width] duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            <ol className="mt-4 flex items-center gap-4 text-[0.58rem] tracking-[0.12em] uppercase">
              {steps.map((step, index) => (
                <li
                  key={step}
                  className={
                    index === slide
                      ? "text-[#e2c98f]"
                      : index < slide
                        ? "text-zinc-400"
                        : "text-zinc-600"
                  }
                >
                  <span className="mr-2 inline-flex h-1.5 w-1.5 rounded-full bg-current" />
                  {step}
                </li>
              ))}
            </ol>

            <div key={slide} className="lesson-slide-anim mt-10">
              {slide === 0 ? (
                <div>
                  <p className="text-[0.6rem] tracking-[0.18em] text-[#b89a65] uppercase">
                    Теория
                  </p>
                  <h1 className="mt-4 max-w-3xl [font-family:var(--font-display)] text-3xl leading-[1.08] font-medium tracking-tight text-zinc-50 break-words sm:text-5xl">
                    {title}
                  </h1>
                  <div className="mt-7 max-w-3xl text-zinc-300">
                    <MarkdownContent content={theoryPreview(content)} />
                  </div>
                  <button
                    type="button"
                    onClick={() => setSlide(1)}
                    className="mt-9 inline-flex items-center gap-3 rounded-full bg-zinc-50 px-6 py-3 text-sm font-semibold text-zinc-950 shadow-xl transition-transform duration-200 hover:scale-[1.02] hover:bg-white"
                  >
                    Дальше
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              ) : null}

              {slide === 1 ? (
                <div>
                  <p className="text-[0.6rem] tracking-[0.18em] text-[#b89a65] uppercase">
                    Практика · вопрос
                  </p>
                  {question ? (
                    <>
                      <h2 className="mt-4 max-w-3xl [font-family:var(--font-display)] text-2xl leading-tight font-medium text-zinc-50 sm:text-4xl">
                        {question.prompt}
                      </h2>
                      <div className="mt-8 grid gap-3 sm:grid-cols-2">
                        {question.options.map((option) => {
                          const selected = selectedAnswer === option;
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => setSelectedAnswer(option)}
                              className={`rounded-2xl border px-5 py-4 text-left text-sm transition-all duration-200 ${
                                selected
                                  ? "border-[#d4af37]/60 bg-[#d4af37]/15 text-zinc-50 shadow-lg"
                                  : "border-white/10 bg-white/[0.035] text-zinc-300 hover:border-white/25 hover:bg-white/[0.07]"
                              }`}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-8 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setSlide(2)}
                          disabled={!selectedAnswer}
                          className="inline-flex items-center gap-3 rounded-full bg-zinc-50 px-6 py-3 text-sm font-semibold text-zinc-950 shadow-xl transition-all duration-200 hover:bg-white disabled:cursor-not-allowed disabled:opacity-35"
                        >
                          Проверить ответ
                          <span aria-hidden="true">→</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedAnswer(null)}
                          className="text-xs text-zinc-500 transition-colors hover:text-zinc-200"
                        >
                          Сбросить выбор
                        </button>
                      </div>
                    </>
                  ) : (
                    <div>
                      <h2 className="mt-4 [font-family:var(--font-display)] text-3xl text-zinc-50">
                        Практика скоро появится
                      </h2>
                      <p className="mt-3 text-sm text-zinc-400">
                        Для этого урока пока нет вопроса, но теория уже
                        доступна в шпаргалке.
                      </p>
                      <button
                        type="button"
                        onClick={() => setSlide(2)}
                        className="mt-7 rounded-full bg-zinc-50 px-6 py-3 text-sm font-semibold text-zinc-950"
                      >
                        Завершить
                      </button>
                    </div>
                  )}
                </div>
              ) : null}

              {slide === 2 ? (
                <div>
                  <p className="text-[0.6rem] tracking-[0.18em] text-[#b89a65] uppercase">
                    Результат
                  </p>
                  <h2 className="mt-4 [font-family:var(--font-display)] text-3xl leading-tight text-zinc-50 sm:text-5xl">
                    Урок пройден!
                  </h2>
                  <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-400">
                    Ты дошёл до конца урока. Загляни в шпаргалку, если хочешь
                    повторить ключевые правила.
                  </p>

                  {question ? (
                    <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-6">
                      <p className="text-xs tracking-[0.12em] text-zinc-500 uppercase">
                        {isCorrect ? "Верный ответ" : "Правильный ответ"}
                      </p>
                      <p className="mt-2 text-sm text-zinc-200">
                        {question.correctAnswer}
                      </p>
                      {question.explanation ? (
                        <p className="mt-3 text-sm leading-7 text-zinc-400">
                          {question.explanation}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <Link
                      href="/learning"
                      className="lesson-primary-button inline-flex items-center gap-3 rounded-full bg-zinc-50 px-6 py-3 text-sm font-semibold text-zinc-950 shadow-xl transition-colors hover:bg-white"
                    >
                      Вернуться в меню
                      <span aria-hidden="true">→</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAnswer(null);
                        setSlide(0);
                      }}
                      className="text-xs text-zinc-500 transition-colors hover:text-zinc-200"
                    >
                      Пройти ещё раз
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {cheatsheetOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lesson-cheatsheet-title"
          onClick={() => setCheatsheetOpen(false)}
        >
          <div
            className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/15 bg-[#0b0a08]/95 p-6 shadow-2xl backdrop-blur-2xl sm:p-9"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.6rem] tracking-[0.18em] text-[#b89a65] uppercase">
                  Шпаргалка
                </p>
                <h2
                  id="lesson-cheatsheet-title"
                  className="mt-2 [font-family:var(--font-display)] text-3xl leading-tight text-zinc-50"
                >
                  {title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setCheatsheetOpen(false)}
                aria-label="Закрыть шпаргалку"
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-lg leading-none text-zinc-400 transition-colors hover:border-white/25 hover:text-white"
              >
                ×
              </button>
            </div>
            <div className="mt-6 text-zinc-300">
              <MarkdownContent content={content} />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
