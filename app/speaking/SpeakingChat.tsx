"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

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
import {
  getSpeakingAnswerError,
  isSpeakingAnswerValid,
} from "@/lib/speaking/validation";
import UpgradeLimitModal from "@/app/components/UpgradeLimitModal";
import AIDataNotice from "@/app/components/AIDataNotice";
import type { SubscriptionTier } from "@/lib/subscription/plans";

interface Message {
  id: number;
  role: "assistant" | "user";
  text: string;
}

type SavedDialog = {
  id: string;
  qa: Array<{ question: string; answer: string }>;
  retryAfter: string | null;
};

export default function SpeakingChat({
  level,
  isAuthenticated,
  tier,
  quotaExceeded = false,
  savedDialog: initialSavedDialog,
}: {
  level: CefrLevel | null;
  isAuthenticated: boolean;
  tier: SubscriptionTier;
  quotaExceeded?: boolean;
  savedDialog?: SavedDialog;
}) {
  const [savedDialog, setSavedDialog] = useState<SavedDialog | null>(
    initialSavedDialog ?? null,
  );
  const [savedRetryAt, setSavedRetryAt] = useState<number | null>(() =>
    initialSavedDialog?.retryAfter
      ? new Date(initialSavedDialog.retryAfter).getTime()
      : null,
  );
  const [session, setSession] = useState<SpeakingSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<SpeakingEvaluation | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [evaluationBlocked, setEvaluationBlocked] = useState(false);
  const [evaluationRetryAt, setEvaluationRetryAt] = useState<number | null>(null);
  const [evaluationDialogId, setEvaluationDialogId] = useState<string | null>(
    null,
  );
  const [limitReached, setLimitReached] = useState(quotaExceeded);
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

  const startSession = useCallback(async () => {
    setSavedDialog(null);
    setSavedRetryAt(null);
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    requestRef.current?.abort();
    requestRef.current = null;

    setLimitReached(false);
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
    setInputError(null);
    setAnswers([]);
    setResult(null);
    setIsTyping(false);
    setIsEvaluating(false);
    setEvaluationError(null);
    setEvaluationBlocked(false);
    setEvaluationRetryAt(null);
    setEvaluationDialogId(null);
  }, []);

  useEffect(() => {
    if (savedDialog || result || quotaExceeded) return;
    const timer = window.setTimeout(() => {
      void startSession();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [quotaExceeded, result, savedDialog, startSession]);

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

    if (!savedDialog && answers.length === 0) {
      setEvaluationError("Ответьте хотя бы на один вопрос, чтобы получить оценку.");
      return;
    }

    setIsEvaluating(true);
    setEvaluationError(null);
    const controller = new AbortController();
    requestRef.current = controller;

    try {
      const qa = savedDialog
        ? savedDialog.qa
        : (session?.questions ?? [])
            .slice(0, answers.length)
            .map((question, index) => ({
              question: question.text,
              answer: answers[index] ?? "",
            }))
            .filter((pair) => pair.answer);

      const response = await fetch("/api/speaking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "evaluate",
          level,
          qa,
          dialogId: evaluationDialogId ?? savedDialog?.id ?? null,
        }),
        signal: controller.signal,
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            evaluation?: unknown;
            error?: string;
            code?: string;
            retryAfter?: number;
            dialogId?: string;
          }
        | null;

      if (!response.ok) {
        if (typeof payload?.retryAfter === "number") {
          setEvaluationRetryAt(Date.now() + payload.retryAfter * 1000);
        }
        if (typeof payload?.dialogId === "string") {
          setEvaluationDialogId(payload.dialogId);
        }
        if (response.status === 429 && payload?.code !== "COOLDOWN") {
          setEvaluationBlocked(true);
        }
        throw new Error(
          payload?.error || "Не удалось получить оценку. Попробуйте ещё раз.",
        );
      }

      if (!isSpeakingEvaluation(payload?.evaluation)) {
        throw new Error("Не удалось разобрать оценку. Попробуйте ещё раз.");
      }

      setEvaluationBlocked(false);
      setEvaluationRetryAt(null);
      setEvaluationDialogId(null);
      setSavedDialog(null);
      setSavedRetryAt(null);
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

    const answerError = getSpeakingAnswerError(answer);
    if (answerError) {
      setInputError(answerError);
      return;
    }
    setInputError(null);

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

  if (limitReached) {
    return (
      <UpgradeLimitModal
        title="Лимит Speaking на сегодня исчерпан"
        message="Доступен один Speaking-диалог в день. Следующий диалог будет доступен завтра."
        kicker="Дневной лимит"
      />
    );
  }

  if (isEvaluating) {
    return <SpeakingEvaluating />;
  }

  if (savedDialog && !session && !result) {
    return (
      <SpeakingEvaluationError
        key={evaluationRetryAt ?? savedRetryAt ?? 0}
        message="Не удалось получить анализ. Пожалуйста, попробуйте позже."
        blocked={false}
        retryAt={evaluationRetryAt ?? savedRetryAt}
        saved
        onRetry={() => void finish()}
        onBack={() => {
          setSavedDialog(null);
          setSavedRetryAt(null);
          void startSession();
        }}
        backLabel="Начать новый диалог"
      />
    );
  }

  if (!session) {
    return (
      <div className="speaking-loading">
        Подбираем тему и вопросы…
      </div>
    );
  }

  if (evaluationError) {
    return (
      <SpeakingEvaluationError
        key={evaluationRetryAt ?? 0}
        message={evaluationError}
        blocked={evaluationBlocked}
        retryAt={evaluationRetryAt}
        saved={Boolean(evaluationDialogId)}
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
      <AIDataNotice feature="speaking" />
      <header className="speaking-chat__header">
        <div className="speaking-teacher">
          <span className="speaking-teacher__mark" aria-hidden="true">
            E
          </span>
          <div>
            <h2>Разговор с Emma</h2>
            <p className="speaking-teacher__role">
              Emma · преподаватель английского
              <span className="speaking-teacher__status">
                <span aria-hidden="true" /> AI online
              </span>
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
        <div className="speaking-meta__item speaking-meta__item--topic">
          <span>Тема</span>
          <strong>{session.topic}</strong>
        </div>
        <div className="speaking-meta__item speaking-meta__item--progress">
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
            onChange={(event) => {
              setInput(event.target.value);
              if (inputError) setInputError(null);
            }}
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
                  : "Ответьте Emma на английском: 2–3 предложения..."
            }
            rows={3}
            maxLength={1200}
            disabled={finished}
            aria-invalid={Boolean(inputError)}
            aria-describedby={inputError ? "speaking-input-error" : undefined}
            className="speaking-input ym-disable-keys"
          />
          <button
            type="button"
            onClick={() => void (finished ? finish() : send())}
            disabled={
              finished
                ? false
                : !isSpeakingAnswerValid(input) || isTyping
            }
            className="button button--primary speaking-send"
          >
            {finished ? "Показать результат" : "Ответить"}
          </button>
        </div>
        {inputError ? (
          <p id="speaking-input-error" className="speaking-composer__error">
            {inputError}
          </p>
        ) : (
          <p className="speaking-composer__hint">
            Минимум 3 слова. Отвечайте на английском, чтобы Emma могла оценить
            речь.
          </p>
        )}
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
  blocked,
  retryAt,
  onRetry,
  onBack,
  backLabel = "Вернуться к разговору",
  saved = false,
}: {
  message: string;
  blocked: boolean;
  retryAt: number | null;
  onRetry: () => void;
  onBack: () => void;
  backLabel?: string;
  saved?: boolean;
}) {
  const [remaining, setRemaining] = useState(() =>
    retryAt ? Math.max(0, Math.ceil((retryAt - Date.now()) / 1000)) : 0,
  );

  useEffect(() => {
    if (!retryAt) return;

    const timer = window.setInterval(() => {
      setRemaining(Math.max(0, Math.ceil((retryAt - Date.now()) / 1000)));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retryAt]);

  const disabled = blocked || remaining > 0;
  const minutes = Math.floor(remaining / 60);
  const seconds = String(remaining % 60).padStart(2, "0");
  const backDisabled = remaining > 0;

  return (
    <section className="speaking-result speaking-assessment-state">
      <p className="speaking-kicker">Оценка Speaking</p>
      <h2>Не удалось получить оценку</h2>
      {saved ? (
        <div className="speaking-saved" role="status">
          <span className="speaking-saved__check" aria-hidden="true">
            ✓
          </span>
          <div>
            <strong>Диалог сохранён</strong>
            <p>
              Все вопросы и ваши ответы уже в аккаунте. Начать новый диалог
              можно будет после окончания кулдауна.
            </p>
          </div>
        </div>
      ) : null}
      <p className="speaking-result__summary">{message}</p>
      <div className="actions">
        <button
          type="button"
          className="button button--primary"
          onClick={onRetry}
          disabled={disabled}
        >
          {remaining > 0
            ? `Повторить через ${minutes}:${seconds}`
            : blocked
              ? "Попробуйте позже"
              : "Повторить"}
        </button>
        <button
          type="button"
          className="button button--ghost"
          onClick={onBack}
          disabled={backDisabled}
        >
          {backLabel}
        </button>
      </div>
    </section>
  );
}
