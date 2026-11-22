import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";

import { auth } from "@/auth";
import { isCefrLevel } from "@/lib/cefr/levels";
import { prisma } from "@/lib/prisma";
import { getSubscriptionByEmail } from "@/lib/subscription/server";
import SpeakingChat from "./SpeakingChat";

export const metadata: Metadata = {
  title: "Speaking — English Platform",
  description:
    "Практика разговорного английского с Emma: живой диалог и пять вопросов.",
};

type SpeakingPageProps = {
  searchParams: Promise<{ level?: string | string[] }>;
};

export default function SpeakingPage({
  searchParams,
}: SpeakingPageProps) {
  return (
    <section className="page-shell speaking-page">
      <div className="container speaking-page__container">
        <header className="speaking-hero">
          <div className="speaking-hero__copy">
            <p className="eyebrow">English Platform · AI Speaking</p>
            <h1 className="speaking-title">Speaking Practice</h1>
            <p className="speaking-subtitle">
              Живой диалог с Emma: пять вопросов, разбор речи и рекомендации
              после разговора.
            </p>
            <div className="speaking-hero__meta" aria-hidden="true">
              <span>5 вопросов</span>
              <span>AI-разбор</span>
              <span>CEFR-ориентир</span>
            </div>
          </div>
          <div className="speaking-wave" aria-hidden="true">
            <svg viewBox="0 0 320 220" role="presentation">
              <defs>
                <linearGradient id="speaking-wave-gold" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#e4ce9a" stopOpacity="0.9" />
                  <stop offset="55%" stopColor="#b89a65" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#6d7c84" stopOpacity="0.08" />
                </linearGradient>
                <radialGradient id="speaking-wave-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#c2a66d" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#c2a66d" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx="220" cy="100" r="96" fill="url(#speaking-wave-glow)" />
              <path
                d="M18 124C52 124 54 92 82 92C116 92 112 144 146 144C180 144 178 66 212 66C246 66 240 116 274 116C292 116 300 108 306 100"
                fill="none"
                stroke="url(#speaking-wave-gold)"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <path
                d="M18 136C54 136 58 112 86 112C118 112 116 156 148 156C182 156 184 92 214 92C248 92 246 128 276 128C292 128 300 122 306 118"
                fill="none"
                stroke="url(#speaking-wave-gold)"
                strokeWidth="1"
                strokeLinecap="round"
                opacity="0.55"
              />
              <g fill="url(#speaking-wave-gold)">
                {[48, 72, 96, 120, 144, 168, 192, 216, 240, 264].map((x, index) => {
                  const heights = [18, 34, 52, 74, 42, 88, 58, 38, 24, 14];
                  const height = heights[index] ?? 20;
                  return (
                    <rect
                      key={x}
                      x={x}
                      y={150 - height / 2}
                      width="2"
                      height={height}
                      rx="1"
                      opacity={0.22 + (height / 100) * 0.5}
                    />
                  );
                })}
              </g>
            </svg>
          </div>
        </header>

        <section className="speaking-guide" aria-labelledby="speaking-guide-title">
          <div className="speaking-guide__lead">
            <p className="speaking-guide__kicker">Практика речи</p>
            <strong id="speaking-guide-title">Как проходит практика</strong>
            <p>
              Emma задаёт вопрос — вы отвечаете текстом на английском. Это
              тренировка спонтанной речи: не идеального ответа, а умения
              сформулировать мысль здесь и сейчас.
            </p>
          </div>
          <ol className="speaking-guide__steps">
            <li>
              <span className="speaking-guide__number">01</span>
              <span className="speaking-guide__node" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 6.5C5 5.12 6.12 4 7.5 4h9C17.88 4 19 5.12 19 6.5v6c0 1.38-1.12 2.5-2.5 2.5H10l-4.2 3.15c-.5.37-1.2.02-1.2-.6V6.5Z"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  />
                  <path d="M8.5 9.5h7M8.5 12h4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </span>
              <strong>Ответьте на вопрос</strong>
              <p>2–3 предложения на английском. Не бойтесь ошибаться.</p>
            </li>
            <li>
              <span className="speaking-guide__number">02</span>
              <span className="speaking-guide__node" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M4 12h2M8 8v8M12 5v14M16 8v8M20 12h-2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </span>
              <strong>Пройдите 5 вопросов</strong>
              <p>Emma задаёт следующий вопрос после каждого ответа.</p>
            </li>
            <li>
              <span className="speaking-guide__number">03</span>
              <span className="speaking-guide__node" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 3.5l1.65 5.1L19 10.2l-5.35 1.6L12 17l-1.65-5.2L5 10.2l5.35-1.6L12 3.5Z"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                  <path d="M18.5 15.5l.65 2 2.1.65-2.1.65-.65 2-.65-2-2.1-.65 2.1-.65.65-2Z" fill="currentColor" opacity="0.55" />
                </svg>
              </span>
              <strong>Получите разбор</strong>
              <p>Оценка речи, ошибки и рекомендации после завершения.</p>
            </li>
          </ol>
          <p className="speaking-guide__why">
            <strong>Зачем это нужно:</strong> так вы тренируете понимание
            вопроса, скорость формулировки и связность речи, а разбор помогает
            увидеть, что исправить в следующий раз.
          </p>
        </section>
        <Suspense
          fallback={
            <div className="speaking-shell speaking-loading">
              Загружаем разговор…
            </div>
          }
        >
          <SpeakingContent searchParams={searchParams} />
        </Suspense>
      </div>
    </section>
  );
}

async function SpeakingContent({
  searchParams,
}: SpeakingPageProps) {
  const params = await searchParams;
  const requestedLevel = Array.isArray(params.level)
    ? params.level[0]
    : params.level;
  const level = isCefrLevel(requestedLevel) ? requestedLevel : null;
  await connection();
  const session = await auth();
  const subscription = await getSubscriptionByEmail(session?.user?.email);

  let savedDialog:
    | {
        id: string;
        qa: Array<{ question: string; answer: string }>;
        retryAfter: string | null;
      }
    | undefined;

  if (subscription?.id) {
    const failed = await prisma.speakingDialog.findFirst({
      where: { userId: subscription.id, status: "failed" },
      orderBy: { createdAt: "desc" },
    });
    if (failed) {
      try {
        const qa = JSON.parse(failed.qa) as Array<{
          question: string;
          answer: string;
        }>;
        if (Array.isArray(qa) && qa.length > 0) {
          savedDialog = {
            id: failed.id,
            qa,
            retryAfter: failed.retryAfter?.toISOString() ?? null,
          };
        }
      } catch {
        // Повреждённую запись не показываем.
      }
    }
  }

  return (
    <div className="speaking-shell">
      <SpeakingChat
        level={level}
        isAuthenticated={Boolean(session?.user)}
        tier={subscription?.tier ?? "FREE"}
        savedDialog={savedDialog}
      />
    </div>
  );
}
