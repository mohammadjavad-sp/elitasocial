import { pathToFileURL } from "node:url";

export const DEFAULT_ORIGIN = "https://elitasocial.ir";
export const PAGE_PATHS = ["/", "/services/website", "/services/instagram", "/services/seo", "/services/content", "/pricing", "/blog"];
const MAX_REQUESTS = 12;
const MAX_BODY_BYTES = 2 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 12_000;
const missingPath = "/__elita_seo_audit_missing_page__";

export function parseOrigin(value = DEFAULT_ORIGIN) {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("Pass an HTTP(S) origin without a path, credentials, query or fragment.");
  }
  return url.origin;
}

function decodeEntities(value) {
  const named = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " };
  return value.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (entity, key) => {
    if (key[0] !== "#") return named[key.toLowerCase()] ?? entity;
    const number = key[1].toLowerCase() === "x" ? Number.parseInt(key.slice(2), 16) : Number.parseInt(key.slice(1), 10);
    return number > 0 && number <= 0x10ffff && !(number >= 0xd800 && number <= 0xdfff) ? String.fromCodePoint(number) : "\ufffd";
  });
}

function attributes(source) {
  const result = {};
  let offset = 0;
  while (offset < source.length) {
    while (/[\s/]/.test(source[offset] || "") && offset < source.length) offset++;
    const match = /^[^\s=/>]+/.exec(source.slice(offset));
    if (!match) { offset++; continue; }
    const name = match[0].toLowerCase();
    offset += match[0].length;
    while (/\s/.test(source[offset] || "") && offset < source.length) offset++;
    let value = "";
    if (source[offset] === "=") {
      offset++;
      while (/\s/.test(source[offset] || "") && offset < source.length) offset++;
      const quote = source[offset];
      if (quote === '"' || quote === "'") {
        const end = source.indexOf(quote, ++offset);
        value = source.slice(offset, end < 0 ? source.length : end);
        offset = end < 0 ? source.length : end + 1;
      } else {
        const unquoted = /^[^\s>]+/.exec(source.slice(offset));
        value = unquoted?.[0] || "";
        offset += value.length;
      }
    }
    // Browsers retain the first value when an attribute is repeated.
    if (!Object.hasOwn(result, name)) result[name] = decodeEntities(value);
  }
  return result;
}

const cleanText = value => decodeEntities(value).replace(/\s+/g, " ").trim();

/** Inspect SSR markup without treating comments or script/style text as HTML. */
export function parseHtml(html) {
  const result = { titles: [], descriptions: [], canonicals: [], robots: [], googlebot: [], h1Count: 0 };
  let offset = 0;
  while (offset < html.length) {
    const start = html.indexOf("<", offset);
    if (start < 0) break;
    if (html.startsWith("<!--", start)) {
      const end = html.indexOf("-->", start + 4);
      offset = end < 0 ? html.length : end + 3;
      continue;
    }
    let end = start + 1;
    let quote = "";
    for (; end < html.length; end++) {
      const char = html[end];
      if (quote) { if (char === quote) quote = ""; }
      else if (char === '"' || char === "'") quote = char;
      else if (char === ">") break;
    }
    offset = end + 1;
    const tag = /^<\s*([a-z][\w:-]*)(?=[\s/>])/i.exec(html.slice(start, end + 1));
    if (!tag) continue;
    const name = tag[1].toLowerCase();
    const attrs = attributes(html.slice(start + tag[0].length, end));
    if (["script", "style", "textarea", "title"].includes(name)) {
      const close = new RegExp(`</${name}\\s*>`, "gi");
      close.lastIndex = offset;
      const match = close.exec(html);
      if (name === "title") result.titles.push(cleanText(html.slice(offset, match?.index ?? html.length)));
      offset = match ? close.lastIndex : html.length;
      continue;
    }
    if (name === "h1") result.h1Count++;
    if (name === "link" && (attrs.rel || "").toLowerCase().split(/\s+/).includes("canonical")) result.canonicals.push((attrs.href || "").trim());
    if (name === "meta") {
      const metaName = (attrs.name || "").toLowerCase().trim();
      if (metaName === "description") result.descriptions.push(cleanText(attrs.content || ""));
      if (metaName === "robots" || metaName === "googlebot") result[metaName].push(attrs.content || "");
    }
  }
  return result;
}

function directives(page, xRobots = "") { return [...page.robots, ...page.googlebot, xRobots].join(","); }
export function hasNoindex(page, xRobots = "") {
  return /(?:^|[\s,:;])(?:noindex|none)(?=$|[\s,;])/i.test(directives(page, xRobots));
}
const critical = message => ({ severity: "critical", message });
const warning = message => ({ severity: "warning", message });

