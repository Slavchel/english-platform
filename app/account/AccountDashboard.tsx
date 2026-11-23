"use client";

import Link from "next/link";
import { useState, type CSSProperties, type ReactNode } from "react";

import { signOutAction, resetTestAccount } from "./actions";
import type { SubscriptionTier } from "@/lib/subscription/plans";

type AccountResult = {
  id: string;
  date: string;
  level: string | null;
  score: number;
  correct: number;
  answered: number;
  completed: boolean;
};

type AccountAnalysis = {
  id: string;
  type: string;
  title: string;
  level: string | null;
  score: number | null;
  summary: string | null;
  date: string;
};

type LearningProgress = {
  id: string;
  title: string;
  color: string;
  completed: number;
  total: number;
};

type AccountTab = "overview" | "history" | "ai";

interface AccountDashboardProps {
  email: string;
  tier: SubscriptionTier;
  canReset: boolean;
  level: string;
  lastTestDate: string;
  results: AccountResult[];
  analyses: AccountAnalysis[];
  learningProgress: LearningProgress[];
}

const tabs: { id: AccountTab; label: string }[] = [
  { id: "overview", label: "Обзор" },
  { id: "history", label: "История тестов" },
  { id: "ai", label: "AI-разборы" },
];

function resultLevel(result: AccountResult) {
  return result.completed && result.level ? result.level : "Не определён";
}

function isDimmed(result: AccountResult) {
  return !result.completed || !result.level || result.score <= 0;
}

function scoreColor(score: number) {
  if (score >= 80) return "#9ed8ae";
  if (score >= 50) return "#d8bd82";
  return "#d79b94";
}

function ScoreRing({ score }: { score: number }) {
  const color = scoreColor(score);
  return (
    <span
      className="account-score-ring"
      style={
        {
          "--score-angle": `${Math.max(0, Math.min(100, score)) * 3.6}deg`,
          "--score-color": color,
        } as CSSProperties
      }
    >
      <span>{score}%</span>
    </span>
  );
}

function TestRow({ result }: { result: AccountResult }) {
  return (
    <Link
      href={`/account/results/${result.id}`}
      className={`account-test-row flex items-center justify-between gap-4 py-4 ${
        isDimmed(result) ? "opacity-50" : ""
      }`}
    >
      <span className="account-test-row__date">{result.date}</span>
      <span className="flex shrink-0 items-center gap-4">
        <strong className="account-test-row__level">{resultLevel(result)}</strong>
        <span className="account-test-row__score">{result.score}%</span>
        <span className="account-test-row__arrow" aria-hidden="true">
          →
        </span>
      </span>
    </Link>
  );
}

function SectionHeader({
  title,
  action,
}: {
  title: string;
  action: ReactNode;
}) {
  return (
    <div className="account-section-head mb-12 flex items-end justify-between gap-4">
      <h2 className="account-section-title">{title}</h2>
      {action}
    </div>
  );
}

function AiCard({
  analysis,
  compact = false,
}: {
  analysis: AccountAnalysis;
  compact?: boolean;
}) {
  return (
    <Link
      href={`/account/ai/${analysis.id}`}
      className={`account-ai-card ${compact ? "account-ai-card--compact" : ""}`}
    >
      <div className="account-ai-card__top">
        <span>{analysis.type === "speaking" ? "Speaking" : "CEFR-тест"}</span>
        <time>{analysis.date}</time>
      </div>
      <h3>{analysis.title}</h3>
      {analysis.summary ? <p>{analysis.summary}</p> : null}
      <div className="account-ai-card__meta">
        {analysis.level ? <span>{analysis.level}</span> : null}
        {analysis.score !== null ? <span>{analysis.score}%</span> : null}
        <span>Открыть разбор →</span>
      </div>
    </Link>
  );
}

