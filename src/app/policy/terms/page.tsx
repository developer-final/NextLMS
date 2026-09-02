"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";

export default function TermsPage() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 space-y-6 text-xs text-slate-300">
      <h1 className="text-2xl font-bold text-white mb-4">{t.policy.termsTitle}</h1>
      <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 leading-relaxed">
        <p>{t.policy.termsP1}</p>
        <p>{t.policy.termsP2}</p>
        <p>{t.policy.termsP3}</p>
      </div>
    </div>
  );
}
