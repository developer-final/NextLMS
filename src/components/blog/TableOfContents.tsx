"use client";

import { useEffect, useState } from "react";
import { AlignLeft } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { slugify } from "@/lib/utils";

interface HeadingItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

export default function TableOfContents({ content }: TableOfContentsProps) {
  const { t } = useLanguage();
  const [headings, setHeadings] = useState<HeadingItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (!content) return;

    const lines = content.split("\n");
    const extracted: HeadingItem[] = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("## ")) {
        const text = trimmed.replace("## ", "").replace(/\*\*/g, "").trim();
        extracted.push({
          id: slugify(text),
          text,
          level: 2,
        });
      } else if (trimmed.startsWith("### ")) {
        const text = trimmed.replace("### ", "").replace(/\*\*/g, "").trim();
        extracted.push({
          id: slugify(text),
          text,
          level: 3,
        });
      }
    });

    setHeadings(extracted);
  }, [content]);

  useEffect(() => {
    const handleScroll = () => {
      const headingElements = headings
        .map((h) => document.getElementById(h.id))
        .filter(Boolean) as HTMLElement[];

      const scrollPos = window.scrollY + 120;

      for (let i = headingElements.length - 1; i >= 0; i--) {
        const el = headingElements[i];
        if (el.offsetTop <= scrollPos) {
          setActiveId(el.id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
        <AlignLeft className="h-4 w-4 text-brand-400" />
        {t.blog.tableOfContents}
      </h3>

      <nav className="space-y-1 text-xs">
        {headings.map((h) => {
          const isActive = activeId === h.id;
          return (
            <a
              key={h.id}
              href={`#${h.id}`}
              className={`block py-1.5 transition-colors line-clamp-1 ${
                h.level === 3 ? "pl-3 text-[11px]" : "font-medium"
              } ${
                isActive
                  ? "text-brand-400 font-bold translate-x-1"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {h.text}
            </a>
          );
        })}
      </nav>
    </div>
  );
}
