"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Check, Palette } from "lucide-react";

interface ThemeSwitcherProps {
  variant?: "navbar" | "mobile" | "compact";
}

export default function ThemeSwitcher({ variant = "navbar" }: ThemeSwitcherProps) {
  const { theme, setTheme, themes, currentThemeConfig } = useTheme();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  if (variant === "mobile") {
    return (
      <div className="pt-3 border-t border-slate-800">
        <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
          <Palette className="h-3.5 w-3.5 text-brand-400" /> {t.theme.themeLabel}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {themes.map((item) => {
            const isSelected = theme === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTheme(item.id)}
                className={`flex items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-brand-500/20 text-brand-400 font-bold border border-brand-500/30"
                    : "bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <span
                    className="h-3 w-3 rounded-full flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: item.primaryHex }}
                  />
                  <span className="truncate">{t.theme[item.nameKey]}</span>
                </span>
                {isSelected && <Check className="h-3.5 w-3.5 flex-shrink-0 text-brand-400" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/90 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:border-brand-500/40 hover:text-white transition-all backdrop-blur-sm shadow-sm"
        aria-label={t.theme.selectTheme}
        title={t.theme.selectTheme}
      >
        <span
          className="h-3.5 w-3.5 rounded-full flex-shrink-0 ring-2 ring-white/10 shadow-sm"
          style={{ backgroundColor: currentThemeConfig.primaryHex }}
        />
        <Palette className="h-3.5 w-3.5 text-slate-400" />
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-800 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-1.5 border-b border-slate-800 mb-1 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5 text-brand-400" />
              {t.theme.selectTheme}
            </span>
          </div>

          <div className="space-y-1">
            {themes.map((item) => {
              const isSelected = theme === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setTheme(item.id);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left transition-all ${
                    isSelected
                      ? "bg-brand-500/15 border border-brand-500/30 text-white shadow-sm"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span
                      className="h-4 w-4 rounded-full flex-shrink-0 shadow-md ring-2 ring-black/30"
                      style={{ backgroundColor: item.primaryHex }}
                    />
                    <div className="flex flex-col truncate">
                      <span className="text-xs font-semibold leading-tight flex items-center gap-1.5">
                        {t.theme[item.nameKey]}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate leading-tight">
                        {t.theme[item.descKey]}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="h-3.5 w-3.5 flex-shrink-0 text-brand-400 ml-2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
