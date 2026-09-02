import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CourseDetailClient from "./CourseDetailClient";

export const revalidate = 0;

interface CourseDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: CourseDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      instructor: { select: { name: true } },
      category: { select: { name: true } },
    },
  });

  if (!course) {
    return {
      title: "Course Not Found | World Trading Lab",
    };
  }

  const title = `${course.title} | World Trading Lab`;
  const description =
    course.shortDescription ||
    `Course ${course.title} by ${course.instructor.name} at World Trading Lab.`;

  return {
    title,
    description,
    keywords: [
      course.title,
      course.category?.name || "Trading",
      "World Trading Lab",
      "Online Courses",
      "Trading Education",
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
  const userId = (session?.user as any)?.id;

  const course = await prisma.course.findUnique({
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
      sections: {
        orderBy: { orderIndex: "asc" },
        include: {
          lessons: {
            orderBy: { orderIndex: "asc" },
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

  if (!course) {
    notFound();
  }

  // Check enrollment
  let isEnrolled = false;
  if (userId) {
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

  const totalLessons = course.sections.reduce((acc: number, s: any) => acc + s.lessons.length, 0);
  const totalDuration = course.sections.reduce(
    (acc: number, s: any) => acc + s.lessons.reduce((lAcc: number, l: any) => lAcc + l.videoDuration, 0),
    0
  );
  const totalHours = (totalDuration / 3600).toFixed(1);

  // Find first lesson to start learning
  const firstLesson = course.sections[0]?.lessons[0];

  // Course JSON-LD Schema for Google Search Rich Snippets
  const courseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.shortDescription || course.title,
    provider: {
      "@type": "Organization",
      name: "World Trading Lab",
      sameAs: "https://worldtradinglab.edu.vn",
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
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <CourseDetailClient
        course={course}
        isEnrolled={isEnrolled}
        totalLessons={totalLessons}
        totalHours={totalHours}
        firstLesson={firstLesson}
      />
    </>
  );
}
