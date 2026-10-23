import "server-only";
import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import type { CmsSession } from "@/lib/cms-shared";
import { getDatabase } from "./database";
import { CmsError } from "./errors";

const cookieName = "elita_cms_session";
const sessionLifetime = 8 * 60 * 60;
const hashToken = (value: string) => createHash("sha256").update(value).digest("hex");
const equal = (first: string, second: string) => first.length === second.length && timingSafeEqual(Buffer.from(first), Buffer.from(second));
type AuthState = { session: CmsSession; userId: string; tokenHash: string };

export function assertOrigin(request: Request) {
  const expected = process.env.CMS_ORIGIN ? new URL(process.env.CMS_ORIGIN).origin : new URL(request.url).origin;
  const origin = request.headers.get("origin");
  if (!origin || origin !== expected) throw new CmsError(403, "مبدأ درخواست معتبر نیست؛ پنل را از نشانی اصلی باز کنید.");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") throw new CmsError(403, "این درخواست از سایت دیگری ارسال شده است.");
}

function cookieOptions() {
  const prefix = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");
  const secure = process.env.NODE_ENV === "production" && process.env.CMS_COOKIE_SECURE !== "false";
  return `Path=${prefix || "/"}; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}`;
}

export function clearSessionCookie() { return `${cookieName}=; ${cookieOptions()}; Max-Age=0`; }

export function getSession(request: Request): AuthState | null {
  const cookie = request.headers.get("cookie")?.split(";").map(item => item.trim()).find(item => item.startsWith(`${cookieName}=`));
  const token = cookie?.slice(cookieName.length + 1);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const tokenHash = hashToken(token);
  const now = Date.now();
  const db = getDatabase();
  const row = db.prepare("SELECT s.id_hash,s.csrf_token,s.expires_at,u.id,u.email,u.name FROM cms_sessions s JOIN cms_users u ON s.user_id=u.id WHERE s.id_hash=?").get(tokenHash);
  if (!row) return null;
  if (Number(row.expires_at) <= now) { db.prepare("DELETE FROM cms_sessions WHERE id_hash=?").run(tokenHash); return null; }
  return { tokenHash, userId: String(row.id), session: { user: { id: String(row.id), email: String(row.email), name: String(row.name) }, csrfToken: String(row.csrf_token) } };
}

export function requireSession(request: Request): AuthState {
  const auth = getSession(request);
  if (!auth) throw new CmsError(401, "برای ادامه وارد پنل شوید.");
  return auth;
}

export function assertCsrf(request: Request, auth: AuthState) {
  const token = request.headers.get("x-csrf-token") || "";
  if (!/^[a-f0-9]{64}$/.test(token) || !equal(token, auth.session.csrfToken)) throw new CmsError(403, "اعتبار درخواست پایان یافته است؛ صفحه را تازه کنید.");
}

export function passwordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  // OWASP's 16 MiB scrypt profile uses p=5 to retain its recommended work factor.
  const digest = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 5, maxmem: 64 * 1024 * 1024 }).toString("hex");
  return `scrypt$16384$8$5$${salt}$${digest}`;
}

function verifyPassword(password: string, encoded: string) {
  const parts = encoded.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt" || parts[1] !== "16384" || parts[2] !== "8" || !["1", "5"].includes(parts[3]) || !/^[a-f0-9]{32}$/.test(parts[4]) || !/^[a-f0-9]{128}$/.test(parts[5])) return false;
  const actual = scryptSync(password, parts[4], 64, { N: 16384, r: 8, p: Number(parts[3]), maxmem: 64 * 1024 * 1024 }).toString("hex");
  return equal(actual, parts[5]);
}

function consumeLoginAttempt(email: string, request: Request) {
  const db = getDatabase();
  const now = Date.now();
  const expires = now + 15 * 60 * 1000;
  const trustedAddress = process.env.CMS_TRUST_PROXY === "true" ? (request.headers.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0, 150) || "direct") : "direct";
  const keys = [{ key: `account:${hashToken(email)}`, max: 8 }, { key: `address:${hashToken(trustedAddress)}`, max: 40 }];
  db.prepare("DELETE FROM cms_login_attempts WHERE expires_at<=?").run(now);
  for (const item of keys) {
    const row = db.prepare("SELECT attempts FROM cms_login_attempts WHERE key=?").get(item.key);
    if (row && Number(row.attempts) >= item.max) throw new CmsError(429, "تلاش‌های ورود زیاد شده است؛ ۱۵ دقیقه بعد دوباره امتحان کنید.");
  }
  const increment = db.prepare("INSERT INTO cms_login_attempts(key,attempts,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=attempts+1");
  for (const item of keys) increment.run(item.key, expires);
}

