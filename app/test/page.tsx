import type { Metadata } from "next";
import { connection } from "next/server";

import { auth } from "@/auth";
import TestRunner from "./TestRunner";

export const metadata: Metadata = {
  title: "Тест на уровень английского — English Platform",
  description:
    "Пробный адаптивный тест по английскому: Grammar, Vocabulary и Reading.",
};

export const instant = false;

export default async function TestPage() {
  await connection();
  const session = await auth();

  return (
    <section className="page-shell test-page-shell">
      <div className="container test-container">
        <h1 className="sr-only">Тест на уровень английского</h1>
        <div className="test-shell">
          <TestRunner isAuthenticated={Boolean(session?.user)} />
        </div>
      </div>
    </section>
  );
}
