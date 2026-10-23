import "server-only";
import { getDefaultSiteSettings, normalizeSiteSettings, type CmsSiteSettings, type SiteSettings } from "@/lib/site-settings";
import { getDatabase } from "./database";
import { CmsError } from "./errors";
import { object, revision, text } from "./validation";

const fail = (field: string): never => { throw new CmsError(400, `مقدار «${field}» معتبر نیست.`); };
const immutableKeys = new Set(["id", "theme", "icon", "width", "height", "href"]);

function imageSource(value: unknown, field: string): string {
  const source = text(value, field, 220);
  const base = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");
  const local = base && source.startsWith(`${base}/`) ? source.slice(base.length) : source;
  if (!/^\/images\/[a-zA-Z0-9][a-zA-Z0-9._-]*\.(?:webp|png|jpe?g|gif)$/.test(local)
    && !/^\/api\/cms\/files\/[a-f0-9-]+\.(?:webp|png|jpg|gif)$/.test(local)) return fail(field);
  return local;
}

function contactValue(value: unknown, key: string, field: string): string {
  const supplied = text(value, field, 220);
  const result = key === "instagram" ? supplied.replace(/^https:\/\/instagram\.com\//, "https://www.instagram.com/") : supplied;
  const patterns: Record<string, RegExp> = {
    phone: /^tel:\+[1-9]\d{7,14}$/,
    whatsapp: /^https:\/\/wa\.me\/[1-9]\d{7,14}\/?$/,
    instagram: /^https:\/\/www\.instagram\.com\/[A-Za-z0-9._]{1,30}\/?$/,
    telegram: /^https:\/\/t\.me\/[A-Za-z0-9_]{1,100}\/?$/,
  };
  if (!patterns[key].test(result)) return fail(field);
  return result;
}

/** The default shape is the whitelist; links, layout choices and collection data stay immutable. */
function cleanValue(value: unknown, template: unknown, path: string): unknown {
  const key = path.split(".").at(-1) || "";
  if (path === "home.navigation" || path === "home.services.items" || immutableKeys.has(key)) return structuredClone(template);
  if (path === "faqs") {
    if (!Array.isArray(value) || value.length > 30) return fail("پرسش‌های عمومی");
    return value.map((entry, index) => {
      const faq = object(entry, `پرسش ${index + 1}`);
      return { question: text(faq.question, "پرسش", 500), answer: text(faq.answer, "پاسخ", 5000) };
    });
  }
  if (typeof template === "string") {
    if (path.startsWith("home.contact.") && ["phone", "whatsapp", "instagram", "telegram"].includes(key)) return contactValue(value, key, path);
    if (key === "src") return imageSource(value, path);
    const required = /(?:title|label|name|owner|eyebrow|caption|alt)$/i.test(key) || path.startsWith("seo.");
    const maximum = key === "alt" ? 350 : /(?:title|label|name|owner|eyebrow|caption)$/i.test(key) ? 500 : 5000;
    const result = text(value, path, maximum, required ? 1 : 0);
    if (/[\u007f-\u009f]/u.test(result)) return fail(path);
    return result;
  }
  if (Array.isArray(template)) {
    if (!Array.isArray(value)) return fail(path);
    if (template.every(item => typeof item === "string")) {
      if (value.length < 1 || value.length > 4) return fail(path);
      return value.map((entry, index) => text(entry, `${path}.${index}`, 500));
    }
    // Fixed slots match the site's existing composition (hero, values, and benefits).
    if (value.length !== template.length) return fail(path);
    return template.map((entry, index) => cleanValue(value[index], entry, `${path}.${index}`));
  }
  if (template !== null && typeof template === "object") {
    const source = object(value, path);
    const clean: Record<string, unknown> = {};
    for (const [field, entry] of Object.entries(template)) clean[field] = cleanValue(source[field], entry, path ? `${path}.${field}` : field);
    return clean;
  }
  return structuredClone(template);
}

function validateSiteSettings(value: unknown): SiteSettings {
  const data = object(value, "تنظیمات سایت");
  if (JSON.stringify(data).length > 150_000) throw new CmsError(413, "حجم تنظیمات بیش از حد مجاز است.");
  return normalizeSiteSettings(cleanValue(data, getDefaultSiteSettings(), "") as SiteSettings);
}

function snapshot(row: Record<string, unknown>): CmsSiteSettings {
  return { data: normalizeSiteSettings(JSON.parse(String(row.data)) as SiteSettings), revision: Number(row.revision), updatedAt: String(row.updated_at) };
}

export function readSiteSettings(): CmsSiteSettings {
  const db = getDatabase();
  const existing = db.prepare("SELECT data,revision,updated_at FROM cms_settings WHERE id='site'").get();
  if (existing) return snapshot(existing);
  // A singleton is seeded independently of starter records, never replacing saved settings.
  db.prepare("INSERT OR IGNORE INTO cms_settings(id,data,revision,updated_at) VALUES('site',?,1,?)")
    .run(JSON.stringify(normalizeSiteSettings(getDefaultSiteSettings())), new Date().toISOString());
  return snapshot(db.prepare("SELECT data,revision,updated_at FROM cms_settings WHERE id='site'").get()!);
}

export function saveSiteSettings(value: unknown, expectedRevision: number): CmsSiteSettings {
  const expected = revision(expectedRevision);
  const data = validateSiteSettings(value);
  readSiteSettings();
  const db = getDatabase();
  db.exec("BEGIN IMMEDIATE");
  try {
    const existing = db.prepare("SELECT revision FROM cms_settings WHERE id='site'").get()!;
    if (Number(existing.revision) !== expected) throw new CmsError(409, "تنظیمات در جای دیگری تغییر کرده است؛ نسخهٔ تازه را دریافت کنید و تغییرات را دوباره اعمال کنید.");
    db.prepare("UPDATE cms_settings SET data=?,revision=revision+1,updated_at=? WHERE id='site'")
      .run(JSON.stringify(data), new Date().toISOString());
    const saved = snapshot(db.prepare("SELECT data,revision,updated_at FROM cms_settings WHERE id='site'").get()!);
    db.exec("COMMIT");
    return saved;
  } catch (error) { db.exec("ROLLBACK"); throw error; }
}
