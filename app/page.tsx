import Image from "next/image";
import Link from "next/link";

import bigBen from "../big-ben.png";

const FEATURES = [
  {
    title: "CEFR-диагностика",
    text: "Результат в привычной шкале Pre-A1–C2",
  },
  {
    title: "Grammar, Vocabulary, Reading",
    text: "Три навыка проверяются независимо. Видно, что именно влияет на общий результат",
  },
  {
    title: "Адаптивная сложность",
    text: "Алгоритм подбирает задания по ответам. Не тратьте время на слишком простые или неподходящие вопросы",
  },
  {
    title: "Профиль результатов",
    text: "После теста вас ждет расшифровка уровня, доступные задачи и зоны роста",
  },
];

const REASONS = [
  {
    title: "Что вы умеете",
    text: "Описание навыков и типичных задач для вашего уровня — без завышенных обещаний.",
  },
  {
    title: "Что улучшать",
    text: "Зоны роста по грамматике, лексике и чтению, а не абстрактное «продолжайте учиться».",
  },
  {
    title: "Насколько надёжно",
    text: "Уверенность результата показывается отдельно: это не оценка способностей, а качество данных.",
  },
];

export default function Home() {
  return (
    <section className="page-shell home-page">
      <div className="container">
        <div className="home-hero">
          <div className="home-hero__content">
            <p className="eyebrow">CEFR-диагностика</p>

            <h1 className="display-title">
              Узнайте свой уровень английского за{" "}
              <span className="display-number">10</span> минут!
            </h1>

            <p className="lead">
              Умная диагностика английского - получите ваш профиль знаний за
              несколько минут.
            </p>
            <p className="lead">
              Тест разработан с опорой на методические материалы и рекомендации
              Кембриджа. Адаптивный алгоритм подстраивает сложность заданий под
              ваши ответы в процессе прохождения.
            </p>

            <div className="actions">
              <Link href="/test" className="button button--primary">
                Пройти тест
              </Link>
              <Link href="/cefr" className="button button--ghost">
                Уровни CEFR
              </Link>
              <Link href="/speaking" className="button button--speaking">
                <span className="button__speaking-dot" aria-hidden="true" />
                Проверить Speaking
              </Link>
            </div>
          </div>

          <figure className="home-hero__media">
            <Image
              src={bigBen}
              alt="Big Ben и здание парламента в Лондоне на закате"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 45vw"
              className="home-hero__image"
            />
          </figure>
        </div>

        <div className="stats">
          <div className="stat">
            <strong>30</strong>
            <span>вопросов</span>
          </div>
          <div className="stat">
            <strong>3</strong>
            <span>навыка</span>
          </div>
          <div className="stat">
            <strong>5–10</strong>
            <span>минут</span>
          </div>
          <div className="stat">
            <strong>Pre-A1–C2</strong>
            <span>шкала CEFR</span>
          </div>
        </div>

        <section className="section-block">
          <div className="section-heading">
            <h2 className="section-title">Что внутри диагностики</h2>
          </div>

          <div className="feature-grid">
            {FEATURES.map((feature, index) => (
              <article key={feature.title} className="feature-card">
                <span className="feature-card__number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section-block">
          <div className="section-heading">
            <h2 className="section-title">Понятный профиль знаний</h2>
          </div>

          <div className="reason-grid">
            {REASONS.map((reason) => (
              <div key={reason.title} className="reason">
                <strong>{reason.title}</strong>
                <p>{reason.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="cta">
          <div>
            <h2>Готовы увидеть свой профиль?</h2>
            <p>
              30 вопросов, три навыка и ориентир CEFR. Тест даёт
              предварительную оценку и не заменяет официальный экзамен.
            </p>
          </div>
          <Link href="/test" className="button button--primary">
            Начать тест
          </Link>
        </section>
      </div>
    </section>
  );
}
