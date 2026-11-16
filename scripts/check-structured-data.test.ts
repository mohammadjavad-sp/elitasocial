import assert from "node:assert/strict";
import test from "node:test";
import { articles } from "../src/content/articles";
import { services } from "../src/content/services";
import { getDefaultSiteSettings } from "../src/lib/site-settings";
import { articleStructuredData, brandStructuredData, breadcrumbStructuredData, serializeStructuredData } from "../src/lib/structured-data";
import { publicServiceCopy } from "../src/lib/public-content-copy";

const env = { NODE_ENV: "production", SITE_URL: "https://elita.example.com", SITE_INDEXING: "true" };

test("brand graph uses public settings without invented business claims", () => {
  const settings = getDefaultSiteSettings();
  settings.home.brand.name = "Edited brand";
  settings.home.contact.instagram = "";
  const graph = brandStructuredData(settings, env)["@graph"];
  const organization = graph.find(node => "logo" in node);
  assert.ok(organization);
  assert.equal(organization.name, "Edited brand");
  assert.equal(organization.url, "https://elita.example.com/");
  assert.ok(organization.logo.startsWith("https://elita.example.com/"));
  assert.equal(organization.sameAs?.includes(""), false);
  const json = JSON.stringify(graph);
  for (const field of ["aggregateRating", "address", "foundingDate", "SearchAction"]) assert.equal(json.includes(field), false);
});

test("article matches editorial content and canonical without invented dates", () => {
  const article = { ...articles[0], title: 'Edited </script><script>alert(1)</script> \u2028 heading' };
  const schema = articleStructuredData(article, getDefaultSiteSettings(), env);
  assert.equal(schema.headline, article.title);
  assert.equal(schema.author.name, article.author);
  assert.equal(schema.mainEntityOfPage["@id"], schema.url);
  assert.equal(Object.hasOwn(schema, "datePublished"), false);
  assert.equal(Object.hasOwn(schema, "dateModified"), false);
  const serialized = serializeStructuredData(schema);
  assert.equal(serialized.includes("<"), false);
  assert.deepEqual(JSON.parse(serialized), schema);
});

test("breadcrumbs share canonical prefix, slash and query rules", () => {
  const schema = breadcrumbStructuredData([{ name: "Home", path: "/" }, { name: "Service", path: "/services/website/?utm_source=test#contact" }], { ...env, NEXT_PUBLIC_BASE_PATH: "/site" });
  assert.deepEqual(schema.itemListElement.map(item => [item.position, item.item]), [[1, "https://elita.example.com/site/"], [2, "https://elita.example.com/site/services/website"]]);
});

test("service search copy upgrades initial text and preserves owner changes without mutation", () => {
  for (const slug of ["website", "instagram"] as const) {
    const original = structuredClone(services.find(service => service.slug === slug)!);
    const snapshot = structuredClone(original);
    assert.notEqual(publicServiceCopy(original).title, original.title);
    assert.deepEqual(original, snapshot);
    const custom = { ...original, title: "Owner title", headline: "Owner heading", intro: "Owner introduction" };
    assert.deepEqual(publicServiceCopy(custom), custom);
    const partlyEdited = publicServiceCopy({ ...original, intro: "Owner introduction" });
    assert.equal(partlyEdited.intro, "Owner introduction");
    assert.notEqual(partlyEdited.title, original.title);
  }
});
