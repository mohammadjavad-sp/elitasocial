"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { cmsCollectionLabels, cmsCollections, type CmsCollection, type CmsMedia, type CmsRecord, type CmsSession } from "../../lib/cms-shared";
import { publicRecordPath, recordTitle } from "../../lib/cms-editor-fields";
import { sitePath } from "../../lib/site-path";
import { RecordEditor, type CmsRequest } from "./record-editor";

type Tab = "dashboard" | CmsCollection | "media" | "account";
type Stats = { counts: Record<CmsCollection | "media", number> };
const tabLabels: Record<Tab, string> = { dashboard: "پیشخوان", ...cmsCollectionLabels, media: "رسانه‌ها", account: "حساب کاربری" };
const number = new Intl.NumberFormat("fa-IR");
function message(error: unknown) { return error instanceof Error ? error.message : "ارتباط انجام نشد. دوباره تلاش کن."; }
function date(value: string) { const valueDate = new Date(value); return Number.isNaN(valueDate.valueOf()) ? "—" : new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(valueDate); }

class CmsError extends Error {
  status: number;
  setupRequired: boolean;
  constructor(text: string, status: number, setupRequired = false) { super(text); this.status = status; this.setupRequired = setupRequired; }
}

async function send<T>(path: string, options?: RequestInit, csrfToken?: string): Promise<T> {
  const headers = new Headers(options?.headers);
  if (options?.body && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (csrfToken && options?.method && options.method !== "GET") headers.set("x-csrf-token", csrfToken);
  const response = await fetch(sitePath(`/api/cms/${path}`), { ...options, credentials: "same-origin", cache: "no-store", headers });
  if (!response.ok) {
    let body: { error?: string; message?: string; setupRequired?: boolean } = {};
    try { body = await response.json(); } catch { /* A host may return an HTML error page. */ }
    throw new CmsError(body.error || body.message || (response.status === 401 ? "نشست ورود پایان یافته. برای ادامه دوباره وارد شو." : response.status === 409 ? "این محتوا در جای دیگری تغییر کرده است. تغییرات فرم حفظ شده‌اند." : "ارتباط با پنل انجام نشد. دوباره تلاش کن."), response.status, body.setupRequired);
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}

function AdminLogo() { return <a className="admin-brand" href={sitePath("/")}><strong>الیتا سوشال</strong><span>مدیریت محتوای سایت</span></a>; }

function Notice({ title, children, retry }: { title: string; children: ReactNode; retry?: () => void }) {
  return <main className="admin-access"><section className="admin-access-card"><AdminLogo /><h1>{title}</h1><div className="admin-access-copy">{children}</div>{retry && <button className="admin-button" onClick={retry}>تلاش دوباره</button>}<a className="admin-text-link" href={sitePath("/")}>بازگشت به سایت</a></section></main>;
}

function Login({ onLogin, setupRequired, initialError }: { onLogin: (session: CmsSession) => void; setupRequired: boolean; initialError: string }) {
  const [error, setError] = useState(initialError);
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); setBusy(true); setError("");
    try { onLogin(await send<CmsSession>("login", { method: "POST", body: JSON.stringify({ email: String(form.get("email")).trim(), password: form.get("password") }) })); } catch (caught) { setError(message(caught)); } finally { setBusy(false); }
  }
  if (setupRequired) return <Notice title="پنل برای اولین ورود آماده نشده"><p>ابتدا حساب مدیر باید روی سرور ساخته شود. راهنمای راه‌اندازی پروژه، روش ساخت حساب اولیه را توضیح می‌دهد.</p><p>پس از ساخت حساب، این صفحه را دوباره باز کن.</p><button className="admin-button" onClick={() => window.location.reload()}>بررسی دوباره</button></Notice>;
  return <main className="admin-access"><section className="admin-access-card"><AdminLogo /><h1>ورود به پنل</h1><p className="admin-help">با حساب مدیر وارد شو و محتوای سایت را ویرایش کن.</p><form onSubmit={submit}><fieldset disabled={busy} className="admin-form-fields"><label className="admin-field"><span>ایمیل</span><input autoComplete="username" dir="ltr" type="email" name="email" required autoFocus /></label><label className="admin-field"><span>رمز عبور</span><input autoComplete="current-password" dir="ltr" type="password" name="password" required /></label><button className="admin-button" type="submit">{busy ? "در حال ورود…" : "ورود به پنل"}</button></fieldset>{error && <p className="admin-error" role="alert">{error}</p>}</form><a className="admin-text-link" href={sitePath("/")}>بازگشت به سایت</a></section></main>;
}

