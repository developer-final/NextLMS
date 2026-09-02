import { getSystemSettings } from "@/lib/config";
import SettingsFormClient from "./SettingsFormClient";
import { Settings } from "lucide-react";

export const revalidate = 0;

export default async function AdminSettingsPage() {
  const currentSettings = await getSystemSettings();

  return (
    <div className="max-w-5xl">
      <SettingsFormClient initialSettings={currentSettings} />
    </div>
  );
}

