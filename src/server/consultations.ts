import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { isIP } from "node:net";
import {
  consultationServiceLabels,
  consultationStatuses,
  type Consultation,
  type ConsultationList,
  type ConsultationPlan,
  type ConsultationService,
  type ConsultationStatus,
} from "@/lib/consultations-shared";
import { getDatabase, listRecords } from "./database";
import { CmsError } from "./errors";
import { object, revision, text } from "./validation";

const planCategoryLabels = { instagram: "مدیریت اینستاگرام", website: "طراحی وب‌سایت", support: "سئو و پشتیبانی" } as const;
const categoryServices = { instagram: "instagram", website: "website", support: "seo" } as const;
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const normalizeDigits = (value: string) => value.replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - 0x06f0)).replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - 0x0660));

function requiredText(value: unknown, label: string, maximum: number, minimum = 1) {
  const result = text(value, label, maximum, minimum).normalize("NFC");
  if (/\u007f/u.test(result)) throw new CmsError(400, `مقدار «${label}» معتبر نیست.`);
  return result;
}

function contactValue(value: unknown): { contact: string; contactKind: Consultation["contactKind"] } {
  const supplied = normalizeDigits(requiredText(value, "شماره تماس یا ایمیل", 254));
  if (supplied.includes("@")) {
    const email = supplied.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new CmsError(400, "نشانی ایمیل معتبر نیست.");
    return { contact: email, contactKind: "email" };
  }
  let phone = supplied.replace(/[\s().\u2010-\u2015-]/g, "");
  if (/^0[1-9]\d{9}$/.test(phone)) phone = `+98${phone.slice(1)}`;
  else if (/^9\d{9}$/.test(phone)) phone = `+98${phone}`;
  else if (/^98[1-9]\d{9}$/.test(phone)) phone = `+${phone}`;
  else if (/^00[1-9]\d{7,14}$/.test(phone)) phone = `+${phone.slice(2)}`;
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) throw new CmsError(400, "شماره تماس معتبر نیست؛ شماره ایران را با صفر یا شماره بین‌المللی را با + وارد کنید.");
  return { contact: phone, contactKind: "phone" };
}

function serviceValue(value: unknown): ConsultationService {
  if (typeof value !== "string" || !Object.hasOwn(consultationServiceLabels, value)) throw new CmsError(400, "خدمت مورد نظر را انتخاب کنید.");
  return value as ConsultationService;
}

function statusValue(value: unknown): ConsultationStatus {
  if (typeof value !== "string" || !consultationStatuses.includes(value as ConsultationStatus)) throw new CmsError(400, "وضعیت درخواست معتبر نیست.");
  return value as ConsultationStatus;
}

function selectedPlan(value: unknown): Pick<ConsultationPlan, "id" | "categoryId"> | null {
  if (value === undefined || value === null) return null;
  const supplied = object(value, "پلن");
  const id = requiredText(supplied.id, "شناسه پلن", 100);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || typeof supplied.categoryId !== "string" || !Object.hasOwn(planCategoryLabels, supplied.categoryId)) throw new CmsError(400, "پلن انتخاب‌شده معتبر نیست؛ دوباره انتخاب کنید.");
  return { id, categoryId: supplied.categoryId as ConsultationPlan["categoryId"] };
}

function resolvePlan(selection: ReturnType<typeof selectedPlan>, service: ConsultationService): ConsultationPlan | null {
  if (!selection) return null;
  const plan = listRecords("plans", true).find(record => record.data.id === selection.id && record.data.categoryId === selection.categoryId)?.data;
  if (!plan || categoryServices[selection.categoryId] !== service) throw new CmsError(400, "پلن انتخاب‌شده دیگر در دسترس نیست یا با خدمت انتخاب‌شده همخوانی ندارد؛ دوباره انتخاب کنید.");
  return { ...selection, name: String(plan.name), categoryLabel: planCategoryLabels[selection.categoryId], isMock: plan.isMock === true };
}

