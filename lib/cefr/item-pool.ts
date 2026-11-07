import { isCefrLevel, isSkill, type CefrLevel, type Skill } from "./levels";
import type { Item } from "./types";

const EMPTY_BUCKET: readonly Item[] = [];

function bucketKey(skill: Skill, level: CefrLevel): string {
  return `${skill}:${level}`;
}

/**
 * Абстракция банка заданий. Движок не знает, откуда берутся задания:
 * сейчас это in-memory набор, позже — JSON-файлы или сервер.
 */
export interface ItemPool {
  getItems(skill: Skill, level: CefrLevel): readonly Item[];
  getItem(id: string): Item | undefined;
}

export class InMemoryItemPool implements ItemPool {
  private readonly byId = new Map<string, Item>();
  private readonly byBucket = new Map<string, readonly Item[]>();

  constructor(items: readonly Item[]) {
    const errors = validateItemBank(items);
    if (errors.length > 0) {
      throw new Error(`Некорректный банк заданий:\n${errors.join("\n")}`);
    }

    const buckets = new Map<string, Item[]>();
    for (const item of items) {
      this.byId.set(item.id, item);
      const key = bucketKey(item.skill, item.cefrLevel);
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.push(item);
      } else {
        buckets.set(key, [item]);
      }
    }

    for (const [key, bucket] of buckets) {
      this.byBucket.set(key, Object.freeze([...bucket]));
    }
  }

  getItems(skill: Skill, level: CefrLevel): readonly Item[] {
    return this.byBucket.get(bucketKey(skill, level)) ?? EMPTY_BUCKET;
  }

  getItem(id: string): Item | undefined {
    return this.byId.get(id);
  }

  get size(): number {
    return this.byId.size;
  }
}

/** Минимальная проверка целостности банка перед запуском теста. */
export function validateItemBank(items: readonly Item[]): string[] {
  const errors: string[] = [];
  const seenIds = new Set<string>();

  items.forEach((item, index) => {
    const label = `#${index}`;

    if (!item.id) {
      errors.push(`${label}: пустой id задания.`);
    } else if (seenIds.has(item.id)) {
      errors.push(`${label}: дублирующийся id "${item.id}".`);
    } else {
      seenIds.add(item.id);
    }

    if (!isSkill(item.skill)) {
      errors.push(`${label}: неизвестный навык "${String(item.skill)}".`);
    }
    if (!isCefrLevel(item.cefrLevel)) {
      errors.push(`${label}: неизвестный уровень "${String(item.cefrLevel)}".`);
    }
    if (!Number.isFinite(item.difficulty)) {
      errors.push(`${label}: difficulty должно быть числом.`);
    }
    if (!item.stem || item.stem.trim().length === 0) {
      errors.push(`${label}: пустой текст задания.`);
    }
    if (!Array.isArray(item.options) || item.options.length < 2) {
      errors.push(`${label}: нужно минимум два варианта ответа.`);
      return;
    }

    const optionIds = new Set<string>();
    for (const option of item.options) {
      if (!option.id) {
        errors.push(`${label}: пустой id варианта ответа.`);
      } else if (optionIds.has(option.id)) {
        errors.push(`${label}: дублирующийся вариант ответа "${option.id}".`);
      } else {
        optionIds.add(option.id);
      }
    }
    if (!optionIds.has(item.correctOptionId)) {
      errors.push(
        `${label}: correctOptionId "${item.correctOptionId}" отсутствует среди вариантов.`,
      );
    }
  });

  return errors;
}
