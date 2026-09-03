"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import {
  Language,
  DictionaryType,
  getDictionary,
  COOKIE_LOCALE_KEY,
  STORAGE_LOCALE_KEY,
  DEFAULT_FALLBACK_LANGUAGE,
} from "@/lib/i18n";

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: DictionaryType;
  isVi: boolean;
  isEn: boolean;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_FALLBACK_LANGUAGE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 1. Read explicitly saved language preference from localStorage
    try {
      const savedLang = localStorage.getItem(STORAGE_LOCALE_KEY) as Language | null;
      if (savedLang === "vi" || savedLang === "en") {
        setLanguageState(savedLang);
        document.documentElement.lang = savedLang;
        setMounted(true);
        return;
      }

      // 2. Read locale detected via Vercel GeoIP from cookie set by middleware
      const cookieLocale = getCookieValue(COOKIE_LOCALE_KEY) as Language | null;
      if (cookieLocale === "vi" || cookieLocale === "en") {
        setLanguageState(cookieLocale);
        document.documentElement.lang = cookieLocale;
        localStorage.setItem(STORAGE_LOCALE_KEY, cookieLocale);
        setMounted(true);
        return;
      }

      // 3. Fallback to browser language if available, default to English
      const browserLang = navigator.language?.toLowerCase() || "";
      const initialLang: Language = browserLang.startsWith("vi") ? "vi" : DEFAULT_FALLBACK_LANGUAGE;
      setLanguageState(initialLang);
      document.documentElement.lang = initialLang;
      localStorage.setItem(STORAGE_LOCALE_KEY, initialLang);
    } catch {
      // Ignore storage errors on restricted environments
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_LOCALE_KEY, lang);
      document.cookie = `${COOKIE_LOCALE_KEY}=${lang}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.lang = lang;
    } catch {
      // Ignore storage errors
    }
  };

  const t = useMemo(() => getDictionary(language), [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      isVi: language === "vi",
      isEn: language === "en",
    }),
    [language, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if rendered outside provider
    const fallbackDictionary = getDictionary("en");
    return {
      language: "en",
      setLanguage: () => {},
      t: fallbackDictionary,
      isVi: false,
      isEn: true,
    };
  }
  return context;
}
