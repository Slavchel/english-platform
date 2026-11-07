import {
  CEFR_LEVELS,
  levelFromIndex,
  levelIndex,
  shiftLevel,
  type CefrLevel,
  type Skill,
} from "./levels";
import type {
  EngineConfig,
  Item,
  LevelEvidence,
  LevelStatus,
  PassageEvidence,
  SkillResult,
  SkillStateSnapshot,
} from "./types";
import { calculateSkillConfidence } from "./confidence";

/** routing — движение по уровням, refine — подтверждение найденного уровня. */
export type EnginePhase = "routing" | "refine";

/**
 * Попытка прохождения одного уровня. Новых попыток на уровне может быть
 * несколько (например, если ученик провалил Pre-A1 и вернулся к нему снова),
 * но заявка на уровень всегда делается по конкретной попытке.
 */
interface Attempt {
  level: CefrLevel;
  items: number;
  correct: number;
  difficulties: number[];
  correctDifficulties: number[];
  failed: boolean;
  claimed: boolean;
  /** Для Reading: статистика по текстам внутри попытки. */
  passages: Map<string, { items: number; correct: number }>;
}

function createAttempt(level: CefrLevel): Attempt {
  return {
    level,
    items: 0,
    correct: 0,
    difficulties: [],
    correctDifficulties: [],
    failed: false,
    claimed: false,
    passages: new Map(),
  };
}

/**
 * Независимое состояние одного навыка.
 *
 * Правила:
 *  - уверенный проход 2/2 может поднять через один уровень (A1 → B1);
 *  - обычный проход — минимум 2 правильных из 2–3 заданий окна;
 *  - при 0/2 или недостатке правильных внутри окна — шаг вниз;
 *  - при 1/2 — третье задание того же уровня (противоречивые ответы);
 *  - проваленный уровень можно подтвердить заново двумя ответами;
 *  - после подтверждения уровня оставшиеся вопросы уточняют его.
 *
 * Трекер ничего не знает о других навыках и о UI.
 */
export class SkillTracker {
  readonly skill: Skill;

  private readonly config: EngineConfig;
  private readonly attempts = new Map<CefrLevel, Attempt[]>();
  private readonly failedLevels = new Set<CefrLevel>();

  private currentLevel: CefrLevel;
  private provisional: CefrLevel | null = null;
  private phase: EnginePhase = "routing";
  private refinePlan: CefrLevel[] = [];
  private planForLevel: CefrLevel | null = null;

  constructor(skill: Skill, config: EngineConfig) {
    this.skill = skill;
    this.config = config;
    this.currentLevel = config.startLevel;
  }

  get targetLevel(): CefrLevel {
    return this.currentLevel;
  }

  get phaseName(): EnginePhase {
    return this.phase;
  }

  get provisionalLevel(): CefrLevel | null {
    return this.provisional;
  }

  /**
   * Куда отправить следующий вопрос навыка. `remainingItems` включает текущий
   * вопрос: по нему трекер понимает, сколько ещё попыток можно потратить.
   */
  nextTarget(remainingItems: number): CefrLevel {
    if (remainingItems <= 0) {
      return this.currentLevel;
    }

    if (!this.provisional) {
      this.phase = "routing";
      return this.currentLevel;
    }

    const provisionalIndex = levelIndex(this.provisional);
    const currentIndex = levelIndex(this.currentLevel);
    const mustRefine =
      currentIndex <= provisionalIndex ||
      this.failedLevels.has(this.currentLevel);

    if (!mustRefine) {
      this.phase = "routing";
      return this.currentLevel;
    }

    this.phase = "refine";

    if (
      this.planForLevel !== this.provisional ||
      this.refinePlan.length === 0
    ) {
      this.refinePlan = this.buildRefinePlan(remainingItems);
      this.planForLevel = this.provisional;
    }

    return this.refinePlan.shift() ?? this.provisional;
  }

  /** Учесть ответ. Здесь же принимаются все решения о смене уровня. */
  record(item: Item, correct: boolean): void {
    const attempt = this.getAttempt(item.cefrLevel);

    attempt.items += 1;
    attempt.difficulties.push(item.difficulty);
    if (correct) {
      attempt.correct += 1;
      attempt.correctDifficulties.push(item.difficulty);
    }
    if (item.passageId) {
      const passage = attempt.passages.get(item.passageId) ?? {
        items: 0,
        correct: 0,
      };
      passage.items += 1;
      if (correct) passage.correct += 1;
      attempt.passages.set(item.passageId, passage);
    }

    // Дополнительные задания на уже подтверждённом уровне только усиливают
    // доказательства и не могут его отменить.
    if (attempt.claimed) {
      return;
    }

