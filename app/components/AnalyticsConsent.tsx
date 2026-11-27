"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  ANALYTICS_CONSENT_EVENT,
  readAnalyticsConsent,
  setAnalyticsConsent,
  type AnalyticsConsent,
} from "@/lib/analytics-consent";

export default function AnalyticsConsent() {
  const [mounted, setMounted] = useState(false);
  const [consent, setConsent] = useState<AnalyticsConsent>(null);

  useEffect(() => {
    const sync = () => setConsent(readAnalyticsConsent());

    setMounted(true);
    sync();
    window.addEventListener(ANALYTICS_CONSENT_EVENT, sync);

    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, sync);
  }, []);

  if (!mounted || consent) return null;

  const choose = (value: "accepted" | "rejected") => {
    setAnalyticsConsent(value);
    setConsent(value);
  };

  return (
    <aside className="analytics-consent" aria-label="Настройки аналитики">
      <p>
        Мы используем cookie и аналитику, чтобы понимать, как работает сайт.
        Подробнее — в{" "}
        <Link href="/privacy">Политике конфиденциальности</Link>.
      </p>
      <div className="analytics-consent__actions">
        <button
          type="button"
          className="button button--primary"
          onClick={() => choose("accepted")}
        >
          Принять
        </button>
        <button
          type="button"
          className="button button--ghost"
          onClick={() => choose("rejected")}
        >
          Только необходимые
        </button>
      </div>
    </aside>
  );
}
