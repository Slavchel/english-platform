import type { Metadata } from "next";

import { LEVEL_GUIDES } from "@/lib/cefr/level-guide";

export const metadata: Metadata = {
  title: "Уровни CEFR — English Platform",
  description:
    "Ориентиры Pre-A1–C2: понимание, чтение, лексика, грамматика, общение и практические задачи.",
};

export default function CefrPage() {
  return (
    <section className="page-shell">
      <div className="container">
        <p className="eyebrow">English Platform · CEFR</p>
        <h1 className="page-title">Уровни CEFR</h1>
        <p className="lead">
          CEFR — общеевропейская шкала владения языком. Ниже — краткие
          ориентиры по каждому уровню: что человек обычно понимает, читает и
          умеет делать. Это не официальный экзамен и не точная сертификация.
        </p>

        <div className="cefr-list">
          {LEVEL_GUIDES.map((guide) => (
            <article key={guide.level} className="level-card">
              <div className="level-card__head">
                <h2 className="level-card__level">{guide.level}</h2>
                <span className="level-card__name">{guide.name}</span>
              </div>
              <p className="level-card__summary">{guide.summary}</p>

              <dl className="level-grid">
                <div>
                  <dt>Понимание</dt>
                  <dd>{guide.understanding}</dd>
                </div>
                <div>
                  <dt>Чтение</dt>
                  <dd>{guide.reading}</dd>
                </div>
                <div>
                  <dt>Лексика</dt>
                  <dd>{guide.vocabulary}</dd>
                </div>
                <div>
                  <dt>Грамматика</dt>
                  <dd>{guide.grammar}</dd>
                </div>
                <div>
                  <dt>Общение</dt>
                  <dd>{guide.communication}</dd>
                </div>
                <div>
                  <dt>Практические задачи</dt>
                  <dd>
                    <ul className="level-card__tasks">
                      {guide.tasks.map((task) => (
                        <li key={task}>{task}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              </dl>

              <div className="level-card__footer">
                <p>
                  <span>Отличие от соседних уровней: </span>
                  {guide.differences}
                </p>
                <p>
                  <span>Что развивать: </span>
                  {guide.improve.join(" ")}
                </p>
              </div>
            </article>
          ))}
        </div>

        <p className="lead mt-8 text-sm">
          Уровни описывают типичные умения, а не гарантируют одинаковый
          результат во всех ситуациях. Для точной сертификации нужен
          официальный экзамен.
        </p>
      </div>
    </section>
  );
}
