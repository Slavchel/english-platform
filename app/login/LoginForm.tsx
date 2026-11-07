"use client";

import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

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

    try {
      const result = await signIn("credentials", {
        email: normalized,
        redirect: false,
        callbackUrl: "/account",
      });

      if (result?.error) {
        setError("Тестовый режим: этот email не имеет доступа.");
        return;
      }

      router.push("/account");
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
