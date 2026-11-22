"use client";

import { useState } from "react";

import type { PricingPlan } from "@/lib/pricing";
import type { SubscriptionTier } from "@/lib/subscription/plans";

export default function PricingCards({
  plans,
  tier,
  canActivatePro,
}: {
  plans: PricingPlan[];
  tier: SubscriptionTier;
  canActivatePro: boolean;
}) {
  const [proOpen, setProOpen] = useState(false);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activatePro = async () => {
    setActivating(true);
    setError(null);
    try {
      const response = await fetch("/api/subscription/activate-pro", {
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Не удалось активировать Pro.");
      }
      window.location.reload();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Не удалось активировать Pro.",
      );
      setActivating(false);
    }
  };

  return (
    <>
      <div className="pricing-grid">
        {plans.map((plan) => {
          const isPro = plan.id === "pro";
          const isNeuro = plan.id === "neuro-tutor";
          const isCurrent =
            (plan.id === "free" && tier === "FREE") ||
            (plan.id === "pro" && tier === "PRO") ||
            (plan.id === "neuro-tutor" && tier === "NEURO_TUTOR");
          return (
            <article
              key={plan.id}
              aria-current={isCurrent ? "true" : undefined}
              className={`pricing-card ${isPro ? "pricing-card--pro" : ""} ${
                isCurrent ? "pricing-card--current" : ""
              }`}
            >
              {isPro ? (
                <span className="pricing-card__badge">
                  {tier === "PRO" ? "Активен" : "Популярный"}
                </span>
              ) : null}
              <p className="pricing-card__name">{plan.title}</p>
              <p className="pricing-card__subtitle">{plan.subtitle}</p>
              <p className="pricing-card__price">{plan.price}</p>
              <ul className="pricing-card__features">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              {isNeuro ? (
                <button type="button" className="button button--ghost" disabled>
                  В разработке
                </button>
              ) : isPro && tier === "PRO" ? (
                <span className="pricing-card__status">Ваш тариф Pro</span>
              ) : isCurrent ? (
                <span className="pricing-card__status">Текущий тариф</span>
              ) : plan.id === "free" ? (
                <span className="pricing-card__status">Бесплатный тариф</span>
              ) : (
                <button
                  type="button"
                  className="button button--primary"
                  onClick={() => setProOpen(true)}
                >
                  Оформить Pro
                </button>
              )}
              {plan.note ? (
                <p className="pricing-card__note">{plan.note}</p>
              ) : null}
            </article>
          );
        })}
      </div>

      {proOpen ? (
        <div
          className="pricing-modal"
          role="presentation"
          onClick={() => setProOpen(false)}
        >
          <div
            className="pricing-modal__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pricing-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="pricing-modal__kicker">Pro · 199 руб/мес</p>
            <h2 id="pricing-modal-title">Оформить Pro</h2>
            <p>
              Оплата через СБП скоро появится. В тестовом режиме вы можете
              активировать Pro бесплатно.
            </p>
            {canActivatePro ? (
              <button
                type="button"
                className="button button--primary"
                onClick={() => void activatePro()}
                disabled={activating}
              >
                {activating ? "Активируем…" : "Активировать Pro (Тест)"}
              </button>
            ) : (
              <>
                <button type="button" className="button button--ghost" disabled>
                  Активировать Pro (Тест)
                </button>
                <p className="pricing-modal__note">
                  Активация доступна только тестовому аккаунту или администратору.
                </p>
              </>
            )}
            {error ? (
              <p className="pricing-modal__error" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="button"
              className="pricing-modal__close"
              onClick={() => setProOpen(false)}
            >
              Закрыть
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
