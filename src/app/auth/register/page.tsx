"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { GraduationCap, Lock, Mail, User, ArrowRight, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const { t, language } = useLanguage();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const isGoogleAuthEnabled = Boolean(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim()
  );

  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl });
    } catch {
      toast.error(t.auth.googleNotConfigured);
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      toast.error(t.auth.missingEmailOrPassword);
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t.auth.passwordMismatch);
      return;
    }

    if (password.length < 6) {
      toast.error(t.auth.passwordTooShort);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, honeypot }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || t.common.somethingWentWrong);
        setLoading(false);
        return;
      }

      if (data.requiresVerification) {
        setRegisteredEmail(email);
        toast.success(data.message || t.auth.registerSuccess);
      } else {
        toast.success(t.auth.registerSuccess);
        // Automatically sign in the user for frictionless checkout flow
        const loginRes = await signIn("credentials", {
          redirect: false,
          email,
          password,
        });

        if (loginRes?.ok) {
          router.push(callbackUrl);
          router.refresh();
        } else {
          router.push(
            `/auth/login${
              callbackUrl !== "/"
                ? `?callbackUrl=${encodeURIComponent(callbackUrl)}`
                : ""
            }`
          );
        }
      }
    } catch (error) {
      toast.error(t.common.connectionError);
      setLoading(false);
    }
  };

  if (registeredEmail) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-8 backdrop-blur-xl shadow-2xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/20 text-brand-400 border border-brand-500/30">
            <Mail className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">
            {t.auth.checkInboxTitle} 📧
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            {t.auth.checkInboxDesc}
            <br />
            <strong className="text-brand-400">{registeredEmail}</strong>
          </p>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-400 text-left space-y-2">
            <p>• {t.auth.checkInboxSpamNote}</p>
          </div>
          <div className="pt-2">
            <Link
              href={
                callbackUrl !== "/"
                  ? `/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
                  : "/auth/login"
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-400 py-3 text-sm font-bold text-slate-950 shadow-glow transition-all"
            >
              {t.auth.loginNowLink}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-8 backdrop-blur-xl shadow-2xl">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 text-slate-950 font-bold shadow-glow">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-white">
            {t.auth.registerTitle}
          </h2>
          <p className="mt-1.5 text-xs text-slate-400">
            {t.auth.registerSubtitle}
          </p>
        </div>

        {/* Google One-Click Register (Conditional based on NEXT_PUBLIC_ENABLE_GOOGLE_AUTH) */}
        {isGoogleAuthEnabled && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleRegister}
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
              {googleLoading ? t.auth.submittingRegister : t.auth.registerWithGoogle}
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
        )}

        {/* Benefits list */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-1.5 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-brand-400" /> {t.auth.benefit1}
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-brand-400" /> {t.auth.benefit2}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Honeypot field for anti-bot protection (invisible to humans and screen readers) */}
          <div
            className="absolute -left-[9999px] -top-[9999px] opacity-0 h-0 w-0 pointer-events-none overflow-hidden select-none"
            aria-hidden="true"
            tabIndex={-1}
          >
            <label htmlFor="company_fax">Company Fax</label>
            <input
              id="company_fax"
              type="text"
              name="company_fax"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {t.auth.fullNameLabel}
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all"
              />
            </div>
          </div>

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
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {t.auth.registerPasswordLabel}
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-10 pr-11 py-2.5 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {t.auth.confirmPasswordLabel}
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-10 pr-11 py-2.5 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                tabIndex={-1}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-400 py-3 text-sm font-bold text-slate-950 shadow-glow transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            {loading ? t.auth.submittingRegister : t.auth.registerBtn}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800/80">
          {t.auth.alreadyHaveAccount}{" "}
          <Link
            href={
              callbackUrl !== "/"
                ? `/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
                : "/auth/login"
            }
            className="font-bold text-brand-400 hover:underline"
          >
            {t.auth.loginNowLink}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      }
    >
      <RegisterFormContent />
    </Suspense>
  );
}


