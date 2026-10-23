"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { createEditorData, editorFields, publicRecordPath, recordTitle, type EditorField } from "../../lib/cms-editor-fields";
import type { CmsCollection, CmsMedia, CmsRecord, CmsStatus } from "../../lib/cms-shared";
import { sitePath } from "../../lib/site-path";

export type CmsRequest = <T>(path: string, options?: RequestInit) => Promise<T>;
type EditorProps = {
  collection: CmsCollection;
  record: CmsRecord | null;
  request: CmsRequest;
  onSaved: (record: CmsRecord) => void;
  onClose: () => void;
  onDirtyChange: (dirty: boolean) => void;
};

function lines(value: unknown) { return Array.isArray(value) ? value.map(String).join("\n") : ""; }
function object(value: unknown): Record<string, unknown> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function rows(value: unknown) { return Array.isArray(value) ? value.map(object) : []; }
function clean(value: unknown): unknown {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(clean).filter((item) => item !== "");
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clean(item)]));
  return value;
}

function Field({ field, value, onChange }: { field: EditorField; value: unknown; onChange: (value: unknown) => void }) {
  const id = `cms-field-${field.key}`;
  if (field.type === "checkbox") return <label className="admin-check" htmlFor={id}><input id={id} type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} /><span>{field.label}{field.hint && <small>{field.hint}</small>}</span></label>;
  const input = field.type === "select" ? <select id={id} required={field.required} value={String(value ?? "")} onChange={(event) => onChange(event.target.value || null)}>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
    : field.type === "textarea" || field.type === "lines" ? <textarea id={id} rows={field.type === "lines" ? 4 : 3} required={field.required} value={field.type === "lines" ? lines(value) : String(value ?? "")} onChange={(event) => onChange(field.type === "lines" ? event.target.value.split("\n") : event.target.value)} />
      : <input id={id} type={field.type === "number" ? "number" : "text"} min={field.type === "number" ? field.key === "readingMinutes" ? 1 : 0 : undefined} step={field.type === "number" ? 1 : undefined} required={field.required} pattern={field.key === "slug" || field.key === "id" ? "[a-z0-9]+(?:-[a-z0-9]+)*" : undefined} dir={field.key === "slug" || field.key === "id" || field.type === "number" ? "ltr" : undefined} value={String(value ?? "")} onChange={(event) => onChange(field.type === "number" ? event.target.value === "" ? "" : Number(event.target.value) : event.target.value)} />;
  return <div className={`admin-field${field.type === "textarea" || field.type === "lines" ? " admin-field-wide" : ""}`}><label htmlFor={id}>{field.label}{field.required && <span aria-hidden="true"> *</span>}</label>{input}{field.hint && <small id={`${id}-hint`}>{field.hint}</small>}</div>;
}

function RepeatFields({ label, value, fields, onChange, article = false }: {
  label: string; value: unknown; fields: { key: string; label: string; lines?: boolean; required?: boolean }[];
  onChange: (value: Record<string, unknown>[]) => void; article?: boolean;
}) {
  const items = rows(value);
  function update(index: number, key: string, next: unknown) { onChange(items.map((item, position) => position === index ? { ...item, [key]: next } : item)); }
  function move(index: number, offset: number) { const next = [...items]; [next[index], next[index + offset]] = [next[index + offset], next[index]]; onChange(next); }
  function add() {
    const item = Object.fromEntries(fields.map((field) => [field.key, field.lines ? [] : ""]));
    if (article) {
      let suffix = items.length + 1;
      while (items.some((row) => row.id === `section-${suffix}`)) suffix++;
      item.id = `section-${suffix}`;
    }
    onChange([...items, item]);
  }
  return <fieldset className="admin-repeater"><legend>{label}</legend><p className="admin-help">ترتیب این موارد در سایت هم حفظ می‌شود.</p>{items.map((item, index) => <div className="admin-repeat-row" key={index}><div className="admin-repeat-toolbar"><strong>{label} {new Intl.NumberFormat("fa-IR").format(index + 1)}</strong><div><button type="button" disabled={index === 0} aria-label={`انتقال مورد ${index + 1} به بالا`} onClick={() => move(index, -1)}>بالا</button><button type="button" disabled={index === items.length - 1} aria-label={`انتقال مورد ${index + 1} به پایین`} onClick={() => move(index, 1)}>پایین</button><button className="admin-danger-text" type="button" onClick={() => onChange(items.filter((_, position) => position !== index))}>برداشتن</button></div></div>{article && <label className="admin-field"><span>نشانی این بخش</span><input required dir="ltr" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={String(item.id ?? "")} onChange={(event) => update(index, "id", event.target.value)} /></label>}{fields.map((field) => <label className="admin-field" key={field.key}><span>{field.label}{field.required ? " *" : ""}</span>{field.lines || field.key === "description" || field.key === "answer" ? <textarea rows={field.lines ? 5 : 3} required={field.required} value={field.lines ? lines(item[field.key]) : String(item[field.key] ?? "")} onChange={(event) => update(index, field.key, field.lines ? event.target.value.split("\n") : event.target.value)} /> : <input required={field.required} value={String(item[field.key] ?? "")} onChange={(event) => update(index, field.key, event.target.value)} />}{field.lines && <small>هر {field.key === "paragraphs" ? "پاراگراف" : "مورد"} در یک خط جدا.</small>}</label>)}</div>)}<button className="admin-button admin-secondary" type="button" onClick={add}>افزودن {label === "بخش‌های مقاله" ? "بخش" : "مورد"}</button></fieldset>;
}

