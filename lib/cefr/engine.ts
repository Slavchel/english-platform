import {
  CEFR_LEVELS,
  SKILLS,
  levelIndex,
  type CefrLevel,
  type Skill,
} from "./levels";
import type {
  AnswerReview,
  Confidence,
  EngineConfig,
  Item,
  Response,
  SkillResult,
  SkillStats,
  TestProgress,
  TestResult,
  TestStats,
} from "./types";
import { ALGORITHM_VERSION, resolveConfig } from "./config";
import {
  deriveSeed,
  mulberry32,
  type RandomSource,
} from "./random";
import type { ItemPool } from "./item-pool";
import {
  createSkillUsage,
  markItemUsed,
  selectItem,
  type SkillUsage,
} from "./selection";
import { SkillTracker } from "./tracker";
import { aggregateOverallLevels } from "./overall";

export interface TestEngineOptions {
  bank: ItemPool;
  /** Seed сессии: обеспечивает воспроизводимость вопросов и результата. */
  seed: number;
  config?: Partial<EngineConfig>;
}

export interface AnswerOutcome {
  correct: boolean;
  correctOptionId: string;
  explanation?: string;
  finished: boolean;
  progress: TestProgress;
  nextItem: Item | null;
}

/** Позиция вопроса внутри группы Reading (2 вопроса на один текст). */
export interface ReadingGroup {
  passageId: string;
  /** Номер вопроса внутри текста, начиная с 1. */
  index: number;
  /** Сколько вопросов в этой группе. */
  size: number;
  /** Порядковый номер текста в тесте, начиная с 1. */
  number: number;
}

/**
 * Движок теста: фиксированные 30 вопросов (3 навыка × 10), три независимых
 * состояния, детерминированный выбор заданий и итоговая агрегация.
 *
 * Не зависит от React, БД и API — это чистые вычисления.
 */
export class CefrTestEngine {
  readonly totalQuestions: number;

  private readonly config: EngineConfig;
  private readonly bank: ItemPool;
  private readonly seed: number;
  private readonly trackers: Record<Skill, SkillTracker>;
  private readonly usage: Record<Skill, SkillUsage>;
  private readonly rng: Record<Skill, RandomSource>;
  private readonly order: readonly Skill[];
  private readonly responses: Response[] = [];
  private readonly readingQueue: Item[] = [];
  private readonly seenReadingPassages = new Set<string>();

  private readingGroupState: ReadingGroup | null = null;
  private readingGroupCounter = 0;

  private current: Item | null = null;
  private answered = 0;
  private finished = false;

  constructor(options: TestEngineOptions) {
    if (!Number.isFinite(options.seed)) {
      throw new RangeError("seed должен быть конечным числом.");
    }

    this.config = resolveConfig(options.config);
    this.bank = options.bank;
    this.seed = Math.trunc(options.seed) >>> 0;
    this.totalQuestions = this.config.questionsPerSkill * SKILLS.length;
    this.order = buildOrder(this.config.questionsPerSkill);

    const trackers = {} as Record<Skill, SkillTracker>;
    const usage = {} as Record<Skill, SkillUsage>;
    const rng = {} as Record<Skill, RandomSource>;

    for (const skill of SKILLS) {
      trackers[skill] = new SkillTracker(skill, this.config);
      usage[skill] = createSkillUsage();
      // У каждого навыка свой поток случайности: ответы по Grammar не влияют
      // на подбор вопросов Vocabulary и Reading.
      rng[skill] = mulberry32(deriveSeed(this.seed, skill));
    }

    this.trackers = trackers;
    this.usage = usage;
    this.rng = rng;
    this.current = this.pickNextItem();
  }

  get isFinished(): boolean {
    return this.finished;
  }

  get answeredCount(): number {
    return this.answered;
  }

  get currentItem(): Item | null {
    return this.current;
  }

  get readingGroup(): ReadingGroup | null {
    if (!this.current || !this.readingGroupState) {
      return null;
    }
    return { ...this.readingGroupState };
  }

  get progress(): TestProgress {
    const index = Math.min(this.answered, this.totalQuestions - 1);
    const skill = this.order[index];
    const firstIndex = this.order.indexOf(skill);
    const questionInSkill = Math.min(
      this.config.questionsPerSkill,
      this.answered - firstIndex + 1,
    );

    return {
      answered: this.answered,
      total: this.totalQuestions,
      skill,
      questionInSkill,
    };
  }

