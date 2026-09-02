"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { SUPPORTED_LANGUAGES, Language } from "@/lib/i18n";
import { ChevronDown, Globe } from "lucide-react";

interface LanguageSwitcherProps {
  variant?: "navbar" | "footer" | "mobile";
}

export default function LanguageSwitcher({ variant = "navbar" }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption =
    SUPPORTED_LANGUAGES.find((opt) => opt.code === language) ||
    SUPPORTED_LANGUAGES[0];

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (variant === "footer") {
    return (
      <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
        {SUPPORTED_LANGUAGES.map((opt) => (
          <button
            key={opt.code}
            onClick={() => setLanguage(opt.code)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all text-xs font-semibold ${
              language === opt.code
                ? "bg-brand-500 text-slate-950 shadow-glow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>{opt.flag}</span>
            <span>{opt.shortLabel}</span>
          </button>
        ))}
      </div>
    );
  }

  if (variant === "mobile") {
    return (
      <div className="pt-3 border-t border-slate-800">
        <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5 text-brand-400" /> Ngôn ngữ / Language:
        </div>
        <div className="grid grid-cols-2 gap-2">
          {SUPPORTED_LANGUAGES.map((opt) => (
            <button
              key={opt.code}
              onClick={() => setLanguage(opt.code)}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                language === opt.code
                  ? "border-brand-500 bg-brand-500/15 text-brand-400 shadow-glow"
                  : "border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:border-slate-700"
              }`}
            >
              <span className="text-base">{opt.flag}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Default: Navbar Dropdown
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-brand-500/40 hover:text-white transition-all backdrop-blur-sm"
        aria-expanded={isOpen}
        aria-label="Select Language"
      >
        <span className="text-sm leading-none">{currentOption.flag}</span>
        <span className="font-bold tracking-wider">{currentOption.shortLabel}</span>
        <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 rounded-2xl border border-slate-800 bg-slate-900/95 p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 z-50">
          <div className="px-2.5 py-1.5 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800/80 mb-1">
            Language / Ngôn ngữ
          </div>
          {SUPPORTED_LANGUAGES.map((opt) => (
            <button
              key={opt.code}
              onClick={() => {
                setLanguage(opt.code);
                setIsOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs transition-all ${
                language === opt.code
                  ? "bg-brand-500/20 text-brand-400 font-bold border border-brand-500/30"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base leading-none">{opt.flag}</span>
                <span>{opt.label}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">{opt.shortLabel}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
