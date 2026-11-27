"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import {
  ANALYTICS_CONSENT_EVENT,
  readAnalyticsConsent,
} from "@/lib/analytics-consent";

type GtagWindow = Window & {
  gtag?: (...args: unknown[]) => void;
};

export default function GoogleAnalyticsPageView({
  measurementId,
}: {
  measurementId: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const lastPageRef = useRef<string | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const sync = () => setEnabled(readAnalyticsConsent() === "accepted");

    sync();
    window.addEventListener(ANALYTICS_CONSENT_EVENT, sync);

    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, sync);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const pagePath = search ? `${pathname}?${search}` : pathname;
    if (lastPageRef.current === pagePath) return;
    lastPageRef.current = pagePath;

    const gtag = (window as GtagWindow).gtag;
    if (typeof gtag !== "function") return;

    gtag("event", "page_view", {
      page_path: pagePath,
      page_location: window.location.href,
      page_title: document.title,
      send_to: measurementId,
    });
  }, [enabled, measurementId, pathname, search]);

  return null;
}
