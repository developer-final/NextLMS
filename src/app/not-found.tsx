import Link from "next/link";
import { ArrowLeft, BookOpen, Compass, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="relative inline-flex items-center justify-center">
          <div className="absolute h-32 w-32 rounded-full bg-brand-500/20 blur-3xl" />
          <div className="relative h-24 w-24 rounded-3xl border border-brand-500/30 bg-slate-900/80 p-5 backdrop-blur-xl flex items-center justify-center text-brand-400 shadow-glow">
            <Compass className="h-12 w-12 animate-pulse" />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-400">
            Mã lỗi 404
          </p>
          <h1 className="text-3xl font-black text-white sm:text-4xl">
            Không tìm thấy trang
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Nội dung bạn đang tìm kiếm có thể đã được chuyển dời, đổi tên hoặc tạm thời không khả dụng trên hệ thống World Trading Lab.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-400 px-5 py-3 text-xs font-bold text-slate-950 shadow-glow transition-all"
          >
            <Home className="h-4 w-4" /> Về Trang Chủ
          </Link>
          <Link
            href="/courses"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 px-5 py-3 text-xs font-semibold text-slate-200 transition-all"
          >
            <BookOpen className="h-4 w-4 text-brand-400" /> Xem Khóa Học
          </Link>
        </div>
      </div>
    </div>
  );
}
