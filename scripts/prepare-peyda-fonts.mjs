import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import wawoff2 from "wawoff2";

// One-time, lossless web-font packaging of the files supplied by the owner.
// CI uses the checked-in WOFF2 files and never depends on this local directory.
const inputDirectory = process.argv[2];
if (!inputDirectory) throw new Error("Usage: node scripts/prepare-peyda-fonts.mjs <directory-containing-the-supplied-TTF-files>");
const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, "public/fonts/peyda");
const faces = [
  ["Peyda-Thin[@fontbazi].ttf", "Thin", 100],
  ["peyda-extralight[@fontbazi].ttf", "ExtraLight", 200],
  ["peyda-light[@fontbazi].ttf", "Light", 300],
  ["Peyda-Regular[@fontbazi].ttf", "Regular", 400],
  ["Peyda-Medium[@fontbazi].ttf", "Medium", 500],
  ["Peyda-SemiBold[@fontbazi].ttf", "SemiBold", 600],
  ["Peyda-Bold[@fontbazi].ttf", "Bold", 700],
  ["Peyda-ExtraBold[@fontbazi].ttf", "ExtraBold", 800],
  ["Peyda-Black[@fontbazi].ttf", "Black", 900],
];

function table(font, tag) {
  const count = font.readUInt16BE(4);
  for (let index = 0; index < count; index++) {
    const at = 12 + index * 16;
    if (font.toString("ascii", at, at + 4) === tag) return font.subarray(font.readUInt32BE(at + 8), font.readUInt32BE(at + 8) + font.readUInt32BE(at + 12));
  }
  throw new Error(`Missing font table: ${tag}`);
}

await mkdir(output, { recursive: true });
const report = [];
for (const [filename, name, weight] of faces) {
  const source = await readFile(path.join(inputDirectory, filename));
  if (table(source, "OS/2").readUInt16BE(4) !== weight) throw new Error(`Incorrect font weight: ${filename}`);
  const compressed = Buffer.from(await wawoff2.compress(source));
  const restored = Buffer.from(await wawoff2.decompress(compressed));
  if (compressed.toString("ascii", 0, 4) !== "wOF2") throw new Error(`Invalid WOFF2: ${filename}`);
  // Font names, metrics, character mapping and shaping must remain unchanged.
  for (const tag of ["name", "OS/2", "cmap", "GSUB", "GPOS", "hmtx"]) {
    if (!table(source, tag).equals(table(restored, tag))) throw new Error(`Changed font table ${tag}: ${filename}`);
  }
  await writeFile(path.join(output, `Peyda-${name}.woff2`), compressed);
  report.push({ source: filename, file: `Peyda-${name}.woff2`, weight, sourceBytes: source.length, webBytes: compressed.length, sourceSha256: createHash("sha256").update(source).digest("hex") });
}
console.log(JSON.stringify({ faces: report, originalBytes: report.reduce((sum, face) => sum + face.sourceBytes, 0), webBytes: report.reduce((sum, face) => sum + face.webBytes, 0), unchangedTables: ["name", "OS/2", "cmap", "GSUB", "GPOS", "hmtx"] }, null, 2));
