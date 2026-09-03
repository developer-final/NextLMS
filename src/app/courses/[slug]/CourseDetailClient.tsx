"use client";

import Link from "next/link";
import { formatVND, formatDuration, getYouTubeEmbedUrl } from "@/lib/utils";
import { useLanguage } from "@/components/providers/LanguageProvider";
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  GraduationCap,
  Lock,
  PlayCircle,
  Sparkles,
  Star,
  User,
} from "lucide-react";
import CustomVideoPlayer from "@/components/learn/CustomVideoPlayer";

interface CourseDetailClientProps {
  course: any;
  isEnrolled: boolean;
  totalLessons: number;
  totalHours: string;
  firstLesson: any;
}

export default function CourseDetailClient({
  course,
  isEnrolled,
  totalLessons,
  totalHours,
  firstLesson,
}: CourseDetailClientProps) {
  const { t } = useLanguage();

  const levelLabels: Record<string, string> = {
    BEGINNER: t.common.beginner,
    INTERMEDIATE: t.common.intermediate,
    ADVANCED: t.common.advanced,
    ALL_LEVELS: t.common.allLevels,
  };

  return (
    <div className="flex flex-col pb-20">
      {/* 1. Header Banner */}
      <section className="border-b border-slate-800 bg-slate-950/90 py-10 md:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left Info */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {course.category && (
                  <span className="rounded-md bg-brand-500/10 px-2.5 py-1 text-xs font-semibold text-brand-400 border border-brand-500/20">
                    {course.category.name}
                  </span>
                )}
                <span className="rounded-md bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300">
                  {levelLabels[course.level] || course.level}
                </span>
                {course.isFeatured && (
                  <span className="flex items-center gap-1 rounded-md bg-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-400 border border-amber-500/30">
                    <Sparkles className="h-3 w-3" /> {t.courseDetail.featuredBadge}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                {course.title}
              </h1>

              {course.shortDescription && (
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  {course.shortDescription}
                </p>
              )}

              {/* Course Tags */}
              {course.tags && course.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {course.tags.map((tag: any) => (
                    <Link
                      key={tag.id || tag.slug}
                      href={`/courses?tag=${tag.slug}`}
                      className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
                    >
                      #{tag.name}
                    </Link>
                  ))}
                </div>
              )}

              {/* Meta stats */}
              <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-400 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold overflow-hidden border border-slate-700">
                    {course.instructor.avatarUrl ? (
                      <img
                        src={course.instructor.avatarUrl}
                        alt={course.instructor.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                  <span>
                    {t.courseDetail.instructorLabel} <strong className="text-white">{course.instructor.name}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-1 text-amber-400 font-semibold">
                  <Star className="h-4 w-4 fill-amber-400" />
                  <span>5.0 ({course._count.reviews} {t.courseDetail.reviewsCount})</span>
                </div>

                <div className="flex items-center gap-1 text-slate-300">
                  <GraduationCap className="h-4 w-4 text-brand-400" />
                  <span>{course._count.enrollments} {t.courseDetail.studentsCount}</span>
                </div>

                <div className="flex items-center gap-1 text-slate-300">
                  <Clock className="h-4 w-4 text-brand-400" />
                  <span>~{totalHours} {t.courseDetail.approxDuration}</span>
                </div>
              </div>
            </div>

            {/* Right Card / CTA (Desktop Sidebar) */}
            <div className="lg:col-span-1">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl">
                {/* Intro Video / Thumbnail Preview */}
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-800 mb-6">
                  {course.introVideoUrl ? (
                    <CustomVideoPlayer
                      src={course.introVideoUrl}
                      title={course.title}
                      poster={course.thumbnailUrl}
                    />
                  ) : (
                    <img
                      src={
                        course.thumbnailUrl ||
                        "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80"
                      }
                      alt={course.title}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                {/* Price Display */}
                <div className="mb-6">
                  {course.isFree ? (
                    <div className="text-3xl font-black text-brand-400">{t.courseDetail.free100}</div>
                  ) : course.salePrice ? (
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-black text-brand-400">
                        {formatVND(course.salePrice)}
                      </span>
                      <span className="text-sm text-slate-500 line-through">
                        {formatVND(course.price)}
                      </span>
                    </div>
                  ) : (
                    <div className="text-3xl font-black text-white">
                      {formatVND(course.price)}
                    </div>
                  )}
                </div>

                {/* Main Action Button */}
                {isEnrolled ? (
                  <Link
                    href={
                      firstLesson
                        ? `/learn/${course.slug}/${firstLesson.slug}`
                        : `/my-courses`
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-400 py-3.5 text-sm font-bold text-slate-950 shadow-glow transition-all hover:scale-[1.02]"
                  >
                    <PlayCircle className="h-5 w-5" /> {t.courseDetail.startLearningNow}
                  </Link>
                ) : (
                  <Link
                    href={`/checkout/${course.slug}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-400 py-3.5 text-sm font-bold text-slate-950 shadow-glow transition-all hover:scale-[1.02]"
                  >
                    <Sparkles className="h-5 w-5" />
                    {course.isFree ? t.courseDetail.enrollFree : t.courseDetail.enrollNow}
                  </Link>
                )}

                <div className="mt-6 space-y-2.5 text-xs text-slate-300 border-t border-slate-800 pt-5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-brand-400" />
                    <span>{t.courseDetail.perk1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-brand-400" />
                    <span>{t.courseDetail.perk2}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-brand-400" />
                    <span>{t.courseDetail.perk3}</span>
                  </div>
                  {course.certificateEnabled && (
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-amber-400" />
                      <span>{t.courseDetail.perk4}</span>
                    </div>
                  )}
                  {((course.attachments?.length || 0) +
                    (course.sections?.reduce(
                      (acc: number, s: any) =>
                        acc +
                        (s.lessons?.reduce(
                          (lAcc: number, l: any) => lAcc + (l.attachments?.length || 0),
                          0
                        ) || 0),
                      0
                    ) || 0) > 0) && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-brand-400" />
                      <span>
                        {(course.attachments?.length || 0) +
                          (course.sections?.reduce(
                            (acc: number, s: any) =>
                              acc +
                              (s.lessons?.reduce(
                                (lAcc: number, l: any) => lAcc + (l.attachments?.length || 0),
                                0
                              ) || 0),
                            0
                          ) || 0)}{" "}
                        {t.courseDetail.attachmentsCount}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Course Details & Curriculum */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            {/* Description Tab */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-brand-400" /> {t.courseDetail.overviewTab}
              </h2>
              <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                {course.description || t.courseDetail.noDescription}
              </div>
            </div>

            {/* Curriculum Tab */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-brand-400" /> {t.courseDetail.curriculumTab}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {course.sections.length} {t.courseDetail.curriculumSummary} • {totalLessons} {t.courseDetail.lessonsCount} • ~{totalHours} {t.courseDetail.approxDuration}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {course.sections.map((section: any) => (
                  <div
                    key={section.id}
                    className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80"
                  >
                    <div className="bg-slate-800/60 px-5 py-3.5 flex items-center justify-between">
                      <span className="font-bold text-sm text-white">
                        {section.title}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {section.lessons.length} {t.courseDetail.lessonsCount}
                      </span>
                    </div>

                    <div className="divide-y divide-slate-800/60">
                      {section.lessons.map((lesson: any) => (
                        <div
                          key={lesson.id}
                          className="px-5 py-3 flex items-center justify-between text-xs hover:bg-slate-800/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {lesson.isPreview || isEnrolled ? (
                              <PlayCircle className="h-4 w-4 text-brand-400 flex-shrink-0" />
                            ) : (
                              <Lock className="h-4 w-4 text-slate-500 flex-shrink-0" />
                            )}
                            <span className="text-slate-200 font-medium">
                              {lesson.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            {lesson.isPreview && (
                              <Link
                                href={`/learn/${course.slug}/${lesson.slug}`}
                                className="flex items-center gap-1 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30 px-2 py-0.5 text-[10px] font-bold hover:bg-brand-500 hover:text-slate-950 transition-colors"
                              >
                                <Eye className="h-3 w-3" /> {t.courseDetail.previewBadge}
                              </Link>
                            )}
                            <span className="text-slate-500">
                              {formatDuration(lesson.videoDuration)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructor Bio */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8">
              <h2 className="text-xl font-bold text-white mb-4">{t.courseDetail.aboutInstructorTab}</h2>
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-2xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-lg overflow-hidden border border-slate-700 flex-shrink-0">
                  {course.instructor.avatarUrl ? (
                    <img
                      src={course.instructor.avatarUrl}
                      alt={course.instructor.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-8 w-8" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{course.instructor.name}</h3>
                  <p className="text-xs text-brand-400 font-medium">{course.instructor.headline}</p>
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                    {course.instructor.bio || t.courseDetail.instructorFallbackBio}
                  </p>
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8">
              <h2 className="text-xl font-bold text-white mb-4">
                {t.courseDetail.reviewsTab} ({course.reviews.length})
              </h2>

              {course.reviews.length === 0 ? (
                <p className="text-xs text-slate-400">{t.courseDetail.noReviews}</p>
              ) : (
                <div className="space-y-4">
                  {course.reviews.map((rev: any) => (
                    <div
                      key={rev.id}
                      className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-bold">
                            {rev.user.name.charAt(0)}
                          </div>
                          <span className="text-xs font-semibold text-white">
                            {rev.user.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