function matchesCanonical(value, expectedUrl) {
  try {
    // An absolute origin with or without its root slash is the same URL.
    const actual = new URL(value);
    const expected = new URL(expectedUrl);
    return actual.pathname === "/" && expected.pathname === "/" ? actual.href === expected.href : value === expectedUrl;
  } catch { return false; }
}

export function validatePublicPage({ status, html, xRobots = "", expectedUrl }) {
  const page = parseHtml(html);
  const issues = [];
  if (status !== 200) issues.push(critical(`Expected HTTP 200; received ${status}.`));
  if (hasNoindex(page, xRobots)) issues.push(critical("Indexing is blocked by a robots/googlebot meta tag or X-Robots-Tag (noindex/none)."));
  else if (/(?:^|[\s,:;])nofollow(?=$|[\s,;])/i.test(directives(page, xRobots))) issues.push(warning("A nofollow directive limits discovery through this page."));
  if (page.titles.length !== 1 || !page.titles[0]) issues.push(critical(`Expected one nonempty title; found ${page.titles.length}.`));
  if (page.descriptions.length !== 1 || !page.descriptions[0]) issues.push(warning(`Expected one nonempty meta description; found ${page.descriptions.length}.`));
  if (page.canonicals.length !== 1 || !matchesCanonical(page.canonicals[0], expectedUrl)) issues.push(critical(`Expected exactly one canonical equal to ${expectedUrl}; found ${page.canonicals.length}${page.canonicals.length === 1 ? " with a different URL" : ""}.`));
  if (page.h1Count !== 1) issues.push(warning(`Expected one H1; found ${page.h1Count}.`));
  return { page, issues };
}

