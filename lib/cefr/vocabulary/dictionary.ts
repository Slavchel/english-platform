import { CEFR_LEVELS, isCefrLevel, type CefrLevel } from "../levels";

/**
 * Подготовка к будущим Vocabulary-заданиям на основе существующих словарей.
 *
 * Здесь НЕТ чтения файлов: модуль остаётся чистым и пригодным и для клиента,
 * и для сервера. Реальная загрузка JSON появится отдельно (на сервере или на
 * этапе сборки), чтобы не тащить все словари в клиентский бандл.
 *
 * Исходные файлы data/vocabulary/*.json не изменяются: всё, что нужно
 * (нормализация, фильтры, индекс), строится поверх них.
 */

export interface VocabularyEntry {
  word: string;
  translation: string;
  part_of_speech: string;
  category: string;
  source: string;
  level: CefrLevel;
}

export interface LexicalReference {
  /** Стабильный ключ вида "B1:ability". */
  wordId: string;
  word: string;
  level: CefrLevel;
  partOfSpeech: string;
  category: string;
  translation: string;
}

export interface VocabularyFilterOptions {
  allowMultiword?: boolean;
  allowProperNouns?: boolean;
}

export interface VocabularyIndex {
  entries: readonly VocabularyEntry[];
  byLevel: ReadonlyMap<CefrLevel, readonly VocabularyEntry[]>;
  byWord: ReadonlyMap<string, readonly VocabularyEntry[]>;
  /** Слова, встречающиеся на нескольких уровнях (в текущих данных — 122). */
  duplicateWords: readonly string[];
}

export interface VocabularyItemSeed {
  wordId: string;
  word: string;
  level: CefrLevel;
  translation: string;
  partOfSpeech: string;
  category: string;
  distractorTranslations: readonly string[];
}

export interface VocabularySeedOptions extends VocabularyFilterOptions {
  distractors?: number;
  levels?: readonly CefrLevel[];
}

/** Имена файлов-словарей. Сами файлы остаются неизменными. */
export const VOCABULARY_LEVEL_FILES: Record<CefrLevel, string> = {
  "Pre-A1": "pre_a1_vocabulary.json",
  A1: "a1_vocabulary.json",
  A2: "a2_vocabulary.json",
  B1: "b1_vocabulary.json",
  B2: "b2_vocabulary.json",
  C1: "c1_vocabulary.json",
  C2: "c2_vocabulary.json",
};

/**
 * Интерфейс будущего источника данных. Реализация (сервер/сборка) прочитает
 * VOCABULARY_LEVEL_FILES и отдаст записи сюда.
 */
export interface VocabularyDataSource {
  loadLevel(level: CefrLevel): Promise<readonly VocabularyEntry[]>;
}

export function isVocabularyEntry(value: unknown): value is VocabularyEntry {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const entry = value as Record<string, unknown>;
  return (
    typeof entry.word === "string" &&
    entry.word.trim().length > 0 &&
    typeof entry.translation === "string" &&
    entry.translation.trim().length > 0 &&
    typeof entry.part_of_speech === "string" &&
    typeof entry.category === "string" &&
    typeof entry.source === "string" &&
    isCefrLevel(entry.level)
  );
}

