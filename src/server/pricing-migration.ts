import "server-only";
import { randomUUID } from "node:crypto";
import { pricingContent } from "@/content/pricing";
import { getDatabase } from "./database";

/** Add newly introduced categories once; never refill deleted/draft categories. */
export function ensurePricingCategories() {
  const db = getDatabase();
  const complete = () => db.prepare("SELECT value FROM cms_meta WHERE key='pricing_categories_v2'").get();
  if (complete() || !db.prepare("SELECT value FROM cms_meta WHERE key='starter_seed'").get()) return;
  db.exec("BEGIN IMMEDIATE");
  try {
    if (!complete()) {
      const now = new Date().toISOString();
      const insert = db.prepare("INSERT OR IGNORE INTO cms_records(id,collection,status,content_key,data,revision,created_at,updated_at) VALUES(?,'plans','published',?,?,1,?,?)");
      for (const category of pricingContent.categories.filter(item => ["seo", "redesign", "content"].includes(item.id))) {
        const existing = db.prepare("SELECT 1 FROM cms_records WHERE collection='plans' AND json_extract(data,'$.categoryId')=? LIMIT 1").get(category.id);
        if (existing) continue; // Respect customized and draft records, too.
        for (const plan of category.plans) insert.run(randomUUID(), plan.id, JSON.stringify({ ...plan, categoryId: category.id }), now, now);
      }
      for (const row of db.prepare("SELECT id,data FROM cms_records WHERE collection='services'").all()) {
        const data = JSON.parse(String(row.data)) as Record<string, unknown>;
        const target = data.slug === "seo" && data.pricingCategory === "support" ? "seo"
          : data.slug === "content" && data.pricingCategory === null ? "content" : null;
        if (!target) continue;
        const label = target === "seo" ? "دیدن پلن‌های سئو" : "دیدن پلن‌های تولید محتوا";
        const oldLabel = target === "seo" ? "دیدن پلن‌های پشتیبانی سایت" : "مشاوره برای سفارش محتوا";
        db.prepare("UPDATE cms_records SET data=?,revision=revision+1,updated_at=? WHERE id=?").run(JSON.stringify({ ...data, pricingCategory: target, pricingLabel: data.pricingLabel === oldLabel ? label : data.pricingLabel }), now, String(row.id));
      }
      db.prepare("INSERT INTO cms_meta(key,value) VALUES('pricing_categories_v2',?)").run(now);
    }
    db.exec("COMMIT");
  } catch (error) { db.exec("ROLLBACK"); throw error; }
}
