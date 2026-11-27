import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Оплата и возврат — NeoLeng",
};

export default function RefundPage() {
  return (
    <section className="page-shell legal-page">
      <div className="container">
        <p className="eyebrow">NeoLeng · документы</p>
        <h1 className="page-title">Оплата и возврат</h1>
        <p className="lead">
          Здесь будет размещен текст документа. Страница в разработке.
        </p>
      </div>
    </section>
  );
}
