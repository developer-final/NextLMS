import { prisma } from "@/lib/prisma";
import { getSystemSettings, DEFAULT_CONFIG } from "@/lib/config";
import { serializePrisma } from "@/lib/utils";
import { resolveServerNiche } from "@/lib/server-niche";
import HomePageClient from "./HomePageClient";

export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams?: Promise<{
    niche?: string;
    brand?: string;
    teacher?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  let settings = DEFAULT_CONFIG;
  let featuredCourses: any[] = [];
  let categories: any[] = [];
  let firstFreeCourse: { slug: string } | null = null;

  const resolvedParams = searchParams ? await searchParams : {};
  const { nicheConfig, activeTeacher } = await resolveServerNiche(resolvedParams);

  try {
    const courseWhere: any = { status: "PUBLISHED" };
    const categoryWhere: any = { isActive: true };
    const freeCourseWhere: any = { status: "PUBLISHED", isFree: true };

    if (nicheConfig.categorySlugs.length > 0) {
      courseWhere.category = { slug: { in: nicheConfig.categorySlugs } };
      categoryWhere.slug = { in: nicheConfig.categorySlugs };
      freeCourseWhere.category = { slug: { in: nicheConfig.categorySlugs } };
    }

    [settings, featuredCourses, categories, firstFreeCourse] = await Promise.all([
      getSystemSettings(),
      prisma.course.findMany({
        where: courseWhere,
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
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        take: 6,
      }),
      prisma.category.findMany({
        where: categoryWhere,
        include: {
          _count: {
            select: { courses: true },
          },
        },
        orderBy: { orderIndex: "asc" },
      }),
      prisma.course.findFirst({
        where: freeCourseWhere,
        select: { slug: true },
      }),
    ]);

    // Fallback if niche specific data yields 0 courses
    if (featuredCourses.length === 0) {
      featuredCourses = await prisma.course.findMany({
        where: { status: "PUBLISHED" },
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
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        take: 6,
      });
    }

    if (categories.length === 0) {
      categories = await prisma.category.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: { courses: true },
          },
        },
        orderBy: { orderIndex: "asc" },
      });
    }

    if (!firstFreeCourse) {
      firstFreeCourse = await prisma.course.findFirst({
        where: { status: "PUBLISHED", isFree: true },
        select: { slug: true },
      });
    }
  } catch (error) {
    console.error("[HomePage] Failed to load initial data during render:", error);
  }

  // If activeTeacher is provided, customize instructor name for demo immersion
  if (activeTeacher?.trim() && featuredCourses.length > 0) {
    featuredCourses = featuredCourses.map((c) => ({
      ...c,
      instructor: {
        ...c.instructor,
        name: activeTeacher.trim(),
      },
    }));
  }

  const freeCourseHref = firstFreeCourse
    ? `/courses/${firstFreeCourse.slug}`
    : `/courses?type=free`;

  return (
    <HomePageClient
      settings={settings}
      featuredCourses={serializePrisma(featuredCourses) as any}
      categories={categories}
      freeCourseHref={freeCourseHref}
      nicheConfig={nicheConfig}
    />
  );
}
