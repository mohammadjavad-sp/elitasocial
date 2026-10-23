import "server-only";
import { mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { CmsMedia } from "@/lib/cms-shared";
import { cmsDataDirectory, getDatabase, mediaFromRow, mediaIsReferenced } from "./database";
import { CmsError } from "./errors";
import { text } from "./validation";

export const maxUploadBytes = 8 * 1024 * 1024;
function directory() { const result = path.join(cmsDataDirectory(), "media"); mkdirSync(result, { recursive: true, mode: 0o700 }); return result; }
function validDimensions(width: number, height: number) {
  if (width < 1 || height < 1 || width > 16000 || height > 16000 || width * height > 40_000_000) throw new CmsError(400, "ابعاد تصویر بیش از حد مجاز است؛ تصویر را کوچک‌تر از ۴۰ مگاپیکسل و ۱۶۰۰۰ پیکسل در هر ضلع ذخیره کنید.");
}

function rasterType(buffer: Buffer): { extension: string; mime: string } {
  if (buffer.length >= 24 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && buffer.toString("ascii", 12, 16) === "IHDR") {
    const width = buffer.readUInt32BE(16), height = buffer.readUInt32BE(20);
    validDimensions(width, height);
    return { extension: "png", mime: "image/png" };
  }
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP" && buffer.readUInt32LE(4) + 8 === buffer.length) {
    let foundDimensions = false;
    let offset = 12;
    while (offset + 8 <= buffer.length) {
      const chunk = buffer.toString("ascii", offset, offset + 4);
      const size = buffer.readUInt32LE(offset + 4);
      const start = offset + 8;
      if (start + size > buffer.length) break;
      if (chunk === "VP8X" && size >= 10) {
        validDimensions(buffer.readUIntLE(start + 4, 3) + 1, buffer.readUIntLE(start + 7, 3) + 1);
        foundDimensions = true;
      } else if (chunk === "VP8L" && size >= 5 && buffer[start] === 0x2f) {
        const bits = buffer.readUInt32LE(start + 1);
        validDimensions((bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1);
        foundDimensions = true;
      } else if (chunk === "VP8 " && size >= 10 && buffer[start + 3] === 0x9d && buffer[start + 4] === 1 && buffer[start + 5] === 0x2a) {
        validDimensions(buffer.readUInt16LE(start + 6) & 0x3fff, buffer.readUInt16LE(start + 8) & 0x3fff);
        foundDimensions = true;
      }
      offset = start + size + (size % 2);
    }
    if (foundDimensions && offset === buffer.length) return { extension: "webp", mime: "image/webp" };
  }
  if (buffer.length >= 13 && ["GIF87a", "GIF89a"].includes(buffer.toString("ascii", 0, 6))) {
    const width = buffer.readUInt16LE(6), height = buffer.readUInt16LE(8);
    validDimensions(width, height);
    return { extension: "gif", mime: "image/gif" };
  }
  if (buffer.length > 4 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff && buffer[buffer.length - 2] === 0xff && buffer[buffer.length - 1] === 0xd9) {
    let offset = 2;
    while (offset + 3 < buffer.length) {
      if (buffer[offset] !== 0xff) break;
      while (offset < buffer.length && buffer[offset] === 0xff) offset++;
      const marker = buffer[offset++];
      if (marker === 0xda || marker === 0xd9 || offset + 2 > buffer.length) break;
      if (marker === 1 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      const length = buffer.readUInt16BE(offset);
      if (length < 2 || offset + length > buffer.length) break;
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker) && length >= 8) {
        validDimensions(buffer.readUInt16BE(offset + 5), buffer.readUInt16BE(offset + 3));
        return { extension: "jpg", mime: "image/jpeg" };
      }
      offset += length;
    }
  }
  throw new CmsError(400, "فقط تصویر PNG، JPG، WebP یا GIF معتبر بارگذاری کنید؛ SVG و فایل اجرایی پذیرفته نمی‌شوند.");
}

export async function uploadMedia(file: File, altValue: unknown): Promise<CmsMedia> {
  if (!file || file.size < 1 || file.size > maxUploadBytes) throw new CmsError(413, "حجم تصویر باید کمتر از ۸ مگابایت باشد.");
  const alt = text(altValue, "توضیح تصویر", 350);
  const buffer = Buffer.from(await file.arrayBuffer());
  const type = rasterType(buffer);
  const id = randomUUID();
  const filename = `${id}.${type.extension}`;
  const target = path.join(directory(), filename);
  const temporary = `${target}.tmp`;
  const item: CmsMedia = { id, filename, url: `/api/cms/files/${filename}`, alt, mimeType: type.mime, size: buffer.length, createdAt: new Date().toISOString() };
  try {
    writeFileSync(temporary, buffer, { flag: "wx", mode: 0o600 });
    renameSync(temporary, target);
    getDatabase().prepare("INSERT INTO cms_media(id,url,alt,filename,mime_type,size,created_at) VALUES(?,?,?,?,?,?,?)").run(item.id, item.url, item.alt, item.filename, item.mimeType, item.size, item.createdAt);
    return item;
  } catch (error) {
    try { unlinkSync(temporary); } catch { /* Nothing persisted at this path. */ }
    try { unlinkSync(target); } catch { /* Clean up a failed database insert. */ }
    throw error;
  }
}

export function serveMedia(filename: string) {
  if (!/^[a-f0-9-]{36}\.(?:png|jpg|gif|webp)$/.test(filename)) throw new CmsError(404, "تصویر پیدا نشد.");
  const row = getDatabase().prepare("SELECT * FROM cms_media WHERE filename=?").get(filename);
  if (!row) throw new CmsError(404, "تصویر پیدا نشد.");
  let buffer: Buffer;
  try { buffer = readFileSync(path.join(directory(), filename)); } catch { throw new CmsError(404, "فایل تصویر در دسترس نیست."); }
  return new Response(new Uint8Array(buffer), { headers: { "Content-Type": String(row.mime_type), "Content-Length": String(buffer.length), "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; sandbox", "Cache-Control": "public, max-age=31536000, immutable", "Content-Disposition": `inline; filename="${filename}"` } });
}

export function deleteMedia(id: string) {
  const db = getDatabase();
  db.exec("BEGIN IMMEDIATE");
  try {
    const row = db.prepare("SELECT * FROM cms_media WHERE id=?").get(id);
    if (!row) throw new CmsError(404, "تصویر پیدا نشد.");
    const item = mediaFromRow(row);
    const base = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");
    if (mediaIsReferenced(item.url) || (base && mediaIsReferenced(`${base}${item.url}`))) throw new CmsError(409, "این تصویر در محتوای سایت استفاده شده است؛ ابتدا آن را از محتوا حذف کنید.");
    try { unlinkSync(path.join(directory(), item.filename)); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    db.prepare("DELETE FROM cms_media WHERE id=?").run(id);
    db.exec("COMMIT");
  } catch (error) { db.exec("ROLLBACK"); throw error; }
}
