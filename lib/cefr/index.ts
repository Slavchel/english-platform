/**
 * Публичный API движка CEFR-теста.
 * Всё, что нужно UI, импортируется отсюда; внутренние модули можно менять,
 * не трогая страницы сайта.
 */

export * from "./levels";
export * from "./types";

export { ALGORITHM_VERSION, DEFAULT_ENGINE_CONFIG, resolveConfig } from "./config";

export { CefrTestEngine } from "./engine";
export type { AnswerOutcome, TestEngineOptions } from "./engine";

export { InMemoryItemPool, validateItemBank } from "./item-pool";
export type { ItemPool } from "./item-pool";

export { createSkillUsage, markItemUsed, selectItem } from "./selection";
export type { SelectionRequest, SkillUsage } from "./selection";

export { calculateSkillConfidence } from "./confidence";
export type { SkillConfidenceResult } from "./confidence";

export { aggregateOverallLevels } from "./overall";

export { deriveSeed, hashString, mulberry32, randomIndex } from "./random";
export type { RandomSource } from "./random";

export {
  VOCABULARY_LEVEL_FILES,
  buildVocabularyIndex,
  buildVocabularyItemSeeds,
  findTranslationDistractors,
  isUsableForVocabularyItems,
  isVocabularyEntry,
  normalizeWord,
  toLexicalReference,
} from "./vocabulary/dictionary";
export type {
  LexicalReference,
  VocabularyDataSource,
  VocabularyEntry,
  VocabularyFilterOptions,
  VocabularyIndex,
  VocabularyItemSeed,
  VocabularySeedOptions,
} from "./vocabulary/dictionary";
