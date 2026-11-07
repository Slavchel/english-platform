import {
  SKILLS,
  levelFromIndex,
  levelIndex,
  medianLevel,
  shiftLevel,
  type CefrLevel,
  type Skill,
} from "./levels";
import type {
  Confidence,
  EngineConfig,
  OverallComponents,
  OverallCoverage,
  OverallResult,
} from "./types";

const CONFIDENCE_RANK: Record<Confidence, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

/**
 * Общий уровень = порядковая медиана уровней навыков, ограниченная сверху
 * самым слабым навыком (плюс допустимый разрыв). Это не среднее арифметическое
 * и не процент правильных ответов.
 *
 * Если хотя бы один навык не подтверждён, общий уровень не присваивается:
 * иначе пришлось бы выдумывать недостающий результат.
 */
export function aggregateOverallLevels(
  levels: Record<Skill, CefrLevel | null>,
  confidences: Record<Skill, Confidence>,
  config: EngineConfig,
  coverage?: OverallCoverage,
): OverallResult {
  const confirmed: CefrLevel[] = [];
  for (const skill of SKILLS) {
    const level = levels[skill];
    if (level === null) {
      const components: OverallComponents = {
        levels: { ...levels },
        median: null,
        weakest: null,
        cap: null,
        spread: null,
      };
      return {
        level: null,
        status: "insufficient",
        confidence: "low",
        components,
      };
    }
    confirmed.push(level);
  }

  const indices = confirmed.map(levelIndex);
  const median = medianLevel(confirmed);
  const weakest = levelFromIndex(Math.min(...indices));
  const cap = shiftLevel(weakest, config.overall.maxGapFromWeakest);

  const overall = levelFromIndex(
    Math.min(levelIndex(median), levelIndex(cap)),
  );

  const spread = Math.max(...indices) - Math.min(...indices);
  const components: OverallComponents = {
    levels: { ...levels },
    median,
    weakest,
    cap,
    spread,
  };

  // Досрочное завершение: общего уровня нет, если ответов слишком мало
  // хотя бы по одному навыку. Недостаток данных не компенсируется уровнями.
  if (
    coverage &&
    (coverage.totalAnswered < config.overall.minAnswersTotal ||
      SKILLS.some(
        (skill) =>
          coverage.answeredBySkill[skill] <
          config.overall.minAnswersPerSkill,
      ))
  ) {
    return {
      level: null,
      status: "insufficient",
      confidence: "low",
      components,
    };
  }

  const supportedSkills = SKILLS.filter(
    (skill) =>
      CONFIDENCE_RANK[confidences[skill]] >= CONFIDENCE_RANK.medium,
  ).length;
  const highSkills = SKILLS.filter(
    (skill) => confidences[skill] === "high",
  ).length;

  let confidence: Confidence = "low";
  if (
    spread <= 1 &&
    supportedSkills === SKILLS.length &&
    highSkills >= 2
  ) {
    // Высокая уверенность общего уровня требует не только согласия навыков,
    // но и того, чтобы хотя бы два из них были подтверждены сильно.
    confidence = "high";
  } else if (spread <= 2 && supportedSkills >= 2) {
    confidence = "medium";
  }

  if (
    coverage &&
    coverage.totalAnswered < config.overall.minAnswersForHighTotal &&
    confidence === "high"
  ) {
    confidence = "medium";
  }

  return {
    level: overall,
    status: "confirmed",
    confidence,
    components,
  };
}
