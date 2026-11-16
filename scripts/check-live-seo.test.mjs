import assert from "node:assert/strict";
import test from "node:test";
import { auditLiveSeo, hasNoindex, PAGE_PATHS, parseHtml, parseOrigin, parseRobots, validateNotFound, validatePublicPage, validateRedirect, validateRobots, validateSitemap } from "./check-live-seo.mjs";

const origin = "https://seo.example.com";
const pageHtml = (path = "/", extra = "") => `<html><head><title>Title ${path}</title><meta content="Description ${path}" name=description><link href="${origin}${path}" rel=canonical>${extra}</head><body><h1>Heading</h1></body></html>`;

test("SSR parser handles attribute order, quote styles, case, entities and script/comment decoys", () => {
  const page = parseHtml(`<!-- <meta name=robots content=noindex><h1>decoy</h1> -->
    <SCRIPT>const text = '<h1>decoy</h1><meta name="robots" content="noindex">';</SCRIPT>
    <style>.sample::before{content:'<h1>decoy</h1>'}</style>
    <TITLE>طراحی &amp; SEO &#x26; &#38;</TITLE><META CONTENT='متن &quot;خاص&quot; > دیگر' NAME = 'DESCRIPTION'>
    <link data-note='a > b' HREF='${origin}/?a=1&amp;b=2' REL='alternate CANONICAL'>
    <meta CONTENT=INDEX,FOLLOW NAME=Robots><meta name='GOOGLEBOT' content='max-image-preview:large'>
    <h1 class=heading>صفحه</h1>`);
  assert.deepEqual(page.titles, ["طراحی & SEO & &"]);
  assert.deepEqual(page.descriptions, ['متن "خاص" > دیگر']);
  assert.deepEqual(page.canonicals, [`${origin}/?a=1&b=2`]);
  assert.deepEqual(page.robots, ["INDEX,FOLLOW"]);
  assert.equal(page.h1Count, 1);
  assert.equal(hasNoindex(page), false);
});

test("noindex and none block indexing in any meta or header directive, even alongside index", () => {
  for (const extra of [
    '<meta content="index, NOINDEX, follow" name="robots">',
    '<meta name=robots content=index><meta content=none name=googlebot>',
    '<meta name=robots content=index><meta name=robots content=noindex>',
  ]) assert.ok(validatePublicPage({ status: 200, html: pageHtml("/", extra), expectedUrl: `${origin}/` }).issues.some(issue => /Indexing is blocked/.test(issue.message)));
  for (const xRobots of ["noindex", "googlebot: none", "index, googlebot: noindex, follow"]) {
    assert.equal(hasNoindex(parseHtml(pageHtml()), xRobots), true);
  }
  assert.equal(hasNoindex(parseHtml(pageHtml()), "index, max-snippet:50"), false);
});

test("public page validation requires a unique clean canonical, nonempty metadata, HTTP 200 and one H1", () => {
  assert.deepEqual(validatePublicPage({ status: 200, html: pageHtml(), expectedUrl: `${origin}/` }).issues, []);
  assert.deepEqual(validatePublicPage({ status: 200, html: pageHtml().replace(`href="${origin}/"`, `href="${origin}"`), expectedUrl: `${origin}/` }).issues, []);
  const cases = [
    [pageHtml().replace(`href="${origin}/"`, `href="${origin}/?utm_source=test"`), /canonical/],
    [pageHtml().replace(`href="${origin}/"`, 'href="/"'), /canonical/],
    [pageHtml("/", `<link rel=canonical href="${origin}/">`), /canonical/],
    [pageHtml().replace(/<link[^>]+>/, ""), /canonical/],
    [pageHtml().replace("Heading</h1>", "Heading</h1><h1>Second</h1>"), /H1/],
    [pageHtml().replace("Title /", " "), /title/],
    [pageHtml().replace("Description /", " "), /description/],
  ];
  for (const [html, pattern] of cases) assert.ok(validatePublicPage({ status: 200, html, expectedUrl: `${origin}/` }).issues.some(issue => pattern.test(issue.message)));
  assert.ok(validatePublicPage({ status: 200, html: pageHtml("/blog").replace(`href="${origin}/blog"`, `href="${origin}/blog/"`), expectedUrl: `${origin}/blog` }).issues.some(issue => /canonical/.test(issue.message)));
  assert.ok(validatePublicPage({ status: 302, html: pageHtml(), expectedUrl: `${origin}/` }).issues.some(issue => /HTTP 200/.test(issue.message)));
});

test("robots discovery requires the expected sitemap and ignores comments", () => {
  const text = `User-agent: *\n# Sitemap: https://wrong.example/sitemap.xml\n SITEMAP : ${origin}/sitemap.xml # current\n`;
  assert.deepEqual(parseRobots(text), [`${origin}/sitemap.xml`]);
  assert.deepEqual(validateRobots({ status: 200, text, expectedSitemap: `${origin}/sitemap.xml` }), []);
  assert.ok(validateRobots({ status: 200, text: "User-agent: *", expectedSitemap: `${origin}/sitemap.xml` }).length);
});

