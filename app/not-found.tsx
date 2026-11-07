import Link from "next/link";

export default function NotFound() {
  return (
    <section className="page-shell">
      <div className="container">
        <p className="eyebrow">404 · страница не найдена</p>
        <h1 className="page-title">Такой страницы пока нет</h1>
        <p className="lead">
          Ссылка могла устареть или в адресе есть опечатка. Вернитесь на
          главную или сразу перейдите к тесту.
        </p>
        <div className="actions">
          <Link href="/" className="button button--primary">
            На главную
          </Link>
          <Link href="/test" className="button button--ghost">
            Пройти тест
          </Link>
        </div>
      </div>
    </section>
  );
}
