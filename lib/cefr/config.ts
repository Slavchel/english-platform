import type { CefrLevel } from "./levels";
import type { EngineConfig } from "./types";

/** Версия алгоритма. Меняется при любом изменении правил, влияющем на результат. */
export const ALGORITHM_VERSION = "0.1.0";

/**
 * Ориентиры сложности по уровням. Пока это экспертные значения; после пилота
 * они будут заменены калиброванными параметрами банка.
 */
const LEVEL_DIFFICULTY_ANCHOR: Record<CefrLevel, number> = {
  "Pre-A1": -2.4,
  A1: -1.6,
  A2: -0.8,
  B1: 0,
  B2: 0.8,
  C1: 1.6,
  C2: 2.4,
};

export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  questionsPerSkill: 10,
  startLevel: "A1",
  maxAttemptItems: 3,
  claimMinItems: 2,
  claimMinCorrect: 2,
  claimDifficultyTolerance: 0.5,
  maxItemsPerTopic: 2,
  levelDifficultyAnchor: LEVEL_DIFFICULTY_ANCHOR,
  confidenceThresholds: { high: 7, medium: 4 },
  confidenceCoverage: {
    minAnswersForMedium: 4,
    minAnswersForHigh: 7,
    minReadingPassagesForHigh: 3,
  },
  overall: {
    maxGapFromWeakest: 1,
    minAnswersPerSkill: 5,
    minAnswersTotal: 15,
    minAnswersForHighTotal: 24,
  },
};

/**
 * Мержит переопределения с настройками по умолчанию и проверяет инварианты.
 * Благодаря этому будущие правки методики не требуют менять движок.
 */
export function resolveConfig(
  overrides: Partial<EngineConfig> = {},
): EngineConfig {
  const config: EngineConfig = {
    ...DEFAULT_ENGINE_CONFIG,
    ...overrides,
    levelDifficultyAnchor: {
      ...DEFAULT_ENGINE_CONFIG.levelDifficultyAnchor,
      ...(overrides.levelDifficultyAnchor ?? {}),
    },
    confidenceThresholds: {
      ...DEFAULT_ENGINE_CONFIG.confidenceThresholds,
      ...(overrides.confidenceThresholds ?? {}),
    },
    confidenceCoverage: {
      ...DEFAULT_ENGINE_CONFIG.confidenceCoverage,
      ...(overrides.confidenceCoverage ?? {}),
    },
    overall: {
      ...DEFAULT_ENGINE_CONFIG.overall,
      ...(overrides.overall ?? {}),
    },
  };

  assertValidConfig(config);
  return config;
}

function assertValidConfig(config: EngineConfig): void {
  if (
    !Number.isInteger(config.questionsPerSkill) ||
    config.questionsPerSkill < 1
  ) {
    throw new RangeError("questionsPerSkill должно быть целым числом ≥ 1.");
  }
  if (!Number.isInteger(config.maxAttemptItems) || config.maxAttemptItems < 2) {
    throw new RangeError("maxAttemptItems должно быть целым числом ≥ 2.");
  }
  if (
    !Number.isInteger(config.claimMinItems) ||
    config.claimMinItems < 2 ||
    config.claimMinItems > config.maxAttemptItems
  ) {
    throw new RangeError(
      "claimMinItems должно быть ≥ 2 и не больше maxAttemptItems.",
    );
  }
  if (
    !Number.isInteger(config.claimMinCorrect) ||
    config.claimMinCorrect < 2 ||
    config.claimMinCorrect > config.claimMinItems
  ) {
    throw new RangeError(
      "claimMinCorrect должно быть ≥ 2 и не больше claimMinItems.",
    );
  }
  if (config.claimDifficultyTolerance < 0) {
    throw new RangeError("claimDifficultyTolerance не может быть отрицательным.");
  }
  if (config.maxItemsPerTopic < 1) {
    throw new RangeError("maxItemsPerTopic должно быть ≥ 1.");
  }
  if (
    config.confidenceThresholds.high <= config.confidenceThresholds.medium
  ) {
    throw new RangeError(
      "Порог высокой уверенности должен быть выше среднего.",
    );
  }
  if (config.overall.maxGapFromWeakest < 0) {
    throw new RangeError("maxGapFromWeakest не может быть отрицательным.");
  }
  if (config.overall.minAnswersPerSkill < 0) {
    throw new RangeError("minAnswersPerSkill не может быть отрицательным.");
  }
  if (config.overall.minAnswersTotal < 0) {
    throw new RangeError("minAnswersTotal не может быть отрицательным.");
  }
  if (config.overall.minAnswersForHighTotal < 0) {
    throw new RangeError(
      "minAnswersForHighTotal не может быть отрицательным.",
    );
  }
  if (config.confidenceCoverage.minAnswersForMedium < 0) {
    throw new RangeError(
      "minAnswersForMedium не может быть отрицательным.",
    );
  }
  if (
    config.confidenceCoverage.minAnswersForHigh <
    config.confidenceCoverage.minAnswersForMedium
  ) {
    throw new RangeError(
      "minAnswersForHigh должен быть не меньше minAnswersForMedium.",
    );
  }
  if (
    Object.values(config.levelDifficultyAnchor).some(
      (value) => !Number.isFinite(value),
    )
  ) {
    throw new RangeError("levelDifficultyAnchor должен содержать числа.");
  }
}
