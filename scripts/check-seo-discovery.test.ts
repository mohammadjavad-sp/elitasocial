/** Run with: node --conditions=react-server --import tsx --test scripts/check-seo-discovery.test.ts */
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

// Deliberately do not load .env.local or touch the website's actual database.
process.env.CMS_DATA_DIR = mkdtempSync(path.join(os.tmpdir(), "elita-seo-discovery-"));
process.env.DEPLOY_TARGET = "node";
process.env.SITE_URL = "https://seo.elitasocial.ir";
process.env.SITE_INDEXING = "true";
process.env.NEXT_PUBLIC_BASE_PATH = "";
Object.assign(process.env, { NODE_ENV: "production" });

test("sitemap follows only the current published CMS content", async t => {
  const { articles } = await import("../src/content/articles");
  const { services } = await import("../src/content/services");
  const { buildPublicSitemap } = await import("../src/lib/sitemap");
  const { deleteRecord, ensureSeed, getDatabase, listRecords, saveRecord } = await import("../src/server/database");
  const readCurrent = () => buildPublicSitemap({
    articles: listRecords("articles", true).map(record => record.data as unknown as typeof articles[number]),
    services: listRecords("services", true).map(record => record.data as unknown as typeof services[number]),
  });
  const paths = () => readCurrent().map(item => new URL(item.url).pathname);
  ensureSeed([]);
  const article = { ...articles[0], slug: "published-test", category: "website" as const };
  let published = saveRecord("articles", article, "published");
  let draft = saveRecord("articles", { ...article, slug: "draft-test", category: "seo" }, "draft");
  let service = saveRecord("services", { ...services[0] }, "draft");

  await t.test("published pages appear while drafts and empty categories are absent", () => {
    const result = paths();
    assert.ok(result.includes("/blog/published-test"));
    assert.ok(result.includes("/blog/category/website"));
    assert.ok(!result.includes("/blog/draft-test"));
    assert.ok(!result.includes("/blog/category/seo"));
    assert.ok(!result.includes(`/services/${services[0].slug}`));
    assert.equal(result.length, 7);
  });

  await t.test("publishing appears on the next read without a rebuild", () => {
    draft = saveRecord("articles", draft.data, "published", draft.id, draft.revision);
    service = saveRecord("services", service.data, "published", service.id, service.revision);
    const result = paths();
    assert.ok(result.includes("/blog/draft-test"));
    assert.ok(result.includes("/blog/category/seo"));
    assert.ok(result.includes(`/services/${services[0].slug}`));
  });

  await t.test("drafting removes both the article and its now-empty category", () => {
    published = saveRecord("articles", published.data, "draft", published.id, published.revision);
    const result = paths();
    assert.ok(!result.includes("/blog/published-test"));
    assert.ok(!result.includes("/blog/category/website"));
  });

  await t.test("deleting published records never restores starter content", () => {
    deleteRecord("articles", draft.id, draft.revision);
    deleteRecord("services", service.id, service.revision);
    assert.deepEqual(paths(), ["/", "/services", "/portfolio", "/pricing", "/blog"]);
  });

  await t.test("URLs are unique, absolute, public and have no invented lastmod", () => {
    const result = buildPublicSitemap({ articles: [article, article], services });
    assert.equal(new Set(result.map(item => item.url)).size, result.length);
    for (const item of result) {
      const url = new URL(item.url);
      assert.equal(url.protocol, "https:");
      assert.equal(url.search, "");
      assert.equal(url.hash, "");
      assert.ok(!/\/(admin|api)\//.test(url.pathname));
      assert.equal(item.lastModified, undefined);
    }
  });

  await t.test("malformed and unrouteable article slugs cannot enter discovery", () => {
    const invalid = ["category", "../admin", "draft?preview=1", "page#heading", "https://attacker.test/"];
    const result = buildPublicSitemap({ articles: invalid.map(slug => ({ ...article, slug })), services: [] });
    assert.equal(result.length, 5);
  });

  await t.test("preview discovery is empty while public pages remain crawlable", async () => {
    const { default: sitemap } = await import("../src/app/sitemap");
    const { default: robots } = await import("../src/app/robots");
    assert.equal(robots().sitemap, "https://seo.elitasocial.ir/sitemap.xml");
    process.env.SITE_INDEXING = "false";
    assert.deepEqual(await sitemap(), []);
    const rules = robots();
    assert.equal(rules.sitemap, undefined);
    assert.deepEqual(rules.rules, {
      userAgent: "*", allow: ["/", "/api/cms/files/"], disallow: ["/admin", "/admin/", "/api", "/api/"],
    });
    // No getCmsContent / connection() is needed for this noindex response.
    process.env.SITE_INDEXING = "true";
    process.env.SITE_URL = "";
    assert.deepEqual(await sitemap(), []);
    assert.equal(robots().sitemap, undefined);
    process.env.SITE_URL = "https://seo.elitasocial.ir";
  });

  await t.test("GitHub export stays noindex even with the indexing flag; pure URLs retain its prefix", async () => {
    const { default: sitemap } = await import("../src/app/sitemap");
    const { default: robots } = await import("../src/app/robots");
    process.env.DEPLOY_TARGET = "github-pages";
    process.env.NEXT_PUBLIC_BASE_PATH = "/elitasocial";
    assert.deepEqual(await sitemap(), []);
    const result = buildPublicSitemap({ articles, services });
    assert.ok(result.length > 5);
    for (const item of result) {
      const url = new URL(item.url);
      assert.equal(url.origin, "https://seo.elitasocial.ir");
      assert.ok(url.pathname.startsWith("/elitasocial/"));
      assert.ok(url.pathname.endsWith("/"));
      assert.ok(!url.pathname.includes("/elitasocial/elitasocial/"));
    }
    const rules = robots();
    assert.equal(rules.sitemap, undefined);
    assert.deepEqual(rules.rules, {
      userAgent: "*", allow: ["/elitasocial/", "/elitasocial/api/cms/files/"], disallow: ["/elitasocial/admin", "/elitasocial/admin/", "/elitasocial/api", "/elitasocial/api/"],
    });
    process.env.DEPLOY_TARGET = "node";
    process.env.NEXT_PUBLIC_BASE_PATH = "";
  });

  getDatabase().close();
});
