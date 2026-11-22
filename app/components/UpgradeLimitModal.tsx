"use client";

import Link from "next/link";

export default function UpgradeLimitModal({
  title,
  message,
  onClose,
  upgradeLabel = "Перейти на Pro",
  kicker = "Лимит Free",
}: {
  title: string;
  message: string;
  onClose?: () => void;
  upgradeLabel?: string;
  kicker?: string;
}) {
  return (
    <div className="upgrade-limit" role="presentation">
      <div
        className="upgrade-limit__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-limit-title"
      >
        <p className="upgrade-limit__kicker">{kicker}</p>
        <h2 id="upgrade-limit-title">{title}</h2>
        <p>{message}</p>
        <div className="upgrade-limit__actions">
          <Link href="/pricing" className="button button--primary">
            {upgradeLabel}
          </Link>
          {onClose ? (
            <button
              type="button"
              className="button button--ghost"
              onClick={onClose}
            >
              Позже
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
