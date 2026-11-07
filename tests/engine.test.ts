import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { CefrTestEngine } from "../lib/cefr/engine";
import { createStubItemPool } from "../lib/cefr/testing/stub-bank";
import {
  SKILLS,
  levelIndex,
  type CefrLevel,
  type Skill,
} from "../lib/cefr/levels";
import type { Confidence, Item } from "../lib/cefr/types";
import { DEFAULT_ENGINE_CONFIG } from "../lib/cefr/config";
import { aggregateOverallLevels } from "../lib/cefr/overall";
import {
  buildVocabularyIndex,
  buildVocabularyItemSeeds,
  isUsableForVocabularyItems,
  isVocabularyEntry,
} from "../lib/cefr/vocabulary/dictionary";

function chooseWrong(item: Item): string {
  const option = item.options.find(
    (candidate) => candidate.id !== item.correctOptionId,
  );
  if (!option) {
    throw new Error(`У задания ${item.id} нет неверного варианта.`);
  }
  return option.id;
}

function play(
  engine: CefrTestEngine,
  decide: (item: Item) => string,
): { items: Item[]; perSkill: Record<Skill, number> } {
  const items: Item[] = [];
  const perSkill: Record<Skill, number> = {
    grammar: 0,
    vocabulary: 0,
    reading: 0,
  };

  while (!engine.isFinished) {
    const item = engine.currentItem;
    assert.ok(item);
    items.push(item);
    perSkill[item.skill] += 1;
    engine.submitAnswer(decide(item));
  }

  return { items, perSkill };
}

function playAtLevel(maxLevel: CefrLevel) {
  const engine = new CefrTestEngine({
    bank: createStubItemPool(),
    seed: 101,
  });

  play(engine, (item) =>
    levelIndex(item.cefrLevel) <= levelIndex(maxLevel)
      ? item.correctOptionId
      : chooseWrong(item),
  );

  return engine.getResult();
}

test("тест всегда доходит до 30 вопросов без повторов", () => {
  const engine = new CefrTestEngine({
    bank: createStubItemPool(),
    seed: 2026,
  });

  const { items, perSkill } = play(engine, chooseWrong);

  assert.equal(items.length, 30);
  assert.equal(new Set(items.map((item) => item.id)).size, 30);
  for (const skill of SKILLS) {
    assert.equal(perSkill[skill], 10);
  }

  const result = engine.getResult();
  assert.equal(result.answered, 30);
  assert.equal(result.total, 30);
  assert.equal(result.seed, 2026);
});

test("без подтверждённого уровня Pre-A1 не присваивается", () => {
  const engine = new CefrTestEngine({
    bank: createStubItemPool(),
    seed: 303,
  });

  play(engine, chooseWrong);
  const result = engine.getResult();

  for (const skill of SKILLS) {
    assert.equal(result.skills[skill].level, null);
    assert.equal(result.skills[skill].status, "insufficient");
    assert.equal(result.skills[skill].confidence, "low");
    // Задания всё равно были: видно, сколько доказательств собрано.
    assert.equal(result.skills[skill].evidence.items, 10);
    assert.equal(result.skills[skill].evidence.correct, 0);
  }

  assert.equal(result.overall.level, null);
  assert.equal(result.overall.status, "insufficient");
  assert.equal(result.overall.confidence, "low");
});

test("начинающий получает подтверждённый Pre-A1", () => {
  const result = playAtLevel("Pre-A1");

  for (const skill of SKILLS) {
    assert.equal(result.skills[skill].level, "Pre-A1");
    assert.equal(result.skills[skill].status, "confirmed");
    assert.equal(result.skills[skill].confidence, "high");
  }

  assert.equal(result.overall.level, "Pre-A1");
  assert.equal(result.overall.confidence, "high");
});

test("средний ученик доходит до B1, но не выше", () => {
  const result = playAtLevel("B1");

  for (const skill of SKILLS) {
    assert.equal(result.skills[skill].level, "B1");
    assert.equal(result.skills[skill].status, "confirmed");
  }

  assert.equal(result.overall.level, "B1");
  assert.equal(result.overall.confidence, "high");
});

