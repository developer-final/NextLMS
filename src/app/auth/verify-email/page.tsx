"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { CheckCircle2, AlertTriangle, ArrowRight, Loader2, Mail, Send } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const { t, language } = useLanguage();

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    token ? "loading" : "error"
  );
  const [message, setMessage] = useState(
    token ? "" : t.auth.tokenMissingOrInvalid
  );
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    async function verify() {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!isMounted) return;

        if (res.ok && data.success) {
          setStatus("success");
          setMessage(t.auth.verifySuccessDesc);
        } else {
          setStatus("error");
          setMessage(t.auth.tokenMissingOrInvalid);
        }
      } catch {
        if (!isMounted) return;
        setStatus("error");
        setMessage(t.common.connectionError);
      }
    }

    verify();

    return () => {
      isMounted = false;
    };
  }, [token, t]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) {
      toast.error(t.auth.resendEmailPrompt);
      return;
    }

    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail }),
      });

      const data = await res.json();
      if (res.ok) {
        setResendSent(true);
        toast.success(t.auth.resendSuccess);
      } else {
        toast.error(data.error || t.common.somethingWentWrong);
      }
    } catch {
      toast.error(t.common.connectionError);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-8 backdrop-blur-xl shadow-2xl text-center">
      {status === "loading" && (
        <div className="space-y-4 py-8">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-brand-400" />
          <h2 className="text-xl font-bold text-white">{t.auth.verifyEmailTitle}</h2>
          <p className="text-xs text-slate-400">{t.auth.verifyEmailSubtitle}</p>
        </div>
      )}

      {status === "success" && (
        <div className="space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-white">
              {t.auth.verifySuccessTitle}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              {message}
            </p>
          </div>

          <Link
            href="/auth/login"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-400 py-3 text-sm font-bold text-slate-950 shadow-glow transition-all hover:scale-[1.02]"
          >
            {t.auth.loginBtn}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">
              {t.auth.verifyFailedTitle}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              {message}
            </p>
          </div>

          {resendSent ? (
            <div className="rounded-xl border border-brand-500/30 bg-brand-950/40 p-4 text-xs text-brand-300">
              Đã gửi lại liên kết kích hoạt tới <strong>{resendEmail}</strong>. Vui lòng kiểm tra email!
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-left space-y-3">
              <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-brand-400" />
                {t.auth.resendVerifyPrompt}
              </div>
              <form onSubmit={handleResend} className="space-y-2.5">
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="Nhập email của bạn..."
                  required
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={resending}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-50"
                >
                  <Send className="h-3 w-3" />
                  {resending ? t.auth.sendingResend : t.auth.resendVerifyBtn}
                </button>
              </form>
            </div>
          )}

          <div className="pt-2 border-t border-slate-800">
            <Link
              href="/auth/login"
              className="text-xs text-slate-400 hover:text-brand-400 transition-colors"
            >
              {t.auth.backToLogin}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="text-slate-400 text-xs">Đang xử lý...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
