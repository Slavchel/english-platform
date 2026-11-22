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

interface CourseSeed {
  id: string;
  title: string;
  description: string;
  level: string;
  color: string;
  order: number;
  modules: Array<{
    id: string;
    title: string;
    topics: string[];
  }>;
}

const COURSES: CourseSeed[] = [  {
    id: "foundation-a2",
    title: "Уверенный старт: A1–A2",
    description:
      "Фундамент английского: базовые конструкции, настоящее, прошедшее и будущее время.",
    level: "A1–A2",
    color: "#6f9fd8",
    order: 1,
    modules: [
      {
        id: "foundation-m1",
        title: "Быть и находиться",
        topics: ["to_be_am_is_are", "there_is_there_are", "possessives"],
      },
      {
        id: "foundation-m2",
        title: "Настоящее время",
        topics: [
          "present_simple",
          "present_continuous",
          "present_simple_vs_present_continuous",
        ],
      },
      {
        id: "foundation-m3",
        title: "Прошедшее время",
        topics: [
          "past_simple",
          "past_continuous",
          "past_simple_vs_past_continuous",
        ],
      },
      {
        id: "foundation-m4",
        title: "Будущее время",
        topics: ["future_will", "future_going_to"],
      },
    ],
  },
  {
    id: "communication-a2-b1",
    title: "Грамматика для общения",
    description:
      "Артикли, предлоги, союзы и модальные глаголы — то, что помогает говорить естественно.",
    level: "A2–B1",
    color: "#b6a7d9",
    order: 2,
    modules: [
      {
        id: "communication-m1",
        title: "Артикли и слова",
        topics: [
          "articles_a_an_the",
          "some_any_no_every",
          "much_many_a_lot_of_little_few",
          "quantifiers_both_either_neither",
        ],
      },
      {
        id: "communication-m2",
        title: "Предлоги и союзы",
        topics: [
          "prepositions_of_time_in_on_at",
          "prepositions_of_place",
          "conjunctions_basic",
        ],
      },
      {
        id: "communication-m3",
        title: "Модальные глаголы",
        topics: [
          "modal_verbs_must_have_to_should",
          "modals_of_ability",
          "modals_of_advice",
        ],
      },
      {
        id: "communication-m4",
        title: "Указательные",
        topics: ["demonstratives"],
      },
    ],
  },
  {
    id: "advanced-b1-b2",
    title: "Продвинутый английский",
    description:
      "Шесть модулей B1–B2: совершенные времена, сложное будущее, условные предложения, структуры речи, неличные формы и продвинутая модальность.",
    level: "B1–B2",
    color: "#7fc4a3",
    order: 3,
    modules: [
      {
        id: "advanced-m1",
        title: "Совершенные времена",
        topics: [
          "present_perfect",
          "past_simple_vs_present_perfect",
          "present_perfect_continuous",
          "past_perfect",
        ],
      },
      {
        id: "advanced-m2",
        title: "Сложное будущее",
        topics: [
          "future_continuous",
          "future_perfect",
          "future_forms_will_going_to_present_continuous",
        ],
      },
      {
        id: "advanced-m3",
        title: "Условные предложения",
        topics: ["conditionals_1_2", "conditionals_3_mixed"],
      },
      {
        id: "advanced-m4",
        title: "Структуры предложений",
        topics: ["passive_voice", "reported_speech"],
      },
      {
        id: "advanced-m5",
        title: "Неличные формы и придаточные",
        topics: ["gerunds_infinitives", "relative_clauses"],
      },
      {
        id: "advanced-m6",
        title: "Продвинутая модальность",
        topics: ["modals_of_probability"],
      },
    ],
  },
];

interface ProgramMeta {
  courseTitle?: string;
  welcome?: { subtitle?: string };
}

function readProgramMeta(): Record<string, ProgramMeta> {
  const contentDir = path.join(process.cwd(), "content");
  const files = fs
    .readdirSync(contentDir)
    .filter((file) => /^program_\d+\.json$/.test(file))
    .sort();
  const result: Record<string, ProgramMeta> = {};

  for (const file of files) {
    const raw = JSON.parse(
      fs.readFileSync(path.join(contentDir, file), "utf8"),
    ) as { courseId?: string; courseTitle?: string; welcome?: { subtitle?: string } };
    if (raw.courseId) {
      result[raw.courseId] = {
        courseTitle: raw.courseTitle,
        welcome: raw.welcome,
      };
    }
  }

  return result;
}

async function main() {
  // Reset assignments first so unlisted lessons stay independent.
  await prisma.lesson.updateMany({
    data: { courseId: null, moduleId: null, order: 0 },
  });

  for (const courseSeed of COURSES) {
    const programMeta = readProgramMeta()[courseSeed.id];
    const courseTitle = programMeta?.courseTitle ?? courseSeed.title;
    const courseDescription =
      programMeta?.welcome?.subtitle ?? courseSeed.description;
    const course = await prisma.course.upsert({
      where: { id: courseSeed.id },
      update: {
        title: courseTitle,
        description: courseDescription,
        level: courseSeed.level,
        color: courseSeed.color,
        order: courseSeed.order,
      },
      create: {
        id: courseSeed.id,
        title: courseTitle,
        description: courseDescription,
        level: courseSeed.level,
        color: courseSeed.color,
        order: courseSeed.order,
      },
    });

    await prisma.module.deleteMany({ where: { courseId: course.id } });

    let totalLessons = 0;

    for (const [moduleIndex, moduleSeed] of courseSeed.modules.entries()) {
      const courseModule = await prisma.module.create({
        data: {
          id: moduleSeed.id,
          courseId: course.id,
          title: moduleSeed.title,
          order: moduleIndex + 1,
        },
      });

      for (const [lessonIndex, topic] of moduleSeed.topics.entries()) {
        const lesson = await prisma.lesson.findUnique({ where: { topic } });
        if (!lesson) {
          console.warn(`⚠ ${courseSeed.id}: урок ${topic} не найден`);
          continue;
        }

        await prisma.lesson.update({
          where: { id: lesson.id },
          data: {
            courseId: course.id,
            moduleId: courseModule.id,
            order: lessonIndex + 1,
          },
        });
        totalLessons += 1;
      }
    }

    console.log(
      `✓ ${courseSeed.title}: ${courseSeed.modules.length} модулей, ${totalLessons} уроков`,
    );
  }

  const unassigned = await prisma.lesson.count({
    where: { courseId: null },
  });
  console.log(`Свободных тем без программы: ${unassigned}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