function consumeSubmissionAttempt(contact: string, request: Request) {
  const db = getDatabase();
  const now = Date.now();
  const buckets = [{ key: `contact:${hash(contact)}`, maximum: 3 }, { key: "global", maximum: 200 }];
  // This header is ignored unless the operator explicitly trusts their reverse proxy.
  const address = process.env.CMS_TRUST_PROXY === "true" ? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() : undefined;
  if (address && isIP(address)) buckets.push({ key: `address:${hash(address)}`, maximum: 12 });
  db.prepare("DELETE FROM cms_consultation_attempts WHERE expires_at<=?").run(now);
  for (const bucket of buckets) {
    const existing = db.prepare("SELECT attempts FROM cms_consultation_attempts WHERE key=?").get(bucket.key);
    if (existing && Number(existing.attempts) >= bucket.maximum) throw new CmsError(429, "تعداد درخواست‌ها زیاد شده است؛ ۱۵ دقیقه بعد دوباره تلاش کنید یا از راه‌های تماس مستقیم استفاده کنید.");
  }
  const increment = db.prepare("INSERT INTO cms_consultation_attempts(key,attempts,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=attempts+1");
  for (const bucket of buckets) increment.run(bucket.key, now + 15 * 60 * 1000);
}

function fromRow(row: Record<string, unknown>): Consultation {
  return {
    id: String(row.id), reference: String(row.reference), name: String(row.name), contact: String(row.contact),
    contactKind: row.contact_kind as Consultation["contactKind"], service: row.service as ConsultationService,
    message: String(row.message), plan: row.plan === null ? null : JSON.parse(String(row.plan)) as ConsultationPlan,
    status: row.status as ConsultationStatus, note: String(row.note), revision: Number(row.revision),
    createdAt: String(row.created_at), updatedAt: String(row.updated_at),
  };
}

/** The anonymous response contains only a receipt, never stored contact information or a public lookup URL. */
export function submitConsultation(value: unknown, request: Request): { reference: string } {
  const supplied = object(value);
  if (typeof supplied.website !== "string" || supplied.website.length > 200 || supplied.website.trim()) throw new CmsError(400, "درخواست معتبر نیست؛ فرم را دوباره ارسال کنید.");
  const requestId = requiredText(supplied.requestId, "شناسه درخواست", 36).toLowerCase();
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(requestId)) throw new CmsError(400, "شناسه درخواست معتبر نیست؛ فرم را دوباره باز کنید.");
  const data = {
    name: requiredText(supplied.name, "نام", 80, 2),
    ...contactValue(supplied.contact),
    service: serviceValue(supplied.service),
    message: requiredText(supplied.message, "توضیحات", 2000, 10),
    plan: selectedPlan(supplied.plan),
  };
  const payloadHash = hash(JSON.stringify(data));
  const db = getDatabase();
  db.exec("BEGIN IMMEDIATE");
  try {
    // Separate receipts preserve retry idempotency even if an administrator later deletes the request.
    const prior = db.prepare("SELECT reference,payload_hash FROM cms_consultation_receipts WHERE request_id=?").get(requestId);
    if (prior) {
      if (String(prior.payload_hash) !== payloadHash) throw new CmsError(409, "این شناسه برای درخواست دیگری استفاده شده است؛ فرم را برای درخواست تازه باز کنید.");
      db.exec("COMMIT");
      return { reference: String(prior.reference) };
    }
    const plan = resolvePlan(data.plan, data.service);
    consumeSubmissionAttempt(data.contact, request);
    const reference = `ELT-${randomBytes(8).toString("hex").toUpperCase()}`;
    const now = new Date().toISOString();
    db.prepare("INSERT INTO cms_consultations(id,reference,name,contact,contact_kind,service,message,plan,status,note,revision,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,'new','',1,?,?)")
      .run(randomUUID(), reference, data.name, data.contact, data.contactKind, data.service, data.message, plan ? JSON.stringify(plan) : null, now, now);
    db.prepare("INSERT INTO cms_consultation_receipts(request_id,payload_hash,reference,created_at) VALUES(?,?,?,?)").run(requestId, payloadHash, reference, now);
    db.exec("COMMIT");
    return { reference };
  } catch (error) { db.exec("ROLLBACK"); throw error; }
}

