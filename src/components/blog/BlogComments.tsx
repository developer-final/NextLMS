"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Lock,
  MessageSquare,
  Send,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface CommentUser {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: string;
}

interface CommentItem {
  id: string;
  content: string;
  createdAt: string | Date;
  user: CommentUser;
}

interface BlogCommentsProps {
  postId: string;
  authorId?: string;
}

export default function BlogComments({ postId, authorId }: BlogCommentsProps) {
  const { data: session } = useSession();
  const { t } = useLanguage();

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState("");

  const pageSize = 8;

  const fetchComments = useCallback(
    async (page: number) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/comments?postId=${postId}&page=${page}&pageSize=${pageSize}`
        );
        const data = await res.json();
        if (res.ok) {
          setComments(data.comments || []);
          if (data.pagination) {
            setCurrentPage(data.pagination.currentPage);
            setTotalPages(data.pagination.totalPages);
            setTotalItems(data.pagination.totalItems);
          }
        }
      } catch (err) {
        console.error("Error fetching comments:", err);
      } finally {
        setLoading(false);
      }
    },
    [postId]
  );

  useEffect(() => {
    fetchComments(currentPage);
  }, [fetchComments, currentPage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          content: content.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t.blog.commentFailed);
      }

      toast.success(t.blog.commentSuccess);
      setContent("");
      // Reload first page to see the newly submitted comment
      setCurrentPage(1);
      fetchComments(1);
    } catch (err: any) {
      toast.error(err.message || t.blog.commentFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-6 pt-10 border-t border-slate-800">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-cyan-400" />
          {t.blog.commentsTitle}
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-mono">
            {totalItems}
          </span>
        </h3>
      </div>

      {/* Comment Submission Form or Login Callout */}
      {session ? (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 space-y-3"
        >
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden text-brand-400 text-xs font-bold uppercase">
              {session.user?.avatarUrl ? (
                <img
                  src={session.user.avatarUrl}
                  alt={session.user.name || "User"}
                  className="h-full w-full object-cover"
                />
              ) : (
                session.user?.name?.charAt(0) || "U"
              )}
            </div>
            <div className="flex-1 space-y-2">
              <textarea
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t.blog.writeCommentPlaceholder}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors resize-none leading-relaxed"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !content.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs shadow-glow transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {submitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  {submitting ? t.blog.submittingComment : t.blog.submitComment}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 text-center space-y-3">
          <div className="inline-flex p-3 rounded-full bg-slate-900 border border-slate-800 text-brand-400">
            <Lock className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white">{t.blog.loginToComment}</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {t.blog.loginToCommentDesc}
            </p>
          </div>
          <div>
            <Link
              href={`/auth/login?callbackUrl=${encodeURIComponent(
                typeof window !== "undefined" ? window.location.pathname : "/blog"
              )}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs shadow-glow transition-all hover:scale-105"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4 pt-2">
        {loading ? (
          <div className="py-12 flex justify-center items-center gap-2 text-xs text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
            <span>{t.common.loading}...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500 italic rounded-2xl border border-slate-800/60 bg-slate-900/20">
            {t.blog.noCommentsYet}
          </div>
        ) : (
          comments.map((comm) => {
            const isAuthor = authorId && comm.user.id === authorId;
            const isAdmin =
              comm.user.role === "ADMIN" || comm.user.role === "SUPER_ADMIN";

            return (
              <div
                key={comm.id}
                className="flex items-start gap-3 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700/80 transition-colors"
              >
                {/* Avatar */}
                <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden text-slate-400 text-xs font-bold uppercase">
                  {comm.user.avatarUrl ? (
                    <img
                      src={comm.user.avatarUrl}
                      alt={comm.user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    comm.user.name?.charAt(0) || "U"
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      {comm.user.name}
                    </span>

                    {/* Author / Staff Badges */}
                    {isAuthor && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/10 text-brand-400 border border-brand-500/20">
                        {t.blog.authorBadge}
                      </span>
                    )}

                    {isAdmin && !isAuthor && (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <ShieldCheck className="h-2.5 w-2.5" />
                        Admin
                      </span>
                    )}

                    <span className="text-[10px] text-slate-500">
                      {new Date(comm.createdAt).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {comm.content}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 text-xs">
          <span className="text-slate-500 text-[11px]">
            Trang {currentPage} / {totalPages} ({totalItems} bình luận)
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || loading}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title={t.common.previous}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === totalPages ||
                  Math.abs(p - currentPage) <= 1
              )
              .map((p, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev && p - prev > 1;

                return (
                  <div key={p} className="flex items-center">
                    {showEllipsis && (
                      <span className="px-1 text-slate-600">...</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(p)}
                      className={`h-7 w-7 rounded-lg text-xs font-bold transition-colors ${
                        currentPage === p
                          ? "bg-brand-500 text-slate-950 font-black shadow-glow"
                          : "border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      {p}
                    </button>
                  </div>
                );
              })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || loading}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title={t.common.next}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
