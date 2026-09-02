import { prisma } from "@/lib/prisma";
import CategoriesClient from "./CategoriesClient";

export const revalidate = 0;

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { courses: true } },
    },
    orderBy: { orderIndex: "asc" },
  });

  return <CategoriesClient categories={categories} />;
}

