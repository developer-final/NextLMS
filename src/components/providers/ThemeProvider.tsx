"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  ThemeId,
  ThemeConfig,
  THEMES,
  DEFAULT_THEME,
  STORAGE_THEME_KEY,
  COOKIE_THEME_KEY,
  isValidTheme,
} from "@/lib/theme";

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  themes: ThemeConfig[];
  currentThemeConfig: ThemeConfig;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Long-lived cookie string (10 years) for permanent browser persistence
const COOKIE_LIFETIME = "path=/; max-age=315360000; expires=Tue, 19 Jan 2038 03:14:07 GMT; SameSite=Lax";

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function persistThemeLocally(themeId: ThemeId) {
  try {
    document.documentElement.setAttribute("data-theme", themeId);
    localStorage.setItem(STORAGE_THEME_KEY, themeId);
    document.cookie = `${COOKIE_THEME_KEY}=${themeId}; ${COOKIE_LIFETIME}`;
  } catch {
    // Ignore storage errors on restricted environments
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession();
  const [theme, setThemeState] = useState<ThemeId>(DEFAULT_THEME);
  const [mounted, setMounted] = useState(false);
  const hasUserSelectedRef = useRef(false);

  // 1. Initial client-side load from LocalStorage / Cookie
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(STORAGE_THEME_KEY);
      if (isValidTheme(savedTheme)) {
        setThemeState(savedTheme);
        document.documentElement.setAttribute("data-theme", savedTheme);
        setMounted(true);
        return;
      }

      const cookieTheme = getCookieValue(COOKIE_THEME_KEY);
      if (isValidTheme(cookieTheme)) {
        setThemeState(cookieTheme);
        document.documentElement.setAttribute("data-theme", cookieTheme);
        localStorage.setItem(STORAGE_THEME_KEY, cookieTheme);
        setMounted(true);
        return;
      }

      document.documentElement.setAttribute("data-theme", DEFAULT_THEME);
    } catch {
      // Ignore storage errors
    }
    setMounted(true);
  }, []);

  // 2. Synchronize with logged-in user's DB preference
  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;
    const userDbTheme = session.user.theme;

    // If user has a valid theme saved in DB and hasn't explicitly changed theme in current tab
    if (isValidTheme(userDbTheme) && !hasUserSelectedRef.current) {
      const savedLocal = typeof window !== "undefined" ? localStorage.getItem(STORAGE_THEME_KEY) : null;
      // If local storage is empty or matches DB, adopt DB theme
      if (!savedLocal || savedLocal === userDbTheme) {
        setThemeState(userDbTheme);
        persistThemeLocally(userDbTheme);
      } else if (isValidTheme(savedLocal) && savedLocal !== userDbTheme) {
        // If user had selected a different theme before logging in, update DB to match recent choice
        fetch("/api/user/theme", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ theme: savedLocal }),
        }).catch(() => {});
      }
    }
  }, [status, session?.user]);

  // 3. User selects a theme
  const setTheme = (newTheme: ThemeId) => {
    if (!isValidTheme(newTheme)) return;
    hasUserSelectedRef.current = true;
    setThemeState(newTheme);
    persistThemeLocally(newTheme);

    // If user is authenticated, persist to DB and update NextAuth session
    if (status === "authenticated" && session?.user) {
      fetch("/api/user/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: newTheme }),
      }).catch((err) => {
        console.error("Failed to save theme to database:", err);
      });

      if (typeof update === "function") {
        update({ theme: newTheme }).catch(() => {});
      }
    }
  };

  const currentThemeConfig = useMemo(() => {
    return THEMES.find((t) => t.id === theme) || THEMES[0];
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      themes: THEMES,
      currentThemeConfig,
    }),
    [theme, currentThemeConfig]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
