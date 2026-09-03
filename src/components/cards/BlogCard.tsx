"use client";

import Link from "next/link";
import { Clock, Eye, FileText, Sparkles, User } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

export interface BlogCardProps {
  post: {
    id: string;
    title: string;
    slug: string;
    summary: string | null;
    coverImageUrl: string | null;
    isFeatured?: boolean;
    viewCount: number;
    readingTime: number;
    createdAt: string | Date;
    publishedAt?: string | Date | null;
    author: {
      id?: string;
      name: string;
      avatarUrl?: string | null;
      headline?: string | null;
    };
    category?: {
      name: string;
      slug: string;
    } | null;
    tags?: {
      name: string;
      slug: string;
    }[];
  };
  priority?: boolean;
}

export default function BlogCard({ post, priority = false }: BlogCardProps) {
  const { t } = useLanguage();

  const formattedDate = new Date(post.publishedAt || post.createdAt).toLocaleDateString(
    "vi-VN",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/40 hover:shadow-2xl hover:shadow-brand-500/10">
      {/* Cover Image */}
      <Link href={`/blog/${post.slug}`} className="relative aspect-[16/10] w-full overflow-hidden bg-slate-950">
        {post.coverImageUrl ? (
          <img
            src={post.coverImageUrl}
            alt={post.title}
            loading={priority ? "eager" : "lazy"}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80";
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 text-slate-700">
            <FileText className="h-12 w-12" />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60" />

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          {post.category ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-900/90 text-brand-400 border border-brand-500/30 backdrop-blur-md shadow-sm">
              {post.category.name}
            </span>
          ) : (
            <span />
          )}

          {post.isFeatured && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-md">
              <Sparkles className="h-3 w-3" />
              {t.blog.featuredBadge}
            </span>
          )}
        </div>

        {/* Reading Time Badge */}
        <div className="absolute bottom-3 right-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-950/80 text-slate-300 border border-slate-800 backdrop-blur-md">
            <Clock className="h-3 w-3 text-brand-400" />
            {post.readingTime} {t.blog.minRead}
          </span>
        </div>
      </Link>

      {/* Card Content */}
      <div className="flex flex-1 flex-col p-5 space-y-3">
        {/* Title */}
        <h3 className="text-base font-bold text-white group-hover:text-brand-400 line-clamp-2 transition-colors leading-snug">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h3>

        {/* Summary */}
        {post.summary && (
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed flex-1">
            {post.summary}
          </p>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {post.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-400 border border-slate-700/60 font-medium"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Author & Footer Info */}
        <div className="pt-3 mt-auto border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <div className="h-7 w-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {post.author.avatarUrl ? (
                <img
                  src={post.author.avatarUrl}
                  alt={post.author.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-3.5 w-3.5 text-slate-400" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-200 truncate text-[11px]">
                {post.author.name}
              </p>
              <p className="text-[10px] text-slate-500">{formattedDate}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
            <Eye className="h-3 w-3" />
            <span>{post.viewCount}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
