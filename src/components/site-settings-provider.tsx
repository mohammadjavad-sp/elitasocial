"use client";

import { createContext, useContext, type ReactNode } from "react";
import { getDefaultSiteSettings, type SiteSettings } from "@/lib/site-settings";

const SiteSettingsContext = createContext<SiteSettings | null>(null);

export function SiteSettingsProvider({ settings, children }: { settings: SiteSettings; children: ReactNode }) {
  return <SiteSettingsContext.Provider value={settings}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings(): SiteSettings {
  return useContext(SiteSettingsContext) ?? getDefaultSiteSettings();
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
