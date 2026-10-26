import { createHash } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// Keep the original full-resolution files. Derivatives never enlarge a source.
// The content hash changes URLs when either the source or encoder settings change.
const root = process.cwd();
const output = path.join(root, "public/images/responsive");
const manifestPath = path.join(root, "src/lib/image-manifest.json");
const recipe = "v1-avif68-webp88-lossless-logo";
const files = [
  "elaheh-hero.jpg", "social-marketing.webp", "website-workspace.webp",
  "campaign-workspace.webp", "content-studio.webp", "portfolio-hero.webp",
  "magazine-hero.webp", "elita-social-logo-thin.webp",
];
const manifest = {};
let created = 0;
await mkdir(output, { recursive: true });

for (const file of files) {
  const source = await readFile(path.join(root, "public/images", file));
  const metadata = await sharp(source).metadata();
  if (!metadata.width || !metadata.height) throw new Error(`Missing dimensions: ${file}`);
  const logo = file.includes("logo");
  const requested = logo ? [160, 240, 320, 480] : [320, 480, 640, 960, 1280, metadata.width];
  const widths = [...new Set(requested.filter(width => width <= metadata.width))].sort((a, b) => a - b);
  const digest = createHash("sha256").update(recipe).update(source).digest("hex").slice(0, 12);
  const name = path.parse(file).name;
  const entry = { width: metadata.width, height: metadata.height, avif: [], webp: [] };

  for (const width of widths) {
    for (const format of logo ? ["webp"] : ["avif", "webp"]) {
      const filename = `${name}-${digest}-${width}.${format}`;
      const destination = path.join(output, filename);
      try {
        await access(destination);
      } catch {
        const image = sharp(source).rotate().resize({ width, withoutEnlargement: true });
        if (format === "avif") await image.avif({ quality: 68, effort: 5 }).toFile(destination);
        else await image.webp(logo ? { lossless: true, effort: 6 } : { quality: 88, effort: 6, smartSubsample: true }).toFile(destination);
        created++;
      }
      entry[format].push({ width, src: `/images/responsive/${filename}` });
    }
  }
  manifest[`/images/${file}`] = entry;
}

const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
let previous = "";
try { previous = await readFile(manifestPath, "utf8"); } catch { /* First build. */ }
if (previous !== serialized) await writeFile(manifestPath, serialized);
console.log(`Responsive images ready: ${files.length} sources, ${created} new derivatives.`);
