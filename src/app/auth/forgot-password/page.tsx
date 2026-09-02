"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { KeyRound, Mail, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function ForgotPasswordPage() {
  const { t, language } = useLanguage();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error(
        language === "en"
          ? "Please enter your email"
          : "Vui lòng nhập địa chỉ email của bạn"
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(
          data.error ||
            (language === "en"
              ? "Failed to process request"
              : "Không thể xử lý yêu cầu")
        );
        setLoading(false);
        return;
      }

      setSent(true);
      toast.success(data.message);
    } catch {
      toast.error(
        language === "en"
          ? "Connection error. Please try again."
          : "Đã xảy ra lỗi kết nối. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-8 backdrop-blur-xl shadow-2xl">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-bold shadow-glow">
            <KeyRound className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-white">
            {t.auth.forgotPasswordTitle}
          </h2>
          <p className="mt-1.5 text-xs text-slate-400">
            {t.auth.forgotPasswordSubtitle}
          </p>
        </div>

        {sent ? (
          <div className="space-y-5 text-center">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-4 text-xs text-emerald-300 space-y-2">
              <div className="flex items-center justify-center gap-1.5 font-bold text-emerald-400 text-sm">
                <CheckCircle2 className="h-4 w-4" /> Đã gửi hướng dẫn
              </div>
              <p>
                Nếu email <strong className="text-white">{email}</strong> tồn tại trong hệ thống,
                liên kết đặt lại mật khẩu đã được gửi đến hộp thư của bạn.
              </p>
              <p className="text-[11px] text-slate-400">
                ⚠️ Liên kết chỉ có hiệu lực trong vòng <strong>15 phút</strong>. Vui lòng kiểm tra cả thư mục Spam.
              </p>
            </div>

            <Link
              href="/auth/login"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 py-3 text-sm font-semibold text-white transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              {t.auth.backToLogin}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t.auth.emailLabel}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@worldtradinglab.com"
                  required
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-400 py-3 text-sm font-bold text-slate-950 shadow-glow transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              {loading ? t.auth.sendingResetLink : t.auth.sendResetLinkBtn}
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="text-center pt-2">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-brand-400 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {t.auth.backToLogin}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
