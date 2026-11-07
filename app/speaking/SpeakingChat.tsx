"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { CefrLevel } from "@/lib/cefr/levels";
import {
  SPEAKING_SKILLS,
  SPEAKING_SKILL_LABELS,
  isSpeakingEvaluation,
  type SpeakingEvaluation,
} from "@/lib/speaking/evaluation";
import {
  SPEAKING_QUESTIONS,
  pickIntro,
  pickSession,
  pickTransition,
  type SpeakingSession,
} from "@/lib/speaking/lesson";

interface Message {
  id: number;
  role: "assistant" | "user";
  text: string;
}

export default function SpeakingChat({
  level,
  isAuthenticated,
}: {
  level: CefrLevel | null;
  isAuthenticated: boolean;
}) {
  const [session, setSession] = useState<SpeakingSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<SpeakingEvaluation | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [authPrompt, setAuthPrompt] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const sessionIdRef = useRef<string | undefined>(undefined);
  const lastIntroRef = useRef<string | undefined>(undefined);
  const usedTransitionsRef = useRef(new Set<string>());

  useEffect(() => {
    const list = listRef.current;
    if (list) {
      list.scrollTop = list.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(
    () => () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      requestRef.current?.abort();
    },
    [],
  );

  const startSession = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    requestRef.current?.abort();
    requestRef.current = null;

    const nextSession = pickSession(sessionIdRef.current);
    const intro = pickIntro(lastIntroRef.current);
    sessionIdRef.current = nextSession.id;
    lastIntroRef.current = intro;
    usedTransitionsRef.current = new Set();

    setSession(nextSession);
    setMessages([
      { id: Date.now(), role: "assistant", text: intro },
      {
        id: Date.now() + 1,
        role: "assistant",
        text: nextSession.questions[0].text,
      },
    ]);
    setCurrentIndex(0);
    setInput("");
    setAnswers([]);
    setResult(null);
    setIsTyping(false);
    setIsEvaluating(false);
    setEvaluationError(null);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      startSession();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const finished = session
    ? currentIndex >= session.questions.length
    : false;
  const progress = session
    ? Math.min(currentIndex + (finished ? 0 : 1), session.questions.length)
    : 0;

  const finish = async () => {
    if (!isAuthenticated) {
      setAuthPrompt(true);
      return;
    }
    if (isEvaluating) return;
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    requestRef.current?.abort();

    if (answers.length === 0) {
      setEvaluationError("Ответьте хотя бы на один вопрос, чтобы получить оценку.");
      return;
    }

    setIsEvaluating(true);
    setEvaluationError(null);
    const controller = new AbortController();
    requestRef.current = controller;

    try {
      const response = await fetch("/api/speaking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "evaluate",
          answers,
          level,
          messages: messages.map((message) => ({
            role: message.role,
            content: message.text,
          })),
        }),
        signal: controller.signal,
      });
      const payload = (await response.json().catch(() => null)) as
        | { evaluation?: unknown; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          payload?.error || "Не удалось получить оценку. Попробуйте ещё раз.",
        );
      }

      if (!isSpeakingEvaluation(payload?.evaluation)) {
        throw new Error("Не удалось разобрать оценку. Попробуйте ещё раз.");
      }

      setResult(payload.evaluation);
    } catch (cause) {
      if (controller.signal.aborted) return;
      setEvaluationError(
        cause instanceof Error
          ? cause.message
          : "Не удалось получить оценку. Попробуйте ещё раз.",
      );
    } finally {
      if (!controller.signal.aborted) {
        setIsEvaluating(false);
        requestRef.current = null;
      }
    }
  };

  const send = () => {
    if (!isAuthenticated) {
      setAuthPrompt(true);
      return;
    }

    const answer = input.trim();
    if (!answer || !session || finished || isTyping) return;

    const nextQuestion = session.questions[currentIndex + 1];
    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      text: answer,
    };

    setMessages((previous) => [...previous, userMessage]);
    setAnswers((previous) => [...previous, answer]);
    setInput("");
    setIsTyping(true);

    timerRef.current = window.setTimeout(() => {
      const additions: Message[] = [];

      if (nextQuestion) {
        const reaction = pickTransition(
          nextQuestion.transitionId,
          usedTransitionsRef.current,
        );
        usedTransitionsRef.current.add(reaction);
        additions.push({
          id: Date.now() + 1,
          role: "assistant",
          text: reaction,
        });
        additions.push({
          id: Date.now() + 2,
          role: "assistant",
          text: nextQuestion.text,
        });
      } else {
        additions.push({
          id: Date.now() + 1,
          role: "assistant",
          text: "Thank you! That was the last question. Press «Показать результат» to see your feedback.",
        });
      }

      setMessages((previous) => [...previous, ...additions]);
      setCurrentIndex((previous) => previous + 1);
      setIsTyping(false);
      timerRef.current = null;
    }, 450);
  };

  if (!session) {
    return (
      <div className="speaking-loading">
        Подбираем тему и вопросы…
      </div>
    );
  }

  if (isEvaluating) {
    return <SpeakingEvaluating />;
  }

  if (evaluationError) {
    return (
      <SpeakingEvaluationError
        message={evaluationError}
        onRetry={() => void finish()}
        onBack={() => setEvaluationError(null)}
      />
    );
  }

  if (result) {
    return <SpeakingResult result={result} onRestart={startSession} />;
  }

  return (
    <section className="speaking-chat" aria-label="Разговор с преподавателем">
      <header className="speaking-chat__header">
        <div className="speaking-teacher">
          <span className="speaking-teacher__mark" aria-hidden="true">
            E
          </span>
          <div>
            <h2>Разговор с Emma</h2>
            <p className="speaking-teacher__role">
              Emma · преподаватель английского
            </p>
          </div>
        </div>
        <button
          type="button"
          className="speaking-end"
          onClick={() => void finish()}
          hidden={finished}
        >
          Завершить
        </button>
      </header>

      <div className="speaking-meta" aria-label="Параметры разговора">
        <div className="speaking-meta__item">
          <span>CEFR</span>
          <strong>{level ?? "не определён"}</strong>
        </div>
        <div className="speaking-meta__item">
          <span>Тема</span>
          <strong>{session.topic}</strong>
        </div>
        <div className="speaking-meta__item">
          <span>Прогресс</span>
          <strong>
            {progress} / {session.questions.length}
          </strong>
          <div className="speaking-progress-dots" aria-hidden="true">
            {session.questions.map((item, index) => (
              <span
                key={item.id}
                className={
                  index < progress
                    ? "speaking-progress-dot speaking-progress-dot--done"
                    : "speaking-progress-dot"
                }
              />
            ))}
          </div>
        </div>
      </div>

      <div
        ref={listRef}
        className="speaking-messages"
        role="log"
        aria-live="polite"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`speaking-message speaking-message--${message.role}`}
          >
            <span className="speaking-author">
              {message.role === "assistant" ? "Emma" : "Вы"}
            </span>
            <p className="speaking-bubble">{message.text}</p>
          </div>
        ))}
        {isTyping ? (
          <div className="speaking-message speaking-message--assistant speaking-message--typing">
            <span className="speaking-author">Emma</span>
            <div
              className="speaking-bubble speaking-typing"
              role="status"
              aria-label="Emma готовит следующий вопрос"
            >
              <span />
              <span />
              <span />
            </div>
          </div>
        ) : null}
      </div>

      <div className="speaking-composer">
        <div className="speaking-composer__top">
          <label htmlFor="speaking-input">Ваш ответ</label>
          <span>Enter — отправить · Shift+Enter — новая строка</span>
        </div>
        <div className="speaking-composer__body">
          <textarea
            id="speaking-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send();
              }
            }}
            placeholder={
              finished
                ? "Разговор завершён"
                : isTyping
                  ? "Emma готовит следующий вопрос..."
                  : "Ответьте Emma на английском..."
            }
            rows={3}
            maxLength={1200}
            disabled={finished}
            className="speaking-input"
          />
          <button
            type="button"
            onClick={() => void (finished ? finish() : send())}
            disabled={finished ? false : !input.trim() || isTyping}
            className="button button--primary speaking-send"
          >
            {finished ? "Показать результат" : "Ответить"}
          </button>
        </div>
      </div>

      <footer className="speaking-chat__footer">
        <span>Пять вопросов · анализ после завершения</span>
      </footer>

      {authPrompt ? (
        <div
          className="auth-modal"
          role="presentation"
          onClick={() => setAuthPrompt(false)}
        >
          <div
            className="auth-modal__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="speaking-auth-title"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="auth-modal__kicker">AI-практика</p>
            <h2 id="speaking-auth-title">
              Войдите или зарегистрируйтесь
            </h2>
            <p>
              Чтобы отправить ответы Emma и получить AI-анализ Speaking,
              нужен аккаунт.
            </p>
            <div className="auth-modal__actions">
              <Link href="/login" className="button button--primary">
                Войти
              </Link>
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setAuthPrompt(false)}
              >
                Позже
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}


