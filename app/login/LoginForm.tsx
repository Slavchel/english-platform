"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

import { PENDING_RESULT_KEY } from "@/lib/cefr/pending-result";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = email.trim().toLowerCase();

    setPending(true);
    setError(null);

    const requestedCallback = new URLSearchParams(
      window.location.search,
    ).get("callbackUrl");
    const pendingResult = window.sessionStorage.getItem(PENDING_RESULT_KEY);
    const callbackUrl = pendingResult
      ? "/test?restore=1"
      : requestedCallback?.startsWith("/") &&
          !requestedCallback.startsWith("//")
        ? requestedCallback
        : "/account";

    try {
      const result = await signIn("nodemailer", {
        email: normalized,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError(
          "Не удалось отправить ссылку. Проверьте email и попробуйте позже.",
        );
        return;
      }

      setSentEmail(normalized);
    } catch {
      setError("Не удалось отправить ссылку. Попробуйте ещё раз.");
    } finally {
      setPending(false);
    }
  };

  if (sentEmail) {
    return (
      <div className="auth-form">
        <p className="auth-message">
          Ссылка для входа отправлена на <strong>{sentEmail}</strong>.
        </p>
        <p className="auth-message">
          Проверьте почту и перейдите по ссылке из письма. Ссылка действует 24
          часа.
        </p>
        <button
          type="button"
          className="button button--ghost"
          onClick={() => {
            setSentEmail(null);
            setError(null);
          }}
        >
          Отправить на другой email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="auth-form">
      <label htmlFor="email">Email</label>
      <input
        id="email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="name@example.com"
        className="auth-input"
      />
      {error ? (
        <p className="auth-message auth-message--error" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        className="button button--primary"
        disabled={pending}
      >
        {pending ? "Отправляем ссылку…" : "Отправить ссылку для входа"}
      </button>
    </form>
  );
}
