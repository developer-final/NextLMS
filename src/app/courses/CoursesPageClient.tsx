"use client";

import Link from "next/link";
import CourseCard, { CourseCardProps } from "@/components/cards/CourseCard";
import { BookOpen } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  _count: { courses: number };
}

interface CoursesPageClientProps {
  courses: CourseCardProps["course"][];
  categories: CategoryWithCount[];
  category?: string;
}

export default function CoursesPageClient({
  courses,
  categories,
  category,
}: CoursesPageClientProps) {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8 border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-black text-white">{t.courses.title}</h1>
        <p className="mt-1 text-sm text-slate-400">
          {t.courses.subtitle}
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
          {t.courses.allFilter} ({courses.length})
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
          <h3 className="text-lg font-bold text-white">{t.courses.noCoursesFound}</h3>
          <p className="text-xs text-slate-400 mt-1">
            {t.courses.noCoursesDesc}
          </p>
          <Link
            href="/courses"
            className="mt-4 inline-block px-4 py-2 rounded-xl bg-brand-500 text-slate-950 text-xs font-bold"
          >
            {t.courses.resetFilters}
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