function DeleteDialog({ title, description, busy, error, onCancel, onConfirm }: { title: string; description: string; busy: boolean; error: string; onCancel: () => void; onConfirm: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} className="admin-delete-dialog" aria-labelledby="admin-delete-title" aria-describedby="admin-delete-description" onCancel={(event) => { event.preventDefault(); if (!busy) onCancel(); }}><h2 id="admin-delete-title">{title}</h2><p id="admin-delete-description">{description}</p>{error && <p className="admin-error" role="alert">{error}</p>}<div className="admin-actions"><button className="admin-button admin-secondary" autoFocus disabled={busy} onClick={onCancel}>انصراف</button><button className="admin-button admin-danger" disabled={busy} onClick={onConfirm}>{busy ? "در حال حذف…" : "بله، حذف شود"}</button></div></dialog>;
}

function Dashboard({ request, onSelect }: { request: CmsRequest; onSelect: (tab: Tab) => void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { setLoading(true); setError(""); try { setStats(await request<Stats>("stats")); } catch (caught) { setError(message(caught)); } finally { setLoading(false); } }, [request]);
  useEffect(() => { void load(); }, [load]);
  return <><div className="admin-section-heading"><div><h2>محتوای الیتا، همین‌جا</h2><p className="admin-help">پیش‌نویس آماده کن، محتوای تأییدشده را منتشر کن و اطلاعات سایت را به‌روز نگه دار.</p></div><button className="admin-button admin-secondary" disabled={loading} onClick={load}>{loading ? "در حال دریافت…" : "به‌روزرسانی آمار"}</button></div>{error && <p className="admin-error" role="alert">{error}</p>}<div className="admin-stats">{[...cmsCollections, "media" as const].map((collection) => <button key={collection} onClick={() => onSelect(collection)}><span>{tabLabels[collection]}</span><strong>{stats ? number.format(stats.counts[collection]) : loading ? "…" : "—"}</strong><small>رفتن به {tabLabels[collection]}</small></button>)}</div><section className="admin-guidance"><h3>از کجا شروع کنم؟</h3><p>محتوای نمایشی را با اطلاعات واقعی جایگزین کن. تا زمانی که متن و تصاویر تأیید نشده‌اند، وضعیت را «پیش‌نویس» نگه دار. انتشار، محتوا را در سایت عمومی قابل نمایش می‌کند.</p><div className="admin-actions"><button className="admin-button" onClick={() => onSelect("articles")}>مدیریت مقاله‌ها</button><button className="admin-button admin-secondary" onClick={() => onSelect("media")}>بارگذاری تصاویر</button></div></section></>;
}

