import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BookOpen, FileText, GraduationCap, Home, User } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import BlogCard from "@/components/cards/BlogCard";
import CourseCard from "@/components/cards/CourseCard";
import Pagination from "@/components/ui/Pagination";

export const revalidate = 300;

interface AuthorPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    page?: string;
  }>;
}

export async function generateMetadata({
  params,
}: AuthorPageProps): Promise<Metadata> {
  const { id } = await params;
  const author = await prisma.user.findUnique({
    where: { id },
    select: { name: true, headline: true, bio: true },
  });

  if (!author) {
    return { title: "Tác giả không tồn tại | World Trading Lab" };
  }

  return {
    title: `${author.name} - Tác giả & Giảng viên | World Trading Lab`,
    description:
      author.bio ||
      `Khám phá các bài viết và khóa học chuyên sâu của ${author.name} tại World Trading Lab.`,
  };
}

export default async function AuthorPage({ params, searchParams }: AuthorPageProps) {
  const { id } = await params;
  const { page } = await searchParams;

  const pageSize = 9;
  const currentPage = Math.max(1, parseInt(page || "1", 10));

  const [author, totalPosts, posts, courses] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        headline: true,
        bio: true,
        role: true,
        createdAt: true,
      },
    }),
    prisma.blogPost.count({
      where: { authorId: id, status: "PUBLISHED" },
    }),
    prisma.blogPost.findMany({
      where: { authorId: id, status: "PUBLISHED" },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        category: { select: { name: true, slug: true } },
        tags: { select: { name: true, slug: true } },
      },
      orderBy: { publishedAt: "desc" },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.course.findMany({
      where: { instructorId: id, status: "PUBLISHED" },
      include: {
        instructor: { select: { name: true, avatarUrl: true } },
        category: { select: { name: true } },
        sections: {
          include: {
            lessons: { select: { id: true, videoDuration: true } },
          },
        },
        _count: { select: { enrollments: true, reviews: true } },
      },
      take: 4,
    }),
  ]);

  if (!author) {
    notFound();
  }

  const totalPages = Math.max(1, Math.ceil(totalPosts / pageSize));

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* Author Header */}
      <section className="border-b border-slate-800/80 bg-gradient-to-b from-slate-900/60 via-slate-950 to-slate-950 py-12 md:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-slate-400">
            <Link href="/" className="hover:text-white transition-colors">
              Trang chủ
            </Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-white transition-colors">
              Blog
            </Link>
            <span>/</span>
            <span className="text-slate-200">{author.name}</span>
          </nav>

          {/* Author Card */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur-md">
            <div className="h-24 w-24 rounded-3xl bg-slate-800 border-2 border-brand-500/40 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-glow">
              {author.avatarUrl ? (
                <img
                  src={author.avatarUrl}
                  alt={author.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-12 w-12 text-slate-400" />
              )}
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl font-black text-white">{author.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/20 text-brand-400 border border-brand-500/30 uppercase">
                  {author.role}
                </span>
              </div>

              <p className="text-xs font-semibold text-brand-400">
                {author.headline || "Tác giả & Chuyên gia Phân tích Kỹ thuật"}
              </p>

              <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                {author.bio ||
                  "Chuyên gia giao dịch tài chính thực chiến, chia sẻ kiến thức và phương pháp phân tích thị trường chuyên sâu tại World Trading Lab."}
              </p>

              {/* Stats */}
              <div className="flex items-center justify-center sm:justify-start gap-6 pt-2 text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-medium">
                  <FileText className="h-4 w-4 text-cyan-400" />
                  <strong className="text-white">{totalPosts}</strong> bài viết
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <GraduationCap className="h-4 w-4 text-brand-400" />
                  <strong className="text-white">{courses.length}</strong> khóa học
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content: Posts & Courses */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-10 space-y-12">
        {/* Author Posts */}
        <section className="space-y-6">
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <FileText className="h-5 w-5 text-cyan-400" />
            Bài viết của {author.name} ({totalPosts})
          </h2>

          {posts.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-500 rounded-2xl border border-slate-800 bg-slate-900/30">
              Tác giả chưa xuất bản bài viết nào.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {serializePrisma(posts).map((p: any) => (
                <BlogCard key={p.id} post={p} />
              ))}
            </div>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalPosts}
            pageSize={pageSize}
          />
        </section>

        {/* Author Courses (If any) */}
        {courses.length > 0 && (
          <section className="space-y-6 pt-8 border-t border-slate-800">
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-brand-400" />
              Khóa học do {author.name} giảng dạy ({courses.length})
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {serializePrisma(courses).map((course: any) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
