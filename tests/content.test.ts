import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { validateItemBank } from "../lib/cefr/item-pool";
import { SKILLS, type Skill } from "../lib/cefr/levels";
import type { Item, ReadingPassage } from "../lib/cefr/types";
import {
  isVocabularyEntry,
} from "../lib/cefr/vocabulary/dictionary";

function readJson<T>(relativePath: string): T {
  return JSON.parse(
    readFileSync(join(process.cwd(), relativePath), "utf8"),
  ) as T;
}

const grammar = readJson<Item[]>(
  "data/archive/unused-bank-files/questions/a1_grammar.json",
);
const vocabulary = readJson<Item[]>(
  "data/archive/unused-bank-files/questions/a1_vocabulary.json",
);
const reading = readJson<Item[]>(
  "data/archive/unused-bank-files/questions/a1_reading.json",
);
const passages = readJson<ReadingPassage[]>(
  "data/archive/unused-bank-files/passages/a1_reading.json",
);

const a1Entries = readJson<unknown[]>(
  "data/vocabulary/a1_vocabulary.json",
).filter(isVocabularyEntry);
const preA1Entries = readJson<unknown[]>(
  "data/vocabulary/pre_a1_vocabulary.json",
).filter(isVocabularyEntry);

const allItems = [...grammar, ...vocabulary, ...reading];

const IRREGULAR_FORMS: Record<string, string> = {
  is: "be",
  are: "be",
  am: "be",
  has: "have",
  does: "do",
  went: "go",
  gone: "go",
};

function isKnownWord(word: string, dictionary: Set<string>): boolean {
  const token = word.toLowerCase();
  if (dictionary.has(token)) return true;

  const irregular = IRREGULAR_FORMS[token];
  if (irregular && dictionary.has(irregular)) return true;

  const candidates = new Set<string>();
  if (token.endsWith("ies")) candidates.add(`${token.slice(0, -3)}y`);
  if (token.endsWith("es")) candidates.add(token.slice(0, -2));
  if (token.endsWith("s")) candidates.add(token.slice(0, -1));
  if (token.endsWith("ed")) {
    candidates.add(token.slice(0, -2));
    candidates.add(token.slice(0, -1));
  }
  if (token.endsWith("ing")) {
    candidates.add(token.slice(0, -3));
    candidates.add(`${token.slice(0, -3)}e`);
  }

  return [...candidates].some((candidate) => dictionary.has(candidate));
}

test("пробная партия: 6 заданий, по 2 на навык, все A1", () => {
  assert.equal(allItems.length, 6);

  const perSkill = new Map<Skill, number>();
  for (const item of allItems) {
    perSkill.set(item.skill, (perSkill.get(item.skill) ?? 0) + 1);
    assert.equal(item.cefrLevel, "A1");
    assert.equal(item.options.length, 4);
    assert.ok(item.explanation && item.explanation.trim().length > 0);
  }

  for (const skill of SKILLS) {
    assert.equal(perSkill.get(skill), 2);
  }

  const ids = allItems.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);

  assert.deepEqual(validateItemBank(allItems), []);
});

test("Reading: текст хранится отдельно, вопросы ссылаются на passageId", () => {
  assert.equal(passages.length, 1);
  const passage = passages[0];

  assert.equal(passage.cefrLevel, "A1");
  assert.ok(passage.text.trim().length > 0);

  const wordCount = passage.text.trim().split(/\s+/).length;
  assert.equal(passage.wordCount, wordCount);

  for (const item of reading) {
    assert.equal(item.passageId, passage.id);
    assert.ok(item.difficulty <= 0);
  }
});

test("Vocabulary использует только проверенные записи из a1_vocabulary.json", () => {
  for (const item of vocabulary) {
    const reference = item.lexicalRef;
    assert.ok(reference, `${item.id}: нет lexicalRef`);

    const entry = a1Entries.find(
      (candidate) =>
        candidate.word.toLowerCase() === reference.word.toLowerCase(),
    );
    assert.ok(entry, `${item.id}: слово не найдено в A1-словаре`);

    assert.equal(reference.level, "A1");
    assert.equal(entry.level, "A1");
    assert.equal(reference.partOfSpeech, entry.part_of_speech);
    assert.equal(reference.category, entry.category);
    assert.equal(reference.translation, entry.translation);

    if (item.format === "mcq-translation") {
      for (const option of item.options) {
        assert.ok(
          a1Entries.some(
            (candidate) => candidate.translation === option.text,
          ),
          `${item.id}: перевод "${option.text}" отсутствует в A1-словаре`,
        );
      }
    } else {
      for (const option of item.options) {
        assert.ok(
          a1Entries.some(
            (candidate) =>
              candidate.word.toLowerCase() === option.text.toLowerCase(),
          ),
          `${item.id}: слово "${option.text}" отсутствует в A1-словаре`,
        );
      }
    }
  }
});

test("текст Reading состоит из слов Pre-A1/A1", () => {
  const dictionary = new Set(
    [...preA1Entries, ...a1Entries].map((entry) =>
      entry.word.toLowerCase(),
    ),
  );

  const tokens = passages[0].text
    .replace(/[.,!?;:"]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  for (const raw of tokens) {
    const token = raw.replace(/['’]s$/i, "");
    assert.ok(
      isKnownWord(token, dictionary),
      `Слово "${token}" отсутствует в словарях Pre-A1/A1`,
    );
  }
});
