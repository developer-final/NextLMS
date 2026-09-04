import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import AdminCoursesClient from "./AdminCoursesClient";

export const revalidate = 0;

interface AdminCoursesPageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
    category?: string;
  }>;
}

export default async function AdminCoursesPage({ searchParams }: AdminCoursesPageProps) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  const { page, q, status, category } = await searchParams;

  const pageSize = 10;
  const currentPage = Math.max(1, parseInt(page || "1", 10));

  const whereClause: any = {};
  if (user?.role === "INSTRUCTOR") {
    whereClause.instructorId = user.id;
  }

  if (status && status !== "ALL") {
    whereClause.status = status;
  }

  if (category && category !== "ALL") {
    whereClause.categoryId = category;
  }

  if (q && q.trim()) {
    const trimmedQ = q.trim();
    whereClause.OR = [
      { title: { contains: trimmedQ, mode: "insensitive" } },
      { instructor: { name: { contains: trimmedQ, mode: "insensitive" } } },
      { category: { name: { contains: trimmedQ, mode: "insensitive" } } },
      { tags: { some: { name: { contains: trimmedQ, mode: "insensitive" } } } },
    ];
  }

  const [totalCourses, courses, categories] = await Promise.all([
    prisma.course.count({ where: whereClause }),
    prisma.course.findMany({
      where: whereClause,
      include: {
        instructor: { select: { name: true } },
        category: { select: { name: true } },
        tags: { select: { id: true, name: true, slug: true } },
        sections: {
          select: {
            id: true,
            _count: { select: { lessons: true } },
          },
        },
        _count: {
          select: { enrollments: true, reviews: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.category.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { orderIndex: "asc" },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCourses / pageSize));

  return (
    <AdminCoursesClient
      courses={serializePrisma(courses)}
      categories={categories}
      currentSearch={q || ""}
      currentStatus={status || "ALL"}
      currentCategory={category || "ALL"}
      pagination={{
        currentPage,
        totalPages,
        totalItems: totalCourses,
        pageSize,
      }}
    />
  );
}


