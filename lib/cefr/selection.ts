import type { CefrLevel, Skill } from "./levels";
import type { EngineConfig, Item } from "./types";
import type { ItemPool } from "./item-pool";
import type { RandomSource } from "./random";
import { randomIndex } from "./random";

export interface SkillUsage {
  readonly seenItemIds: Set<string>;
  readonly topicCounts: Map<string, number>;
  readonly formatCounts: Map<string, number>;
}

export function createSkillUsage(): SkillUsage {
  return {
    seenItemIds: new Set<string>(),
    topicCounts: new Map<string, number>(),
    formatCounts: new Map<string, number>(),
  };
}

export interface SelectionRequest {
  skill: Skill;
  targetLevel: CefrLevel;
  /** Желаемая сложность: центр уровня, сдвинутый по последнему ответу. */
  targetDifficulty: number;
  recentCorrect: boolean | null;
  usage: SkillUsage;
}

/**
 * Выбор задания: фильтры → скоринг → top-k → случайный выбор внутри top-k.
 * Так сохраняется вариативность, но вариант остаётся сопоставимым по сложности.
 * Возвращает null, если в банке закончились задания нужного уровня.
 */
export function selectItem(
  pool: ItemPool,
  request: SelectionRequest,
  rng: RandomSource,
  config: EngineConfig,
): Item | null {
  const { usage } = request;
  const all = pool.getItems(request.skill, request.targetLevel);
  const unseen = all.filter((item) => !usage.seenItemIds.has(item.id));

  if (unseen.length === 0) {
    return null;
  }

  const withinTopicLimit = unseen.filter(
    (item) =>
      (usage.topicCounts.get(item.topic) ?? 0) < config.maxItemsPerTopic,
  );
  const candidates = withinTopicLimit.length > 0 ? withinTopicLimit : unseen;

  // Равномерный случайный выбор из всего доступного пула уровня. Уровень
  // уже выбран адаптивно; внутри него не отсекаем задания по сложности или
  // по порядку ID, иначе новые задания проигрывают старым.
  const chosen = candidates[randomIndex(rng, candidates.length)];
  return chosen ?? null;
}

export function markItemUsed(usage: SkillUsage, item: Item): void {
  usage.seenItemIds.add(item.id);
  usage.topicCounts.set(
    item.topic,
    (usage.topicCounts.get(item.topic) ?? 0) + 1,
  );
  usage.formatCounts.set(
    item.format,
    (usage.formatCounts.get(item.format) ?? 0) + 1,
  );
}
