import test from "node:test";
import assert from "node:assert/strict";

import { CefrTestEngine } from "../lib/cefr/engine";
import { createTrialItemPool } from "../lib/cefr/bank/trial-bank";
import { CEFR_LEVELS, levelIndex } from "../lib/cefr/levels";
import type { Item } from "../lib/cefr/types";

function answer(engine: CefrTestEngine, correct: boolean): Item {
  const item = engine.currentItem;
  assert.ok(item);
  const wrong = item.options.find(
    (option) => option.id !== item.correctOptionId,
  );
  assert.ok(wrong);
  engine.submitAnswer(correct ? item.correctOptionId : wrong.id);
  return item;
}

function grammarPattern(pattern: boolean[]) {
  const engine = new CefrTestEngine({
    bank: createTrialItemPool(),
    seed: 321,
  });
  let grammarIndex = 0;

  while (!engine.isFinished) {
    const item = engine.currentItem;
    assert.ok(item);
    const correct =
      item.skill === "grammar"
        ? (pattern[grammarIndex++] ?? true)
        : true;
    answer(engine, correct);
  }

  return engine.getResult().skills.grammar;
}

test("Grammar: ошибка, верно, ошибка, затем всё верно — возврат выше A1", () => {
  const result = grammarPattern([
    false,
    true,
    false,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
  ]);

  assert.equal(result.level, "B1");
  assert.equal(result.status, "confirmed");
});

test("Grammar: все ответы верные — C2 достижим за 10 вопросов", () => {
  const result = grammarPattern(Array.from({ length: 10 }, () => true));
  assert.equal(result.level, "C2");
});

test("Grammar: все ответы неверные — уровень не подтверждён", () => {
  const result = grammarPattern(Array.from({ length: 10 }, () => false));
  assert.equal(result.level, null);
  assert.equal(result.status, "insufficient");
  assert.equal(result.confidence, "low");
});

test("Grammar: чередование не даёт высокого уровня", () => {
  const result = grammarPattern([
    true,
    false,
    true,
    false,
    true,
    false,
    true,
    false,
    true,
    false,
  ]);
  assert.ok(
    result.level === null || result.level === "A1" || result.level === "A2",
  );
});

test("каждый уровень Pre-A1–C2 достижим за 10 вопросов", () => {
  for (const target of CEFR_LEVELS) {
    const engine = new CefrTestEngine({
      bank: createTrialItemPool(),
      seed: 2027,
    });

    while (!engine.isFinished) {
      const item = engine.currentItem;
      assert.ok(item);
      const correct =
        levelIndex(item.cefrLevel) <= levelIndex(target);
      const wrong = item.options.find(
        (option) => option.id !== item.correctOptionId,
      );
      assert.ok(wrong);
      engine.submitAnswer(
        correct ? item.correctOptionId : wrong.id,
      );
    }

    const result = engine.getResult();
    assert.equal(
      result.skills.grammar.level,
      target,
      `Grammar для способности ${target}`,
    );
  }
});
