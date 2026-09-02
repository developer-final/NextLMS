import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatVND } from "@/lib/utils";
import {
  ArrowRight,
  BookOpen,
  DollarSign,
  GraduationCap,
  Receipt,
  TrendingUp,
  Users,
  Clock,
  CheckCircle2,
} from "lucide-react";

export const revalidate = 0;

export default async function AdminDashboardPage() {
  const [
    totalRevenueResult,
    pendingOrdersCount,
    totalStudentsCount,
    totalCoursesCount,
    recentOrders,
    popularCourses,
  ] = await Promise.all([
    // Total Revenue from completed orders
    prisma.order.aggregate({
      where: { status: "COMPLETED" },
      _sum: { finalAmount: true },
    }),
    // Pending Orders count
    prisma.order.count({
      where: { status: "PENDING" },
    }),
    // Total Students count
    prisma.user.count({
      where: { role: "STUDENT" },
    }),
    // Total Courses count
    prisma.course.count(),
    // Recent 5 orders
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        orderItems: { include: { course: { select: { title: true } } } },
      },
    }),
    // Popular courses
    prisma.course.findMany({
      take: 4,
      orderBy: { enrollments: { _count: "desc" } },
      include: {
        _count: { select: { enrollments: true } },
      },
    }),
  ]);

  const totalRevenue = totalRevenueResult._sum.finalAmount || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Tổng quan Hoạt động</h1>
        <p className="text-xs text-slate-400 mt-1">
          Báo cáo doanh thu, đơn hàng và tình hình học viên toàn hệ thống
        </p>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Tổng Doanh Thu</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-400">{formatVND(totalRevenue)}</p>
          <p className="text-[10px] text-slate-500">Từ các đơn hàng thành công</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Đơn Chờ Duyệt</span>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-400">{pendingOrdersCount}</p>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:underline font-semibold"
          >
            Duyệt đơn ngay →
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Tổng Số Học Viên</span>
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">{totalStudentsCount}</p>
          <p className="text-[10px] text-slate-500">Tài khoản học viên đã đăng ký</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Tổng Số Khóa Học</span>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">{totalCoursesCount}</p>
          <Link
            href="/admin/courses"
            className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:underline font-semibold"
          >
            Quản lý khóa học →
          </Link>
        </div>
      </div>

      {/* Grid: Recent Orders & Top Courses */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Recent Orders Table */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Receipt className="h-4 w-4 text-emerald-400" /> Đơn Hàng Mới Nhất
            </h3>
            <Link
              href="/admin/orders"
              className="text-xs text-brand-400 hover:underline font-semibold"
            >
              Xem tất cả ({pendingOrdersCount + recentOrders.length})
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">Chưa có đơn hàng nào.</p>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {recentOrders.map((order) => (
                <div key={order.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block">#{order.orderCode}</span>
                    <span className="text-slate-400 text-[11px]">
                      {order.user.name} ({order.user.email})
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-brand-400 block">
                      {formatVND(order.finalAmount)}
                    </span>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        order.status === "COMPLETED"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : order.status === "PENDING"
                          ? "bg-amber-950 text-amber-400 border border-amber-800"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Popular Courses */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-brand-400" /> Khóa Học Đang Thu Hút Học Viên
          </h3>

          <div className="space-y-3">
            {popularCourses.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs"
              >
                <div className="max-w-[200px]">
                  <h4 className="font-bold text-white truncate">{c.title}</h4>
                  <span className="text-[10px] text-slate-400">{formatVND(c.price)}</span>
                </div>
                <span className="text-brand-400 font-bold text-xs">
                  {c._count.enrollments} học viên
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
