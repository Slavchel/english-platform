"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function LearningAuthGate({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) return;

    const onClick = (event: MouseEvent) => {
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0
      ) {
        return;
      }

      const target = event.target as Element | null;
      const anchor = target?.closest("a");
      if (!anchor) return;

      const url = new URL(anchor.href, window.location.origin);
      if (
        !url.pathname.startsWith("/lesson/") &&
        !url.pathname.startsWith("/courses/")
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      setOpen(true);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [isAuthenticated]);

  if (!open) return null;

  return (
    <div
      className="auth-modal"
      role="presentation"
      onClick={() => setOpen(false)}
    >
      <div
        className="auth-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="learning-auth-title"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="auth-modal__kicker">Доступ к обучению</p>
        <h2 id="learning-auth-title">Войдите или зарегистрируйтесь</h2>
        <p>
          Чтобы открыть урок или программу, нужен аккаунт. После входа вы
          вернётесь на страницу обучения.
        </p>
        <div className="auth-modal__actions">
          <Link
            href={`/login?callbackUrl=${encodeURIComponent("/learning")}`}
            className="button button--primary"
          >
            Войти или зарегистрироваться
          </Link>
          <button
            type="button"
            className="button button--ghost"
            onClick={() => setOpen(false)}
          >
            Позже
          </button>
        </div>
      </div>
    </div>
  );
}
