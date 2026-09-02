import { prisma } from "@/lib/prisma";
import CategoriesListClient from "./CategoriesListClient";
import { BookOpen } from "lucide-react";

export const revalidate = 0;

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    include: {
      _count: { select: { courses: true } },
    },
    orderBy: { orderIndex: "asc" },
  });

  return <CategoriesListClient initialCategories={categories} />;
}

