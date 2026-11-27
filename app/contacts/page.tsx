import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Контакты — NeoLeng",
  description:
    "Контакты NeoLeng: общие вопросы, поддержка и сотрудничество.",
};

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function SupportIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 14v-2a9 9 0 0 1 18 0v2" />
      <path d="M21 14v4a2 2 0 0 1-2 2h-1a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h3z" />
      <path d="M3 14v4a2 2 0 0 0 2 2h1a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H3z" />
    </svg>
  );
}

function CooperationIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

const CONTACTS = [
  {
    label: "Общие вопросы",
    email: "hello@neoleng.ru",
    hint: "О платформе и не только",
    icon: <MailIcon />,
  },
  {
    label: "Поддержка",
    email: "support@neoleng.ru",
    hint: "Помощь с доступом, оплатой и обучением",
    icon: <SupportIcon />,
  },
  {
    label: "Сотрудничество",
    email: "hello@neoleng.ru",
    hint: "Партнёрство и предложения",
    icon: <CooperationIcon />,
  },
];

export default function ContactsPage() {
  return (
    <section className="page-shell contacts-page">
      <div className="container contacts-container">
        <header className="contacts-header">
          <p className="eyebrow">NeoLeng · контакты</p>
          <h1 className="page-title">Контакты</h1>
          <p className="lead">
            Есть вопросы о платформе, предложения о сотрудничестве или просто
            хотите поздороваться? Мы всегда открыты к общению.
          </p>
        </header>

        <div className="contact-cards">
          {CONTACTS.map((contact) => (
            <article className="contact-card" key={contact.label}>
              <span className="contact-card__icon">{contact.icon}</span>
              <span className="contact-card__label">{contact.label}</span>
              <a
                className="contact-card__value"
                href={`mailto:${contact.email}`}
              >
                {contact.email}
              </a>
              <span className="contact-card__hint">{contact.hint}</span>
            </article>
          ))}
        </div>

        <section className="contact-requisites" aria-labelledby="requisites-title">
          <div className="contact-requisites__head">
            <p className="eyebrow">Документы</p>
            <h2 id="requisites-title">Реквизиты</h2>
          </div>

          <dl className="contact-requisites__list">
            <div>
              <dt>Плательщик НПД</dt>
              <dd>Кулик Святослав Сергеевич</dd>
            </div>
            <div>
              <dt>ИНН</dt>
              <dd>220416548980</dd>
            </div>
            <div>
              <dt>Email для юридических лиц</dt>
              <dd>
                <a href="mailto:hello@neoleng.ru">hello@neoleng.ru</a>
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </section>
  );
}
