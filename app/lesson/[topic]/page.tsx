import { Suspense } from "react";
import fs from "node:fs";
import path from "node:path";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canOpenLesson } from "@/lib/subscription/server";
import { getLessonCourse } from "@/lib/lessons/course";
import UpgradeLimitModal from "@/app/components/UpgradeLimitModal";
import LessonExperience, {
  type LessonExperienceQuestion,
} from "./LessonExperience";
import LessonCourse from "./LessonCourse";
import LessonGuide from "./LessonGuide";
import LessonReentryPrompt from "./LessonReentryPrompt";

type LessonPageProps = {
  params: Promise<{ topic: string }>;
  searchParams: Promise<{
    view?: string | string[];
    from?: string | string[];
    context?: string | string[];
    step?: string | string[];
  }>;
};

export default function LessonPage({ params, searchParams }: LessonPageProps) {
  return (
    <Suspense
      fallback={
        <section className="page-shell lesson-page">
          <div className="container lesson-container">
            <p className="eyebrow">NeoLeng · урок</p>
            <h1 className="page-title">Загружаем урок…</h1>
          </div>
        </section>
      }
    >
      <LessonContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function LessonContent({ params, searchParams }: LessonPageProps) {
  await connection();
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  const { topic } = await params;
  const query = await searchParams;
  const view = Array.isArray(query.view) ? query.view[0] : query.view;
  const from = Array.isArray(query.from) ? query.from[0] : query.from;
  const context = query.context === "library" ? "library" : "program";
  const lesson = await prisma.lesson.findUnique({
    where: { topic },
    include: {
      questions: {
        orderBy: { order: "asc" },
      },
      course: {
        include: {
          modules: {
            orderBy: { order: "asc" },
            include: {
              lessons: {
                orderBy: { order: "asc" },
                select: { topic: true },
              },
            },
          },
        },
      },
    },
  });

  if (!lesson) {
    notFound();
  }

  const accessUser = session.user.email
    ? await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
          id: true,
        },
      })
    : null;

  const lessonAccess = await canOpenLesson(
    session.user.email ?? null,
    lesson.topic,
    Boolean(session.user.isAdmin),
  );

  if (!lessonAccess.allowed) {
    return (
      <section className="page-shell lesson-page">
        <div className="container lesson-container">
          <p className="eyebrow">NeoLeng · урок</p>
          <h1 className="page-title">{lesson.title}</h1>
          <UpgradeLimitModal
            title="Доступ к уроку ограничен"
            message="Этот урок пока недоступен. Попробуйте открыть его позже."
          />
        </div>
      </section>
    );
  }

  if (view === "guide") {
    return (
      <LessonGuide
        title={lesson.title}
        level={lesson.level}
        topic={lesson.topic}
        content={lesson.content}
        from={from === "admin" ? "admin" : "learning"}
      />
    );
  }

  let initialStep = 0;
  let completedInLibrary = false;
  if (context === "program" && lesson.courseId && session.user.email) {
    const user = accessUser;
    if (user) {
      const completion = await prisma.lessonProgress.findUnique({
        where: {
          userId_lessonId: {
            userId: user.id,
            lessonId: lesson.id,
          },
        },
        select: { source: true },
      });
      completedInLibrary = completion?.source === "library";

      const programTopics =
        lesson.course?.modules.flatMap((courseModule) =>
          courseModule.lessons.map((item) => item.topic),
        ) ?? [];
      const lessonIndex = programTopics.indexOf(lesson.topic);
      if (lessonIndex > 0) {
        const completed = await prisma.lessonProgress.findMany({
          where: {
            userId: user.id,
            lesson: { courseId: lesson.courseId },
          },
          select: { lesson: { select: { topic: true } } },
        });
        const completedTopics = new Set(
          completed.map((item) => item.lesson.topic),
        );
        const previousCompleted = programTopics
          .slice(0, lessonIndex)
          .every((programTopic) => completedTopics.has(programTopic));
        if (!previousCompleted) {
          redirect(`/courses/${lesson.courseId}`);
        }
      }

      const savedProgress = await prisma.userProgress.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: lesson.courseId,
          },
        },
        select: { lessonId: true, currentStep: true },
      });
      if (savedProgress?.lessonId === lesson.id) {
        initialStep = Math.max(0, savedProgress.currentStep);
      }
      if (completedInLibrary) {
        initialStep = 0;
      }
    }
  }

  const questions: LessonExperienceQuestion[] = lesson.questions.map(
    (question) => {
      let options: string[] = [];
      try {
        const parsed = JSON.parse(question.options) as unknown;
        if (Array.isArray(parsed)) {
          options = parsed.filter(
            (option): option is string => typeof option === "string",
          );
        }
      } catch {
        options = [];
      }

      return {
        id: question.id,
        prompt: question.prompt,
        options,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
      };
    },
  );

  const course = getLessonCourse(lesson.topic);
  if (course && questions.length >= 3) {
    const programTopics =
      lesson.course?.modules.flatMap((module) =>
        module.lessons.map((item) => item.topic),
      ) ?? [];
    const currentIndex = programTopics.indexOf(lesson.topic);
    const nextLessonTopic =
      currentIndex >= 0 && currentIndex < programTopics.length - 1
        ? programTopics[currentIndex + 1]
        : null;
    const moduleIndex =
      lesson.course?.modules.findIndex((module) =>
        module.lessons.some((item) => item.topic === lesson.topic),
      ) ?? -1;
    const lessonInModule =
      moduleIndex >= 0
        ? (lesson.course?.modules[moduleIndex]?.lessons.findIndex(
            (item) => item.topic === lesson.topic,
          ) ?? -1)
        : -1;

    const chartPath = path.join(
      process.cwd(),
      "content",
      "tenses_chart.md",
    );
    const tensesChart = fs.existsSync(chartPath)
      ? fs.readFileSync(chartPath, "utf8")
      : "";
    return (
      <>
        {completedInLibrary && lesson.courseId ? (
          <LessonReentryPrompt
            title={lesson.title}
            nextHref={
              nextLessonTopic
                ? `/lesson/${nextLessonTopic}?context=program&step=0`
                : `/courses/${lesson.courseId}`
            }
          />
        ) : null}
        <LessonCourse
          title={lesson.title}
          level={lesson.level}
          topic={lesson.topic}
          category={lesson.category}
          content={lesson.content}
          introText={lesson.introText}
          outroText={lesson.outroText}
          courseId={lesson.courseId}
          nextLessonTopic={nextLessonTopic}
          context={context}
          initialStep={initialStep}
          moduleIndex={moduleIndex}
          lessonInModule={lessonInModule}
          tourUserKey={session.user.email ?? "anonymous"}
          tensesChart={tensesChart}
          questions={questions}
          course={course}
        />
      </>
    );
  }

  return (
    <LessonExperience
      title={lesson.title}
      level={lesson.level}
      topic={lesson.topic}
      content={lesson.content}
      question={questions[0] ?? null}
    />
  );
}