function Collection({ collection, request, onDirtyChange }: { collection: CmsCollection; request: CmsRequest; onDirtyChange: (dirty: boolean) => void }) {
  const [records, setRecords] = useState<CmsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState<{ record: CmsRecord | null } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [deleting, setDeleting] = useState<CmsRecord | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const load = useCallback(async () => { setLoading(true); setError(""); try { setRecords((await request<{ records: CmsRecord[] }>(`records/${collection}`)).records); } catch (caught) { setError(message(caught)); } finally { setLoading(false); } }, [collection, request]);
  useEffect(() => { void load(); }, [load]);
  const dirtyChange = useCallback((value: boolean) => { setDirty(value); onDirtyChange(value); }, [onDirtyChange]);
  function closeEditor() { if (!dirty || window.confirm("تغییرات ذخیره نشده‌اند. بدون ذخیره از این فرم خارج می‌شوی؟")) { setEditing(null); dirtyChange(false); } }
  async function remove() {
    if (!deleting) return;
    setDeleteBusy(true); setDeleteError("");
    try { await request<void>(`records/${collection}/${deleting.id}`, { method: "DELETE", body: JSON.stringify({ revision: deleting.revision }) }); setRecords((current) => current.filter((record) => record.id !== deleting.id)); setDeleting(null); setSuccess("محتوا حذف شد."); } catch (caught) { setDeleteError(message(caught)); } finally { setDeleteBusy(false); }
  }
  if (editing) return <RecordEditor key={editing.record?.id ?? "new"} collection={collection} record={editing.record} request={request} onDirtyChange={dirtyChange} onClose={closeEditor} onSaved={(record) => setRecords((current) => [record, ...current.filter((item) => item.id !== record.id)])} />;
  const term = search.trim().toLocaleLowerCase("fa");
  const filtered = records.filter((record) => (status === "all" || record.status === status) && `${recordTitle(record.data)} ${record.data.slug ?? record.data.id ?? ""} ${record.data.category ?? ""}`.toLocaleLowerCase("fa").includes(term)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return <section><div className="admin-section-heading"><div><h2>{cmsCollectionLabels[collection]}</h2><p className="admin-help">{number.format(records.length)} مورد؛ پیش‌نویس‌ها در سایت عمومی نمایش داده نمی‌شوند.</p></div><button className="admin-button" onClick={() => { setEditing({ record: null }); setSuccess(""); }}>افزودن محتوا</button></div><div className="admin-list-tools"><label className="admin-field"><span>جست‌وجو در عنوان یا نشانی</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} /></label><label className="admin-field"><span>وضعیت</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">همه</option><option value="draft">پیش‌نویس</option><option value="published">منتشرشده</option></select></label><button className="admin-button admin-secondary" disabled={loading} onClick={load}>{loading ? "دریافت…" : "تازه‌سازی"}</button></div>{error && <p className="admin-error" role="alert">{error}</p>}{success && <p className="admin-success" role="status">{success}</p>}{loading ? <p className="admin-empty" role="status">در حال دریافت محتوا…</p> : !filtered.length ? <div className="admin-empty"><h3>{records.length ? "موردی با این جست‌وجو پیدا نشد" : "هنوز محتوایی اضافه نشده"}</h3><p>{records.length ? "عبارت جست‌وجو یا فیلتر وضعیت را تغییر بده." : "با دکمهٔ «افزودن محتوا» اولین مورد را بساز."}</p></div> : <div className="admin-record-list">{filtered.map((record) => <article className="admin-record" key={record.id}><div className="admin-record-copy"><div className="admin-record-badges"><span className={`admin-status admin-status-${record.status}`}>{record.status === "published" ? "منتشرشده" : "پیش‌نویس"}</span>{Boolean(record.data.isMock) && <span className="admin-mock">نمایشی</span>}</div><h3>{recordTitle(record.data)}</h3><p>آخرین ویرایش: {date(record.updatedAt)}</p></div><div className="admin-record-actions"><button className="admin-button admin-secondary" onClick={() => setEditing({ record })}>ویرایش</button>{record.status === "published" && <a className="admin-text-link" href={sitePath(publicRecordPath(collection, record.data))} target="_blank" rel="noreferrer">دیدن در سایت</a>}<button className="admin-link-button admin-danger-text" onClick={() => { setDeleting(record); setDeleteError(""); }}>حذف</button></div></article>)}</div>}{deleting && <DeleteDialog title="این محتوا حذف شود؟" description={`«${recordTitle(deleting.data)}» از پنل و سایت حذف می‌شود. این کار قابل بازگشت نیست.`} busy={deleteBusy} error={deleteError} onCancel={() => setDeleting(null)} onConfirm={remove} />}</section>;
}

