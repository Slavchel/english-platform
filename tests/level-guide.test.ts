import test from "node:test";
import assert from "node:assert/strict";

import { LEVEL_GUIDES } from "../lib/cefr/level-guide";

test("описания уровней заполнены и не содержат старых несогласованных формулировок", () => {
  assert.equal(LEVEL_GUIDES.length, 7);

  const allText = LEVEL_GUIDES.flatMap((guide) => [
    guide.summary,
    guide.understanding,
    guide.reading,
    guide.vocabulary,
    guide.grammar,
    guide.communication,
    ...guide.tasks,
    guide.differences,
    ...guide.improve,
  ]).join(" ");

  for (const guide of LEVEL_GUIDES) {
    assert.ok(guide.summary.trim(), `${guide.level}: summary`);
    assert.ok(guide.vocabulary.trim(), `${guide.level}: vocabulary`);
    assert.ok(guide.differences.trim(), `${guide.level}: differences`);
    assert.ok(guide.improve.length > 0, `${guide.level}: improve`);
  }

  for (const legacy of [
    "начала Present Perfect",
    "начала инверсии",
    "углублять специализированные области",
    "вопросы да/нет",
    "Вероятно, вы умеете",
    "простой Past Simple",
  ]) {
    assert.ok(!allText.includes(legacy), `Осталась формулировка: ${legacy}`);
  }
});
