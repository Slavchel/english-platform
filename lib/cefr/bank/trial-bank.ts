import { DEFAULT_ENGINE_CONFIG } from "../config";
import { InMemoryItemPool, validateItemBank } from "../item-pool";
import { levelIndex } from "../levels";
import type { CefrLevel, Skill } from "../levels";
import type { Item, ItemOption, ReadingPassage } from "../types";

import grammarRaw from "../../../data/questions/grammar_questions_combined.json";
import vocabularyRaw from "../../../data/questions/vocabulary_questions_combined.json";
import readingRaw from "../../../data/questions/reading_questions.json";
import passagesRaw from "../../../data/questions/reading_passages_active.json";
import manifest from "../../../data/questions/bank_manifest.json";
import stemTranslations from "../../../data/questions/stem_translations_ru.json";
import stemTranslationsExtra from "../../../data/questions/generated/stem_translations_ru_additional.json";
import readingStemTranslations from "../../../data/questions/generated/reading_stem_translations_ru.json";

interface RawOption {
  id: string;
  text: string;
}

interface RawLexicalRef {
  wordId: string;
  word: string;
  level: string;
  partOfSpeech: string;
  category: string;
  translation: string;
}

interface RawQuestion {
  id: string;
  skill: string;
  cefrLevel: string;
  topic: string;
  format: string;
  stem: string;
  options: RawOption[];
  correctOptionId: string;
  explanation?: string;
  difficulty?: number;
  passageId?: string;
  lexicalRef?: RawLexicalRef;
}

interface RawPassage {
  id: string;
  cefrLevel: string;
  title: string;
  genre: string;
  topic: string;
  text: string;
  wordCount: number;
}

export interface TrialBank {
  readonly items: readonly Item[];
  readonly passages: readonly ReadingPassage[];
  readonly passageById: ReadonlyMap<string, ReadingPassage>;
  readonly version: string;
}

const LEVEL_MAP: Record<string, CefrLevel> = {
  "PRE-A1": "Pre-A1",
  "PRE A1": "Pre-A1",
  "PREA1": "Pre-A1",
  A1: "A1",
  A2: "A2",
  B1: "B1",
  B2: "B2",
  C1: "C1",
  C2: "C2",
};

const SKILL_MAP: Record<string, Skill> = {
  GRAMMAR: "grammar",
  VOCABULARY: "vocabulary",
  READING: "reading",
};

function toLevel(value: string): CefrLevel {
  const key = value.trim().toUpperCase();
  const level = LEVEL_MAP[key];
  if (!level) {
    throw new Error(`Банк: неизвестный уровень CEFR "${value}".`);
  }
  return level;
}

function toSkill(value: string): Skill {
  const key = value.trim().toUpperCase();
  const skill = SKILL_MAP[key];
  if (!skill) {
    throw new Error(`Банк: неизвестный навык "${value}".`);
  }
  return skill;
}

function toOption(option: RawOption): ItemOption {
  return { id: option.id, text: option.text };
}

function normalizePassage(raw: RawPassage): ReadingPassage {
  return {
    id: raw.id,
    cefrLevel: toLevel(raw.cefrLevel),
    title: raw.title,
    topic: raw.topic,
    genre: raw.genre,
    wordCount: raw.wordCount,
    text: raw.text,
    source: `trial bank ${manifest.bankVersion}`,
  };
}

function normalizeQuestion(
  raw: RawQuestion,
  passageIds: ReadonlySet<string>,
): Item {
  const skill = toSkill(raw.skill);
  const cefrLevel = toLevel(raw.cefrLevel);
  const stemTranslationsAll = {
    ...(stemTranslations as Record<string, string>),
    ...(stemTranslationsExtra as Record<string, string>),
    ...(readingStemTranslations as Record<string, string>),
  };
  const stemRu = stemTranslationsAll[raw.id];

  if (stemRu && levelIndex(cefrLevel) > levelIndex("A2")) {
    throw new Error(
      `Банк: русская формулировка недопустима для уровня выше A2 (${raw.id}).`,
    );
  }

  if (!Array.isArray(raw.options) || raw.options.length < 2) {
    throw new Error(`Банк: у задания "${raw.id}" меньше двух вариантов.`);
  }
  if (!raw.options.some((option) => option.id === raw.correctOptionId)) {
    throw new Error(
      `Банк: у задания "${raw.id}" правильный вариант отсутствует.`,
    );
  }
  if (raw.passageId && !passageIds.has(raw.passageId)) {
    throw new Error(
      `Банк: задание "${raw.id}" ссылается на неизвестный текст "${raw.passageId}".`,
    );
  }

  const lexicalRef: Item["lexicalRef"] = raw.lexicalRef
    ? {
        wordId: raw.lexicalRef.wordId,
        word: raw.lexicalRef.word,
        level: toLevel(raw.lexicalRef.level),
        partOfSpeech: raw.lexicalRef.partOfSpeech,
        category: raw.lexicalRef.category,
        translation: raw.lexicalRef.translation,
      }
    : undefined;

  return {
    id: raw.id,
    skill,
    cefrLevel,
    difficulty:
      typeof raw.difficulty === "number" && Number.isFinite(raw.difficulty)
        ? raw.difficulty
        : DEFAULT_ENGINE_CONFIG.levelDifficultyAnchor[cefrLevel],
    topic: raw.topic,
    format: raw.format,
    stem: raw.stem,
    stemRu,
    options: raw.options.map(toOption),
    correctOptionId: raw.correctOptionId,
    explanation: raw.explanation,
    passageId: raw.passageId,
    lexicalRef,
  };
}

/**
 * Приводит черновой банк к фактическим типам движка, не меняя содержание
 * заданий: регистр CEFR/навыков, варианты ответов, ссылки на тексты и
 * отсутствующую у Reading сложность (берётся ориентир уровня).
 */
export function buildTrialBank(): TrialBank {
  const passages = (passagesRaw as unknown as RawPassage[]).map(
    normalizePassage,
  );
  const passageById = new Map<string, ReadingPassage>();
  for (const passage of passages) {
    if (passageById.has(passage.id)) {
      throw new Error(`Банк: дублирующийся текст "${passage.id}".`);
    }
    passageById.set(passage.id, passage);
  }

  const rawQuestions = [
    ...(grammarRaw as unknown as RawQuestion[]),
    ...(vocabularyRaw as unknown as RawQuestion[]),
    ...(readingRaw as unknown as RawQuestion[]),
  ];
  const items = rawQuestions.map((raw) =>
    normalizeQuestion(raw, new Set(passageById.keys())),
  );

  const errors = validateItemBank(items);
  if (errors.length > 0) {
    throw new Error(`Банк не прошёл проверку:\n${errors.join("\n")}`);
  }

  return {
    items,
    passages,
    passageById,
    version: manifest.bankVersion,
  };
}

export const trialBank: TrialBank = buildTrialBank();

export function createTrialItemPool(): InMemoryItemPool {
  return new InMemoryItemPool(trialBank.items);
}

export type { CefrLevel, Skill };
