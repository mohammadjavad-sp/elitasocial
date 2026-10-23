import "server-only";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { CmsCollection, CmsMedia, CmsRecord, CmsStatus } from "@/lib/cms-shared";
import { CmsError } from "./errors";

const globalDatabase = globalThis as typeof globalThis & { elitaCmsDatabase?: DatabaseSync };
const schemaReady = new WeakSet<DatabaseSync>();

/** Also runs for a cached connection after a development hot reload. */
function ensureCmsSchema(db: DatabaseSync) {
  if (schemaReady.has(db)) return;
  db.exec(`
    CREATE TABLE IF NOT EXISTS cms_settings (
      id TEXT PRIMARY KEY CHECK(id='site'), data TEXT NOT NULL,
      revision INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS cms_consultations (
      id TEXT PRIMARY KEY, reference TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL, contact TEXT NOT NULL, contact_kind TEXT NOT NULL CHECK(contact_kind IN ('phone','email')),
      service TEXT NOT NULL CHECK(service IN ('undecided','instagram','website','content','seo','multiple')),
      message TEXT NOT NULL, plan TEXT,
      status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','contacted','completed','archived')),
      note TEXT NOT NULL DEFAULT '', revision INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS cms_consultations_status_created ON cms_consultations(status,created_at DESC,id);
    CREATE INDEX IF NOT EXISTS cms_consultations_created ON cms_consultations(created_at DESC,id);
    CREATE TABLE IF NOT EXISTS cms_consultation_receipts (
      request_id TEXT PRIMARY KEY, payload_hash TEXT NOT NULL, reference TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS cms_consultation_attempts (
      key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS cms_consultation_attempts_expiry ON cms_consultation_attempts(expires_at);
    INSERT INTO cms_meta(key,value) VALUES('schema_version','3')
      ON CONFLICT(key) DO UPDATE SET value=excluded.value WHERE CAST(cms_meta.value AS INTEGER)<3;
  `);
  schemaReady.add(db);
}

export function cmsDataDirectory() { return path.resolve(process.env.CMS_DATA_DIR || path.join(process.cwd(), ".data")); }

