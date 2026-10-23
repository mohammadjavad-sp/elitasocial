import type { CmsCollection, CmsStatus } from "@/lib/cms-shared";
import { CmsError } from "./errors";

const categories = ["instagram", "website", "content", "seo"];
const planCategories = ["instagram", "website", "support"];
const fail = (field: string): never => { throw new CmsError(400, `مقدار «${field}» معتبر نیست.`); };
export function object(value: unknown, field = "داده"): Record<string, unknown> { if (!value || typeof value !== "object" || Array.isArray(value)) return fail(field); return value as Record<string, unknown>; }
export function text(value: unknown, field: string, max = 1000, min = 1): string {
  if (typeof value !== "string") return fail(field);
  const result = value.trim();
  if (result.length < min || result.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(result)) return fail(field);
  return result;
}
function choice(value: unknown, options: readonly string[], field: string) { return typeof value === "string" && options.includes(value) ? value : fail(field); }
function bool(value: unknown, field: string, fallback = false) { return value === undefined ? fallback : typeof value === "boolean" ? value : fail(field); }
function list<T>(value: unknown, field: string, parser: (value: unknown, index: number) => T, max = 40, min = 0): T[] {
  if (!Array.isArray(value) || value.length < min || value.length > max) return fail(field);
  return value.map(parser);
}
function stringList(value: unknown, field: string, max = 40, min = 0, length = 2000) { return list(value, field, item => text(item, field, length), max, min); }
function slug(value: unknown, field: string) { const result = text(value, field, 100); return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(result) ? result : fail(field); }
function image(value: unknown) {
  const item = object(value, "تصویر");
  const src = text(item.src, "نشانی تصویر", 220);
  // Only this site's original assets or uploaded, non-executable raster images.
  const base = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");
  const local = base && src.startsWith(`${base}/`) ? src.slice(base.length) : src;
  if (!/^\/images\/[a-zA-Z0-9][a-zA-Z0-9._-]*\.(?:webp|png|jpe?g|gif)$/.test(local) && !/^\/api\/cms\/files\/[a-f0-9-]+\.(?:webp|png|jpg|gif)$/.test(local)) return fail("نشانی تصویر");
  return { src: local, alt: text(item.alt, "توضیح تصویر", 350) };
}
function titleDescription(value: unknown) { const item = object(value); return { title: text(item.title, "عنوان", 180), description: text(item.description, "توضیح", 3000) }; }

export function collection(value: unknown): CmsCollection { return choice(value, ["articles", "services", "portfolio", "plans"], "مجموعه") as CmsCollection; }
export function status(value: unknown): CmsStatus { return choice(value, ["draft", "published"], "وضعیت") as CmsStatus; }
export function revision(value: unknown): number { return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : fail("نسخه"); }

/** Whitelist each field; arbitrary HTML, nested payloads and external image URLs are never stored. */
export function validateRecord(kind: CmsCollection, value: unknown): Record<string, unknown> {
  const d = object(value);
  if (JSON.stringify(d).length > 200_000) throw new CmsError(413, "حجم محتوا بیش از حد مجاز است.");
  if (kind === "articles") {
    if (d.slug === "category") return fail("نشانی رزروشده مقاله");
    const sections = list(d.sections, "بخش‌های مقاله", value => { const section = object(value); return { id: slug(section.id, "شناسه بخش"), heading: text(section.heading, "عنوان بخش", 220), paragraphs: stringList(section.paragraphs, "پاراگراف", 30, 1, 12_000), ...(section.bullets === undefined ? {} : { bullets: stringList(section.bullets, "فهرست", 30, 0, 3000) }) }; }, 50, 1);
    if (new Set(sections.map(item => item.id)).size !== sections.length) return fail("شناسه‌های تکراری بخش‌ها");
    const minutes = d.readingMinutes;
    if (typeof minutes !== "number" || !Number.isSafeInteger(minutes) || minutes < 1 || minutes > 240) return fail("زمان مطالعه");
    return { slug: slug(d.slug, "نشانی مقاله"), title: text(d.title, "عنوان", 220), excerpt: text(d.excerpt, "خلاصه", 1200), category: choice(d.category, categories, "دسته"), image: image(d.image), readingMinutes: minutes, author: text(d.author, "نویسنده", 150), tags: stringList(d.tags, "برچسب", 20, 0, 80), sections, takeaway: text(d.takeaway, "نکته پایانی", 3000), featured: bool(d.featured, "ویژه"), isMock: bool(d.isMock, "نمایشی") };
  }
  if (kind === "services") {
    return { slug: choice(d.slug, categories, "نشانی خدمت"), title: text(d.title, "عنوان", 220), shortTitle: text(d.shortTitle, "عنوان کوتاه", 120), headline: text(d.headline, "تیتر", 300), intro: text(d.intro, "مقدمه", 2000), description: text(d.description, "توضیح", 5000), audience: text(d.audience, "مخاطب", 3000), theme: choice(d.theme, ["pink", "lilac", "yellow", "mint"], "رنگ"), image: image(d.image), deliverables: list(d.deliverables, "خروجی‌ها", titleDescription, 20, 1), steps: list(d.steps, "مراحل", titleDescription, 15, 1), faqs: list(d.faqs, "پرسش‌ها", value => { const faq = object(value); return { question: text(faq.question, "پرسش", 500), answer: text(faq.answer, "پاسخ", 5000) }; }, 30), pricingCategory: d.pricingCategory === null ? null : choice(d.pricingCategory, planCategories, "دسته پلن"), pricingLabel: text(d.pricingLabel, "عنوان پلن", 180) };
  }
  if (kind === "portfolio") {
    return { id: slug(d.id, "شناسه نمونه‌کار"), title: text(d.title, "عنوان", 220), category: choice(d.category, categories, "دسته"), discipline: text(d.discipline, "نوع همکاری", 300), theme: choice(d.theme, ["botanical", "cafe", "jewelry", "beauty", "studio", "travel", "interior", "wellness"], "قالب"), brand: text(d.brand, "برند", 120), headline: text(d.headline, "تیتر", 300), caption: text(d.caption, "خلاصه", 1000), description: text(d.description, "توضیح", 7000), deliverables: stringList(d.deliverables, "خروجی‌ها", 30, 1), isMock: bool(d.isMock, "نمایشی", true), ...(d.image === undefined || d.image === null ? {} : { image: image(d.image) }) };
  }
  const price = d.price;
  if (typeof price !== "number" || !Number.isFinite(price) || price < 0 || price > 1_000_000_000_000 || !Number.isSafeInteger(price)) return fail("قیمت");
  return { id: slug(d.id, "شناسه پلن"), categoryId: choice(d.categoryId, planCategories, "دسته پلن"), name: text(d.name, "نام پلن", 180), description: text(d.description, "توضیح", 2000), price, currency: choice(d.currency, ["تومان", "ریال"], "واحد پول"), period: text(d.period, "دوره", 100), features: stringList(d.features, "امکانات", 40, 1), recommended: bool(d.recommended, "پیشنهادی"), isMock: bool(d.isMock, "نمایشی") };
}
