import test from "node:test";
import assert from "node:assert/strict";

import { CefrTestEngine } from "../lib/cefr/engine";
import {
  createTrialItemPool,
  trialBank,
} from "../lib/cefr/bank/trial-bank";
import { SKILLS, type Skill } from "../lib/cefr/levels";
import type { Item } from "../lib/cefr/types";
import {
  instructionFor,
  progressPercent,
} from "../lib/cefr/ui/presentation";

function chooseWrong(item: Item): string {
  const option = item.options.find(
    (candidate) => candidate.id !== item.correctOptionId,
  );
  if (!option) throw new Error(`У задания ${item.id} нет неверного варианта.`);
  return option.id;
}

function play(
  decide: (item: Item) => string,
): { engine: CefrTestEngine; items: Item[]; progress: number[] } {
  const engine = new CefrTestEngine({
    bank: createTrialItemPool(),
    seed: 2026,
  });
  const items: Item[] = [];
  const progress: number[] = [engine.answeredCount];

  while (!engine.isFinished) {
    const item = engine.currentItem;
    assert.ok(item);
    items.push(item);
    engine.submitAnswer(decide(item));
    progress.push(engine.answeredCount);
  }

  return { engine, items, progress };
}

test("черновой банк нормализован под типы движка", () => {
  assert.equal(trialBank.items.length, 524);
  assert.equal(trialBank.passages.length, 35);
  assert.equal(trialBank.version, "draft-4.0");

  const perSkill = new Map<Skill, number>();
  for (const item of trialBank.items) {
    perSkill.set(item.skill, (perSkill.get(item.skill) ?? 0) + 1);
    assert.ok(item.cefrLevel);
    assert.ok(Number.isFinite(item.difficulty));
    assert.equal(item.options.length, 4);
  }

  assert.equal(perSkill.get("grammar"), 174);
  assert.equal(perSkill.get("vocabulary"), 175);
  assert.equal(perSkill.get("reading"), 175);

  for (const item of trialBank.items) {
    if (item.skill === "reading") {
      assert.ok(item.passageId);
      assert.ok(trialBank.passageById.has(item.passageId));
    }
  }

  for (const passage of trialBank.passages) {
    assert.ok(passage.text.length > 0);
    assert.equal(
      passage.wordCount,
      passage.text.trim().split(/\s+/).length,
    );
  }
});

test("черновой банк позволяет пройти ровно 30 вопросов даже при полном провале", () => {
  const { engine, items, progress } = play(chooseWrong);

  assert.equal(items.length, 30);
  assert.equal(new Set(items.map((item) => item.id)).size, 30);
  assert.equal(progress[0], 0);
  assert.deepEqual(progress, Array.from({ length: 31 }, (_, i) => i));

  const result = engine.getResult();
  assert.equal(result.answered, 30);
  assert.equal(result.total, 30);
  for (const skill of SKILLS) {
    assert.equal(result.skills[skill].status, "insufficient");
    assert.equal(result.skills[skill].level, null);
  }
  assert.equal(result.overall.status, "insufficient");
  assert.equal(result.overall.level, null);
});

test("сильный ученик проходит банк и получает подтверждённые уровни", () => {
  const { engine, items } = play((item) => item.correctOptionId);

  assert.equal(items.length, 30);
  const result = engine.getResult();

  for (const skill of SKILLS) {
    assert.equal(result.skills[skill].status, "confirmed");
    assert.ok(result.skills[skill].level);
  }
  assert.ok(result.overall.level);
  assert.equal(result.overall.status, "confirmed");
});

test("прогресс считается по завершённым вопросам", () => {
  assert.equal(progressPercent(0, 30), 0);
  assert.equal(progressPercent(15, 30), 50);
  assert.equal(progressPercent(30, 30), 100);
  assert.equal(progressPercent(31, 30), 100);
  assert.equal(progressPercent(0, 0), 0);
});

test("язык инструкции переключается на A2/B1", () => {
  assert.match(
    instructionFor("reading", "mcq-reading", "A2"),
    /Прочитайте/,
  );
  assert.match(
    instructionFor("reading", "mcq-reading", "B1"),
    /Read the text/,
  );
  assert.match(
    instructionFor("grammar", "mcq-gap", "A1"),
    /Выберите/,
  );
  assert.match(
    instructionFor("vocabulary", "mcq-context", "C1"),
    /Choose/,
  );
});
