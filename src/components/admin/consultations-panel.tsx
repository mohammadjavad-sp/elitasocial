"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { consultationServiceLabels, consultationStatusLabels, consultationStatuses, type Consultation, type ConsultationList, type ConsultationStatus } from "../../lib/consultations-shared";
import type { CmsRequest } from "./record-editor";

type StatusFilter = "all" | ConsultationStatus;
const number = new Intl.NumberFormat("fa-IR");
const dateFormat = new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" });
function date(value: string) { const parsed = new Date(value); return Number.isNaN(parsed.valueOf()) ? "—" : dateFormat.format(parsed); }
function errorMessage(error: unknown) { return error instanceof Error ? error.message : "ارتباط انجام نشد. دوباره تلاش کن."; }
function contactUrl(item: Consultation) { return item.contactKind === "email" ? `mailto:${encodeURIComponent(item.contact).replace(/%40/g, "@")}` : `tel:${item.contact}`; }

function ConsultationDetails({ item, request, onClose, onChanged, onDirtyChange }: {
  item: Consultation;
  request: CmsRequest;
  onClose: () => void;
  onChanged: (deleted: boolean) => void;
  onDirtyChange: (value: boolean) => void;
}) {
  const [snapshot, setSnapshot] = useState(item);
  const [status, setStatus] = useState(item.status);
  const [note, setNote] = useState(item.note);
  const [busy, setBusy] = useState<"save" | "delete" | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(true);
  const dirty = status !== snapshot.status || note !== snapshot.note;

  useEffect(() => {
    mounted.current = true;
    const element = dialog.current;
    element?.showModal();
    heading.current?.focus();
    return () => { mounted.current = false; element?.close(); };
  }, []);
  useEffect(() => { onDirtyChange(dirty); }, [dirty, onDirtyChange]);
  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) { if (dirty || busy) { event.preventDefault(); event.returnValue = ""; } }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty, busy]);

  function close() {
    if (busy) return;
    if (dirty && !window.confirm("وضعیت یا یادداشت ذخیره نشده‌اند. بدون ذخیره این درخواست را می‌بندی؟")) return;
    onDirtyChange(false);
    onClose();
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !dirty) return;
    setBusy("save"); setError(""); setSuccess("");
    try {
      const updated = await request<Consultation>(`consultations/${snapshot.id}`, { method: "PUT", body: JSON.stringify({ status, note, revision: snapshot.revision }) });
      if (!mounted.current) return;
      setSnapshot(updated); setStatus(updated.status); setNote(updated.note); onDirtyChange(false);
      setSuccess("وضعیت و یادداشت خصوصی ذخیره شدند."); onChanged(false);
    } catch (caught) { if (mounted.current) setError(errorMessage(caught)); }
    finally { if (mounted.current) setBusy(null); }
  }
  async function remove() {
    if (busy || !window.confirm(`درخواست «${snapshot.reference}» از ${snapshot.name} برای همیشه حذف شود؟ متن پیام و یادداشت خصوصی هم حذف می‌شوند.`)) return;
    setBusy("delete"); setError(""); setSuccess("");
    try {
      await request<void>(`consultations/${snapshot.id}`, { method: "DELETE", body: JSON.stringify({ revision: snapshot.revision }) });
      if (!mounted.current) return;
      onDirtyChange(false); onChanged(true); onClose();
    } catch (caught) { if (mounted.current) setError(errorMessage(caught)); }
    finally { if (mounted.current) setBusy(null); }
  }

  return <dialog ref={dialog} className="admin-consultation-dialog" aria-labelledby="consultation-title" onCancel={(event) => { event.preventDefault(); close(); }}>
    <div className="admin-consultation-detail-heading"><div><span className={`admin-status admin-consultation-status-${snapshot.status}`}>{consultationStatusLabels[snapshot.status]}</span><h2 id="consultation-title" ref={heading} tabIndex={-1}>{snapshot.name}</h2><p className="admin-help">کد پیگیری: <bdi>{snapshot.reference}</bdi></p></div><button type="button" className="admin-button admin-secondary" onClick={close} disabled={Boolean(busy)}>بستن جزئیات</button></div>
    <dl className="admin-consultation-meta">
      <div><dt>راه ارتباطی</dt><dd><a className="admin-text-link" href={contactUrl(snapshot)}><bdi dir="ltr">{snapshot.contact}</bdi></a></dd></div>
      <div><dt>خدمت موردنظر</dt><dd>{consultationServiceLabels[snapshot.service]}</dd></div>
      <div><dt>زمان ثبت</dt><dd><time dateTime={snapshot.createdAt}>{date(snapshot.createdAt)}</time></dd></div>
      <div><dt>آخرین تغییر</dt><dd><time dateTime={snapshot.updatedAt}>{date(snapshot.updatedAt)}</time></dd></div>
    </dl>
    {snapshot.plan && <section className="admin-consultation-plan"><h3>پلن انتخاب‌شده</h3><p>{snapshot.plan.name} <span>· {snapshot.plan.categoryLabel}</span></p>{snapshot.plan.isMock && <span className="admin-mock">پلن نمایشی در زمان ثبت درخواست</span>}</section>}
    <section className="admin-consultation-message"><h3>پیام کاربر</h3><p>{snapshot.message || "کاربر توضیحی ننوشته است."}</p></section>
    <form onSubmit={save}><fieldset className="admin-form-fields" disabled={Boolean(busy)}>
      <label className="admin-field"><span>وضعیت پیگیری</span><select value={status} onChange={(event) => { setStatus(event.target.value as ConsultationStatus); setSuccess(""); }}>{consultationStatuses.map((value) => <option key={value} value={value}>{consultationStatusLabels[value]}</option>)}</select></label>
      <label className="admin-field"><span>یادداشت خصوصی مدیر</span><textarea rows={5} maxLength={4000} value={note} aria-describedby="consultation-note-help" onChange={(event) => { setNote(event.target.value); setSuccess(""); }} /><small id="consultation-note-help">فقط در پنل نمایش داده می‌شود و برای کاربر ارسال نمی‌شود. {number.format(note.length)} از {number.format(4000)} نویسه</small></label>
      <div className="admin-save-bar"><button className="admin-button" type="submit" disabled={!dirty || Boolean(busy)}>{busy === "save" ? "در حال ذخیره…" : "ذخیرهٔ پیگیری"}</button><span className="admin-help" role="status">{dirty ? "تغییرات ذخیره نشده‌اند." : "تغییر ذخیره‌نشده‌ای نداری."}</span></div>
    </fieldset></form>
    {error && <div className="admin-error" role="alert"><p>{error}</p><p>تغییرات فرم حفظ شده‌اند. اگر درخواست در پنجرهٔ دیگری ویرایش شده، ابتدا یادداشتت را نگه دار، سپس جزئیات را ببند و فهرست را تازه‌سازی کن.</p></div>}
    {success && <p className="admin-success" role="status">{success}</p>}
    <div className="admin-consultation-delete"><p>برای نگهداری سوابق، می‌توانی وضعیت را به «بایگانی شده» تغییر بدهی.</p><button type="button" className="admin-link-button admin-danger-text" disabled={Boolean(busy)} onClick={remove}>{busy === "delete" ? "در حال حذف…" : "حذف دائمی درخواست"}</button></div>
  </dialog>;
}

