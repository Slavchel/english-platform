import type { Metadata } from "next";

import TestRunner from "./TestRunner";

export const metadata: Metadata = {
  title: "Тест на уровень английского — English Platform",
  description:
    "Пробный адаптивный тест по английскому: Grammar, Vocabulary и Reading.",
};

export default function TestPage() {
  return (
    <section className="page-shell test-page-shell">
      <div className="container test-container">
        <h1 className="sr-only">Тест на уровень английского</h1>
        <div className="test-shell">
          <TestRunner />
        </div>
      </div>
    </section>
  );
}