  submitAnswer(optionId: string): AnswerOutcome {
    if (this.finished || !this.current) {
      throw new Error("Тест уже завершён: отвечать больше нельзя.");
    }

    const item = this.current;
    if (!item.options.some((option) => option.id === optionId)) {
      throw new Error(
        `Неизвестный вариант ответа "${optionId}" для задания "${item.id}".`,
      );
    }

    const correct = optionId === item.correctOptionId;
    this.trackers[item.skill].record(item, correct);

    this.responses.push({
      itemId: item.id,
      skill: item.skill,
      cefrLevel: item.cefrLevel,
      difficulty: item.difficulty,
      topic: item.topic,
      format: item.format,
      correct,
      selectedOptionId: optionId,
    });

    this.answered += 1;

    if (this.answered >= this.totalQuestions) {
      this.finished = true;
      this.current = null;
    } else {
      this.current = this.pickNextItem();
    }

    return {
      correct,
      correctOptionId: item.correctOptionId,
      explanation: item.explanation,
      finished: this.finished,
      progress: this.progress,
      nextItem: this.current,
    };
  }

  /** Досрочное завершение: неотвеченные вопросы не считаются ошибками. */
  finishEarly(): TestResult {
    if (!this.finished) {
      this.finished = true;
      this.current = null;
      this.readingGroupState = null;
    }
    return this.buildResult();
  }

  getResult(): TestResult {
    if (!this.finished) {
      throw new Error(
        "Результат доступен только после завершения теста.",
      );
    }
    return this.buildResult();
  }

  private buildResult(): TestResult {
    const skills = {} as Record<Skill, SkillResult>;
    const levels = {} as Record<Skill, CefrLevel | null>;
    const confidences = {} as Record<Skill, Confidence>;
    const bySkill = {} as Record<Skill, SkillStats>;

    let correctTotal = 0;

    for (const skill of SKILLS) {
      const result = this.trackers[skill].getResult();
      skills[skill] = result;
      levels[skill] = result.level;
      confidences[skill] = result.confidence;

      const skillResponses = this.responses.filter(
        (response) => response.skill === skill,
      );
      const correct = skillResponses.filter(
        (response) => response.correct,
      ).length;
      correctTotal += correct;
      bySkill[skill] = {
        answered: skillResponses.length,
        correct,
        incorrect: skillResponses.length - correct,
        unanswered: this.config.questionsPerSkill - skillResponses.length,
      };
    }

    const stats: TestStats = {
      answered: this.answered,
      correct: correctTotal,
      incorrect: this.answered - correctTotal,
      unanswered: this.totalQuestions - this.answered,
      bySkill,
    };

    const review: AnswerReview[] = this.responses.map(
      (response, index) => {
        const item = this.bank.getItem(response.itemId);
        if (!item) {
          throw new Error(
            `Не найдено задание "${response.itemId}" для разбора ответов.`,
          );
        }
        return {
          index: index + 1,
          item,
          selectedOptionId: response.selectedOptionId,
          correct: response.correct,
        };
      },
    );

    return {
      overall: aggregateOverallLevels(
        levels,
        confidences,
        this.config,
        {
          answeredBySkill: {
            grammar: bySkill.grammar.answered,
            vocabulary: bySkill.vocabulary.answered,
            reading: bySkill.reading.answered,
          },
          totalAnswered: this.answered,
        },
      ),
      skills,
      answered: this.answered,
      total: this.totalQuestions,
      completed: this.answered >= this.totalQuestions,
      unanswered: this.totalQuestions - this.answered,
      stats,
      review,
      seed: this.seed,
      algorithmVersion: ALGORITHM_VERSION,
    };
  }

  private pickNextItem(): Item | null {
    if (this.answered >= this.totalQuestions) {
      return null;
    }

    const skill = this.order[this.answered];
    const firstIndex = this.order.indexOf(skill);
    const answeredInSkill = this.answered - firstIndex;
    const remainingInSkill =
      this.config.questionsPerSkill - answeredInSkill;

    const tracker = this.trackers[skill];
    const targetLevel = tracker.nextTarget(remainingInSkill);
    const last = this.lastResponseFor(skill);
    const targetDifficulty =
      this.config.levelDifficultyAnchor[targetLevel] +
      (last ? (last.correct ? 0.25 : -0.25) : 0);

    const item =
      skill === "reading"
        ? (this.pickReadingItem(targetLevel) ??
          this.pickItem(skill, targetLevel, targetDifficulty))
        : this.pickItem(skill, targetLevel, targetDifficulty);

    if (!item) {
      throw new Error(
        `Банк исчерпан: нет заданий для навыка "${skill}" уровня "${targetLevel}".`,
      );
    }

    if (item.skill !== skill) {
      throw new Error(
        `Банк вернул задание "${item.id}" не того навыка.`,
      );
    }

    markItemUsed(this.usage[skill], item);
    return item;
  }

