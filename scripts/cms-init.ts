import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { createAdministrator } from "../src/server/auth";
import { ensureSeed } from "../src/server/database";
import { getStarterSeed } from "../src/server/seed";
import { readSiteSettings } from "../src/server/site-settings";

// The first file wins; existing process variables always retain their priority.
for (const filename of [".env.local", ".env"]) if (existsSync(filename)) loadEnvFile(filename);

const email = process.env.CMS_ADMIN_EMAIL || "";
const password = process.env.CMS_ADMIN_PASSWORD || "";
const name = process.env.CMS_ADMIN_NAME || "مدیر الیتا";
ensureSeed(getStarterSeed());
readSiteSettings();
createAdministrator(email, password, name, process.argv.includes("--reset-password"));
console.log(process.argv.includes("--reset-password") ? "Administrator password saved; previous sessions revoked." : "Administrator created. Open /admin/ on the Node.js host to sign in.");