function pageNumber(value: string | null, fallback: number, maximum: number) {
  if (value === null || value === "") return fallback;
  const number = Number(value);
  if (!/^[0-9]+$/.test(value) || !Number.isSafeInteger(number) || number < 1 || number > maximum) throw new CmsError(400, "شماره صفحه یا تعداد درخواست‌ها معتبر نیست.");
  return number;
}

export function listConsultations(params: URLSearchParams): ConsultationList {
  const filter = params.get("status") || "all";
  if (filter !== "all") statusValue(filter);
  const query = normalizeDigits((params.get("q") || "").trim().slice(0, 120));
  const page = pageNumber(params.get("page"), 1, 1_000_000);
  const pageSize = pageNumber(params.get("pageSize"), 20, 50);
  const where: string[] = [];
  const values: string[] = [];
  if (filter !== "all") { where.push("status=?"); values.push(filter); }
  if (query) {
    const term = `%${query.replace(/[\\%_]/g, character => `\\${character}`)}%`;
    where.push("(name LIKE ? ESCAPE '\\' OR contact LIKE ? ESCAPE '\\' OR reference LIKE ? ESCAPE '\\' OR message LIKE ? ESCAPE '\\')");
    values.push(term, term, term, term);
  }
  const condition = where.length ? ` WHERE ${where.join(" AND ")}` : "";
  const db = getDatabase();
  const counts: ConsultationList["counts"] = { total: 0, new: 0, contacted: 0, completed: 0, archived: 0 };
  for (const row of db.prepare("SELECT status,COUNT(*) AS total FROM cms_consultations GROUP BY status").all()) {
    const count = Number(row.total);
    counts[row.status as ConsultationStatus] = count;
    counts.total += count;
  }
  const total = Number(db.prepare(`SELECT COUNT(*) AS total FROM cms_consultations${condition}`).get(...values)!.total);
  const requests = db.prepare(`SELECT * FROM cms_consultations${condition} ORDER BY created_at DESC,id ASC LIMIT ? OFFSET ?`).all(...values, pageSize, (page - 1) * pageSize).map(fromRow);
  return { requests, counts, total, page, pageSize };
}

export function updateConsultation(id: string, value: unknown): Consultation {
  const supplied = object(value);
  const status = statusValue(supplied.status);
  const note = requiredText(supplied.note, "یادداشت داخلی", 4000, 0);
  const expectedRevision = revision(supplied.revision);
  const db = getDatabase();
  db.exec("BEGIN IMMEDIATE");
  try {
    const existing = db.prepare("SELECT revision FROM cms_consultations WHERE id=?").get(id);
    if (!existing) throw new CmsError(404, "درخواست مشاوره پیدا نشد؛ فهرست را تازه کنید.");
    if (Number(existing.revision) !== expectedRevision) throw new CmsError(409, "این درخواست در جای دیگری تغییر کرده است؛ فهرست را تازه کنید.");
    db.prepare("UPDATE cms_consultations SET status=?,note=?,revision=revision+1,updated_at=? WHERE id=?").run(status, note, new Date().toISOString(), id);
    const saved = fromRow(db.prepare("SELECT * FROM cms_consultations WHERE id=?").get(id)!);
    db.exec("COMMIT");
    return saved;
  } catch (error) { db.exec("ROLLBACK"); throw error; }
}

export function deleteConsultation(id: string, expectedRevision: number) {
  const db = getDatabase();
  db.exec("BEGIN IMMEDIATE");
  try {
    const existing = db.prepare("SELECT revision FROM cms_consultations WHERE id=?").get(id);
    if (!existing) throw new CmsError(404, "درخواست مشاوره پیدا نشد؛ فهرست را تازه کنید.");
    if (Number(existing.revision) !== expectedRevision) throw new CmsError(409, "این درخواست در جای دیگری تغییر کرده است؛ فهرست را تازه کنید.");
    db.prepare("DELETE FROM cms_consultations WHERE id=?").run(id);
    db.exec("COMMIT");
  } catch (error) { db.exec("ROLLBACK"); throw error; }
}
