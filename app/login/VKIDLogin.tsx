"use client";

import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

const VK_APP_ID = Number(
  process.env.NEXT_PUBLIC_VK_ID_APP_ID ?? "54924531",
);
const VK_REDIRECT_URL =
  process.env.NEXT_PUBLIC_VK_ID_REDIRECT_URL ??
  "https://neoleng.ru/api/auth/callback/vk";

type VkStatus = "loading" | "ready" | "authorizing" | "error";

type VkLoginPayload = {
  code?: string;
  device_id?: string;
  state?: string;
};

function randomString(length: number) {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  const values = new Uint8Array(length);
  window.crypto.getRandomValues(values);
  return Array.from(values, (value) => alphabet[value % alphabet.length]).join(
    "",
  );
}

export default function VKIDLogin({
  callbackUrl,
  onError,
}: {
  callbackUrl: string;
  onError: (message: string) => void;
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<VkStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    let closeWidget: (() => void) | undefined;

    const fail = (message: string) => {
      if (!cancelled) {
        setStatus("error");
        onError(message);
      }
    };

    const setup = async () => {
      if (!containerRef.current) {
        return;
      }

      const codeVerifier = randomString(64);
      const state = randomString(48);

      try {
        const VKID = await import("@vkid/sdk");
        if (cancelled || !containerRef.current) {
          return;
        }

        VKID.Config.init({
          app: VK_APP_ID,
          redirectUrl: VK_REDIRECT_URL,
          responseMode: VKID.ConfigResponseMode.Callback,
          source: VKID.ConfigSource.LOWCODE,
          scope: "email",
          codeVerifier,
          state,
        });

        const oneTap = new VKID.OneTap();
        closeWidget = () => {
          try {
            oneTap.close();
          } catch {
            // Widget may already be closed.
          }
        };

        const widgetWidth = Math.min(
          Math.max(containerRef.current.clientWidth, 260),
          520,
        );

        oneTap
          .render({
            container: containerRef.current,
            showAlternativeLogin: true,
            oauthList: [VKID.OAuthName.MAIL],
            styles: {
              borderRadius: 12,
              height: 48,
              width: widgetWidth,
            },
          })
          .on(VKID.WidgetEvents.ERROR, (error: { text?: string }) => {
            fail(error.text || "Ошибка виджета VK ID.");
          })
          .on(
            VKID.OneTapInternalEvents.LOGIN_SUCCESS,
            async (payload: VkLoginPayload) => {
              if (!payload.code || !payload.device_id) {
                fail("VK ID не вернул код авторизации.");
                return;
              }

              if (payload.state && payload.state !== state) {
                fail("Проверка состояния VK ID не пройдена.");
                return;
              }

              setStatus("authorizing");
              const result = await signIn("vk", {
                code: payload.code,
                deviceId: payload.device_id,
                codeVerifier,
                state: payload.state ?? state,
                redirect: false,
                callbackUrl,
              });

              if (result?.error) {
                setStatus("error");
                onError(
                  "Не удалось войти через VK ID. Если аккаунт с таким email уже существует, войдите другим способом.",
                );
                return;
              }

              router.push(callbackUrl);
              router.refresh();
            },
          );

        if (!cancelled) {
          setStatus("ready");
        }
      } catch {
        fail("Не удалось загрузить VK ID. Попробуйте ещё раз.");
      }
    };

    void setup();

    return () => {
      cancelled = true;
      closeWidget?.();
    };
  }, [callbackUrl, onError]);

  return (
    <div className="vkid-login">
      <div ref={containerRef} className="vkid-login__widget" />
      {status === "loading" ? (
        <p className="auth-message">Загружаем VK ID…</p>
      ) : null}
      {status === "authorizing" ? (
        <p className="auth-message">Проверяем вход через VK ID…</p>
      ) : null}
    </div>
  );
}
