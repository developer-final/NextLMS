"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  Check,
  CreditCard,
  Globe,
  HelpCircle,
  Mail,
  Phone,
  QrCode,
  Save,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { SystemConfig } from "@/lib/config";
import { generateVietQRUrl } from "@/lib/vietqr";

interface SettingsFormClientProps {
  initialSettings: SystemConfig;
}

export default function SettingsFormClient({ initialSettings }: SettingsFormClientProps) {
  const [formData, setFormData] = useState<SystemConfig>(initialSettings);
  const [activeTab, setActiveTab] = useState<"payment" | "contact" | "hero" | "policy">("payment");
  const [saving, setSaving] = useState(false);

  const handleChange = (field: keyof SystemConfig, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: formData }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Lỗi lưu cấu hình");
        return;
      }

      toast.success("🎉 Lưu cấu hình hệ thống thành công!");
    } catch (err) {
      toast.error("Lỗi kết nối khi lưu cấu hình");
    } finally {
      setSaving(false);
    }
  };

  // Preview QR code
  const previewQrUrl = generateVietQRUrl({
    bankId: formData.bankId,
    accountNo: formData.bankAccountNo,
    accountName: formData.bankAccountName,
    amount: 500000,
    description: "EL TEST99",
    template: formData.vietqrTemplate as any,
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("payment")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === "payment"
              ? "bg-brand-500 text-slate-950 shadow-glow"
              : "bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700"
          }`}
        >
          <CreditCard className="h-4 w-4" /> 1. Thanh toán & VietQR
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("contact")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === "contact"
              ? "bg-brand-500 text-slate-950 shadow-glow"
              : "bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700"
          }`}
        >
          <Phone className="h-4 w-4" /> 2. Liên hệ & Thương hiệu
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("hero")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === "hero"
              ? "bg-brand-500 text-slate-950 shadow-glow"
              : "bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700"
          }`}
        >
          <TrendingUp className="h-4 w-4" /> 3. Số liệu Trang chủ
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("policy")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === "policy"
              ? "bg-brand-500 text-slate-950 shadow-glow"
              : "bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700"
          }`}
        >
          <ShieldCheck className="h-4 w-4" /> 4. Chính sách & Hoàn tiền
        </button>
      </div>

      {/* 1. PAYMENT & VIETQR TAB */}
      {activeTab === "payment" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <CreditCard className="h-4 w-4 text-brand-400" /> Tài khoản Ngân hàng Thụ hưởng
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mã Ngân hàng (VietQR Bank ID)
                </label>
                <select
                  value={formData.bankId}
                  onChange={(e) => handleChange("bankId", e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-brand-500 focus:outline-none"
                >
                  <option value="MB">MB (MB Bank - Quân Đội)</option>
                  <option value="VCB">VCB (Vietcombank)</option>
                  <option value="TCB">TCB (Techcombank)</option>
                  <option value="VPB">VPB (VPBank)</option>
                  <option value="ACB">ACB (Á Châu)</option>
                  <option value="ICB">ICB (VietinBank)</option>
                  <option value="BIDV">BIDV (Đầu tư & Phát triển)</option>
                  <option value="TPB">TPB (TPBank)</option>
                  <option value="STB">STB (Sacombank)</option>
                  <option value="MSB">MSB (Hàng Hải)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">Dùng để sinh mã QR chuẩn VietQR tự động.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tên hiển thị Ngân hàng
                </label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => handleChange("bankName", e.target.value)}
                  placeholder="MB Bank (Ngân hàng Quân Đội)"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Số tài khoản nhận tiền
                </label>
                <input
                  type="text"
                  value={formData.bankAccountNo}
                  onChange={(e) => handleChange("bankAccountNo", e.target.value)}
                  placeholder="0988888888"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white font-mono focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tên Chủ tài khoản (Không dấu)
                </label>
                <input
                  type="text"
                  value={formData.bankAccountName}
                  onChange={(e) => handleChange("bankAccountName", e.target.value.toUpperCase())}
                  placeholder="WORLD TRADING LAB"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white uppercase focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mẫu giao diện VietQR
                </label>
                <select
                  value={formData.vietqrTemplate}
                  onChange={(e) => handleChange("vietqrTemplate", e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-brand-500 focus:outline-none"
                >
                  <option value="compact2">Compact 2 (Đẹp, gọn gàng, chuẩn TMĐT)</option>
                  <option value="compact">Compact (Tiêu chuẩn)</option>
                  <option value="qr_only">Chỉ mã QR (Không khung)</option>
                  <option value="print">Bản in (Full thông tin)</option>
                </select>
              </div>
            </div>
          </div>

          {/* QR Live Preview */}
          <div className="lg:col-span-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col items-center justify-center text-center space-y-3">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <QrCode className="h-4 w-4 text-brand-400" /> Xem thử Mã VietQR thanh toán
            </span>
            <div className="p-2 bg-white rounded-2xl shadow-lg">
              <img src={previewQrUrl} alt="Preview QR" className="w-48 h-auto object-contain" />
            </div>
            <p className="text-[11px] text-slate-400">
              Mã QR mẫu với STK: <strong>{formData.bankAccountNo}</strong> ({formData.bankId})
            </p>
          </div>
        </div>
      )}

      {/* 2. CONTACT & BRAND TAB */}
      {activeTab === "contact" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
            <Globe className="h-4 w-4 text-brand-400" /> Thông tin Nền tảng & Kênh Liên lạc
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tên Nền tảng (Brand Name)
              </label>
              <input
                type="text"
                value={formData.appName}
                onChange={(e) => handleChange("appName", e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Khẩu hiệu / Slogan ngắn
              </label>
              <input
                type="text"
                value={formData.appSlogan}
                onChange={(e) => handleChange("appSlogan", e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mô tả giới thiệu Footer
              </label>
              <textarea
                rows={2}
                value={formData.appDescription}
                onChange={(e) => handleChange("appDescription", e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Hỗ trợ học viên
              </label>
              <input
                type="email"
                value={formData.supportEmail}
                onChange={(e) => handleChange("supportEmail", e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Hotline / Số điện thoại Zalo
              </label>
              <input
                type="text"
                value={formData.supportHotline}
                onChange={(e) => handleChange("supportHotline", e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Đường dẫn Zalo Chat
              </label>
              <input
                type="text"
                value={formData.zaloUrl}
                onChange={(e) => handleChange("zaloUrl", e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Đường dẫn Kênh Telegram
              </label>
              <input
                type="text"
                value={formData.telegramUrl}
                onChange={(e) => handleChange("telegramUrl", e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. HERO & LANDING STATS TAB */}
      {activeTab === "hero" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
            <TrendingUp className="h-4 w-4 text-brand-400" /> Tùy chỉnh Con số Thống kê Trang chủ
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Số học viên hiển thị
              </label>
              <input
                type="text"
                value={formData.statsStudentCount}
                onChange={(e) => handleChange("statsStudentCount", e.target.value)}
                placeholder="5,000+"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tỉ lệ Đánh giá 5 Sao
              </label>
              <input
                type="text"
                value={formData.statsSatisfactionRate}
                onChange={(e) => handleChange("statsSatisfactionRate", e.target.value)}
                placeholder="98.6%"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tỉ lệ Nội dung Thực chiến
              </label>
              <input
                type="text"
                value={formData.statsPracticalRate}
                onChange={(e) => handleChange("statsPracticalRate", e.target.value)}
                placeholder="100%"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Thời gian Hỗ trợ Q&A
              </label>
              <input
                type="text"
                value={formData.statsSupportHours}
                onChange={(e) => handleChange("statsSupportHours", e.target.value)}
                placeholder="24/7"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. POLICY & REFUND TAB */}
      {activeTab === "policy" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
            <ShieldCheck className="h-4 w-4 text-brand-400" /> Cam kết Chất lượng & Điều kiện Hoàn tiền
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Số ngày cho phép yêu cầu hoàn tiền
              </label>
              <input
                type="number"
                min={0}
                max={30}
                value={formData.refundDays}
                onChange={(e) => handleChange("refundDays", e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">Mặc định: 7 ngày kể từ lúc thanh toán.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tiến độ xem tối đa (% giáo trình) để được hoàn tiền
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={formData.refundMaxProgress}
                onChange={(e) => handleChange("refundMaxProgress", e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">Mặc định: dưới 30% nội dung khóa học.</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Submit */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-400 px-6 py-3 text-sm font-bold text-slate-950 shadow-glow transition-all hover:scale-[1.02] disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Đang lưu cấu hình..." : "Lưu Cài đặt Hệ thống"}
        </button>
      </div>
    </form>
  );
}