export default function AccountDashboard({
  email,
  tier,
  canReset,
  level,
  lastTestDate,
  results,
  analyses,
  learningProgress,
}: AccountDashboardProps) {
  const [tab, setTab] = useState<AccountTab>("overview");
  const latestAnalysis = analyses[0] ?? null;
  const recentResults = results.slice(0, 2);
  const latestDate = lastTestDate || "Пока нет тестов";

  return (
    <section className="page-shell account-dashboard-page">
      <div className="container account-dashboard">
        <h1 className="sr-only">Личный кабинет</h1>
        <div className="account-dashboard__profile gap-6">
          <div className="account-profile p-8">
            <p className="eyebrow">NeoLeng · аккаунт</p>
            <p className="account-profile__email">{email}</p>
            <p className="account-profile__hint">
              История, результаты и персональные разборы в одном месте.
            </p>
            <form action={signOutAction}>
              <button type="submit" className="account-profile__logout">
                Выйти
              </button>
            </form>
            {canReset ? (
              <form
                action={resetTestAccount}
                onSubmit={(event) => {
                  if (
                    !window.confirm(
                      "Обнулить аккаунт? Будут удалены подписка, прогресс, тесты и AI-разборы.",
                    )
                  ) {
                    event.preventDefault();
                  }
                }}
              >
                <button type="submit" className="account-profile__reset">
                  Обнулить аккаунт
                </button>
              </form>
            ) : null}
          </div>

          <div className="account-level-card p-8">
            <p className="account-level-card__label">Текущий уровень</p>
            <p className="account-level-card__level">{level}</p>
            <p className="account-level-card__date">
              Последний тест
              <span>{latestDate}</span>
            </p>
          </div>
        </div>

        <div className="account-plan-banner">
          <p>
            Ваш тариф:{" "}
            <strong>
              {tier === "PRO"
                ? "Pro"
                : tier === "NEURO_TUTOR"
                  ? "Neuro-Tutor"
                  : "Free"}
            </strong>
            .
          </p>
          {tier === "PRO" ? (
            <Link href="/pricing">Тарифы</Link>
          ) : tier === "NEURO_TUTOR" ? (
            <p>Персональный AI-репетитор уже в вашем распоряжении.</p>
          ) : (
            <Link href="/pricing">Улучшить до Pro за 199 руб/мес</Link>
          )}
        </div>

        <div
          className="account-tabs mb-10"
          role="tablist"
          aria-label="Разделы аккаунта"
        >
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              aria-controls={`account-panel-${item.id}`}
              onClick={() => setTab(item.id)}
              className={`account-tab ${tab === item.id ? "account-tab--active" : ""}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div
          key={tab}
          id={`account-panel-${tab}`}
          role="tabpanel"
          className="account-tab-panel mt-0"
        >
          {tab === "overview" ? (
            <div className="account-overview space-y-12">
              <div>
                <SectionHeader
                  title="Обучение"
                  action={
                    <Link href="/learning" className="account-link-button">
                      Все программы
                    </Link>
                  }
                />

                {learningProgress.length > 0 ? (
                  <div className="account-learning-progress">
                    {learningProgress.map((program) => {
                      const percent = Math.round(
                        (program.completed / program.total) * 100,
                      );
                      return (
                        <Link
                          key={program.id}
                          href={`/courses/${program.id}`}
                          className="account-learning-card"
                          style={
                            {
                              "--program-color": program.color,
                            } as CSSProperties
                          }
                        >
                          <div className="account-learning-card__top">
                            <h3>{program.title}</h3>
                            <strong>{percent}%</strong>
                          </div>
                          <div className="account-learning-card__bar">
                            <span style={{ width: `${percent}%` }} />
                          </div>
                          <p>
                            Пройдено {program.completed} из {program.total} уроков
                          </p>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="account-dashboard-empty">
                    <p>Обучение ещё не начато.</p>
                    <Link href="/learning" className="button button--primary">
                      Начать обучение
                    </Link>
                  </div>
                )}
              </div>

              <div>
                <SectionHeader
                  title="AI-разбор"
                  action={
                    analyses.length > 0 ? (
                      <button
                        type="button"
                        className="account-link-button"
                        onClick={() => setTab("ai")}
                      >
                        Все разборы
                      </button>
                    ) : null
                  }
                />

                {latestAnalysis ? (
                  <AiCard analysis={latestAnalysis} compact />
                ) : (
                  <div className="account-dashboard-empty">
                    <p>AI-разборы появятся после Speaking или CEFR-теста.</p>
                  </div>
                )}
              </div>

              <div>
                <SectionHeader
                  title="Тесты"
                  action={
                    results.length > 0 ? (
                      <button
                        type="button"
                        className="account-link-button"
                        onClick={() => setTab("history")}
                      >
                        Вся история
                      </button>
                    ) : null
                  }
                />

                {recentResults.length > 0 ? (
                  <div className="account-test-list">
                    {recentResults.map((result) => (
                      <TestRow key={result.id} result={result} />
                    ))}
                  </div>
                ) : (
                  <div className="account-dashboard-empty">
                    <p>Пройдите CEFR-тест, чтобы увидеть результаты.</p>
                    <Link href="/test" className="button button--primary">
                      Пройти тест
                    </Link>
                  </div>
                )}
              </div>

              <Link href="/learning" className="account-learning-cta">
                <span>
                  <small>Следующий шаг</small>
                  Перейти к обучению
                </span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          ) : null}

          {tab === "history" ? (
            <div>
              <div className="account-panel-head">
                <div>
                  <p className="eyebrow">CEFR-история</p>
                  <h2>История тестов</h2>
                </div>
                <Link href="/test" className="account-link-button">
                  Новый тест
                </Link>
              </div>

              {results.length === 0 ? (
                <div className="account-dashboard-empty">
                  <p>Здесь появятся все прохождения CEFR-теста.</p>
                  <Link href="/test" className="button button--primary">
                    Пройти тест
                  </Link>
                </div>
              ) : (
                <div className="account-history-grid">
                  {results.map((result) => (
                    <Link
                      key={result.id}
                      href={`/account/results/${result.id}`}
                      className={`account-history-card ${
                        isDimmed(result) ? "opacity-50" : ""
                      }`}
                    >
                      <div>
                        <time>{result.date}</time>
                        <strong>{resultLevel(result)}</strong>
                        <small>
                          {result.correct} из {result.answered} верно
                        </small>
                      </div>
                      <ScoreRing score={result.score} />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {tab === "ai" ? (
            <div>
              <div className="account-panel-head">
                <div>
                  <p className="eyebrow">Персональные разборы</p>
                  <h2>AI-разборы</h2>
                </div>
                <span className="account-count">{analyses.length}</span>
              </div>

              {analyses.length === 0 ? (
                <div className="account-dashboard-empty">
                  <p>
                    AI-разборы Speaking и CEFR-теста будут сохраняться здесь
                    автоматически.
                  </p>
                </div>
              ) : (
                <div className="account-ai-grid">
                  {analyses.map((analysis) => (
                    <AiCard key={analysis.id} analysis={analysis} />
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
