import { DictionaryType } from "@/lib/i18n";

export type ThemeId = "emerald" | "ocean" | "amber" | "crimson" | "purple";

export interface ThemeConfig {
  id: ThemeId;
  nameKey: keyof DictionaryType["theme"];
  descKey: keyof DictionaryType["theme"];
  primaryHex: string;
  secondaryHex: string;
  dotBg: string;
  ringColor: string;
  icon: string;
}

export const COOKIE_THEME_KEY = "wti_theme";
export const STORAGE_THEME_KEY = "wti_theme_pref";
export const DEFAULT_THEME: ThemeId = "emerald";

export const THEMES: ThemeConfig[] = [
  {
    id: "emerald",
    nameKey: "emerald",
    descKey: "emeraldDesc",
    primaryHex: "#10b981",
    secondaryHex: "#22c55e",
    dotBg: "bg-emerald-500",
    ringColor: "ring-emerald-400",
    icon: "📈",
  },
  {
    id: "ocean",
    nameKey: "ocean",
    descKey: "oceanDesc",
    primaryHex: "#0ea5e9",
    secondaryHex: "#3b82f6",
    dotBg: "bg-sky-500",
    ringColor: "ring-sky-400",
    icon: "🌊",
  },
  {
    id: "amber",
    nameKey: "amber",
    descKey: "amberDesc",
    primaryHex: "#f59e0b",
    secondaryHex: "#fbbf24",
    dotBg: "bg-amber-500",
    ringColor: "ring-amber-400",
    icon: "👑",
  },
  {
    id: "crimson",
    nameKey: "crimson",
    descKey: "crimsonDesc",
    primaryHex: "#f43f5e",
    secondaryHex: "#e11d48",
    dotBg: "bg-rose-500",
    ringColor: "ring-rose-400",
    icon: "🔥",
  },
  {
    id: "purple",
    nameKey: "purple",
    descKey: "purpleDesc",
    primaryHex: "#8b5cf6",
    secondaryHex: "#7c3aed",
    dotBg: "bg-purple-500",
    ringColor: "ring-purple-400",
    icon: "⚡",
  },
];

export function isValidTheme(val: unknown): val is ThemeId {
  return typeof val === "string" && THEMES.some((t) => t.id === val);
}
