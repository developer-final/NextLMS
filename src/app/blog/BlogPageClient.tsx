"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  Compass,
  FileText,
  Search,
  Sparkles,
  Tag,
  User,
  X,
} from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import BlogCard from "@/components/cards/BlogCard";
import Pagination from "@/components/ui/Pagination";

interface PostItem {
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
}

interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  _count: {
    posts: number;
  };
}

interface BlogPageClientProps {
  posts: PostItem[];
  featuredPost: PostItem | null;
  categories: CategoryWithCount[];
  currentCategory?: string;
  currentTag?: string;
  currentSearch?: string;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
  };
}

export default function BlogPageClient({
  posts,
  featuredPost,
  categories,
  currentCategory,
  currentTag,
  currentSearch,
  pagination,
}: BlogPageClientProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState(currentSearch || "");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set("q", searchTerm.trim());
    if (currentCategory) params.set("category", currentCategory);
    if (currentTag) params.set("tag", currentTag);
    params.set("page", "1");
    router.push(`/blog?${params.toString()}`);
  };

  const handleCategorySelect = (categorySlug?: string) => {
    const params = new URLSearchParams();
    if (categorySlug) params.set("category", categorySlug);
    if (searchTerm.trim()) params.set("q", searchTerm.trim());
    params.set("page", "1");
    router.push(`/blog?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    router.push("/blog");
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-slate-900/60 via-slate-950 to-slate-950 py-16 md:py-24">
        {/* Glow Ambient Elements */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-brand-500/15 blur-3xl" />
        <div className="pointer-events-none absolute top-10 right-10 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-500/10 text-brand-400 border border-brand-500/20 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            WORLD TRADING LAB INSIGHTS
          </span>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            {t.blog.heroTitle}
          </h1>

          <p className="mx-auto max-w-2xl text-sm md:text-base text-slate-400 leading-relaxed">
            {t.blog.heroSubtitle}
          </p>

          {/* Search Bar */}
          <div className="mx-auto max-w-xl pt-2">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t.blog.searchPlaceholder}
                className="w-full pl-12 pr-28 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-sm text-white placeholder-slate-400 shadow-2xl focus:outline-none focus:border-brand-500 transition-colors"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs shadow-glow transition-all"
              >
                Tìm kiếm
              </button>
            </form>
          </div>

          {/* Active Tag or Search Filter Pill */}
          {(currentTag || currentSearch) && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <span className="text-xs text-slate-400">Đang lọc theo:</span>
              {currentTag && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-semibold">
                  <Tag className="h-3 w-3" />
                  #{currentTag}
                  <button
                    onClick={() => {
                      const params = new URLSearchParams(window.location.search);
                      params.delete("tag");
                      params.set("page", "1");
                      router.push(`/blog?${params.toString()}`);
                    }}
                    className="hover:text-rose-400 ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {currentSearch && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/30 text-xs font-semibold">
                  &quot;{currentSearch}&quot;
                  <button onClick={handleClearFilters} className="hover:text-rose-400 ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 space-y-12">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => handleCategorySelect(undefined)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              !currentCategory
                ? "bg-brand-500 text-slate-950 shadow-glow"
                : "bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            {t.blog.allCategories} ({pagination.totalItems})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.slug)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                currentCategory === cat.slug
                  ? "bg-brand-500 text-slate-950 shadow-glow"
                  : "bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {cat.name} ({cat._count.posts})
            </button>
          ))}
        </div>

        {/* Featured Post Banner (Page 1 only) */}
        {featuredPost && (
          <section className="relative overflow-hidden rounded-3xl border border-brand-500/30 bg-gradient-to-br from-slate-900/90 to-slate-950 p-6 md:p-8 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Image */}
              <Link
                href={`/blog/${featuredPost.slug}`}
                className="lg:col-span-7 relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-slate-950 group"
              >
                {featuredPost.coverImageUrl ? (
                  <img
                    src={featuredPost.coverImageUrl}
                    alt={featuredPost.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-900 text-slate-700">
                    <FileText className="h-16 w-16" />
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-md">
                    <Sparkles className="h-3.5 w-3.5" />
                    {t.blog.featuredBadge}
                  </span>
                </div>
              </Link>

              {/* Info */}
              <div className="lg:col-span-5 space-y-4">
                {featuredPost.category && (
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
                    {featuredPost.category.name}
                  </span>
                )}

                <h2 className="text-2xl md:text-3xl font-black text-white hover:text-brand-400 transition-colors leading-tight">
                  <Link href={`/blog/${featuredPost.slug}`}>{featuredPost.title}</Link>
                </h2>

                {featuredPost.summary && (
                  <p className="text-xs md:text-sm text-slate-400 line-clamp-3 leading-relaxed">
                    {featuredPost.summary}
                  </p>
                )}

                {/* Author & Read info */}
                <div className="flex items-center gap-3 pt-2 text-xs text-slate-400">
                  <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center">
                    {featuredPost.author.avatarUrl ? (
                      <img
                        src={featuredPost.author.avatarUrl}
                        alt={featuredPost.author.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{featuredPost.author.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {featuredPost.readingTime} {t.blog.minRead}
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href={`/blog/${featuredPost.slug}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs shadow-glow transition-all hover:scale-105"
                  >
                    {t.blog.readMore}
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Blog Post Grid */}
        {posts.length === 0 ? (
          <div className="py-24 text-center rounded-3xl border border-slate-800 bg-slate-900/40 p-8 space-y-4">
            <Compass className="mx-auto h-12 w-12 text-slate-600" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">{t.blog.noArticlesFound}</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {t.blog.noArticlesDesc}
              </p>
            </div>
            {(currentCategory || currentTag || currentSearch) && (
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
              >
                {t.blog.clearFilters}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, idx) => (
              <BlogCard key={post.id} post={post} priority={idx < 3} />
            ))}
          </div>
        )}

        {/* Reusable Server Pagination */}
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageSize}
        />
      </main>
    </div>
  );
}
