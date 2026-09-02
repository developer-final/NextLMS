"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";

export default function PaymentPolicyPage() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 space-y-6 text-xs text-slate-300">
      <h1 className="text-2xl font-bold text-white mb-4">{t.policy.paymentTitle}</h1>
      <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 leading-relaxed">
        <h3 className="text-sm font-bold text-brand-400">1. {t.policy.paymentTitle}</h3>
        <p>• {t.policy.paymentStep1}</p>
        <p>• {t.policy.paymentStep2}</p>
        <p>• {t.policy.paymentStep3}</p>
        <p>• {t.policy.paymentStep4}</p>

        <h3 className="text-sm font-bold text-brand-400 pt-2">2. {t.policy.activationTitle}</h3>
        <p>• {t.policy.activationDesc}</p>
      </div>
    </div>
  );
}