export function getDatabase(): DatabaseSync {
  if (process.env.DEPLOY_TARGET === "github-pages") throw new CmsError(503, "مدیریت محتوا به میزبانی Node.js نیاز دارد.");
  if (globalDatabase.elitaCmsDatabase) {
    ensureCmsSchema(globalDatabase.elitaCmsDatabase);
    return globalDatabase.elitaCmsDatabase;
  }
  const directory = cmsDataDirectory();
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(path.join(directory, "elita.sqlite"), { timeout: 5000 });
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS cms_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS cms_users (
      id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
      password_hash TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS cms_sessions (
      id_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES cms_users(id) ON DELETE CASCADE,
      csrf_token TEXT NOT NULL, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS cms_sessions_expiry ON cms_sessions(expires_at);
    CREATE TABLE IF NOT EXISTS cms_login_attempts (
      key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS cms_records (
      id TEXT PRIMARY KEY, collection TEXT NOT NULL CHECK(collection IN ('articles','services','portfolio','plans')),
      status TEXT NOT NULL CHECK(status IN ('draft','published')), content_key TEXT NOT NULL,
      data TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
      UNIQUE(collection,content_key)
    );
    CREATE INDEX IF NOT EXISTS cms_records_collection ON cms_records(collection,status,created_at DESC);
    CREATE TABLE IF NOT EXISTS cms_media (
      id TEXT PRIMARY KEY, url TEXT NOT NULL UNIQUE, alt TEXT NOT NULL, filename TEXT NOT NULL UNIQUE,
      mime_type TEXT NOT NULL, size INTEGER NOT NULL, created_at TEXT NOT NULL
    );
    INSERT OR IGNORE INTO cms_meta(key,value) VALUES('schema_version','1');
  `);
  ensureCmsSchema(db);
  globalDatabase.elitaCmsDatabase = db;
  return db;
}

function asRecord(row: Record<string, unknown>): CmsRecord {
  return { id: String(row.id), collection: row.collection as CmsCollection, status: row.status as CmsStatus, data: JSON.parse(String(row.data)), revision: Number(row.revision), createdAt: String(row.created_at), updatedAt: String(row.updated_at) };
}

export function listRecords(collection: CmsCollection, publishedOnly = false): CmsRecord[] {
  const rows = publishedOnly
    ? getDatabase().prepare("SELECT * FROM cms_records WHERE collection=? AND status='published' ORDER BY rowid ASC").all(collection)
    : getDatabase().prepare("SELECT * FROM cms_records WHERE collection=? ORDER BY updated_at DESC,id").all(collection);
  return rows.map(row => asRecord(row));
}

export function saveRecord(collection: CmsCollection, data: Record<string, unknown>, status: CmsStatus, id?: string, expectedRevision?: number): CmsRecord {
  const db = getDatabase();
  const recordId = id || randomUUID();
  const contentKey = String(data.slug || data.id || recordId);
  const now = new Date().toISOString();
  db.exec("BEGIN IMMEDIATE");
  try {
    const existing = db.prepare("SELECT * FROM cms_records WHERE id=? AND collection=?").get(recordId, collection);
    if (id && !existing) throw new CmsError(404, "این مورد پیدا نشد.");
    if (existing && Number(existing.revision) !== expectedRevision) throw new CmsError(409, "این مورد در جای دیگری تغییر کرده است؛ فهرست را تازه کنید.");
    const duplicate = db.prepare("SELECT id FROM cms_records WHERE collection=? AND content_key=? AND id<>?").get(collection, contentKey, recordId);
    if (duplicate) throw new CmsError(409, "شناسه یا نشانی این مورد قبلاً استفاده شده است.");
    if (existing) {
      db.prepare("UPDATE cms_records SET status=?,content_key=?,data=?,revision=revision+1,updated_at=? WHERE id=? AND collection=?").run(status, contentKey, JSON.stringify(data), now, recordId, collection);
    } else {
      db.prepare("INSERT INTO cms_records(id,collection,status,content_key,data,revision,created_at,updated_at) VALUES(?,?,?,?,?,1,?,?)").run(recordId, collection, status, contentKey, JSON.stringify(data), now, now);
    }
    const saved = db.prepare("SELECT * FROM cms_records WHERE id=?").get(recordId)!;
    db.exec("COMMIT");
    return asRecord(saved);
  } catch (error) { db.exec("ROLLBACK"); throw error; }
}

export function deleteRecord(collection: CmsCollection, id: string, expectedRevision: number) {
  const db = getDatabase();
  db.exec("BEGIN IMMEDIATE");
  try {
    const existing = db.prepare("SELECT revision FROM cms_records WHERE id=? AND collection=?").get(id, collection);
    if (!existing) throw new CmsError(404, "این مورد پیدا نشد.");
    if (Number(existing.revision) !== expectedRevision) throw new CmsError(409, "این مورد تغییر کرده است؛ فهرست را تازه کنید.");
    db.prepare("DELETE FROM cms_records WHERE id=? AND collection=?").run(id, collection);
    db.exec("COMMIT");
  } catch (error) { db.exec("ROLLBACK"); throw error; }
}

/** Seed once, including when every record has subsequently been deleted intentionally. */
export function ensureSeed(seed: { collection: CmsCollection; data: Record<string, unknown>; status: CmsStatus }[]) {
  const db = getDatabase();
  db.exec("BEGIN IMMEDIATE");
  try {
    if (!db.prepare("SELECT value FROM cms_meta WHERE key='starter_seed'").get()) {
      const insert = db.prepare("INSERT OR IGNORE INTO cms_records(id,collection,status,content_key,data,revision,created_at,updated_at) VALUES(?,?,?,?,?,1,?,?)");
      const now = new Date().toISOString();
      for (const item of seed) insert.run(randomUUID(), item.collection, item.status, String(item.data.slug || item.data.id || randomUUID()), JSON.stringify(item.data), now, now);
      db.prepare("INSERT INTO cms_meta(key,value) VALUES('starter_seed',?)").run(now);
    }
    db.exec("COMMIT");
  } catch (error) { db.exec("ROLLBACK"); throw error; }
}

export function mediaFromRow(row: Record<string, unknown>): CmsMedia {
  return { id: String(row.id), url: String(row.url), alt: String(row.alt), filename: String(row.filename), mimeType: String(row.mime_type), size: Number(row.size), createdAt: String(row.created_at) };
}

export function listMedia(): CmsMedia[] { return getDatabase().prepare("SELECT * FROM cms_media ORDER BY created_at DESC,id").all().map(mediaFromRow); }

export function mediaIsReferenced(url: string): boolean {
  // Exact traversal, including drafts, avoids both SQL wildcard surprises and accidental deletion.
  const contains = (value: unknown): boolean => value === url || (Array.isArray(value) ? value.some(contains) : value !== null && typeof value === "object" ? Object.values(value).some(contains) : false);
  const db = getDatabase();
  if (db.prepare("SELECT data FROM cms_records").all().some(row => contains(JSON.parse(String(row.data))))) return true;
  // A settings image has the same protection as media used in published or draft records.
  if (!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='cms_settings'").get()) return false;
  return db.prepare("SELECT data FROM cms_settings").all().some(row => contains(JSON.parse(String(row.data))));
}
