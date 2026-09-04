"use client";

import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { NicheConfig } from "@/lib/niches";

interface CategoriesClientProps {
  categories: any[];
  nicheConfig?: NicheConfig;
}

export default function CategoriesClient({ categories, nicheConfig }: CategoriesClientProps) {
  const { t } = useLanguage();

  const title = nicheConfig?.categoryPageTitle || t.categories.pageTitle;
  const subtitle = nicheConfig?.categoryPageSubtitle || t.categories.pageSubtitle;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 border-b border-slate-800 pb-4">
        <h1 className="text-3xl font-black text-white">{title}</h1>
        <p className="text-xs text-slate-400 mt-1">
          {subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/courses?category=${cat.slug}`}
            className="group flex flex-col justify-between p-6 rounded-2xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900/80 hover:border-brand-500/40 transition-all hover:-translate-y-1"
          >
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20 mb-4 group-hover:scale-110 transition-transform">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-brand-400 transition-colors">
                {cat.name}
              </h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                {cat.description}
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/80 pt-3">
              <span>{cat._count.courses} {t.categories.coursesCount}</span>
              <span className="text-brand-400 font-semibold group-hover:translate-x-1 transition-transform">
                {t.categories.viewDetailsArrow}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
