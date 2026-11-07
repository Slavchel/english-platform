import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Личный кабинет — English Platform",
  description: "Личный кабинет English Platform.",
};

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const aiKindLabels: Record<string, string> = {
  speaking: "Speaking",
  test: "CEFR-тест",
};

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <section className="page-shell auth-page">
          <div className="container auth-container">
            <p className="eyebrow">English Platform · аккаунт</p>
            <h1 className="page-title">Личный кабинет</h1>
            <p className="lead">Проверяем сессию…</p>
          </div>
        </section>
      }
    >
      <AccountContent />
    </Suspense>
  );
}

async function AccountContent() {
  await connection();
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const email = session.user.email ?? "";
  const user = email
    ? await prisma.user.findUnique({
        where: { email },
        select: {
          testResults: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              level: true,
              score: true,
              correct: true,
              answered: true,
              completed: true,
              createdAt: true,
            },
          },
          aiAnalyses: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              type: true,
              title: true,
              level: true,
              score: true,
              summary: true,
              createdAt: true,
            },
          },
        },
      })
    : null;
  const results = user?.testResults ?? [];
  const aiAnalyses = user?.aiAnalyses ?? [];

  return (
    <section className="page-shell auth-page">
      <div className="container auth-container">
        <p className="eyebrow">English Platform · аккаунт</p>
        <h1 className="page-title">Личный кабинет</h1>
        <p className="lead">История ваших результатов и персональная статистика.</p>

        <div className="account-row">
          <span>Email</span>
          <strong>{email}</strong>
        </div>

        <div className="account-results">
          <div className="account-results__head">
            <div>
              <p className="eyebrow">История</p>
              <h2>Пройденные тесты</h2>
            </div>
            {results.length > 0 ? (
              <Link href="/test" className="account-results__new">
                Пройти ещё раз
              </Link>
            ) : null}
          </div>

          {results.length === 0 ? (
            <div className="account-empty">
              <p>
                Здесь появятся результаты CEFR-теста и разбор ошибок.
              </p>
              <Link href="/test" className="button button--primary">
                Пройти тест
              </Link>
            </div>
          ) : (
            <div className="account-result-list">
              {results.map((result) => (
                <Link
                  key={result.id}
                  href={`/account/results/${result.id}`}
                  className="account-result-card"
                >
                  <div className="account-result-card__main">
                    <span className="account-result-card__date">
                      {dateFormatter.format(result.createdAt)}
                    </span>
                    <strong>
                      {result.completed
                        ? result.level ?? "Не определён"
                        : "Не определён"}
                    </strong>
                  </div>
                  <div className="account-result-card__score">
                    <span>{result.score}%</span>
                    <small>
                      {result.correct} из {result.answered} верно
                    </small>
                  </div>
                  <span className="account-result-card__arrow" aria-hidden="true">
                    →
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="account-results account-ai-analyses">
          <div className="account-results__head">
            <div>
              <p className="eyebrow">История</p>
              <h2>AI-разборы</h2>
            </div>
          </div>

          {aiAnalyses.length === 0 ? (
            <div className="account-empty">
              <p>
                AI-разборы Speaking и CEFR-теста будут сохраняться здесь
                автоматически.
              </p>
            </div>
          ) : (
            <div className="account-ai-list">
              {aiAnalyses.map((analysis) => (
                <Link
                  key={analysis.id}
                  href={`/account/ai/${analysis.id}`}
                  className="account-ai-card"
                >
                  <div className="account-ai-card__top">
                    <span>
                      {aiKindLabels[analysis.type] ?? analysis.type}
                    </span>
                    <time dateTime={analysis.createdAt.toISOString()}>
                      {dateFormatter.format(analysis.createdAt)}
                    </time>
                  </div>
                  <h3>{analysis.title}</h3>
                  <p>{analysis.summary}</p>
                  <div className="account-ai-card__meta">
                    {analysis.level ? <span>{analysis.level}</span> : null}
                    {analysis.score !== null ? (
                      <span>{analysis.score}%</span>
                    ) : null}
                    <span>Открыть разбор →</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
