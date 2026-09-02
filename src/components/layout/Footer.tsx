import { getSystemSettings } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import FooterClient from "./FooterClient";

export default async function Footer() {
  const [settings, categories] = await Promise.all([
    getSystemSettings(),
    prisma.category.findMany({
      where: { isActive: true },
      take: 4,
      orderBy: { orderIndex: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  return <FooterClient settings={settings} categories={categories} />;
}
