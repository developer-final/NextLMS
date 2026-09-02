import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminCoursesClient from "./AdminCoursesClient";

export const revalidate = 0;

export default async function AdminCoursesPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  const whereClause =
    user?.role === "INSTRUCTOR" ? { instructorId: user.id } : {};

  const courses = await prisma.course.findMany({
    where: whereClause,
    include: {
      instructor: { select: { name: true } },
      category: { select: { name: true } },
      sections: {
        include: {
          lessons: { select: { id: true } },
        },
      },
      _count: {
        select: { enrollments: true, reviews: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return <AdminCoursesClient courses={courses} />;
}


