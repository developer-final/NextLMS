import { prisma } from "@/lib/prisma";
import CourseCreateForm from "./CourseCreateForm";

export const revalidate = 0;

export default async function NewCoursePage() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { orderIndex: "asc" },
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-extrabold text-white">Tạo Khóa học & Bài giảng Mới</h1>
        <p className="text-xs text-slate-400 mt-1">
          Thiết lập nội dung khóa học, video bài giảng và cơ cấu chương học
        </p>
      </div>

      <CourseCreateForm categories={categories} />
    </div>
  );
}
