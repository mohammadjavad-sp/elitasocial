"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { CmsMedia } from "../../lib/cms-shared";
import type { CmsSiteSettings, SiteSettings } from "../../lib/site-settings";
import { sitePath } from "../../lib/site-path";
import type { CmsRequest } from "./record-editor";

type Group = "identity" | "hero" | "about" | "approach" | "benefits" | "sections" | "footer" | "faqs" | "seo";
type FieldSpec = { path: string; label: string; multiline?: boolean; lines?: boolean; hint?: string; ltr?: boolean; maxLength?: number };
const groups: { id: Group; label: string; description: string }[] = [
  { id: "identity", label: "برند و ارتباط", description: "نام برند و راه‌های ارتباطی در بخش‌های مختلف سایت استفاده می‌شوند." },
  { id: "hero", label: "ابتدای صفحه", description: "عنوان، معرفی و تصویر ابتدای صفحهٔ اصلی را ویرایش کن." },
  { id: "about", label: "دربارهٔ الیتا", description: "متن معرفی و دو تصویر بخش دربارهٔ الیتا." },
  { id: "approach", label: "خدمات و همکاری", description: "عنوان بخش خدمات و توضیح شیوهٔ همکاری؛ کارت‌های خدمات از بخش «خدمات» مدیریت می‌شوند." },
  { id: "benefits", label: "مزیت‌های همکاری", description: "متن و تصاویر پنج بخش مزیت‌ها؛ ترتیب و مقصد دکمه‌ها حفظ می‌شود." },
  { id: "sections", label: "بخش‌های پایانی", description: "عنوان و معرفی نمونه‌کارها، پلن‌ها، مجله و فرم مشاوره." },
  { id: "footer", label: "پایین سایت", description: "دعوت به همکاری و متن‌های فوتر، در همهٔ صفحه‌ها نمایش داده می‌شوند." },
  { id: "faqs", label: "پرسش‌های عمومی", description: "پرسش‌های عمومی صفحهٔ اصلی را اضافه، مرتب یا حذف کن." },
  { id: "seo", label: "عنوان و توضیح سایت", description: "عنوان و معرفی عمومی سایت؛ تنظیمات دامنه و ایندکس گوگل در مرحلهٔ انتشار نهایی انجام می‌شود." },
];
const fields: Partial<Record<Group, FieldSpec[]>> = {
  identity: [
    { path: "home.brand.name", label: "نام فارسی برند" },
    { path: "home.brand.latinName", label: "نام لاتین برند", ltr: true },
    { path: "home.brand.owner", label: "نام صاحب برند" },
    { path: "home.contact.phoneLabel", label: "شمارهٔ نمایشی", hint: "شکل نمایش شماره در سایت؛ برای مثال ۰۹۳۳ ۸۲۳ ۴۴۷۳." },
    { path: "header.ctaLabel", label: "متن دکمهٔ هدر" },
    { path: "header.mobileCtaLabel", label: "متن دکمهٔ منوی موبایل" },
  ],
  hero: [
    { path: "home.hero.eyebrow", label: "معرفی کوتاه بالای عنوان" },
    { path: "home.hero.title", label: "عنوان اصلی", lines: true },
    { path: "home.hero.description", label: "توضیح اصلی", multiline: true },
    { path: "home.hero.primaryLabel", label: "دکمهٔ شروع همکاری" },
    { path: "home.hero.secondaryLabel", label: "دکمهٔ نمونه‌کارها" },
  ],
  about: [
    { path: "home.about.title", label: "عنوان معرفی", lines: true },
    { path: "home.about.description", label: "توضیح معرفی", multiline: true },
    { path: "home.about.detail", label: "توضیح تکمیلی", multiline: true },
    { path: "home.about.actionLabel", label: "متن دکمهٔ خدمات" },
    { path: "home.about.caption", label: "عنوان کنار تصویر" },
    { path: "home.about.captionDetail", label: "توضیح کنار تصویر" },
  ],
  approach: [
    { path: "home.services.title", label: "عنوان بخش خدمات", lines: true },
    { path: "home.services.description", label: "معرفی بخش خدمات", multiline: true },
    { path: "home.services.actionLabel", label: "دکمهٔ همهٔ خدمات" },
    { path: "home.approach.title", label: "عنوان شیوهٔ همکاری", lines: true },
    { path: "home.approach.description", label: "توضیح شیوهٔ همکاری", multiline: true },
    { path: "home.approach.featureLabel", label: "معرفی کوتاه روی تصویر" },
    { path: "home.approach.featureTitle", label: "عنوان روی تصویر", lines: true },
    { path: "home.approach.featureDescription", label: "توضیح روی تصویر", multiline: true },
    { path: "home.approach.actionLabel", label: "متن دکمهٔ گفتگو" },
  ],
  benefits: [
    { path: "home.benefits.title", label: "عنوان مزیت‌ها", lines: true },
    { path: "home.benefits.description", label: "معرفی مزیت‌ها", multiline: true },
  ],
  sections: [
    { path: "sections.portfolioTitle", label: "عنوان نمونه‌کارها" },
    { path: "sections.portfolioDescription", label: "معرفی نمونه‌کارها", multiline: true },
    { path: "sections.portfolioActionLabel", label: "دکمهٔ همهٔ نمونه‌کارها" },
    { path: "sections.pricingTitle", label: "عنوان بخش پلن‌ها", lines: true },
    { path: "sections.pricingDescription", label: "معرفی پلن‌ها", multiline: true },
    { path: "sections.pricingFootnote", label: "توضیح زیر پلن‌ها", multiline: true },
    { path: "sections.insightsTitle", label: "عنوان مجله", lines: true },
    { path: "sections.insightsDescription", label: "معرفی مجله", multiline: true },
    { path: "sections.insightsActionLabel", label: "دکمهٔ مجله" },
    { path: "sections.contactTitle", label: "عنوان بخش مشاوره", lines: true },
    { path: "sections.contactDescription", label: "معرفی مشاوره", multiline: true },
    { path: "sections.contactInfoTitle", label: "عنوان راه‌های ارتباط" },
    { path: "sections.contactInfoDescription", label: "توضیح راه‌های ارتباط", multiline: true },
    { path: "sections.contactFormTitle", label: "عنوان فرم مشاوره" },
    { path: "sections.contactFormDescription", label: "توضیح فرم مشاوره", multiline: true },
    { path: "sections.faqTitle", label: "عنوان پرسش‌های عمومی" },
    { path: "sections.faqDescription", label: "معرفی پرسش‌های عمومی", multiline: true },
  ],
  footer: [
    { path: "footer.ctaTitle", label: "عنوان دعوت به همکاری", multiline: true, hint: "برای نمایش در چند سطر، از خط جدید استفاده کن." },
    { path: "footer.ctaDescription", label: "توضیح دعوت به همکاری", multiline: true },
    { path: "footer.ctaLabel", label: "متن دکمهٔ دعوت به همکاری" },
    { path: "footer.description", label: "معرفی برند در فوتر", multiline: true },
    { path: "footer.contactTitle", label: "عنوان ستون ارتباط" },
    { path: "footer.contactDescription", label: "توضیح ستون ارتباط", multiline: true },
    { path: "footer.bottomNote", label: "یادداشت انتهای سایت", multiline: true },
  ],
  seo: [
    { path: "seo.title", label: "عنوان عمومی سایت", maxLength: 180, hint: "عنوانی روشن شامل نام برند و موضوع فعالیت." },
    { path: "seo.description", label: "توضیح عمومی سایت", multiline: true, maxLength: 500, hint: "معرفی کوتاه فعالیت الیتا که برای توضیح عمومی سایت استفاده می‌شود." },
  ],
};

