import { existsSync } from "node:fs";
import { chmod, cp, mkdir, writeFile } from "node:fs/promises";
import { loadEnvFile } from "node:process";
import path from "node:path";
import { backup } from "node:sqlite";
import { cmsDataDirectory, getDatabase } from "../src/server/database";

async function main() {
  for (const filename of [".env.local", ".env"]) if (existsSync(filename)) loadEnvFile(filename);
  const dataDirectory = cmsDataDirectory();
  const backupRoot = path.resolve(process.env.CMS_BACKUP_DIR || "backups");
  if (backupRoot === dataDirectory || backupRoot.startsWith(`${dataDirectory}${path.sep}`)) {
    throw new Error("CMS_BACKUP_DIR must be outside CMS_DATA_DIR.");
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const destination = path.resolve(backupRoot, timestamp);
  if (!destination.startsWith(`${backupRoot}${path.sep}`)) throw new Error("Invalid backup destination.");
  await mkdir(destination, { recursive: true, mode: 0o700 });
  const databaseFile = path.join(destination, "elita.sqlite");
  const database = getDatabase();
  await backup(database, databaseFile);
  await chmod(databaseFile, 0o600);
  const mediaDirectory = path.join(dataDirectory, "media");
  if (existsSync(mediaDirectory)) await cp(mediaDirectory, path.join(destination, "media"), { recursive: true, errorOnExist: true, force: false });
  const version = database.prepare("SELECT value FROM cms_meta WHERE key='schema_version'").get();
  await writeFile(path.join(destination, "manifest.json"), JSON.stringify({ createdAt: new Date().toISOString(), database: "elita.sqlite", media: "media", schemaVersion: Number(version?.value ?? 1) }, null, 2), { mode: 0o600 });
  console.log(`CMS backup saved to ${destination}`);
}

main().catch(error => { console.error(error instanceof Error ? error.message : "Backup failed."); process.exitCode = 1; });
