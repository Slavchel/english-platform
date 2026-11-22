import fs from "node:fs";
import path from "node:path";

import { PrismaClient } from "@prisma/client";

function loadLocalEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match || process.env[match[1]] !== undefined) continue;

    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

loadLocalEnv();

const prisma = new PrismaClient();
const lessonsDir = path.join(process.cwd(), "data", "education");
const mapCoordinatesPath = path.join(
  process.cwd(),
  "content",
  "map_coordinates.json",
);

interface ProgramLessonText {
  introText?: string | null;
  outroText?: string | null;
}

interface ProgramTexts {
  lessons?: Record<string, ProgramLessonText>;
}

function readProgramTexts(): Record<string, ProgramLessonText> {
  const contentDir = path.join(process.cwd(), "content");
  const files = fs
    .readdirSync(contentDir)
    .filter((file) => /^program_\d+\.json$/.test(file))
    .sort();

  const merged: Record<string, ProgramLessonText> = {};
  for (const file of files) {
    const raw = JSON.parse(
      fs.readFileSync(path.join(contentDir, file), "utf8"),
    ) as ProgramTexts;
    Object.assign(merged, raw.lessons ?? {});
  }
  return merged;
}

const programTexts = readProgramTexts();

interface MapCoordinate {
  mapX: number;
  mapY: number;
}

function readMapCoordinates(): Record<string, MapCoordinate> {
  if (!fs.existsSync(mapCoordinatesPath)) return {};
  const raw = JSON.parse(fs.readFileSync(mapCoordinatesPath, "utf8")) as {
    nodes?: Record<string, MapCoordinate>;
  };
  return raw.nodes ?? {};
}

const mapCoordinates = readMapCoordinates();

function coordinatesFor(topic: string): MapCoordinate {
  // The hand-authored map uses the source file name for Present Perfect.
  const alias =
    topic === "present_perfect" ? "present_perfect_regular" : topic;
  return mapCoordinates[topic] ?? mapCoordinates[alias] ?? { mapX: 50, mapY: 50 };
}

interface LessonFile {
  topic: string;
  title: string;
  level: string;
  content: string;
  introText?: string | null;
  outroText?: string | null;
  questions: Array<{
    question: string;
    options: string[];
    correctAnswer: string;
    explanation?: string;
  }>;
}

const ADVANCED_LEVELS = new Set(["B1", "B2", "C1", "C2"]);

const CATEGORY_BY_TOPIC: Record<string, string> = {
  present_simple: "tenses",
  present_continuous: "tenses",
  present_perfect: "tenses",
  present_perfect_continuous: "tenses",
  past_simple: "tenses",
  past_continuous: "tenses",
  past_perfect: "tenses",
  future_will: "tenses",
  future_going_to: "tenses",
  future_continuous: "tenses",
  future_perfect: "tenses",
  future_forms_will_going_to_present_continuous: "comparisons",
  present_simple_vs_present_continuous: "comparisons",
  past_simple_vs_past_continuous: "comparisons",
  past_simple_vs_present_perfect: "comparisons",
  modal_verbs_must_have_to_should: "modals",
  articles_a_an_the: "articles",
  much_many_a_lot_of_little_few: "articles",
  some_any_no_every: "articles",
  there_is_there_are: "articles",
  to_be_am_is_are: "basics",
  prepositions_of_time_in_on_at: "basics",
  conjunctions_basic: "connectors",
  countable_uncountable: "nouns",
  quantifiers_both_either_neither: "nouns",
  demonstratives: "determiners",
  possessives: "determiners",
  modals_of_ability: "modals",
  modals_of_advice: "modals",
  modals_of_probability: "modals",
  conditionals_1_2: "conditionals",
  conditionals_3_mixed: "conditionals",
  gerunds_infinitives: "syntax",
  passive_voice: "syntax",
  relative_clauses: "syntax",
  reported_speech: "syntax",
};

function categoryFor(topic: string, level: string): string {
  return (
    CATEGORY_BY_TOPIC[topic] ??
    (ADVANCED_LEVELS.has(level) ? "comparisons" : "basics")
  );
}

function readLesson(fileName: string): LessonFile {
  const raw = fs.readFileSync(path.join(lessonsDir, fileName), "utf8");
  const lesson = JSON.parse(raw) as LessonFile;

  if (
    !lesson.topic ||
    !lesson.title ||
    !lesson.level ||
    !lesson.content ||
    !Array.isArray(lesson.questions)
  ) {
    throw new Error(`Некорректный формат урока: ${fileName}`);
  }

  for (const question of lesson.questions) {
    if (
      !question.question ||
      !Array.isArray(question.options) ||
      !question.correctAnswer
    ) {
      throw new Error(`Некорректный вопрос в уроке: ${fileName}`);
    }
  }

  return lesson;
}

async function main() {
  const files = fs
    .readdirSync(lessonsDir)
    .filter((file) => file.endsWith(".json"))
    .sort();

  if (files.length === 0) {
    throw new Error(`В папке ${lessonsDir} нет JSON-уроков.`);
  }

  for (const file of files) {
    const lesson = readLesson(file);
    const coordinates = coordinatesFor(lesson.topic);
    const programText = programTexts[lesson.topic];

    await prisma.$transaction(async (tx) => {
      const saved = await tx.lesson.upsert({
        where: { topic: lesson.topic },
        update: {
          title: lesson.title,
          level: lesson.level,
          category: categoryFor(lesson.topic, lesson.level),
          content: lesson.content,
          introText: programText?.introText ?? lesson.introText ?? null,
          outroText: programText?.outroText ?? lesson.outroText ?? null,
          mapX: coordinates.mapX,
          mapY: coordinates.mapY,
        },
        create: {
          topic: lesson.topic,
          title: lesson.title,
          level: lesson.level,
          category: categoryFor(lesson.topic, lesson.level),
          content: lesson.content,
          introText: programText?.introText ?? lesson.introText ?? null,
          outroText: programText?.outroText ?? lesson.outroText ?? null,
          mapX: coordinates.mapX,
          mapY: coordinates.mapY,
        },
      });

      await tx.question.deleteMany({ where: { lessonId: saved.id } });
      await tx.question.createMany({
        data: lesson.questions.map((question, index) => ({
          lessonId: saved.id,
          prompt: question.question,
          options: JSON.stringify(question.options),
          correctAnswer: question.correctAnswer,
          explanation: question.explanation ?? null,
          order: index,
        })),
      });
    });

    console.log(
      `✓ ${lesson.topic}: ${lesson.title} (${lesson.questions.length} вопросов)`,
    );
  }

  console.log(`Импортировано уроков: ${files.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
