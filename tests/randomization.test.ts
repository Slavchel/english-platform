import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { CefrTestEngine } from "../lib/cefr/engine";
import { createTrialItemPool, trialBank } from "../lib/cefr/bank/trial-bank";
import type { Item } from "../lib/cefr/types";

const readJson = <T>(path: string): T =>
  JSON.parse(readFileSync(join(process.cwd(), path), "utf8")) as T;

const oldIds = new Set([
  ...readJson<{ id: string }[]>(
    "data/archive/unused-bank-files/questions/grammar_questions.json",
  ).map((item) => item.id),
  ...readJson<{ id: string }[]>(
    "data/archive/unused-bank-files/questions/vocabulary_questions.json",
  ).map((item) => item.id),
  ...readJson<{ id: string }[]>(
    "data/archive/unused-bank-files/questions/reading_questions — копия.json",
  ).map((item) => item.id),
]);

function run(seed: number): string[] {
  const engine = new CefrTestEngine({
    bank: createTrialItemPool(),
    seed,
  });
  const ids: string[] = [];
  while (!engine.isFinished) {
    const item = engine.currentItem;
    assert.ok(item);
    ids.push(item.id);
    const wrong = item.options.find(
      (option) => option.id !== item.correctOptionId,
    );
    assert.ok(wrong);
    engine.submitAnswer(wrong.id);
  }
  return ids;
}

test("разные seed дают разные последовательности без повторов", () => {
  const sequences = Array.from({ length: 6 }, (_, index) =>
    run(index + 101),
  );

  for (const sequence of sequences) {
    assert.equal(sequence.length, 30);
    assert.equal(new Set(sequence).size, 30);
  }

  assert.ok(
    new Set(sequences.map((sequence) => sequence.join("|"))).size > 1,
    "последовательности не должны быть одинаковыми",
  );
});

test("новые задания реально участвуют в выдаче", () => {
  const sequences = Array.from({ length: 6 }, (_, index) =>
    run(index + 201),
  );
  const allIds = sequences.flat();
  const newIds = allIds.filter((id) => !oldIds.has(id));

  assert.ok(newIds.length > 0, "новые задания не выбираются");
  assert.ok(
    newIds.length > allIds.length / 3,
    "новые задания должны составлять заметную часть выдачи",
  );
});

test("обновлённый Reading подключён, объяснения на русском", () => {
  const reading = trialBank.items.filter(
    (item) => item.skill === "reading",
  );
  assert.equal(reading.length, 175);
  assert.ok(reading.some((item) => item.id === "reading-a1-0001"));

  for (const item of reading) {
    assert.ok(
      /[А-Яа-яЁё]/.test(item.explanation ?? ""),
      `${item.id}: explanation не переведён`,
    );
  }
});

test("в рамках уровня выбирается весь пул, а не top-k", () => {
  const levelItems = trialBank.items.filter(
    (item) =>
      item.skill === "grammar" && item.cefrLevel === "A1",
  );
  assert.ok(levelItems.length > 10);

  const seen = new Set<string>();
  for (let seed = 1; seed <= 30; seed += 1) {
    const engine = new CefrTestEngine({
      bank: createTrialItemPool(),
      seed,
    });
    const item: Item | null = engine.currentItem;
    assert.ok(item);
    seen.add(item.id);
  }

  assert.ok(
    seen.size >= Math.min(10, levelItems.length),
    "выбор застрял на подмножестве уровня",
  );
});