export function login(email: string, password: string, request: Request): { session: CmsSession; cookie: string } {
  consumeLoginAttempt(email, request);
  const db = getDatabase();
  const row = db.prepare("SELECT id,email,name,password_hash FROM cms_users WHERE email=?").get(email);
  // Unknown accounts pay the same password derivation cost and receive the same response.
  const dummy = "scrypt$16384$8$5$00000000000000000000000000000000$" + "0".repeat(128);
  const valid = verifyPassword(password, row ? String(row.password_hash) : dummy);
  if (!row || !valid) throw new CmsError(401, "ایمیل یا رمز عبور درست نیست.");
  if (String(row.password_hash).startsWith("scrypt$16384$8$1$")) {
    db.prepare("UPDATE cms_users SET password_hash=? WHERE id=?").run(passwordHash(password), String(row.id));
  }
  const token = randomBytes(32).toString("hex");
  const csrfToken = randomBytes(32).toString("hex");
  const now = Date.now();
  db.prepare("DELETE FROM cms_sessions WHERE expires_at<=?").run(now);
  // Keep a bounded number of active devices without making login itself destructive.
  db.prepare("DELETE FROM cms_sessions WHERE user_id=? AND id_hash NOT IN (SELECT id_hash FROM cms_sessions WHERE user_id=? ORDER BY created_at DESC LIMIT 9)").run(String(row.id), String(row.id));
  db.prepare("INSERT INTO cms_sessions(id_hash,user_id,csrf_token,created_at,expires_at) VALUES(?,?,?,?,?)").run(hashToken(token), String(row.id), csrfToken, now, now + sessionLifetime * 1000);
  db.prepare("DELETE FROM cms_login_attempts WHERE key=?").run(`account:${hashToken(email)}`);
  return { session: { user: { id: String(row.id), email: String(row.email), name: String(row.name) }, csrfToken }, cookie: `${cookieName}=${token}; ${cookieOptions()}; Max-Age=${sessionLifetime}` };
}

export function logout(auth: AuthState) { getDatabase().prepare("DELETE FROM cms_sessions WHERE id_hash=?").run(auth.tokenHash); }

export function changePassword(auth: AuthState, currentPassword: string, newPassword: string) {
  if (newPassword.length < 12 || newPassword.length > 128 || !/\p{L}/u.test(newPassword) || !/\p{N}/u.test(newPassword)) throw new CmsError(400, "رمز تازه باید ۱۲ تا ۱۲۸ نویسه و شامل حرف و عدد باشد.");
  const db = getDatabase();
  const row = db.prepare("SELECT password_hash FROM cms_users WHERE id=?").get(auth.userId);
  if (!row || !verifyPassword(currentPassword, String(row.password_hash))) throw new CmsError(400, "رمز عبور فعلی درست نیست.");
  const nextHash = passwordHash(newPassword);
  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare("UPDATE cms_users SET password_hash=? WHERE id=?").run(nextHash, auth.userId);
    db.prepare("DELETE FROM cms_sessions WHERE user_id=? AND id_hash<>?").run(auth.userId, auth.tokenHash);
    db.exec("COMMIT");
  } catch (error) { db.exec("ROLLBACK"); throw error; }
}

/** Explicit local/host CLI bootstrap only. No HTTP endpoint can create an administrator. */
export function createAdministrator(emailValue: string, password: string, nameValue: string, resetExisting = false) {
  const email = emailValue.trim().toLowerCase();
  const name = nameValue.trim();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("CMS_ADMIN_EMAIL must be a valid email address.");
  if (!name || name.length > 120) throw new Error("CMS_ADMIN_NAME must contain 1-120 characters.");
  if (password.length < 12 || password.length > 128 || !/\p{L}/u.test(password) || !/\p{N}/u.test(password)) throw new Error("CMS_ADMIN_PASSWORD must contain 12-128 characters, including letters and numbers.");
  const db = getDatabase();
  const existing = db.prepare("SELECT id FROM cms_users WHERE email=?").get(email);
  if (existing && !resetExisting) throw new Error("This administrator already exists. Use --reset-password only to deliberately reset it.");
  const encoded = passwordHash(password);
  db.exec("BEGIN IMMEDIATE");
  try {
    if (existing) {
      db.prepare("UPDATE cms_users SET password_hash=?,name=? WHERE id=?").run(encoded, name, String(existing.id));
      db.prepare("DELETE FROM cms_sessions WHERE user_id=?").run(String(existing.id));
    } else {
      db.prepare("INSERT INTO cms_users(id,email,name,password_hash,created_at) VALUES(?,?,?,?,?)").run(randomUUID(), email, name, encoded, new Date().toISOString());
    }
    db.exec("COMMIT");
  } catch (error) { db.exec("ROLLBACK"); throw error; }
}