function read(data: SiteSettings, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => value !== null && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined, data);
}
function changed(data: SiteSettings, path: string, value: unknown): SiteSettings {
  const copy = structuredClone(data);
  const parts = path.split(".");
  let target = copy as unknown as Record<string, unknown>;
  for (const key of parts.slice(0, -1)) target = target[key] as Record<string, unknown>;
  target[parts[parts.length - 1]] = value;
  return copy;
}
function errorMessage(error: unknown) { return error instanceof Error ? error.message : "ذخیره انجام نشد. تغییراتت در فرم باقی مانده است."; }
function digits(value: string) { return value.replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))).replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))); }
function internationalNumber(value: string) {
  const number = digits(value).replace(/[^0-9]/g, "");
  return number.startsWith("0098") ? number.slice(2) : number.startsWith("09") ? `98${number.slice(1)}` : number;
}

function TextField({ spec, data, onChange }: { spec: FieldSpec; data: SiteSettings; onChange: (path: string, value: unknown) => void }) {
  const id = `site-setting-${spec.path.replaceAll(".", "-")}`;
  const value = read(data, spec.path);
  const text = spec.lines ? Array.isArray(value) ? value.join("\n") : "" : String(value ?? "");
  const hint = spec.hint ?? (spec.lines ? "هر سطر عنوان را در یک خط جدا بنویس." : undefined);
  const common = { id, value: text, dir: spec.ltr ? "ltr" as const : undefined, maxLength: spec.maxLength, "aria-describedby": hint ? `${id}-help` : undefined, onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(spec.path, spec.lines ? event.target.value.split("\n") : event.target.value) };
  return <div className={`admin-field${spec.multiline || spec.lines ? " admin-field-wide" : ""}`}><label htmlFor={id}>{spec.label}</label>{spec.multiline || spec.lines ? <textarea {...common} rows={spec.lines ? 2 : 3} /> : <input {...common} type="text" />}{hint && <small id={`${id}-help`}>{hint}</small>}</div>;
}

