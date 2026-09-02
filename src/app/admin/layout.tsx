import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import {
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Receipt,
  Settings,
  ShieldCheck,
  Tag,
  Users,
} from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/admin");
  }

  const user = session.user as any;
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN" || user.role === "INSTRUCTOR";

  if (!isAdmin) {
    redirect("/");
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-950">
      {/* Admin Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/60 p-5 hidden md:flex flex-col justify-between flex-shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Trung tâm Quản trị
              </h2>
              <span className="text-[10px] text-amber-400 font-semibold">{user.role}</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 text-xs">
            <Link
              href="/admin"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <LayoutDashboard className="h-4 w-4 text-brand-400" />
              Tổng quan Dashboard
            </Link>

            <Link
              href="/admin/orders"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <Receipt className="h-4 w-4 text-emerald-400" />
              Quản lý Đơn hàng & Duyệt
            </Link>

            <Link
              href="/admin/courses"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <BookOpen className="h-4 w-4 text-blue-400" />
              Quản lý Khóa học
            </Link>

            <Link
              href="/admin/courses/new"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <PlusCircle className="h-4 w-4 text-amber-400" />
              Tạo Khóa học Mới
            </Link>

            <Link
              href="/admin/students"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <Users className="h-4 w-4 text-purple-400" />
              Quản lý Học viên & Cấp quyền
            </Link>
          </nav>
        </div>

        <div className="border-t border-slate-800 pt-4 px-2">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white"
          >
            ← Về trang chủ Website
          </Link>
        </div>
      </aside>

      {/* Admin Content Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
