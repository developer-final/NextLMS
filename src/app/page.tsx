import { prisma } from "@/lib/prisma";
import { getSystemSettings } from "@/lib/config";
import HomePageClient from "./HomePageClient";

export const revalidate = 0; // Dynamic data

export default async function HomePage() {
  const [settings, featuredCourses, categories, firstFreeCourse] = await Promise.all([
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

  const freeCourseHref = firstFreeCourse
    ? `/courses/${firstFreeCourse.slug}`
    : `/courses?type=free`;

  return (
    <HomePageClient
      settings={settings}
      featuredCourses={featuredCourses as any}
      categories={categories}
      freeCourseHref={freeCourseHref}
    />
  );
}
