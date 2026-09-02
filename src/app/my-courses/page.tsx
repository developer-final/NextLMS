import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import MyCoursesClient from "./MyCoursesClient";

export const revalidate = 0;

export default async function MyCoursesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/my-courses");
  }

  const userId = session.user.id;

  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId,
      status: "ACTIVE",
    },
    include: {
      course: {
        include: {
          instructor: {
            select: { name: true, avatarUrl: true },
          },
          sections: {
            orderBy: { orderIndex: "asc" },
            include: {
              lessons: {
                orderBy: { orderIndex: "asc" },
                select: { id: true, slug: true, title: true },
              },
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return <MyCoursesClient enrollments={serializePrisma(enrollments)} />;
}

