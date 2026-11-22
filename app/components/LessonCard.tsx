"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import type { CSSProperties } from "react";

import { categoryTheme } from "@/lib/lessons/theme";

export interface LessonCardData {
  topic: string;
  title: string;
  level: string;
  category?: string;
}

interface LessonCardProps {
  lesson: LessonCardData;
  href?: string;
  variant?: "grid" | "compact";
}

function getThemeStyle(lesson: LessonCardData): CSSProperties | undefined {
  if (!lesson.category) return undefined;
  const theme = categoryTheme(lesson.category);
  return {
    "--accent": theme.accent,
    "--accent-soft": theme.accentSoft,
    "--accent-border": theme.accentBorder,
    "--tile-accent": theme.accent,
    "--lesson-accent": theme.accent,
    "--lesson-accent-soft": theme.accentSoft,
    "--lesson-accent-border": theme.accentBorder,
    "--lesson-accent-text": theme.accentText,
    "--lesson-glow": theme.glow,
  } as CSSProperties;
}

function TileFace({ lesson }: { lesson: LessonCardData }) {
  return (
    <div className="lesson-tile group relative flex h-full min-h-[172px] flex-col overflow-hidden rounded-2xl border border-white/[0.1] bg-[#1a1a1c] p-4">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/[0.04] via-transparent to-transparent"
      />
      <span className="relative flex items-start justify-between gap-3">
        <span className="lesson-tile__level">{lesson.level}</span>
        <span
          aria-hidden="true"
          className="lesson-tile__dot h-1.5 w-1.5 rounded-full"
        />
      </span>

      <span className="relative mt-3 block">
        <span className="block max-w-full [font-family:var(--font-display)] text-[1.05rem] leading-[1.2] font-medium break-words text-[#f0efe9]">
          {lesson.title}
        </span>
      </span>

      <span className="relative mt-auto flex items-center justify-between border-t border-white/[0.07] pt-3 text-[0.56rem] tracking-[0.1em] text-[#8f9a9f] uppercase">
        Изучить
        <span aria-hidden="true" className="lesson-tile__arrow text-sm normal-case">
          →
        </span>
      </span>
    </div>
  );
}

function TransitionBackContent({
  title,
  level,
}: {
  title: string;
  level: string;
}) {
  return (
    <>
      <span className="lesson-transition-back__eyebrow">Открываем урок</span>
      <strong>{title}</strong>
      <span className="lesson-transition-back__meta">
        {level} · Теория и практика
      </span>
      <span className="lesson-transition-loader" aria-hidden="true">
        <span />
      </span>
    </>
  );
}

export default function LessonCard({
  lesson,
  href,
  variant = "grid",
}: LessonCardProps) {
  if (variant === "compact") {
    return <CompactLessonCard lesson={lesson} href={href} />;
  }

  return <AnimatedLessonCard lesson={lesson} href={href} />;
}

function CompactLessonCard({
  lesson,
  href,
}: {
  lesson: LessonCardData;
  href?: string;
}) {
  const target = href ?? `/lesson/${lesson.topic}`;
  return (
    <Link
      href={target}
      aria-label={`Изучить тему: ${lesson.title}`}
      prefetch={false}
      className="group relative flex min-h-[118px] flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-[#121214] p-5 transition-[transform,border-color,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:border-[#d4af37]/50 hover:shadow-[0_18px_44px_rgba(0,0,0,0.32),0_0_24px_rgba(194,166,109,0.06)]"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="rounded-full border border-[#c2a66d]/25 bg-[#c2a66d]/[0.07] px-2.5 py-1 text-[0.55rem] font-semibold tracking-[0.15em] text-[#d8c18e] uppercase">
          {lesson.level}
        </span>
        <span className="text-[0.55rem] tracking-[0.13em] text-white/30 uppercase">
          Доступен
        </span>
      </div>
      <div className="mt-4">
        <h3 className="max-w-full [font-family:var(--font-display)] text-xl leading-tight font-medium break-words text-[#f0efe9]">
          {lesson.title}
        </h3>
        <span className="mt-3 flex items-center justify-between border-t border-white/[0.08] pt-3 text-[0.6rem] tracking-[0.1em] text-[#a8afb5] uppercase">
          Изучить
          <span
            aria-hidden="true"
            className="text-sm text-[#c2a66d] transition-transform duration-300 group-hover:translate-x-1"
          >
            →
          </span>
        </span>
      </div>
    </Link>
  );
}

