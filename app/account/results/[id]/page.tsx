import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import LessonRecommendations from "@/app/components/LessonRecommendations";
import MistakeCard from "@/app/components/MistakeCard";
import { trialBank } from "@/lib/cefr/bank/trial-bank";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

type ResultPageProps = {
  params: Promise<{ id: string }>;
};

export default function ResultPage({ params }: ResultPageProps) {
  return (
    <Suspense
      fallback={
        <section className="page-shell auth-page">
          <div className="container auth-container account-result-page">
            <p className="eyebrow">NeoLeng · результат</p>
            <h1 className="page-title">Разбор результата</h1>
            <p className="lead">Загружаем результат…</p>
          </div>
        </section>
      }
    >
      <ResultContent params={params} />
    </Suspense>
  );
}

async function ResultContent({ params }: ResultPageProps) {
  await connection();
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const email = session.user.email ?? "";
  const user = email
    ? await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      })
    : null;

  if (!user) {
    notFound();
  }

  const result = await prisma.testResult.findFirst({
    where: {
      id,
      userId: user.id,
    },
    include: {
      mistakes: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!result) {
    notFound();
  }

  const progress =
    result.total > 0
      ? Math.round((result.answered / result.total) * 100)
      : null;
  const displayLevel = result.completed ? result.level : null;
  const grammarVocabularyMistakes = result.mistakes.filter(
    (mistake) => mistake.skill !== "reading",
  );
  const readingMistakes = result.mistakes.filter(
    (mistake) => mistake.skill === "reading",
  );

  return (
    <section className="page-shell auth-page">
      <div className="container auth-container account-result-page">
        <p className="eyebrow">NeoLeng · аккаунт</p>
        <h1 className="page-title">Разбор результата</h1>
        <Link href="/account" className="account-back lesson-back">
          ← В личный кабинет
        </Link>
        <p className="account-result-date">
          {dateFormatter.format(result.createdAt)}
        </p>

        <div className="account-result-summary">
          <div>
            <span>Общий уровень</span>
            <strong>{displayLevel ?? "Не определён"}</strong>
          </div>
          <div>
            <span>Прогресс</span>
            <strong>{progress === null ? "—" : `${progress}%`}</strong>
          </div>
          <div>
            <span>Верных ответов</span>
            <strong>
              {result.correct} / {result.answered}
            </strong>
          </div>
        </div>

        <div className="account-result-meta">
          <span>
            {result.completed ? "Тест пройден полностью" : "Тест завершён досрочно"}
          </span>
          <span>{result.answered} из {result.total} вопросов</span>
        </div>

        <LessonRecommendations
          topics={result.mistakes.map((mistake) => mistake.topic)}
        />

        <div className="account-mistakes">
          <div className="account-mistakes__head">
            <p className="eyebrow">Ошибки</p>
            <span>{result.mistakes.length}</span>
          </div>

          {grammarVocabularyMistakes.length > 0 ? (
            <div className="account-mistake-list">
              {grammarVocabularyMistakes.map((mistake) => (
                <MistakeCard
                  key={mistake.id}
                  mistake={{
                    topic: mistake.topic,
                    skill: mistake.skill,
                    question: mistake.question,
                    selectedAnswer: mistake.selectedAnswer,
                    correctAnswer: mistake.correctAnswer,
                    explanation: mistake.explanation,
                  }}
                />
              ))}
            </div>
          ) : readingMistakes.length === 0 ? (
            <div className="account-empty">
              <p>В этом прохождении нет ошибок. Отличный результат.</p>
            </div>
          ) : null}

          {readingMistakes.length > 0 ? (
            <details className="reading-mistakes">
              <summary>
                Ошибки Reading <span>{readingMistakes.length}</span>
              </summary>
              <div className="reading-mistakes__list">
                {readingMistakes.map((mistake) => {
                  const passage = mistake.passageId
                    ? trialBank.passageById.get(mistake.passageId)
                    : undefined;
                  return (
                    <MistakeCard
                      key={mistake.id}
                      mistake={{
                        topic: mistake.topic,
                        skill: mistake.skill,
                        question: mistake.question,
                        selectedAnswer: mistake.selectedAnswer,
                        correctAnswer: mistake.correctAnswer,
                        explanation: mistake.explanation,
                        passageTitle: passage?.title,
                        passageText: passage?.text,
                      }}
                    />
                  );
                })}
              </div>
            </details>
          ) : null}
        </div>
      </div>
    </section>
  );
}
