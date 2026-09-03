import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import AdminPostsClient from "./AdminPostsClient";

export const revalidate = 0;

interface AdminPostsPageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
    categoryId?: string;
  }>;
}

export default async function AdminPostsPage({ searchParams }: AdminPostsPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/admin/posts");
  }

  const user = session.user;
  const isStaff =
    user.role === "ADMIN" ||
    user.role === "SUPER_ADMIN" ||
    user.role === "INSTRUCTOR";

  if (!isStaff) {
    redirect("/");
  }

  const { page, q, status, categoryId } = await searchParams;

  const pageSize = 10;
  const currentPage = Math.max(1, parseInt(page || "1", 10));

  const whereClause: any = {};
  if (user.role === "INSTRUCTOR") {
    whereClause.authorId = user.id;
  }

  if (status && status !== "ALL") {
    whereClause.status = status;
  }

  if (categoryId && categoryId !== "ALL") {
    whereClause.categoryId = categoryId;
  }

  if (q && q.trim()) {
    const trimmedQ = q.trim();
    whereClause.OR = [
      { title: { contains: trimmedQ, mode: "insensitive" } },
      { summary: { contains: trimmedQ, mode: "insensitive" } },
    ];
  }

  const [totalPosts, posts, categories] = await Promise.all([
    prisma.blogPost.count({ where: whereClause }),
    prisma.blogPost.findMany({
      where: whereClause,
      include: {
        author: { select: { id: true, name: true, role: true } },
        category: { select: { id: true, name: true } },
        tags: { select: { id: true, name: true } },
        _count: {
          select: { comments: true, attachments: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { orderIndex: "asc" },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalPosts / pageSize));

  return (
    <AdminPostsClient
      posts={serializePrisma(posts)}
      categories={categories}
      currentSearch={q || ""}
      currentStatus={status || "ALL"}
      currentCategory={categoryId || "ALL"}
      pagination={{
        currentPage,
        totalPages,
        totalItems: totalPosts,
        pageSize,
      }}
    />
  );
}