function SettingsImage({ path, label, data, onChange, request }: { path: string; label: string; data: SiteSettings; onChange: (path: string, value: unknown) => void; request: CmsRequest }) {
  const image = read(data, path) as { src: string; alt: string; width: number; height: number };
  const [media, setMedia] = useState<CmsMedia[] | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function choose() {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (media) return;
    setBusy(true); setError("");
    try { setMedia((await request<{ media: CmsMedia[] }>("media")).media); } catch (caught) { setError(errorMessage(caught)); } finally { setBusy(false); }
  }
  return <fieldset className="admin-image-field"><legend>{label}</legend><div className="admin-image-current">{image.src && <img src={sitePath(image.src)} alt={image.alt} width="130" height="130" />}<div><TextField spec={{ path: `${path}.src`, maxLength: 220, label: "نشانی تصویر", ltr: true, hint: "تصویر موجود سایت یا تصویری از بخش رسانه‌ها را انتخاب کن." }} data={data} onChange={onChange} /><TextField spec={{ path: `${path}.alt`, maxLength: 350, label: "توضیح تصویر", hint: "محتوای تصویر را کوتاه و روشن توصیف کن." }} data={data} onChange={onChange} /></div></div><button type="button" className="admin-button admin-secondary" disabled={busy} onClick={choose}>{busy ? "دریافت تصاویر…" : open ? "بستن انتخاب تصویر" : "انتخاب از رسانه‌ها"}</button>{error && <div className="admin-error" role="alert"><p>{error}</p><button type="button" className="admin-link-button" onClick={() => { setOpen(false); }}>بستن انتخاب تصویر</button></div>}{open && media && <div className="admin-media-picker">{media.length ? media.map((item) => <button type="button" key={item.id} onClick={() => { onChange(path, { ...image, src: item.url, alt: item.alt }); setOpen(false); }}><img src={sitePath(item.url)} alt={item.alt} width="96" height="72" loading="lazy" /><span>{item.alt || item.filename}</span></button>) : <p>هنوز تصویری بارگذاری نشده. از بخش «رسانه‌ها» تصویر اضافه کن؛ پیش از رفتن به آن بخش، تغییرات این فرم را ذخیره کن.</p>}</div>}</fieldset>;
}

