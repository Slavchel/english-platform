import type { Metadata } from "next";

import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Вход — NeoLeng",
  description: "Вход в NeoLeng по ссылке из письма.",
};

export default function LoginPage() {
  return (
    <section className="page-shell auth-page">
      <div className="container auth-container">
        <p className="eyebrow">NeoLeng · аккаунт</p>
        <h1 className="page-title">Вход</h1>
        <p className="lead">
          Введите email — отправим ссылку для входа. Пароль не нужен.
        </p>

        <div className="auth-card">
          <LoginForm />
        </div>
      </div>
    </section>
  );
}
