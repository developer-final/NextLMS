"use client";

import { GraduationCap, ShieldCheck, Users, Zap } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { NicheConfig } from "@/lib/niches";

interface AboutClientProps {
  nicheConfig?: NicheConfig;
}

export default function AboutClient({ nicheConfig }: AboutClientProps) {
  const { t } = useLanguage();

  const badge = nicheConfig?.about.badge || t.about.badge;
  const titleLine1 = nicheConfig?.about.titleLine1 || t.about.titleLine1;
  const titleHighlight = nicheConfig?.about.titleHighlight || t.about.titleHighlight;
  const description = nicheConfig?.about.description || t.about.description;

  const values = nicheConfig?.about.values || [
    { title: t.about.value1Title, description: t.about.value1Desc },
    { title: t.about.value2Title, description: t.about.value2Desc },
    { title: t.about.value3Title, description: t.about.value3Desc },
  ];

  const ctaTitle = nicheConfig?.about.ctaTitle || t.about.ctaTitle;
  const ctaDesc = nicheConfig?.about.ctaDesc || t.about.ctaDesc;
  const ctaButton = nicheConfig?.about.ctaButton || t.about.ctaButton;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-950/60 px-4 py-1.5 text-xs font-semibold text-brand-400">
          <GraduationCap className="h-4 w-4" /> {badge}
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white">
          {titleLine1} <br />
          <span className="gradient-text-emerald">{titleHighlight}</span>
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      {/* Core Values */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
          <div className="h-10 w-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center border border-brand-500/20">
            <Zap className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-white">{values[0]?.title}</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            {values[0]?.description}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
          <div className="h-10 w-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center border border-brand-500/20">
            <Users className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-white">{values[1]?.title}</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            {values[1]?.description}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
          <div className="h-10 w-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center border border-brand-500/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-white">{values[2]?.title}</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            {values[2]?.description}
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-brand-950/40 via-slate-900 to-slate-950 p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">{ctaTitle}</h2>
        <p className="text-xs text-slate-400 max-w-lg mx-auto">
          {ctaDesc}
        </p>
        <Link
          href="/courses"
          className="inline-block rounded-xl bg-brand-500 hover:bg-brand-400 px-6 py-3 text-sm font-bold text-slate-950 shadow-glow transition-all hover:scale-105"
        >
          {ctaButton}
        </Link>
      </div>
    </div>
  );
}
