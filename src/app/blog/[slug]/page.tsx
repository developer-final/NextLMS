import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { safeJsonLdStringify } from "@/lib/validation";
import BlogDetailClient from "./BlogDetailClient";

export const revalidate = 300; // ISR: 5 minutes

interface BlogDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

const getPostBySlug = cache(async (slug: string) => {
  return prisma.blogPost.findUnique({
    where: { slug },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          headline: true,
          bio: true,
          role: true,
        },
      },
      category: {
        select: { id: true, name: true, slug: true },
      },
      tags: {
        select: { id: true, name: true, slug: true },
      },
      attachments: {
        select: {
          id: true,
          fileName: true,
          fileSize: true,
          fileType: true,
          fileUrl: true,
        },
      },
    },
  });
});

export async function generateMetadata({
  params,
}: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  const siteName = process.env.APP_NAME || "NextLMS";

  if (!post || post.status !== "PUBLISHED") {
    return {
      title: `Bài Viết Không Tồn Tại | ${siteName}`,
    };
  }

  const title = `${post.metaTitle || post.title} | ${siteName} Blog`;
  const description =
    post.metaDescription ||
    post.summary ||
    `Đọc bài viết ${post.title} bởi ${post.author.name} tại ${siteName}.`;

  const baseUrl = process.env.NEXTAUTH_URL || "https://worldtradinglab.vercel.app";
  const postUrl = `${baseUrl}/blog/${post.slug}`;
  const keywords = [
    post.title,
    ...(post.tags ? post.tags.map((t) => t.name) : []),
    post.category?.name || "Blog",
    siteName,
    "Knowledge",
  ];

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: postUrl,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: postUrl,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [post.author.name],
      tags: post.tags?.map((t) => t.name),
      images: post.coverImageUrl ? [{ url: post.coverImageUrl }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: post.coverImageUrl ? [post.coverImageUrl] : [],
    },
  };
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post || post.status !== "PUBLISHED") {
    notFound();
  }

  // Increment view count asynchronously
  prisma.blogPost
    .update({
      where: { id: post.id },
      data: { viewCount: { increment: 1 } },
    })
    .catch((err) => console.error("Error incrementing post viewCount:", err));

  const tagIds = post.tags.map((t) => t.id);

  // Query related courses via tags (with fallback to category if < 3)
  let relatedCourses = await prisma.course.findMany({
    where: {
      status: "PUBLISHED",
      tags: {
        some: { id: { in: tagIds } },
      },
    },
    include: {
      instructor: { select: { name: true, avatarUrl: true } },
      category: { select: { name: true } },
      sections: {
        include: {
          lessons: { select: { id: true, videoDuration: true } },
        },
      },
      _count: { select: { enrollments: true, reviews: true } },
    },
    take: 3,
  });

  // If fewer than 3 courses found via tags, supplement with category courses
  if (relatedCourses.length < 3 && post.categoryId) {
    const existingCourseIds = relatedCourses.map((c) => c.id);
    const fallbackCourses = await prisma.course.findMany({
      where: {
        status: "PUBLISHED",
        id: { notIn: existingCourseIds },
        categoryId: post.categoryId,
      },
      include: {
        instructor: { select: { name: true, avatarUrl: true } },
        category: { select: { name: true } },
        sections: {
          include: {
            lessons: { select: { id: true, videoDuration: true } },
          },
        },
        _count: { select: { enrollments: true, reviews: true } },
      },
      take: 3 - relatedCourses.length,
    });
    relatedCourses = [...relatedCourses, ...fallbackCourses];
  }

  // Query related articles
  const relatedPosts = await prisma.blogPost.findMany({
    where: {
      status: "PUBLISHED",
      id: { not: post.id },
      OR: [
        { categoryId: post.categoryId },
        { tags: { some: { id: { in: tagIds } } } },
      ],
    },
    include: {
      author: { select: { name: true, avatarUrl: true } },
      category: { select: { name: true, slug: true } },
      tags: { select: { name: true, slug: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });

  // Construct JSON-LD Schema
  const baseUrl = process.env.NEXTAUTH_URL || "https://worldtradinglab.edu.vn";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary || post.metaDescription || post.title,
    image: post.coverImageUrl ? [post.coverImageUrl] : undefined,
    datePublished: post.publishedAt?.toISOString() || post.createdAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      "@type": "Person",
      name: post.author.name,
      jobTitle: post.author.headline || "Instructor",
    },
    publisher: {
      "@type": "Organization",
      name: process.env.APP_NAME || "NextLMS",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/favicon.ico`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${baseUrl}/blog/${post.slug}`,
    },
    keywords: post.tags?.map((t) => t.name).join(", "),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(jsonLd) }}
      />
      <BlogDetailClient
        post={serializePrisma(post) as any}
        relatedCourses={serializePrisma(relatedCourses) as any}
        relatedPosts={serializePrisma(relatedPosts) as any}
      />
    </>
  );
}
