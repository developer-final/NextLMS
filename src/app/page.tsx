import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSystemSettings } from "@/lib/config";
import CourseCard, { CourseCardProps } from "@/components/cards/CourseCard";
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

export const revalidate = 0; // Dynamic data

interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count: {
    courses: number;
  };
}

export default async function HomePage() {
  const [settings, featuredCourses, categories, firstFreeCourse] = await Promise.all([
    getSystemSettings(),
    prisma.course.findMany({
      where: { status: "PUBLISHED" },
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
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: 6,
    }),
    prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { courses: true },
        },
      },
      orderBy: { orderIndex: "asc" },
    }),
    prisma.course.findFirst({
      where: { status: "PUBLISHED", isFree: true },
      select: { slug: true },
    }),
  ]);

  const freeCourseHref = firstFreeCourse
    ? `/courses/${firstFreeCourse.slug}`
    : `/courses?type=free`;

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
            <Sparkles className="h-4 w-4" /> Hệ thống Đào tạo & Khóa học Trực tuyến Chuẩn Quốc tế
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.15]">
            Nâng tầm Kiến thức <br />
            <span className="gradient-text-emerald">Thực chiến Đỉnh cao</span> & Làm chủ Thị trường
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Học từ các chuyên gia hàng đầu về Giao dịch Tài chính, SMC, Phân tích Kỹ thuật và Kỹ năng Chuyên sâu với hệ thống bài giảng Video HD, giáo trình chuẩn hóa và hỗ trợ 1-1.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/courses"
              className="flex items-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-400 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-glow transition-all hover:scale-105"
            >
              Khám phá Tất cả Khóa học
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={freeCourseHref}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 px-6 py-3.5 text-sm font-semibold text-slate-200 backdrop-blur-sm transition-all"
            >
              <PlayCircle className="h-4 w-4 text-brand-400" />
              Học thử Miễn phí
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t border-slate-800/80">
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
              <p className="text-2xl sm:text-3xl font-black text-white">{settings.statsStudentCount}</p>
              <p className="text-xs text-slate-400 mt-1">Học viên Đang theo học</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
              <p className="text-2xl sm:text-3xl font-black text-brand-400">{settings.statsSatisfactionRate}</p>
              <p className="text-xs text-slate-400 mt-1">Đánh giá 5 Sao</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
              <p className="text-2xl sm:text-3xl font-black text-amber-400">{settings.statsPracticalRate}</p>
              <p className="text-xs text-slate-400 mt-1">Nội dung Thực chiến</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
              <p className="text-2xl sm:text-3xl font-black text-white">{settings.statsSupportHours}</p>
              <p className="text-xs text-slate-400 mt-1">Hỗ trợ & Giải đáp Q&A</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORIES SECTION */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Chủ đề & Lĩnh vực Đào tạo
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Lựa chọn lộ trình học tập phù hợp với mục tiêu và định hướng của bạn
            </p>
          </div>
          <Link
            href="/courses"
            className="mt-4 md:mt-0 flex items-center gap-1.5 text-xs font-semibold text-brand-400 hover:text-brand-300"
          >
            Xem tất cả chuyên mục <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat: CategoryWithCount) => (
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
                <span>{cat._count.courses} khóa học có sẵn</span>
                <span className="text-brand-400 font-semibold group-hover:translate-x-1 transition-transform">
                  Khám phá →
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
              <Sparkles className="h-3.5 w-3.5" /> Tuyển chọn chất lượng cao
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Khóa học Tiêu biểu & Bán chạy nhất
            </h2>
          </div>
          <Link
            href="/courses"
            className="mt-4 md:mt-0 flex items-center gap-1.5 text-xs font-semibold text-brand-400 hover:text-brand-300"
          >
            Xem toàn bộ khoá học <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredCourses.map((course: CourseCardProps["course"]) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>

      {/* 4. FEATURES & VALUES */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/80 to-slate-950 p-8 sm:p-12 relative overflow-hidden">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Trải nghiệm Học tập Khác biệt tại World Trading Lab
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Chúng tôi tập trung 100% vào việc mang lại kết quả thực tế cho từng học viên
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex flex-col items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                <PlayCircle className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Học mọi lúc mọi nơi</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Video bài giảng lưu trữ CDN tốc độ cao, ghi nhớ vị trí xem dở trên mọi thiết bị (Điện thoại, iPad, Laptop).
              </p>
            </div>

            <div className="flex flex-col items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Thanh toán VietQR Kích hoạt Tự động</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Thao tác quét mã QR ngân hàng nội địa tiện lợi, kích hoạt khóa học vào học ngay chỉ sau vài giây.
              </p>
            </div>

            <div className="flex flex-col items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Chứng chỉ Hoàn thành Chuẩn hóa</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cấp chứng chỉ điện tử có mã định danh QR xác thực khi học viên hoàn thành 100% giáo trình khóa học.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