test("сильный профиль доходит до C2 за 10 вопросов", () => {
  const result = playAtLevel("C2");

  for (const skill of SKILLS) {
    assert.equal(result.skills[skill].level, "C2");
    assert.equal(result.skills[skill].status, "confirmed");
  }

  assert.equal(result.overall.level, "C2");
  assert.notEqual(result.overall.confidence, "low");
});

test("одинаковый seed и ответы дают одинаковый вариант", () => {
  const run = () => {
    const engine = new CefrTestEngine({
      bank: createStubItemPool(),
      seed: 4242,
    });
    const { items } = play(engine, (item) => item.options[0].id);
    return {
      ids: items.map((item) => item.id),
      result: engine.getResult(),
    };
  };

  assert.deepEqual(run(), run());
});

test("ответы по Grammar не влияют на вопросы Vocabulary", () => {
  const vocabularyIds = (grammarCorrect: boolean): string[] => {
    const engine = new CefrTestEngine({
      bank: createStubItemPool(),
      seed: 555,
    });
    const ids: string[] = [];

    while (!engine.isFinished) {
      const item = engine.currentItem;
      assert.ok(item);

      if (item.skill === "vocabulary") {
        ids.push(item.id);
      }

      const optionId =
        item.skill === "grammar" && grammarCorrect
          ? item.correctOptionId
          : item.skill === "grammar"
            ? chooseWrong(item)
            : item.options[0].id;

      engine.submitAnswer(optionId);
    }

    return ids;
  };

  const withStrongGrammar = vocabularyIds(true);
  assert.equal(withStrongGrammar.length, 10);
  assert.deepEqual(withStrongGrammar, vocabularyIds(false));
});

test("общий уровень не считается средним арифметическим", () => {
  const allHigh: Record<Skill, Confidence> = {
    grammar: "high",
    vocabulary: "high",
    reading: "high",
  };

  const uneven = aggregateOverallLevels(
    { grammar: "C1", vocabulary: "C1", reading: "A2" },
    allHigh,
    DEFAULT_ENGINE_CONFIG,
  );
  assert.equal(uneven.level, "B1");
  assert.equal(uneven.components.median, "C1");
  assert.equal(uneven.components.weakest, "A2");
  assert.equal(uneven.components.cap, "B1");
  assert.equal(uneven.confidence, "low");

  const boundary = aggregateOverallLevels(
    { grammar: "B2", vocabulary: "B1", reading: "A2" },
    allHigh,
    DEFAULT_ENGINE_CONFIG,
  );
  assert.equal(boundary.level, "B1");
  assert.equal(boundary.confidence, "medium");

  const consensus = aggregateOverallLevels(
    { grammar: "B1", vocabulary: "B1", reading: "B1" },
    allHigh,
    DEFAULT_ENGINE_CONFIG,
  );
  assert.equal(consensus.level, "B1");
  assert.equal(consensus.confidence, "high");

  const missing = aggregateOverallLevels(
    { grammar: "B1", vocabulary: null, reading: "B1" },
    allHigh,
    DEFAULT_ENGINE_CONFIG,
  );
  assert.equal(missing.level, null);
  assert.equal(missing.status, "insufficient");
});

test("словари индексируются и дают заготовки Vocabulary-заданий", () => {
  const path = join(
    process.cwd(),
    "data",
    "vocabulary",
    "pre_a1_vocabulary.json",
  );
  const raw = JSON.parse(readFileSync(path, "utf8")) as unknown[];
  const entries = raw.filter(isVocabularyEntry);

  assert.equal(entries.length, raw.length);
  assert.ok(entries.length > 0);

  const index = buildVocabularyIndex(entries);
  assert.equal(index.byLevel.get("Pre-A1")?.length, entries.length);

  const seeds = buildVocabularyItemSeeds(index, {
    levels: ["Pre-A1"],
    distractors: 3,
  });
  assert.ok(seeds.length > 0);

  const seed = seeds[0];
  assert.equal(seed.distractorTranslations.length, 3);
  assert.ok(!seed.distractorTranslations.includes(seed.translation));

  const properNoun = entries.find((entry) => /^[A-Z]/.test(entry.word));
  assert.ok(properNoun);
  assert.equal(isUsableForVocabularyItems(properNoun), false);
});
