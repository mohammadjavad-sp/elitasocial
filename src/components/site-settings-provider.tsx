"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { SiteSettings } from "@/lib/site-settings";

const SiteSettingsContext = createContext<SiteSettings | null>(null);

export function SiteSettingsProvider({ settings, children }: { settings: SiteSettings; children: ReactNode }) {
  return <SiteSettingsContext.Provider value={settings}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings(): SiteSettings {
  const settings = useContext(SiteSettingsContext);
  if (!settings) throw new Error("useSiteSettings must be used within SiteSettingsProvider");
  return settings;
}

/** Show the actual configured account without keeping a second, stale handle. */
export function socialAccountLabel(value: string): string {
  try {
    const url = new URL(value);
    const account = url.pathname.split("/").filter(Boolean).join("/");
    return account ? `@${account}` : url.hostname;
  } catch {
    return value;
  }
}
