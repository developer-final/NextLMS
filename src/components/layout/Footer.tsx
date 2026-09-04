import { getSystemSettings } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { resolveServerNiche } from "@/lib/server-niche";
import FooterClient from "./FooterClient";

export default async function Footer() {
  const settings = await getSystemSettings();
  const { nicheConfig, activeBrand } = await resolveServerNiche();

  const dynamicSettings = {
    ...settings,
    appName: activeBrand?.trim() || nicheConfig.brandName || settings.appName,
    appDescription: nicheConfig.description || settings.appDescription,
  };

  let categories: { id: string; name: string; slug: string }[] = [];

  try {
    const categoryWhere: any = { isActive: true };
    if (nicheConfig.categorySlugs.length > 0) {
      categoryWhere.slug = { in: nicheConfig.categorySlugs };
    }

    categories = await prisma.category.findMany({
      where: categoryWhere,
      take: 4,
      orderBy: { orderIndex: "asc" },
      select: { id: true, name: true, slug: true },
    });

    // Fallback if niche-specific categories not found
    if (categories.length === 0) {
      categories = await prisma.category.findMany({
        where: { isActive: true },
        take: 4,
        orderBy: { orderIndex: "asc" },
        select: { id: true, name: true, slug: true },
      });
    }
  } catch (error) {
    console.error("[Footer] Failed to load categories from database:", error);
  }

  return <FooterClient settings={dynamicSettings} categories={categories} />;
}
