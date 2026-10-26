import type { Metadata } from "next";

type SeoEnvironment = Record<string, string | undefined>;

/** SITE_URL is an origin; the application's mount path is configured once. */
export function getSeoConfig(env: SeoEnvironment = process.env) {
  const configured = Boolean(env.SITE_URL?.trim());
  const exported = env.DEPLOY_TARGET === "github-pages";
  const basePath = (env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");
  if (basePath && !/^\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+$/.test(basePath)) {
    throw new Error("NEXT_PUBLIC_BASE_PATH must be a clean absolute path without a trailing slash.");
  }
  let origin: URL;
  try {
    origin = new URL(env.SITE_URL?.trim() || (exported ? "https://mohammadjavad-sp.github.io" : "http://localhost:3000"));
  } catch { throw new Error("SITE_URL must be an absolute HTTP(S) origin, for example https://elitasocial.ir."); }
  if (!["http:", "https:"].includes(origin.protocol) || origin.username || origin.password || origin.search || origin.hash || origin.pathname !== "/") {
    throw new Error("SITE_URL must contain only an HTTP(S) origin, without credentials, a path, query or fragment.");
  }
  const host = origin.hostname.toLowerCase().replace(/\.$/, "");
  origin.hostname = host;
  const previewHost = /(?:^|\.)(?:localhost|local|test|invalid|example)$/.test(host)
    || /(?:^|\.)(?:github\.io|vercel\.app|netlify\.app)$/.test(host)
    || /^[\d.]+$/.test(host) || host.includes(":") || !host.includes(".");
  const indexable = env.NODE_ENV === "production" && env.SITE_INDEXING === "true"
    && configured && origin.protocol === "https:" && !previewHost && !exported;
  return { siteUrl: new URL(`${basePath}/`, origin), indexable, configured, exported, basePath };
}

/** Both canonicals and the sitemap share the deployment's exact slash policy. */
export function absoluteSiteUrl(path: string, env: SeoEnvironment = process.env): string {
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\") || /[\u0000-\u001f]/.test(path)) {
    throw new Error("SEO paths must be local, absolute application paths.");
  }
  const config = getSeoConfig(env);
  const parsed = new URL(path, "https://local-path.invalid");
  let local = parsed.pathname;
  if (config.basePath && (local === config.basePath || local.startsWith(`${config.basePath}/`))) {
    local = local.slice(config.basePath.length) || "/";
  }
  local = local.replace(/\/{2,}/g, "/");
  const isFile = /\/[^/]+\.[a-zA-Z0-9]+$/.test(local);
  local = local.replace(/\/$/, "") || "/";
  if (config.exported && !isFile && local !== "/") local += "/";
  const url = new URL(config.siteUrl);
  url.pathname = `${config.basePath}${local}`;
  return url.toString();
}

export function indexingMetadata(env: SeoEnvironment = process.env): Metadata["robots"] {
  const { indexable } = getSeoConfig(env);
  return indexable
    ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } }
    : { index: false, follow: false };
}

type PageSeo = {
  title: string;
  description: string;
  path: string;
  siteName: string;
  image?: { src: string; alt: string; width?: number; height?: number };
  type?: "website" | "article";
  author?: string;
};

export function createPageMetadata({ title, description, path, siteName, image, type = "website", author }: PageSeo, env: SeoEnvironment = process.env): Metadata {
  const canonical = absoluteSiteUrl(path, env);
  const share = image || { src: "/images/social-share.jpg", alt: "الیتا سوشیال؛ طراحی وب، محتوا و شبکه‌های اجتماعی", width: 1200, height: 630 };
  const shareImage = { url: absoluteSiteUrl(share.src, env), alt: share.alt,
    ...(share.width && share.height ? { width: share.width, height: share.height } : {}) };
  return {
    title,
    description,
    alternates: { canonical },
    robots: indexingMetadata(env),
    openGraph: {
      type, title, description, url: canonical, siteName, locale: "fa_IR", images: [shareImage],
      ...(type === "article" && author ? { authors: [author] } : {}),
    },
    twitter: { card: "summary_large_image", title, description, images: [shareImage] },
    ...(author ? { authors: [{ name: author }] } : {}),
  };
}
