import Link from "next/link";
import { prisma } from "@/lib/prisma";
import CourseCard from "@/components/cards/CourseCard";
import { BookOpen, Filter, Search, Sparkles } from "lucide-react";

export const revalidate = 0;

interface CoursesPageProps {
  searchParams: Promise<{
    category?: string;
    level?: string;
    type?: string; // free | paid
    q?: string;
  }>;
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const { category, level, type, q } = await searchParams;

  const whereClause: any = {
    status: "PUBLISHED",
  };

  if (category) {
    whereClause.category = { slug: category };
  }

  if (level) {
    whereClause.level = level;
  }

  if (type === "free") {
    whereClause.isFree = true;
  } else if (type === "paid") {
    whereClause.isFree = false;
  }

  if (q) {
    whereClause.OR = [
      { title: { contains: q } },
      { shortDescription: { contains: q } },
    ];
  }

  const [courses, categories] = await Promise.all([
    prisma.course.findMany({
      where: whereClause,
      include: {
        instructor: {
          select: { name: true, avatarUrl: true, headline: true },
        },
        category: {
          select: { name: true, slug: true },
        },
        sections: {
          include: {
            lessons: {
              select: { id: true, videoDuration: true },
            },
          },
        },
        _count: {
          select: { enrollments: true, reviews: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { courses: true } },
      },
      orderBy: { orderIndex: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8 border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-black text-white">Tất cả Khóa học Đào tạo</h1>
        <p className="mt-1 text-sm text-slate-400">
          Khám phá danh sách khóa học thực chiến từ các chuyên gia hàng đầu
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
        <Link
          href="/courses"
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            !category
              ? "bg-brand-500 text-slate-950 shadow-glow"
              : "bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700"
          }`}
        >
          Tất cả ({courses.length})
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/courses?category=${cat.slug}`}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              category === cat.slug
                ? "bg-brand-500 text-slate-950 shadow-glow"
                : "bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700"
            }`}
          >
            {cat.name} ({cat._count.courses})
          </Link>
        ))}
      </div>

      {/* Course Grid */}
      {courses.length === 0 ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-12 text-center my-8">
          <BookOpen className="mx-auto h-12 w-12 text-slate-600 mb-3" />
          <h3 className="text-lg font-bold text-white">Chưa tìm thấy khóa học phù hợp</h3>
          <p className="text-xs text-slate-400 mt-1">
            Vui lòng thử tìm kiếm bằng từ khóa hoặc danh mục khác.
          </p>
          <Link
            href="/courses"
            className="mt-4 inline-block px-4 py-2 rounded-xl bg-brand-500 text-slate-950 text-xs font-bold"
          >
            Xem tất cả khóa học
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
