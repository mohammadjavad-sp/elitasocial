// Read-only hosting preflight, also available in cPanel's Run JS Script menu.
// No credentials, database files or application data are read or written.
try {
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < 22 || (major === 22 && minor < 18)) {
    throw new Error(`Node.js ${process.versions.node} is too old; select Node.js 22.18.0 or newer.`);
  }
  const { DatabaseSync, backup } = await import("node:sqlite");
  if (typeof DatabaseSync !== "function" || typeof backup !== "function") {
    throw new Error("This Node.js installation does not include the required node:sqlite APIs.");
  }
  // Exercise the configured SQLite API without opening the site's database.
  const database = new DatabaseSync(":memory:", { timeout: 5000 });
  try {
    if (database.prepare("PRAGMA busy_timeout").get().timeout !== 5000) {
      throw new Error("This Node.js installation does not support the required SQLite busy timeout.");
    }
  } finally {
    database.close();
  }
  const sharp = (await import("sharp")).default;
  await sharp({ create: { width: 2, height: 2, channels: 3, background: "#694f8d" } }).webp().toBuffer();
  console.log(`Host check passed: Node.js ${process.versions.node}, built-in SQLite and Sharp/WebP are available.`);
} catch (error) {
  console.error(`Host check failed: ${error instanceof Error ? error.message : "Unknown error."}`);
  process.exitCode = 1;
}
