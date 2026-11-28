"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type AIDataFeature = "speaking" | "test";

const STORAGE_KEYS: Record<AIDataFeature, string> = {
  speaking: "neoleng_ai_data_notice_speaking_v1",
  test: "neoleng_ai_data_notice_test_v1",
};

export default function AIDataNotice({ feature }: { feature: AIDataFeature }) {
  const [visible, setVisible] = useState(false);
  const storageKey = STORAGE_KEYS[feature];

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(storageKey)) {
        setVisible(true);
      }
    } catch {
      // If storage is unavailable, do not repeatedly show the notice.
    }
  }, [storageKey]);

  const dismiss = () => {
    try {
      window.localStorage.setItem(storageKey, "seen");
    } catch {
      // Storage can be unavailable in private mode.
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside className="ai-data-notice" role="note">
      <div className="ai-data-notice__body">
        <strong>Передача данных в AI.</strong>{" "}
        Для работы {feature === "speaking" ? "Speaking" : "AI-разбора"} текст
        сообщений, вопросы, ответы и контекст заданий могут передаваться в
        DeepSeek. Не указывайте пароли, телефоны, адреса и другие
        конфиденциальные сведения.{" "}
        <Link href="/privacy">Подробнее</Link>
      </div>
      <button
        type="button"
        className="ai-data-notice__close"
        onClick={dismiss}
        aria-label="Закрыть предупреждение об AI"
      >
        ×
      </button>
    </aside>
  );
}
