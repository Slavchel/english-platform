import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { runAdminTest } from "./actions";
import { activateProTest } from "./actions";

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <section className="page-shell auth-page">
          <div className="container auth-container">
            <p className="eyebrow">NeoLeng · админка</p>
            <h1 className="page-title">Уроки</h1>
            <p className="lead">Загружаем список…</p>
          </div>
        </section>
      }
    >
      <AdminContent />
    </Suspense>
  );
}

async function AdminContent() {
  await connection();
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }
  if (!session.user.isAdmin) {
    notFound();
  }

  const lessons = await prisma.lesson.findMany({
    orderBy: { title: "asc" },
    select: { topic: true, title: true, level: true },
  });

  return (
    <section className="page-shell auth-page">
      <div className="container auth-container">
        <p className="eyebrow">NeoLeng · админка</p>
        <h1 className="page-title">Уроки</h1>
        <p className="lead">
          Все загруженные обучающие карточки. Открывайте теоретические карточки:
          внутри есть кнопка «Пройти интерактив».
        </p>

        <form action={runAdminTest}>
          <button type="submit" className="button button--primary">
            Пройти тест автоматически
          </button>
        </form>

        <form action={activateProTest} className="admin-pro-form">
          <button type="submit" className="button button--ghost">
            Активировать Pro (Тест)
          </button>
          <p>Тестовая активация тарифа Pro для текущего администратора.</p>
        </form>

        {lessons.length === 0 ? (
          <div className="account-empty">
            <p>Уроков пока нет. Запустите seed-скрипт.</p>
          </div>
        ) : (
          <ul className="admin-lesson-list">
            {lessons.map((lesson) => (
              <li key={lesson.topic}>
                <Link
                  href={`/lesson/${lesson.topic}?view=guide&from=admin`}
                >
                  {lesson.title}
                </Link>
                <span>{lesson.level}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
