import fs from "node:fs";
import path from "node:path";

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

const DONE_TOPICS = new Set([
  "present_continuous",
  "present_simple",
  "articles_a_an_the",
  "present_perfect",
  "to_be_am_is_are",
  "future_forms_will_going_to_present_continuous",
]);

const lessonsDir = path.join(process.cwd(), "data", "education");

function main() {
  const files = fs
    .readdirSync(lessonsDir)
    .filter((file) => file.endsWith(".json"))
    .sort();

  const lessons: SourceLesson[] = [];
  const skipped: string[] = [];

  for (const file of files) {
    const lesson = JSON.parse(
      fs.readFileSync(path.join(lessonsDir, file), "utf8"),
    ) as SourceLesson;
    if (DONE_TOPICS.has(lesson.topic)) {
      skipped.push(`${file} (${lesson.topic})`);
      continue;
    }
    lessons.push(lesson);
  }

  const levelOrder: Record<string, number> = {
    "Pre-A1": 0,
    A1: 1,
    A2: 2,
    B1: 3,
    B2: 4,
    C1: 5,
    C2: 6,
  };

  lessons.sort((left, right) => {
    const byLevel =
      (levelOrder[left.level] ?? 99) - (levelOrder[right.level] ?? 99);
    if (byLevel !== 0) return byLevel;
    return left.title.localeCompare(right.title, "ru");
  });

  const totalQuestions = lessons.reduce(
    (sum, lesson) => sum + lesson.questions.length,
    0,
  );

  const lines: string[] = [
    "# English Platform — уроки, ещё не оформленные в Stepper",
    "",
    "> Единый файл с исходным содержимым JSON-уроков из `data/education`,",
    "> кроме тем, для которых интерактивные уроки уже собраны.",
    "",
    `- **Уроков в файле:** ${lessons.length}`,
    `- **Вопросов во всех уроках:** ${totalQuestions}`,
    "",
    "## Состав",
    "",
    ...lessons.map(
      (lesson, index) =>
        `${index + 1}. ${lesson.title} (${lesson.level}) — \`${lesson.topic}\` · ${lesson.questions.length} вопросов`,
    ),
    "",
    "## Не вошли в файл (уже есть интерактивные уроки)",
    "",
    ...skipped.map((item) => `- ${item}`),
    "",
  ];

  lessons.forEach((lesson, index) => {
    lines.push(
      "---",
      "",
      `## Урок ${index + 1}. ${lesson.title}`,
      "",
      `- **Тема:** \`${lesson.topic}\``,
      `- **Уровень:** ${lesson.level}`,
      `- **Вопросов:** ${lesson.questions.length}`,
      "",
      "### Теория",
      "",
      lesson.content,
      "",
      "### Вопросы",
      "",
    );

    lesson.questions.forEach((question, questionIndex) => {
      lines.push(`**${questionIndex + 1}.** ${question.question}`, "", "Варианты:");
      for (const option of question.options) {
        const marker = option === question.correctAnswer ? " ✅" : "";
        lines.push(`- ${option}${marker}`);
      }
      lines.push("", `Правильный ответ: **${question.correctAnswer}**`);
      if (question.explanation) {
        lines.push(`Объяснение: ${question.explanation}`);
      }
      lines.push("");
    });
  });

  lines.push(
    "---",
    "",
    "## Итог",
    "",
    `- **Всего уроков:** ${lessons.length}`,
    `- **Всего вопросов:** ${totalQuestions}`,
    "",
  );

  const outputPath = path.join(process.cwd(), "lessons-remaining.md");
  fs.writeFileSync(outputPath, lines.join("\n"), "utf8");
  console.log(`Written ${outputPath}`);
  console.log(`Lessons: ${lessons.length}`);
  console.log(`Questions: ${totalQuestions}`);
}

main();
