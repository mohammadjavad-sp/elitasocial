import type { MetadataRoute } from "next";
import { articleCategories, type Article } from "@/content/articles";
import type { ServiceDetail } from "@/content/services";
import { absoluteSiteUrl } from "@/lib/seo";

type PublicSitemapContent = {
  articles: Pick<Article, "slug" | "category">[];
  services: Pick<ServiceDetail, "slug">[];
};

/** Only pass the published content returned by getCmsContent, never editor records. */
export function buildPublicSitemap({ articles, services }: PublicSitemapContent): MetadataRoute.Sitemap {
  const validSlug = (slug: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
  const publicArticles = articles.filter(article => validSlug(article.slug) && article.slug !== "category" && articleCategories.some(category => category.id === article.category));
  const paths = [
    "/",
    "/services/",
    "/portfolio/",
    "/pricing/",
    "/blog/",
    ...services.filter(service => validSlug(service.slug)).map(service => `/services/${service.slug}/`),
    ...articleCategories.filter(category => publicArticles.some(article => article.category === category.id)).map(category => `/blog/category/${category.slug}/`),
    ...publicArticles.map(article => `/blog/${article.slug}/`),
  ];

  // The public content model has no publication/update dates. Omit lastmod
  // rather than changing every URL's date each time the sitemap is generated.
  return [...new Set(paths)].map(path => ({ url: absoluteSiteUrl(path) }));
}
