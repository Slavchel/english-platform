import test from "node:test";
import assert from "node:assert/strict";

import { CefrTestEngine } from "../lib/cefr/engine";
import { createTrialItemPool } from "../lib/cefr/bank/trial-bank";

test("первый Reading-текст меняется между сессиями", () => {
  const firstPassages = new Set<string>();

  for (let seed = 1; seed <= 20; seed += 1) {
    const engine = new CefrTestEngine({
      bank: createTrialItemPool(),
      seed,
    });

    while (!engine.isFinished) {
      const item = engine.currentItem;
      assert.ok(item);
      if (item.skill === "reading") {
        const group = engine.readingGroup;
        assert.ok(group);
        assert.equal(group.index, 1);
        firstPassages.add(group.passageId);
        break;
      }
      const wrong = item.options.find(
        (option) => option.id !== item.correctOptionId,
      );
      assert.ok(wrong);
      engine.submitAnswer(wrong.id);
    }
  }

  assert.ok(
    firstPassages.size > 1,
    `первый текст не меняется: ${[...firstPassages].join(", ")}`,
  );
});