export function ConsultationsPanel({ request, onDirtyChange, onNewCount }: { request: CmsRequest; onDirtyChange: (value: boolean) => void; onNewCount: (count: number) => void }) {
  const [data, setData] = useState<ConsultationList | null>(null);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selected, setSelected] = useState<Consultation | null>(null);
  const sequence = useRef(0);
  const listHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const current = ++sequence.current;
    const controller = new AbortController();
    async function load() {
      setLoading(true); setError("");
      const params = new URLSearchParams({ status, q: query, page: String(page), pageSize: "20" });
      try {
        const result = await request<ConsultationList>(`consultations?${params}`, { signal: controller.signal });
        if (controller.signal.aborted || current !== sequence.current) return;
        const lastPage = Math.max(1, Math.ceil(result.total / result.pageSize));
        if (page > lastPage) { setPage(lastPage); return; }
        setData(result); onNewCount(result.counts.new);
      } catch (caught) { if (!controller.signal.aborted && current === sequence.current) setError(errorMessage(caught)); }
      finally { if (!controller.signal.aborted && current === sequence.current) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [request, status, query, page, version, onNewCount]);

  const close = useCallback(() => { setSelected(null); requestAnimationFrame(() => listHeading.current?.focus()); }, []);
  function searchRequests(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setPage(1); setQuery(search.trim()); setVersion((current) => current + 1); setSuccess(""); }
  function selectStatus(next: StatusFilter) { setStatus(next); setPage(1); setSuccess(""); }
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return <section className="admin-consultations">
    <div className="admin-section-heading"><div><h2 ref={listHeading} tabIndex={-1}>درخواست‌های مشاوره</h2><p className="admin-help">درخواست‌های ثبت‌شده در سایت را ببین، تماس بگیر و وضعیت پیگیری را به‌روز کن.</p></div><button type="button" className="admin-button admin-secondary" disabled={loading} onClick={() => setVersion((current) => current + 1)}>{loading ? "در حال دریافت…" : "تازه‌سازی درخواست‌ها"}</button></div>
    <div className="admin-consultation-filters" aria-label="فیلتر وضعیت درخواست‌ها">{(["all", ...consultationStatuses] as StatusFilter[]).map((value) => <button key={value} type="button" aria-pressed={status === value} onClick={() => selectStatus(value)}><span>{value === "all" ? "همهٔ درخواست‌ها" : consultationStatusLabels[value]}</span><span className="admin-consultation-count">{data ? number.format(value === "all" ? data.counts.total : data.counts[value]) : "…"}</span></button>)}</div>
    <form className="admin-consultation-search" onSubmit={searchRequests}><label className="admin-field"><span>جست‌وجوی درخواست‌ها</span><input type="search" value={search} maxLength={120} placeholder="نام، شماره، ایمیل یا کد پیگیری" onChange={(event) => setSearch(event.target.value)} /></label><button type="submit" className="admin-button admin-secondary" disabled={loading}>جست‌وجو</button>{query && <button type="button" className="admin-link-button" disabled={loading} onClick={() => { setSearch(""); setQuery(""); setPage(1); }}>پاک‌کردن جست‌وجو</button>}</form>
    {error && <p className="admin-error" role="alert">{error}</p>}
    {success && <p className="admin-success" role="status">{success}</p>}
    <div aria-busy={loading} className="admin-consultation-results">
      {loading ? <p className="admin-empty" role="status">در حال دریافت درخواست‌ها…</p> : error ? <div className="admin-empty"><p>فهرست درخواست‌ها دریافت نشد.</p><button type="button" className="admin-button admin-secondary" onClick={() => setVersion((current) => current + 1)}>تلاش دوباره</button></div> : !data?.requests.length ? <div className="admin-empty"><h3>{query || status !== "all" ? "درخواستی با این فیلتر پیدا نشد" : "هنوز درخواست مشاوره‌ای ثبت نشده"}</h3><p>{query || status !== "all" ? "عبارت جست‌وجو یا وضعیت را تغییر بده." : "درخواست‌های کاربران پس از ثبت فرم مشاوره، اینجا نمایش داده می‌شوند."}</p></div> : <>
        <p className="admin-consultation-result-count" role="status">{number.format(data.total)} درخواست{query && <> برای «{query}»</>}</p>
        <div className="admin-consultation-list">{data.requests.map((item) => <article className="admin-consultation-card" key={item.id}><div className="admin-consultation-card-copy"><div className="admin-record-badges"><span className={`admin-status admin-consultation-status-${item.status}`}>{consultationStatusLabels[item.status]}</span><span className="admin-consultation-reference"><bdi>{item.reference}</bdi></span></div><h3>{item.name}</h3><p className="admin-consultation-service">{consultationServiceLabels[item.service]}{item.plan && <> · پلن {item.plan.name}</>}</p><p className="admin-consultation-preview">{item.message || "بدون توضیح تکمیلی"}</p><div className="admin-consultation-card-meta"><a href={contactUrl(item)}><bdi dir="ltr">{item.contact}</bdi></a><time dateTime={item.createdAt}>{date(item.createdAt)}</time></div></div><button type="button" className="admin-button admin-secondary" aria-label={`مشاهده و پیگیری درخواست ${item.name}، ${item.reference}`} onClick={() => { setSelected(item); setSuccess(""); }}>مشاهده و پیگیری</button></article>)}</div>
        <nav className="admin-consultation-pagination" aria-label="صفحه‌بندی درخواست‌ها"><button className="admin-button admin-secondary" type="button" disabled={page <= 1} onClick={() => { setPage((current) => current - 1); listHeading.current?.focus(); }}>صفحهٔ قبل</button><span>صفحهٔ {number.format(page)} از {number.format(pages)}</span><button className="admin-button admin-secondary" type="button" disabled={page >= pages} onClick={() => { setPage((current) => current + 1); listHeading.current?.focus(); }}>صفحهٔ بعد</button></nav>
      </>}
    </div>
    {selected && <ConsultationDetails key={selected.id} item={selected} request={request} onClose={close} onDirtyChange={onDirtyChange} onChanged={(deleted) => { setVersion((current) => current + 1); if (deleted) setSuccess("درخواست مشاوره حذف شد."); }} />}
  </section>;
}
