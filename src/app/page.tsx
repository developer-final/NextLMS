import { prisma } from "@/lib/prisma";
import { getSystemSettings, DEFAULT_CONFIG } from "@/lib/config";
import { serializePrisma } from "@/lib/utils";
import HomePageClient from "./HomePageClient";

export const revalidate = 300; // ISR: Revalidate every 5 minutes

export default async function HomePage() {
  let settings = DEFAULT_CONFIG;
  let featuredCourses: any[] = [];
  let categories: any[] = [];
  let firstFreeCourse: { slug: string } | null = null;

  try {
    [settings, featuredCourses, categories, firstFreeCourse] = await Promise.all([
      getSystemSettings(),
      prisma.course.findMany({
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
      }),
      prisma.category.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: { courses: true },
          },
        },
        orderBy: { orderIndex: "asc" },
      }),
      prisma.course.findFirst({
        where: { status: "PUBLISHED", isFree: true },
        select: { slug: true },
      }),
    ]);
  } catch (error) {
    console.error("[HomePage] Failed to load initial data during render:", error);
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
    />
  );
}
