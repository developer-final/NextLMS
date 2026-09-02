import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatVND } from "@/lib/utils";
import { BookOpen, PlusCircle, Sparkles, Star, Users, Video } from "lucide-react";

export const revalidate = 0;

export default async function AdminCoursesPage() {
  const courses = await prisma.course.findMany({
    include: {
      instructor: { select: { name: true } },
      category: { select: { name: true } },
      sections: {
        include: {
          lessons: { select: { id: true } },
        },
      },
      _count: {
        select: { enrollments: true, reviews: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Quản lý Khóa học & Bài giảng</h1>
          <p className="text-xs text-slate-400 mt-1">
            Tổng cộng có {courses.length} khóa học trên hệ thống
          </p>
        </div>

        <Link
          href="/admin/courses/new"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-400 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-glow transition-all"
        >
          <PlusCircle className="h-4 w-4" /> Thêm Khóa học Mới
        </Link>
      </div>

      {/* Course List Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 uppercase text-[11px] font-bold text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-5 py-3.5">Khóa học</th>
              <th className="px-5 py-3.5">Chuyên mục</th>
              <th className="px-5 py-3.5">Học phí</th>
              <th className="px-5 py-3.5">Quy mô</th>
              <th className="px-5 py-3.5">Học viên</th>
              <th className="px-5 py-3.5">Trạng thái</th>
              <th className="px-5 py-3.5 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {courses.map((c) => {
              const totalLessons = c.sections.reduce((acc, s) => acc + s.lessons.length, 0);

              return (
                <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          c.thumbnailUrl ||
                          "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=150&q=80"
                        }
                        alt={c.title}
                        className="h-12 w-20 object-cover rounded-lg border border-slate-800 flex-shrink-0"
                      />
                      <div>
                        <Link
                          href={`/courses/${c.slug}`}
                          target="_blank"
                          className="font-bold text-white hover:text-brand-400 block line-clamp-1"
                        >
                          {c.title}
                        </Link>
                        <span className="text-[10px] text-slate-400">
                          Tác giả: {c.instructor.name}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
                      {c.category?.name || "Chưa phân loại"}
                    </span>
                  </td>

                  <td className="px-5 py-4 font-bold text-white">
                    {c.isFree ? (
                      <span className="text-brand-400">Miễn phí</span>
                    ) : (
                      formatVND(c.salePrice || c.price)
                    )}
                  </td>

                  <td className="px-5 py-4 text-slate-400">
                    {c.sections.length} chương • {totalLessons} bài học
                  </td>

                  <td className="px-5 py-4 font-bold text-purple-400">
                    {c._count.enrollments} học viên
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === "PUBLISHED"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {c.status === "PUBLISHED" ? "Đang mở bán" : "Bản nháp"}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/courses/${c.slug}`}
                      target="_blank"
                      className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors"
                    >
                      Xem trang
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