  private pickItem(
    skill: Skill,
    targetLevel: CefrLevel,
    targetDifficulty: number,
  ): Item | null {
    const request = {
      skill,
      targetLevel,
      targetDifficulty,
      recentCorrect: this.lastResponseFor(skill)?.correct ?? null,
      usage: this.usage[skill],
    };

    const item = selectItem(
      this.bank,
      request,
      this.rng[skill],
      this.config,
    );
    if (item) return item;

    // Черновой банк содержит 3–6 заданий на уровень, а одному прохождению
    // нужно до 10 вопросов навыка. Если целевой уровень исчерпан, берём
    // ближайший уровень, где ещё есть неиспользованные задания. Выбор
    // остаётся детерминированным и не превращается в случайную выдачу.
    const fallbackLevels = this.levelsByDistance(targetLevel);

    for (const fallbackLevel of fallbackLevels) {
      if (fallbackLevel === targetLevel) continue;

      const hasUnseen = this.bank
        .getItems(skill, fallbackLevel)
        .some(
          (candidate) =>
            !this.usage[skill].seenItemIds.has(candidate.id),
        );
      if (!hasUnseen) continue;

      const fallback = selectItem(
        this.bank,
        {
          ...request,
          targetLevel: fallbackLevel,
          targetDifficulty:
            this.config.levelDifficultyAnchor[fallbackLevel] +
            (request.recentCorrect === null
              ? 0
              : request.recentCorrect
                ? 0.25
                : -0.25),
        },
        this.rng[skill],
        this.config,
      );
      if (fallback) return fallback;
    }

    return null;
  }

  /**
   * Reading идёт группами по два вопроса к одному тексту. Это сокращает
   * количество текстов и сохраняет связь вопроса с контекстом.
   */
  private pickReadingItem(targetLevel: CefrLevel): Item | null {
    const queued = this.readingQueue.shift();
    if (queued) {
      if (this.readingGroupState) {
        this.readingGroupState = {
          ...this.readingGroupState,
          index: this.readingGroupState.index + 1,
        };
      }
      return queued;
    }

    this.readingGroupState = null;
    const group = this.chooseReadingGroup(targetLevel);
    if (!group) {
      return null;
    }

    this.readingGroupCounter += 1;
    this.readingGroupState = {
      passageId: group.passageId,
      index: 1,
      size: group.items.length,
      number: this.readingGroupCounter,
    };
    this.seenReadingPassages.add(group.passageId);
    this.readingQueue.push(...group.items.slice(1));
    return group.items[0];
  }

  private chooseReadingGroup(
    targetLevel: CefrLevel,
  ): { passageId: string; items: Item[] } | null {
    const usage = this.usage.reading;

    for (const level of this.levelsByDistance(targetLevel)) {
      const unseen = this.bank
        .getItems("reading", level)
        .filter(
          (item) =>
            Boolean(item.passageId) &&
            !usage.seenItemIds.has(item.id) &&
            !this.seenReadingPassages.has(item.passageId as string),
        );

      const byPassage = new Map<string, Item[]>();
      for (const item of unseen) {
        const passageId = item.passageId as string;
        const list = byPassage.get(passageId);
        if (list) list.push(item);
        else byPassage.set(passageId, [item]);
      }

      const eligible = [...byPassage.entries()]
        .filter(([, items]) => items.length >= 2)
        .sort(([left], [right]) => left.localeCompare(right));

      if (eligible.length === 0) continue;

      // Перемешиваем список текстов уровня, чтобы первый текст не был
      // привязан к алфавитному порядку ID.
      for (let index = eligible.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(
          this.rng.reading() * (index + 1),
        );
        [eligible[index], eligible[swapIndex]] = [
          eligible[swapIndex],
          eligible[index],
        ];
      }

      const picked = eligible[0];
      if (!picked) continue;

      // Берём два вопроса из текста случайно, а не только первые два:
      // так все задания банка Reading могут участвовать в разных сессиях.
      const pool = [...picked[1]];
      for (let index = pool.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(
          this.rng.reading() * (index + 1),
        );
        [pool[index], pool[swapIndex]] = [
          pool[swapIndex],
          pool[index],
        ];
      }

      return {
        passageId: picked[0],
        items: pool.slice(0, 2),
      };
    }

    return null;
  }

  private levelsByDistance(targetLevel: CefrLevel): CefrLevel[] {
    const targetIndex = levelIndex(targetLevel);
    return [...CEFR_LEVELS].sort((left, right) => {
      const distance =
        Math.abs(levelIndex(left) - targetIndex) -
        Math.abs(levelIndex(right) - targetIndex);
      return distance || levelIndex(left) - levelIndex(right);
    });
  }

  private lastResponseFor(skill: Skill): Response | null {
    for (let index = this.responses.length - 1; index >= 0; index -= 1) {
      const response = this.responses[index];
      if (response.skill === skill) {
        return response;
      }
    }
    return null;
  }
}

function buildOrder(questionsPerSkill: number): readonly Skill[] {
  const order: Skill[] = [];
  for (const skill of SKILLS) {
    for (let index = 0; index < questionsPerSkill; index += 1) {
      order.push(skill);
    }
  }
  return order;
}
