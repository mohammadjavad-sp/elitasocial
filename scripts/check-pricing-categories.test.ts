/** Run with: node --conditions=react-server --import tsx --test scripts/check-pricing-categories.test.ts */
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { pricingContent } from "../src/content/pricing";
import { pricingCategoryIds, pricingCategoryLabels, pricingCategoryServices } from "../src/lib/pricing-categories";
import { planContactHref, readServiceSelection } from "../src/lib/service-selection";
import { getStarterSeed } from "../src/server/seed";

process.env.CMS_DATA_DIR = mkdtempSync(path.join(os.tmpdir(), "elita-pricing-v2-"));
process.env.DEPLOY_TARGET = "node";

test("six ordered categories provide three sample plans and preserve the first two category prices", () => {
  assert.deepEqual(pricingContent.categories.map(category => category.id), pricingCategoryIds);
  assert.deepEqual(pricingContent.categories.map(category => category.label), pricingCategoryIds.map(id => pricingCategoryLabels[id]));
  assert.deepEqual(pricingContent.categories.slice(0, 2).map(category => category.plans.map(plan => plan.price)), [[4900000, 7900000, 11900000], [19000000, 29000000, 45000000]]);
  for (const category of pricingContent.categories) {
    assert.equal(category.plans.length, 3);
    for (const plan of category.plans) {
      const href = new URL(planContactHref(category.id, plan.id), "https://example.test");
      const selected = readServiceSelection(href.search);
      assert.equal(selected.selectedPlan?.plan.id, plan.id);
      assert.equal(selected.selectedPlan?.categoryId, category.id);
      assert.equal(selected.selectedPlan?.categoryLabel, category.label);
    }
  }
});

test("existing CMS receives only new categories once, keeping edits, drafts and later deletions intact", async () => {
  const { ensureSeed, getDatabase, listRecords, saveRecord, deleteRecord } = await import("../src/server/database");
  const { ensurePricingCategories } = await import("../src/server/pricing-migration");
  const { validateRecord } = await import("../src/server/validation");
  const { submitConsultation } = await import("../src/server/consultations");
  const oldSeed = getStarterSeed().filter(item => item.collection !== "plans" || ["instagram", "website", "support"].includes(String(item.data.categoryId)));
  ensureSeed(oldSeed);
  const oldPlans = listRecords("plans");
  const custom = oldPlans.find(record => record.data.categoryId === "website")!;
  saveRecord("plans", { ...custom.data, name: "نام اختصاصی مالک", price: 12345678 }, "published", custom.id, custom.revision);
  const before = listRecords("plans");
  // An owner-created draft in a new category must not gain published fallbacks.
  const content = pricingContent.categories.find(category => category.id === "content")!.plans[0];
  saveRecord("plans", { ...content, id: "owner-content", categoryId: "content" }, "draft");
  const seoService = listRecords("services").find(record => record.data.slug === "seo")!;
  saveRecord("services", { ...seoService.data, pricingCategory: "support", pricingLabel: "متن اختصاصی", description: "توضیح اختصاصی مالک" }, "published", seoService.id, seoService.revision);
  ensurePricingCategories();
  for (const previous of before) assert.deepEqual(listRecords("plans").find(record => record.id === previous.id), previous);
  assert.equal(listRecords("plans").filter(record => record.data.categoryId === "seo").length, 3);
  assert.equal(listRecords("plans").filter(record => record.data.categoryId === "redesign").length, 3);
  assert.equal(listRecords("plans", true).filter(record => record.data.categoryId === "content").length, 0);
  const changedService = listRecords("services").find(record => record.id === seoService.id)!;
  assert.equal(changedService.data.pricingCategory, "seo");
  assert.equal(changedService.data.pricingLabel, "متن اختصاصی");
  assert.equal(changedService.data.description, "توضیح اختصاصی مالک");
  for (const categoryId of pricingCategoryIds) {
    const plan = pricingContent.categories.find(category => category.id === categoryId)!.plans[0];
    assert.equal(validateRecord("plans", { ...plan, categoryId }).categoryId, categoryId);
    const record = listRecords("plans").find(record => record.data.categoryId === categoryId)!;
    if (record.status === "draft") saveRecord("plans", record.data, "published", record.id, record.revision);
    const result = submitConsultation({ name: "Pricing QA", contact: `${categoryId}@example.test`, service: pricingCategoryServices[categoryId], message: "Testing category and selected plan context", plan: { id: record.data.id, categoryId }, website: "", requestId: randomUUID() }, new Request("https://example.test/api/cms/consultations", { method: "POST" }));
    const saved = getDatabase().prepare("SELECT plan FROM cms_consultations WHERE reference=?").get(result.reference)!;
    assert.equal(JSON.parse(String(saved.plan)).categoryId, categoryId);
    assert.equal(JSON.parse(String(saved.plan)).categoryLabel, pricingCategoryLabels[categoryId]);
  }
  const removed = listRecords("plans").find(record => record.data.categoryId === "seo")!;
  deleteRecord("plans", removed.id, removed.revision);
  ensurePricingCategories();
  assert.equal(listRecords("plans").filter(record => record.data.categoryId === "seo").length, 2);
  assert.equal(listRecords("plans").filter(record => record.data.categoryId === "content").length, 1);
  getDatabase().close();
});
