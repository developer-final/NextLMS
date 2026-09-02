import { prisma } from "@/lib/prisma";
import OrderListClient from "./OrderListClient";

export const revalidate = 0;

export default async function AdminOrdersPage() {
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

