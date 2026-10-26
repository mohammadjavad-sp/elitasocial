"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { applyTheme, isTheme, THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

type ThemeContextValue = { theme: Theme; toggleTheme: () => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Keep the first client render identical to the server. The head bootstrap
  // already controls the visible palette and icon until the effect synchronizes.
  const [theme, setTheme] = useState<Theme>("light");
  const explicitChoice = useRef<Theme | null>(null);

  const updateTheme = useCallback((next: Theme) => {
    applyTheme(next);
    setTheme(next);
  }, []);

  useEffect(() => {
    let media: MediaQueryList | undefined;
    try { media = window.matchMedia("(prefers-color-scheme: dark)"); } catch { /* Light is a safe fallback. */ }
    let saved: string | null = null;
    try { saved = window.localStorage.getItem(THEME_STORAGE_KEY); } catch { /* The switch still works in memory. */ }
    explicitChoice.current = isTheme(saved) ? saved : null;
    const systemTheme = (): Theme => media?.matches ? "dark" : "light";
    updateTheme(explicitChoice.current ?? systemTheme());

    const onSystemChange = () => {
      if (!explicitChoice.current) updateTheme(systemTheme());
    };
    const onStorageChange = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;
      explicitChoice.current = isTheme(event.newValue) ? event.newValue : null;
      updateTheme(explicitChoice.current ?? systemTheme());
    };
    media?.addEventListener?.("change", onSystemChange);
    // Older Safari uses the legacy MediaQueryList API.
    if (media && !media.addEventListener) media.addListener(onSystemChange);
    window.addEventListener("storage", onStorageChange);
    return () => {
      media?.removeEventListener?.("change", onSystemChange);
      if (media && !media.removeEventListener) media.removeListener(onSystemChange);
      window.removeEventListener("storage", onStorageChange);
    };
  }, [updateTheme]);

  const toggleTheme = useCallback(() => {
    const current = document.documentElement.dataset.theme;
    const next: Theme = current === "dark" ? "light" : "dark";
    explicitChoice.current = next;
    try { window.localStorage.setItem(THEME_STORAGE_KEY, next); } catch { /* Keep the user's choice for this tab. */ }
    updateTheme(next);
  }, [updateTheme]);

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
