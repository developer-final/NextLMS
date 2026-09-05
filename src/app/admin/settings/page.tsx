import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSystemSettings } from "@/lib/config";
import SettingsFormClient from "./SettingsFormClient";

export const revalidate = 0;

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    redirect("/admin/courses");
  }

  const currentSettings = await getSystemSettings();
  const isDev =
    process.env.NODE_ENV === "development" ||
    process.env.APP_ENV === "development";

  return (
    <div className="max-w-5xl">
      <SettingsFormClient initialSettings={currentSettings} isDev={isDev} />
    </div>
  );
}


