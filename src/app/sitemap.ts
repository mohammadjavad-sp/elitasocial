import type { MetadataRoute } from "next";
import { getSeoConfig } from "@/lib/seo";
import { buildPublicSitemap } from "@/lib/sitemap";
import { getCmsContent } from "@/server/content";

// This literal permits static export. In Node, getCmsContent calls connection()
// so publishing, drafting or deleting a record changes the very next request.
export const revalidate = false;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!getSeoConfig().indexable) return [];
  return buildPublicSitemap(await getCmsContent());
}
