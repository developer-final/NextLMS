"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  CreditCard,
  Globe,
  Phone,
  QrCode,
  Save,
  ShieldCheck,
  TrendingUp,
  Zap,
  CheckCircle2,
  Key,
  Coins,
  AlertTriangle,
} from "lucide-react";
import { SystemConfig } from "@/lib/config";
import { generateVietQRUrl } from "@/lib/vietqr";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { validateBankSettingsInput, isValidEmail } from "@/lib/validation";

interface SettingsFormClientProps {
  initialSettings: SystemConfig;
}

export default function SettingsFormClient({ initialSettings }: SettingsFormClientProps) {
  const { t, language } = useLanguage();
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

    if (formData.supportEmail && !isValidEmail(formData.supportEmail)) {
      toast.error(t.admin.settings.invalidEmail);
      return;
    }

    if (formData.bankId || formData.bankAccountNo || formData.bankAccountName) {
      const bankVal = validateBankSettingsInput({
        bankId: formData.bankId,
        bankAccountNo: formData.bankAccountNo,
        bankAccountName: formData.bankAccountName,
      });
      if (!bankVal.isValid) {
        toast.error(
          bankVal.field === "bankId"
            ? t.admin.settings.selectBankRequired
            : bankVal.field === "bankAccountNo"
            ? t.admin.settings.accountNoRequired
            : t.admin.settings.accountHolderRequired
        );
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: formData }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t.admin.settings.saveFailed);
        return;
      }

      toast.success(`🎉 ${t.admin.settings.saveSuccess}`);
    } catch (err) {
      toast.error(t.admin.settings.saveConnectionError);
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
    template: formData.vietqrTemplate as "compact" | "compact2" | "qr_only" | "print",
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-extrabold text-white">{t.admin.settings.title}</h1>
        <p className="text-xs text-slate-400 mt-1">
          {t.admin.settings.subtitle}
        </p>
      </div>

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
          <CreditCard className="h-4 w-4" /> 1. {t.admin.settings.bankConfigTitle}
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
          <Phone className="h-4 w-4" /> 2. Contact & Brand
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
          <TrendingUp className="h-4 w-4" /> 3. Home Stats
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
          <ShieldCheck className="h-4 w-4" /> 4. Policy & Guarantee
        </button>
      </div>

      {/* 1. PAYMENT GATEWAYS TAB */}
      {activeTab === "payment" && (
        <div className="space-y-6">
          {/* 1.1 VietQR Tự Động (PayOS / SePay) */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">
                    1. Cổng VietQR Tự Động (Tự động kích hoạt sau 3 giây)
                  </h3>
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/30">
                    Nội Địa VN
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Học viên quét mã VietQR bằng app ngân hàng bất kỳ, hệ thống bắt biến động số dư và kích hoạt học ngay lập tức.
                </p>
              </div>

              {/* Toggle Enable */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.paymentVietqrAutoEnabled}
                  onChange={(e) => handleChange("paymentVietqrAutoEnabled", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                <span className="ml-2 text-xs font-bold text-slate-300">
                  {formData.paymentVietqrAutoEnabled ? "Đang Bật" : "Đã Tắt"}
                </span>
              </label>
            </div>

            {formData.paymentVietqrAutoEnabled && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Lựa chọn Nhà Cung Cấp VietQR
                  </label>
                  <div className="grid grid-cols-2 gap-3 max-w-md">
                    <button
                      type="button"
                      onClick={() => handleChange("paymentVietqrProvider", "PAYOS")}
                      className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        formData.paymentVietqrProvider === "PAYOS"
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                          : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <CheckCircle2 className={`h-4 w-4 ${formData.paymentVietqrProvider === "PAYOS" ? "opacity-100" : "opacity-0"}`} />
                      PayOS (Khuyên dùng)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange("paymentVietqrProvider", "SEPAY")}
                      className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        formData.paymentVietqrProvider === "SEPAY"
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                          : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <CheckCircle2 className={`h-4 w-4 ${formData.paymentVietqrProvider === "SEPAY" ? "opacity-100" : "opacity-0"}`} />
                      SePay
                    </button>
                  </div>
                </div>

                {formData.paymentVietqrProvider === "PAYOS" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        PayOS Client ID
                      </label>
                      <input
                        type="text"
                        value={formData.payosClientId}
                        onChange={(e) => handleChange("payosClientId", e.target.value)}
                        placeholder="client-id-xxx"
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        PayOS API Key
                      </label>
                      <input
                        type="password"
                        value={formData.payosApiKey}
                        onChange={(e) => handleChange("payosApiKey", e.target.value)}
                        placeholder="••••••••••••••••"
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        PayOS Checksum Key
                      </label>
                      <input
                        type="password"
                        value={formData.payosChecksumKey}
                        onChange={(e) => handleChange("payosChecksumKey", e.target.value)}
                        placeholder="••••••••••••••••"
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-3 text-[11px] text-slate-500">
                      Webhook URL PayOS của bạn: <code className="text-emerald-400">https://your-domain.com/api/webhook/payos</code>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        SePay API Key
                      </label>
                      <input
                        type="password"
                        value={formData.sepayApiKey}
                        onChange={(e) => handleChange("sepayApiKey", e.target.value)}
                        placeholder="sepay-api-key-xxx"
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Số Tài Khoản Nhận (SePay)
                      </label>
                      <input
                        type="text"
                        value={formData.sepayAccountNumber}
                        onChange={(e) => handleChange("sepayAccountNumber", e.target.value)}
                        placeholder="0988888888"
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2 text-[11px] text-slate-500">
                      Webhook URL SePay của bạn: <code className="text-emerald-400">https://your-domain.com/api/webhook/sepay</code>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 1.2 Chuyển Khoản Ngân Hàng Thủ Công (Manual Bank Transfer) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-brand-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    2. Chuyển Khoản Thủ Công (Duyệt Đơn Bằng Tay)
                  </h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.paymentManualEnabled}
                    onChange={(e) => handleChange("paymentManualEnabled", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-500"></div>
                </label>
              </div>

              {formData.paymentManualEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t.admin.settings.bankIdLabel}
                    </label>
                    <select
                      value={formData.bankId}
                      onChange={(e) => handleChange("bankId", e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-brand-500 focus:outline-none"
                    >
                      <option value="MB">MB (MB Bank)</option>
                      <option value="VCB">VCB (Vietcombank)</option>
                      <option value="TCB">TCB (Techcombank)</option>
                      <option value="VPB">VPB (VPBank)</option>
                      <option value="ACB">ACB</option>
                      <option value="ICB">ICB (VietinBank)</option>
                      <option value="BIDV">BIDV</option>
                      <option value="TPB">TPB (TPBank)</option>
                      <option value="STB">STB (Sacombank)</option>
                      <option value="MSB">MSB</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t.admin.settings.bankNameLabel}
                    </label>
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={(e) => handleChange("bankName", e.target.value)}
                      placeholder="MB Bank"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t.admin.settings.accountNoLabel}
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
                      {t.admin.settings.accountHolderLabel}
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
                      {t.admin.settings.qrTemplateLabel}
                    </label>
                    <select
                      value={formData.vietqrTemplate}
                      onChange={(e) => handleChange("vietqrTemplate", e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-brand-500 focus:outline-none"
                    >
                      <option value="compact2">Compact 2 (Ecommerce clean)</option>
                      <option value="compact">Compact (Standard)</option>
                      <option value="qr_only">QR Only</option>
                      <option value="print">Print (Full layout)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* QR Live Preview */}
            <div className="lg:col-span-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col items-center justify-center text-center space-y-3">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <QrCode className="h-4 w-4 text-brand-400" /> VietQR Preview
              </span>
              <div className="p-2 bg-white rounded-2xl shadow-lg">
                <img src={previewQrUrl} alt="Preview QR" className="w-44 h-auto object-contain" />
              </div>
              <p className="text-[11px] text-slate-400">
                STK: <strong>{formData.bankAccountNo}</strong> ({formData.bankId})
              </p>
            </div>
          </div>

          {/* 1.3 Cổng Quốc Tế - PayPal (Mặc Định) */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-400" />
                  <h3 className="text-base font-bold text-white">
                    3. Cổng Quốc Tế - PayPal (Mặc Định)
                  </h3>
                  <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-400 border border-blue-500/30">
                    Toàn Cầu (Mặc định)
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Hỗ trợ học viên quốc tế thanh toán qua ví PayPal hoặc thẻ quốc tế Visa/MasterCard. Tiền rút về ngân hàng VN bình thường.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.paymentPaypalEnabled}
                  onChange={(e) => handleChange("paymentPaypalEnabled", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                <span className="ml-2 text-xs font-bold text-slate-300">
                  {formData.paymentPaypalEnabled ? "Đang Bật" : "Đã Tắt"}
                </span>
              </label>
            </div>

            {formData.paymentPaypalEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Môi Trường PayPal
                  </label>
                  <select
                    value={formData.paypalMode}
                    onChange={(e) => handleChange("paypalMode", e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="sandbox">Sandbox (Thử nghiệm)</option>
                    <option value="live">Live (Thật)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    PayPal Client ID
                  </label>
                  <input
                    type="text"
                    value={formData.paypalClientId}
                    onChange={(e) => handleChange("paypalClientId", e.target.value)}
                    placeholder="AbCdEfGhIj..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    PayPal Secret Key
                  </label>
                  <input
                    type="password"
                    value={formData.paypalSecret}
                    onChange={(e) => handleChange("paypalSecret", e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tỷ Giá Quy Đổi (VND / USD)
                  </label>
                  <input
                    type="number"
                    value={formData.usdExchangeRate}
                    onChange={(e) => handleChange("usdExchangeRate", Number(e.target.value))}
                    placeholder="25400"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-4 text-[11px] text-slate-500">
                  Webhook URL PayPal của bạn: <code className="text-blue-400">https://your-domain.com/api/webhook/paypal</code>
                </div>
              </div>
            )}
          </div>

          {/* 1.4 Cổng Quốc Tế - Stripe (Tùy Chọn) */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-purple-400" />
                  <h3 className="text-base font-bold text-white">
                    4. Cổng Quốc Tế - Stripe (Tùy Chọn Kích Hoạt)
                  </h3>
                  <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-purple-400 border border-purple-500/30">
                    Toàn Cầu (Thẻ Tín Dụng)
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Chỉ kích hoạt khi có pháp nhân hoặc tài khoản ngân hàng quốc tế (Stripe Atlas / Singapore / US).
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.paymentStripeEnabled}
                  onChange={(e) => handleChange("paymentStripeEnabled", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                <span className="ml-2 text-xs font-bold text-slate-300">
                  {formData.paymentStripeEnabled ? "Đang Bật" : "Đã Tắt"}
                </span>
              </label>
            </div>

            {formData.paymentStripeEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Stripe Publishable Key
                  </label>
                  <input
                    type="text"
                    value={formData.stripePublishableKey}
                    onChange={(e) => handleChange("stripePublishableKey", e.target.value)}
                    placeholder="pk_test_xxx"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Stripe Secret Key
                  </label>
                  <input
                    type="password"
                    value={formData.stripeSecretKey}
                    onChange={(e) => handleChange("stripeSecretKey", e.target.value)}
                    placeholder="sk_test_xxx"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Stripe Webhook Secret
                  </label>
                  <input
                    type="password"
                    value={formData.stripeWebhookSecret}
                    onChange={(e) => handleChange("stripeWebhookSecret", e.target.value)}
                    placeholder="whsec_xxx"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-3 text-[11px] text-slate-500">
                  Webhook URL Stripe của bạn: <code className="text-purple-400">https://your-domain.com/api/webhook/stripe</code>
                </div>
              </div>
            )}
          </div>

          {/* 1.5 Cổng Tiền Mã Hóa - Crypto USDT (Thủ Công Đa Mạng) */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white">
                    5. Tiền Mã Hóa Thủ Công - USDT (BEP-20 & TRC-20)
                  </h3>
                  <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-400 border border-amber-500/30">
                    Web3 / Quốc Tế
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Nhận thanh toán USDT ổn định qua 2 mạng lưới BNB Chain và Tron. Học viên gửi mã TXID hoặc ảnh biên lai để Admin duyệt đơn.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.paymentCryptoEnabled}
                  onChange={(e) => handleChange("paymentCryptoEnabled", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                <span className="ml-2 text-xs font-bold text-slate-300">
                  {formData.paymentCryptoEnabled ? "Đang Bật" : "Đã Tắt"}
                </span>
              </label>
            </div>

            {formData.paymentCryptoEnabled && (
              <div className="space-y-4 pt-2">
                {!formData.cryptoBep20Address && !formData.cryptoTrc20Address && (
                  <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs text-amber-300 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0" />
                    <span>
                      <strong>Chú ý:</strong> Cả 2 địa chỉ ví đang để trống. Học viên khi chọn thanh toán bằng Crypto sẽ nhận được thông báo chưa có địa chỉ ví nhận tiền.
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* BEP20 Wallet */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5" /> 1. Ví USDT (BEP-20 / BNB Chain)
                      </span>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                        Phí siêu rẻ (~$0.2)
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Địa chỉ ví BEP-20 (0x...)
                      </label>
                      <input
                        type="text"
                        value={formData.cryptoBep20Address}
                        onChange={(e) => handleChange("cryptoBep20Address", e.target.value)}
                        placeholder="Nhập địa chỉ ví BEP-20 (ví dụ: 0xd46B...)"
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    {formData.cryptoBep20Address ? (
                      <div className="flex items-center gap-3 pt-1">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&margin=4&data=${encodeURIComponent(formData.cryptoBep20Address)}`}
                          alt="BEP20 QR"
                          className="h-16 w-16 rounded-lg bg-white p-1 border border-slate-700"
                        />
                        <div className="text-[11px] text-slate-400 space-y-1">
                          <span className="text-emerald-400 font-semibold block">✓ Đã cấu hình mã QR</span>
                          <span className="text-slate-500 block truncate max-w-[200px] font-mono text-[10px]">
                            {formData.cryptoBep20Address}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 italic">
                        Chưa có địa chỉ ví BEP-20
                      </p>
                    )}
                  </div>

                  {/* TRC20 Wallet */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5" /> 2. Ví USDT (TRC-20 / Tron)
                      </span>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                        Phổ biến toàn cầu
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Địa chỉ ví TRC-20 (T...)
                      </label>
                      <input
                        type="text"
                        value={formData.cryptoTrc20Address}
                        onChange={(e) => handleChange("cryptoTrc20Address", e.target.value)}
                        placeholder="Nhập địa chỉ ví TRC-20 (ví dụ: TEdT...)"
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs text-white font-mono focus:border-rose-500 focus:outline-none"
                      />
                    </div>

                    {formData.cryptoTrc20Address ? (
                      <div className="flex items-center gap-3 pt-1">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&margin=4&data=${encodeURIComponent(formData.cryptoTrc20Address)}`}
                          alt="TRC20 QR"
                          className="h-16 w-16 rounded-lg bg-white p-1 border border-slate-700"
                        />
                        <div className="text-[11px] text-slate-400 space-y-1">
                          <span className="text-rose-400 font-semibold block">✓ Đã cấu hình mã QR</span>
                          <span className="text-slate-500 block truncate max-w-[200px] font-mono text-[10px]">
                            {formData.cryptoTrc20Address}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 italic">
                        Chưa có địa chỉ ví TRC-20
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. CONTACT & BRAND TAB */}
      {activeTab === "contact" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
            <Globe className="h-4 w-4 text-brand-400" /> Platform & Contact Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Platform Name
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
                Slogan
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
                Footer Description
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
                Support Email
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
                Hotline / Zalo
              </label>
              <input
                type="text"
                value={formData.supportHotline}
                onChange={(e) => handleChange("supportHotline", e.target.value)}
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
            <TrendingUp className="h-4 w-4 text-brand-400" /> Landing Page Statistics
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Display Students Count
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
                Satisfaction Rate
              </label>
              <input
                type="text"
                value={formData.statsSatisfactionRate}
                onChange={(e) => handleChange("statsSatisfactionRate", e.target.value)}
                placeholder="98.6%"
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
            <ShieldCheck className="h-4 w-4 text-brand-400" /> Guarantee & Refund Policy
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t.admin.settings.refundDaysLabel}
              </label>
              <input
                type="number"
                min={0}
                max={30}
                value={formData.refundDays}
                onChange={(e) => handleChange("refundDays", e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Max Progress Allowed for Refund (%)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={formData.refundMaxProgress}
                onChange={(e) => handleChange("refundMaxProgress", e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
              />
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
          {saving ? t.admin.settings.savingBtn : t.admin.settings.saveBtn}
        </button>
      </div>
    </form>
  );
}

