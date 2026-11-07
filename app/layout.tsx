import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import AuthLink from "./components/AuthLink";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "English Platform — диагностика английского",
  description:
    "Адаптивная CEFR-диагностика английского: Grammar, Vocabulary и Reading.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="ru"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <header className="site-header">
          <div className="container site-header__inner">
            <Link href="/" className="brand">
              <span className="brand__mark" aria-hidden="true" />
              English Platform
            </Link>

            <nav aria-label="Основная навигация">
              <ul className="site-nav">
                <li>
                  <Link href="/" className="nav-link">
                    Главная
                  </Link>
                </li>
                <li>
                  <Link href="/test" className="nav-link">
                    Тест уровня
                  </Link>
                </li>
                <li>
                  <Link href="/speaking" className="nav-link">
                    Speaking
                  </Link>
                </li>
                <li>
                  <Link href="/cefr" className="nav-link">
                    Уровни CEFR
                  </Link>
                </li>
                <Suspense
                  fallback={
                    <li>
                      <Link href="/login" className="nav-link">
                        Войти
                      </Link>
                    </li>
                  }
                >
                  <AuthLink />
                </Suspense>
              </ul>
            </nav>
          </div>
        </header>

        <main className="flex flex-1 flex-col">{children}</main>

        <footer className="site-footer">
          <div className="container site-footer__inner">
            <p>
              © English Platform. Тест разработан с опорой на методические
              материалы и рекомендации Кембриджа. Не является официальной
              сертификацией или одобрением Cambridge.
            </p>
            <p>Пробная версия · результат ориентировочный</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
