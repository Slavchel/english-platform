/**
 * Шкала CEFR и базовые операции над уровнями.
 * Здесь нет логики теста — только упорядочивание и безопасные преобразования.
 */

export const CEFR_LEVELS = [
  "Pre-A1",
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2",
] as const;

export type CefrLevel = (typeof CEFR_LEVELS)[number];

export type Skill = "grammar" | "vocabulary" | "reading";

export const SKILLS: readonly Skill[] = ["grammar", "vocabulary", "reading"];

export const SKILL_LABELS: Record<Skill, string> = {
  grammar: "Grammar",
  vocabulary: "Vocabulary",
  reading: "Reading",
};

const LEVEL_INDEX: Record<CefrLevel, number> = {
  "Pre-A1": 0,
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5,
  C2: 6,
};

export function isCefrLevel(value: unknown): value is CefrLevel {
  return (
    typeof value === "string" &&
    (CEFR_LEVELS as readonly string[]).includes(value)
  );
}

export function isSkill(value: unknown): value is Skill {
  return (
    typeof value === "string" && (SKILLS as readonly string[]).includes(value)
  );
}

export function levelIndex(level: CefrLevel): number {
  return LEVEL_INDEX[level];
}

export function levelFromIndex(index: number): CefrLevel {
  const clamped = Math.min(
    CEFR_LEVELS.length - 1,
    Math.max(0, Math.trunc(index)),
  );
  return CEFR_LEVELS[clamped];
}

/** Сдвиг уровня с удержанием в границах шкалы (Pre-A1 … C2). */
export function shiftLevel(level: CefrLevel, delta: number): CefrLevel {
  return levelFromIndex(levelIndex(level) + delta);
}

export function compareLevels(a: CefrLevel, b: CefrLevel): number {
  return levelIndex(a) - levelIndex(b);
}

/** Нижняя медиана: для трёх навыков совпадает с обычной медианой. */
export function medianLevel(levels: readonly CefrLevel[]): CefrLevel {
  if (levels.length === 0) {
    throw new Error("Нельзя вычислить медиану пустого списка уровней.");
  }
  const sorted = [...levels].sort(compareLevels);
  return sorted[Math.floor((sorted.length - 1) / 2)];
}
