import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AffiliateClient from "./AffiliateClient";

export const metadata = {
  title: "Affiliate & Partner Hub | World Trading Lab",
  description: "Share courses and earn automatic commissions with our partner program.",
};

export default async function AffiliatePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/affiliate");
  }

  // Fetch list of published courses for link generation
  const courses = await prisma.course.findMany({
    where: { status: "PUBLISHED", deletedAt: null },
    select: {
      id: true,
      title: true,
      slug: true,
      price: true,
      salePrice: true,
      thumbnailUrl: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const serializedCourses = courses.map((c) => ({
    ...c,
    price: Number(c.price),
    salePrice: c.salePrice !== null ? Number(c.salePrice) : null,
  }));

  return <AffiliateClient courses={serializedCourses} />;
}
