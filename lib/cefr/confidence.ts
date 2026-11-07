import {
  CEFR_LEVELS,
  levelIndex,
  shiftLevel,
  type CefrLevel,
} from "./levels";
import type {
  Confidence,
  EngineConfig,
  SkillStateSnapshot,
} from "./types";

export interface SkillConfidenceResult {
  confidence: Confidence;
  score: number;
}

/**
 * Уверенность навыка — сумма детерминированных баллов:
 * 1) объём доказательств на итоговом уровне;
 * 2) подтверждение сложными заданиями;
 * 3) проверенный потолок;
 * 4) отсутствие противоречий;
 * 5) покрытие разных уровней сложности.
 * Максимум — 9 баллов.
 */
export function calculateSkillConfidence(
  snapshot: SkillStateSnapshot,
  config: EngineConfig,
): SkillConfidenceResult {
  const finalLevel = snapshot.finalLevel;
  if (!finalLevel) {
    return { confidence: "low", score: 0 };
  }

  const evidence = snapshot.levels.find((level) => level.level === finalLevel);

  if (!evidence) {
    return { confidence: "low", score: 0 };
  }

  const anchor = config.levelDifficultyAnchor[finalLevel];
  let score = 0;
  const answeredInSkill = snapshot.levels.reduce(
    (total, level) => total + level.items,
    0,
  );

  if (evidence.correct >= 3 && evidence.items >= 3) {
    score += 4;
  } else if (evidence.correct >= 2 && evidence.items >= 4) {
    score += 4;
  } else if (evidence.correct === 2 && evidence.items === 3) {
    score += 2;
  } else if (evidence.correct === 2 && evidence.items === 2) {
    score += 3;
  } else if (evidence.correct >= 2) {
    score += 2;
  }

  if (
    evidence.correctDifficulties.some(
      (difficulty) =>
        difficulty >= anchor - config.claimDifficultyTolerance,
    )
  ) {
    score += 1;
  }

  const nextLevel: CefrLevel | null =
    levelIndex(finalLevel) < CEFR_LEVELS.length - 1
      ? shiftLevel(finalLevel, 1)
      : null;

  if (nextLevel && snapshot.failedLevels.includes(nextLevel)) {
    score += 2;
  } else if (!nextLevel && evidence.correct >= 3) {
    // C2 — верх шкалы: проверить «выше» нельзя, но серия верных ответов
    // всё равно усиливает уверенность.
    score += 1;
  }

  if (evidence.claimedAttempts > 0 && evidence.failedAttempts === 0) {
    score += 1;
  }

  const difficultyBands = new Set<number>();
  for (const difficulty of evidence.difficulties) {
    if (difficulty < anchor - 0.5) {
      difficultyBands.add(0);
    } else if (difficulty > anchor + 0.5) {
      difficultyBands.add(2);
    } else {
      difficultyBands.add(1);
    }
  }
  if (difficultyBands.size >= 2) {
    score += 1;
  }

  // Reading: несколько вопросов к одному тексту — не независимые
  // доказательства. Считаем уникальные тексты за весь навык, а не только
  // на итоговом уровне: иначе сильный ученик с 5 текстами получал бы
  // низкую уверенность из-за двух вопросов последнего текста.
  const readingPassages =
    snapshot.skill === "reading"
      ? new Set(
          snapshot.levels.flatMap((level) =>
            level.passages.map((passage) => passage.passageId),
          ),
        ).size
      : 0;
  if (readingPassages > 0 && readingPassages < 2) {
    // Один текст не даёт независимого подтверждения уровня.
    score = Math.min(score, config.confidenceThresholds.medium - 1);
  }

  let confidence: Confidence = "low";
  if (score >= config.confidenceThresholds.high) {
    confidence = "high";
  } else if (score >= config.confidenceThresholds.medium) {
    confidence = "medium";
  }

  if (
    snapshot.skill === "reading" &&
    readingPassages > 0 &&
    readingPassages <
      config.confidenceCoverage.minReadingPassagesForHigh &&
    confidence === "high"
  ) {
    confidence = "medium";
  }

  // Без заявленного уровня (например, провалены все попытки) уверенность
  // не может быть выше низкой.
  if (evidence.claimedAttempts === 0) {
    confidence = "low";
  }

  // Досрочное завершение: мало ответов не даёт высокой уверенности.
  if (answeredInSkill < config.confidenceCoverage.minAnswersForMedium) {
    confidence = "low";
  } else if (
    answeredInSkill < config.confidenceCoverage.minAnswersForHigh &&
    confidence === "high"
  ) {
    confidence = "medium";
  }

  return { confidence, score };
}
