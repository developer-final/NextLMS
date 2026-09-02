import { prisma } from "@/lib/prisma";
import CoursesPageClient from "./CoursesPageClient";

export const revalidate = 180; // ISR: 3 minutes

interface CoursesPageProps {
  searchParams: Promise<{
    category?: string;
    level?: string;
    type?: string; // free | paid
    q?: string;
    page?: string;
  }>;
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const { category, level, type, q, page } = await searchParams;

  const pageSize = 6;
  const currentPage = Math.max(1, parseInt(page || "1", 10));

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
      { title: { contains: q, mode: "insensitive" } },
      { shortDescription: { contains: q, mode: "insensitive" } },
    ];
  }

  const [totalCourses, courses, categories] = await Promise.all([
    prisma.course.count({ where: whereClause }),
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
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { courses: true } },
      },
      orderBy: { orderIndex: "asc" },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCourses / pageSize));

  return (
    <CoursesPageClient
      courses={courses as any}
      categories={categories}
      category={category}
      level={level}
      type={type}
      q={q}
      pagination={{
        currentPage,
        totalPages,
        totalItems: totalCourses,
        pageSize,
      }}
    />
  );
}
