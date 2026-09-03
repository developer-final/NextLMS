import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import PostEditForm from "./PostEditForm";

export const dynamic = "force-dynamic";

interface AdminPostEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminPostEditPage({ params }: AdminPostEditPageProps) {
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

  const { id } = await params;

  const [post, categories] = await Promise.all([
    prisma.blogPost.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true } },
        category: true,
        tags: true,
        attachments: true,
      },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { orderIndex: "asc" },
    }),
  ]);

  if (!post) {
    notFound();
  }

  if (user.role === "INSTRUCTOR" && post.authorId !== user.id) {
    redirect("/admin/posts");
  }

  return (
    <PostEditForm
      post={serializePrisma(post) as any}
      categories={categories}
    />
  );
}
