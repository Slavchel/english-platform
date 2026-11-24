import type { Metadata } from "next";

import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Вход — NeoLeng",
  description: "Вход в NeoLeng по ссылке из письма.",
};

export default function LoginPage() {
  const emailEnabled = Boolean(
    process.env.RESEND_API_KEY && process.env.EMAIL_FROM,
  );

  return (
    <section className="page-shell auth-page">
      <div className="container auth-container">
        <p className="eyebrow">NeoLeng · аккаунт</p>
        <h1 className="page-title">Вход</h1>
        <p className="lead">
          Введите email — отправим ссылку для входа. Пароль не нужен.
        </p>

        {!emailEnabled ? (
          <p className="auth-message auth-message--error" role="status">
            Отправка ссылок временно недоступна: на сервере не настроен
            email-провайдер.
          </p>
        ) : null}

        <div className="auth-card">
          <LoginForm emailEnabled={emailEnabled} />
        </div>
      </div>
    </section>
  );
}
