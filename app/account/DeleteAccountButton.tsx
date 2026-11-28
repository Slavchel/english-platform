"use client";

import { useState } from "react";

import { deleteAccount } from "./actions";

export default function DeleteAccountButton() {
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);

  return (
    <>
      <button
        type="button"
        className="account-profile__delete"
        onClick={() => setOpen(true)}
      >
        Удалить аккаунт
      </button>

      {open ? (
        <div
          className="auth-modal"
          role="presentation"
          onClick={() => {
            if (!pending) setOpen(false);
          }}
        >
          <div
            className="auth-modal__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="auth-modal__kicker">NeoLeng · аккаунт</p>
            <h2 id="delete-account-title">Удалить аккаунт?</h2>
            <p>
              Аккаунт и связанные с ним данные — прогресс, результаты тестов,
              история Speaking, AI-разборы и служебные записи — будут удалены
              без возможности восстановления. Резервные копии могут содержать
              данные ещё до 14 дней.
            </p>
            <label className="account-delete-checkbox">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                disabled={pending}
              />
              <span>
                Я понимаю, что удаление аккаунта и связанных данных
                необратимо.
              </span>
            </label>
            <form
              action={deleteAccount}
              onSubmit={(event) => {
                if (!confirmed) {
                  event.preventDefault();
                  return;
                }
                setPending(true);
              }}
            >
              <div className="auth-modal__actions">
                <button
                  type="submit"
                  className="button button--primary"
                  disabled={!confirmed || pending}
                >
                  {pending ? "Удаляем…" : "Удалить навсегда"}
                </button>
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
