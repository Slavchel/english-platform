"use client";

import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { PENDING_RESULT_KEY } from "@/lib/cefr/pending-result";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
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
      const result = await signIn("credentials", {
        email: normalized,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError("Тестовый режим: этот email не имеет доступа.");
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Не удалось войти. Попробуйте ещё раз.");
    } finally {
      setPending(false);
    }
  };

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
        {pending ? "Входим…" : "Войти"}
      </button>
    </form>
  );
}
