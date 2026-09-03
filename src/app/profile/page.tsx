import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import ProfileClient from "./ProfileClient";

export const revalidate = 0;

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/profile");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      headline: true,
      bio: true,
      role: true,
      status: true,
      emailVerified: true,
      passwordHash: true,
      createdAt: true,
      _count: {
        select: {
          enrollments: true,
          certificates: true,
          reviews: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/auth/login?callbackUrl=/profile");
  }

  const initialProfile = {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    headline: user.headline || "",
    bio: user.bio || "",
    role: user.role,
    status: user.status,
    emailVerified: Boolean(user.emailVerified),
    hasPassword: Boolean(user.passwordHash),
    createdAt: user.createdAt.toISOString(),
    stats: {
      enrolledCourses: user._count.enrollments,
      certificates: user._count.certificates,
      reviews: user._count.reviews,
    },
  };

  return <ProfileClient initialProfile={serializePrisma(initialProfile)} />;
}
