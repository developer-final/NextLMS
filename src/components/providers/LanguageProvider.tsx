"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { Language, DictionaryType, getDictionary } from "@/lib/i18n";

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: DictionaryType;
  isVi: boolean;
  isEn: boolean;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = "wtl_preferred_language";
const COOKIE_NAME = "NEXT_LOCALE";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read saved language from localStorage or cookie
    try {
      const savedLang = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (savedLang === "vi" || savedLang === "en") {
        setLanguageState(savedLang);
        document.documentElement.lang = savedLang;
      } else {
        // Fallback to browser language if available, default to English
        const browserLang = navigator.language.toLowerCase();
        if (browserLang.startsWith("vi")) {
          setLanguageState("vi");
          document.documentElement.lang = "vi";
        } else {
          setLanguageState("en");
          document.documentElement.lang = "en";
        }
      }
    } catch {
      // Fallback
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      document.cookie = `${COOKIE_NAME}=${lang}; path=/; max-age=31536000; SameSite=Lax`;
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
