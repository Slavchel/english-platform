"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  ANALYTICS_CONSENT_EVENT,
  readAnalyticsConsent,
} from "@/lib/analytics-consent";

const METRICA_ID = 114726883;
const METRICA_SCRIPT_ID = "neoleng-yandex-metrica";

type YandexMetricaQueue = ((...args: unknown[]) => void) & {
  a?: unknown[];
  l?: number;
};

declare global {
  interface Window {
    ym?: YandexMetricaQueue;
    __neolengMetricaInitialized?: boolean;
  }
}

function loadMetricaScript() {
  if (document.getElementById(METRICA_SCRIPT_ID)) return;

  const script = document.createElement("script");
  script.id = METRICA_SCRIPT_ID;
  script.async = true;
  script.src = `https://mc.yandex.ru/metrika/tag.js?id=${METRICA_ID}`;
  document.head.appendChild(script);
}

export default function YandexMetrica() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);
  const lastPathRef = useRef<string | null>(null);
  const lastUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const sync = () => setEnabled(readAnalyticsConsent() === "accepted");

    sync();
    window.addEventListener(ANALYTICS_CONSENT_EVENT, sync);

    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, sync);
  }, []);

  const initialize = useCallback(() => {
    if (!enabled || typeof window === "undefined") return;

    // Official Yandex Metrica queue stub. It lets us queue init/hit calls
    // while the asynchronous tag.js is still loading.
    if (typeof window.ym !== "function") {
      const queue = ((...args: unknown[]) => {
        queue.a?.push(args);
      }) as YandexMetricaQueue;
      queue.a = [];
      queue.l = Date.now();
      window.ym = queue;
    }

    loadMetricaScript();

    if (window.__neolengMetricaInitialized) return;

    const pageUrl = `${window.location.origin}${pathname}`;

    window.ym(METRICA_ID, "init", {
      ssr: true,
      webvisor: true,
      clickmap: true,
      referrer: document.referrer,
      url: pageUrl,
      accurateTrackBounce: true,
      trackLinks: true,
      // Ecommerce is intentionally disabled until checkout is launched.
    });

    window.__neolengMetricaInitialized = true;
    lastPathRef.current = pathname;
    lastUrlRef.current = pageUrl;
  }, [enabled, pathname]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (
      !enabled ||
      !window.__neolengMetricaInitialized ||
      typeof window.ym !== "function"
    ) {
      return;
    }

    if (lastPathRef.current === null) {
      lastPathRef.current = pathname;
      lastUrlRef.current = `${window.location.origin}${pathname}`;
      return;
    }

    if (lastPathRef.current === pathname) return;

    const pageUrl = `${window.location.origin}${pathname}`;
    window.ym(METRICA_ID, "hit", pageUrl, {
      title: document.title,
      referer: lastUrlRef.current ?? document.referrer,
    });

    lastPathRef.current = pathname;
    lastUrlRef.current = pageUrl;
  }, [enabled, pathname]);

  if (!enabled) return null;

  return (
    <noscript>
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://mc.yandex.ru/watch/${METRICA_ID}`}
          style={{ position: "absolute", left: "-9999px" }}
          alt=""
        />
      </div>
    </noscript>
  );
}
