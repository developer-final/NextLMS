"use client";

import Link from "next/link";
import { formatVND } from "@/lib/utils";
import { PlusCircle } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface AdminCoursesClientProps {
  courses: any[];
}

export default function AdminCoursesClient({ courses }: AdminCoursesClientProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">{t.admin.courses.title}</h1>
          <p className="text-xs text-slate-400 mt-1">
            {t.admin.courses.subtitle} ({courses.length})
          </p>
        </div>

        <Link
          href="/admin/courses/new"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-400 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-glow transition-all"
        >
          <PlusCircle className="h-4 w-4" /> {t.admin.courses.addCourseBtn}
        </Link>
      </div>

      {/* Course List Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 uppercase text-[11px] font-bold text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-5 py-3.5">{t.admin.courses.courseHeader}</th>
              <th className="px-5 py-3.5">{t.admin.courses.categoryHeader}</th>
              <th className="px-5 py-3.5">{t.admin.courses.tuitionHeader}</th>
              <th className="px-5 py-3.5">{t.admin.courses.structureHeader}</th>
              <th className="px-5 py-3.5">{t.admin.courses.studentsHeader}</th>
              <th className="px-5 py-3.5">{t.admin.courses.statusHeader}</th>
              <th className="px-5 py-3.5 text-right">{t.admin.courses.actionHeader}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {courses.map((c) => {
              const totalLessons = c.sections.reduce((acc: number, s: any) => acc + s.lessons.length, 0);

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
                          {t.admin.courses.authorLabel} {c.instructor.name}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
                      {c.category?.name || t.admin.courses.uncategorized}
                    </span>
                  </td>

                  <td className="px-5 py-4 font-bold text-white">
                    {c.isFree ? (
                      <span className="text-brand-400">{t.admin.courses.free}</span>
                    ) : (
                      formatVND(c.salePrice || c.price)
                    )}
                  </td>

                  <td className="px-5 py-4 text-slate-400">
                    {c.sections.length} {t.admin.courses.chaptersLessons.split("•")[0]} • {totalLessons} {t.admin.courses.chaptersLessons.split("•")[1] || "lessons"}
                  </td>

                  <td className="px-5 py-4 font-bold text-purple-400">
                    {c._count.enrollments} {t.admin.courses.studentsHeader.toLowerCase()}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === "PUBLISHED"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {c.status === "PUBLISHED" ? t.admin.courses.published : t.admin.courses.draft}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/courses/${c.slug}`}
                      target="_blank"
                      className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors"
                    >
                      {t.admin.courses.viewPage}
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
