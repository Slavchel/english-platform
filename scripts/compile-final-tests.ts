import fs from "node:fs";
import path from "node:path";

import {
  getLessonCourse,
  type CourseStep,
  type CourseTestQuestion,
} from "../lib/lessons/course";

interface SourceQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

const SOURCES: Record<string, string> = {
  present_continuous: "present_continuous_A1.json",
  present_simple: "present_simple_A1.json",
  articles_a_an_the: "articles_a_an_the_v2.json",
  present_perfect: "present_perfect_regular.json",
  to_be_am_is_are: "to_be_am_is_are_A1.json",
  future_forms_will_going_to_present_continuous:
    "future_forms_will_going_to_present_continuous_A2.json",
  future_will: "future_will.json",
  future_going_to: "future_going_to.json",
  future_continuous: "future_continuous.json",
  future_perfect: "future_perfect.json",
  present_perfect_continuous: "present_perfect_continuous.json",
  conjunctions_basic: "conjunctions_basic.json",
  countable_uncountable: "countable_uncountable.json",
  demonstratives: "demonstratives.json",
  modals_of_ability: "modals_of_ability.json",
  modals_of_advice: "modals_of_advice.json",
  modals_of_probability: "modals_of_probability.json",
  possessives: "possessives.json",
  quantifiers_both_either_neither:
    "quantifiers_both_either_neither.json",
  modal_verbs_must_have_to_should:
    "modal_verbs_must_have_to_should_v2.json",
  much_many_a_lot_of_little_few:
    "much_many_a_lot_of_little_few.json",
  past_continuous: "past_continuous.json",
  past_simple: "past_simple.json",
  past_simple_vs_past_continuous:
    "past_simple_vs_past_continuous.json",
  prepositions_of_time_in_on_at:
    "prepositions_of_time_in_on_at_v2.json",
  prepositions_of_place: "prepositions_of_place.json",
  present_simple_vs_present_continuous:
    "present_simple_vs_present_continuous_v2.json",
  some_any_no_every: "some_any_no_every.json",
  there_is_there_are: "there_is_there_are_A2.json",
  past_simple_vs_present_perfect:
    "past_simple_vs_present_perfect_v2.json",
};

const RECENT = new Set([
  "future_will",
  "future_going_to",
  "modal_verbs_must_have_to_should",
  "much_many_a_lot_of_little_few",
  "past_continuous",
  "past_simple",
  "past_simple_vs_past_continuous",
]);

function fromSource(question: SourceQuestion, index: number): CourseTestQuestion {
  return {
    id: `json-${index + 1}`,
    prompt: question.question,
    options: question.options,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation ?? "",
  };
}

function resolveTest(step: Extract<CourseStep, { kind: "test" }>, questions: SourceQuestion[]): CourseTestQuestion[] {
  const base = step.questionIndices.map((index) =>
    fromSource(questions[index], index),
  );
  const extras = (step.extraQuestions ?? []).map((question) => ({
    ...question,
    options: [...question.options],
  }));
  const at = Math.min(step.extraQuestionsAt ?? base.length, base.length);
  return [...base.slice(0, at), ...extras, ...base.slice(at)];
}

function main() {
  const topics = Object.keys(SOURCES);
  const lines: string[] = [
    "# Финальные тесты — все вопросы",
    "",
    "> Все вопросы финальных тестов Stepper-уроков с указанием темы. Новые вопросы отмечены отдельно.",
    "",
    "## Состав",
    "",
  ];

  const lessons = topics.map((topic) => {
    const file = SOURCES[topic];
    const source = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "data", "education", file), "utf8"),
    ) as {
      topic: string;
      title: string;
      level: string;
      questions: SourceQuestion[];
    };
    return { ...source, file };
  });

  let total = 0;
  lessons.forEach((lesson, index) => {
    lines.push(
      `${index + 1}. ${lesson.title} (${lesson.level}) — \`${lesson.topic}\``,
    );
  });
  lines.push("");

  lessons.forEach((lesson, lessonIndex) => {
    const course = getLessonCourse(lesson.topic);
    const test = course?.find(
      (step): step is Extract<CourseStep, { kind: "test" }> =>
        step.kind === "test",
    );
    if (!test) return;
    const questions = resolveTest(test, lesson.questions);
    total += questions.length;
    const recent = RECENT.has(lesson.topic);

    lines.push(
      "---",
      "",
      `## ${lessonIndex + 1}. ${lesson.title}`,
      "",
      `- **Тема:** \`${lesson.topic}\``,
      `- **Уровень:** ${lesson.level}`,
      `- **Вопросов в финальном тесте:** ${questions.length}`,
      recent ? "- **Статус:** недавний урок, финальный тест обновлён" : "",
      "",
    );

    questions.forEach((question, questionIndex) => {
      const isNew = question.id.startsWith("json-") === false;
      lines.push(
        `### Вопрос ${questionIndex + 1}${isNew ? " · новый" : ""}`,
        "",
        question.prompt,
        "",
        "**Варианты:**",
        ...question.options.map(
          (option) =>
            `- ${option}${option === question.correctAnswer ? " ✅" : ""}`,
        ),
        "",
        `**Правильный ответ:** ${question.correctAnswer}`,
      );
      if (question.explanation) {
        lines.push(`**Объяснение:** ${question.explanation}`);
      }
      lines.push("");
    });
  });

  lines.push(
    "---",
    "",
    "## Итог",
    "",
    `- **Уроков:** ${lessons.length}`,
    `- **Вопросов в финальных тестах:** ${total}`,
    "",
  );

  const outputPath = path.join(process.cwd(), "final-test-questions.md");
  fs.writeFileSync(outputPath, lines.join("\n"), "utf8");
  console.log(`Written ${outputPath}`);
  console.log(`Lessons: ${lessons.length}`);
  console.log(`Questions: ${total}`);
}

main();
