"use client";

import { motion } from "framer-motion";
import { useEffect, useState, type RefObject } from "react";

interface TutorialOverlayProps {
  targetRef: RefObject<HTMLElement | null>;
  text: string;
  onClose: () => void;
}

export default function TutorialOverlay({
  targetRef,
  text,
  onClose,
}: TutorialOverlayProps) {
  const [position, setPosition] = useState<{
    top: number;
    right: number;
    target: {
      left: number;
      top: number;
      width: number;
      height: number;
      icon: string;
      label: string;
    };
  } | null>(null);

  useEffect(() => {
    const update = () => {
      const target = targetRef.current;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const parts = target.innerText
        .split(/\n+/)
        .map((part) => part.trim())
        .filter(Boolean);

      setPosition({
        top: Math.min(
          rect.bottom + 48,
          Math.max(16, window.innerHeight - 300),
        ),
        right: Math.max(16, window.innerWidth - rect.right),
        target: {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          icon: parts.length > 1 ? parts[0] : "",
          label: parts.length > 1 ? parts.slice(1).join(" ") : parts[0] ?? "",
        },
      });
    };

    update();
    window.addEventListener("resize", update);

    return () => window.removeEventListener("resize", update);
  }, [targetRef]);

  if (!position) return null;

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.24 }}
      onClick={onClose}
    >
      <div className="pointer-events-auto absolute inset-0" />
      <button
        type="button"
        className="tutorial-tour__target lesson-accent-chip pointer-events-auto fixed z-[120] flex animate-pulse items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-full border px-4 py-2 text-xs font-medium leading-none shadow-lg ring-4 ring-white/20"
        style={{
          left: position.target.left,
          top: position.target.top,
          width: position.target.width,
          height: position.target.height,
          boxSizing: "border-box",
        }}
        onClick={() => {
          targetRef.current?.click();
          onClose();
        }}
      >
        {position.target.icon ? (
          <span className="shrink-0 leading-none" aria-hidden="true">
            {position.target.icon}
          </span>
        ) : null}
        <span className="min-w-0 shrink-0 leading-none">
          {position.target.label}
        </span>
      </button>
      <motion.div
        className="tutorial-tour__card pointer-events-auto absolute w-[min(340px,calc(100vw-32px))] rounded-2xl border p-5"
        style={{ top: position.top, right: position.right }}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        onClick={(event) => event.stopPropagation()}
      >
        <svg
          className="tutorial-tour__arrow pointer-events-none absolute -top-10 right-10 h-10 w-24"
          viewBox="0 0 96 40"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M8 36 C 20 20, 46 13, 78 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="4 4"
          />
          <path
            d="M70 2 L82 3 L75 13"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="tutorial-tour__eyebrow text-[0.56rem] tracking-[0.16em] uppercase">
          Подсказка
        </p>
        <p className="tutorial-tour__text mt-3 text-sm leading-6">{text}</p>
        <button
          type="button"
          onClick={onClose}
          className="tutorial-tour__button mt-5 w-full rounded-full px-4 py-2.5 text-xs font-bold transition-colors"
        >
          Понятно!
        </button>
      </motion.div>
    </motion.div>
  );
}
