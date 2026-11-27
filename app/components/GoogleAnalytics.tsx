"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

import {
  ANALYTICS_CONSENT_EVENT,
  readAnalyticsConsent,
} from "@/lib/analytics-consent";

export const GA_MEASUREMENT_ID = "G-GWNQZ1PDZ3";

export default function GoogleAnalytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const sync = () => setEnabled(readAnalyticsConsent() === "accepted");

    sync();
    window.addEventListener(ANALYTICS_CONSENT_EVENT, sync);

    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, sync);
  }, []);

  if (!enabled) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          window.gtag = window.gtag || function () {
            window.dataLayer.push(arguments);
          };
          window.gtag('js', new Date());
          window.gtag('config', '${GA_MEASUREMENT_ID}', {
            send_page_view: false
          });
        `}
      </Script>
    </>
  );
}
