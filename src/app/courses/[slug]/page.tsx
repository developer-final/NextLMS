import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeJsonLdStringify } from "@/lib/validation";
import { serializePrisma } from "@/lib/utils";
import { getSecureStreamUrl } from "@/lib/s3";
import CourseDetailClient from "./CourseDetailClient";

export const revalidate = 0;

interface CourseDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

const getCourseBySlug = cache(async (slug: string) => {
  return prisma.course.findUnique({
    where: { slug },
    include: {
      instructor: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          headline: true,
          bio: true,
        },
      },
      category: true,
      tags: {
        select: { id: true, name: true, slug: true },
      },
      attachments: {
        select: { id: true, fileName: true, fileSize: true, fileType: true },
      },
      sections: {
        orderBy: { orderIndex: "asc" },
        include: {
          lessons: {
            orderBy: { orderIndex: "asc" },
            include: {
              attachments: {
                select: { id: true, fileName: true, fileSize: true, fileType: true },
              },
            },
          },
        },
      },
      reviews: {
        where: { isApproved: true },
        include: {
          user: {
            select: { name: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: { enrollments: true, reviews: true },
      },
    },
  });
});

export async function generateMetadata({
  params,
}: CourseDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  const siteName = process.env.APP_NAME || "World Trading Lab";

  if (!course) {
    return {
      title: `Course Not Found | ${siteName}`,
    };
  }

  const title = `${course.title} | ${siteName}`;
  const description =
    course.shortDescription ||
    `Course ${course.title} by ${course.instructor.name} at ${siteName}.`;

  return {
    title,
    description,
    keywords: [
      course.title,
      course.category?.name || "Education",
      ...(course.tags ? course.tags.map((t) => t.name) : []),
      siteName,
      "Online Courses",
      "Education Platform",
    ],
    openGraph: {
      title,
      description,
      type: "website",
      images: course.thumbnailUrl ? [{ url: course.thumbnailUrl }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: course.thumbnailUrl ? [course.thumbnailUrl] : [],
    },
  };
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const course = await getCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  // Check enrollment
  let isEnrolled = false;
  if (userId) {
    const userRole = (session?.user as any)?.role;
    const isStaff =
      userRole === "ADMIN" ||
      userRole === "SUPER_ADMIN" ||
      (userRole === "INSTRUCTOR" && course.instructorId === userId);

    if (isStaff) {
      isEnrolled = true;
    } else {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: course.id,
          },
        },
      });
      if (enrollment && enrollment.status === "ACTIVE") {
        isEnrolled = true;
      }
    }
  }

  const totalLessons = course.sections.reduce((acc: number, s: any) => acc + s.lessons.length, 0);
  const totalDuration = course.sections.reduce(
    (acc: number, s: any) => acc + s.lessons.reduce((lAcc: number, l: any) => lAcc + l.videoDuration, 0),
    0
  );
  const totalHours = (totalDuration / 3600).toFixed(1);

  // Find first lesson to start learning
  const firstLesson = course.sections[0]?.lessons[0];

  // Course JSON-LD Schema for Google Search Rich Snippets
  const siteName = process.env.APP_NAME || "World Trading Lab";
  const courseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.shortDescription || course.title,
    provider: {
      "@type": "Organization",
      name: siteName,
      sameAs: process.env.NEXTAUTH_URL || "https://worldtradinglab.vercel.app",
    },
    instructor: {
      "@type": "Person",
      name: course.instructor.name,
    },
    offers: {
      "@type": "Offer",
      price: course.isFree ? "0" : (course.salePrice ?? course.price).toString(),
      priceCurrency: "VND",
      category: course.isFree ? "Free" : "Paid",
      availability: "https://schema.org/InStock",
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: `PT${totalHours}H`,
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://worldtradinglab.edu.vn",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Courses",
        item: "https://worldtradinglab.edu.vn/courses",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: course.title,
        item: `https://worldtradinglab.edu.vn/courses/${course.slug}`,
      },
    ],
  };

  return (
    <>
      {/* Schema.org Structured Data with script breakout protection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(courseJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(breadcrumbJsonLd) }}
      />
      <CourseDetailClient
        course={serializePrisma({
          ...course,
          introVideoUrl: course.introVideoUrl
            ? await getSecureStreamUrl(course.introVideoUrl, 7200)
            : null,
        })}
        isEnrolled={isEnrolled}
        totalLessons={totalLessons}
        totalHours={totalHours}
        firstLesson={firstLesson}
      />
    </>
  );
}