export function normalizeWord(word: string): string {
  return word.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Отсекает записи, непригодные для заданий v1: имена собственные,
 * словосочетания, варианты написания через "/". Менять исходные данные для
 * этого не нужно.
 */
export function isUsableForVocabularyItems(
  entry: VocabularyEntry,
  options: VocabularyFilterOptions = {},
): boolean {
  if (!entry.word.trim() || !entry.translation.trim()) {
    return false;
  }

  const word = entry.word.trim();

  if (!options.allowProperNouns && /^[A-Z]/.test(word)) {
    return false;
  }
  if (!options.allowMultiword && /\s/.test(word)) {
    return false;
  }
  if (word.includes("/")) {
    return false;
  }

  return true;
}

export function toLexicalReference(entry: VocabularyEntry): LexicalReference {
  return {
    wordId: `${entry.level}:${normalizeWord(entry.word)}`,
    word: entry.word,
    level: entry.level,
    partOfSpeech: entry.part_of_speech,
    category: entry.category,
    translation: entry.translation,
  };
}

export function buildVocabularyIndex(
  entries: readonly VocabularyEntry[],
): VocabularyIndex {
  const byLevel = new Map<CefrLevel, VocabularyEntry[]>();
  const byWord = new Map<string, VocabularyEntry[]>();

  for (const level of CEFR_LEVELS) {
    byLevel.set(level, []);
  }

  for (const entry of entries) {
    if (!isVocabularyEntry(entry)) {
      throw new Error(
        `Некорректная запись словаря: ${JSON.stringify(entry)}`,
      );
    }

    byLevel.get(entry.level)?.push(entry);

    const key = normalizeWord(entry.word);
    const sameWord = byWord.get(key);
    if (sameWord) {
      sameWord.push(entry);
    } else {
      byWord.set(key, [entry]);
    }
  }

  const duplicateWords = [...byWord.entries()]
    .filter(([, list]) => list.length > 1)
    .map(([word]) => word)
    .sort();

  return {
    entries: [...entries],
    byLevel,
    byWord,
    duplicateWords,
  };
}

/**
 * Подбирает переводы-дистракторы: сначала тот же уровень и та же часть речи,
 * затем — вся база. Возвращает меньше `count`, если подходящих нет.
 */
export function findTranslationDistractors(
  index: VocabularyIndex,
  entry: VocabularyEntry,
  count = 3,
): string[] {
  const targetWord = normalizeWord(entry.word);
  const usedTranslations = new Set<string>([
    entry.translation.trim().toLowerCase(),
  ]);
  const result: string[] = [];

  const collect = (
    candidates: readonly VocabularyEntry[],
    matchPartOfSpeech: boolean,
  ): void => {
    const sorted = [...candidates].sort((left, right) =>
      left.word.localeCompare(right.word),
    );

    for (const candidate of sorted) {
      if (result.length >= count) return;
      if (normalizeWord(candidate.word) === targetWord) continue;
      if (
        matchPartOfSpeech &&
        candidate.part_of_speech !== entry.part_of_speech
      ) {
        continue;
      }

      const translation = candidate.translation.trim();
      const key = translation.toLowerCase();
      if (!translation || usedTranslations.has(key)) continue;

      usedTranslations.add(key);
      result.push(translation);
    }
  };

  collect(index.byLevel.get(entry.level) ?? [], true);

  if (result.length < count) {
    collect(index.entries, false);
  }

  return result.slice(0, count);
}

/**
 * Заготовки будущих Vocabulary-заданий: слово, перевод и переводы-дистракторы.
 * Из них позже будет собираться настоящее задание с формулировкой и форматом.
 */
export function buildVocabularyItemSeeds(
  index: VocabularyIndex,
  options: VocabularySeedOptions = {},
): VocabularyItemSeed[] {
  const distractorsCount = options.distractors ?? 3;
  const levels = options.levels ?? CEFR_LEVELS;
  const seeds: VocabularyItemSeed[] = [];

  for (const level of levels) {
    const entries = [...(index.byLevel.get(level) ?? [])].sort((left, right) =>
      left.word.localeCompare(right.word),
    );

    for (const entry of entries) {
      if (!isUsableForVocabularyItems(entry, options)) continue;
      // Многозначные переводы пока пропускаем: сложно гарантировать
      // единственный правильный вариант.
      if (entry.translation.includes(";")) continue;

      const distractorTranslations = findTranslationDistractors(
        index,
        entry,
        distractorsCount,
      );
      if (distractorTranslations.length < distractorsCount) continue;

      const reference = toLexicalReference(entry);
      seeds.push({
        wordId: reference.wordId,
        word: reference.word,
        level: reference.level,
        translation: reference.translation,
        partOfSpeech: reference.partOfSpeech,
        category: reference.category,
        distractorTranslations,
      });
    }
  }

  return seeds;
}
