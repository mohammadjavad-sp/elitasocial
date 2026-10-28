// Read-only hosting preflight, also available in cPanel's Run JS Script menu.
// No credentials, database files or application data are read or written.
try {
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < 22 || (major === 22 && minor < 19)) {
    throw new Error(`Node.js ${process.versions.node} is too old; select Node.js 22.19.0 or newer.`);
  }
  const { DatabaseSync, backup } = await import("node:sqlite");
  if (typeof DatabaseSync !== "function" || typeof backup !== "function") {
    throw new Error("This Node.js installation does not include the required node:sqlite APIs.");
  }
  const sharp = (await import("sharp")).default;
  await sharp({ create: { width: 2, height: 2, channels: 3, background: "#694f8d" } }).webp().toBuffer();
  console.log(`Host check passed: Node.js ${process.versions.node}, built-in SQLite and Sharp/WebP are available.`);
} catch (error) {
  console.error(`Host check failed: ${error instanceof Error ? error.message : "Unknown error."}`);
  process.exitCode = 1;
}
