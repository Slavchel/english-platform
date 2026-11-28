import type { Metadata, Viewport } from "next";
import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import "./analytics-consent.css";
import "./home-refresh.css";
import "./premium.css";
import "./lesson-reentry.css";
import "./speaking-guide.css";
import "./test-buttons.css";
import "./speaking-redesign.css";
import "./learning-enhance.css";
import "./pricing.css";
import logo from "./neoleng-logo.png";
import AuthLink from "./components/AuthLink";
import AnalyticsConsent from "./components/AnalyticsConsent";
import AnalyticsPrivacy from "./components/AnalyticsPrivacy";
import YandexMetrica from "./components/YandexMetrica";
import Footer from "@/components/Footer";

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
  title: "NeoLeng — диагностика английского",
  description:
    "Адаптивная CEFR-диагностика английского: Grammar, Vocabulary и Reading.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="ru"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Suspense fallback={null}>
          <YandexMetrica />
        </Suspense>
        <header className="site-header">
          <div className="container site-header__inner">
            <Link
              href="/"
              className="brand brand--logo"
              aria-label="NeoLeng — на главную"
            >
              <Image
                src={logo}
                alt="NeoLeng"
                className="brand__logo"
                priority
              />
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
                  <Link href="/learning" className="nav-link">
                    Обучение
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
        <Suspense fallback={null}>
          <AnalyticsPrivacy />
        </Suspense>

        <Footer />
        <AnalyticsConsent />
      </body>
    </html>
  );
}
