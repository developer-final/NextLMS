import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import OrderListClient from "./OrderListClient";

export const revalidate = 0;

interface AdminOrdersPageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
  }>;
}

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    redirect("/admin/courses");
  }

  const { page, q, status } = await searchParams;

  const pageSize = 10;
  const currentPage = Math.max(1, parseInt(page || "1", 10));

  const whereClause: any = {};

  if (status && status !== "ALL") {
    whereClause.status = status;
  }

  if (q && q.trim()) {
    const trimmedQ = q.trim();
    whereClause.OR = [
      { orderCode: { contains: trimmedQ } },
      { user: { name: { contains: trimmedQ } } },
      { user: { email: { contains: trimmedQ } } },
    ];
  }

  const [totalOrders, orders] = await Promise.all([
    prisma.order.count({ where: whereClause }),
    prisma.order.findMany({
      where: whereClause,
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
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalOrders / pageSize));

  return (
    <OrderListClient
      initialOrders={serializePrisma(orders)}
      currentSearch={q || ""}
      currentStatus={status || "ALL"}
      pagination={{
        currentPage,
        totalPages,
        totalItems: totalOrders,
        pageSize,
      }}
    />
  );
}


