import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { readPricingPlans } from "@/lib/pricing";
import { getSubscriptionByEmail } from "@/lib/subscription/server";
import { canUseProTestActivation } from "@/lib/subscription/test-access";
import { TEMPORARY_FREE_ACCESS } from "@/lib/subscription/plans";
import PricingCards from "./PricingCards";

export const metadata: Metadata = {
  title: "Тарифы — NeoLeng",
  description: "Free, Pro и Neuro-Tutor: выберите подходящий формат обучения.",
  robots: {
    index: false,
    follow: false,
  },
};

export const instant = false;

export default async function PricingPage() {
  if (TEMPORARY_FREE_ACCESS) {
    notFound();
  }

  await connection();
  const session = await auth();
  const subscription = await getSubscriptionByEmail(session?.user?.email);
  const plans = readPricingPlans();

  return (
    <section className="page-shell pricing-page">
      <div className="container pricing-container">
        <header className="pricing-hero">
          <p className="eyebrow">NeoLeng · тарифы</p>
          <h1 className="pricing-title">Выберите свой темп</h1>
          <p className="pricing-lead">
            Начните бесплатно, откройте все уроки и больше практики с Pro.
            Neuro-Tutor уже в разработке.
          </p>
        </header>

        <PricingCards
          plans={plans}
          tier={subscription?.tier ?? "FREE"}
          canActivatePro={canUseProTestActivation(
            session?.user?.email,
            Boolean(session?.user?.isAdmin),
          )}
        />

        <p className="pricing-footnote">
          Оплата через СБП или картой. Отменить подписку можно в любой момент.
        </p>
      </div>
    </section>
  );
}