test("sitemap validation rejects empty, private, foreign, duplicate and missing public URLs", () => {
  const xml = urls => `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url => `<url><loc>${url}</loc></url>`).join("")}</urlset>`;
  assert.deepEqual(validateSitemap({ status: 200, text: xml([`${origin}/`]), origin, expectedUrls: [`${origin}/`] }).issues, []);
  assert.ok(validateSitemap({ status: 200, text: xml([]), origin }).issues.some(issue => /nonempty/.test(issue.message)));
  for (const url of [`${origin}/admin`, `${origin}/api/cms/files/x`, "https://foreign.example/", `${origin}/?q=test`, "not a URL"]) {
    assert.ok(validateSitemap({ status: 200, text: xml([url]), origin }).issues.some(issue => /private/.test(issue.message)));
  }
  assert.ok(validateSitemap({ status: 200, text: xml([`${origin}/`, `${origin}/`]), origin }).issues.some(issue => /duplicate/.test(issue.message)));
  assert.ok(validateSitemap({ status: 200, text: xml([`${origin}/`]), origin, expectedUrls: [`${origin}/blog`] }).issues.some(issue => /omits/.test(issue.message)));
  assert.ok(validateSitemap({ status: 200, text: `<sitemapindex><sitemap><loc>${origin}/sitemap.xml</loc></sitemap></sitemapindex>`, origin }).issues.some(issue => /urlset/.test(issue.message)));
});

test("nonexistent pages must return 404, noindex and no home canonical", () => {
  const html = '<title>Missing</title><meta content=noindex name=robots><h1>Missing</h1>';
  assert.deepEqual(validateNotFound({ status: 404, html, origin }), []);
  assert.equal(validateNotFound({ status: 200, html: pageHtml(), origin }).length, 3);
  assert.deepEqual(validateNotFound({ status: 404, html: "", xRobots: "none", origin }), []);
});

test("only a permanent single-hop redirect to the HTTPS canonical passes", () => {
  const args = { sourceUrl: "http://seo.example.com/", expectedUrl: `${origin}/` };
  assert.deepEqual(validateRedirect({ ...args, status: 308, location: `${origin}/` }), []);
  for (const response of [{ status: 200 }, { status: 302, location: `${origin}/` }, { status: 301, location: "https://www.seo.example.com/" }]) {
    assert.equal(validateRedirect({ ...args, ...response })[0].severity, "warning");
  }
});

test("audit uses sequential, bounded, manual-redirect public GETs and detects duplicate metadata", async () => {
  const calls = [];
  let active = false;
  const fetchImpl = async (url, options) => {
    assert.equal(active, false);
    active = true;
    assert.equal(options.method, "GET");
    assert.equal(options.redirect, "manual");
    assert.ok(options.signal);
    calls.push(url);
    await Promise.resolve();
    active = false;
    const parsed = new URL(url);
    if (parsed.origin !== origin) return new Response(null, { status: 301, headers: { location: `${origin}/` } });
    if (parsed.pathname === "/robots.txt") return new Response(`Sitemap: ${origin}/sitemap.xml`);
    if (parsed.pathname === "/sitemap.xml") return new Response(`<urlset>${PAGE_PATHS.map(path => `<url><loc>${origin}${path}</loc></url>`).join("")}</urlset>`);
    if (parsed.pathname.includes("missing_page")) return new Response('<meta name=robots content=noindex>', { status: 404 });
    return new Response(pageHtml(parsed.pathname).replace(`Title ${parsed.pathname}`, "Shared title"));
  };
  const report = await auditLiveSeo(origin, { fetchImpl });
  assert.equal(report.requests, 12);
  assert.equal(calls.length, 12);
  assert.equal(report.criticalCount, PAGE_PATHS.length - 1);
  assert.equal(report.warningCount, 0);
  assert.ok(report.results.flatMap(result => result.issues).every(issue => /title.*duplicates/.test(issue.message)));
});

test("body limit prevents oversized HTML from being parsed", async () => {
  const report = await auditLiveSeo("http://127.0.0.1:9876", {
    fetchImpl: async () => new Response("discard", { headers: { "content-length": String(3 * 1024 * 1024) } }),
  });
  assert.equal(report.requests, 10);
  assert.equal(report.criticalCount, 10);
  assert.ok(report.results.slice(0, 10).every(result => result.issues[0].message.includes("body limit")));
});

test("origin override accepts only a clean HTTP(S) origin", () => {
  assert.equal(parseOrigin(`${origin}/`), origin);
  for (const value of [`${origin}/path`, `${origin}/?q=1`, "https://user:pass@seo.example.com", "file:///tmp/a"]) assert.throws(() => parseOrigin(value));
});
