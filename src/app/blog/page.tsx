import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import BlogPageClient from "./BlogPageClient";

export const revalidate = 180; // ISR: 3 minutes

export const metadata: Metadata = {
  title: "Blog Kiến Thức & Phân Tích Giao Dịch | World Trading Lab",
  description:
    "Cập nhật các bài viết phân tích thị trường, chiến lược Price Action, SMC và cẩm nang đầu tư tài chính thực chiến từ chuyên gia.",
  keywords: [
    "Blog Trading",
    "Kinh nghiệm giao dịch",
    "Phân tích kỹ thuật",
    "Price Action",
    "SMC",
    "World Trading Lab",
  ],
  openGraph: {
    title: "Blog Kiến Thức & Phân Tích Giao Dịch | World Trading Lab",
    description:
      "Cập nhật các bài viết phân tích thị trường, chiến lược Price Action, SMC và cẩm nang đầu tư tài chính thực chiến từ chuyên gia.",
    type: "website",
  },
};

interface BlogPageProps {
  searchParams: Promise<{
    category?: string;
    tag?: string;
    q?: string;
    page?: string;
  }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { category, tag, q, page } = await searchParams;

  const pageSize = 9;
  const currentPage = Math.max(1, parseInt(page || "1", 10));

  const whereClause: any = {
    status: "PUBLISHED",
  };

  if (category && category !== "ALL") {
    whereClause.category = { slug: category };
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

  const [totalPosts, posts, categories, featuredPost] = await Promise.all([
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
    currentPage === 1 && !category && !tag && !q
      ? prisma.blogPost.findFirst({
          where: { status: "PUBLISHED", isFeatured: true },
          include: {
            author: { select: { id: true, name: true, avatarUrl: true, headline: true } },
            category: { select: { id: true, name: true, slug: true } },
            tags: { select: { id: true, name: true, slug: true } },
          },
          orderBy: { publishedAt: "desc" },
        })
      : null,
  ]);

  const totalPages = Math.max(1, Math.ceil(totalPosts / pageSize));

  return (
    <BlogPageClient
      posts={serializePrisma(posts) as any}
      featuredPost={featuredPost ? (serializePrisma(featuredPost) as any) : null}
      categories={categories}
      currentCategory={category}
      currentTag={tag}
      currentSearch={q}
      pagination={{
        currentPage,
        totalPages,
        totalItems: totalPosts,
        pageSize,
      }}
    />
  );
}
