import type { Metadata } from "next";

import SupportForm from "./SupportForm";

export const metadata: Metadata = {
  title: "Поддержка — NeoLeng",
  description:
    "Опишите проблему или задайте вопрос — команда NeoLeng ответит на почту.",
};

export default function SupportPage() {
  return (
    <section className="page-shell support-page">
      <div className="container support-container">
        <p className="eyebrow">NeoLeng · помощь</p>
        <h1 className="page-title">Поддержка</h1>
        <p className="lead">
          Опишите вашу проблему или задайте вопрос, и мы ответим вам на почту.
        </p>

        <SupportForm />
      </div>
    </section>
  );
}
