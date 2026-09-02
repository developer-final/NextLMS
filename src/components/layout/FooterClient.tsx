"use client";

import Link from "next/link";
import { GraduationCap, ShieldCheck, Mail, Phone } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";

interface FooterClientProps {
  settings: {
    appName: string;
    appDescription: string;
    supportEmail: string;
    supportHotline: string;
    zaloUrl: string;
    refundDays: number;
  };
  categories: {
    id: string;
    name: string;
    slug: string;
  }[];
}

export default function FooterClient({ settings, categories }: FooterClientProps) {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-slate-800 bg-slate-950/90 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 text-slate-950 font-bold shadow-glow">
                <GraduationCap className="h-5 w-5 text-slate-950" />
              </div>
              <span className="text-lg font-extrabold tracking-tight text-white">
                {settings.appName}
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t.footer.description}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="h-4 w-4 text-brand-400" />
              {t.footer.securityBadge}
            </div>
            {/* Language Switcher in Footer */}
            <div className="pt-2">
              <span className="text-[11px] text-slate-500 block mb-1.5 font-medium">{t.footer.language}:</span>
              <LanguageSwitcher variant="footer" />
            </div>
          </div>

          {/* Quick Links / Categories */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              {t.footer.categoriesTitle}
            </h4>
            <ul className="space-y-2 text-xs">
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/courses?category=${cat.slug}`}
                      className="hover:text-brand-400 transition-colors"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))
              ) : (
                <li>
                  <Link href="/courses" className="hover:text-brand-400 transition-colors">
                    {t.footer.allCourses}
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Policies & Support */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              {t.footer.supportTitle}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/policy/payment" className="hover:text-brand-400 transition-colors">
                  {t.footer.vietqrGuide}
                </Link>
              </li>
              <li>
                <Link href="/policy/terms" className="hover:text-brand-400 transition-colors">
                  {t.footer.termsOfService}
                </Link>
              </li>
              <li>
                <Link href="/policy/privacy" className="hover:text-brand-400 transition-colors">
                  {t.footer.privacyPolicy}
                </Link>
              </li>
              <li>
                <Link href="/policy/refund" className="hover:text-brand-400 transition-colors">
                  {t.footer.refundPolicy} ({settings.refundDays} {t.common.hours === "hours" ? "days" : "ngày"})
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Col */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              {t.footer.contactTitle}
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Mail className="h-4 w-4 text-brand-400 flex-shrink-0" />
              <a href={`mailto:${settings.supportEmail}`} className="hover:underline truncate">
                {settings.supportEmail}
              </a>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Phone className="h-4 w-4 text-brand-400 flex-shrink-0" />
              <a href={settings.zaloUrl || `tel:${settings.supportHotline}`} className="hover:underline">
                Hotline/Zalo: {settings.supportHotline}
              </a>
            </div>
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-[11px] text-slate-400">
              <span className="font-semibold text-brand-400">{t.footer.support247}</span> {t.footer.support247Desc}
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-800/80 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} {settings.appName}. {t.footer.allRightsReserved}</p>
          <p className="flex items-center gap-1 mt-2 md:mt-0">
            {t.footer.builtWithLove}
          </p>
        </div>
      </div>
    </footer>
  );
}
