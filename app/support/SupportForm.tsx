"use client";

import { useState } from "react";

const TOPICS = [
  "Проблема с оплатой",
  "Технический сбой",
  "Вопрос по обучению",
  "Другое",
];

type Status = "idle" | "sending" | "success" | "error";

export default function SupportForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending");
    setError("");

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, topic, message }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error || "Не удалось отправить обращение.");
        setStatus("error");
        return;
      }

      setName("");
      setEmail("");
      setTopic("");
      setMessage("");
      setStatus("success");
    } catch {
      setError("Не удалось отправить обращение. Попробуйте ещё раз.");
      setStatus("error");
    }
  };

  return (
    <>
      <div className="support-card ym-hide-content">
        <form className="support-form ym-disable-submit" onSubmit={submit}>
          <div className="support-form__row">
            <div className="support-field">
              <label htmlFor="support-name">Ваше имя</label>
              <input
                id="support-name"
                name="name"
                type="text"
                autoComplete="name"
                required
                minLength={2}
                maxLength={100}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Как к вам обращаться"
                className="support-input ym-disable-keys"
                disabled={status === "sending"}
              />
            </div>

            <div className="support-field">
              <label htmlFor="support-email">Email для ответа</label>
              <input
                id="support-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={200}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                className="support-input ym-disable-keys"
                disabled={status === "sending"}
              />
            </div>
          </div>

          <div className="support-field">
            <label htmlFor="support-topic">Тема обращения</label>
            <select
              id="support-topic"
              name="topic"
              required
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              className="support-input support-select ym-disable-keys"
              disabled={status === "sending"}
            >
              <option value="" disabled>
                Выберите тему
              </option>
              {TOPICS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="support-field">
            <label htmlFor="support-message">Сообщение</label>
            <textarea
              id="support-message"
              name="message"
              required
              minLength={10}
              maxLength={5000}
              rows={7}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Опишите проблему или вопрос подробнее"
              className="support-input support-textarea ym-disable-keys"
              disabled={status === "sending"}
            />
            <span className="support-hint">Минимум 10 символов</span>
          </div>

          {status === "success" ? (
            <p className="support-message support-message--success" role="status">
              Спасибо! Ваше обращение отправлено. Мы ответим вам на почту в
              течение 24 часов.
            </p>
          ) : null}

          {status === "error" ? (
            <p className="support-message support-message--error" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            className="button button--primary support-submit"
            disabled={status === "sending"}
          >
            {status === "sending" ? "Отправляем…" : "Отправить"}
          </button>
        </form>
      </div>

      <div className="support-alternative">
        <p className="support-alternative__title">Не хотите заполнять форму?</p>
        <p>
          Напишите нам напрямую:{" "}
          <a href="mailto:support@neoleng.ru">support@neoleng.ru</a> или в
          Telegram{" "}
          <a href="https://t.me/neoleng_support" target="_blank" rel="noreferrer">
            @neoleng_support
          </a>
          .
        </p>
      </div>
    </>
  );
}
