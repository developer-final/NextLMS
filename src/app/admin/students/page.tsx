import { prisma } from "@/lib/prisma";
import StudentsListClient from "./StudentsListClient";

export const revalidate = 0;

export default async function AdminStudentsPage() {
  const [students, courses] = await Promise.all([
    prisma.user.findMany({
      where: { role: "STUDENT" },
      include: {
        enrollments: {
          include: {
            course: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.course.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, title: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Quản lý Học viên & Cấp quyền</h1>
          <p className="text-xs text-slate-400 mt-1">
            Tổng cộng có {students.length} học viên đăng ký trên hệ thống
          </p>
        </div>
      </div>

      <StudentsListClient initialStudents={students} courses={courses} />
    </div>
  );
}
