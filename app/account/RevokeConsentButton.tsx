"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RevokeConsentButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const revoke = async () => {
    if (pending) return;
    if (
      !window.confirm(
        "Отозвать согласие на обработку персональных данных? Это будет зафиксировано, история согласий сохранится.",
      )
    ) {
      return;
    }
    setPending(true);

    try {
      const response = await fetch("/api/consent/revoke", {
        method: "POST",
      });

      if (response.ok) {
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      className="account-profile__revoke"
      onClick={() => void revoke()}
      disabled={pending}
    >
      {pending ? "Отзываем…" : "Отозвать согласие на обработку ПД"}
    </button>
  );
}
