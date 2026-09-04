"use client";

import Link from "next/link";
import CourseCard, { CourseCardProps } from "@/components/cards/CourseCard";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { NicheConfig } from "@/lib/niches";
import {
  ArrowRight,
  Award,
  BookOpen,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";

interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count: {
    courses: number;
  };
}

interface HomePageClientProps {
  settings: {
    statsStudentCount: string;
    statsSatisfactionRate: string;
    statsPracticalRate: string;
    statsSupportHours: string;
  };
  featuredCourses: CourseCardProps["course"][];
  categories: CategoryWithCount[];
  freeCourseHref: string;
  nicheConfig?: NicheConfig;
}

export default function HomePageClient({
  settings,
  featuredCourses,
  categories,
  freeCourseHref,
  nicheConfig,
}: HomePageClientProps) {
  const { t } = useLanguage();

  const heroBadge = nicheConfig?.heroBadge || t.home.badge;
  const heroTitleLine1 = nicheConfig?.heroTitleLine1 || t.home.heroTitleLine1;
  const heroTitleHighlight = nicheConfig?.heroTitleHighlight || t.home.heroTitleHighlight;
  const heroTitleLine2 = nicheConfig?.heroTitleLine2 || t.home.heroTitleLine2;
  const heroDescription = nicheConfig?.heroDescription || t.home.heroDescription;
  const exploreBtnText = nicheConfig?.exploreBtnText || t.home.exploreCoursesBtn;
  const freeTrialBtnText = nicheConfig?.freeTrialBtnText || t.home.freeTrialBtn;

  const statStudentCount = nicheConfig?.stats.studentCount || settings.statsStudentCount;
  const statStudentLabel = nicheConfig?.stats.studentLabel || t.home.studentsEnrolled;
  const statSatisfactionRate = nicheConfig?.stats.satisfactionRate || settings.statsSatisfactionRate;
  const statSatisfactionLabel = nicheConfig?.stats.satisfactionLabel || t.home.fiveStarRating;
  const statPracticalRate = nicheConfig?.stats.practicalRate || settings.statsPracticalRate;
  const statPracticalLabel = nicheConfig?.stats.practicalLabel || t.home.practicalContent;
  const statSupportHours = nicheConfig?.stats.supportHours || settings.statsSupportHours;
  const statSupportLabel = nicheConfig?.stats.supportLabel || t.home.qaSupport;

  const categoryHeading = nicheConfig?.categoryHeading || t.home.categoriesHeading;
  const categorySubheading = nicheConfig?.categorySubheading || t.home.categoriesSubheading;
  const featuredHeading = nicheConfig?.featuredHeading || t.home.featuredHeading;
  const whyChooseHeading = nicheConfig?.whyChooseHeading || t.home.whyChooseHeading;
  const whyChooseSubheading = nicheConfig?.whyChooseSubheading || t.home.whyChooseSubheading;

  const features = nicheConfig?.features || [
    { title: t.home.feature1Title, description: t.home.feature1Desc },
    { title: t.home.feature2Title, description: t.home.feature2Desc },
    { title: t.home.feature3Title, description: t.home.feature3Desc },
  ];

  return (
    <div className="flex flex-col gap-16 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 md:pt-20 pb-16 border-b border-slate-800/60">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-500/15 blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-amber-500/10 blur-[100px] pointer-events-none rounded-full" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-950/60 px-4 py-1.5 text-xs font-semibold text-brand-400 backdrop-blur-md mb-6 shadow-glow">
            <Sparkles className="h-4 w-4" /> {heroBadge}
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.15]">
            {heroTitleLine1} <br />
            <span className="gradient-text-emerald">{heroTitleHighlight}</span> {heroTitleLine2}
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {heroDescription}
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/courses"
              className="flex items-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-400 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-glow transition-all hover:scale-105"
            >
              {exploreBtnText}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={freeCourseHref}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 px-6 py-3.5 text-sm font-semibold text-slate-200 backdrop-blur-sm transition-all"
            >
              <PlayCircle className="h-4 w-4 text-brand-400" />
              {freeTrialBtnText}
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t border-slate-800/80">
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
              <p className="text-2xl sm:text-3xl font-black text-white">{statStudentCount}</p>
              <p className="text-xs text-slate-400 mt-1">{statStudentLabel}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
              <p className="text-2xl sm:text-3xl font-black text-brand-400">{statSatisfactionRate}</p>
              <p className="text-xs text-slate-400 mt-1">{statSatisfactionLabel}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
              <p className="text-2xl sm:text-3xl font-black text-amber-400">{statPracticalRate}</p>
              <p className="text-xs text-slate-400 mt-1">{statPracticalLabel}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
              <p className="text-2xl sm:text-3xl font-black text-white">{statSupportHours}</p>
              <p className="text-xs text-slate-400 mt-1">{statSupportLabel}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORIES SECTION */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              {categoryHeading}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {categorySubheading}
            </p>
          </div>
          <Link
            href="/courses"
            className="mt-4 md:mt-0 flex items-center gap-1.5 text-xs font-semibold text-brand-400 hover:text-brand-300"
          >
            {t.home.viewAllCategories} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/courses?category=${cat.slug}`}
              className="group relative flex flex-col justify-between p-6 rounded-2xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900/80 hover:border-brand-500/40 transition-all duration-300 hover:-translate-y-1"
            >
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20 mb-4 group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-brand-400 transition-colors">
                  {cat.name}
                </h3>
                <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {cat.description || "Khám phá các khóa học chuyên sâu trong lĩnh vực này."}
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/80 pt-3">
                <span>{cat._count.courses} {t.home.availableCourses}</span>
                <span className="text-brand-400 font-semibold group-hover:translate-x-1 transition-transform">
                  {t.home.exploreArrow}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. FEATURED COURSES SECTION */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
              <Sparkles className="h-3.5 w-3.5" /> {t.home.featuredBadge}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              {featuredHeading}
            </h2>
          </div>
          <Link
            href="/courses"
            className="mt-4 md:mt-0 flex items-center gap-1.5 text-xs font-semibold text-brand-400 hover:text-brand-300"
          >
            {t.home.viewAllCourses} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>

      {/* 4. FEATURES & VALUES */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/80 to-slate-950 p-8 sm:p-12 relative overflow-hidden">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              {whyChooseHeading}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              {whyChooseSubheading}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex flex-col items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                <PlayCircle className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">{features[0]?.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {features[0]?.description}
              </p>
            </div>

            <div className="flex flex-col items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">{features[1]?.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {features[1]?.description}
              </p>
            </div>

            <div className="flex flex-col items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">{features[2]?.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {features[2]?.description}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
