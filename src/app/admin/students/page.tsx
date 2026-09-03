import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import StudentsListClient from "./StudentsListClient";

export const revalidate = 0;

interface AdminStudentsPageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
    courseId?: string;
    status?: string;
  }>;
}

export default async function AdminStudentsPage({ searchParams }: AdminStudentsPageProps) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    redirect("/admin/courses");
  }

  const { page, q, courseId, status } = await searchParams;

  const pageSize = 10;
  const currentPage = Math.max(1, parseInt(page || "1", 10));

  const whereClause: any = {
    role: "STUDENT",
  };

  if (status && status !== "ALL") {
    whereClause.status = status;
  }

  if (courseId && courseId !== "ALL") {
    whereClause.enrollments = {
      some: {
        courseId,
      },
    };
  }

  if (q && q.trim()) {
    const trimmedQ = q.trim();
    whereClause.OR = [
      { name: { contains: trimmedQ } },
      { email: { contains: trimmedQ } },
    ];
  }

  const [totalStudents, students, courses] = await Promise.all([
    prisma.user.count({ where: whereClause }),
    prisma.user.findMany({
      where: whereClause,
      include: {
        enrollments: {
          include: {
            course: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.course.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalStudents / pageSize));

  return (
    <StudentsListClient
      initialStudents={serializePrisma(students)}
      courses={courses}
      currentSearch={q || ""}
      currentCourseId={courseId || "ALL"}
      currentStatus={status || "ALL"}
      pagination={{
        currentPage,
        totalPages,
        totalItems: totalStudents,
        pageSize,
      }}
    />
  );
}


