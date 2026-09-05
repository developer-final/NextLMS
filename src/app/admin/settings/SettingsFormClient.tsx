"use client";

import { useState, useEffect } from "react";
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
  Share2,
  Sparkles,
  Bot,
  Cpu,
  RefreshCw,
} from "lucide-react";
import { SystemConfig } from "@/lib/config";
import { generateVietQRUrl } from "@/lib/vietqr";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { validateBankSettingsInput, isValidEmail } from "@/lib/validation";
import {
  getPopularBanks,
  getOtherBanks,
  getBankByCode,
  VIETNAM_BANKS,
} from "@/lib/vietnam-banks";

interface SettingsFormClientProps {
  initialSettings: SystemConfig;
}

export default function SettingsFormClient({ initialSettings }: SettingsFormClientProps) {
  const { t, language } = useLanguage();
  const [formData, setFormData] = useState<SystemConfig>(initialSettings);
  const [activeTab, setActiveTab] = useState<"payment" | "contact" | "hero" | "policy" | "affiliate" | "ai">("payment");
  const [saving, setSaving] = useState(false);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [bridgeStatus, setBridgeStatus] = useState<{
    isDev?: boolean;
    running?: boolean;
    pendingCount?: number;
    completedCount?: number;
    heartbeat?: any;
  } | null>(null);
  const [checkingBridge, setCheckingBridge] = useState(false);

  const fetchBridgeStatus = async () => {
    try {
      setCheckingBridge(true);
      const res = await fetch("/api/admin/ai/bridge-status");
      const data = await res.json();
      setBridgeStatus(data);
    } catch {
      setBridgeStatus(null);
    } finally {
      setCheckingBridge(false);
    }
  };

  useEffect(() => {
    if (activeTab !== "ai") return;
    fetchBridgeStatus();
    const timer = setInterval(() => {
      fetch("/api/admin/ai/bridge-status")
        .then((res) => res.json())
        .then((data) => setBridgeStatus(data))
        .catch(() => {});
    }, 3000);

    return () => clearInterval(timer);
  }, [activeTab]);

  const handleChange = (field: keyof SystemConfig, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTestConnection = async (provider: string) => {
    setTestingProvider(provider);
    try {
      const res = await fetch("/api/admin/ai/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          devMockEnabled: formData.aiDevMockEnabled,
          apiKey:
            provider === "gemini"
              ? formData.aiGeminiKey
              : provider === "openai"
              ? formData.aiOpenaiKey
              : provider === "claude"
              ? formData.aiClaudeKey
              : provider === "deepseek"
              ? formData.aiDeepseekKey
              : provider === "glm"
              ? formData.aiGlmKey
              : formData.aiMoonshotKey,
          model: formData.aiDefaultModel,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`${t.admin.ai.testSuccess} (${data.message || provider})`);
      } else {
        toast.error(data.error || t.admin.ai.testFailed);
      }
    } catch {
      toast.error(t.admin.ai.testFailed);
    } finally {
      setTestingProvider(null);
    }
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

        <button
          type="button"
          onClick={() => setActiveTab("affiliate")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === "affiliate"
              ? "bg-brand-500 text-slate-950 shadow-glow"
              : "bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700"
          }`}
        >
          <Share2 className="h-4 w-4" /> 5. {t.admin.sidebar.affiliates}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ai")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === "ai"
              ? "bg-brand-500 text-slate-950 shadow-glow"
              : "bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700"
          }`}
        >
          <Sparkles className="h-4 w-4" /> 6. {t.admin.ai.tabAi}
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
                      onChange={(e) => {
                        const selectedCode = e.target.value;
                        handleChange("bankId", selectedCode);
                        const bank = getBankByCode(selectedCode);
                        if (bank) {
                          handleChange("bankName", bank.shortName);
                        }
                      }}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-brand-500 focus:outline-none"
                    >
                      {!VIETNAM_BANKS.some((b) => b.code === formData.bankId) && formData.bankId && (
                        <option value={formData.bankId}>
                          {formData.bankId} (Hiện tại)
                        </option>
                      )}
                      <optgroup label="Ngân hàng phổ biến (Top Banks)">
                        {getPopularBanks().map((b) => (
                          <option key={b.code} value={b.code}>
                            {b.shortName} ({b.code}) - {b.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Tất cả ngân hàng khác">
                        {getOtherBanks().map((b) => (
                          <option key={b.code} value={b.code}>
                            {b.shortName} ({b.code}) - {b.name}
                          </option>
                        ))}
                      </optgroup>
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
                placeholder="World Trading Lab"
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

      {/* 5. AFFILIATE & REFERRAL TAB */}
      {activeTab === "affiliate" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  Cấu Hình Hệ Thống Tiếp Thị Liên Kết
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Thiết lập tỷ lệ hoa hồng mặc định, chu kỳ giữ đối soát an toàn và hạn mức rút tiền cho học viên.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(formData.affiliateEnabled)}
                onChange={(e) => handleChange("affiliateEnabled", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
              <span className="ml-3 text-xs font-bold text-slate-300">
                {formData.affiliateEnabled ? "Đang BẬT" : "Đang TẮT"}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tỷ lệ hoa hồng mặc định toàn sàn (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={formData.affiliateCommissionPercent}
                onChange={(e) => handleChange("affiliateCommissionPercent", e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Mức % hoa hồng nhận được trên mỗi đơn hàng thành công (Admin có thể tùy chỉnh mức riêng cho từng đối tác VIP).
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Hạn mức rút tiền tối thiểu (VND)
              </label>
              <input
                type="number"
                min={50000}
                step={50000}
                value={formData.affiliateMinPayout}
                onChange={(e) => handleChange("affiliateMinPayout", e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Số dư tối thiểu học viên cần có để tạo yêu cầu rút tiền về ngân hàng (VD: 200,000 VND).
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Thời gian giữ hoa hồng an toàn (Ngày)
              </label>
              <input
                type="number"
                min={0}
                max={60}
                value={formData.affiliateHoldDays}
                onChange={(e) => handleChange("affiliateHoldDays", e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Hoa hồng ở trạng thái chờ giữ (Holding) tránh trường hợp hoàn tiền. Hết thời gian này sẽ chuyển thành khả dụng rút.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Thời hạn lưu Cookie giới thiệu (Ngày)
              </label>
              <input
                type="number"
                min={1}
                max={180}
                value={formData.affiliateCookieDays}
                onChange={(e) => handleChange("affiliateCookieDays", e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Cơ chế Last-Click Cookie. Đơn hàng phát sinh trong số ngày này kể từ lần click gần nhất sẽ được tính hoa hồng (VD: 30 ngày).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 6. AI & LLM PROVIDERS TAB */}
      {activeTab === "ai" && (
        <div className="space-y-6">
          {/* Header */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-brand-400" />
                  <h3 className="text-base font-bold text-white">
                    {t.admin.ai.title}
                  </h3>
                  <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-brand-400 border border-brand-500/30">
                    Multi-Provider
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {t.admin.ai.subtitle}
                </p>
              </div>

              {/* Dev Mock Switch */}
              <div className="flex items-center gap-3 rounded-xl bg-slate-950/80 border border-slate-800 px-4 py-2.5">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Bot className="h-3.5 w-3.5 text-amber-400" />
                    {t.admin.ai.devMockLabel}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {formData.aiDevMockEnabled ? "Mô phỏng (Không tốn token)" : "Chế độ Production"}
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.aiDevMockEnabled}
                    onChange={(e) => handleChange("aiDevMockEnabled", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>
            </div>

            {formData.aiDevMockEnabled && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300/90 leading-relaxed">
                  {t.admin.ai.devMockDesc}
                </p>
              </div>
            )}

            {bridgeStatus?.isDev && (
              <div
                className={`rounded-2xl border p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  bridgeStatus.running
                    ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.08)]"
                    : "border-slate-800 bg-slate-950/60 text-slate-400"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <span
                    className={`mt-1 flex h-3.5 w-3.5 shrink-0 rounded-full ${
                      bridgeStatus.running
                        ? "bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"
                        : "bg-slate-600"
                    }`}
                  />
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      Dev AI Bridge (Kịch bản 2):{" "}
                      <span
                        className={
                          bridgeStatus.running
                            ? "text-emerald-400"
                            : "text-slate-400"
                        }
                      >
                        {bridgeStatus.running ? "Đang chạy (ONLINE)" : "Ngoại tuyến (OFFLINE)"}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300/90 mt-1 leading-relaxed">
                      {bridgeStatus.running ? (
                        <>
                          <span className="text-emerald-300 font-medium">
                            🟢 Đã kích hoạt:
                          </span>{" "}
                          Toàn bộ thao tác tạo nội dung (Chat Copilot, Soạn khóa học, Viết blog) sẽ được chuyển thẳng qua Dev AI Bridge để tạo nội dung AI thật 100%!
                          <div className="text-[11px] text-slate-400 mt-1 font-mono">
                            PID: {bridgeStatus.heartbeat?.workerPid} | Chế độ: {bridgeStatus.heartbeat?.mode} | Đang chờ: {bridgeStatus.pendingCount} | Đã hoàn tất: {bridgeStatus.completedCount}
                          </div>
                        </>
                      ) : (
                        <>
                          Worker nền chưa chạy. Hệ thống đang sử dụng bộ mô phỏng Mock Proxy dự phòng. Để kết nối AI thật, mở terminal gõ:{" "}
                          <code className="text-amber-400 font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                            npm run dev:ai
                          </code>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    disabled={checkingBridge}
                    onClick={fetchBridgeStatus}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-all disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${
                        checkingBridge ? "animate-spin text-brand-400" : ""
                      }`}
                    />
                    Làm mới
                  </button>

                  <span
                    className={`text-[11px] font-bold px-3 py-1.5 rounded-xl uppercase border tracking-wider ${
                      bridgeStatus.running
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-sm"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    {bridgeStatus.running ? "ONLINE" : "OFFLINE"}
                  </span>
                </div>
              </div>
            )}

            {/* General Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t.admin.ai.defaultProviderLabel}
                </label>
                <select
                  value={formData.aiDefaultProvider}
                  onChange={(e) => handleChange("aiDefaultProvider", e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
                >
                  <option value="gemini">Google Gemini</option>
                  <option value="openai">OpenAI (ChatGPT)</option>
                  <option value="claude">Anthropic Claude</option>
                  <option value="deepseek">DeepSeek</option>
                  <option value="glm">Zhipu GLM</option>
                  <option value="moonshot">Moonshot (Kimi)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t.admin.ai.defaultModelLabel}
                </label>
                <input
                  type="text"
                  value={formData.aiDefaultModel}
                  onChange={(e) => handleChange("aiDefaultModel", e.target.value)}
                  placeholder="gemini-2.0-flash / gpt-4o-mini"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t.admin.ai.temperatureLabel} ({formData.aiTemperature})
                </label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={formData.aiTemperature}
                  onChange={(e) => handleChange("aiTemperature", parseFloat(e.target.value))}
                  className="w-full accent-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t.admin.ai.maxTokensLabel}
                </label>
                <input
                  type="number"
                  min={512}
                  max={8192}
                  step={512}
                  value={formData.aiMaxTokens}
                  onChange={(e) => handleChange("aiMaxTokens", parseInt(e.target.value, 10))}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Providers API Keys */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Key className="h-4 w-4 text-brand-400" />
              Khóa API của 6 Nhà Cung Cấp (API Keys)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Google Gemini */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">1. Google Gemini</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${formData.aiGeminiKey ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-400"}`}>
                    {formData.aiGeminiKey ? t.admin.ai.configured : t.admin.ai.notConfigured}
                  </span>
                </div>
                <input
                  type="password"
                  value={formData.aiGeminiKey}
                  onChange={(e) => handleChange("aiGeminiKey", e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white font-mono focus:border-brand-500 focus:outline-none"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={testingProvider === "gemini"}
                    onClick={() => handleTestConnection("gemini")}
                    className="text-[11px] font-semibold text-brand-400 hover:text-brand-300 disabled:opacity-50"
                  >
                    {testingProvider === "gemini" ? "Đang kiểm tra..." : t.admin.ai.testConnectionBtn}
                  </button>
                </div>
              </div>

              {/* 2. OpenAI */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">2. OpenAI (ChatGPT)</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${formData.aiOpenaiKey ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-400"}`}>
                    {formData.aiOpenaiKey ? t.admin.ai.configured : t.admin.ai.notConfigured}
                  </span>
                </div>
                <input
                  type="password"
                  value={formData.aiOpenaiKey}
                  onChange={(e) => handleChange("aiOpenaiKey", e.target.value)}
                  placeholder="sk-proj-..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white font-mono focus:border-brand-500 focus:outline-none"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={testingProvider === "openai"}
                    onClick={() => handleTestConnection("openai")}
                    className="text-[11px] font-semibold text-brand-400 hover:text-brand-300 disabled:opacity-50"
                  >
                    {testingProvider === "openai" ? "Đang kiểm tra..." : t.admin.ai.testConnectionBtn}
                  </button>
                </div>
              </div>

              {/* 3. Anthropic Claude */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">3. Anthropic Claude</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${formData.aiClaudeKey ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-400"}`}>
                    {formData.aiClaudeKey ? t.admin.ai.configured : t.admin.ai.notConfigured}
                  </span>
                </div>
                <input
                  type="password"
                  value={formData.aiClaudeKey}
                  onChange={(e) => handleChange("aiClaudeKey", e.target.value)}
                  placeholder="sk-ant-..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white font-mono focus:border-brand-500 focus:outline-none"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={testingProvider === "claude"}
                    onClick={() => handleTestConnection("claude")}
                    className="text-[11px] font-semibold text-brand-400 hover:text-brand-300 disabled:opacity-50"
                  >
                    {testingProvider === "claude" ? "Đang kiểm tra..." : t.admin.ai.testConnectionBtn}
                  </button>
                </div>
              </div>

              {/* 4. DeepSeek */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">4. DeepSeek</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${formData.aiDeepseekKey ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-400"}`}>
                    {formData.aiDeepseekKey ? t.admin.ai.configured : t.admin.ai.notConfigured}
                  </span>
                </div>
                <input
                  type="password"
                  value={formData.aiDeepseekKey}
                  onChange={(e) => handleChange("aiDeepseekKey", e.target.value)}
                  placeholder="sk-..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white font-mono focus:border-brand-500 focus:outline-none"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={testingProvider === "deepseek"}
                    onClick={() => handleTestConnection("deepseek")}
                    className="text-[11px] font-semibold text-brand-400 hover:text-brand-300 disabled:opacity-50"
                  >
                    {testingProvider === "deepseek" ? "Đang kiểm tra..." : t.admin.ai.testConnectionBtn}
                  </button>
                </div>
              </div>

              {/* 5. Zhipu GLM */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">5. Zhipu GLM</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${formData.aiGlmKey ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-400"}`}>
                    {formData.aiGlmKey ? t.admin.ai.configured : t.admin.ai.notConfigured}
                  </span>
                </div>
                <input
                  type="password"
                  value={formData.aiGlmKey}
                  onChange={(e) => handleChange("aiGlmKey", e.target.value)}
                  placeholder="API Key GLM..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white font-mono focus:border-brand-500 focus:outline-none"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={testingProvider === "glm"}
                    onClick={() => handleTestConnection("glm")}
                    className="text-[11px] font-semibold text-brand-400 hover:text-brand-300 disabled:opacity-50"
                  >
                    {testingProvider === "glm" ? "Đang kiểm tra..." : t.admin.ai.testConnectionBtn}
                  </button>
                </div>
              </div>

              {/* 6. Moonshot Kimi */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">6. Moonshot (Kimi)</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${formData.aiMoonshotKey ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-400"}`}>
                    {formData.aiMoonshotKey ? t.admin.ai.configured : t.admin.ai.notConfigured}
                  </span>
                </div>
                <input
                  type="password"
                  value={formData.aiMoonshotKey}
                  onChange={(e) => handleChange("aiMoonshotKey", e.target.value)}
                  placeholder="sk-..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white font-mono focus:border-brand-500 focus:outline-none"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={testingProvider === "moonshot"}
                    onClick={() => handleTestConnection("moonshot")}
                    className="text-[11px] font-semibold text-brand-400 hover:text-brand-300 disabled:opacity-50"
                  >
                    {testingProvider === "moonshot" ? "Đang kiểm tra..." : t.admin.ai.testConnectionBtn}
                  </button>
                </div>
              </div>
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

