import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDuration, getYouTubeEmbedUrl, serializePrisma } from "@/lib/utils";
import LessonPlayerClient from "./LessonPlayerClient";

export const revalidate = 0;

interface LessonPageProps {
  params: Promise<{
    courseSlug: string;
    lessonSlug: string;
  }>;
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { courseSlug, lessonSlug } = await params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  // Fetch Course with all Sections and Lessons
  const course = await prisma.course.findUnique({
    where: { slug: courseSlug },
    include: {
      instructor: {
        select: { name: true, avatarUrl: true, headline: true },
      },
      sections: {
        orderBy: { orderIndex: "asc" },
        include: {
          lessons: {
            orderBy: { orderIndex: "asc" },
            include: {
              attachments: true,
            },
          },
        },
      },
    },
  });

  if (!course) {
    notFound();
  }

  // Find Current Lesson
  let currentLesson: any = null;
  let currentSection: any = null;

  for (const s of course.sections) {
    const l = s.lessons.find((item) => item.slug === lessonSlug);
    if (l) {
      currentLesson = l;
      currentSection = s;
      break;
    }
  }

  if (!currentLesson) {
    notFound();
  }

  // Check Access / Enrollment / Content Gate
  let isEnrolled = false;
  let completedLessonIds: string[] = [];
  let userProgressPercent = 0;
  let certificateCode: string | null = null;

  if (userId) {
    const userRole = session?.user?.role;
    const isStaff =
      userRole === "ADMIN" ||
      userRole === "SUPER_ADMIN" ||
      (userRole === "INSTRUCTOR" && course.instructorId === userId);

    if (isStaff) {
      isEnrolled = true;
    } else {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: { userId, courseId: course.id },
        },
      });

      if (enrollment && enrollment.status === "ACTIVE") {
        isEnrolled = true;
        userProgressPercent = enrollment.progressPercent;
      }
    }

    // Get user completed lessons
    const userProgresses = await prisma.lessonProgress.findMany({
      where: {
        userId,
        isCompleted: true,
        lesson: { section: { courseId: course.id } },
      },
      select: { lessonId: true },
    });

    completedLessonIds = userProgresses.map((p) => p.lessonId);

    // Get Certificate if exists
    const cert = await prisma.certificate.findUnique({
      where: {
        userId_courseId: { userId, courseId: course.id },
      },
    });
    if (cert) certificateCode = cert.certificateCode;
  }

  // If not enrolled AND lesson is NOT free preview -> Block access
  const canAccessLesson = isEnrolled || currentLesson.isPreview;

  // Security Hardening: Redact private video URLs and paid content before serializing to client
  const safeSections = course.sections.map((sec) => ({
    ...sec,
    lessons: sec.lessons.map((les) => {
      const allowed = isEnrolled || les.isPreview;
      return {
        ...les,
        videoUrl: allowed ? les.videoUrl : null,
        contentBody: allowed ? les.contentBody : null,
        attachments: allowed ? les.attachments : [],
      };
    }),
  }));

  const safeCourse = {
    ...course,
    sections: safeSections,
  };

  const safeCurrentLesson = {
    ...currentLesson,
    videoUrl: canAccessLesson ? currentLesson.videoUrl : null,
    contentBody: canAccessLesson ? currentLesson.contentBody : null,
    attachments: canAccessLesson ? currentLesson.attachments : [],
  };

  // Flatten all lessons to compute Next / Prev buttons with sanitized payloads
  const allLessons: any[] = [];
  safeSections.forEach((sec) => {
    sec.lessons.forEach((les) => {
      allLessons.push({
        ...les,
        sectionTitle: sec.title,
      });
    });
  });

  const currentIndex = allLessons.findIndex((l) => l.id === currentLesson.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  return (
    <LessonPlayerClient
      course={serializePrisma(safeCourse)}
      currentSection={currentSection}
      currentLesson={safeCurrentLesson}
      allLessons={allLessons}
      prevLesson={prevLesson}
      nextLesson={nextLesson}
      canAccessLesson={canAccessLesson}
      isEnrolled={isEnrolled}
      completedLessonIds={completedLessonIds}
      userProgressPercent={userProgressPercent}
      certificateCode={certificateCode}
      userId={userId}
      userName={session?.user?.name || "Học viên"}
    />
  );
}
