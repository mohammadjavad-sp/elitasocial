import "server-only";
import { assertCsrf, assertOrigin, changePassword, clearSessionCookie, getSession, login, logout, requireSession } from "./auth";
import { deleteRecord, getDatabase, listMedia, listRecords, saveRecord } from "./database";
import { CmsError } from "./errors";
import { deleteMedia, maxUploadBytes, serveMedia, uploadMedia } from "./media";
import { collection, object, revision, status, text, validateRecord } from "./validation";
import { readSiteSettings, saveSiteSettings } from "./site-settings";
import { deleteConsultation, listConsultations, submitConsultation, updateConsultation } from "./consultations";

const privateHeaders = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "same-origin" };
function responseHeaders(additions?: HeadersInit) {
  const headers = new Headers(privateHeaders);
  new Headers(additions).forEach((value, key) => headers.set(key, value));
  return headers;
}
function json(value: unknown, code = 200, headers?: HeadersInit) { return Response.json(value, { status: code, headers: responseHeaders(headers) }); }
function empty(headers?: HeadersInit) { return new Response(null, { status: 204, headers: responseHeaders(headers) }); }
function passwordText(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length < 1 || value.length > 128 || value.includes("\0")) throw new CmsError(400, `مقدار «${field}» معتبر نیست.`);
  return value;
}

/** Limit streamed bodies too; a missing or dishonest Content-Length cannot bypass upload limits. */
async function bytes(request: Request, maximum: number): Promise<Uint8Array<ArrayBuffer>> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maximum) throw new CmsError(413, "حجم درخواست بیش از حد مجاز است.");
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  // A client must not retain an upload/parser slot indefinitely by sending an
  // unfinished body. The byte cap still applies to chunked requests.
  let interrupted: CmsError | undefined;
  const cancelBody = () => {
    interrupted = new CmsError(408, "دریافت درخواست کامل نشد؛ دوباره تلاش کنید.");
    void reader.cancel().catch(() => undefined);
  };
  const timer = setTimeout(cancelBody, 30_000);
  timer.unref();
  request.signal.addEventListener("abort", cancelBody, { once: true });
  try {
    if (request.signal.aborted) throw new CmsError(408, "دریافت درخواست کامل نشد؛ دوباره تلاش کنید.");
    for (;;) {
      const { done, value } = await reader.read();
      if (interrupted) throw interrupted;
      if (done) break;
      total += value.byteLength;
      if (total > maximum) throw new CmsError(413, "حجم درخواست بیش از حد مجاز است.");
      chunks.push(value);
    }
  } catch (error) {
    throw interrupted || error;
  } finally {
    clearTimeout(timer);
    request.signal.removeEventListener("abort", cancelBody);
    // Do not wait on a malicious stream's cancel callback.
    void reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.byteLength; }
  return result;
}

async function body(request: Request, maximum = 220_000) {
  if (!/^application\/json(?:;|$)/i.test(request.headers.get("content-type") || "")) throw new CmsError(415, "درخواست باید از نوع JSON باشد.");
  try { return object(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(await bytes(request, maximum)))); }
  catch (error) { if (error instanceof CmsError) throw error; throw new CmsError(400, "متن درخواست معتبر نیست."); }
}

type RouteContext = { params: Promise<{ segments: string[] }> };

