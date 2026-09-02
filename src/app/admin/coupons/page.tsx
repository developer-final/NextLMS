import { prisma } from "@/lib/prisma";
import CouponsListClient from "./CouponsListClient";
import { Tag } from "lucide-react";

export const revalidate = 0;

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
          <Tag className="h-7 w-7 text-rose-400" /> Quản lý Mã Giảm Giá & Khuyến Mãi
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Tạo mã khuyến mãi, thiết lập tỷ lệ chiết khấu, số lượt sử dụng và thời hạn áp dụng
        </p>
      </div>

      <CouponsListClient initialCoupons={coupons} />
    </div>
  );
}
