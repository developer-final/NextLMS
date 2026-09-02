import { prisma } from "@/lib/prisma";
import CourseCreateForm from "./CourseCreateForm";

export const revalidate = 0;

export default async function NewCoursePage() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { orderIndex: "asc" },
  });

  return (
    <div className="max-w-5xl">
      <CourseCreateForm categories={categories} />
    </div>
  );
}

