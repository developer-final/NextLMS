import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PostCreateForm from "./PostCreateForm";

export const dynamic = "force-dynamic";

export default async function AdminNewPostPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/admin/posts/new");
  }

  const user = session.user;
  const isStaff =
    user.role === "ADMIN" ||
    user.role === "SUPER_ADMIN" ||
    user.role === "INSTRUCTOR";

  if (!isStaff) {
    redirect("/");
  }

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { orderIndex: "asc" },
  });

  return <PostCreateForm categories={categories} />;
}
