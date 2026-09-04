import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import {
  COOKIE_NICHE_KEY,
  COOKIE_TEACHER_KEY,
  resolveNicheConfig,
} from "@/lib/niches";
import CoursesPageClient from "./CoursesPageClient";

export const dynamic = "force-dynamic";

interface CoursesPageProps {
  searchParams: Promise<{
    category?: string;
    tag?: string;
    level?: string;
    type?: string; // free | paid
    q?: string;
    page?: string;
    niche?: string;
    brand?: string;
    teacher?: string;
  }>;
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const { category, tag, level, type, q, page, niche, teacher } = await searchParams;
  const cookieStore = await cookies();

  const activeNiche = niche || cookieStore.get(COOKIE_NICHE_KEY)?.value;
  const activeTeacher = teacher || cookieStore.get(COOKIE_TEACHER_KEY)?.value;
  const nicheConfig = resolveNicheConfig(activeNiche);

  const pageSize = 6;
  const currentPage = Math.max(1, parseInt(page || "1", 10));

  const whereClause: any = {
    status: "PUBLISHED",
  };

  if (category) {
    whereClause.category = { slug: category };
  } else if (activeNiche && nicheConfig.categorySlugs.length > 0) {
    whereClause.category = { slug: { in: nicheConfig.categorySlugs } };
  }

  if (tag) {
    whereClause.tags = { some: { slug: tag } };
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
      { tags: { some: { name: { contains: q, mode: "insensitive" } } } },
    ];
  }

  let [totalCourses, courses, categories] = await Promise.all([
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
        tags: {
          select: { id: true, name: true, slug: true },
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

  // Fallback if niche filter had 0 results
  if (courses.length === 0 && !category && !tag && !level && !type && !q) {
    const fallbackWhere: any = { status: "PUBLISHED" };
    const [fallbackCount, fallbackCourses] = await Promise.all([
      prisma.course.count({ where: fallbackWhere }),
      prisma.course.findMany({
        where: fallbackWhere,
        include: {
          instructor: {
            select: { name: true, avatarUrl: true, headline: true },
          },
          category: {
            select: { name: true, slug: true },
          },
          tags: {
            select: { id: true, name: true, slug: true },
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
    ]);
    totalCourses = fallbackCount;
    courses = fallbackCourses;
  }

  // Customize instructor if teacher param provided
  if (activeTeacher?.trim() && courses.length > 0) {
    courses = courses.map((c) => ({
      ...c,
      instructor: {
        ...c.instructor,
        name: activeTeacher.trim(),
      },
    }));
  }

  const totalPages = Math.max(1, Math.ceil(totalCourses / pageSize));

  return (
    <CoursesPageClient
      courses={serializePrisma(courses) as any}
      categories={categories}
      category={category}
      tag={tag}
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
