import type { CmsCollection } from "./cms-shared";

export type EditorOption = { value: string; label: string };
export type EditorField = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "lines" | "number" | "select" | "checkbox";
  required?: boolean;
  hint?: string;
  options?: EditorOption[];
};

export const categoryOptions: EditorOption[] = [
  { value: "instagram", label: "مدیریت اینستاگرام" },
  { value: "website", label: "طراحی وب‌سایت" },
  { value: "content", label: "تولید محتوا" },
  { value: "seo", label: "سئو و نگهداری" },
];
export const planCategoryOptions = [categoryOptions[0], categoryOptions[1], { value: "support", label: "سئو و پشتیبانی" }];

const slug: EditorField = { key: "slug", label: "نشانی کوتاه", required: true, hint: "فقط حروف کوچک انگلیسی، عدد و خط تیره؛ مثل content-calendar. تغییر این نشانی، لینک قبلی را تغییر می‌دهد." };
const mock: EditorField = { key: "isMock", label: "این محتوا نمایشی است", type: "checkbox", hint: "پس از تأیید محتوای واقعی، این گزینه را بردار." };

export const editorFields: Record<CmsCollection, EditorField[]> = {
  articles: [
    { key: "title", label: "عنوان مقاله", required: true }, slug,
    { key: "category", label: "دسته‌بندی", type: "select", options: categoryOptions, required: true },
    { key: "excerpt", label: "خلاصهٔ مقاله", type: "textarea", required: true },
    { key: "author", label: "نام نویسنده", required: true },
    { key: "readingMinutes", label: "زمان مطالعه (دقیقه)", type: "number", required: true },
    { key: "tags", label: "برچسب‌ها", type: "lines", hint: "هر برچسب را در یک خط بنویس." },
    { key: "takeaway", label: "جمع‌بندی مقاله", type: "textarea", required: true },
    { key: "featured", label: "مقالهٔ منتخب", type: "checkbox" }, mock,
  ],
  services: [
    { key: "title", label: "عنوان کامل خدمت", required: true },
    { key: "slug", label: "نشانی خدمت", type: "select", required: true, options: categoryOptions, hint: "برای هر خدمت یک صفحه وجود دارد. برای اصلاح اطلاعات، همان خدمت را ویرایش کن." },
    { key: "shortTitle", label: "عنوان کوتاه", required: true },
    { key: "headline", label: "تیتر معرفی", required: true },
    { key: "intro", label: "معرفی کوتاه", type: "textarea", required: true },
    { key: "description", label: "توضیح خدمت", type: "textarea", required: true },
    { key: "audience", label: "مناسب چه کسانی است؟", type: "textarea", required: true },
    { key: "theme", label: "رنگ بخش معرفی", type: "select", options: [
      { value: "pink", label: "صورتی" }, { value: "lilac", label: "بنفش روشن" }, { value: "yellow", label: "زرد" }, { value: "mint", label: "سبز نعنایی" },
    ] },
    { key: "pricingCategory", label: "پلن‌های مرتبط", type: "select", options: [{ value: "", label: "بدون پلن مرتبط" }, ...planCategoryOptions] },
    { key: "pricingLabel", label: "متن دکمهٔ مشاوره یا پلن", required: true },
  ],
  portfolio: [
    { key: "title", label: "عنوان پروژه", required: true },
    { ...slug, key: "id" },
    { key: "category", label: "دسته‌بندی", type: "select", options: categoryOptions, required: true },
    { key: "discipline", label: "نوع همکاری", required: true },
    { key: "brand", label: "نام برند", required: true },
    { key: "headline", label: "تیتر پروژه", required: true },
    { key: "caption", label: "توضیح کوتاه", type: "textarea", required: true },
    { key: "description", label: "شرح پروژه", type: "textarea", required: true },
    { key: "theme", label: "قالب پیش‌نمایش", type: "select", options: [
      { value: "botanical", label: "گیاه و طبیعت" }, { value: "cafe", label: "کافه" }, { value: "jewelry", label: "زیورآلات" }, { value: "beauty", label: "زیبایی" },
      { value: "studio", label: "استودیوی طراحی" }, { value: "travel", label: "سفر" }, { value: "interior", label: "معماری" }, { value: "wellness", label: "سبک زندگی" },
    ] },
    { key: "deliverables", label: "خروجی‌های پروژه", type: "lines", required: true, hint: "هر خروجی در یک خط." }, mock,
  ],
  plans: [
    { key: "name", label: "نام پلن", required: true }, { ...slug, key: "id" },
    { key: "categoryId", label: "گروه پلن", type: "select", options: planCategoryOptions, required: true },
    { key: "description", label: "توضیح پلن", type: "textarea", required: true },
    { key: "price", label: "قیمت", type: "number", required: true, hint: "مبلغ را بدون جداکننده وارد کن." },
    { key: "currency", label: "واحد پول", type: "select", options: [{ value: "تومان", label: "تومان" }, { value: "ریال", label: "ریال" }], required: true },
    { key: "period", label: "دورهٔ پرداخت", required: true, hint: "مثلاً ماهانه یا پروژه‌ای" },
    { key: "features", label: "امکانات پلن", type: "lines", required: true, hint: "هر امکان در یک خط." },
    { key: "recommended", label: "پلن پیشنهادی", type: "checkbox" }, mock,
  ],
};

export function createEditorData(collection: CmsCollection): Record<string, unknown> {
  const base: Record<string, unknown> = collection === "services" ? {} : { isMock: true };
  for (const field of editorFields[collection]) {
    if (field.key in base) continue;
    base[field.key] = field.type === "checkbox" ? false : field.type === "number" ? 0 : field.type === "lines" ? [] : field.type === "select" ? field.options?.[0]?.value ?? "" : "";
  }
  if (collection === "articles") Object.assign(base, { author: "تحریریهٔ الیتا", readingMinutes: 4, image: { src: "/images/social-marketing.webp", alt: "" }, sections: [{ id: "introduction", heading: "", paragraphs: [], bullets: [] }] });
  if (collection === "services") Object.assign(base, { image: { src: "/images/social-marketing.webp", alt: "" }, pricingCategory: null, deliverables: [], steps: [], faqs: [] });
  if (collection === "plans") Object.assign(base, { currency: "تومان", period: "ماهانه" });
  return base;
}

export function recordTitle(data: Record<string, unknown>) {
  return String(data.title || data.name || "بدون عنوان");
}

export function publicRecordPath(collection: CmsCollection, data: Record<string, unknown>) {
  if (collection === "articles") return `/blog/${encodeURIComponent(String(data.slug))}/`;
  if (collection === "services") return `/services/${encodeURIComponent(String(data.slug))}/`;
  if (collection === "portfolio") return "/portfolio/";
  return "/#pricing";
}
