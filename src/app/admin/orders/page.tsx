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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">
            Quản lý Đơn hàng & Kích hoạt Khóa học
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Kiểm tra thông tin chuyển khoản VietQR, xem ảnh biên lai và duyệt kích hoạt 1 chạm
          </p>
        </div>
      </div>

      <OrderListClient initialOrders={orders} />
    </div>
  );
}
