import { prisma } from "@/lib/prisma";
import CoursesPageClient from "./CoursesPageClient";

export const revalidate = 0;

interface CoursesPageProps {
  searchParams: Promise<{
    category?: string;
    level?: string;
    type?: string; // free | paid
    q?: string;
  }>;
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const { category, level, type, q } = await searchParams;

  const whereClause: any = {
    status: "PUBLISHED",
  };

  if (category) {
    whereClause.category = { slug: category };
  }

  if (level) {
    whereClause.level = level;
  }

  if (type === "free") {
    whereClause.isFree = true;
  } else if (type === "paid") {
    whereClause.isFree = false;
  }

  if (q) {
    whereClause.OR = [
      { title: { contains: q } },
      { shortDescription: { contains: q } },
    ];
  }

  const [courses, categories] = await Promise.all([
    prisma.course.findMany({
      where: whereClause,
      include: {
        instructor: {
          select: { name: true, avatarUrl: true, headline: true },
        },
        category: {
          select: { name: true, slug: true },
        },
        sections: {
          include: {
            lessons: {
              select: { id: true, videoDuration: true },
            },
          },
        },
        _count: {
          select: { enrollments: true, reviews: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { courses: true } },
      },
      orderBy: { orderIndex: "asc" },
    }),
  ]);

  return (
    <CoursesPageClient
      courses={courses as any}
      categories={categories}
      category={category}
    />
  );
}
