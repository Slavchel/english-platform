"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";

import { PENDING_RESULT_KEY } from "@/lib/cefr/pending-result";
import VKIDLogin from "./VKIDLogin";

const ADMIN_TEST_EMAIL = "test01@example.com";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [vkCallbackUrl, setVkCallbackUrl] = useState<string | null>(null);

  useEffect(() => {
    const requestedCallback = new URLSearchParams(
      window.location.search,
    ).get("callbackUrl");
    const pendingResult = window.sessionStorage.getItem(PENDING_RESULT_KEY);

    setVkCallbackUrl(
      pendingResult
        ? "/test?restore=1"
        : requestedCallback?.startsWith("/") &&
            !requestedCallback.startsWith("//")
          ? requestedCallback
          : "/account",
    );
  }, []);

  const getCallbackUrl = () => {
    const requestedCallback = new URLSearchParams(
      window.location.search,
    ).get("callbackUrl");
    const pendingResult = window.sessionStorage.getItem(PENDING_RESULT_KEY);

    return pendingResult
      ? "/test?restore=1"
      : requestedCallback?.startsWith("/") &&
          !requestedCallback.startsWith("//")
        ? requestedCallback
        : "/account";
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = email.trim().toLowerCase();

    setPending(true);
    setError(null);

    if (normalized === ADMIN_TEST_EMAIL) {
      try {
        const result = await signIn("credentials", {
          email: normalized,
          redirect: false,
          callbackUrl: "/admin",
        });

        if (result?.error) {
          setError("Не удалось войти в административный аккаунт.");
          return;
        }

        router.push("/admin");
        router.refresh();
      } catch {
        setError("Не удалось войти в административный аккаунт.");
      } finally {
        setPending(false);
      }
      return;
    }

    try {
      const result = await signIn("resend", {
        email: normalized,
        redirect: false,
        callbackUrl: getCallbackUrl(),
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

  const handleYandexSignIn = async () => {
    setPending(true);
    setError(null);

    try {
      await signIn("yandex", { callbackUrl: getCallbackUrl() });
    } catch {
      setError("Не удалось начать вход через Яндекс. Попробуйте ещё раз.");
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
      <div className="auth-divider" aria-hidden="true">
        или продолжите с
      </div>
      <div className="auth-provider-stack">
        <button
          type="button"
          className="yandex-login-button"
          onClick={() => void handleYandexSignIn()}
          disabled={pending}
          aria-label="Войти с Яндекс ID"
        >
          <Image
            src="/yandex-id-logo.svg"
            alt=""
            width={24}
            height={24}
            className="yandex-login-button__logo"
            aria-hidden="true"
          />
          <span>Войти с Яндекс ID</span>
        </button>
        {vkCallbackUrl ? (
          <VKIDLogin
            callbackUrl={vkCallbackUrl}
            onError={setError}
          />
        ) : null}
      </div>
    </form>
  );
}