function ImageField({ value, onChange, request, optional = false }: { value: unknown; onChange: (value: unknown) => void; request: CmsRequest; optional?: boolean }) {
  const image = object(value);
  const [media, setMedia] = useState<CmsMedia[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  async function chooseMedia() {
    setOpen(!open);
    if (media || busy) return;
    setBusy(true); setError("");
    try { setMedia((await request<{ media: CmsMedia[] }>("media")).media); } catch (caught) { setError(caught instanceof Error ? caught.message : "دریافت تصاویر انجام نشد."); } finally { setBusy(false); }
  }
  return <fieldset className="admin-image-field"><legend>تصویر اصلی{optional ? " (اختیاری)" : ""}</legend>{optional && <p className="admin-help">بدون تصویر، قالب پیش‌نمایش انتخاب‌شده نمایش داده می‌شود.</p>}<div className="admin-image-current">{typeof image.src === "string" && image.src && <img src={sitePath(image.src)} alt={String(image.alt ?? "")} width="120" height="90" />}<div><label className="admin-field"><span>نشانی تصویر{optional ? "" : " *"}</span><input required={!optional} dir="ltr" value={String(image.src ?? "")} onChange={(event) => onChange(optional && !event.target.value ? undefined : { ...image, src: event.target.value })} placeholder="/images/example.webp" /></label><label className="admin-field"><span>توضیح تصویر{!optional || image.src ? " *" : ""}</span><input required={!optional || Boolean(image.src)} disabled={optional && !image.src} value={String(image.alt ?? "")} onChange={(event) => onChange({ ...image, alt: event.target.value })} /><small>آنچه در تصویر دیده می‌شود را کوتاه توضیح بده.</small></label></div></div><div className="admin-actions"><button type="button" className="admin-button admin-secondary" disabled={busy} onClick={chooseMedia}>{busy ? "دریافت تصاویر…" : open ? "بستن انتخاب تصویر" : "انتخاب از تصاویر بارگذاری‌شده"}</button>{optional && Boolean(image.src) && <button className="admin-link-button admin-danger-text" type="button" onClick={() => onChange(undefined)}>برداشتن تصویر پروژه</button>}</div>{error && <p className="admin-error" role="alert">{error}</p>}{open && media && <div className="admin-media-picker">{media.length ? media.map((item) => <button type="button" key={item.id} onClick={() => { onChange({ src: item.url, alt: item.alt }); setOpen(false); }}><img src={sitePath(item.url)} alt={item.alt} width="96" height="72" /><span>{item.alt || item.filename}</span></button>) : <p>هنوز تصویری بارگذاری نشده. از بخش «رسانه‌ها» تصویر اضافه کن.</p>}</div>}</fieldset>;
}

export function RecordEditor({ collection, record, request, onSaved, onClose, onDirtyChange }: EditorProps) {
  const [data, setData] = useState<Record<string, unknown>>(() => record ? structuredClone(record.data) : createEditorData(collection));
  const [status, setStatus] = useState<CmsStatus>(record?.status ?? "draft");
  const [revision, setRevision] = useState(record?.revision);
  const [savedRecord, setSavedRecord] = useState<CmsRecord | null>(record);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dirty, setDirty] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  useEffect(() => { onDirtyChange(dirty); }, [dirty, onDirtyChange]);
  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) { if (dirty) event.preventDefault(); }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);
  function update(key: string, value: unknown) { setData((current) => ({ ...current, [key]: value })); setDirty(true); setSuccess(""); }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setSuccess("");
    try {
      const next = await request<CmsRecord>(`records/${collection}${savedRecord ? `/${savedRecord.id}` : ""}`, { method: savedRecord ? "PUT" : "POST", body: JSON.stringify({ data: clean(data), status, ...(revision ? { revision } : {}) }) });
      setData(structuredClone(next.data)); setSavedRecord(next); setRevision(next.revision); setStatus(next.status); setDirty(false); onDirtyChange(false); setSuccess(next.status === "published" ? "تغییرات ذخیره و منتشر شد." : "پیش‌نویس ذخیره شد."); onSaved(next);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "ذخیره انجام نشد. تغییراتت در فرم باقی مانده است."); } finally { setBusy(false); }
  }
  return <section className="admin-editor"><div className="admin-section-heading"><div><p className="admin-help">{savedRecord ? "ویرایش محتوا" : "محتوای تازه"}</p><h2 tabIndex={-1} ref={heading}>{savedRecord ? recordTitle(savedRecord.data) : "افزودن محتوا"}</h2></div><button className="admin-button admin-secondary" type="button" disabled={busy} onClick={onClose}>بازگشت به فهرست</button></div><form onSubmit={save}><fieldset disabled={busy} className="admin-form-fields"><div className="admin-fields-grid">{editorFields[collection].map((field) => <Field field={field} key={field.key} value={data[field.key]} onChange={(value) => update(field.key, value)} />)}</div>{(collection === "articles" || collection === "services" || collection === "portfolio") && <ImageField optional={collection === "portfolio"} value={data.image} onChange={(value) => update("image", value)} request={request} />}{collection === "articles" && <RepeatFields article label="بخش‌های مقاله" value={data.sections} fields={[{ key: "heading", label: "عنوان بخش", required: true }, { key: "paragraphs", label: "متن بخش", lines: true, required: true }, { key: "bullets", label: "فهرست نکته‌ها (اختیاری)", lines: true }]} onChange={(value) => update("sections", value)} />}{collection === "services" && <><RepeatFields label="خروجی‌های خدمت" value={data.deliverables} fields={[{ key: "title", label: "عنوان", required: true }, { key: "description", label: "توضیح", required: true }]} onChange={(value) => update("deliverables", value)} /><RepeatFields label="مراحل همکاری" value={data.steps} fields={[{ key: "title", label: "عنوان مرحله", required: true }, { key: "description", label: "توضیح مرحله", required: true }]} onChange={(value) => update("steps", value)} /><RepeatFields label="پرسش‌های متداول" value={data.faqs} fields={[{ key: "question", label: "پرسش", required: true }, { key: "answer", label: "پاسخ", required: true }]} onChange={(value) => update("faqs", value)} /></>}<div className="admin-save-bar"><label className="admin-field"><span>وضعیت انتشار</span><select value={status} onChange={(event) => { setStatus(event.target.value as CmsStatus); setDirty(true); setSuccess(""); }}><option value="draft">پیش‌نویس</option><option value="published">منتشرشده</option></select></label><button className="admin-button" type="submit">{busy ? "در حال ذخیره…" : status === "published" ? "ذخیره و انتشار" : "ذخیرهٔ پیش‌نویس"}</button>{savedRecord?.status === "published" && <a className="admin-button admin-secondary" href={sitePath(publicRecordPath(collection, savedRecord.data))} target="_blank" rel="noreferrer">دیدن در سایت</a>}{dirty && <span className="admin-help">تغییرات ذخیره‌نشده داری.</span>}</div></fieldset>{error && <div className="admin-error" role="alert"><p>{error}</p><p>تغییراتت در فرم باقی مانده است. در صورت ویرایش هم‌زمان، ابتدا نسخهٔ تازه را در یک پنجرهٔ دیگر بررسی کن.</p></div>}{success && <p className="admin-success" role="status">{success}</p>}</form></section>;
}
