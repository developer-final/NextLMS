"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Check,
  Building2,
  User,
  SlidersHorizontal,
  Palette,
} from "lucide-react";
import { NicheType, COOKIE_NICHE_KEY, COOKIE_BRAND_KEY, COOKIE_TEACHER_KEY } from "@/lib/niches";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface NicheOption {
  id: NicheType;
  label: string;
  icon: string;
  defaultBrand: string;
  defaultTeacher: string;
}

const NICHE_OPTIONS: NicheOption[] = [
  {
    id: "trading",
    label: "Tài chính & Trading",
    icon: "📈",
    defaultBrand: "World Trading Lab",
    defaultTeacher: "Trần Minh Quang",
  },
  {
    id: "ielts",
    label: "Ngoại ngữ & IELTS",
    icon: "🎓",
    defaultBrand: "IELTS Elite Academy",
    defaultTeacher: "Thầy Đặng Vũ",
  },
  {
    id: "baking",
    label: "Làm bánh & Ẩm thực",
    icon: "🥐",
    defaultBrand: "La Crème Pastry Academy",
    defaultTeacher: "Chef Mai Hương",
  },
  {
    id: "fitness",
    label: "Thể hình & Yoga",
    icon: "🏋️",
    defaultBrand: "IronPulse Fitness",
    defaultTeacher: "HLV Hoàng Long",
  },
  {
    id: "it",
    label: "CNTT & Lập trình",
    icon: "💻",
    defaultBrand: "DevCraft Tech Academy",
    defaultTeacher: "Kỹ sư Hoàng Minh",
  },
  {
    id: "electronics",
    label: "Phần cứng điện tử",
    icon: "⚡",
    defaultBrand: "CircuitMaster Hardware Lab",
    defaultTeacher: "ThS. Vũ Thành Nam",
  },
  {
    id: "mechanical",
    label: "Thiết kế cơ khí",
    icon: "⚙️",
    defaultBrand: "MechDesign Pro Academy",
    defaultTeacher: "Kỹ sư Đỗ Quang Huy",
  },
];

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, days: number = 30) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}; SameSite=Lax`;
}

function eraseCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

export default function DemoNicheSwitcher() {
  const router = useRouter();
  const { theme, setTheme, themes } = useTheme();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [currentNiche, setCurrentNiche] = useState<NicheType>("trading");
  const [customBrand, setCustomBrand] = useState("");
  const [customTeacher, setCustomTeacher] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const n = getCookie(COOKIE_NICHE_KEY) as NicheType | null;
    const b = getCookie(COOKIE_BRAND_KEY);
    const t = getCookie(COOKIE_TEACHER_KEY);

    if (n && NICHE_OPTIONS.some((opt) => opt.id === n)) {
      setCurrentNiche(n);
    }
    if (b) setCustomBrand(b);
    if (t) setCustomTeacher(t);
  }, []);

  if (!mounted) return null;

  const handleSelectNiche = (nicheId: NicheType) => {
    setCurrentNiche(nicheId);
    setCookie(COOKIE_NICHE_KEY, nicheId);

    // Clear previous custom overrides so they don't leak into new niche
    eraseCookie(COOKIE_BRAND_KEY);
    eraseCookie(COOKIE_TEACHER_KEY);
    setCustomBrand("");
    setCustomTeacher("");

    // Update query params cleanly
    const url = new URL(window.location.href);
    url.searchParams.set("niche", nicheId);
    url.searchParams.delete("brand");
    url.searchParams.delete("teacher");

    router.push(url.pathname + url.search);
    router.refresh();
  };

  const handleApplyCustomization = (e: React.FormEvent) => {
    e.preventDefault();
    if (customBrand.trim()) {
      setCookie(COOKIE_BRAND_KEY, customBrand.trim());
    } else {
      eraseCookie(COOKIE_BRAND_KEY);
    }

    if (customTeacher.trim()) {
      setCookie(COOKIE_TEACHER_KEY, customTeacher.trim());
    } else {
      eraseCookie(COOKIE_TEACHER_KEY);
    }

    const url = new URL(window.location.href);
    url.searchParams.set("niche", currentNiche);
    if (customBrand.trim()) url.searchParams.set("brand", customBrand.trim());
    else url.searchParams.delete("brand");

    if (customTeacher.trim()) url.searchParams.set("teacher", customTeacher.trim());
    else url.searchParams.delete("teacher");

    router.push(url.pathname + url.search);
    router.refresh();
    setIsOpen(false);
  };

  const handleReset = () => {
    eraseCookie(COOKIE_NICHE_KEY);
    eraseCookie(COOKIE_BRAND_KEY);
    eraseCookie(COOKIE_TEACHER_KEY);
    setCurrentNiche("trading");
    setCustomBrand("");
    setCustomTeacher("");

    const url = new URL(window.location.href);
    url.searchParams.delete("niche");
    url.searchParams.delete("brand");
    url.searchParams.delete("teacher");

    router.push(url.pathname + (url.search ? url.search : ""));
    router.refresh();
    setIsOpen(false);
  };

  const activeOption = NICHE_OPTIONS.find((opt) => opt.id === currentNiche) || NICHE_OPTIONS[0];

  return (
    <div className="fixed bottom-5 left-5 z-50 flex flex-col items-start font-sans">
      {/* Popover Panel */}
      {isOpen && (
        <div className="mb-3 w-84 sm:w-96 rounded-2xl border border-slate-700/80 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-500/20 text-brand-400">
                <SlidersHorizontal className="h-3.5 w-3.5" />
              </span>
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Demo Niche Studio
              </span>
            </div>
            <button
              onClick={handleReset}
              title="Khôi phục mặc định"
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-400 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          </div>

          {/* Quick Select Niche Grid */}
          <div className="mt-3">
            <label className="text-[11px] font-semibold text-slate-400 block mb-2">
              Chọn Lĩnh Vực Demo:
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
              {NICHE_OPTIONS.map((opt) => {
                const isSelected = currentNiche === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectNiche(opt.id)}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-brand-500 text-slate-950 font-bold shadow-glow scale-[1.02]"
                        : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50"
                    }`}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <span>{opt.icon}</span>
                      <span className="truncate">{opt.label}</span>
                    </span>
                    {isSelected && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Select Theme */}
          <div className="mt-3 pt-3 border-t border-slate-800/80">
            <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 mb-2">
              <Palette className="h-3 w-3 text-brand-400" />
              {t.theme.selectTheme}:
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {themes.map((item) => {
                const isSelected = theme === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTheme(item.id)}
                    title={t.theme[item.nameKey]}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      isSelected
                        ? "bg-brand-500 text-slate-950 shadow-glow scale-105"
                        : "bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/50"
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.primaryHex }}
                    />
                    <span>{t.theme[item.nameKey]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Personalization Form */}
          <form onSubmit={handleApplyCustomization} className="mt-4 pt-3 border-t border-slate-800/80 space-y-2.5">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 mb-1">
                <Building2 className="h-3 w-3 text-brand-400" /> Tên Khách Hàng / Học Viện:
              </label>
              <input
                type="text"
                placeholder={activeOption.defaultBrand}
                value={customBrand}
                onChange={(e) => setCustomBrand(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-brand-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 mb-1">
                <User className="h-3 w-3 text-amber-400" /> Tên Giảng Viên / Master:
              </label>
              <input
                type="text"
                placeholder={activeOption.defaultTeacher}
                value={customTeacher}
                onChange={(e) => setCustomTeacher(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-brand-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-gradient-to-r from-brand-500 to-emerald-400 hover:from-brand-400 hover:to-emerald-300 py-2 text-xs font-bold text-slate-950 shadow-glow transition-all"
            >
              Áp Dụng Demo Tức Thì
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Pill */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/90 hover:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 shadow-xl backdrop-blur-md transition-all hover:scale-105 group"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500/20 text-brand-400 group-hover:bg-brand-500 group-hover:text-slate-950 transition-colors">
          <Sparkles className="h-3 w-3" />
        </span>
        <span className="flex items-center gap-1">
          <span>{activeOption.icon}</span>
          <span className="text-white font-bold">{customBrand.trim() || activeOption.label}</span>
        </span>
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        ) : (
          <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
        )}
      </button>
    </div>
  );
}
