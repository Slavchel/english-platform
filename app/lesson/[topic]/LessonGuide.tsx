import Link from "next/link";

import MarkdownContent from "./MarkdownContent";

interface LessonGuideProps {
  title: string;
  level: string;
  topic: string;
  content: string;
  from?: "learning" | "admin";
}

export default function LessonGuide({
  title,
  level,
  topic,
  content,
  from,
}: LessonGuideProps) {
  const backHref = from === "admin" ? "/admin" : "/learning";
  const backLabel = from === "admin" ? "← В админку" : "← Все уроки";

  return (
    <section className="page-shell lesson-page">
      <div className="container py-10 sm:py-14">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href={backHref}
              className="text-[0.68rem] tracking-[0.12em] text-zinc-500 uppercase transition-colors hover:text-zinc-200"
            >
              {backLabel}
            </Link>
            <Link
              href={`/lesson/${topic}`}
              className="lesson-primary-button inline-flex items-center gap-2 rounded-full bg-[#c2a66d] px-5 py-2.5 text-[0.68rem] font-semibold tracking-[0.04em] text-[#0d1013] shadow-[0_12px_28px_rgba(0,0,0,0.25),0_0_24px_rgba(194,166,109,0.12)] transition-colors hover:bg-[#dbc48f]"
            >
              Пройти интерактив
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <article className="lesson-guide mt-8 rounded-3xl border border-white/[0.09] bg-[#121214] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.32)] sm:p-10">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-[#c2a66d]/25 bg-[#c2a66d]/[0.07] px-3 py-1 text-[0.58rem] font-semibold tracking-[0.16em] text-[#d8c18e] uppercase">
                {level}
              </span>
              <span className="text-[0.58rem] tracking-[0.13em] text-zinc-500 uppercase">
                {topic.replace(/_/g, " ")}
              </span>
            </div>
            <h1 className="mt-5 max-w-full [font-family:var(--font-display)] text-3xl leading-[1.08] font-medium tracking-tight text-[#f0efe9] break-words sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 text-[0.62rem] tracking-[0.16em] text-[#a8afb5] uppercase">
              Шпаргалка · полная теория урока
            </p>

            <div className="mt-8 border-t border-white/[0.08] pt-8">
              <MarkdownContent content={content} />
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
