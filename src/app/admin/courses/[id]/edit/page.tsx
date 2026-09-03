import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import CourseEditForm from "./CourseEditForm";

export const revalidate = 0;

interface EditCoursePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCoursePage({ params }: EditCoursePageProps) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  const { id } = await params;

  const [course, categories] = await Promise.all([
    prisma.course.findUnique({
      where: { id },
      include: {
        category: true,
        instructor: { select: { id: true, name: true } },
        attachments: true,
        sections: {
          orderBy: { orderIndex: "asc" },
          include: {
            lessons: {
              orderBy: { orderIndex: "asc" },
              include: {
                attachments: true,
              },
            },
          },
        },
      },
    }),
    prisma.category.findMany({
      orderBy: { orderIndex: "asc" },
    }),
  ]);

  if (!course) {
    notFound();
  }

  // If user is INSTRUCTOR, they can only edit their own courses
  if (user?.role === "INSTRUCTOR" && course.instructorId !== user.id) {
    redirect("/admin/courses");
  }

  return (
    <div className="max-w-5xl">
      <CourseEditForm course={serializePrisma(course)} categories={categories} />
    </div>
  );
}

