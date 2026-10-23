import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { readSiteSettings } from "../src/server/site-settings";

for (const filename of [".env.local", ".env"]) if (existsSync(filename)) loadEnvFile(filename);
readSiteSettings();
console.log("CMS schema and site settings initialized. Existing content, accounts and requests were preserved.");