export async function handleCmsRequest(request: Request, context: RouteContext): Promise<Response> {
  try {
    const { segments } = await context.params;
    if (!segments || segments.length > 4) throw new CmsError(404, "مسیر پیدا نشد.");
    const method = request.method.toUpperCase() === "HEAD" ? "GET" : request.method.toUpperCase();
    const [resource, second, third] = segments;
    if (method === "GET" && resource === "files" && segments.length === 2) return serveMedia(second);
    if (method !== "GET") assertOrigin(request);
    if (method === "POST" && resource === "consultations" && segments.length === 1) return json(submitConsultation(await body(request, 16_000), request), 201);
    if (method === "POST" && resource === "login" && segments.length === 1) {
      const payload = await body(request, 16_000);
      const email = text(payload.email, "ایمیل", 254).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new CmsError(400, "نشانی ایمیل معتبر نیست.");
      const password = passwordText(payload.password, "رمز عبور");
      const result = await login(email, password, request);
      return json(result.session, 200, { "Set-Cookie": result.cookie });
    }
    if (method === "GET" && resource === "session" && segments.length === 1) {
      const auth = getSession(request);
      return auth ? json(auth.session) : json({ error: "برای ادامه وارد پنل شوید.", message: "برای ادامه وارد پنل شوید." }, 401);
    }
    const auth = requireSession(request);
    if (method !== "GET") assertCsrf(request, auth);
    if (resource === "logout" && method === "POST" && segments.length === 1) { logout(auth); return empty({ "Set-Cookie": clearSessionCookie() }); }
    if (resource === "password" && method === "PUT" && segments.length === 1) {
      const payload = await body(request, 16_000);
      await changePassword(auth, passwordText(payload.currentPassword, "رمز فعلی"), passwordText(payload.newPassword, "رمز تازه"));
      return empty();
    }
    if (resource === "settings" && segments.length === 1 && method === "GET") return json(readSiteSettings());
    if (resource === "settings" && segments.length === 1 && method === "PUT") {
      const payload = await body(request, 160_000);
      return json(saveSiteSettings(payload.data, revision(payload.revision)));
    }
    if (resource === "consultations" && segments.length === 1 && method === "GET") return json(listConsultations(new URL(request.url).searchParams));
    if (resource === "consultations" && segments.length === 2 && method === "PUT") return json(updateConsultation(text(second, "شناسه", 100), await body(request, 24_000)));
    if (resource === "consultations" && segments.length === 2 && method === "DELETE") {
      const payload = await body(request, 1000);
      deleteConsultation(text(second, "شناسه", 100), revision(payload.revision));
      return empty();
    }
    if (resource === "stats" && method === "GET" && segments.length === 1) {
      const counts = { articles: 0, services: 0, portfolio: 0, plans: 0, media: 0, consultations: 0, newConsultations: 0 };
      for (const row of getDatabase().prepare("SELECT collection,COUNT(*) AS total FROM cms_records GROUP BY collection").all()) counts[collection(row.collection)] = Number(row.total);
      counts.media = Number(getDatabase().prepare("SELECT COUNT(*) AS total FROM cms_media").get()!.total);
      counts.consultations = Number(getDatabase().prepare("SELECT COUNT(*) AS total FROM cms_consultations").get()!.total);
      counts.newConsultations = Number(getDatabase().prepare("SELECT COUNT(*) AS total FROM cms_consultations WHERE status='new'").get()!.total);
      return json({ counts });
    }
    if (resource === "records" && (segments.length === 2 || segments.length === 3)) {
      const kind = collection(second);
      if (segments.length === 2 && method === "GET") return json({ records: listRecords(kind) });
      if (segments.length === 2 && method === "POST") {
        const payload = await body(request);
        return json(saveRecord(kind, validateRecord(kind, payload.data), status(payload.status)), 201);
      }
      if (segments.length === 3 && method === "PUT") {
        const payload = await body(request);
        return json(saveRecord(kind, validateRecord(kind, payload.data), status(payload.status), text(third, "شناسه", 100), revision(payload.revision)));
      }
      if (segments.length === 3 && method === "DELETE") { const payload = await body(request); deleteRecord(kind, text(third, "شناسه", 100), revision(payload.revision)); return empty(); }
    }
    if (resource === "media" && segments.length === 1 && method === "GET") return json({ media: listMedia() });
    if (resource === "media" && segments.length === 1 && method === "POST") {
      if (!/^multipart\/form-data;/i.test(request.headers.get("content-type") || "")) throw new CmsError(415, "تصویر را با فرم بارگذاری ارسال کنید.");
      const payloadBytes = await bytes(request, maxUploadBytes + 65_536);
      const copy = new Request(request.url, { method: "POST", headers: { "content-type": request.headers.get("content-type")! }, body: payloadBytes });
      let payload: FormData;
      try { payload = await copy.formData(); } catch { throw new CmsError(400, "فرم بارگذاری معتبر نیست."); }
      const file = payload.get("file");
      if (!(file instanceof File)) throw new CmsError(400, "یک فایل تصویر انتخاب کنید.");
      return json(await uploadMedia(file, payload.get("alt")), 201);
    }
    if (resource === "media" && segments.length === 2 && method === "DELETE") { deleteMedia(text(second, "شناسه", 100)); return empty(); }
    throw new CmsError(404, "مسیر یا روش درخواست پشتیبانی نمی‌شود.");
  } catch (error) {
    if (error instanceof CmsError) return json({ error: error.message, message: error.message }, error.status, error.status === 429 ? { "Retry-After": "900" } : undefined);
    // Never return database paths, password fields or raw SQL errors to the browser.
    console.error("CMS operation failed", error instanceof Error ? error.name : "UnknownError");
    return json({ error: "ذخیره‌سازی انجام نشد؛ دوباره تلاش کنید یا گزارش سرور را بررسی کنید.", message: "ذخیره‌سازی انجام نشد؛ دوباره تلاش کنید یا گزارش سرور را بررسی کنید." }, 500);
  }
}
