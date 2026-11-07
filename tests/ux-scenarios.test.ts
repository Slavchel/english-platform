import test from "node:test";
import assert from "node:assert/strict";

import { CefrTestEngine } from "../lib/cefr/engine";
import {
  createTrialItemPool,
  trialBank,
} from "../lib/cefr/bank/trial-bank";
import { SKILLS } from "../lib/cefr/levels";
import type { Item } from "../lib/cefr/types";
import {
  displayStem,
  isRussianInterface,
} from "../lib/cefr/ui/presentation";

function chooseWrong(item: Item): string {
  const option = item.options.find(
    (candidate) => candidate.id !== item.correctOptionId,
  );
  if (!option) throw new Error(`У задания ${item.id} нет неверного варианта.`);
  return option.id;
}

function answer(engine: CefrTestEngine, correct: boolean): Item {
  const item = engine.currentItem;
  assert.ok(item);
  const optionId = correct ? item.correctOptionId : chooseWrong(item);
  engine.submitAnswer(optionId);
  return item;
}

test("Reading идёт группами по 2 вопроса к одному тексту, 5 текстов", () => {
  const engine = new CefrTestEngine({
    bank: createTrialItemPool(),
    seed: 777,
  });
  const groups: {
    passageId: string;
    number: number;
    index: number;
    size: number;
  }[] = [];

  while (!engine.isFinished) {
    const item = engine.currentItem;
    assert.ok(item);
    if (item.skill === "reading") {
      const group = engine.readingGroup;
      assert.ok(group);
      assert.equal(group.passageId, item.passageId);
      groups.push({ ...group });
    }
    answer(engine, false);
  }

  assert.equal(groups.length, 10);
  assert.equal(new Set(groups.map((group) => group.passageId)).size, 5);
  for (let number = 1; number <= 5; number += 1) {
    const group = groups.filter((entry) => entry.number === number);
    assert.equal(group.length, 2);
    assert.deepEqual(
      group.map((entry) => entry.index),
      [1, 2],
    );
    assert.equal(group[0].size, 2);
    assert.equal(group[0].passageId, group[1].passageId);
  }

  const result = engine.getResult();
  assert.equal(result.completed, true);
  assert.equal(result.review.length, 30);
  assert.equal(result.stats.bySkill.reading.answered, 10);
});

test("досрочное завершение после 6 ответов: статистика, разбор, низкие данные", () => {
  const engine = new CefrTestEngine({
    bank: createTrialItemPool(),
    seed: 31,
  });

  for (let index = 0; index < 6; index += 1) {
    answer(engine, true);
  }
  assert.equal(engine.answeredCount, 6);

  const result = engine.finishEarly();

  assert.equal(result.completed, false);
  assert.equal(result.answered, 6);
  assert.equal(result.unanswered, 24);
  assert.equal(result.stats.correct, 6);
  assert.equal(result.stats.incorrect, 0);
  assert.equal(result.stats.unanswered, 24);
  assert.equal(result.review.length, 6);
  assert.ok(result.review.every((entry) => entry.correct));

  assert.equal(result.stats.bySkill.grammar.answered, 6);
  assert.equal(result.stats.bySkill.vocabulary.answered, 0);
  assert.equal(result.stats.bySkill.reading.answered, 0);
  assert.equal(result.stats.bySkill.vocabulary.unanswered, 10);

  assert.equal(result.overall.level, null);
  assert.equal(result.overall.status, "insufficient");
  assert.equal(result.overall.confidence, "low");
  assert.notEqual(result.skills.grammar.confidence, "high");
});

test("неотвеченные вопросы не считаются ошибками", () => {
  const engine = new CefrTestEngine({
    bank: createTrialItemPool(),
    seed: 44,
  });

  for (let index = 0; index < 4; index += 1) {
    answer(engine, index < 2);
  }

  const result = engine.finishEarly();

  assert.equal(result.stats.answered, 4);
  assert.equal(result.stats.correct, 2);
  assert.equal(result.stats.incorrect, 2);
  assert.equal(result.stats.unanswered, 26);
  assert.equal(result.review.length, 4);
  assert.equal(
    result.review.filter((entry) => entry.correct).length,
    2,
  );
  assert.equal(
    result.review.filter((entry) => !entry.correct).length,
    2,
  );
});

