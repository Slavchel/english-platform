"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LessonReentryPrompt({
  title,
  nextHref,
}: {
  title: string;
  nextHref: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="lesson-reentry" role="presentation">
      <div
        className="lesson-reentry__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lesson-reentry-title"
      >
        <p className="lesson-reentry__kicker">Уже знакомый урок</p>
        <h2 id="lesson-reentry-title">
          Вы уже проходили урок «{title}» вне программы
        </h2>
        <p>
          Хотите освежить знания или пропустить урок и продолжить программу?
        </p>
        <div className="lesson-reentry__actions">
          <button
            type="button"
            className="button button--primary"
            onClick={() => setOpen(false)}
          >
            Освежить знания
          </button>
          <button
            type="button"
            className="button button--ghost"
            onClick={() => router.push(nextHref)}
          >
            Пропустить урок
          </button>
        </div>
      </div>
    </div>
  );
}
