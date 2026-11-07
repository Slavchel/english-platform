import type { CefrLevel, Skill } from "./levels";

/**
 * Задание банка. Уровень задания (`cefrLevel`) — это конструкт, а `difficulty` —
 * отдельная непрерывная сложность (логиты). Их нельзя смешивать.
 */
export interface Item {
  id: string;
  skill: Skill;
  cefrLevel: CefrLevel;
  difficulty: number;
  topic: string;
  format: string;
  stem: string;
  /** Русская формулировка вопроса для уровней Pre-A1…A2. */
  stemRu?: string;
  options: readonly ItemOption[];
  correctOptionId: string;
  explanation?: string;
  /** Для Vocabulary: какая именно словарная запись проверяется. */
  lexicalRef?: ItemLexicalRef;
  /** Для Reading: задание относится к тексту, а не существует само по себе. */
  passageId?: string;
}

export interface ItemOption {
  id: string;
  text: string;
}

/**
 * Ссылка на запись из словаря. Необязательна для движка, но позволяет
 * проверить, что лексика задания действительно взята из нашей базы.
 */
export interface ItemLexicalRef {
  wordId: string;
  word: string;
  level: CefrLevel;
  partOfSpeech: string;
  category: string;
  translation: string;
}

/** Текст для Reading. Хранится отдельно, вопросы ссылаются на passageId. */
export interface ReadingPassage {
  id: string;
  cefrLevel: CefrLevel;
  title: string;
  topic: string;
  genre: string;
  wordCount: number;
  text: string;
  source: string;
}

export interface Response {
  itemId: string;
  skill: Skill;
  cefrLevel: CefrLevel;
  difficulty: number;
  topic: string;
  format: string;
  correct: boolean;
  selectedOptionId: string;
}

export type Confidence = "high" | "medium" | "low";

/**
 * `confirmed` — уровень доказан ответами.
 * `insufficient` — ни один уровень не набрал нужного количества доказательств,
 * поэтому уровень не присваивается (даже Pre-A1).
 */
export type LevelStatus = "confirmed" | "insufficient";

export interface SkillEvidenceSummary {
  attempts: number;
  items: number;
  correct: number;
}

export interface SkillResult {
  skill: Skill;
  level: CefrLevel | null;
  status: LevelStatus;
  confidence: Confidence;
  /** Сумма баллов уверенности (0–9) — для отладки и аналитики. */
  confidenceScore: number;
  evidence: SkillEvidenceSummary;
}

export interface PassageEvidence {
  passageId: string;
  items: number;
  correct: number;
}

export interface LevelEvidence {
  level: CefrLevel;
  items: number;
  correct: number;
  difficulties: readonly number[];
  correctDifficulties: readonly number[];
  failedAttempts: number;
  claimedAttempts: number;
  /** Для Reading: какие тексты использовались на уровне и сколько вопросов. */
  passages: readonly PassageEvidence[];
}

export interface SkillStateSnapshot {
  skill: Skill;
  finalLevel: CefrLevel | null;
  provisionalLevel: CefrLevel | null;
  levels: readonly LevelEvidence[];
  failedLevels: readonly CefrLevel[];
}

export interface OverallComponents {
  levels: Record<Skill, CefrLevel | null>;
  median: CefrLevel | null;
  weakest: CefrLevel | null;
  /** Потолок, который задаёт самый слабый навык. */
  cap: CefrLevel | null;
  spread: number | null;
}

export interface OverallResult {
  level: CefrLevel | null;
  status: LevelStatus;
  confidence: Confidence;
  components: OverallComponents;
}

/** Сколько ответов реально получено — для проверки достаточности данных. */
export interface OverallCoverage {
  answeredBySkill: Record<Skill, number>;
  totalAnswered: number;
}

export interface TestResult {
  overall: OverallResult;
  skills: Record<Skill, SkillResult>;
  answered: number;
  total: number;
  /** true — пройдены все 30 вопросов; false — досрочное завершение. */
  completed: boolean;
  unanswered: number;
  stats: TestStats;
  /** Ответы для экрана разбора. Доступны только после завершения. */
  review: readonly AnswerReview[];
  seed: number;
  algorithmVersion: string;
}

export interface AnswerReview {
  /** Порядковый номер вопроса в прохождении, начиная с 1. */
  index: number;
  item: Item;
  selectedOptionId: string;
  correct: boolean;
}

export interface SkillStats {
  answered: number;
  correct: number;
  incorrect: number;
  unanswered: number;
}

export interface TestStats {
  answered: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  bySkill: Record<Skill, SkillStats>;
}

/**
 * Все пороги алгоритма собраны здесь, чтобы менять методику без переписывания
 * движка. Значения по умолчанию — в config.ts.
 */
export interface EngineConfig {
  /** Сколько вопросов приходится на каждый навык (всего = × 3). */
  questionsPerSkill: number;
  /** Стартовый уровень проверки. Движение дальше — только на ±1. */
  startLevel: CefrLevel;
  /** Максимум заданий в одном окне одного уровня (2–3 по договорённости). */
  maxAttemptItems: number;
  /** Минимум заданий, чтобы вообще рассматривать уровень. */
  claimMinItems: number;
  /** Минимум правильных ответов для заявки на уровень. */
  claimMinCorrect: number;
  /** Допуск, в пределах которого задание считается «достаточно сложным». */
  claimDifficultyTolerance: number;
  /** Ограничение на количество заданий одной темы внутри навыка. */
  maxItemsPerTopic: number;
  /** Ожидаемая сложность задания каждого уровня (центр шкалы). */
  levelDifficultyAnchor: Record<CefrLevel, number>;
  /** Пороги суммы баллов уверенности. */
  confidenceThresholds: { high: number; medium: number };
  /**
   * Ограничения уверенности по объёму данных. Нужны для досрочного
   * завершения: несколько ответов не должны давать высокую уверенность.
   */
  confidenceCoverage: {
    minAnswersForMedium: number;
    minAnswersForHigh: number;
    minReadingPassagesForHigh: number;
  };
  overall: {
    /** Насколько общий уровень может превысить самый слабый навык. */
    maxGapFromWeakest: number;
    /** Минимум ответов в каждом навыке для общего уровня. */
    minAnswersPerSkill: number;
    /** Минимум ответов всего для общего уровня. */
    minAnswersTotal: number;
    /** С какого объёма данных общий уровень может быть высокоуверенным. */
    minAnswersForHighTotal: number;
  };
}

export interface TestProgress {
  answered: number;
  total: number;
  skill: Skill;
  /** Номер вопроса внутри текущего навыка, начиная с 1. */
  questionInSkill: number;
}
