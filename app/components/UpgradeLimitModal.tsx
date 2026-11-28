"use client";

export default function UpgradeLimitModal({
  title,
  message,
  onClose,
  kicker = "Дневной лимит",
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
          {onClose ? (
            <button
              type="button"
              className="button button--primary"
              onClick={onClose}
            >
              Понятно
            </button>
          ) : (
            <a href="/learning" className="button button--primary">
              К обучению
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
