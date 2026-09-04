import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AdminAffiliateClient from "./AdminAffiliateClient";

export const metadata = {
  title: "Quản Lý Tiếp Thị Liên Kết | World Trading Lab Admin",
  description: "Quản lý đối tác affiliate, hoa hồng và các lệnh rút tiền.",
};

export default async function AdminAffiliatesPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    redirect("/admin");
  }

  return <AdminAffiliateClient />;
}
