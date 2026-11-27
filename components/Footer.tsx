import Image from "next/image";
import Link from "next/link";

import logo from "@/app/neoleng-logo.png";

const LEARNING_LINKS = [
  { href: "/learning", label: "Все программы" },
  { href: "/cefr", label: "Уровни CEFR" },
  { href: "/test", label: "Тест на уровень" },
];

const HELP_LINKS = [
  { href: "/support", label: "Поддержка" },
  { href: "/contacts", label: "Контакты" },
];

const LEGAL_LINKS = [
  { href: "/privacy", label: "Политика конфиденциальности" },
  { href: "/terms", label: "Пользовательское соглашение" },
  { href: "/refund", label: "Оплата и возврат" },
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__grid">
          <div className="site-footer__brand">
            <Link href="/" className="brand brand--logo" aria-label="NeoLeng — на главную">
              <Image
                src={logo}
                alt="NeoLeng"
                className="site-footer__logo"
                sizes="160px"
              />
            </Link>
            <p className="site-footer__description">
              Изучай английский через интерактивные уроки и современные
              технологии
            </p>
          </div>

          <nav className="site-footer__column" aria-label="Обучение">
            <h2 className="site-footer__title">Обучение</h2>
            <ul className="site-footer__links">
              {LEARNING_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="site-footer__column" aria-label="Помощь">
            <h2 className="site-footer__title">Помощь</h2>
            <ul className="site-footer__links">
              {HELP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
              <li>
                <a href="mailto:support@neoleng.ru">support@neoleng.ru</a>
              </li>
            </ul>
          </nav>

          <nav className="site-footer__column" aria-label="Документы">
            <h2 className="site-footer__title">Документы</h2>
            <ul className="site-footer__links">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="site-footer__bottom">
          <p>
            © 2026 NeoLeng. Все права защищены. Кулик Святослав Сергеевич, ИНН 220416548980.
          </p>
        </div>
      </div>
    </footer>
  );
}
