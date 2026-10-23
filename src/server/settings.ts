import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { getDefaultSiteSettings, normalizeSiteSettings, type SiteSettings } from "@/lib/site-settings";

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  if (process.env.DEPLOY_TARGET === "github-pages") return normalizeSiteSettings(getDefaultSiteSettings());
  await connection();
  const { readSiteSettings } = await import("./site-settings");
  return normalizeSiteSettings(readSiteSettings().data);
});
