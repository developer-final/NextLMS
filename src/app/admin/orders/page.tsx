import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OrderListClient from "./OrderListClient";

export const revalidate = 0;

export default async function AdminOrdersPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    redirect("/admin/courses");
  }

  const orders = await prisma.order.findMany({
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      orderItems: {
        include: {
          course: {
            select: { id: true, title: true, slug: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return <OrderListClient initialOrders={orders} />;
}