function ContactFields({ data, onChange }: { data: SiteSettings; onChange: (path: string, value: unknown) => void }) {
  const contact = data.home.contact;
  const items = [
    { key: "whatsapp", label: "شمارهٔ واتساپ", value: contact.whatsapp.replace(/^https:\/\/wa\.me\//, ""), hint: "شماره با کد کشور؛ مثلاً 989338234473. شمارهٔ ۰۹ هم به کد ایران تبدیل می‌شود.", normalize: (value: string) => value.startsWith("https://") ? value : `https://wa.me/${internationalNumber(value)}` },
    { key: "phone", label: "شمارهٔ تماس", value: contact.phone.replace(/^tel:/, ""), hint: "شمارهٔ تماس با کد کشور؛ ظاهر شماره را جداگانه در «شمارهٔ نمایشی» بنویس.", normalize: (value: string) => `tel:+${internationalNumber(value.replace(/^tel:/, ""))}` },
    { key: "instagram", label: "نام کاربری اینستاگرام", value: contact.instagram.replace(/^https:\/\/(?:www\.)?instagram\.com\//, "").replace(/\/$/, ""), hint: "نام کاربری بدون @ یا لینک کامل اینستاگرام.", normalize: (value: string) => value.startsWith("https://") ? value : `https://www.instagram.com/${value.replace(/^@/, "").replace(/\s/g, "")}/` },
    { key: "telegram", label: "نام کاربری تلگرام", value: contact.telegram.replace(/^https:\/\/t\.me\//, "").replace(/\/$/, ""), hint: "نام کاربری بدون @ یا لینک کامل تلگرام.", normalize: (value: string) => value.startsWith("https://") ? value : `https://t.me/${value.replace(/^@/, "").replace(/\s/g, "")}` },
    { key: "bale", label: "نام کاربری یا شمارهٔ بله", value: contact.bale.replace(/^https:\/\/ble\.ir\//, "").replace(/\/$/, ""), hint: "نام کاربری بدون @ یا لینک کامل ble.ir؛ شماره با صفر ابتدای آن حفظ می‌شود.", normalize: (value: string) => value.trim().startsWith("https://") ? value.trim() : `https://ble.ir/${digits(value).replace(/^@/, "").replace(/\s/g, "")}` },
    { key: "eitaa", label: "نام کاربری یا شمارهٔ ایتا", value: contact.eitaa.replace(/^https:\/\/eitaa\.com\//, "").replace(/\/$/, ""), hint: "نام کاربری بدون @ یا لینک کامل eitaa.com؛ شماره با صفر ابتدای آن حفظ می‌شود.", normalize: (value: string) => value.trim().startsWith("https://") ? value.trim() : `https://eitaa.com/${digits(value).replace(/^@/, "").replace(/\s/g, "")}` },
  ];
  return <div className="admin-fields-grid">{items.map((item) => <label className="admin-field" key={item.key}><span>{item.label}</span><input type="text" dir="ltr" value={item.value} aria-describedby={`contact-${item.key}-help`} onChange={(event) => onChange(`home.contact.${item.key}`, item.normalize(event.target.value))} /><small id={`contact-${item.key}-help`}>{item.hint}</small></label>)}</div>;
}

function FrequentlyAsked({ data, onChange }: { data: SiteSettings; onChange: (path: string, value: unknown) => void }) {
  const items = data.faqs;
  function move(index: number, offset: number) { const next = [...items]; [next[index], next[index + offset]] = [next[index + offset], next[index]]; onChange("faqs", next); }
  return <fieldset className="admin-repeater"><legend>پرسش‌ها و پاسخ‌ها</legend><p className="admin-help">حداکثر ۳۰ پرسش؛ با حذف همهٔ پرسش‌ها، فهرست پرسش‌های عمومی نمایش داده نمی‌شود.</p>{items.map((item, index) => <div className="admin-repeat-row" key={index}><div className="admin-repeat-toolbar"><strong>پرسش {new Intl.NumberFormat("fa-IR").format(index + 1)}</strong><div><button type="button" disabled={index === 0} aria-label={`انتقال پرسش ${index + 1} به بالا`} onClick={() => move(index, -1)}>بالا</button><button type="button" disabled={index === items.length - 1} aria-label={`انتقال پرسش ${index + 1} به پایین`} onClick={() => move(index, 1)}>پایین</button><button type="button" className="admin-danger-text" aria-label={`حذف پرسش ${index + 1}`} onClick={() => onChange("faqs", items.filter((_, position) => position !== index))}>حذف پرسش</button></div></div><div className="admin-fields-grid"><TextField spec={{ path: `faqs.${index}.question`, label: "پرسش" }} data={data} onChange={onChange} /><TextField spec={{ path: `faqs.${index}.answer`, label: "پاسخ", multiline: true }} data={data} onChange={onChange} /></div></div>)}{!items.length && <p className="admin-help">هنوز پرسشی در این فهرست نیست.</p>}<button type="button" className="admin-button admin-secondary" disabled={items.length >= 30} onClick={() => onChange("faqs", [...items, { question: "", answer: "" }])}>افزودن پرسش</button></fieldset>;
}

export function SiteSettingsEditor({ request, onDirtyChange }: { request: CmsRequest; onDirtyChange: (dirty: boolean) => void }) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<CmsSiteSettings | null>(null);
  const [data, setData] = useState<SiteSettings | null>(null);
  const [active, setActive] = useState<Group>("identity");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const groupHeading = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(true);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const value = await request<CmsSiteSettings>("settings"); if (mounted.current) { setSnapshot(value); setData(structuredClone(value.data)); } } catch (caught) { if (mounted.current) setError(errorMessage(caught)); } finally { if (mounted.current) setLoading(false); }
  }, [request]);
  useEffect(() => { mounted.current = true; void load(); return () => { mounted.current = false; }; }, [load]);
  useEffect(() => { onDirtyChange(dirty); }, [dirty, onDirtyChange]);
  useEffect(() => { function beforeUnload(event: BeforeUnloadEvent) { if (dirty) { event.preventDefault(); event.returnValue = ""; } } window.addEventListener("beforeunload", beforeUnload); return () => window.removeEventListener("beforeunload", beforeUnload); }, [dirty]);
  function update(path: string, value: unknown) { setData((current) => current ? changed(current, path, value) : current); setDirty(true); setSuccess(""); }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!data || !snapshot || busy) return;
    setBusy(true); setError(""); setSuccess("");
    try {
      const next = await request<CmsSiteSettings>("settings", { method: "PUT", body: JSON.stringify({ data, revision: snapshot.revision }) });
      if (mounted.current) { setSnapshot(next); setData(structuredClone(next.data)); setDirty(false); onDirtyChange(false); setSuccess("تنظیمات ذخیره و در سایت اعمال شد."); router.refresh(); }
    } catch (caught) { if (mounted.current) setError(errorMessage(caught)); } finally { if (mounted.current) setBusy(false); }
  }
  if (loading) return <p className="admin-empty" role="status">در حال دریافت تنظیمات سایت…</p>;
  if (!data || !snapshot) return <section className="admin-empty"><h2>تنظیمات دریافت نشد</h2>{error && <p className="admin-error" role="alert">{error}</p>}<button type="button" className="admin-button" onClick={load}>دریافت دوبارهٔ تنظیمات</button></section>;
  const currentGroup = groups.find((group) => group.id === active)!;
  return <section className="admin-site-settings"><div className="admin-section-heading"><div><h2>متن‌ها و اطلاعات عمومی سایت</h2><p className="admin-help">بین بخش‌ها جابه‌جا شو؛ در پایان همهٔ تغییرات را یکجا ذخیره کن.</p></div><a className="admin-button admin-secondary" href={sitePath("/")} target="_blank" rel="noreferrer">دیدن سایت</a></div><div className="admin-settings-layout"><nav className="admin-settings-navigation" aria-label="گروه‌های تنظیمات سایت">{groups.map((group) => <button type="button" key={group.id} disabled={busy} aria-current={active === group.id ? "true" : undefined} aria-controls="admin-settings-group" onClick={() => { setActive(group.id); requestAnimationFrame(() => groupHeading.current?.focus()); }}>{group.label}</button>)}</nav><form onSubmit={save} noValidate><fieldset disabled={busy} className="admin-form-fields admin-settings-content"><div id="admin-settings-group"><div className="admin-settings-group-heading"><h3 ref={groupHeading} tabIndex={-1}>{currentGroup.label}</h3><p className="admin-help">{currentGroup.description}</p></div><div className="admin-fields-grid">{(fields[active] ?? []).map((spec) => <TextField key={spec.path} spec={spec} data={data} onChange={update} />)}</div>
    {active === "identity" && <ContactFields data={data} onChange={update} />}
    {active === "hero" && <><SettingsImage path="home.hero.portrait" label="تصویر اصلی" data={data} onChange={update} request={request} />{data.home.hero.services.map((_, index) => <fieldset className="admin-repeater" key={index}><legend>معرفی خدمت {new Intl.NumberFormat("fa-IR").format(index + 1)}</legend><div className="admin-fields-grid"><TextField spec={{ path: `home.hero.services.${index}.title`, label: "عنوان خدمت" }} data={data} onChange={update} /><TextField spec={{ path: `home.hero.services.${index}.caption`, label: "توضیح کوتاه" }} data={data} onChange={update} /></div></fieldset>)}</>}
    {active === "about" && <><SettingsImage path="home.about.image" label="تصویر اول معرفی" data={data} onChange={update} request={request} /><SettingsImage path="home.about.secondaryImage" label="تصویر دوم معرفی" data={data} onChange={update} request={request} /></>}
    {active === "approach" && <><SettingsImage path="home.approach.image" label="تصویر شیوهٔ همکاری" data={data} onChange={update} request={request} />{data.home.approach.values.map((_, index) => <fieldset className="admin-repeater" key={index}><legend>ارزش همکاری {new Intl.NumberFormat("fa-IR").format(index + 1)}</legend><div className="admin-fields-grid"><TextField spec={{ path: `home.approach.values.${index}.title`, label: "عنوان" }} data={data} onChange={update} /><TextField spec={{ path: `home.approach.values.${index}.text`, label: "توضیح", multiline: true }} data={data} onChange={update} /></div></fieldset>)}</>}
    {active === "benefits" && data.home.benefits.items.map((item, index) => <fieldset className="admin-repeater" key={item.id}><legend>مزیت {new Intl.NumberFormat("fa-IR").format(index + 1)}</legend><div className="admin-fields-grid"><TextField spec={{ path: `home.benefits.items.${index}.title`, label: "عنوان" }} data={data} onChange={update} /><TextField spec={{ path: `home.benefits.items.${index}.description`, label: "توضیح", multiline: true }} data={data} onChange={update} /><TextField spec={{ path: `home.benefits.items.${index}.actionLabel`, label: "متن دکمهٔ گفتگو" }} data={data} onChange={update} /></div><SettingsImage path={`home.benefits.items.${index}.image`} label="تصویر مزیت" data={data} onChange={update} request={request} /></fieldset>)}
    {active === "faqs" && <FrequentlyAsked data={data} onChange={update} />}
    </div><div className="admin-save-bar admin-settings-save"><button className="admin-button" type="submit" disabled={!dirty || busy}>{busy ? "در حال ذخیره…" : "ذخیره و اعمال تنظیمات"}</button><span className="admin-help" role="status">{dirty ? "تغییرات ذخیره‌نشده داری." : "تغییر ذخیره‌نشده‌ای نداری."}</span>{snapshot.updatedAt && <small className="admin-settings-updated">آخرین ذخیره: {new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(snapshot.updatedAt))}</small>}</div></fieldset>{error && <div className="admin-error" role="alert"><p>{error}</p><p>تغییرات فرم حفظ شده‌اند. اگر تنظیمات هم‌زمان تغییر کرده، نسخهٔ تازه را در پنجره‌ای دیگر بررسی کن و تغییراتت را پیش از بارگذاری دوباره یادداشت کن.</p></div>}{success && <p className="admin-success" role="status">{success}</p>}</form></div></section>;
}