    if (this.phase === "refine") {
      this.applyRefineDecision(attempt);
    } else {
      this.applyRoutingDecision(attempt);
    }
  }

  snapshot(): SkillStateSnapshot {
    const levels: LevelEvidence[] = CEFR_LEVELS.map((level) => {
      const attempts = this.attempts.get(level) ?? [];
      const difficulties: number[] = [];
      const correctDifficulties: number[] = [];
      const passages = new Map<
        string,
        { items: number; correct: number }
      >();
      let items = 0;
      let correct = 0;
      let failedAttempts = 0;
      let claimedAttempts = 0;

      for (const attempt of attempts) {
        items += attempt.items;
        correct += attempt.correct;
        difficulties.push(...attempt.difficulties);
        correctDifficulties.push(...attempt.correctDifficulties);
        if (attempt.failed) failedAttempts += 1;
        if (attempt.claimed) claimedAttempts += 1;

        for (const [passageId, stat] of attempt.passages) {
          const total = passages.get(passageId) ?? {
            items: 0,
            correct: 0,
          };
          total.items += stat.items;
          total.correct += stat.correct;
          passages.set(passageId, total);
        }
      }

      const passageEvidence: PassageEvidence[] = [...passages.entries()]
        .map(([passageId, stat]) => ({ passageId, ...stat }))
        .sort((left, right) =>
          left.passageId.localeCompare(right.passageId),
        );

      return {
        level,
        items,
        correct,
        difficulties,
        correctDifficulties,
        failedAttempts,
        claimedAttempts,
        passages: passageEvidence,
      };
    });

    return {
      skill: this.skill,
      finalLevel: this.highestClaimedLevel(),
      provisionalLevel: this.provisional,
      levels,
      failedLevels: [...this.failedLevels],
    };
  }

  getResult(): SkillResult {
    const snapshot = this.snapshot();
    const confidence = calculateSkillConfidence(snapshot, this.config);
    const finalLevel = snapshot.finalLevel;
    const status: LevelStatus = finalLevel ? "confirmed" : "insufficient";

    let evidence = { attempts: 0, items: 0, correct: 0 };

    if (finalLevel) {
      const finalEvidence = snapshot.levels.find(
        (level) => level.level === finalLevel,
      );
      evidence = {
        attempts: this.attempts.get(finalLevel)?.length ?? 0,
        items: finalEvidence?.items ?? 0,
        correct: finalEvidence?.correct ?? 0,
      };
    } else {
      // Уровень не подтверждён: показываем, сколько заданий и правильных
      // ответов собрано по навыку в целом, чтобы результат не выглядел пустым.
      let totalAttempts = 0;
      for (const attempts of this.attempts.values()) {
        totalAttempts += attempts.length;
      }
      evidence = {
        attempts: totalAttempts,
        items: snapshot.levels.reduce((sum, level) => sum + level.items, 0),
        correct: snapshot.levels.reduce(
          (sum, level) => sum + level.correct,
          0,
        ),
      };
    }

    return {
      skill: this.skill,
      level: finalLevel,
      status,
      confidence: confidence.confidence,
      confidenceScore: confidence.score,
      evidence,
    };
  }

  // ---------------------------------------------------------------------------
  // Внутренние правила
  // ---------------------------------------------------------------------------

  private applyRoutingDecision(attempt: Attempt): void {
    if (this.tryClaim(attempt)) {
      this.claimLevel(attempt, this.isStrongPass(attempt));
      return;
    }

    if (this.tryFail(attempt)) {
      this.failLevel(attempt);
      return;
    }

    // 1 правильный из 2 — противоречиво: остаёмся на уровне и добираем
    // третье задание, прежде чем принимать решение.
    this.currentLevel = attempt.level;
  }

  private applyRefineDecision(attempt: Attempt): void {
    if (!this.provisional) {
      return;
    }

    // В режиме уточнения двигаться можно только вверх (зонд потолка),
    // и только при полноценной заявке 2 из 2–3. Вниз уровень не отменяется.
    if (levelIndex(attempt.level) <= levelIndex(this.provisional)) {
      return;
    }

    if (this.tryClaim(attempt)) {
      this.claimLevel(attempt, this.isStrongPass(attempt));
    }
  }

  /**
   * Сильный проход — ровно 2/2, причём хотя бы одно задание не было
   * заведомо простым для уровня. Только он разрешает прыжок через уровень.
   */
  private isStrongPass(attempt: Attempt): boolean {
    if (attempt.items !== 2 || attempt.correct !== 2) {
      return false;
    }

    const anchor = this.config.levelDifficultyAnchor[attempt.level];
    return attempt.correctDifficulties.some(
      (difficulty) =>
        difficulty >= anchor - this.config.claimDifficultyTolerance,
    );
  }

