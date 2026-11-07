import test from "node:test";
import assert from "node:assert/strict";

import { trialBank } from "../lib/cefr/bank/trial-bank";

const reading = trialBank.items.filter(
  (item) => item.skill === "reading",
);
const passages = trialBank.passages;

function findQuestion(id: string) {
  const item = reading.find((entry) => entry.id === id);
  assert.ok(item, `нет вопроса ${id}`);
  return item;
}

test("активный Reading: 175 вопросов, 35 текстов, по 5 вопросов", () => {
  assert.equal(reading.length, 175);
  assert.equal(passages.length, 35);

  const byPassage = new Map<string, number>();
  for (const item of reading) {
    assert.ok(item.passageId, `${item.id}: нет passageId`);
    assert.ok(
      trialBank.passageById.has(item.passageId),
      `${item.id}: текст ${item.passageId} отсутствует`,
    );
    byPassage.set(
      item.passageId,
      (byPassage.get(item.passageId) ?? 0) + 1,
    );
  }

  assert.equal(byPassage.size, 35);
  for (const count of byPassage.values()) {
    assert.equal(count, 5);
  }
});

test("активный Reading: структурная целостность и русские объяснения", () => {
  for (const item of reading) {
    assert.ok(item.stem.trim(), `${item.id}: пустой вопрос`);
    assert.ok(item.options.length >= 2, `${item.id}: варианты`);
    assert.ok(
      item.options.some((option) => option.id === item.correctOptionId),
      `${item.id}: correctOptionId отсутствует`,
    );
    assert.equal(
      new Set(item.options.map((option) => option.text)).size,
      item.options.length,
      `${item.id}: одинаковые варианты ответа`,
    );
    assert.ok(
      /[А-Яа-яЁё]/.test(item.explanation ?? ""),
      `${item.id}: explanation не на русском`,
    );
  }
});

test("вопрос про последнее действие Бена однозначен", () => {
  const ben = findQuestion("reading-a1-0004");
  assert.match(ben.stem, /last thing/i);
  const correct = ben.options.find(
    (option) => option.id === ben.correctOptionId,
  );
  assert.ok(correct);
  assert.match(correct.text, /reads a book/i);
  assert.match(ben.stemRu ?? "", /последн/i);
  assert.match(ben.explanation ?? "", /Последнее действие/i);
});

test("в тексте присутствуют слова, о значении которых спрашивают", () => {
  for (const item of reading) {
    if (
      !["vocabulary-in-context", "reference"].includes(item.topic)
    ) {
      continue;
    }

    const passage = item.passageId
      ? trialBank.passageById.get(item.passageId)
      : undefined;
    assert.ok(passage, `${item.id}: нет текста`);

    const quoted = [
      ...item.stem.matchAll(/['"«]([^'"»]{2,80})['"»]/g),
    ].map((match) => match[1].toLowerCase());
    if (quoted.length === 0) continue;

    for (const phrase of quoted) {
      assert.ok(
        passage.text.toLowerCase().includes(phrase),
        `${item.id}: «${phrase}» нет в тексте`,
      );
    }
  }
});

test("все низкоуровневые Reading-вопросы имеют русскую формулировку", () => {
  for (const item of reading.filter((entry) =>
    ["PRE-A1", "A1", "A2"].includes(entry.cefrLevel),
  )) {
    assert.ok(item.stemRu, `${item.id}: нет stemRu`);
  }
});
