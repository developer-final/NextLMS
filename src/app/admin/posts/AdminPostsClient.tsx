"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  Eye,
  FileText,
  MessageSquare,
  Paperclip,
  PenSquare,
  PlusCircle,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/components/providers/LanguageProvider";
import Pagination from "@/components/ui/Pagination";
import BulkActionBar from "@/components/admin/BulkActionBar";

interface TagInfo {
  id: string;
  name: string;
}

interface PostItem {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  coverImageUrl: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isFeatured: boolean;
  viewCount: number;
  readingTime: number;
  createdAt: string | Date;
  publishedAt: string | Date | null;
  author: {
    id: string;
    name: string;
    role: string;
  };
  category: {
    id: string;
    name: string;
  } | null;
  tags: TagInfo[];
  _count: {
    comments: number;
    attachments: number;
  };
}

interface AdminPostsClientProps {
  posts: PostItem[];
  categories: { id: string; name: string }[];
  currentSearch: string;
  currentStatus: string;
  currentCategory: string;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
  };
}

export default function AdminPostsClient({
  posts,
  categories,
  currentSearch,
  currentStatus,
  currentCategory,
  pagination,
}: AdminPostsClientProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [search, setSearch] = useState(currentSearch);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkOperating, setIsBulkOperating] = useState(false);

  const allSelected = posts.length > 0 && selectedIds.length === posts.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < posts.length;

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(posts.map((p) => p.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkPublish = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkOperating(true);
    try {
      const res = await fetch("/api/admin/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, status: "PUBLISHED" }),
      });
      if (!res.ok) throw new Error();
      toast.success(t.admin.posts.bulkSuccess);
      setSelectedIds([]);
      router.refresh();
    } catch {
      toast.error(t.admin.posts.bulkError);
    } finally {
      setIsBulkOperating(false);
    }
  };

  const handleBulkDraft = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkOperating(true);
    try {
      const res = await fetch("/api/admin/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, status: "DRAFT" }),
      });
      if (!res.ok) throw new Error();
      toast.success(t.admin.posts.bulkSuccess);
      setSelectedIds([]);
      router.refresh();
    } catch {
      toast.error(t.admin.posts.bulkError);
    } finally {
      setIsBulkOperating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(t.admin.posts.bulkDeleteConfirmDesc)) return;
    setIsBulkOperating(true);
    try {
      const res = await fetch("/api/admin/posts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (!res.ok) throw new Error();
      toast.success(t.admin.posts.bulkSuccess);
      setSelectedIds([]);
      router.refresh();
    } catch {
      toast.error(t.admin.posts.bulkError);
    } finally {
      setIsBulkOperating(false);
    }
  };

  const applyFilters = (newParams: Record<string, string>) => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (currentStatus !== "ALL") params.set("status", currentStatus);
    if (currentCategory !== "ALL") params.set("categoryId", currentCategory);

    // Override with newParams
    Object.entries(newParams).forEach(([k, v]) => {
      if (v === "ALL" || !v) {
        params.delete(k);
      } else {
        params.set(k, v);
      }
    });

    params.set("page", "1");
    router.push(`/admin/posts?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ q: search.trim() });
  };

  const handleDelete = async (postId: string) => {
    if (!confirm(t.admin.posts.deleteConfirm)) return;

    setDeletingId(postId);
    try {
      const res = await fetch(`/api/admin/posts/${postId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete post");
      }

      toast.success(t.admin.posts.deleteSuccess);
      router.refresh();
    } catch (error) {
      toast.error(t.admin.posts.deleteFailed);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <FileText className="h-7 w-7 text-brand-400" />
            {t.admin.posts.title}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t.admin.posts.subtitle} ({pagination.totalItems})
          </p>
        </div>

        <Link
          href="/admin/posts/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs shadow-glow transition-all hover:scale-[1.02] self-start sm:self-auto"
        >
          <PlusCircle className="h-4 w-4" />
          {t.admin.posts.createPost}
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="sm:col-span-5 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.admin.posts.searchPlaceholder}
            className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </form>

        {/* Status Filter */}
        <div className="sm:col-span-3">
          <select
            value={currentStatus}
            onChange={(e) => applyFilters({ status: e.target.value })}
            className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
          >
            <option value="ALL">{t.admin.posts.allStatuses}</option>
            <option value="PUBLISHED">{t.admin.posts.statusPublished}</option>
            <option value="DRAFT">{t.admin.posts.statusDraft}</option>
            <option value="ARCHIVED">{t.admin.posts.statusArchived}</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="sm:col-span-4">
          <select
            value={currentCategory}
            onChange={(e) => applyFilters({ categoryId: e.target.value })}
            className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
          >
            <option value="ALL">{t.blog.allCategories}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Posts Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="w-10 px-4 py-3.5 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = isIndeterminate;
                    }}
                    onChange={handleToggleSelectAll}
                    aria-label={t.admin.posts.selectAll}
                    className="rounded border-slate-700 bg-slate-900 text-brand-500 focus:ring-brand-500 focus:ring-offset-slate-950 cursor-pointer h-4 w-4"
                  />
                </th>
                <th className="px-5 py-3.5">{t.admin.posts.titleLabel}</th>
                <th className="px-4 py-3.5">{t.admin.posts.authorHeader}</th>
                <th className="px-4 py-3.5">{t.admin.posts.categoryHeader}</th>
                <th className="px-4 py-3.5">{t.admin.posts.statusHeader}</th>
                <th className="px-4 py-3.5 text-center">{t.admin.posts.viewsHeader}</th>
                <th className="px-4 py-3.5">{t.admin.posts.dateHeader}</th>
                <th className="px-5 py-3.5 text-right">{t.admin.posts.actionsHeader}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileText className="mx-auto h-8 w-8 text-slate-600 mb-2" />
                    {t.admin.posts.noPostsFound}
                  </td>
                </tr>
              ) : (
                posts.map((post) => {
                  const isSelected = selectedIds.includes(post.id);

                  return (
                    <tr
                      key={post.id}
                      className={`transition-colors ${
                        isSelected
                          ? "bg-brand-500/10 hover:bg-brand-500/15"
                          : "hover:bg-slate-800/30"
                      }`}
                    >
                      <td className="w-10 px-4 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(post.id)}
                          aria-label={`Select post ${post.title}`}
                          className="rounded border-slate-700 bg-slate-900 text-brand-500 focus:ring-brand-500 focus:ring-offset-slate-950 cursor-pointer h-4 w-4"
                        />
                      </td>
                      {/* Title + Cover */}
                      <td className="px-5 py-3.5 max-w-sm">
                        <div className="flex items-center gap-3">
                          {post.coverImageUrl ? (
                            <img
                              src={post.coverImageUrl}
                              alt={post.title}
                              className="h-10 w-16 rounded-lg object-cover border border-slate-700/60 flex-shrink-0"
                            />
                          ) : (
                            <div className="h-10 w-16 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center flex-shrink-0 text-slate-500">
                              <FileText className="h-5 w-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <Link
                              href={`/admin/posts/${post.id}/edit`}
                              className="font-bold text-white hover:text-brand-400 transition-colors line-clamp-1"
                            >
                              {post.title}
                            </Link>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                              <span>{post.readingTime} {t.blog.minRead}</span>
                              {post._count.attachments > 0 && (
                                <span className="flex items-center gap-0.5 text-brand-400">
                                  <Paperclip className="h-3 w-3" />
                                  {post._count.attachments}
                                </span>
                              )}
                              {post._count.comments > 0 && (
                                <span className="flex items-center gap-0.5 text-cyan-400">
                                  <MessageSquare className="h-3 w-3" />
                                  {post._count.comments}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Author */}
                      <td className="px-4 py-3.5 text-slate-300 font-medium">
                        {post.author.name}
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5 text-slate-400">
                        {post.category ? (
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[11px] text-slate-300">
                            {post.category.name}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        {post.status === "PUBLISHED" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {t.admin.posts.statusPublished}
                          </span>
                        ) : post.status === "DRAFT" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {t.admin.posts.statusDraft}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700/30 text-slate-400 border border-slate-600/30">
                            {t.admin.posts.statusArchived}
                          </span>
                        )}
                      </td>

                      {/* Views */}
                      <td className="px-4 py-3.5 text-center text-slate-400 font-mono text-[11px]">
                        <span className="inline-flex items-center gap-1">
                          <Eye className="h-3 w-3 text-slate-500" />
                          {post.viewCount}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                        {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {post.status === "PUBLISHED" && (
                            <Link
                              href={`/blog/${post.slug}`}
                              target="_blank"
                              title={t.admin.posts.viewLive}
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          )}
                          <Link
                            href={`/admin/posts/${post.id}/edit`}
                            title={t.admin.posts.editAction}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-brand-400 transition-colors"
                          >
                            <PenSquare className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(post.id)}
                            disabled={deletingId === post.id}
                            title={t.admin.posts.deleteAction}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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

      {/* Floating Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        isLoading={isBulkOperating}
        actions={[
          {
            label: t.admin.posts.bulkPublish,
            onClick: handleBulkPublish,
            variant: "success",
          },
          {
            label: t.admin.posts.bulkDraft,
            onClick: handleBulkDraft,
            variant: "warning",
          },
          {
            label: t.admin.posts.bulkDelete,
            onClick: handleBulkDelete,
            variant: "danger",
          },
        ]}
      />

      {/* Pagination */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        pageSize={pagination.pageSize}
      />
    </div>
  );
}