  private tryClaim(attempt: Attempt): boolean {
    return (
      attempt.items >= this.config.claimMinItems &&
      attempt.correct >= this.config.claimMinCorrect
    );
  }

  private tryFail(attempt: Attempt): boolean {
    if (
      attempt.correct === 0 &&
      attempt.items >= Math.min(2, this.config.maxAttemptItems)
    ) {
      return true;
    }

    return (
      attempt.items >= this.config.maxAttemptItems &&
      attempt.correct < this.config.claimMinCorrect
    );
  }

  private claimLevel(attempt: Attempt, strongPass: boolean): void {
    const level = attempt.level;
    attempt.claimed = true;

    if (
      !this.provisional ||
      levelIndex(level) > levelIndex(this.provisional)
    ) {
      this.provisional = level;
    }
    this.failedLevels.delete(level);

    const levelNumber = levelIndex(level);
    let nextNumber = levelNumber + 1;

    // Прыжок ровно через один уровень: A1 → B1, B1 → C1. Промежуточный
    // уровень нельзя перескочить, если он уже был провален — его сначала
    // нужно подтвердить заново.
    if (strongPass && nextNumber < CEFR_LEVELS.length - 1) {
      const intermediate = levelFromIndex(nextNumber);
      if (!this.failedLevels.has(intermediate)) {
        nextNumber += 1;
      }
    }

    this.currentLevel = levelFromIndex(
      Math.min(nextNumber, CEFR_LEVELS.length - 1),
    );

    this.refinePlan = [];
    this.planForLevel = null;
    this.phase = "routing";
  }

  private failLevel(attempt: Attempt): void {
    const level = attempt.level;
    attempt.failed = true;
    this.failedLevels.add(level);
    this.currentLevel =
      levelIndex(level) > 0 ? shiftLevel(level, -1) : level;
    this.refinePlan = [];
    this.planForLevel = null;
  }

  /**
   * План уточнения: подтверждение заявленного уровня, зонд потолка,
   * зонд пола и снова подтверждение. Строится один раз на остаток вопросов.
   */
  private buildRefinePlan(remainingItems: number): CefrLevel[] {
    const primary = this.provisional;
    if (!primary) {
      return [];
    }

    const primaryIndex = levelIndex(primary);
    const plan: CefrLevel[] = [];
    const ceiling =
      primaryIndex + 1 < CEFR_LEVELS.length
        ? levelFromIndex(primaryIndex + 1)
        : null;
    const ceilingFailed = ceiling
      ? this.failedLevels.has(ceiling)
      : false;

    if (ceiling && ceilingFailed && remainingItems >= 2) {
      // После ошибки на предыдущем уровне даём шанс вернуться: два
      // правильных ответа снова подтверждают уровень. Это не прыжок:
      // проверяются ровно соседние уровни.
      if (remainingItems >= 3) {
        plan.push(primary);
      }
      plan.push(ceiling, ceiling);
    } else {
      plan.push(primary);

      if (remainingItems >= 3 && ceiling && !ceilingFailed) {
        plan.push(ceiling);
      }

      if (remainingItems >= 5 && primaryIndex > 0) {
        const floor = levelFromIndex(primaryIndex - 1);
        if (!this.failedLevels.has(floor)) {
          plan.push(floor);
        }
      }
    }

    while (plan.length < remainingItems) {
      plan.push(primary);
    }

    return plan.slice(0, remainingItems);
  }

  private getAttempt(level: CefrLevel): Attempt {
    const attempts = this.attempts.get(level) ?? [];
    this.attempts.set(level, attempts);

    const last = attempts[attempts.length - 1];
    if (!last) {
      const attempt = createAttempt(level);
      attempts.push(attempt);
      return attempt;
    }

    // Уже подтверждённый уровень: дополнительные задания идут в ту же
    // попытку и не могут его отменить.
    if (last.claimed) {
      return last;
    }

    // Проваленная попытка закрыта — при возврате на уровень начинается новая.
    if (last.failed) {
      const attempt = createAttempt(level);
      attempts.push(attempt);
      return attempt;
    }

    return last;
  }

  private highestClaimedLevel(): CefrLevel | null {
    for (let index = CEFR_LEVELS.length - 1; index >= 0; index -= 1) {
      const level = CEFR_LEVELS[index];
      const attempts = this.attempts.get(level);
      if (attempts?.some((attempt) => attempt.claimed)) {
        return level;
      }
    }
    return null;
  }
}
