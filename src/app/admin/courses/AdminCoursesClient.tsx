"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { formatVND } from "@/lib/utils";
import {
  Edit2,
  ExternalLink,
  PlusCircle,
  Search,
  Star,
  Trash2,
  AlertTriangle,
  Layers,
  BookOpen,
} from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import Pagination from "@/components/ui/Pagination";

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
}

interface AdminCoursesClientProps {
  courses: any[];
  currentSearch?: string;
  currentStatus?: string;
  pagination: PaginationInfo;
}

export default function AdminCoursesClient({
  courses: initialCourses,
  currentSearch = "",
  currentStatus = "ALL",
  pagination,
}: AdminCoursesClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();

  const [courses, setCourses] = useState<any[]>(initialCourses);
  const [search, setSearch] = useState(currentSearch);
  const [filterStatus, setFilterStatus] = useState<string>(currentStatus);
  const [courseToDelete, setCourseToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setCourses(initialCourses);
  }, [initialCourses]);

  useEffect(() => {
    setSearch(currentSearch);
  }, [currentSearch]);

  useEffect(() => {
    setFilterStatus(currentStatus);
  }, [currentStatus]);

  const buildUrl = (pageNumber: number, statusVal?: string, searchVal?: string) => {
    const params = new URLSearchParams();
    const s = statusVal !== undefined ? statusVal : filterStatus;
    const q = searchVal !== undefined ? searchVal : search;
    if (s && s !== "ALL") params.set("status", s);
    if (q && q.trim()) params.set("q", q.trim());
    if (pageNumber > 1) params.set("page", pageNumber.toString());
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(buildUrl(1, filterStatus, search));
  };

  const handleStatusChange = (newStatus: string) => {
    setFilterStatus(newStatus);
    router.push(buildUrl(1, newStatus, search));
  };

  const filtered = courses;

  // Toggle Publish / Draft
  const handleToggleStatus = async (courseId: string, currentStatus: string) => {
    const newStatus = currentStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    // Optimistic update
    setCourses((prev) =>
      prev.map((c) => (c.id === courseId ? { ...c, status: newStatus } : c))
    );

    try {
      const res = await fetch("/api/admin/courses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: courseId, status: newStatus }),
      });

      if (!res.ok) {
        throw new Error();
      }
      toast.success(t.admin.courses.statusUpdated);
      router.refresh();
    } catch {
      // Rollback on error
      setCourses((prev) =>
        prev.map((c) => (c.id === courseId ? { ...c, status: currentStatus } : c))
      );
      toast.error("Lỗi cập nhật trạng thái");
    }
  };

  // Toggle Featured
  const handleToggleFeatured = async (courseId: string, currentFeatured: boolean) => {
    const newFeatured = !currentFeatured;
    // Optimistic update
    setCourses((prev) =>
      prev.map((c) => (c.id === courseId ? { ...c, isFeatured: newFeatured } : c))
    );

    try {
      const res = await fetch("/api/admin/courses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: courseId, isFeatured: newFeatured }),
      });

      if (!res.ok) {
        throw new Error();
      }
      toast.success(t.admin.courses.featuredUpdated);
      router.refresh();
    } catch {
      // Rollback on error
      setCourses((prev) =>
        prev.map((c) => (c.id === courseId ? { ...c, isFeatured: currentFeatured } : c))
      );
      toast.error("Lỗi cập nhật");
    }
  };

  // Delete course
  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/admin/courses?id=${courseToDelete.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t.admin.courses.deleteError);
        return;
      }

      toast.success(t.admin.courses.deleteSuccess);
      setCourses((prev) => prev.filter((c) => c.id !== courseToDelete.id));
      setCourseToDelete(null);
      router.refresh();
    } catch (err) {
      toast.error(t.admin.courses.deleteError);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">{t.admin.courses.title}</h1>
          <p className="text-xs text-slate-400 mt-1">
            {t.admin.courses.subtitle} ({pagination.totalItems})
          </p>
        </div>

        <Link
          href="/admin/courses/new"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-400 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-glow transition-all"
        >
          <PlusCircle className="h-4 w-4" /> {t.admin.courses.addCourseBtn}
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {[
            { key: "ALL", label: t.admin.courses.allStatus },
            { key: "PUBLISHED", label: t.admin.courses.published },
            { key: "DRAFT", label: t.admin.courses.draft },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleStatusChange(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterStatus === tab.key
                  ? "bg-brand-500 text-slate-950 shadow-glow"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.admin.courses.searchPlaceholder}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
          />
        </form>
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
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-500">
                  {t.admin.courses.noCoursesFound}
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const totalLessons = c.sections?.reduce(
                  (acc: number, s: any) => acc + (s._count?.lessons ?? s.lessons?.length ?? 0),
                  0
                ) || 0;

                return (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Title + Thumbnail + Featured */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          <img
                            src={
                              c.thumbnailUrl ||
                              "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=150&q=80"
                            }
                            alt={c.title}
                            className="h-12 w-20 object-cover rounded-lg border border-slate-800"
                          />
                          <button
                            type="button"
                            onClick={() => handleToggleFeatured(c.id, c.isFeatured)}
                            title={c.isFeatured ? "Featured course" : "Mark as featured"}
                            className={`absolute -top-1.5 -right-1.5 p-1 rounded-full border shadow-sm transition-all ${
                              c.isFeatured
                                ? "bg-amber-500 text-slate-950 border-amber-300"
                                : "bg-slate-900 text-slate-500 border-slate-700 hover:text-amber-400"
                            }`}
                          >
                            <Star className="h-3 w-3 fill-current" />
                          </button>
                        </div>

                        <div>
                          <Link
                            href={`/admin/courses/${c.id}/edit`}
                            className="font-bold text-white hover:text-brand-400 block line-clamp-1"
                          >
                            {c.title}
                          </Link>
                          <span className="text-[10px] text-slate-400">
                            {t.admin.courses.authorLabel} {c.instructor?.name || "Admin"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-5 py-4">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
                        {c.category?.name || t.admin.courses.uncategorized}
                      </span>
                    </td>

                    {/* Tuition */}
                    <td className="px-5 py-4 font-bold text-white">
                      {c.isFree ? (
                        <span className="text-brand-400">{t.admin.courses.free}</span>
                      ) : (
                        formatVND(c.salePrice || c.price)
                      )}
                    </td>

                    {/* Structure */}
                    <td className="px-5 py-4 text-slate-400">
                      {c.sections?.length || 0} {t.admin.courses.chaptersLessons.split("•")[0]} •{" "}
                      {totalLessons} {t.admin.courses.chaptersLessons.split("•")[1] || "lessons"}
                    </td>

                    {/* Students */}
                    <td className="px-5 py-4 font-bold text-purple-400">
                      {c._count?.enrollments || 0} {t.admin.courses.studentsHeader.toLowerCase()}
                    </td>

                    {/* Status Toggle Badge */}
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(c.id, c.status)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                          c.status === "PUBLISHED"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-emerald-900"
                            : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700"
                        }`}
                        title="Click to toggle publish status"
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            c.status === "PUBLISHED" ? "bg-emerald-400" : "bg-slate-500"
                          }`}
                        />
                        {c.status === "PUBLISHED"
                          ? t.admin.courses.published
                          : t.admin.courses.draft}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/courses/${c.slug}`}
                          target="_blank"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title={t.admin.courses.viewPage}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>

                        <Link
                          href={`/admin/courses/${c.id}/edit`}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-brand-500 hover:text-slate-950 text-slate-300 transition-colors"
                          title={t.admin.courses.editBtn}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => setCourseToDelete(c)}
                          className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 transition-colors"
                          title={t.admin.courses.deleteBtn}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Reusable Server Pagination */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        pageSize={pagination.pageSize}
        buildPageUrl={(page) => buildUrl(page)}
      />

      {/* Confirmation Modal Delete */}
      {courseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="relative max-w-md w-full rounded-3xl border border-rose-900/60 bg-slate-900 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="h-10 w-10 rounded-2xl bg-rose-950 flex items-center justify-center border border-rose-800">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{t.admin.courses.deleteBtn}</h3>
                <p className="text-[11px] text-slate-400">{courseToDelete.title}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {t.admin.courses.deleteConfirm}
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setCourseToDelete(null)}
                className="rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                {t.admin.categories.cancelBtn}
              </button>
              <button
                type="button"
                onClick={handleDeleteCourse}
                disabled={deleting}
                className="rounded-xl bg-rose-600 hover:bg-rose-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg disabled:opacity-50 transition-all"
              >
                {deleting ? "Đang xóa..." : t.admin.courses.deleteBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
