import { prisma } from "@/lib/prisma";
import CouponsListClient from "./CouponsListClient";
import { Tag } from "lucide-react";

export const revalidate = 0;

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
  });

  return <CouponsListClient initialCoupons={coupons} />;
}

