import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

// All persistence checks use a disposable database, never the site's actual data.
process.env.CMS_DATA_DIR = mkdtempSync(path.join(os.tmpdir(), "elita-settings-retirement-"));
process.env.DEPLOY_TARGET = "node";
process.env.NEXT_PUBLIC_BASE_PATH = "";

test("retired home settings disappear without resetting current content or bypassing revisions", async t => {
  const { getDefaultSiteSettings, normalizeSiteSettings } = await import("../src/lib/site-settings");
  const { getDatabase, mediaIsReferenced } = await import("../src/server/database");
  const { readSiteSettings, saveSiteSettings } = await import("../src/server/site-settings");
  const db = getDatabase();
  const current = getDefaultSiteSettings();
  current.home.hero.title = ["عنوان اختصاصی مالک"];
  current.seo.description = "توضیح اختصاصی برای حفظ تنظیمات موجود";
  current.faqs = [{ question: "پرسش اختصاصی", answer: "پاسخ اختصاصی مالک" }];
  const legacy = {
    ...current,
    sections: { ...current.sections, contactTitle: ["Retired form"], contactDescription: "Retired", contactInfoTitle: "Retired", contactInfoDescription: "Retired", contactFormTitle: "Retired", contactFormDescription: "Retired" },
    home: {
      ...current.home,
      benefits: { title: ["Retired fixture"], items: [{ image: { src: "/api/cms/files/old-fixture.webp" } }] },
    },
  };
  db.prepare("INSERT INTO cms_settings(id,data,revision,updated_at) VALUES('site',?,7,?)")
    .run(JSON.stringify(legacy), "2020-01-01T00:00:00.000Z");

  try {
    await t.test("normalization drops obsolete data and preserves owner edits without mutating input", () => {
      const copy = structuredClone(legacy);
      assert.equal(Object.hasOwn(getDefaultSiteSettings().home, "benefits"), false);
      assert.equal(Object.hasOwn(normalizeSiteSettings(legacy).home, "benefits"), false);
      assert.deepEqual(normalizeSiteSettings(legacy).home.hero.title, current.home.hero.title);
      assert.deepEqual(legacy, copy);
    });

    assert.equal(mediaIsReferenced("/api/cms/files/old-fixture.webp"), true);
    let snapshot = readSiteSettings();
    await t.test("first read removes only the obsolete JSON property and increments the revision once", () => {
      const row = db.prepare("SELECT data,revision,updated_at FROM cms_settings WHERE id='site'").get()!;
      assert.deepEqual(JSON.parse(String(row.data)), current);
      assert.equal(row.revision, 8);
      assert.notEqual(row.updated_at, "2020-01-01T00:00:00.000Z");
      assert.equal(snapshot.revision, 8);
      assert.equal(Object.hasOwn(snapshot.data.home, "benefits"), false);
      assert.equal(Object.hasOwn(snapshot.data.sections, "contactFormTitle"), false);
      assert.equal(snapshot.data.footer.contactTitle, current.footer.contactTitle);
      assert.deepEqual(snapshot.data.home.hero.title, current.home.hero.title);
      assert.deepEqual(snapshot.data.faqs, current.faqs);
      assert.equal(mediaIsReferenced("/api/cms/files/old-fixture.webp"), false);
      assert.equal(mediaIsReferenced(current.home.hero.portrait.src), true);
    });

    await t.test("subsequent reads are idempotent", () => {
      const before = db.prepare("SELECT data,revision,updated_at FROM cms_settings WHERE id='site'").get();
      readSiteSettings();
      readSiteSettings();
      assert.deepEqual(db.prepare("SELECT data,revision,updated_at FROM cms_settings WHERE id='site'").get(), before);
    });

    await t.test("a stale editor cannot overwrite migrated settings", () => {
      assert.throws(() => saveSiteSettings(current, 7), error => error instanceof Error && "status" in error && error.status === 409);
      assert.equal(readSiteSettings().revision, 8);
    });

    await t.test("saving a payload from an older client cannot restore the removed section", () => {
      snapshot = saveSiteSettings({ ...legacy, seo: { ...current.seo, description: "توضیح تازه و معتبر مالک" } }, snapshot.revision);
      assert.equal(snapshot.revision, 9);
      assert.equal(Object.hasOwn(snapshot.data.home, "benefits"), false);
      const saved = JSON.parse(String(db.prepare("SELECT data FROM cms_settings WHERE id='site'").get()!.data));
      assert.equal(Object.hasOwn(saved.home, "benefits"), false);
      assert.equal(Object.hasOwn(saved.sections, "contactFormTitle"), false);
      assert.equal(saved.seo.description, "توضیح تازه و معتبر مالک");
      assert.deepEqual(saved.home.hero.title, current.home.hero.title);
      assert.deepEqual(saved.faqs, current.faqs);
    });

    await t.test("form-only legacy settings are pruned even when the earlier section was already removed", () => {
      db.prepare("UPDATE cms_settings SET data=?,revision=20 WHERE id='site'").run(JSON.stringify({ ...current, sections: legacy.sections }));
      const upgraded = readSiteSettings();
      assert.equal(upgraded.revision, 21);
      assert.deepEqual(JSON.parse(String(db.prepare("SELECT data FROM cms_settings WHERE id='site'").get()!.data)), current);
      assert.equal(upgraded.data.footer.contactTitle, current.footer.contactTitle);
    });
  } finally {
    db.close();
  }
});
