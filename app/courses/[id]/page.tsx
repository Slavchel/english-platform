import type { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import CourseView from "./CourseView";

type RawConnection = { from: string; to: string };

export interface CourseWelcome {
  eyebrow: string;
  title: string;
  subtitle: string;
  uniqueTitle: string;
  uniqueText: string;
  featuresTitle: string;
  features: Array<{ icon: string; title: string; text: string }>;
  howTitle: string;
  howText: string;
  button: string;
}

function readCourseWelcome(courseId: string): CourseWelcome | null {
  const contentDir = path.join(process.cwd(), "content");
  const files = fs
    .readdirSync(contentDir)
    .filter((file) => /^program_\d+\.json$/.test(file))
    .sort();

  for (const file of files) {
    const raw = JSON.parse(
      fs.readFileSync(path.join(contentDir, file), "utf8"),
    ) as {
      courseId?: string;
      welcome?: CourseWelcome;
    };
    if (raw.courseId === courseId && raw.welcome) return raw.welcome;
  }
  return null;
}

type RawCourseMap = {
  connections?: RawConnection[];
  courses?: Record<
    string,
    {
      connections?: RawConnection[];
    }
  >;
};

function normalizeMapTopic(topic: string): string {
  return topic
    .replace(/_(A1|A2|B1|B2|C1|C2)$/i, "")
    .replace(/_v2$/i, "")
    .replace(/^present_perfect_regular$/, "present_perfect");
}

function readCourseMap(courseId: string): {
  connections: RawConnection[];
} {
  const filePath = path.join(process.cwd(), "content", "course_map.json");
  if (!fs.existsSync(filePath)) {
    return { connections: [] };
  }

  const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as RawCourseMap;
  const source = raw.courses?.[courseId] ?? raw;

  return {
    connections: (source.connections ?? []).map((item) => ({
      from: normalizeMapTopic(item.from),
      to: normalizeMapTopic(item.to),
    })),
  };
}

type CoursePageProps = {
  params: Promise<{ id: string }>;
};

export const instant = false;

export async function generateMetadata({
  params,
}: CoursePageProps): Promise<Metadata> {
  const { id } = await params;
  const course = await prisma.course.findUnique({
    where: { id },
    select: { title: true, description: true },
  });

  return {
    title: course ? `${course.title} — NeoLeng` : "Программа",
    description: course?.description,
  };
}

export default async function CoursePage({ params }: CoursePageProps) {
  await connection();
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  const { id } = await params;
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            select: {
              topic: true,
              title: true,
              level: true,
              order: true,
            },
          },
        },
      },
    },
  });

  if (!course) notFound();

  const { connections } = readCourseMap(course.id);
  const welcome = readCourseWelcome(course.id);

  const user = session.user.email
    ? await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      })
    : null;
  const [completedRows, savedProgress] = user
    ? await Promise.all([
        prisma.lessonProgress.findMany({
          where: { userId: user.id, lesson: { courseId: course.id } },
          select: { lesson: { select: { topic: true } } },
        }),
        prisma.userProgress.findUnique({
          where: {
            userId_courseId: { userId: user.id, courseId: course.id },
          },
          include: { lesson: { select: { topic: true } } },
        }),
      ])
    : [[], null];

  const completedTopics = new Set(
    completedRows.map((item) => item.lesson.topic),
  );
  const courseTopics = course.modules.flatMap((module) =>
    module.lessons.map((lesson) => lesson.topic),
  );
  let resumeTopic = savedProgress?.lesson?.topic ?? null;
  let resumeStep = savedProgress?.currentStep ?? 0;
  if (
    savedProgress &&
    (!resumeTopic || completedTopics.has(resumeTopic))
  ) {
    resumeTopic = courseTopics.find((topic) => !completedTopics.has(topic)) ?? null;
    resumeStep = 0;
  }
  const resume =
    savedProgress && resumeTopic
      ? { topic: resumeTopic, currentStep: resumeStep }
      : null;

  return (
    <CourseView
      firstLessonTopic={courseTopics[0] ?? null}
      resume={resume}
      course={{
        id: course.id,
        title: course.title,
        description: course.description,
        level: course.level,
        color: course.color,
        modules: course.modules.map((module) => ({
          id: module.id,
          title: module.title,
          order: module.order,
          lessons: module.lessons.map((lesson) => ({
            topic: lesson.topic,
            title: lesson.title,
            level: lesson.level,
          })),
        })),
      }}
      connections={connections}
      welcome={welcome}
    />
  );
}
