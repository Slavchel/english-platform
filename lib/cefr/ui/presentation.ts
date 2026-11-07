import { levelIndex, type CefrLevel, type Skill } from "../levels";
import type { Confidence, Item } from "../types";

export const SKILL_TITLES: Record<Skill, string> = {
  grammar: "Grammar",
  vocabulary: "Vocabulary",
  reading: "Reading",
};

export const CONFIDENCE_TITLES: Record<Confidence, string> = {
  high: "высокая",
  medium: "средняя",
  low: "низкая",
};

export const CONFIDENCE_EXPLANATIONS: Record<Confidence, string> = {
  high: "Ответы были достаточно последовательными, и системе хватило данных для оценки уровня.",
  medium:
    "Система смогла оценить уровень, но некоторые ответы были неоднозначными.",
  low: "Ответы сильно различались или данных оказалось недостаточно для надёжной оценки.",
};

export const CONFIDENCE_NOTE =
  "Уверенность показывает, насколько надёжен результат теста. Это не оценка ваших способностей.";

export function isRussianInterface(level: CefrLevel): boolean {
  return levelIndex(level) <= levelIndex("A2");
}

/**
 * Формулировка вопроса: до A2 показываем русскую версию, если она есть.
 * Сам английский материал (предложение, текст, варианты) не переводим.
 */
export function displayStem(item: Item): string {
  if (isRussianInterface(item.cefrLevel) && item.stemRu) {
    return item.stemRu;
  }
  return item.stem;
}

/**
 * Инструкция к заданию. До A2 включительно — на русском, с B1 — на английском.
 * Сам языковой материал (предложение, текст, вопрос) остаётся английским.
 */
export function instructionFor(
  skill: Skill,
  format: string,
  level: CefrLevel,
): string {
  const russian = isRussianInterface(level);

  if (skill === "grammar") {
    if (format === "mcq-sentence-choice") {
      return russian
        ? "Выберите грамматически правильное предложение."
        : "Choose the grammatically correct sentence.";
    }
    return russian
      ? "Выберите правильный вариант, чтобы заполнить пропуск."
      : "Choose the correct option to complete the sentence.";
  }

  if (skill === "vocabulary") {
    if (format === "mcq-meaning") {
      return russian
        ? "Выберите правильное значение слова."
        : "Choose the correct meaning of the word.";
    }
    return russian
      ? "Выберите слово, которое подходит по смыслу."
      : "Choose the word that fits the context.";
  }

  return russian
    ? "Прочитайте текст и выберите правильный ответ."
    : "Read the text and choose the correct answer.";
}

export function progressPercent(answered: number, total: number): number {
  if (total <= 0) return 0;
  const percent = (answered / total) * 100;
  return Math.min(100, Math.max(0, percent));
}
