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
} from "lucide-react";
import { SystemConfig } from "@/lib/config";
import { generateVietQRUrl } from "@/lib/vietqr";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface SettingsFormClientProps {
  initialSettings: SystemConfig;
}

export default function SettingsFormClient({ initialSettings }: SettingsFormClientProps) {
  const { t } = useLanguage();
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
        toast.error(data.error || "Error saving settings");
        return;
      }

      toast.success(`🎉 ${t.admin.settings.saveSuccess}`);
    } catch (err) {
      toast.error("Connection error while saving settings");
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

      {/* 1. PAYMENT & VIETQR TAB */}
      {activeTab === "payment" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <CreditCard className="h-4 w-4 text-brand-400" /> {t.admin.settings.bankConfigTitle}
            </h3>

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
          </div>

          {/* QR Live Preview */}
          <div className="lg:col-span-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col items-center justify-center text-center space-y-3">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <QrCode className="h-4 w-4 text-brand-400" /> VietQR Preview
            </span>
            <div className="p-2 bg-white rounded-2xl shadow-lg">
              <img src={previewQrUrl} alt="Preview QR" className="w-48 h-auto object-contain" />
            </div>
            <p className="text-[11px] text-slate-400">
              STK: <strong>{formData.bankAccountNo}</strong> ({formData.bankId})
            </p>
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

