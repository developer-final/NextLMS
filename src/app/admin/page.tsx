import { prisma } from "@/lib/prisma";
import AdminDashboardClient from "./AdminDashboardClient";

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
    <AdminDashboardClient
      totalRevenue={totalRevenue}
      pendingOrdersCount={pendingOrdersCount}
      totalStudentsCount={totalStudentsCount}
      totalCoursesCount={totalCoursesCount}
      recentOrders={recentOrders}
      popularCourses={popularCourses}
    />
  );
}

