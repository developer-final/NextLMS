import { getSystemSettings } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import FooterClient from "./FooterClient";

export default async function Footer() {
  const settings = await getSystemSettings();
  let categories: { id: string; name: string; slug: string }[] = [];

  try {
    categories = await prisma.category.findMany({
      where: { isActive: true },
      take: 4,
      orderBy: { orderIndex: "asc" },
      select: { id: true, name: true, slug: true },
    });
  } catch (error) {
    console.error("[Footer] Failed to load categories from database:", error);
  }

  return <FooterClient settings={settings} categories={categories} />;
}
