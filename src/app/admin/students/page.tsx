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

  return <StudentsListClient initialStudents={students} courses={courses} />;
}

