import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { trialBank } from "../lib/cefr/bank/trial-bank";
import { isVocabularyEntry } from "../lib/cefr/vocabulary/dictionary";

interface RawOption {
  id: string;
  text: string;
}

interface RawQuestion {
  id: string;
  skill: string;
  cefrLevel: string;
  passageId?: string;
  stem: string;
  format: string;
  topic: string;
  options: RawOption[];
  correctOptionId: string;
  explanation?: string;
  difficulty?: number;
  lexicalRef?: {
    word: string;
    level: string;
    partOfSpeech: string;
    translation: string;
  };
}

interface RawPassage {
  id: string;
  cefrLevel: string;
  text: string;
  wordCount: number;
}

const readJson = <T>(path: string): T =>
  JSON.parse(readFileSync(join(process.cwd(), path), "utf8")) as T;

const grammar = readJson<RawQuestion[]>(
  "data/archive/unused-bank-files/new/grammar_questions_additional.json",
);
const vocabulary = readJson<RawQuestion[]>(
  "data/archive/unused-bank-files/new/vocabulary_questions_additional.json",
);
const reading = readJson<RawQuestion[]>(
  "data/archive/unused-bank-files/generated/reading_questions_additional.json",
);
const passages = readJson<RawPassage[]>(
  "data/archive/unused-bank-files/generated/reading_passages_additional.json",
);

function assertValidQuestions(
  label: string,
  items: RawQuestion[],
  passageIds?: ReadonlySet<string>,
) {
  const ids = new Set<string>();
  for (const item of items) {
    assert.ok(item.id, `${label}: пустой id`);
    assert.ok(!ids.has(item.id), `${label}: дубль ${item.id}`);
    ids.add(item.id);
    assert.ok(item.stem?.trim(), `${label}: ${item.id} без stem`);
    assert.ok(item.explanation?.trim(), `${label}: ${item.id} без explanation`);
    assert.ok(item.options.length >= 2, `${label}: ${item.id} options`);
    assert.ok(
      item.options.some((option) => option.id === item.correctOptionId),
      `${label}: ${item.id} correctOptionId`,
    );
    if (passageIds) {
      assert.ok(
        item.passageId && passageIds.has(item.passageId),
        `${label}: ${item.id} passageId`,
      );
    }
  }
}

test("новые Grammar и Vocabulary: структура и объём", () => {
  assert.equal(grammar.length, 140);
  assert.equal(vocabulary.length, 140);
  assertValidQuestions("grammar", grammar);
  assertValidQuestions("vocabulary", vocabulary);

  for (const item of grammar) {
    assert.ok(Number.isFinite(item.difficulty), `${item.id}: difficulty`);
  }
  for (const item of vocabulary) {
    assert.ok(item.lexicalRef, `${item.id}: lexicalRef`);
  }
});

test("новые Reading: 35 текстов, 175 вопросов, связи и wordCount", () => {
  assert.equal(passages.length, 35);
  assert.equal(reading.length, 175);
  const passageIds = new Set(passages.map((passage) => passage.id));
  assertValidQuestions("reading", reading, passageIds);

  for (const passage of passages) {
    assert.equal(
      passage.wordCount,
      passage.text.trim().split(/\s+/).length,
      `${passage.id}: wordCount`,
    );
  }
});

test("Vocabulary новых заданий совпадает с семью словарями", () => {
  const files: Record<string, string> = {
    "PRE-A1": "pre_a1_vocabulary.json",
    A1: "a1_vocabulary.json",
    A2: "a2_vocabulary.json",
    B1: "b1_vocabulary.json",
    B2: "b2_vocabulary.json",
    C1: "c1_vocabulary.json",
    C2: "c2_vocabulary.json",
  };
  const dictionary = Object.fromEntries(
    Object.entries(files).map(([level, file]) => [
      level,
      readJson<unknown[]>(`data/vocabulary/${file}`).filter(
        isVocabularyEntry,
      ),
    ]),
  );

  for (const item of vocabulary) {
    const reference = item.lexicalRef;
    assert.ok(reference, `${item.id}: lexicalRef`);
    const entries = dictionary[reference.level];
    assert.ok(entries, `${item.id}: уровень ${reference.level}`);
    const entry = entries.find(
      (candidate) =>
        candidate.word.toLowerCase() === reference.word.toLowerCase(),
    );
    assert.ok(entry, `${item.id}: ${reference.word} нет в словаре`);
    assert.equal(entry.translation, reference.translation);
    assert.equal(entry.part_of_speech, reference.partOfSpeech);
  }
});

test("объединённый банк содержит новые задания и не содержит дублей ID", () => {
  assert.equal(trialBank.items.length, 524);
  assert.equal(trialBank.version, "draft-4.0");

  const grammarCount = trialBank.items.filter(
    (item) => item.skill === "grammar",
  ).length;
  const vocabularyCount = trialBank.items.filter(
    (item) => item.skill === "vocabulary",
  ).length;
  const readingCount = trialBank.items.filter(
    (item) => item.skill === "reading",
  ).length;

  assert.equal(grammarCount, 174);
  assert.equal(vocabularyCount, 175);
  assert.equal(readingCount, 175);
  assert.equal(
    new Set(trialBank.items.map((item) => item.id)).size,
    trialBank.items.length,
  );
  assert.ok(!trialBank.items.some((item) => item.id === "grammar-pre-a1-0013"));
  assert.ok(
    trialBank.items.some((item) => item.id === "reading-a1-0001"),
  );
});
