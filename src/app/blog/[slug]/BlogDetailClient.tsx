"use client";

import Link from "next/link";
import {
  BookOpen,
  Calendar,
  ChevronRight,
  Clock,
  Eye,
  FileDown,
  GraduationCap,
  Home,
  Paperclip,
  Sparkles,
  Tag,
  User,
} from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import MarkdownRenderer from "@/components/blog/MarkdownRenderer";
import TableOfContents from "@/components/blog/TableOfContents";
import ShareButtons from "@/components/blog/ShareButtons";
import BlogComments from "@/components/blog/BlogComments";
import CourseCard from "@/components/cards/CourseCard";
import BlogCard from "@/components/cards/BlogCard";

interface PostDetail {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  coverImageUrl: string | null;
  viewCount: number;
  readingTime: number;
  createdAt: string | Date;
  publishedAt: string | Date | null;
  author: {
    id: string;
    name: string;
    avatarUrl: string | null;
    headline: string | null;
    bio: string | null;
    role: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  tags: {
    id: string;
    name: string;
    slug: string;
  }[];
  attachments: {
    id: string;
    fileName: string;
    fileSize: number | null;
    fileType: string | null;
    fileUrl: string;
  }[];
}

interface BlogDetailClientProps {
  post: PostDetail;
  relatedCourses: any[];
  relatedPosts: any[];
}

export default function BlogDetailClient({
  post,
  relatedCourses,
  relatedPosts,
}: BlogDetailClientProps) {
  const { t } = useLanguage();

  const formattedDate = new Date(post.publishedAt || post.createdAt).toLocaleDateString(
    "vi-VN",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  const currentUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `https://worldtradinglab.edu.vn/blog/${post.slug}`;

  return (
    <div className="min-h-screen bg-slate-950 pb-24">
      {/* Article Header Container */}
      <header className="relative border-b border-slate-800/80 bg-gradient-to-b from-slate-900/60 via-slate-950 to-slate-950 pt-10 pb-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-slate-400 overflow-x-auto whitespace-nowrap">
            <Link
              href="/"
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Trang chủ</span>
            </Link>
            <ChevronRight className="h-3 w-3 text-slate-600" />
            <Link href="/blog" className="hover:text-white transition-colors">
              Blog
            </Link>
            {post.category && (
              <>
                <ChevronRight className="h-3 w-3 text-slate-600" />
                <Link
                  href={`/blog?category=${post.category.slug}`}
                  className="hover:text-white transition-colors"
                >
                  {post.category.name}
                </Link>
              </>
            )}
            <ChevronRight className="h-3 w-3 text-slate-600" />
            <span className="text-slate-300 truncate max-w-[200px] sm:max-w-xs">
              {post.title}
            </span>
          </nav>

          {/* Meta Badges */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {post.category && (
              <Link
                href={`/blog?category=${post.category.slug}`}
                className="px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 font-bold hover:bg-brand-500/20 transition-colors"
              >
                {post.category.name}
              </Link>
            )}
            <span className="flex items-center gap-1 text-slate-400">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              {formattedDate}
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <Clock className="h-3.5 w-3.5 text-brand-400" />
              {post.readingTime} {t.blog.minRead}
            </span>
            <span className="flex items-center gap-1 text-slate-400 font-mono">
              <Eye className="h-3.5 w-3.5 text-slate-500" />
              {post.viewCount} {t.blog.views}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            {post.title}
          </h1>

          {/* Summary Callout */}
          {post.summary && (
            <p className="text-sm md:text-base text-slate-300 leading-relaxed font-medium pl-4 border-l-2 border-brand-500/60 italic">
              {post.summary}
            </p>
          )}

          {/* Author & Share Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
            {/* Author */}
            <Link
              href={`/blog/author/${post.author.id}`}
              className="flex items-center gap-3 group"
            >
              <div className="h-11 w-11 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden group-hover:border-brand-500 transition-colors">
                {post.author.avatarUrl ? (
                  <img
                    src={post.author.avatarUrl}
                    alt={post.author.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-slate-400" />
                )}
              </div>
              <div>
                <p className="font-bold text-white text-sm group-hover:text-brand-400 transition-colors">
                  {post.author.name}
                </p>
                <p className="text-xs text-slate-400">
                  {post.author.headline || "Giảng viên & Tác giả World Trading Lab"}
                </p>
              </div>
            </Link>

            {/* Social Share Buttons */}
            <ShareButtons title={post.title} url={currentUrl} />
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-8">
        {/* Cover Image */}
        {post.coverImageUrl && (
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-950 shadow-2xl mb-10">
            <img
              src={post.coverImageUrl}
              alt={post.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Article Content (8 cols) */}
          <article className="lg:col-span-8 space-y-10">
            {/* Article Markdown Body */}
            <MarkdownRenderer content={post.content} />

            {/* Document Attachments (Download Resources) */}
            {post.attachments && post.attachments.length > 0 && (
              <section className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3 shadow-xl">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-brand-400" />
                  {t.blog.attachmentsTitle} ({post.attachments.length})
                </h3>
                <div className="space-y-2">
                  {post.attachments.map((att) => {
                    const sizeInMb = att.fileSize
                      ? (att.fileSize / (1024 * 1024)).toFixed(2)
                      : null;

                    return (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-3">
                          <FileDown className="h-5 w-5 text-brand-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-200 truncate">
                              {att.fileName}
                            </p>
                            {sizeInMb && (
                              <p className="text-[10px] text-slate-500 font-mono">
                                {sizeInMb} MB
                              </p>
                            )}
                          </div>
                        </div>

                        <a
                          href={`/api/attachments/${att.id}/download`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-brand-500/10 hover:bg-brand-500 text-brand-400 hover:text-slate-950 text-xs font-bold border border-brand-500/30 transition-all flex-shrink-0"
                        >
                          {t.blog.downloadAttachment}
                        </a>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Article Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  {t.blog.tagsTitle}
                </span>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/blog?tag=${tag.slug}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-brand-400 hover:border-brand-500/40 hover:bg-slate-800/80 transition-colors"
                    >
                      <Tag className="h-3 w-3 text-cyan-400" />
                      <span>#{tag.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* KHỐI KHÓA HỌC LIÊN QUAN (Theo Tags) */}
            {relatedCourses && relatedCourses.length > 0 && (
              <section className="space-y-4 pt-8 border-t border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-500/10 text-brand-400 border border-brand-500/20">
                      <GraduationCap className="h-3 w-3" />
                      KHÓA HỌC ĐỀ XUẤT
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white tracking-tight">
                    {t.blog.relatedCoursesTitle}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {t.blog.relatedCoursesSubtitle}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {relatedCourses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              </section>
            )}

            {/* HỆ THỐNG BÌNH LUẬN CÓ PHÂN TRANG (Đặt ngay dưới Khóa học liên quan) */}
            <BlogComments postId={post.id} authorId={post.author.id} />

            {/* Author Bio Box */}
            <section className="p-6 rounded-3xl border border-slate-800 bg-slate-900/60 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
                {t.blog.aboutAuthor}
              </span>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {post.author.avatarUrl ? (
                    <img
                      src={post.author.avatarUrl}
                      alt={post.author.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-8 w-8 text-slate-400" />
                  )}
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="text-base font-bold text-white">{post.author.name}</h4>
                  <p className="text-xs text-brand-400 font-medium">
                    {post.author.headline || "Giảng viên tại World Trading Lab"}
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {post.author.bio ||
                      "Chuyên gia phân tích kỹ thuật và đào tạo giao dịch tài chính với nhiều năm kinh nghiệm thực chiến trên thị trường."}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <Link
                  href={`/blog/author/${post.author.id}`}
                  className="text-xs font-bold text-brand-400 hover:text-brand-300 transition-colors inline-flex items-center gap-1"
                >
                  {t.blog.viewAllPostsByAuthor}
                </Link>
              </div>
            </section>
          </article>

          {/* Sticky Sidebar (4 cols) */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="sticky top-24 space-y-6">
              {/* Table of Contents */}
              <TableOfContents content={post.content} />

              {/* Mini Author Card */}
              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {post.author.avatarUrl ? (
                      <img
                        src={post.author.avatarUrl}
                        alt={post.author.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{post.author.name}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-1">
                      {post.author.headline || "Tác giả bài viết"}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/blog/author/${post.author.id}`}
                  className="block w-full text-center py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
                >
                  Xem hồ sơ tác giả
                </Link>
              </div>

              {/* CTA Explore Courses */}
              <div className="p-5 rounded-2xl border border-brand-500/30 bg-gradient-to-br from-brand-950/40 to-slate-900/80 space-y-3 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  World Trading Lab PRO
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Trở thành nhà giao dịch chuyên nghiệp cùng các khóa học thực chiến chuyên sâu.
                </p>
                <Link
                  href="/courses"
                  className="block w-full py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs shadow-glow transition-all"
                >
                  Xem tất cả khóa học
                </Link>
              </div>
            </div>
          </aside>
        </div>

        {/* Related Articles Section */}
        {relatedPosts && relatedPosts.length > 0 && (
          <section className="pt-16 mt-16 border-t border-slate-800 space-y-6">
            <h3 className="text-xl font-black text-white tracking-tight">
              {t.blog.relatedPostsTitle}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((rPost) => (
                <BlogCard key={rPost.id} post={rPost} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
