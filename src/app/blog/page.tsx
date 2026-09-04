import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { resolveServerNiche } from "@/lib/server-niche";
import BlogPageClient from "./BlogPageClient";

export const dynamic = "force-dynamic";

interface BlogPageProps {
  searchParams: Promise<{
    category?: string;
    tag?: string;
    q?: string;
    page?: string;
    niche?: string;
    brand?: string;
    teacher?: string;
  }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const resolvedParams = await searchParams;
  const { category, tag, q, page } = resolvedParams;
  const { nicheConfig } = await resolveServerNiche(resolvedParams);

  const pageSize = 9;
  const currentPage = Math.max(1, parseInt(page || "1", 10));

  const whereClause: any = {
    status: "PUBLISHED",
  };

  if (category && category !== "ALL") {
    whereClause.category = { slug: category };
  } else if (nicheConfig.categorySlugs.length > 0) {
    whereClause.category = { slug: { in: nicheConfig.categorySlugs } };
  }

  if (tag) {
    whereClause.tags = {
      some: { slug: tag },
    };
  }

  if (q && q.trim()) {
    const trimmedQ = q.trim();
    whereClause.OR = [
      { title: { contains: trimmedQ, mode: "insensitive" } },
      { summary: { contains: trimmedQ, mode: "insensitive" } },
    ];
  }

  const categoryWhere: any = {
    isActive: true,
  };
  if (nicheConfig.categorySlugs.length > 0) {
    categoryWhere.slug = { in: nicheConfig.categorySlugs };
  }

  let [totalPosts, posts, categories, featuredPost] = await Promise.all([
    prisma.blogPost.count({ where: whereClause }),
    prisma.blogPost.findMany({
      where: whereClause,
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true, headline: true },
        },
        category: {
          select: { id: true, name: true, slug: true },
        },
        tags: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.category.findMany({
      where: categoryWhere,
      include: {
        _count: {
          select: {
            posts: { where: { status: "PUBLISHED" } },
          },
        },
      },
      orderBy: { orderIndex: "asc" },
    }),
    currentPage === 1 && !category && !tag && !q
      ? prisma.blogPost.findFirst({
          where: { ...whereClause, isFeatured: true },
          include: {
            author: { select: { id: true, name: true, avatarUrl: true, headline: true } },
            category: { select: { id: true, name: true, slug: true } },
            tags: { select: { id: true, name: true, slug: true } },
          },
        })
      : null,
  ]);

  // Fallback if 0 posts found in niche
  if (posts.length === 0 && !category && !tag && !q) {
    const fallbackWhere: any = { status: "PUBLISHED" };
    [totalPosts, posts, categories, featuredPost] = await Promise.all([
      prisma.blogPost.count({ where: fallbackWhere }),
      prisma.blogPost.findMany({
        where: fallbackWhere,
        include: {
          author: {
            select: { id: true, name: true, avatarUrl: true, headline: true },
          },
          category: {
            select: { id: true, name: true, slug: true },
          },
          tags: {
            select: { id: true, name: true, slug: true },
          },
        },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
      }),
      prisma.category.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: {
              posts: { where: { status: "PUBLISHED" } },
            },
          },
        },
        orderBy: { orderIndex: "asc" },
      }),
      currentPage === 1
        ? prisma.blogPost.findFirst({
            where: { status: "PUBLISHED", isFeatured: true },
            include: {
              author: { select: { id: true, name: true, avatarUrl: true, headline: true } },
              category: { select: { id: true, name: true, slug: true } },
              tags: { select: { id: true, name: true, slug: true } },
            },
          })
        : null,
    ]);
  }

  const totalPages = Math.max(1, Math.ceil(totalPosts / pageSize));

  return (
    <BlogPageClient
      posts={serializePrisma(posts) as any}
      featuredPost={featuredPost ? (serializePrisma(featuredPost) as any) : null}
      categories={categories}
      currentCategory={category}
      currentTag={tag}
      currentSearch={q}
      nicheConfig={nicheConfig}
      pagination={{
        currentPage,
        totalPages,
        totalItems: totalPosts,
        pageSize,
      }}
    />
  );
}
