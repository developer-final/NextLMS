"use client";

import Link from "next/link";
import { BookOpen, Clock, PlayCircle, Star, User, Sparkles } from "lucide-react";
import { formatVND } from "@/lib/utils";
import { useLanguage } from "@/components/providers/LanguageProvider";

export interface CourseCardProps {
  course: {
    id: string;
    title: string;
    slug: string;
    shortDescription?: string | null;
    thumbnailUrl?: string | null;
    price: number;
    salePrice?: number | null;
    level: string;
    isFree: boolean;
    isFeatured?: boolean;
    instructor: {
      name: string;
      avatarUrl?: string | null;
    };
    category?: {
      name: string;
    } | null;
    tags?: {
      id: string;
      name: string;
      slug: string;
    }[];
    _count?: {
      sections?: number;
      enrollments?: number;
    };
    sections?: {
      lessons: { id: string; videoDuration: number }[];
    }[];
  };
}

export default function CourseCard({ course }: CourseCardProps) {
  const { t } = useLanguage();

  const totalLessons = course.sections
    ? course.sections.reduce((acc, s) => acc + s.lessons.length, 0)
    : 0;

  const totalDuration = course.sections
    ? course.sections.reduce(
        (acc, s) => acc + s.lessons.reduce((lAcc, l) => lAcc + l.videoDuration, 0),
        0
      )
    : 0;

  const totalHours = Math.max(1, Math.round(totalDuration / 3600));

  const levelLabels: Record<string, string> = {
    BEGINNER: t.common.beginner,
    INTERMEDIATE: t.common.intermediate,
    ADVANCED: t.common.advanced,
    ALL_LEVELS: t.common.allLevels,
  };

  const discountPercent =
    course.salePrice && course.price > course.salePrice
      ? Math.round(((course.price - course.salePrice) / course.price) * 100)
      : 0;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-500/40 hover:shadow-glow">
      {/* Thumbnail */}
      <Link
        href={`/courses/${course.slug}`}
        className="relative aspect-video w-full overflow-hidden bg-slate-800 block cursor-pointer"
      >
        <img
          src={
            course.thumbnailUrl ||
            "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80"
          }
          alt={course.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-80" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {course.isFeatured && (
            <span className="flex items-center gap-1 rounded-md bg-amber-500/90 px-2 py-0.5 text-[11px] font-bold text-slate-950 backdrop-blur-md shadow-md">
              <Sparkles className="h-3 w-3" /> {t.courseCard.featured}
            </span>
          )}
          {course.category && (
            <span className="rounded-md bg-slate-900/80 px-2 py-0.5 text-[11px] font-medium text-slate-300 backdrop-blur-md border border-slate-700/50">
              {course.category.name}
            </span>
          )}
        </div>

        {discountPercent > 0 && (
          <div className="absolute top-3 right-3 rounded-md bg-rose-500 px-2 py-0.5 text-[11px] font-extrabold text-white shadow-lg">
            -{discountPercent}%
          </div>
        )}

        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-slate-300">
          <span className="rounded bg-slate-950/70 px-2 py-0.5 backdrop-blur-sm">
            {levelLabels[course.level] || course.level}
          </span>
          <span className="flex items-center gap-1 rounded bg-slate-950/70 px-2 py-0.5 backdrop-blur-sm">
            <Clock className="h-3 w-3 text-brand-400" /> ~{totalHours} {t.courseCard.approxHours}
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-base font-bold text-white group-hover:text-brand-400 transition-colors">
          <Link href={`/courses/${course.slug}`}>{course.title}</Link>
        </h3>

        {course.shortDescription && (
          <p className="mt-2 line-clamp-2 text-xs text-slate-400 leading-relaxed">
            {course.shortDescription}
          </p>
        )}

        {/* Tags */}
        {course.tags && course.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {course.tags.slice(0, 3).map((tag) => (
              <Link
                key={tag.id || tag.slug}
                href={`/courses?tag=${tag.slug}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800/80 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors border border-slate-700/40"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        )}

        {/* Instructor */}
        <div className="mt-4 flex items-center gap-2 border-t border-slate-800/80 pt-3 text-xs text-slate-400">
          <div className="h-6 w-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-[10px] overflow-hidden border border-slate-700">
            {course.instructor.avatarUrl ? (
              <img src={course.instructor.avatarUrl} alt={course.instructor.name} className="h-full w-full object-cover" />
            ) : (
              <User className="h-3.5 w-3.5" />
            )}
          </div>
          <span className="truncate">{course.instructor.name}</span>
          <span className="ml-auto flex items-center gap-1 text-amber-400 font-semibold">
            <Star className="h-3.5 w-3.5 fill-amber-400" /> 5.0
          </span>
        </div>

        {/* Price & CTA */}
        <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800/80">
          <div>
            {course.isFree ? (
              <span className="text-base font-extrabold text-brand-400">{t.courseCard.free}</span>
            ) : course.salePrice ? (
              <div className="flex flex-col">
                <span className="text-base font-extrabold text-brand-400">
                  {formatVND(course.salePrice)}
                </span>
                <span className="text-xs text-slate-500 line-through">
                  {formatVND(course.price)}
                </span>
              </div>
            ) : (
              <span className="text-base font-extrabold text-white">
                {formatVND(course.price)}
              </span>
            )}
          </div>

          <Link
            href={`/courses/${course.slug}`}
            className="rounded-lg bg-slate-800 hover:bg-brand-500 hover:text-slate-950 px-3.5 py-1.5 text-xs font-semibold text-white transition-all"
          >
            {t.courseCard.viewCourse}
          </Link>
        </div>
      </div>
    </div>
  );
}
