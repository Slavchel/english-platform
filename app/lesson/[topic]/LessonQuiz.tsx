"use client";

import { useState } from "react";

export interface LessonQuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation: string | null;
}

export default function LessonQuiz({
  questions,
}: {
  questions: LessonQuizQuestion[];
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const choose = (question: LessonQuizQuestion, option: string) => {
    if (answers[question.id]) return;
    setAnswers((previous) => ({ ...previous, [question.id]: option }));
  };

  return (
    <section className="lesson-quiz">
      <div className="lesson-quiz__head">
        <p className="eyebrow">Практика</p>
        <h2>Проверь себя</h2>
        <p>Выбери ответ — сразу увидишь результат и объяснение.</p>
      </div>

      <div className="lesson-quiz__list">
        {questions.map((question, index) => {
          const selected = answers[question.id];
          const answered = Boolean(selected);

          return (
            <article className="lesson-quiz__item" key={question.id}>
              <h3>
                <span>{String(index + 1).padStart(2, "0")}</span>
                {question.prompt}
              </h3>
              <div className="lesson-quiz__options">
                {question.options.map((option) => {
                  const isSelected = selected === option;
                  const isCorrect = option === question.correctAnswer;
                  const className = !answered
                    ? "lesson-quiz__option"
                    : isCorrect
                      ? "lesson-quiz__option lesson-quiz__option--correct"
                      : isSelected
                        ? "lesson-quiz__option lesson-quiz__option--wrong"
                        : "lesson-quiz__option lesson-quiz__option--muted";

                  return (
                    <button
                      key={option}
                      type="button"
                      className={className}
                      onClick={() => choose(question, option)}
                      aria-pressed={isSelected}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              {answered ? (
                <p
                  className={
                    selected === question.correctAnswer
                      ? "lesson-quiz__feedback lesson-quiz__feedback--correct"
                      : "lesson-quiz__feedback lesson-quiz__feedback--wrong"
                  }
                  role="status"
                >
                  {selected === question.correctAnswer
                    ? "Верно!"
                    : `Правильный ответ: ${question.correctAnswer}`}
                  {question.explanation ? ` ${question.explanation}` : ""}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
