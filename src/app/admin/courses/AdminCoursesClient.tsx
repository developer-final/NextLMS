"use client";

import { useState, useEffect, useRef } from "react";
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
  StarOff,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  FileText,
  X,
  Loader2,
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
  categories?: Array<{ id: string; name: string; slug: string }>;
  currentSearch?: string;
  currentStatus?: string;
  currentCategory?: string;
  pagination: PaginationInfo;
}

export default function AdminCoursesClient({
  courses: initialCourses,
  categories = [],
  currentSearch = "",
  currentStatus = "ALL",
  currentCategory = "ALL",
  pagination,
}: AdminCoursesClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();

  const [courses, setCourses] = useState<any[]>(initialCourses);
  const [search, setSearch] = useState(currentSearch);
  const [filterStatus, setFilterStatus] = useState<string>(currentStatus);
  const [filterCategory, setFilterCategory] = useState<string>(currentCategory);

  // Single Delete State
  const [courseToDelete, setCourseToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<string | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  const selectAllCheckboxRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setCourses(initialCourses);
  }, [initialCourses]);

  useEffect(() => {
    setSearch(currentSearch);
  }, [currentSearch]);

  useEffect(() => {
    setFilterStatus(currentStatus);
  }, [currentStatus]);

  useEffect(() => {
    setFilterCategory(currentCategory);
  }, [currentCategory]);

  // Reset bulk selection on page or filter change
  useEffect(() => {
    setSelectedIds([]);
  }, [pagination.currentPage, filterStatus, filterCategory, search]);

  const filtered = courses;

  // Determine selection states for current page
  const isAllCurrentPageSelected =
    filtered.length > 0 && filtered.every((c) => selectedIds.includes(c.id));
  const isSomeCurrentPageSelected =
    filtered.some((c) => selectedIds.includes(c.id)) && !isAllCurrentPageSelected;

  // Sync indeterminate state for select-all checkbox
  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = isSomeCurrentPageSelected;
    }
  }, [isSomeCurrentPageSelected]);

  const toggleSelectAll = () => {
    if (isAllCurrentPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filtered.some((c) => c.id === id)));
    } else {
      const pageIds = filtered.map((c) => c.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const toggleSelectRow = (courseId: string) => {
    setSelectedIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const buildUrl = (
    pageNumber: number,
    statusVal?: string,
    searchVal?: string,
    categoryVal?: string
  ) => {
    const params = new URLSearchParams();
    const s = statusVal !== undefined ? statusVal : filterStatus;
    const q = searchVal !== undefined ? searchVal : search;
    const c = categoryVal !== undefined ? categoryVal : filterCategory;
    if (s && s !== "ALL") params.set("status", s);
    if (c && c !== "ALL") params.set("category", c);
    if (q && q.trim()) params.set("q", q.trim());
    if (pageNumber > 1) params.set("page", pageNumber.toString());
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(buildUrl(1, filterStatus, search, filterCategory));
  };

  const handleStatusChange = (newStatus: string) => {
    setFilterStatus(newStatus);
    router.push(buildUrl(1, newStatus, search, filterCategory));
  };

  const handleCategoryChange = (newCat: string) => {
    setFilterCategory(newCat);
    router.push(buildUrl(1, filterStatus, search, newCat));
  };

  // Toggle Single Publish / Draft
  const handleToggleStatus = async (courseId: string, currentCourseStatus: string) => {
    const newStatus = currentCourseStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
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
        prev.map((c) => (c.id === courseId ? { ...c, status: currentCourseStatus } : c))
      );
      toast.error(t.admin.courses.statusUpdateFailed);
    }
  };

  // Toggle Single Featured
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
      toast.error(t.admin.courses.featuredUpdateFailed);
    }
  };

  // Delete Single Course
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
      setSelectedIds((prev) => prev.filter((id) => id !== courseToDelete.id));
      setCourseToDelete(null);
      router.refresh();
    } catch {
      toast.error(t.admin.courses.deleteError);
    } finally {
      setDeleting(false);
    }
  };

  // Bulk Status Change (Publish / Draft)
  const handleBulkStatus = async (newStatus: "PUBLISHED" | "DRAFT") => {
    if (selectedIds.length === 0 || isBulkLoading) return;
    setIsBulkLoading(true);
    setBulkActionType(newStatus);

    // Optimistic update
    setCourses((prev) =>
      prev.map((c) => (selectedIds.includes(c.id) ? { ...c, status: newStatus } : c))
    );

    try {
      const res = await fetch("/api/admin/courses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, status: newStatus }),
      });

      if (!res.ok) {
        throw new Error();
      }

      toast.success(t.admin.courses.bulkSuccess);
      setSelectedIds([]);
      router.refresh();
    } catch {
      toast.error(t.admin.courses.bulkError);
      router.refresh();
    } finally {
      setIsBulkLoading(false);
      setBulkActionType(null);
    }
  };

  // Bulk Feature / Unfeature
  const handleBulkFeatured = async (isFeatured: boolean) => {
    if (selectedIds.length === 0 || isBulkLoading) return;
    setIsBulkLoading(true);
    setBulkActionType(isFeatured ? "FEATURE" : "UNFEATURE");

    // Optimistic update
    setCourses((prev) =>
      prev.map((c) => (selectedIds.includes(c.id) ? { ...c, isFeatured } : c))
    );

    try {
      const res = await fetch("/api/admin/courses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, isFeatured }),
      });

      if (!res.ok) {
        throw new Error();
      }

      toast.success(t.admin.courses.bulkSuccess);
      setSelectedIds([]);
      router.refresh();
    } catch {
      toast.error(t.admin.courses.bulkError);
      router.refresh();
    } finally {
      setIsBulkLoading(false);
      setBulkActionType(null);
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0 || isBulkLoading) return;
    setIsBulkLoading(true);
    setBulkActionType("DELETE");

    try {
      const res = await fetch("/api/admin/courses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t.admin.courses.bulkError);
        return;
      }

      if (data.skippedCount && data.skippedCount > 0) {
        toast.info(t.admin.courses.bulkDeletePartialError);
      } else {
        toast.success(t.admin.courses.bulkSuccess);
      }

      setCourses((prev) => prev.filter((c) => !selectedIds.includes(c.id)));
      setSelectedIds([]);
      setShowBulkDeleteModal(false);
      router.refresh();
    } catch {
      toast.error(t.admin.courses.bulkError);
    } finally {
      setIsBulkLoading(false);
      setBulkActionType(null);
    }
  };

  const selectedCoursesPreview = courses.filter((c) => selectedIds.includes(c.id));

  return (
    <div className="space-y-6 relative">
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
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
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

        {/* Category Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full lg:w-auto">
          {categories && categories.length > 0 && (
            <select
              value={filterCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full sm:w-60 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">{t.admin.courses.filterCategory}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          )}

          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
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
      </div>

      {/* Course List Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 uppercase text-[11px] font-bold text-slate-400 border-b border-slate-800">
              <tr>
                {/* Select All Checkbox */}
                <th className="w-12 px-4 py-3.5 text-center">
                  <input
                    type="checkbox"
                    ref={selectAllCheckboxRef}
                    checked={isAllCurrentPageSelected}
                    onChange={toggleSelectAll}
                    aria-label={t.admin.courses.selectAll}
                    title={t.admin.courses.selectAll}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-brand-500 focus:ring-brand-500 focus:ring-offset-slate-900 cursor-pointer accent-brand-500"
                  />
                </th>
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
                  <td colSpan={8} className="text-center py-10 text-slate-500">
                    {t.admin.courses.noCoursesFound}
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const isSelected = selectedIds.includes(c.id);
                  const totalLessons =
                    c.sections?.reduce(
                      (acc: number, s: any) =>
                        acc + (s._count?.lessons ?? s.lessons?.length ?? 0),
                      0
                    ) || 0;

                  return (
                    <tr
                      key={c.id}
                      className={`transition-colors ${
                        isSelected
                          ? "bg-brand-500/10 border-l-2 border-l-brand-500"
                          : "hover:bg-slate-800/30"
                      }`}
                    >
                      {/* Row Checkbox */}
                      <td className="w-12 px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(c.id)}
                          aria-label={`Select ${c.title}`}
                          className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-brand-500 focus:ring-brand-500 focus:ring-offset-slate-900 cursor-pointer accent-brand-500"
                        />
                      </td>

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
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-slate-400">
                                {t.admin.courses.authorLabel} {c.instructor?.name || "Admin"}
                              </span>
                              {c.tags && c.tags.length > 0 && (
                                <div className="flex items-center gap-1">
                                  {c.tags.slice(0, 2).map((tg: any) => (
                                    <span
                                      key={tg.id || tg.name}
                                      className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium"
                                    >
                                      #{tg.name}
                                    </span>
                                  ))}
                                  {c.tags.length > 2 && (
                                    <span className="text-[9px] text-slate-500">
                                      +{c.tags.length - 2}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
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
      </div>

      {/* Floating Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <aside
          aria-label={t.admin.courses.bulkActions}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-xl border border-brand-500/40 shadow-2xl rounded-2xl px-4 py-3 sm:px-6 sm:py-3.5 flex flex-wrap items-center gap-2 sm:gap-3 text-xs animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          {/* Selected Counter & Deselect */}
          <div className="flex items-center gap-2 bg-brand-500/15 border border-brand-500/30 rounded-xl px-3 py-1.5 text-brand-400 font-bold">
            <span>
              {t.admin.courses.selectedCount.replace("{count}", selectedIds.length.toString())}
            </span>
            <button
              type="button"
              onClick={clearSelection}
              className="hover:text-white p-0.5 rounded transition-colors"
              title={t.admin.courses.deselectAll}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          {/* Bulk Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* Publish Button */}
            <button
              type="button"
              disabled={isBulkLoading}
              onClick={() => handleBulkStatus("PUBLISHED")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/80 hover:bg-emerald-900/90 font-semibold transition-all disabled:opacity-50"
            >
              {isBulkLoading && bulkActionType === "PUBLISHED" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              {t.admin.courses.bulkPublish}
            </button>

            {/* Draft Button */}
            <button
              type="button"
              disabled={isBulkLoading}
              onClick={() => handleBulkStatus("DRAFT")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white font-semibold transition-all disabled:opacity-50"
            >
              {isBulkLoading && bulkActionType === "DRAFT" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileText className="h-3.5 w-3.5" />
              )}
              {t.admin.courses.bulkDraft}
            </button>

            {/* Feature Button */}
            <button
              type="button"
              disabled={isBulkLoading}
              onClick={() => handleBulkFeatured(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/60 text-amber-400 border border-amber-800/80 hover:bg-amber-900/80 font-semibold transition-all disabled:opacity-50"
            >
              {isBulkLoading && bulkActionType === "FEATURE" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Star className="h-3.5 w-3.5 fill-current" />
              )}
              {t.admin.courses.bulkFeature}
            </button>

            {/* Unfeature Button */}
            <button
              type="button"
              disabled={isBulkLoading}
              onClick={() => handleBulkFeatured(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-white font-semibold transition-all disabled:opacity-50"
            >
              {isBulkLoading && bulkActionType === "UNFEATURE" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <StarOff className="h-3.5 w-3.5" />
              )}
              {t.admin.courses.bulkUnfeature}
            </button>

            {/* Bulk Delete Button */}
            <button
              type="button"
              disabled={isBulkLoading}
              onClick={() => setShowBulkDeleteModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/60 text-rose-400 border border-rose-800/80 hover:bg-rose-900/80 font-semibold transition-all disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t.admin.courses.bulkDelete}
            </button>
          </div>
        </aside>
      )}

      {/* Reusable Server Pagination */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        pageSize={pagination.pageSize}
        buildPageUrl={(page) => buildUrl(page)}
      />

      {/* Confirmation Modal: Single Delete */}
      {courseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="relative max-w-md w-full rounded-3xl border border-rose-900/60 bg-slate-900 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="h-10 w-10 rounded-2xl bg-rose-950 flex items-center justify-center border border-rose-800">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{t.admin.courses.deleteBtn}</h3>
                <p className="text-[11px] text-slate-400 line-clamp-1">{courseToDelete.title}</p>
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
                {t.admin.courses.cancelBtn}
              </button>
              <button
                type="button"
                onClick={handleDeleteCourse}
                disabled={deleting}
                className="rounded-xl bg-rose-600 hover:bg-rose-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {deleting ? t.admin.courses.bulkProcessing : t.admin.courses.confirmDeleteBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Bulk Delete */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="relative max-w-lg w-full rounded-3xl border border-rose-900/60 bg-slate-900 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="h-10 w-10 rounded-2xl bg-rose-950 flex items-center justify-center border border-rose-800">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {t.admin.courses.bulkDeleteConfirmTitle}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {t.admin.courses.selectedCount.replace("{count}", selectedIds.length.toString())}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {t.admin.courses.bulkDeleteConfirmDesc.replace(
                "{count}",
                selectedIds.length.toString()
              )}
            </p>

            {/* Selected Courses Preview List */}
            <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
              {selectedCoursesPreview.slice(0, 5).map((course) => (
                <div key={course.id} className="flex items-center gap-2.5 text-xs text-slate-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                  <span className="line-clamp-1 flex-1 font-medium">{course.title}</span>
                </div>
              ))}
              {selectedCoursesPreview.length > 5 && (
                <p className="text-[11px] text-slate-500 italic pl-4">
                  + {selectedCoursesPreview.length - 5} khóa học khác...
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                disabled={isBulkLoading}
                onClick={() => setShowBulkDeleteModal(false)}
                className="rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
              >
                {t.admin.courses.cancelBtn}
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={isBulkLoading}
                className="rounded-xl bg-rose-600 hover:bg-rose-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {isBulkLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {isBulkLoading ? t.admin.courses.bulkProcessing : t.admin.courses.confirmDeleteBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
