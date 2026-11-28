"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";

import { PENDING_RESULT_KEY } from "@/lib/cefr/pending-result";
import VKIDLogin from "./VKIDLogin";

const ADMIN_TEST_EMAIL = "test01@example.com";
const TEST_ACCOUNT_PATTERN = /^test\d{2}@example\.com$/;

function isLocalHost(): boolean {
  return (
    typeof window !== "undefined" &&
    ["localhost", "127.0.0.1"].includes(window.location.hostname)
  );
}

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [vkCallbackUrl, setVkCallbackUrl] = useState<string | null>(null);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [dataConsent, setDataConsent] = useState(false);
  const canUseLogin = policyAccepted && dataConsent;

  useEffect(() => {
    const controller = new AbortController();

    void fetch("/api/consent/intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        privacy: policyAccepted,
        personalData: dataConsent,
      }),
      signal: controller.signal,
    }).catch(() => {
      // Sign-in remains available; the server commits consent only when
      // a valid signed intent cookie is present.
    });

    return () => controller.abort();
  }, [policyAccepted, dataConsent]);

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

    if (!canUseLogin) {
      setError(
        "Подтвердите ознакомление с Политикой и согласие на обработку персональных данных.",
      );
      return;
    }

    const normalized = email.trim().toLowerCase();

    setPending(true);
    setError(null);

    const useLocalTestCredentials =
      normalized === ADMIN_TEST_EMAIL ||
      (isLocalHost() && TEST_ACCOUNT_PATTERN.test(normalized));

    if (useLocalTestCredentials) {
      const callbackUrl =
        normalized === ADMIN_TEST_EMAIL ? "/admin" : getCallbackUrl();

      try {
        const result = await signIn("credentials", {
          email: normalized,
          redirect: false,
          callbackUrl,
        });

        if (result?.error) {
          setError(
            normalized === ADMIN_TEST_EMAIL
              ? "Не удалось войти в административный аккаунт."
              : "Не удалось войти в тестовый аккаунт.",
          );
          return;
        }

        router.push(callbackUrl);
        router.refresh();
      } catch {
        setError(
          normalized === ADMIN_TEST_EMAIL
            ? "Не удалось войти в административный аккаунт."
            : "Не удалось войти в тестовый аккаунт.",
        );
      } finally {
        setPending(false);
      }
      return;
    }

    try {
      const result = await signIn("email", {
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
    if (!canUseLogin) {
      setError(
        "Подтвердите ознакомление с Политикой и согласие на обработку персональных данных.",
      );
      return;
    }

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
    <form onSubmit={submit} className="auth-form ym-disable-submit">
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
        className="auth-input ym-disable-keys"
      />
      <div className="auth-consents">
        <label className="auth-consent">
          <input
            type="checkbox"
            checked={policyAccepted}
            onChange={(event) => setPolicyAccepted(event.target.checked)}
            disabled={pending}
          />
          <span className="auth-consent__check" aria-hidden="true" />
          <span>
            Я ознакомлен(а) с{" "}
            <Link href="/privacy">Политикой конфиденциальности</Link>
          </span>
        </label>
        <label className="auth-consent">
          <input
            type="checkbox"
            checked={dataConsent}
            onChange={(event) => setDataConsent(event.target.checked)}
            disabled={pending}
          />
          <span className="auth-consent__check" aria-hidden="true" />
          <span>
            Я даю отдельное согласие на{" "}
            <Link href="/personal-data">обработку персональных данных</Link>
          </span>
        </label>
      </div>
      {error ? (
        <p className="auth-message auth-message--error" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        className="button button--primary auth-email-submit"
        disabled={pending || !canUseLogin}
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
          disabled={pending || !canUseLogin}
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
            disabled={!canUseLogin}
          />
        ) : null}
      </div>
    </form>
  );
}
