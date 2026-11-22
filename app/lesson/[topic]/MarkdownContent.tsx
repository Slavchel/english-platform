import { Fragment, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

function textFromChildren(children: ReactNode): string {
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }
  if (Array.isArray(children)) {
    return children.map(textFromChildren).join("");
  }
  return "";
}

function tableCellContent(children: ReactNode): ReactNode {
  if (typeof children === "string") {
    if (!/<br\s*\/?>/i.test(children)) return children;

    return children
      .split(/<br\s*\/?>/gi)
      .flatMap((part, index) =>
        index === 0
          ? [part]
          : [<br key={`table-break-${index}`} />, part],
      );
  }

  if (Array.isArray(children)) {
    return children.map((child, index) => (
      <Fragment key={`table-cell-${index}`}>
        {tableCellContent(child)}
      </Fragment>
    ));
  }

  return children;
}

function prepareMarkdown(content: string): string {
  const normalized = content
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      if (/^(#{1,6}\s|[-*+]\s|>\s|\d+\.\s)/.test(trimmed)) {
        return line;
      }
      if (/^\*\*[^*]+\*\*$/.test(trimmed)) {
        return `### ${trimmed.slice(2, -2)}`;
      }
      if (
        trimmed.length >= 4 &&
        trimmed.length <= 90 &&
        trimmed === trimmed.toUpperCase() &&
        /[A-ZА-ЯЁ]/.test(trimmed)
      ) {
        return `### ${trimmed}`;
      }
      if (trimmed.length <= 90 && trimmed.endsWith(":")) {
        return `### ${trimmed}`;
      }
      if (/^(Важно|Запомни|Обрати внимание):/i.test(trimmed)) {
        return `> ${trimmed}`;
      }
      if (trimmed.includes(" - ")) {
        return `- ${trimmed}`;
      }
      return line;
    });

  const withFormulaLists: string[] = [];
  let formula = false;

  for (const line of normalized) {
    const trimmed = line.trim();

    if (/^###\s+.*формул/i.test(trimmed)) {
      formula = true;
      withFormulaLists.push(line);
      continue;
    }

    if (formula) {
      if (!trimmed) {
        formula = false;
        withFormulaLists.push(line);
        continue;
      }
      if (!/^(#{1,6}\s|[-*+]\s|>\s|\d+\.\s)/.test(trimmed)) {
        withFormulaLists.push(`- ${trimmed}`);
        continue;
      }
      formula = false;
    }

    withFormulaLists.push(line);
  }

  const groupedQuotes: string[] = [];
  let index = 0;

  while (index < withFormulaLists.length) {
    const line = withFormulaLists[index];
    if (!line.trimStart().startsWith(">")) {
      groupedQuotes.push(line);
      index += 1;
      continue;
    }

    const quoteLines: string[] = [];
    while (index < withFormulaLists.length) {
      const current = withFormulaLists[index];
      const trimmed = current.trim();

      if (trimmed.startsWith(">")) {
        quoteLines.push(trimmed.replace(/^>\s?/, ""));
        index += 1;
        continue;
      }

      if (!trimmed) {
        let next = index + 1;
        while (
          next < withFormulaLists.length &&
          !withFormulaLists[next].trim()
        ) {
          next += 1;
        }
        if (withFormulaLists[next]?.trimStart().startsWith(">")) {
          index = next;
          continue;
        }
      }

      break;
    }

    for (const quote of quoteLines) {
      groupedQuotes.push(`> ${quote}  `);
    }
  }

  return groupedQuotes.join("\n");
}

const components: Components = {
  h1: ({ children }) => (
    <h1 className="mt-12 mb-5 [font-family:var(--font-display)] text-3xl leading-tight font-medium tracking-tight text-zinc-50 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-12 mb-5 [font-family:var(--font-display)] text-2xl leading-tight font-medium tracking-tight text-zinc-50 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => {
    const formula = /формул/i.test(textFromChildren(children));
    return (
      <h3
        className={`mt-11 mb-4 border-l-2 border-amber-300/70 pl-3 [font-family:var(--font-display)] text-2xl leading-tight font-medium tracking-tight text-amber-100 first:mt-0 sm:text-[1.7rem] ${
          formula ? "lesson-formula-heading" : ""
        }`}
      >
        {children}
      </h3>
    );
  },
  h4: ({ children }) => (
    <h4 className="mt-8 mb-3 text-base font-semibold text-zinc-100">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="my-5 text-[0.9rem] leading-7 text-zinc-300 first:mt-0 last:mb-0">
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-zinc-50">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="text-zinc-200 italic">{children}</em>
  ),
  ul: ({ children }) => (
    <ul className="my-6 list-disc space-y-1.5 pl-5 marker:text-zinc-500">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-6 list-decimal space-y-1.5 pl-5 marker:text-zinc-500">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="pl-1 text-[0.88rem] leading-7 text-zinc-300 [&>p]:my-0 [&>ul]:mt-2 [&>ul]:mb-0">
      {children}
    </li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-7 rounded-r-xl border-l-2 border-amber-300/60 bg-white/[0.025] px-5 py-3">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-10 border-white/10" />,
  a: ({ href, children }) => (
    <a
      href={href}
      className="font-medium text-amber-200 underline decoration-amber-300/40 underline-offset-4 transition-colors hover:text-amber-100"
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noreferrer" : undefined}
    >
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="rounded bg-white/[0.07] px-1.5 py-0.5 font-mono text-[0.82em] text-zinc-100">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="my-6 overflow-x-auto rounded-xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-zinc-200">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-7 overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full border-collapse text-left text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-white/[0.05] text-zinc-100">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="border-b border-white/10 px-3 py-2.5 text-left font-semibold">
      {tableCellContent(children)}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-white/[0.06] px-3 py-2.5 text-left text-zinc-300">
      {tableCellContent(children)}
    </td>
  ),
  tr: ({ children }) => (
    <tr className="transition-colors hover:bg-white/[0.025]">{children}</tr>
  ),
  input: ({ checked }) => (
    <input
      type="checkbox"
      checked={checked}
      readOnly
      className="mr-2 accent-amber-300"
    />
  ),
  del: ({ children }) => (
    <del className="text-zinc-500">{children}</del>
  ),
};

export default function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="lesson-content">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {prepareMarkdown(content)}
      </ReactMarkdown>
    </div>
  );
}
