import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CategoriesListClient from "./CategoriesListClient";

export const revalidate = 0;

export default async function AdminCategoriesPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    redirect("/admin/courses");
  }

  const categories = await prisma.category.findMany({
    include: {
      _count: { select: { courses: true } },
    },
    orderBy: { orderIndex: "asc" },
  });

  return <CategoriesListClient initialCategories={categories} />;
}


