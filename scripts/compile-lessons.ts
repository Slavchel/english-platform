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

interface SourceLesson {
  topic: string;
  title: string;
  level: string;
  content: string;
  questions: SourceQuestion[];
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

function questionFromSource(
  question: SourceQuestion,
  index: number,
): CourseTestQuestion {
  return {
    id: `json-${index + 1}`,
    prompt: question.question,
    options: question.options,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation ?? "",
  };
}

function testQuestions(
  step: Extract<CourseStep, { kind: "test" }>,
  sourceQuestions: SourceQuestion[],
): CourseTestQuestion[] {
  const base = step.questionIndices.map((index) =>
    questionFromSource(sourceQuestions[index], index),
  );
  const extras = (step.extraQuestions ?? []).map((question) => ({
    ...question,
    options: [...question.options],
  }));
  const at = Math.min(step.extraQuestionsAt ?? base.length, base.length);
  return [...base.slice(0, at), ...extras, ...base.slice(at)];
}

function practiceQuestion(
  step: Extract<CourseStep, { kind: "practice" }>,
  sourceQuestions: SourceQuestion[],
): CourseTestQuestion | null {
  if (step.customQuestion) {
    return {
      ...step.customQuestion,
      options: [...step.customQuestion.options],
    };
  }
  if (step.questionIndex !== undefined) {
    return questionFromSource(sourceQuestions[step.questionIndex], step.questionIndex);
  }
  return null;
}

function optionLines(
  question: CourseTestQuestion,
  includeAnswer = false,
): string[] {
  return question.options.map((option) => {
    const marker =
      includeAnswer && option === question.correctAnswer ? " ✅" : "";
    return `- ${option}${marker}`;
  });
}

function renderPractice(
  step: Extract<CourseStep, { kind: "practice" }>,
  sourceQuestions: SourceQuestion[],
): string[] {
  const question = practiceQuestion(step, sourceQuestions);
  const lines: string[] = [];
  if (step.example) {
    lines.push("**Пример:**", step.example.text);
    if (step.example.explanation) lines.push(`> ${step.example.explanation}`);
    lines.push("");
  }
  if (!question) {
    lines.push("_Задание не найдено._");
    return lines;
  }
  lines.push(`**Задание:** ${question.prompt}`, "", "**Варианты:**");
  lines.push(...optionLines(question, true));
  lines.push("", `**Ответ:** ${question.correctAnswer}`);
  if (question.explanation) lines.push(`**Объяснение:** ${question.explanation}`);
  return lines;
}

function renderTest(
  step: Extract<CourseStep, { kind: "test" }>,
  sourceQuestions: SourceQuestion[],
): string[] {
  const questions = testQuestions(step, sourceQuestions);
  const lines: string[] = [];
  questions.forEach((question, index) => {
    lines.push(`### Вопрос ${index + 1}`, question.prompt, "", "**Варианты:**");
    lines.push(...optionLines(question, true));
    lines.push("", `**Ответ:** ${question.correctAnswer}`);
    if (question.explanation) lines.push(`**Объяснение:** ${question.explanation}`);
    lines.push("");
  });
  return lines;
}

function taskCount(course: readonly CourseStep[]): {
  total: number;
  byType: Record<string, number>;
} {
  const byType: Record<string, number> = {};
  let total = 0;
  const add = (type: string, count = 1) => {
    byType[type] = (byType[type] ?? 0) + count;
    total += count;
  };
  for (const step of course) {
    if (step.kind === "intro") add("intro");
    else if (step.kind === "practice") add("practice");
    else if (step.kind === "spot") add("spot");
    else if (step.kind === "matching") add("matching");
    else if (step.kind === "sorting") add("sorting");
    else if (step.kind === "word-order") add("word-order");
    else if (step.kind === "test") {
      add("final-test", step.questionIndices.length + (step.extraQuestions?.length ?? 0));
    }
  }
  return { total, byType };
}

function renderStep(
  step: CourseStep,
  index: number,
  sourceQuestions: SourceQuestion[],
): string[] {
  const lines: string[] = [];
  const eyebrow = "eyebrow" in step ? step.eyebrow : "";
  const title = "title" in step && step.title ? step.title : eyebrow;
  const displayTitle = title.replace(/^Шаг\s+\d+\s*·\s*/, "");
  lines.push(`### Шаг ${index + 1}. ${displayTitle}`, "");
  if (eyebrow && eyebrow !== title) lines.push(`_${eyebrow}_`, "");

  if (step.kind === "intro") {
    lines.push(step.lead, "", `**Фраза:** ${step.example}`, "", "**Варианты:**");
    for (const option of step.options) {
      lines.push(`- ${option}${option === step.correctOption ? " ✅" : ""}`);
    }
    lines.push("", `**Ответ:** ${step.correctOption}`, `**Объяснение:** ${step.explanation}`);
  } else if (step.kind === "theory") {
    lines.push(...step.paragraphs);
    if (step.examples) {
      lines.push("", "**Примеры:**");
      for (const example of step.examples) {
        lines.push(`- ${example.en} — ${example.ru}`);
      }
    }
    if (step.note) lines.push("", `> ${step.note}`);
  } else if (step.kind === "formula") {
    lines.push(...step.lines.map((line) => `- **${line.label}:** ${line.formula} — ${line.example}`));
    if (step.note) lines.push("", `> ${step.note}`);
  } else if (step.kind === "rules") {
    lines.push(step.intro, "", "**Правила:**");
    lines.push(...step.rules.map((rule) => `- ${rule.pattern} — ${rule.example}`));
    if (step.note) lines.push("", `> ${step.note}`);
  } else if (step.kind === "practice") {
    lines.push(...renderPractice(step, sourceQuestions));
  } else if (step.kind === "spot") {
    lines.push(step.instruction, "", `**Предложение:** ${step.sentence}`, "");
    lines.push(`**Ошибочное слово:** ${step.words[step.errorIndex]}`);
    lines.push(`**Объяснение:** ${step.explanation}`);
  } else if (step.kind === "matching") {
    lines.push(step.instruction, "", "**Пары:**");
    lines.push(...step.pairs.map((pair) => `- ${pair.left} → ${pair.right}`));
    if (step.successText) lines.push("", `> ${step.successText}`);
  } else if (step.kind === "sorting") {
    lines.push(step.instruction, "", `**Категории:** ${step.categories.join(" / ")}`, "");
    for (const item of step.items) {
      lines.push(`- «${item.text}» → **${item.category}**. ${item.explanation}`);
    }
  } else if (step.kind === "word-order") {
    lines.push(`**Русская фраза:** ${step.russian}`, "");
    lines.push(`**Слова:** ${step.words.join(" · ")}`, "");
    lines.push(`**Правильный порядок:** ${step.correct.join(" ")}`);
  } else if (step.kind === "pre-test") {
    lines.push(step.lead, "");
    for (const item of step.summary) {
      lines.push(`- **${item.label}:** ${item.text}`);
    }
  } else if (step.kind === "test") {
    lines.push(...renderTest(step, sourceQuestions));
  } else if (step.kind === "result") {
    lines.push(step.lead, "", "**Итоговая формула:**");
    lines.push(...step.formula.map((line) => `- ${line}`));
  }
  lines.push("");
  return lines;
}

function main() {
  const topics = Object.keys(SOURCES);
  const lessons: SourceLesson[] = topics.map((topic) => {
    const file = SOURCES[topic];
    return JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "data", "education", file), "utf8"),
    ) as SourceLesson;
  });

  const lines: string[] = [
    "# English Platform — все готовые интерактивные уроки",
    "",
    "> Единый файл для проверки содержания, логики и упражнений. Тексты уроков сохранены без изменений.",
    "",
    "## Состав",
    "",
    ...lessons.map((lesson, index) => `${index + 1}. ${lesson.title} (${lesson.level}) — \`${lesson.topic}\``),
    "",
  ];

  let totalTasks = 0;
  let totalQuestions = 0;
  const allByType: Record<string, number> = {};

  lessons.forEach((lesson, lessonIndex) => {
    const course = getLessonCourse(lesson.topic);
    if (!course) return;
    const counts = taskCount(course);
    totalTasks += counts.total;
    for (const [type, count] of Object.entries(counts.byType)) {
      allByType[type] = (allByType[type] ?? 0) + count;
    }
    totalQuestions += lesson.questions.length;

    lines.push(
      "---",
      "",
      `## Урок ${lessonIndex + 1}. ${lesson.title}`,
      "",
      `- **Тема:** \`${lesson.topic}\``,
      `- **Уровень:** ${lesson.level}`,
      `- **Шагов в Stepper:** ${course.length}`,
      `- **Интерактивных заданий:** ${counts.total}`,
      `- **Вопросов в исходном JSON:** ${lesson.questions.length}`,
      "",
      "### Полная теория из JSON",
      "",
      lesson.content,
      "",
      "### Пошаговый сценарий",
      "",
    );

    course.forEach((step, stepIndex) => {
      lines.push(...renderStep(step, stepIndex, lesson.questions));
    });
  });

  lines.push(
    "---",
    "",
    "## Итог",
    "",
    `- **Всего уроков:** ${lessons.length}`,
    `- **Всего интерактивных заданий:** ${totalTasks}`,
    `- **Вопросов в исходных JSON:** ${totalQuestions}`,
    "",
    "### Задания по типам",
    "",
    ...Object.entries(allByType).map(([type, count]) => `- ${type}: ${count}`),
    "",
  );

  const outputPath = path.join(process.cwd(), "all-lessons.md");
  fs.writeFileSync(outputPath, lines.join("\n"), "utf8");
  console.log(`Written ${outputPath}`);
  console.log(`Lessons: ${lessons.length}`);
  console.log(`Interactive tasks: ${totalTasks}`);
  console.log(`Source questions: ${totalQuestions}`);
  console.log(allByType);
}

main();
