import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const skillLabels: Record<string, string> = {
  grammar: "Grammar",
  vocabulary: "Vocabulary",
  reading: "Reading",
};

type ResultPageProps = {
  params: Promise<{ id: string }>;
};

export default function ResultPage({ params }: ResultPageProps) {
  return (
    <Suspense
      fallback={
        <section className="page-shell auth-page">
          <div className="container auth-container account-result-page">
            <p className="eyebrow">English Platform · результат</p>
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

  return (
    <section className="page-shell auth-page">
      <div className="container auth-container account-result-page">
        <p className="eyebrow">English Platform · аккаунт</p>
        <Link href="/account" className="account-back">
          ← В личный кабинет
        </Link>

        <h1 className="page-title">Разбор результата</h1>
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

        <div className="account-mistakes">
          <div className="account-mistakes__head">
            <p className="eyebrow">Ошибки</p>
            <span>{result.mistakes.length}</span>
          </div>

          {result.mistakes.length === 0 ? (
            <div className="account-empty">
              <p>В этом прохождении нет ошибок. Отличный результат.</p>
            </div>
          ) : (
            <div className="account-mistake-list">
              {result.mistakes.map((mistake) => (
                <article key={mistake.id} className="account-mistake-card">
                  <div className="account-mistake-card__tags">
                    <span>
                      {skillLabels[mistake.skill] ?? mistake.skill}
                    </span>
                    <span>{mistake.topic}</span>
                  </div>
                  <h3>{mistake.question}</h3>
                  <div className="account-mistake-card__answers">
                    <p>
                      <span>Ваш ответ</span>
                      <del>{mistake.selectedAnswer}</del>
                    </p>
                    <p>
                      <span>Правильно</span>
                      <ins>{mistake.correctAnswer}</ins>
                    </p>
                  </div>
                  {mistake.explanation ? (
                    <p className="account-mistake-card__explanation">
                      {mistake.explanation}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
