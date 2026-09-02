import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AdminSidebarClient from "@/components/layout/AdminSidebarClient";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/admin");
  }

  const user = session.user as any;
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN" || user.role === "INSTRUCTOR";

  if (!isAdmin) {
    redirect("/");
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-950">
      <AdminSidebarClient userRole={user.role} />
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">{children}</main>
    </div>
  );
}

