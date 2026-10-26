/** Run with: node --conditions=react-server --import tsx --test scripts/check-cms-security.test.ts */
import assert from "node:assert/strict";
import { mkdtempSync, readdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import test from "node:test";

// Deliberately never load .env.local or use the workspace's real database.
process.env.CMS_DATA_DIR = mkdtempSync(path.join(os.tmpdir(), "elita-cms-security-"));
process.env.DEPLOY_TARGET = "node";
process.env.CMS_ORIGIN = "https://example.test";
process.env.CMS_TRUST_PROXY = "false";
process.env.CMS_COOKIE_SECURE = "true";
Object.assign(process.env, { NODE_ENV: "production" });

const origin = "https://example.test";
const email = "security-test@example.test";
const password = "TestPassword-2048";

test("CMS security boundaries use an isolated database", async t => {
  const { handleCmsRequest } = await import("../src/server/cms-api");
  const { createAdministrator, login, passwordHash } = await import("../src/server/auth");
  const { getDatabase } = await import("../src/server/database");
  const { uploadMedia, serveMedia } = await import("../src/server/media");
  const sharp = (await import("sharp")).default;

  function call(resource: string, method = "GET", value?: unknown, headers: Record<string, string> = {}) {
    const request = new Request(`${origin}/api/cms/${resource}`, {
      method,
      headers: { origin, ...(value === undefined ? {} : { "content-type": "application/json" }), ...headers },
      ...(value === undefined ? {} : { body: JSON.stringify(value) }),
    });
    return handleCmsRequest(request, { params: Promise.resolve({ segments: resource.split("/") }) });
  }
  createAdministrator(email, password, "Security Test");
  const authenticated = await call("login", "POST", { email, password });
  assert.equal(authenticated.status, 200);
  const session = await authenticated.json();
  const setCookie = authenticated.headers.get("set-cookie")!;
  const cookie = setCookie.split(";")[0];
  const authHeaders = { cookie, "x-csrf-token": session.csrfToken };

  await t.test("authentication cookies and private responses cannot be cached", async () => {
    for (const option of ["HttpOnly", "Secure", "SameSite=Lax", "Max-Age=28800"]) assert.ok(setCookie.includes(option));
    const response = await call("session", "GET", undefined, { cookie });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal((await call("consultations")).status, 401);
  });

  await t.test("origin and CSRF are checked before mutations", async () => {
    assert.equal((await call("settings", "PUT", {}, { ...authHeaders, origin: "https://attacker.test" })).status, 403);
    assert.equal((await call("settings", "PUT", {}, { cookie })).status, 403);
    assert.equal((await call("settings", "PUT", {}, { ...authHeaders, "sec-fetch-site": "cross-site" })).status, 403);
  });

  await t.test("streaming limits do not trust Content-Length", async () => {
    let cancelled = false;
    const stream = new ReadableStream({
      start(controller) { controller.enqueue(new Uint8Array(16_001)); },
      cancel() { cancelled = true; },
    });
    const request = new Request(`${origin}/api/cms/login`, {
      method: "POST", headers: { origin, "content-type": "application/json", "content-length": "1" },
      body: stream, duplex: "half",
    } as RequestInit);
    const response = await handleCmsRequest(request, { params: Promise.resolve({ segments: ["login"] }) });
    assert.equal(response.status, 413);
    assert.equal(cancelled, true);
  });

  await t.test("aborted, unfinished bodies are cancelled promptly", async () => {
    const abort = new AbortController();
    let cancelled = false;
    const request = new Request(`${origin}/api/cms/login`, {
      method: "POST", headers: { origin, "content-type": "application/json" }, signal: abort.signal,
      body: new ReadableStream({ cancel() { cancelled = true; } }), duplex: "half",
    } as RequestInit);
    const pending = handleCmsRequest(request, { params: Promise.resolve({ segments: ["login"] }) });
    setTimeout(() => abort.abort(), 10);
    assert.equal((await pending).status, 408);
    assert.equal(cancelled, true);
  });

  await t.test("unfinished bodies have an absolute 30-second deadline", async child => {
    child.mock.timers.enable({ apis: ["setTimeout"] });
    let cancelled = false;
    const request = new Request(`${origin}/api/cms/login`, {
      method: "POST", headers: { origin, "content-type": "application/json" },
      body: new ReadableStream({ cancel() { cancelled = true; } }), duplex: "half",
    } as RequestInit);
    const pending = handleCmsRequest(request, { params: Promise.resolve({ segments: ["login"] }) });
    await Promise.resolve();
    child.mock.timers.tick(30_000);
    assert.equal((await pending).status, 408);
    assert.equal(cancelled, true);
    child.mock.timers.reset();
  });

  await t.test("password verification yields to the event loop", async () => {
    let timerRan = false;
    const timer = setTimeout(() => { timerRan = true; }, 0);
    await login(email, password, new Request(origin));
    clearTimeout(timer);
    assert.equal(timerRan, true, "scrypt must not block unrelated requests");
  });

  await t.test("resetting a password during verification cannot create a stale session", async () => {
    const db = getDatabase();
    const before = Number(db.prepare("SELECT COUNT(*) AS total FROM cms_sessions").get()!.total);
    const pending = login(email, password, new Request(origin));
    const nextHash = passwordHash("DifferentPassword-2048");
    db.prepare("UPDATE cms_users SET password_hash=? WHERE email=?").run(nextHash, email);
    await assert.rejects(pending, error => (error as { status?: number }).status === 401);
    assert.equal(Number(db.prepare("SELECT COUNT(*) AS total FROM cms_sessions").get()!.total), before);
    db.prepare("UPDATE cms_users SET password_hash=? WHERE email=?").run(passwordHash(password), email);
  });

  await t.test("concurrent password work has a bounded queue", async () => {
    const outcomes = await Promise.allSettled(Array.from({ length: 12 }, (_, index) => login(`missing-${index}@example.test`, password, new Request(origin))));
    const statuses = outcomes.map(result => result.status === "rejected" ? (result.reason as { status: number }).status : 200);
    assert.equal(statuses.filter(status => status === 503).length, 2);
    assert.equal(statuses.filter(status => status === 401).length, 10);
  });

  await t.test("valid raster formats are fully decoded and stored as clean WebP", async () => {
    for (const format of ["png", "jpeg", "webp", "gif"] as const) {
      const source = await sharp({ create: { width: 24, height: 18, channels: 4, background: "#917fb3" } }).toFormat(format).toBuffer();
      const saved = await uploadMedia(new File([source], `test.${format}`, { type: "application/octet-stream" }), "Security test image");
      assert.equal(saved.mimeType, "image/webp");
      assert.ok(saved.filename.endsWith(".webp"));
      const response = serveMedia(saved.filename);
      assert.equal(response.headers.get("content-type"), "image/webp");
      const decoded = await sharp(Buffer.from(await response.arrayBuffer())).metadata();
      assert.equal(decoded.width, 24);
      assert.equal(decoded.height, 18);
      assert.equal(decoded.exif, undefined);
      assert.equal(decoded.icc, undefined);
    }
  });

  await t.test("orientation is corrected and private metadata removed", async () => {
    const source = await sharp({ create: { width: 24, height: 18, channels: 3, background: "#e5beec" } }).withMetadata({ orientation: 6 }).jpeg().toBuffer();
    const saved = await uploadMedia(new File([source], "oriented.jpg"), "Oriented test image");
    const decoded = await sharp(Buffer.from(await serveMedia(saved.filename).arrayBuffer())).metadata();
    assert.equal(decoded.width, 18);
    assert.equal(decoded.height, 24);
    assert.equal(decoded.exif, undefined);
    assert.equal(decoded.orientation, undefined);
  });

  await t.test("small animations retain frames and timing", async () => {
    const raw = Buffer.alloc(8 * 8 * 2 * 3);
    raw.fill(80, 0, raw.length / 2);
    raw.fill(180, raw.length / 2);
    const source = await sharp(raw, { raw: { width: 8, height: 16, channels: 3, pageHeight: 8 } }).gif({ loop: 0, delay: [80, 120] }).toBuffer();
    const saved = await uploadMedia(new File([source], "animation.gif"), "Animated test image");
    const decoded = await sharp(Buffer.from(await serveMedia(saved.filename).arrayBuffer()), { animated: true }).metadata();
    assert.equal(decoded.pages, 2);
    assert.deepEqual(decoded.delay, [80, 120]);
  });

  await t.test("corrupt, header-only and disguised SVG uploads never persist", async () => {
    const pngHeader = Buffer.alloc(24);
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(pngHeader);
    pngHeader.write("IHDR", 12);
    pngHeader.writeUInt32BE(24, 16);
    pngHeader.writeUInt32BE(18, 20);
    const valid = await sharp({ create: { width: 24, height: 18, channels: 3, background: "#694f8d" } }).png().toBuffer();
    const before = Number(getDatabase().prepare("SELECT COUNT(*) AS total FROM cms_media").get()!.total);
    const filesBefore = readdirSync(path.join(process.env.CMS_DATA_DIR!, "media")).length;
    for (const source of [pngHeader, valid.subarray(0, Math.floor(valid.length / 2)), Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>")]) {
      await assert.rejects(uploadMedia(new File([source], "fake.png", { type: "image/png" }), "Invalid test image"), error => (error as { status?: number }).status === 400);
    }
    assert.equal(Number(getDatabase().prepare("SELECT COUNT(*) AS total FROM cms_media").get()!.total), before);
    assert.equal(readdirSync(path.join(process.env.CMS_DATA_DIR!, "media")).length, filesBefore);
  });

  await t.test("animation frame and cumulative pixel limits are enforced before persisting", async () => {
    const frames = 101;
    const raw = Buffer.alloc(8 * 8 * frames * 3);
    for (let frame = 0; frame < frames; frame++) raw.fill(frame * 2, frame * 8 * 8 * 3, (frame + 1) * 8 * 8 * 3);
    const source = await sharp(raw, { raw: { width: 8, height: 8 * frames, channels: 3, pageHeight: 8 } }).gif({ delay: 80, keepDuplicateFrames: true }).toBuffer();
    assert.equal((await sharp(source).metadata()).pages, frames);
    const before = Number(getDatabase().prepare("SELECT COUNT(*) AS total FROM cms_media").get()!.total);
    await assert.rejects(uploadMedia(new File([source], "too-many-frames.gif"), "Invalid animation"), error => (error as { status?: number }).status === 400);
    const twoFrames = await sharp(raw.subarray(0, 8 * 8 * 2 * 3), { raw: { width: 8, height: 16, channels: 3, pageHeight: 8 } }).gif({ keepDuplicateFrames: true }).toBuffer();
    // GIF canvases can be much larger than individual frame rectangles. This
    // small file describes 50MP in total and must fail before full decoding.
    twoFrames.writeUInt16LE(5000, 6);
    twoFrames.writeUInt16LE(5000, 8);
    const firstFrame = twoFrames.indexOf(0x2c, 13);
    assert.equal(twoFrames.readUInt16LE(firstFrame + 5), 8);
    twoFrames.writeUInt16LE(5000, firstFrame + 5);
    twoFrames.writeUInt16LE(5000, firstFrame + 7);
    const oversized = await sharp(twoFrames).metadata();
    assert.equal(oversized.width! * oversized.height! * oversized.pages!, 50_000_000);
    await assert.rejects(uploadMedia(new File([twoFrames], "too-many-pixels.gif"), "Oversized animation"), error => (error as { status?: number }).status === 400);
    assert.equal(Number(getDatabase().prepare("SELECT COUNT(*) AS total FROM cms_media").get()!.total), before);
  });

  await t.test("consultations are private and retrying creates only one record", async () => {
    const data = { requestId: randomUUID(), website: "", name: "Security Test", contact: "+989123456789", service: "website", message: "This is an isolated security regression test.", plan: null };
    const first = await call("consultations", "POST", data);
    assert.equal(first.status, 201);
    const receipt = await first.json();
    assert.deepEqual(Object.keys(receipt), ["reference"]);
    const duplicate = await call("consultations", "POST", data);
    assert.equal(duplicate.status, 201);
    assert.deepEqual(await duplicate.json(), receipt);
    assert.equal(Number(getDatabase().prepare("SELECT COUNT(*) AS total FROM cms_consultations").get()!.total), 1);
    assert.equal((await call("consultations", "POST", { ...data, message: "A different request payload must not reuse a receipt." })).status, 409);
    assert.equal((await call("consultations")).status, 401);
  });

  await t.test("concurrent password changes cannot overwrite one another and revoke other sessions", async () => {
    const newPasswords = ["ChangedPassword-One-2048", "ChangedPassword-Two-2048"];
    const changes = await Promise.all(newPasswords.map(newPassword => call("password", "PUT", { currentPassword: password, newPassword }, authHeaders)));
    assert.deepEqual(changes.map(response => response.status).sort(), [204, 409]);
    assert.equal(Number(getDatabase().prepare("SELECT COUNT(*) AS total FROM cms_sessions").get()!.total), 1);
    assert.equal((await call("session", "GET", undefined, { cookie })).status, 200);
    assert.equal((await call("login", "POST", { email, password })).status, 401);
    const acceptedPassword = newPasswords[changes.findIndex(response => response.status === 204)];
    assert.equal((await call("login", "POST", { email, password: acceptedPassword })).status, 200);
  });

  await t.test("logout invalidates the server-side session", async () => {
    assert.equal((await call("logout", "POST", undefined, authHeaders)).status, 204);
    assert.equal((await call("session", "GET", undefined, { cookie })).status, 401);
  });
});