function MediaLibrary({ request }: { request: CmsRequest }) {
  const [media, setMedia] = useState<CmsMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<CmsMedia | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const load = useCallback(async () => { setLoading(true); setError(""); try { setMedia((await request<{ media: CmsMedia[] }>("media")).media); } catch (caught) { setError(message(caught)); } finally { setLoading(false); } }, [request]);
  useEffect(() => { void load(); }, [load]);
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; setBusy(true); setError(""); setSuccess("");
    try { const item = await request<CmsMedia>("media", { method: "POST", body: new FormData(form) }); setMedia((current) => [item, ...current]); form.reset(); setSuccess("تصویر بارگذاری شد و آمادهٔ انتخاب در محتواست."); } catch (caught) { setError(message(caught)); } finally { setBusy(false); }
  }
  async function remove() {
    if (!deleting) return; setDeleteBusy(true); setDeleteError("");
    try { await request<void>(`media/${deleting.id}`, { method: "DELETE" }); setMedia((current) => current.filter((item) => item.id !== deleting.id)); setDeleting(null); setSuccess("تصویر حذف شد."); } catch (caught) { setDeleteError(message(caught)); } finally { setDeleteBusy(false); }
  }
  return <section><div className="admin-section-heading"><div><h2>تصاویر و رسانه‌ها</h2><p className="admin-help">تصاویر را یک بار بارگذاری کن و هنگام ویرایش مقاله یا خدمت انتخاب کن.</p></div><button className="admin-button admin-secondary" disabled={loading} onClick={load}>تازه‌سازی</button></div><form className="admin-upload" onSubmit={upload}><fieldset className="admin-form-fields" disabled={busy}><div className="admin-fields-grid"><label className="admin-field"><span>انتخاب تصویر *</span><input type="file" name="file" accept="image/jpeg,image/png,image/webp,image/gif" required /></label><label className="admin-field"><span>توضیح تصویر *</span><input name="alt" required maxLength={350} /><small>توضیح کوتاهی از محتوای تصویر بنویس.</small></label></div><button className="admin-button" type="submit">{busy ? "در حال بارگذاری…" : "بارگذاری تصویر"}</button></fieldset></form>{error && <p className="admin-error" role="alert">{error}</p>}{success && <p className="admin-success" role="status">{success}</p>}{loading ? <p className="admin-empty" role="status">در حال دریافت تصاویر…</p> : media.length ? <div className="admin-media-grid">{media.map((item) => <article className="admin-media-card" key={item.id}><img src={sitePath(item.url)} alt={item.alt} width="300" height="200" loading="lazy" /><div><h3>{item.alt || item.filename}</h3><p dir="ltr">{item.filename}</p><small>{number.format(Math.ceil(item.size / 1024))} کیلوبایت</small><div className="admin-actions"><a className="admin-text-link" href={sitePath(item.url)} target="_blank" rel="noreferrer">دیدن تصویر</a><button className="admin-link-button admin-danger-text" onClick={() => { setDeleting(item); setDeleteError(""); }}>حذف</button></div></div></article>)}</div> : <p className="admin-empty">هنوز تصویری بارگذاری نشده. با فرم بالا اولین تصویر را اضافه کن.</p>}{deleting && <DeleteDialog title="این تصویر حذف شود؟" description={`تصویر «${deleting.alt || deleting.filename}» حذف می‌شود. تصاویر استفاده‌شده در محتوا باید ابتدا جایگزین شوند.`} busy={deleteBusy} error={deleteError} onCancel={() => setDeleting(null)} onConfirm={remove} />}</section>;
}

function Account({ session, request }: { session: CmsSession; request: CmsRequest }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const values = new FormData(form); const next = String(values.get("newPassword")); setSuccess("");
    if (next !== values.get("confirmPassword")) { setError("تکرار رمز عبور با رمز جدید یکسان نیست."); return; }
    setBusy(true); setError(""); setSuccess("");
    try { await request<void>("password", { method: "PUT", body: JSON.stringify({ currentPassword: values.get("currentPassword"), newPassword: next }) }); form.reset(); setSuccess("رمز عبور تغییر کرد."); } catch (caught) { setError(message(caught)); } finally { setBusy(false); }
  }
  return <section className="admin-account"><h2>حساب کاربری</h2><dl><div><dt>نام مدیر</dt><dd>{session.user.name}</dd></div><div><dt>ایمیل ورود</dt><dd dir="ltr">{session.user.email}</dd></div></dl><h3>تغییر رمز عبور</h3><p className="admin-help">رمز جدید دست‌کم ۱۲ نویسه داشته باشد.</p><form onSubmit={changePassword}><fieldset disabled={busy} className="admin-form-fields"><label className="admin-field"><span>رمز عبور فعلی</span><input type="password" name="currentPassword" autoComplete="current-password" required dir="ltr" /></label><label className="admin-field"><span>رمز عبور جدید</span><input type="password" name="newPassword" autoComplete="new-password" required minLength={12} dir="ltr" /></label><label className="admin-field"><span>تکرار رمز عبور جدید</span><input type="password" name="confirmPassword" autoComplete="new-password" required minLength={12} dir="ltr" /></label><button type="submit" className="admin-button">{busy ? "در حال ذخیره…" : "تغییر رمز عبور"}</button></fieldset>{error && <p className="admin-error" role="alert">{error}</p>}{success && <p className="admin-success" role="status">{success}</p>}</form></section>;
}

