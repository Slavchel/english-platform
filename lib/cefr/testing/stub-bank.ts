import { CEFR_LEVELS, SKILLS } from "../levels";
import { DEFAULT_ENGINE_CONFIG } from "../config";
import type { Item } from "../types";
import { InMemoryItemPool } from "../item-pool";
import { CefrTestEngine } from "../engine";

/**
 * ТЕХНИЧЕСКИЕ ЗАГЛУШКИ, А НЕ КОНТЕНТ.
 *
 * Нужны только для проверки движка: реальных вопросов, предложений и
 * осмысленных вариантов ответа здесь нет. После появления настоящего банка
 * этот модуль не должен использоваться в продакшене.
 */

const DIFFICULTY_OFFSETS = [
  -0.6, -0.45, -0.3, -0.15, 0, 0.15, 0.3, 0.45, 0.6, 0.75,
];

const TOPICS = ["stub-topic-a", "stub-topic-b", "stub-topic-c"];
const FORMATS = ["stub-format-a", "stub-format-b", "stub-format-c"];
const OPTION_IDS = ["a", "b", "c", "d"] as const;

export const STUB_ITEMS_PER_LEVEL = DIFFICULTY_OFFSETS.length;

export function createStubItemBank(): Item[] {
  const items: Item[] = [];

  for (const skill of SKILLS) {
    for (const level of CEFR_LEVELS) {
      const anchor = DEFAULT_ENGINE_CONFIG.levelDifficultyAnchor[level];

      for (let index = 0; index < DIFFICULTY_OFFSETS.length; index += 1) {
        items.push({
          id: `stub-${skill}-${level.toLowerCase()}-${index + 1}`,
          skill,
          cefrLevel: level,
          difficulty: Number(
            (anchor + DIFFICULTY_OFFSETS[index]).toFixed(2),
          ),
          topic: TOPICS[index % TOPICS.length],
          format: FORMATS[index % FORMATS.length],
          stem: `[stub] ${skill} · ${level} · item ${index + 1}`,
          options: OPTION_IDS.map((id) => ({
            id,
            text: `Stub option ${id.toUpperCase()}`,
          })),
          correctOptionId: OPTION_IDS[index % OPTION_IDS.length],
          explanation: "Техническая заглушка для проверки движка.",
        });
      }
    }
  }

  return items;
}

export function createStubItemPool(): InMemoryItemPool {
  return new InMemoryItemPool(createStubItemBank());
}

export function createStubEngine(seed = 42): CefrTestEngine {
  return new CefrTestEngine({ bank: createStubItemPool(), seed });
}