export function parseRobots(text) {
  return text.split(/\r?\n/).flatMap(line => {
    const match = /^\s*sitemap\s*:\s*(\S+)\s*$/i.exec(line.replace(/#.*$/, ""));
    return match ? [match[1]] : [];
  });
}

export function validateRobots({ status, text, expectedSitemap }) {
  const issues = [];
  if (status !== 200) issues.push(critical(`Expected HTTP 200; received ${status}.`));
  if (!parseRobots(text).includes(expectedSitemap)) issues.push(critical(`robots.txt does not advertise ${expectedSitemap}.`));
  return issues;
}

export function validateSitemap({ status, text, origin, expectedUrls = [] }) {
  const issues = [];
  if (status !== 200) issues.push(critical(`Expected HTTP 200; received ${status}.`));
  const withoutComments = text.replace(/<!--[\s\S]*?-->/g, "");
  const urls = [...withoutComments.matchAll(/<(?:[\w-]+:)?loc(?:\s[^>]*)?>([\s\S]*?)<\/(?:[\w-]+:)?loc\s*>/gi)].map(match => decodeEntities(match[1].trim()));
  if (!/<(?:[\w-]+:)?urlset(?:\s|>)/i.test(withoutComments) || urls.length === 0) issues.push(critical("Sitemap must contain a nonempty urlset."));
  let invalid = 0;
  for (const value of urls) {
    try {
      const url = new URL(value);
      if (url.origin !== origin || url.username || url.password || url.search || url.hash || /^\/(?:admin|api)(?:\/|$)/i.test(url.pathname)) invalid++;
    } catch { invalid++; }
  }
  if (invalid) issues.push(critical(`Sitemap contains ${invalid} invalid, noncanonical-origin, private, or parameterized URL(s).`));
  if (new Set(urls).size !== urls.length) issues.push(critical("Sitemap contains duplicate URLs."));
  const absent = expectedUrls.filter(url => !urls.includes(url));
  if (absent.length) issues.push(critical(`Sitemap omits ${absent.length} audited public page(s).`));
  return { urls, issues };
}

export function validateNotFound({ status, html, xRobots = "", origin }) {
  const page = parseHtml(html);
  const issues = [];
  if (status !== 404) issues.push(critical(`A nonexistent page must return HTTP 404; received ${status}.`));
  if (!hasNoindex(page, xRobots)) issues.push(critical("The nonexistent page is missing noindex."));
  if (page.canonicals.some(value => {
    try { return new URL(value, origin).href === `${origin}/`; } catch { return false; }
  })) issues.push(critical("The nonexistent page incorrectly canonicalizes to the home page."));
  return issues;
}

export function validateRedirect({ status, location, sourceUrl, expectedUrl }) {
  let destination;
  try { destination = new URL(location, sourceUrl).href; } catch { /* Report the invalid/missing redirect below. */ }
  return [301, 308].includes(status) && location && destination === expectedUrl ? []
    : [warning(`Expected a single permanent redirect to ${expectedUrl}; received HTTP ${status}${location ? " with a different destination or redirect type" : " without a Location header"}.`)];
}

async function readBoundedBody(response) {
  if (Number(response.headers.get("content-length")) > MAX_BODY_BYTES) {
    await response.body?.cancel();
    throw new Error(`Response exceeds the ${MAX_BODY_BYTES}-byte body limit.`);
  }
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new Error(`Response exceeds the ${MAX_BODY_BYTES}-byte body limit.`);
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks, bytes).toString("utf8");
}

/** All requests are sequential GETs; redirects are inspected without following. */
export async function auditLiveSeo(value = DEFAULT_ORIGIN, { fetchImpl = fetch } = {}) {
  const origin = parseOrigin(value);
  const results = [];
  const seenTitles = new Map();
  const seenDescriptions = new Map();
  let requests = 0;
  async function get(url, readBody = true) {
    if (++requests > MAX_REQUESTS) throw new Error("Audit request limit exceeded.");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetchImpl(url, { method: "GET", redirect: "manual", signal: controller.signal, headers: { "User-Agent": "ElitaSeoAudit/1.0" } });
      const text = readBody ? await readBoundedBody(response) : "";
      if (!readBody) await response.body?.cancel();
      return { status: response.status, text, xRobots: response.headers.get("x-robots-tag") || "", location: response.headers.get("location") };
    } finally { clearTimeout(timer); }
  }
  async function check(label, action, severity = "critical") {
    try { results.push({ label, issues: await action() }); }
    catch (error) { results.push({ label, issues: [{ severity, message: error?.name === "AbortError" ? `Request exceeded ${REQUEST_TIMEOUT_MS} ms.` : `Request failed: ${error.message}` }] }); }
  }
  for (const path of PAGE_PATHS) {
    await check(path, async () => {
      const expectedUrl = new URL(path, origin).href;
      const response = await get(expectedUrl);
      const { page, issues } = validatePublicPage({ ...response, html: response.text, expectedUrl });
      for (const [field, seen] of [["titles", seenTitles], ["descriptions", seenDescriptions]]) {
        const text = page[field].length === 1 ? page[field][0].toLocaleLowerCase("fa-IR") : "";
        if (!text) continue;
        if (seen.has(text)) issues.push((field === "titles" ? critical : warning)(`The ${field === "titles" ? "title" : "meta description"} duplicates ${seen.get(text)}.`));
        else seen.set(text, path);
      }
      return issues;
    });
  }
  const expectedSitemap = `${origin}/sitemap.xml`;
  await check("/robots.txt", async () => validateRobots({ ...await get(`${origin}/robots.txt`), expectedSitemap }));
  await check("/sitemap.xml", async () => validateSitemap({ ...await get(expectedSitemap), origin, expectedUrls: PAGE_PATHS.map(path => new URL(path, origin).href) }).issues);
  await check("nonexistent page", async () => {
    const response = await get(`${origin}${missingPath}`);
    return validateNotFound({ ...response, html: response.text, origin });
  });
  const canonical = new URL(`${origin}/`);
  if (canonical.protocol === "https:") {
    const http = new URL(canonical);
    http.protocol = "http:";
    await check("HTTP redirect", async () => validateRedirect({ ...await get(http.href, false), sourceUrl: http.href, expectedUrl: canonical.href }), "warning");
    const alternate = new URL(canonical);
    alternate.hostname = canonical.hostname.startsWith("www.") ? canonical.hostname.slice(4) : `www.${canonical.hostname}`;
    await check("www redirect", async () => validateRedirect({ ...await get(alternate.href, false), sourceUrl: alternate.href, expectedUrl: canonical.href }), "warning");
  } else results.push({ label: "origin redirects", issues: [warning("Use an HTTPS origin to audit HTTP and www redirects.")] });
  return { origin, results, requests, criticalCount: results.flatMap(result => result.issues).filter(issue => issue.severity === "critical").length, warningCount: results.flatMap(result => result.issues).filter(issue => issue.severity === "warning").length };
}

async function main() {
  if (process.argv.length > 3 || process.argv[2] === "--help") {
    console.log("Usage: node scripts/check-live-seo.mjs [https://elitasocial.ir]");
    process.exitCode = process.argv[2] === "--help" ? 0 : 1;
    return;
  }
  try {
    const report = await auditLiveSeo(process.argv[2]);
    console.log(`Live SEO audit: ${report.origin}`);
    for (const { label, issues } of report.results) {
      if (!issues.length) console.log(`PASS ${label}`);
      for (const issue of issues) console.log(`${issue.severity === "critical" ? "FAIL" : "WARN"} ${label}: ${issue.message}`);
    }
    console.log(`${report.criticalCount} critical issue(s), ${report.warningCount} warning(s), ${report.requests}/${MAX_REQUESTS} bounded public GETs.`);
    process.exitCode = report.criticalCount ? 1 : 0;
  } catch (error) {
    console.error(`SEO audit failed: ${error.message}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
