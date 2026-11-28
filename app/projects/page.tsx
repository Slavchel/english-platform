import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Наши проекты — NeoLeng",
  description:
    "Результаты нашей профессиональной деятельности и творчества, а также проекты друзей и партнёров NeoLeng.",
};

export default function ProjectsPage() {
  return (
    <section className="page-shell projects-page">
      <div className="container projects-page__container">
        <header className="projects-page__hero">
          <div className="projects-page__meta">
            <p className="eyebrow">NeoLeng · проекты</p>
            <span className="projects-page__index">01 / Партнёрский проект</span>
          </div>

          <h1 className="projects-page__title">Наши проекты</h1>

          <div className="projects-page__lead">
            <p className="projects-page__intro">
              На этой странице мы собрали результаты нашей профессиональной
              деятельности и творчества. Темы, и суть, затронутая в этих
              работах может не соответствовать общей концепции сайта. Всё, что
              здесь находится мы дарим бесплатно для Вашего блага и
              удовольствия. Также, мы предлагаем здесь разместить работы наших
              друзей и партнёров.
            </p>
            <p className="projects-page__caption">
              Портфолио
              <span>информационное сотрудничество</span>
            </p>
          </div>
        </header>

        <div className="projects-page__rule" aria-hidden="true" />

        <div className="projects-page__content">
          <div className="projects-page__section-head">
            <p className="projects-page__kicker">01 · Партнёрский проект</p>
          </div>

          <article className="projects-card">
            <div className="projects-card__top">
              <Image
                src="/partners/verum-work-logo.png"
                alt="Здоровье с Верум Глобал"
                width={610}
                height={100}
                className="projects-card__logo"
                priority
              />
            </div>

            <h2 className="projects-card__title">Здоровье без крайностей</h2>
            <p className="projects-card__description">
              Инновационные продукты для здоровья, молодости и красоты.
              Индивидуальный подход к каждому.
            </p>

            <div className="projects-card__actions">
              <a
                className="projects-card__link"
                href="https://verum-work.ru"
                target="_blank"
                rel="noopener noreferrer"
              >
                Перейти на verum-work.ru
                <span aria-hidden="true">↗</span>
              </a>
              <span className="projects-card__note">
                Сайт откроется в новой вкладке
              </span>
            </div>
          </article>

          <p className="projects-page__disclaimer">
            Партнёрские проекты размещены на странице в рамках
            информационного сотрудничества. Они являются самостоятельными
            проектами своих владельцев.
          </p>

          <div className="projects-page__invite">
            <p>
              Хотите разместить здесь свою работу или проект? Напишите нам —
              обсудим формат и оформление.
            </p>
            <a href="mailto:support@neoleng.ru">
              support@neoleng.ru <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
