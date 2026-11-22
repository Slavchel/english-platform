import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { normalizeTier } from "@/lib/subscription/plans";
import { canResetTestAccount } from "@/lib/subscription/test-access";
import AccountDashboard from "./AccountDashboard";

export const metadata: Metadata = {
  title: "Личный кабинет — English Platform",
  description: "Личный кабинет English Platform.",
};

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <section className="page-shell account-dashboard-page">
          <div className="container account-dashboard">
            <p className="eyebrow">English Platform · аккаунт</p>
            <h1 className="account-dashboard-title">Личный кабинет</h1>
            <p className="account-profile__hint">Загружаем данные…</p>
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
          subscriptionTier: true,
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
          lessonProgress: {
            select: {
              lesson: {
                select: { topic: true },
              },
            },
          },
        },
      })
    : null;

  const courses = await prisma.course.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      title: true,
      color: true,
      modules: {
        select: {
          lessons: { select: { topic: true } },
        },
      },
    },
  });

  const completedTopics = new Set(
    (user?.lessonProgress ?? []).map((item) => item.lesson.topic),
  );
  const learningProgress = courses
    .map((course) => {
      const topics = course.modules.flatMap((module) =>
        module.lessons.map((lesson) => lesson.topic),
      );
      const completed = topics.filter((topic) =>
        completedTopics.has(topic),
      ).length;
      return {
        id: course.id,
        title: course.title,
        color: course.color,
        completed,
        total: topics.length,
      };
    })
    .filter((course) => course.completed > 0);

  const results = user?.testResults ?? [];
  const analyses = user?.aiAnalyses ?? [];
  const latestCompleted = results.find(
    (result) => result.completed && result.level,
  );
  const latestResult = results[0];

  return (
    <AccountDashboard
      email={email}
      tier={normalizeTier(user?.subscriptionTier)}
      canReset={canResetTestAccount(email)}
      level={latestCompleted?.level ?? "—"}
      lastTestDate={
        latestResult ? dateFormatter.format(latestResult.createdAt) : ""
      }
      results={results.map((result) => ({
        id: result.id,
        date: dateFormatter.format(result.createdAt),
        level: result.level,
        score: result.score,
        correct: result.correct,
        answered: result.answered,
        completed: result.completed,
      }))}
      learningProgress={learningProgress}
      analyses={analyses.map((analysis) => ({
        id: analysis.id,
        type: analysis.type,
        title: analysis.title,
        level: analysis.level,
        score: analysis.score,
        summary: analysis.summary,
        date: dateFormatter.format(analysis.createdAt),
      }))}
    />
  );
}
