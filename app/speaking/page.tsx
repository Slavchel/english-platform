import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";

import { auth } from "@/auth";
import { isCefrLevel } from "@/lib/cefr/levels";
import SpeakingChat from "./SpeakingChat";

export const metadata: Metadata = {
  title: "Speaking — English Platform",
  description:
    "Практика разговорного английского с Emma: живой диалог и пять вопросов.",
};

type SpeakingPageProps = {
  searchParams: Promise<{ level?: string | string[] }>;
};

export default function SpeakingPage({
  searchParams,
}: SpeakingPageProps) {
  return (
    <section className="page-shell speaking-page">
      <div className="container speaking-page__container">
        <p className="eyebrow">English Platform · Speaking</p>
        <h1 className="speaking-title">Speaking Practice</h1>
        <p className="speaking-subtitle">
          Диалог с преподавателем: пять вопросов, текстовые ответы и итоги
          разговора.
        </p>

        <Suspense
          fallback={
            <div className="speaking-shell speaking-loading">
              Загружаем разговор…
            </div>
          }
        >
          <SpeakingContent searchParams={searchParams} />
        </Suspense>
      </div>
    </section>
  );
}

async function SpeakingContent({
  searchParams,
}: SpeakingPageProps) {
  const params = await searchParams;
  const requestedLevel = Array.isArray(params.level)
    ? params.level[0]
    : params.level;
  const level = isCefrLevel(requestedLevel) ? requestedLevel : null;
  await connection();
  const session = await auth();

  return (
    <div className="speaking-shell">
      <SpeakingChat level={level} isAuthenticated={Boolean(session?.user)} />
    </div>
  );
}
