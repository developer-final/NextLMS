import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const revalidate = 0;

interface LearnCoursePageProps {
  params: Promise<{
    courseSlug: string;
  }>;
}

export default async function LearnCoursePage({ params }: LearnCoursePageProps) {
  const { courseSlug } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect(`/auth/login?callbackUrl=/learn/${courseSlug}`);
  }

  const course = await prisma.course.findUnique({
    where: { slug: courseSlug },
    include: {
      sections: {
        orderBy: { orderIndex: "asc" },
        include: {
          lessons: {
            orderBy: { orderIndex: "asc" },
            select: { id: true, slug: true },
          },
        },
      },
    },
  });

  if (!course) {
    notFound();
  }

  // Check enrollment
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId: course.id,
      },
    },
  });

  // If not enrolled and not admin/instructor, redirect to course page
  const userRole = session.user.role;
  const isPrivileged =
    userRole === "ADMIN" ||
    userRole === "SUPER_ADMIN" ||
    course.instructorId === session.user.id;

  if (!enrollment && !isPrivileged) {
    redirect(`/courses/${courseSlug}`);
  }

  // Find next uncompleted lesson or first lesson
  const allLessons = course.sections.flatMap((s) => s.lessons);
  if (allLessons.length === 0) {
    redirect(`/courses/${courseSlug}`);
  }

  // Check user progress to resume from the next lesson
  const progressList = await prisma.lessonProgress.findMany({
    where: {
      userId: session.user.id,
      lessonId: { in: allLessons.map((l) => l.id) },
      isCompleted: true,
    },
    select: { lessonId: true },
  });

  const completedSet = new Set(progressList.map((p) => p.lessonId));
  const nextLesson = allLessons.find((l) => !completedSet.has(l.id)) || allLessons[0];

  redirect(`/learn/${courseSlug}/${nextLesson.slug}`);
}