test("досрочное завершение без ответов даёт пустой, но корректный результат", () => {
  const engine = new CefrTestEngine({
    bank: createTrialItemPool(),
    seed: 9,
  });

  const result = engine.finishEarly();

  assert.equal(result.answered, 0);
  assert.equal(result.unanswered, 30);
  assert.equal(result.review.length, 0);
  assert.equal(result.stats.correct, 0);
  assert.equal(result.stats.incorrect, 0);
  assert.equal(result.overall.level, null);
  assert.equal(result.overall.status, "insufficient");
  for (const skill of SKILLS) {
    assert.equal(result.skills[skill].level, null);
    assert.equal(result.skills[skill].evidence.items, 0);
  }
});

test("полный тест сохраняет статистику и разбор", () => {
  const engine = new CefrTestEngine({
    bank: createTrialItemPool(),
    seed: 2026,
  });

  let expectedCorrect = 0;
  for (let index = 0; index < 30; index += 1) {
    const correct = index % 3 !== 0;
    if (correct) expectedCorrect += 1;
    answer(engine, correct);
  }

  const result = engine.getResult();
  assert.equal(result.completed, true);
  assert.equal(result.answered, 30);
  assert.equal(result.unanswered, 0);
  assert.equal(result.stats.correct, expectedCorrect);
  assert.equal(result.stats.incorrect, 30 - expectedCorrect);
  assert.equal(result.review.length, 30);

  for (const skill of SKILLS) {
    const stats = result.stats.bySkill[skill];
    assert.equal(stats.answered, 10);
    assert.equal(stats.correct + stats.incorrect, 10);
    assert.equal(stats.unanswered, 0);
  }

  const reviewItem = result.review[0];
  const selected = reviewItem.item.options.find(
    (option) => option.id === reviewItem.selectedOptionId,
  );
  const correct = reviewItem.item.options.find(
    (option) => option.id === reviewItem.item.correctOptionId,
  );
  assert.ok(selected);
  assert.ok(correct);
  assert.ok(reviewItem.item.explanation);
});

test("Reading с двумя вопросами к одному тексту не даёт высокой уверенности", () => {
  const engine = new CefrTestEngine({
    bank: createTrialItemPool(),
    seed: 55,
  });

  // Grammar и Vocabulary — по 10, затем два вопроса Reading.
  for (let index = 0; index < 20; index += 1) {
    answer(engine, true);
  }
  answer(engine, true);
  answer(engine, true);

  const result = engine.finishEarly();
  assert.equal(result.stats.bySkill.reading.answered, 2);
  assert.notEqual(result.skills.reading.confidence, "high");
  assert.equal(result.overall.level, null);
  assert.equal(result.overall.status, "insufficient");
});

test("полный Reading не занижает уверенность из-за последнего текста", () => {
  const engine = new CefrTestEngine({
    bank: createTrialItemPool(),
    seed: 56,
  });

  while (!engine.isFinished) {
    answer(engine, true);
  }

  const result = engine.getResult();
  assert.equal(result.stats.bySkill.reading.answered, 10);
  assert.notEqual(result.skills.reading.confidence, "low");
});

test("русские формулировки покрывают все Reading до A2 и инструкции", () => {
  const lowReading = trialBank.items.filter(
    (item) =>
      item.skill === "reading" &&
      isRussianInterface(item.cefrLevel),
  );
  assert.ok(lowReading.length > 0);
  for (const item of lowReading) {
    assert.ok(
      item.stemRu,
      `${item.id}: нет русской формулировки`,
    );
    assert.match(displayStem(item), /[А-Яа-яЁё]/);
  }

  const b1Reading = trialBank.items.find(
    (item) => item.skill === "reading" && item.cefrLevel === "B1",
  );
  assert.ok(b1Reading);
  assert.equal(displayStem(b1Reading), b1Reading.stem);
  assert.equal(isRussianInterface(b1Reading.cefrLevel), false);

  const chooseItems = trialBank.items.filter(
    (item) =>
      item.stem.startsWith("Choose") &&
      isRussianInterface(item.cefrLevel),
  );
  assert.ok(chooseItems.length > 0);
  for (const item of chooseItems) {
    assert.ok(item.stemRu, `${item.id}: английская инструкция без перевода`);
  }
});
