import { getSystemSettings } from "@/lib/config";
import SettingsFormClient from "./SettingsFormClient";
import { Settings } from "lucide-react";

export const revalidate = 0;

export default async function AdminSettingsPage() {
  const currentSettings = await getSystemSettings();

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
          <Settings className="h-7 w-7 text-teal-400" /> Cài đặt Hệ thống & Thanh toán VietQR
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Quản lý thông tin tài khoản ngân hàng nhận tiền, kênh liên lạc hỗ trợ và cấu hình hiển thị toàn website
        </p>
      </div>

      <SettingsFormClient initialSettings={currentSettings} />
    </div>
  );
}