function SpeakingResult({
  result,
  onRestart,
}: {
  result: SpeakingEvaluation;
  onRestart: () => void;
}) {
  return (
    <section className="speaking-result speaking-assessment">
      <div className="speaking-result__head">
        <div>
          <p className="speaking-kicker">Оценка Speaking</p>
          <h2>Разбор разговора</h2>
          <p className="speaking-result__summary">{result.summary}</p>
        </div>
        <div className="speaking-result__level">
          <span>Speaking level</span>
          <strong>{result.level}</strong>
          <small>
            {result.levelFromTest
              ? `CEFR-тест: ${result.levelFromTest}`
              : "предварительная оценка"}
          </small>
        </div>
      </div>

      <div className="speaking-score-grid">
        {SPEAKING_SKILLS.map((skill) => (
          <div key={skill} className="speaking-score">
            <div className="speaking-score__top">
              <span>{SPEAKING_SKILL_LABELS[skill]}</span>
              <strong>{result.scores[skill]}</strong>
            </div>
            <div className="speaking-score__bar">
              <span style={{ width: `${result.scores[skill]}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="speaking-assessment__grid">
        <section>
          <h3>Сильные стороны</h3>
          <ul>
            {result.strengths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section>
          <h3>Рекомендации</h3>
          <ul>
            {result.recommendations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className="speaking-mistakes">
        <h3>Ошибки и исправления</h3>
        {result.mistakes.length > 0 ? (
          <div className="speaking-mistakes__list">
            {result.mistakes.map((mistake) => (
              <article
                key={`${mistake.original}-${mistake.correction}`}
                className="speaking-mistake"
              >
                <p className="speaking-mistake__line">
                  <span>Было</span>
                  <del>{mistake.original}</del>
                </p>
                <p className="speaking-mistake__line">
                  <span>Исправление</span>
                  <ins>{mistake.correction}</ins>
                </p>
                <p className="speaking-mistake__explanation">
                  {mistake.explanation}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="speaking-mistakes__empty">
            Явных ошибок в ответах не найдено. Продолжайте практику, чтобы
            закрепить результат.
          </p>
        )}
      </section>

      <p className="speaking-result__note">
        Предварительная оценка по ответам: {result.answered} из{" "}
        {SPEAKING_QUESTIONS.length}. Это не официальный экзамен и не заменяет
        проверку Speaking с аудиозаписью.
      </p>

      <div className="actions">
        <button
          type="button"
          className="button button--primary"
          onClick={onRestart}
        >
          Пройти ещё раз
        </button>
        <Link href="/test" className="button button--ghost">
          Вернуться к тесту
        </Link>
      </div>
    </section>
  );
}

function SpeakingEvaluating() {
  return (
    <section className="speaking-result speaking-assessment-state">
      <p className="speaking-kicker">Оценка Speaking</p>
      <h2>Emma анализирует разговор…</h2>
      <p className="speaking-result__summary">
        Проверяем все ответы: грамматику, лексику, беглость и связность.
      </p>
      <div className="speaking-eval-loader" aria-label="Идёт оценка">
        <span />
        <span />
        <span />
      </div>
    </section>
  );
}

function SpeakingEvaluationError({
  message,
  onRetry,
  onBack,
}: {
  message: string;
  onRetry: () => void;
  onBack: () => void;
}) {
  return (
    <section className="speaking-result speaking-assessment-state">
      <p className="speaking-kicker">Оценка Speaking</p>
      <h2>Не удалось получить оценку</h2>
      <p className="speaking-result__summary">{message}</p>
      <div className="actions">
        <button type="button" className="button button--primary" onClick={onRetry}>
          Повторить
        </button>
        <button type="button" className="button button--ghost" onClick={onBack}>
          Вернуться к разговору
        </button>
      </div>
    </section>
  );
}
