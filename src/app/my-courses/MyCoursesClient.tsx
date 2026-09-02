"use client";

import Link from "next/link";
import { Award, BookOpen, GraduationCap, PlayCircle, Sparkles } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface MyCoursesClientProps {
  enrollments: any[];
}

export default function MyCoursesClient({ enrollments }: MyCoursesClientProps) {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 border-b border-slate-800 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
          <GraduationCap className="h-8 w-8 text-brand-400" />
          {t.myCourses.pageTitle} ({enrollments.length})
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {t.myCourses.pageSubtitle}
        </p>
      </div>

      {enrollments.length === 0 ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-12 text-center my-8">
          <BookOpen className="mx-auto h-12 w-12 text-slate-600 mb-3" />
          <h3 className="text-lg font-bold text-white">{t.myCourses.noCoursesTitle}</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            {t.myCourses.noCoursesDesc}
          </p>
          <Link
            href="/courses"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-400 px-6 py-3 text-xs font-bold text-slate-950 shadow-glow"
          >
            <Sparkles className="h-4 w-4" /> {t.myCourses.exploreBtn}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments.map((enr) => {
            const firstLesson = enr.course.sections[0]?.lessons[0];
            const isFinished = enr.progressPercent >= 100;

            return (
              <div
                key={enr.id}
                className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between hover:border-brand-500/40 transition-all"
              >
                <div>
                  <img
                    src={
                      enr.course.thumbnailUrl ||
                      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80"
                    }
                    alt={enr.course.title}
                    className="aspect-video w-full rounded-xl object-cover border border-slate-800 mb-4"
                  />

                  <h3 className="text-base font-bold text-white line-clamp-2">
                    {enr.course.title}
                  </h3>

                  <p className="text-xs text-slate-400 mt-1">
                    {t.myCourses.instructorLabel} <strong className="text-slate-300">{enr.course.instructor.name}</strong>
                  </p>

                  {/* Progress Bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">{t.myCourses.progressPercent}</span>
                      <span className="font-bold text-brand-400">{enr.progressPercent}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full transition-all duration-500"
                        style={{ width: `${enr.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4">
                  {firstLesson && (
                    <Link
                      href={`/learn/${enr.course.slug}/${firstLesson.slug}`}
                      className="flex items-center gap-1.5 rounded-xl bg-brand-500 hover:bg-brand-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-glow transition-all"
                    >
                      <PlayCircle className="h-4 w-4" /> {isFinished ? t.myCourses.reviewLessonsBtn : t.myCourses.continueLearningBtn}
                    </Link>
                  )}

                  {isFinished && (
                    <span className="flex items-center gap-1 text-xs font-bold text-amber-400">
                      <Award className="h-4 w-4" /> {t.myCourses.graduatedBadge}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>

  );
}
