import type { MetadataRoute } from "next";
import { absoluteSiteUrl, getSeoConfig } from "@/lib/seo";

export const revalidate = false;

export default function robots(): MetadataRoute.Robots {
  const { indexable } = getSeoConfig();
  const base = new URL(absoluteSiteUrl("/")).pathname.replace(/\/$/, "");
  const privatePaths = ["admin", "api"].flatMap(path => [`${base}/${path}`, `${base}/${path}/`]);
  return {
    rules: {
      userAgent: "*",
      // Public pages stay crawlable so crawlers can read noindex on previews.
      allow: [`${base}/`, `${base}/api/cms/files/`],
      disallow: privatePaths,
    },
    ...(indexable ? { sitemap: absoluteSiteUrl("/sitemap.xml") } : {}),
  };
}
