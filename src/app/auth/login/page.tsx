"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { GraduationCap, Lock, Mail, ArrowRight, UserCheck } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const { t, language } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl });
    } catch (err) {
      toast.error(t.auth.googleNotConfigured);
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(language === "en" ? "Please fill in email and password" : "Vui lòng nhập đầy đủ Email và Mật khẩu");
      return;
    }

    setLoading(true);
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        toast.error(res.error);
        setLoading(false);
        return;
      }

      toast.success(t.auth.loginSuccess);
      router.push(callbackUrl);
      router.refresh();
    } catch (error) {
      toast.error(language === "en" ? "An error occurred during sign in" : "Đã xảy ra lỗi trong quá trình đăng nhập");
      setLoading(false);
    }
  };

  const handleQuickFill = (testEmail: string, testPass: string) => {
    setEmail(testEmail);
    setPassword(testPass);
  };

  return (
    <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-8 backdrop-blur-xl shadow-2xl">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 text-slate-950 font-bold shadow-glow">
          <GraduationCap className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-white">
          {t.auth.loginTitle}
        </h2>
        <p className="mt-1.5 text-xs text-slate-400">
          {t.auth.loginSubtitle}
        </p>
      </div>

      {/* Google One-Click Login */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-800/90 hover:bg-slate-700/80 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:scale-[1.01] hover:border-slate-600 disabled:opacity-50"
        >
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          {googleLoading ? t.auth.submittingLogin : t.auth.loginWithGoogle}
        </button>

        <div className="relative my-3 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <span className="relative bg-slate-900 px-3 text-[11px] font-medium text-slate-500">
            {t.auth.orContinueWithEmail}
          </span>
        </div>
      </div>

      {/* Quick Test Accounts Notice (Only in Development Mode) */}
      {(process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === "true") && (
        <div className="rounded-xl border border-brand-500/30 bg-brand-950/40 p-3 text-xs text-brand-300">
          <div className="font-semibold flex items-center gap-1.5 text-brand-400 mb-1.5">
            <UserCheck className="h-4 w-4" /> {t.auth.demoAccountsTitle}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill("admin@finlearn.vn", "123456")}
              className="px-2.5 py-1 rounded bg-brand-900/60 hover:bg-brand-800/80 text-[11px] font-semibold border border-brand-700/50 transition-colors"
            >
              👑 {t.auth.adminDemoBtn}
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill("student@finlearn.vn", "123456")}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 border border-slate-700 transition-colors"
            >
              🎓 {t.auth.studentDemoBtn}
            </button>
          </div>
        </div>
      )}

      {/* Form */}
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

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-300">
              {t.auth.passwordLabel}
            </label>
            <Link href="/auth/forgot-password" className="text-[11px] text-brand-400 hover:underline">
              {t.auth.forgotPassword}
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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
          {loading ? t.auth.submittingLogin : t.auth.loginBtn}
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      {/* Footer */}
      <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800/80">
        {t.auth.noAccountPrompt}{" "}
        <Link href="/auth/register" className="font-bold text-brand-400 hover:underline">
          {t.auth.registerNowLink}
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="text-slate-400 text-xs">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}


