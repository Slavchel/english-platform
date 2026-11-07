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

const typeLabels: Record<string, string> = {
  speaking: "Speaking",
  test: "CEFR-тест",
};

const scoreLabels: Record<string, string> = {
  grammar: "Grammar",
  vocabulary: "Vocabulary",
  reading: "Reading",
  fluency: "Fluency",
  coherence: "Coherence",
};

type AiPageProps = {
  params: Promise<{ id: string }>;
};

interface AiMistake {
  original?: unknown;
  question?: unknown;
  selected?: unknown;
  correction?: unknown;
  explanation?: unknown;
}

interface AiData {
  level?: unknown;
  summary?: unknown;
  scores?: unknown;
  strengths?: unknown;
  mistakes?: unknown;
  recommendations?: unknown;
  answered?: unknown;
}

function textValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function parseStoredAnalysis(fullResponse: string): {
  data: AiData;
  raw: string;
} | null {
  try {
    const parsed = JSON.parse(fullResponse) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const record = parsed as Record<string, unknown>;
    if (record.data && typeof record.data === "object") {
      return {
        data: record.data as AiData,
        raw: typeof record.raw === "string" ? record.raw : "",
      };
    }
    return { data: parsed as AiData, raw: "" };
  } catch {
    return null;
  }
}

export default function AiAnalysisPage({ params }: AiPageProps) {
  return (
    <Suspense
      fallback={
        <section className="page-shell auth-page">
          <div className="container auth-container account-result-page">
            <p className="eyebrow">English Platform · AI-разбор</p>
            <h1 className="page-title">Загружаем разбор…</h1>
          </div>
        </section>
      }
    >
      <AiAnalysisContent params={params} />
    </Suspense>
  );
}

async function AiAnalysisContent({ params }: AiPageProps) {
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

  if (!user) notFound();

  const analysis = await prisma.aiAnalysis.findFirst({
    where: { id, userId: user.id },
  });

  if (!analysis) notFound();

  const stored = parseStoredAnalysis(analysis.fullResponse);
  const data = stored?.data;

  if (!data) {
    return (
      <section className="page-shell auth-page">
        <div className="container auth-container account-result-page">
          <p className="eyebrow">English Platform · AI-разбор</p>
          <Link href="/account" className="account-back">
            ← В личный кабинет
          </Link>
          <h1 className="page-title">{analysis.title}</h1>
          <div className="account-empty">
            <p>Не удалось отобразить сохранённый разбор.</p>
          </div>
        </div>
      </section>
    );
  }

  const scores =
    data.scores && typeof data.scores === "object"
      ? Object.entries(data.scores as Record<string, unknown>).filter(
          ([, value]) => typeof value === "number",
        )
      : [];
  const mistakes = Array.isArray(data.mistakes)
    ? (data.mistakes as AiMistake[])
    : [];
  const strengths = stringList(data.strengths);
  const recommendations = stringList(data.recommendations);

  return (
    <section className="page-shell auth-page">
      <div className="container auth-container account-result-page">
        <p className="eyebrow">English Platform · AI-разбор</p>
        <Link href="/account" className="account-back">
          ← В личный кабинет
        </Link>

        <h1 className="page-title">{analysis.title}</h1>
        <p className="account-result-date">
          {typeLabels[analysis.type] ?? analysis.type} ·{" "}
          {dateFormatter.format(analysis.createdAt)}
        </p>

        <div className="cefr-ai-panel account-ai-detail">
          <div className="cefr-ai-panel__head">
            <div>
              <p className="cefr-ai-kicker">
                {typeLabels[analysis.type] ?? "AI-разбор"}
              </p>
              <p className="cefr-ai-summary">
                {textValue(data.summary) || analysis.summary}
              </p>
            </div>
            <div className="cefr-ai-level">
              <span>Уровень</span>
              <strong>{textValue(data.level) || analysis.level || "—"}</strong>
              {typeof data.answered === "number" ? (
                <small>{data.answered} ответов</small>
              ) : null}
            </div>
          </div>

          {scores.length > 0 ? (
            <div className="cefr-ai-scores">
              {scores.map(([skill, score]) => (
                <div className="cefr-ai-score" key={skill}>
                  <div>
                    <span>{scoreLabels[skill] ?? skill}</span>
                    <strong>{String(score)}</strong>
                  </div>
                  <div className="cefr-ai-score__bar">
                    <span style={{ width: `${Number(score)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="cefr-ai-columns">
            {strengths.length > 0 ? (
              <section>
                <h3>Сильные стороны</h3>
                <ul>
                  {strengths.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}
            {recommendations.length > 0 ? (
              <section>
                <h3>Рекомендации</h3>
                <ul>
                  {recommendations.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <section className="cefr-ai-mistakes">
            <h3>Ошибки и пояснения</h3>
            {mistakes.length > 0 ? (
              <div className="cefr-ai-mistakes__list">
                {mistakes.map((mistake, index) => {
                  const question =
                    textValue(mistake.question) ||
                    textValue(mistake.original) ||
                    `Ошибка ${index + 1}`;
                  const selected = textValue(mistake.selected);
                  const correction = textValue(mistake.correction);
                  const explanation = textValue(mistake.explanation);
                  return (
                    <article
                      className="account-mistake-card"
                      key={`${question}-${index}`}
                    >
                      <h3>{question}</h3>
                      <div className="account-mistake-card__answers">
                        {selected ? (
                          <p>
                            <span>Ваш ответ</span>
                            <del>{selected}</del>
                          </p>
                        ) : null}
                        {correction ? (
                          <p>
                            <span>Правильно</span>
                            <ins>{correction}</ins>
                          </p>
                        ) : null}
                      </div>
                      {explanation ? (
                        <p className="account-mistake-card__explanation">
                          {explanation}
                        </p>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="cefr-ai-note">Ошибок не найдено.</p>
            )}
          </section>

          {stored?.raw ? (
            <details className="account-ai-raw">
              <summary>Показать исходный ответ AI</summary>
              <pre>{stored.raw}</pre>
            </details>
          ) : null}
        </div>
      </div>
    </section>
  );
}
