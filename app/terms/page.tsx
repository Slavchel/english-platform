import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Пользовательское соглашение — NeoLeng",
};

export default function TermsPage() {
  return (
    <section className="page-shell legal-page">
      <div className="container">
        <p className="eyebrow">NeoLeng · документы</p>
        <h1 className="page-title">Пользовательское соглашение</h1>
        <p className="lead">
          Здесь будет размещен текст документа. Страница в разработке.
        </p>
      </div>
    </section>
  );
}
