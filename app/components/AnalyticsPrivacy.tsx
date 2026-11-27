"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const SENSITIVE_PREFIXES = [
  "/account",
  "/admin",
  "/lesson",
  "/login",
  "/speaking",
  "/support",
  "/test",
];

export default function AnalyticsPrivacy() {
  const pathname = usePathname();

  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;

    const isSensitive = SENSITIVE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );

    main.classList.toggle("ym-hide-content", isSensitive);
  }, [pathname]);

  return null;
}
