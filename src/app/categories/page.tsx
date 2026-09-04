import { prisma } from "@/lib/prisma";
import { resolveServerNiche } from "@/lib/server-niche";
import CategoriesClient from "./CategoriesClient";

export const dynamic = "force-dynamic";

interface CategoriesPageProps {
  searchParams?: Promise<{
    niche?: string;
    brand?: string;
    teacher?: string;
  }>;
}

export default async function CategoriesPage({ searchParams }: CategoriesPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const { nicheConfig } = await resolveServerNiche(resolvedParams);

  const categoryWhere: any = { isActive: true };
  if (nicheConfig.categorySlugs.length > 0) {
    categoryWhere.slug = { in: nicheConfig.categorySlugs };
  }

  let categories = await prisma.category.findMany({
    where: categoryWhere,
    include: {
      _count: { select: { courses: true } },
    },
    orderBy: { orderIndex: "asc" },
  });

  if (categories.length === 0) {
    categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { courses: true } },
      },
      orderBy: { orderIndex: "asc" },
    });
  }

  return <CategoriesClient categories={categories} nicheConfig={nicheConfig} />;
}
