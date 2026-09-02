import { prisma } from "@/lib/prisma";
import CategoriesListClient from "./CategoriesListClient";
import { BookOpen } from "lucide-react";

export const revalidate = 0;

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    include: {
      _count: { select: { courses: true } },
    },
    orderBy: { orderIndex: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
          <BookOpen className="h-7 w-7 text-indigo-400" /> Quản lý Danh Mục & Chuyên Ngành Đào Tạo
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Tạo mới, chỉnh sửa và sắp xếp thứ tự hiển thị các chuyên mục khóa học trên website
        </p>
      </div>

      <CategoriesListClient initialCategories={categories} />
    </div>
  );
}
