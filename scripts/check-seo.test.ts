import assert from "node:assert/strict";
import test from "node:test";
import { absoluteSiteUrl, createPageMetadata, getSeoConfig, indexingMetadata } from "../src/lib/seo";

const production = { NODE_ENV: "production", SITE_URL: "https://elita.example.com", SITE_INDEXING: "true" };
const preview = { ...production, DEPLOY_TARGET: "github-pages", SITE_URL: "https://mohammadjavad-sp.github.io", NEXT_PUBLIC_BASE_PATH: "/elitasocial" };

test("indexing needs an explicit public HTTPS production origin and opt-in", () => {
  assert.equal(getSeoConfig(production).indexable, true);
  for (const env of [
    {}, { ...production, NODE_ENV: "development" }, { ...production, SITE_INDEXING: "false" },
    { ...production, SITE_URL: "" }, { ...production, SITE_URL: "http://elita.example.com" },
    { ...production, SITE_URL: "https://localhost" }, { ...production, SITE_URL: "https://127.0.0.1" },
    { ...production, SITE_URL: "https://[::1]" }, { ...production, SITE_URL: "https://staging.test" },
    { ...production, SITE_URL: "https://project.vercel.app" }, { ...production, SITE_URL: "https://project.netlify.app" },
    { ...production, SITE_URL: "https://project.github.io." }, preview,
  ]) assert.equal(getSeoConfig(env).indexable, false, JSON.stringify(env));
  assert.deepEqual(indexingMetadata(preview), { index: false, follow: false });
});

test("invalid SEO origins fail instead of silently producing another canonical", () => {
  for (const value of ["elita.example.com", "javascript:alert(1)", "https://user:pass@elita.example.com", "https://elita.example.com/base", "https://elita.example.com/?q=1", "https://elita.example.com/#part"]) {
    assert.throws(() => getSeoConfig({ ...production, SITE_URL: value }));
  }
  assert.throws(() => getSeoConfig({ ...production, NEXT_PUBLIC_BASE_PATH: "//wrong" }));
});

test("canonical policy strips tracking, searches and fragments and matches routing slashes", () => {
  assert.equal(absoluteSiteUrl("/blog/website-brief/?utm_source=instagram#goal", production), "https://elita.example.com/blog/website-brief");
  assert.equal(absoluteSiteUrl("/pricing/?planCategory=website", production), "https://elita.example.com/pricing");
  assert.equal(absoluteSiteUrl("/", production), "https://elita.example.com/");
  assert.equal(absoluteSiteUrl("/blog/?q=content#library", preview), "https://mohammadjavad-sp.github.io/elitasocial/blog/");
});

test("deployment subpath appears once and file URLs never gain a slash", () => {
  assert.equal(absoluteSiteUrl("/elitasocial/blog/", preview), absoluteSiteUrl("/blog/", preview));
  assert.equal(absoluteSiteUrl("/sitemap.xml", preview), "https://mohammadjavad-sp.github.io/elitasocial/sitemap.xml");
  assert.equal(absoluteSiteUrl("/images/social-share.jpg", preview), "https://mohammadjavad-sp.github.io/elitasocial/images/social-share.jpg");
  assert.equal(absoluteSiteUrl("/", preview), "https://mohammadjavad-sp.github.io/elitasocial/");
  assert.equal(absoluteSiteUrl("/services/", { ...production, NEXT_PUBLIC_BASE_PATH: "/studio" }), "https://elita.example.com/studio/services");
  for (const path of ["https://attacker.test/", "//attacker.test/", "/\\attacker.test/", "/blog/\n"]) assert.throws(() => absoluteSiteUrl(path, production));
});

test("each page has aligned canonical, OG and Twitter titles and a large branded image", () => {
  const metadata = createPageMetadata({ title: "پلن‌ها و قیمت‌ها", description: "توضیح اختصاصی", path: "/pricing/?category=website", siteName: "الیتا سوشیال" }, production);
  const og = metadata.openGraph as Record<string, unknown>;
  const twitter = metadata.twitter as Record<string, unknown>;
  assert.equal(metadata.alternates?.canonical, "https://elita.example.com/pricing");
  assert.equal(og.url, metadata.alternates?.canonical);
  assert.equal(og.title, metadata.title);
  assert.equal(twitter.title, metadata.title);
  assert.equal(twitter.description, metadata.description);
  assert.equal(twitter.card, "summary_large_image");
  assert.deepEqual(og.images, twitter.images);
  assert.deepEqual(og.images, [{ url: "https://elita.example.com/images/social-share.jpg", alt: "الیتا سوشیال؛ طراحی وب، محتوا و شبکه‌های اجتماعی", width: 1200, height: 630 }]);
});

test("article-specific previews preserve their actual image and author without invented dates", () => {
  const metadata = createPageMetadata({ title: "مقاله", description: "خلاصه", path: "/blog/content-calendar/", siteName: "الیتا", image: { src: "/images/social-marketing.webp", alt: "تصویر مقاله" }, type: "article", author: "تحریریهٔ الیتا" }, preview);
  const og = metadata.openGraph as Record<string, unknown>;
  assert.equal(og.type, "article");
  assert.deepEqual(og.authors, ["تحریریهٔ الیتا"]);
  assert.equal(og.publishedTime, undefined);
  assert.equal(og.modifiedTime, undefined);
  assert.deepEqual(og.images, [{ url: "https://mohammadjavad-sp.github.io/elitasocial/images/social-marketing.webp", alt: "تصویر مقاله" }]);
});