export function AdminPanel() {
  const [session, setSession] = useState<CmsSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const [connectionError, setConnectionError] = useState("");
  const [tab, setTab] = useState<Tab>("dashboard");
  const [dirty, setDirty] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const enabled = process.env.NEXT_PUBLIC_CMS_ENABLED === "true";
  const request = useCallback<CmsRequest>(<T,>(path: string, options?: RequestInit) => send<T>(path, options, session?.csrfToken), [session?.csrfToken]);
  const checkSession = useCallback(async () => {
    setLoading(true); setConnectionError(""); setSetupRequired(false);
    try { setSession(await send<CmsSession>("session")); } catch (caught) {
      if (caught instanceof CmsError && (caught.status === 401 || caught.status === 503 && caught.setupRequired)) setSetupRequired(caught.setupRequired);
      else setConnectionError(message(caught));
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { if (enabled) void checkSession(); else setLoading(false); }, [enabled, checkSession]);
  useEffect(() => { if (session && !loading) heading.current?.focus(); }, [tab, session, loading]);
  const dirtyChange = useCallback((value: boolean) => setDirty(value), []);
  function selectTab(next: Tab) { if (next === tab) return; if (dirty && !window.confirm("تغییرات فرم ذخیره نشده‌اند. بدون ذخیره به بخش دیگری می‌روی؟")) return; setDirty(false); setTab(next); }
  async function logout() {
    if (dirty && !window.confirm("تغییرات ذخیره نشده‌اند. بدون ذخیره از حساب خارج می‌شوی؟")) return;
    setLogoutBusy(true); setLogoutError("");
    try { await request<void>("logout", { method: "POST" }); setSession(null); setDirty(false); setTab("dashboard"); } catch (caught) { setLogoutError(message(caught)); } finally { setLogoutBusy(false); }
  }
  if (!enabled) return <Notice title="پنل روی هاست سایت فعال می‌شود"><p>نسخهٔ فعلی روی میزبانی ایستا منتشر شده و به دیتابیس و ورود مدیر متصل نیست.</p><p>برای استفاده از پنل، پروژه باید روی هاست Node.js راه‌اندازی و حساب مدیر ساخته شود.</p></Notice>;
  if (loading) return <Notice title="در حال بررسی ورود"><p role="status">چند لحظه صبر کن…</p></Notice>;
  if (connectionError && !session) return <Notice title="ارتباط با پنل برقرار نشد" retry={checkSession}><p role="alert">{connectionError}</p></Notice>;
  if (!session) return <Login onLogin={(value) => { setSession(value); setTab("dashboard"); }} setupRequired={setupRequired} initialError="" />;
  return <div className="admin-shell"><a className="skip-link" href="#admin-content">رفتن به محتوای پنل</a><aside className="admin-sidebar"><AdminLogo /><nav aria-label="بخش‌های پنل مدیریت">{(Object.entries(tabLabels) as [Tab, string][]).map(([key, label]) => <button key={key} aria-current={tab === key ? "page" : undefined} onClick={() => selectTab(key)}><span>{label}</span>{tab === key && <span className="admin-nav-dot" aria-hidden="true" />}</button>)}</nav><div className="admin-sidebar-bottom"><p>{session.user.name}</p><a href={sitePath("/")} target="_blank" rel="noreferrer">دیدن سایت</a><button className="admin-link-button" disabled={logoutBusy} onClick={logout}>{logoutBusy ? "در حال خروج…" : "خروج از حساب"}</button>{logoutError && <p className="admin-error" role="alert">{logoutError}</p>}</div></aside><div className="admin-workspace"><header className="admin-topbar"><div><span>پنل مدیریت</span><h1 ref={heading} tabIndex={-1}>{tabLabels[tab]}</h1></div><a href={sitePath("/")} target="_blank" rel="noreferrer">باز کردن سایت</a></header><main className="admin-content" id="admin-content">{tab === "dashboard" ? <Dashboard request={request} onSelect={selectTab} /> : tab === "media" ? <MediaLibrary request={request} /> : tab === "account" ? <Account session={session} request={request} /> : <Collection key={tab} collection={tab} request={request} onDirtyChange={dirtyChange} />}</main></div></div>;
}
