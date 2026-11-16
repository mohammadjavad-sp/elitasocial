import type { Article } from "@/content/articles";
import type { SiteSettings } from "./site-settings";
import { absoluteSiteUrl } from "./seo";

type Environment = Record<string, string | undefined>;
type Breadcrumb = { name: string; path: string };

function organization(settings: SiteSettings, env?: Environment) {
  const { brand, contact } = settings.home;
  const url = absoluteSiteUrl("/", env);
  const sameAs = [contact.instagram, contact.telegram, contact.bale, contact.eitaa, contact.rubika]
    .filter(value => { try { return new URL(value).protocol === "https:"; } catch { return false; } });
  return {
    "@type": "Organization", "@id": `${url}#organization`, name: brand.name,
    alternateName: brand.latinName, url,
    logo: absoluteSiteUrl("/images/elita-social-logo-thin.webp", env),
    ...(contact.email ? { email: contact.email } : {}),
    ...(contact.phone ? { telephone: contact.phone.replace(/^tel:/, "") } : {}),
    ...(sameAs.length ? { sameAs: [...new Set(sameAs)] } : {}),
  };
}

export function brandStructuredData(settings: SiteSettings, env?: Environment) {
  const brand = organization(settings, env);
  return { "@context": "https://schema.org", "@graph": [brand, {
    "@type": "WebSite", "@id": `${brand.url}#website`, url: brand.url,
    name: settings.home.brand.name, alternateName: settings.home.brand.latinName,
    inLanguage: "fa-IR", publisher: { "@id": brand["@id"] },
  }] };
}

export function breadcrumbStructuredData(items: Breadcrumb[], env?: Environment) {
  return {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem", position: index + 1, name: item.name, item: absoluteSiteUrl(item.path, env),
    })),
  };
}

export function articleStructuredData(article: Article, settings: SiteSettings, env?: Environment) {
  const url = absoluteSiteUrl(`/blog/${article.slug}/`, env);
  return {
    "@context": "https://schema.org", "@type": "BlogPosting", "@id": `${url}#article`,
    url, mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: article.title, description: article.excerpt,
    image: [absoluteSiteUrl(article.image.src, env)],
    author: { "@type": "Person", name: article.author },
    publisher: organization(settings, env), inLanguage: "fa-IR",
    // No editorial dates exist in the public model. Never substitute build/seed dates.
  };
}

/** Escape CMS text before embedding it in an HTML script element. */
export function serializeStructuredData(data: object) {
  return JSON.stringify(data).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}
