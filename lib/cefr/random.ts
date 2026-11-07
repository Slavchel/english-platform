/**
 * Детерминированный генератор случайных чисел.
 * Один и тот же seed всегда даёт одну и ту же последовательность — это нужно
 * для воспроизводимости вариантов теста.
 */

export type RandomSource = () => number;

export function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function mulberry32(seed: number): RandomSource {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** Отдельный поток случайности на каждый навык — навыки не влияют друг на друга. */
export function deriveSeed(seed: number, label: string): number {
  return (seed ^ hashString(label)) >>> 0;
}

export function randomIndex(rng: RandomSource, length: number): number {
  if (length <= 0) return -1;
  return Math.min(length - 1, Math.floor(rng() * length));
}