function AnimatedLessonCard({
  lesson,
  href,
}: {
  lesson: LessonCardData;
  href?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const target = href ?? `/lesson/${lesson.topic}`;
  const targetPath = target.split(/[?#]/)[0];
  const [phase, setPhase] = useState<"flip" | "expand">("flip");
  const [transition, setTransition] = useState<{
    rect: DOMRect;
    dx: number;
    dy: number;
    viewport: { width: number; height: number };
    clipPath: string;
  } | null>(null);
  const transitioning = useRef(false);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const timer = useRef<number | null>(null);
  const expandTimer = useRef<number | null>(null);
  const themeStyle = getThemeStyle(lesson);
  const backTitle = lesson.title.replace(/\s*\([^)]*\)\s*$/, "");

  useEffect(() => {
    return () => {
      transitioning.current = false;
      if (timer.current) window.clearTimeout(timer.current);
      if (expandTimer.current) window.clearTimeout(expandTimer.current);
      document.body.classList.remove("lesson-transition-active");
    };
  }, []);

  useEffect(() => {
    // Keep the expanded card over the learning page until the destination
    // route is committed. On back navigation this also clears a restored
    // portal from the previous visit.
    const delay = pathname === targetPath ? 420 : 0;

    const reset = window.setTimeout(() => {
      transitioning.current = false;
      if (overlayRef.current) {
        overlayRef.current.style.display = "none";
      }
      document.body.classList.remove("lesson-transition-active");
      setTransition(null);
      setPhase("flip");
    }, delay);

    return () => window.clearTimeout(reset);
  }, [pathname, targetPath]);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    event.preventDefault();
    if (transitioning.current) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    const scale = 1.12;
    const cardWidth = rect.width * scale;
    const cardHeight = rect.height * scale;
    const cardLeft = (viewport.width - cardWidth) / 2;
    const cardTop = (viewport.height - cardHeight) / 2;
    const clipPath = `inset(${cardTop}px ${viewport.width - cardLeft - cardWidth}px ${
      viewport.height - cardTop - cardHeight
    }px ${cardLeft}px round 16px)`;

    transitioning.current = true;
    if (overlayRef.current) {
      overlayRef.current.style.display = "";
    }
    document.body.classList.add("lesson-transition-active");
    setPhase("flip");
    setTransition({
      rect,
      dx: viewport.width / 2 - (rect.left + rect.width / 2),
      dy: viewport.height / 2 - (rect.top + rect.height / 2),
      viewport,
      clipPath,
    });

    expandTimer.current = window.setTimeout(() => {
      setPhase("expand");
      expandTimer.current = null;
    }, 400);

    timer.current = window.setTimeout(() => {
      if (expandTimer.current) {
        window.clearTimeout(expandTimer.current);
        expandTimer.current = null;
      }

      // Navigate while the expanded card still covers the screen. The portal
      // is cleared by the route effect once the lesson page is committed.
      router.push(target);
      timer.current = null;
    }, 820);
  };

  return (
    <>
      <motion.div
        layoutId={lesson.topic}
        className="h-full"
        style={themeStyle}
      >
        <Link
          href={target}
          aria-label={`Открыть урок: ${lesson.title}`}
          prefetch={false}
          onClick={handleClick}
          className="group block h-full"
        >
          <div
            className="lesson-tile relative flex h-full min-h-[172px] flex-col overflow-hidden rounded-2xl border border-white/[0.1] bg-[#1a1a1c] p-4 transition-[transform,border-color,box-shadow,background] duration-300 ease-out hover:-translate-y-1 hover:border-[var(--tile-accent,#d4af37)] hover:shadow-[0_18px_40px_rgba(0,0,0,0.38)]"
            style={themeStyle}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/[0.04] via-transparent to-transparent"
            />
            <span className="relative flex items-start justify-between gap-3">
              <span className="lesson-tile__level">{lesson.level}</span>
              <span
                aria-hidden="true"
                className="lesson-tile__dot h-1.5 w-1.5 rounded-full"
              />
            </span>
            <span className="relative mt-3 block">
              <span className="block max-w-full [font-family:var(--font-display)] text-[1.05rem] leading-[1.2] font-medium break-words text-[#f0efe9]">
                {lesson.title}
              </span>
            </span>
            <span className="relative mt-auto flex items-center justify-between border-t border-white/[0.07] pt-3 text-[0.56rem] tracking-[0.1em] text-[#8f9a9f] uppercase">
              Изучить
              <span
                aria-hidden="true"
                className="lesson-tile__arrow text-sm normal-case transition-transform duration-300 group-hover:translate-x-1"
              >
                →
              </span>
            </span>
          </div>
        </Link>
      </motion.div>

      {transition && typeof document !== "undefined"
        ? createPortal(
            <motion.div
              ref={overlayRef}
              className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
            >
              <motion.div
                className="lesson-transition-card"
                style={{
                  position: "fixed",
                  left: transition.rect.left,
                  top: transition.rect.top,
                  width: transition.rect.width,
                  height: transition.rect.height,
                  ...themeStyle,
                }}
                initial={{ x: 0, y: 0, rotateY: 0, scale: 1 }}
                animate={
                  phase === "expand"
                    ? {
                        x: transition.dx,
                        y: transition.dy,
                        rotateY: 180,
                        scale: 1.12,
                        opacity: 0,
                      }
                    : {
                        x: transition.dx,
                        y: transition.dy,
                        rotateY: 180,
                        scale: 1.12,
                      }
                }
                transition={
                  phase === "expand"
                    ? { duration: 0.16 }
                    : { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
                }
              >
                <div className="lesson-transition-face lesson-transition-face--front">
                  <TileFace lesson={lesson} />
                </div>
                <div className="lesson-transition-face lesson-transition-face--back">
                  <TransitionBackContent
                    title={backTitle}
                    level={lesson.level}
                  />
                </div>
              </motion.div>

              {phase === "expand" ? (
                <>
                  <motion.div
                    className="lesson-transition-screen"
                    style={themeStyle}
                    initial={{ clipPath: transition.clipPath }}
                    animate={{
                      clipPath: "inset(0px 0px 0px 0px round 0px)",
                    }}
                    transition={{
                      duration: 0.42,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  />
                  <motion.div
                    className="lesson-transition-glow"
                    style={themeStyle}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.55, delay: 0.08 }}
                  />
                  <div className="lesson-transition-screen__content">
                    <TransitionBackContent
                      title={backTitle}
                      level={lesson.level}
                    />
                  </div>
                </>
              ) : null}
            </motion.div>,
            document.body,
          )
        : null}
    </>
  );
}
