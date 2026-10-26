import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = path.join(root, "public/images/elita-social-logo-thin.webp");
// This is the actual first letter in the supplied wordmark, not a traced font.
// The l starts at x=398; the vertical crop also excludes its upper flourish.
// The SVG clip removes its faint two-column bleed away from the e's terminal.
const crop = { left: 8, top: 204, width: 390, height: 426 };
const alpha = await sharp(source).extract(crop).extractChannel("alpha").png().toBuffer();
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480" viewBox="0 0 480 480">
  <style>.letter{fill:#A184C4}@media(prefers-color-scheme:dark){.letter{fill:#DFC3F3}}</style>
  <defs>
    <mask id="original-e" maskUnits="userSpaceOnUse" x="45" y="27" width="390" height="426"><image x="45" y="27" width="390" height="426" href="data:image/png;base64,${alpha.toString("base64")}"/></mask>
    <clipPath id="e-only"><rect x="45" y="27" width="388" height="426"/><rect x="433" y="313" width="2" height="36"/></clipPath>
  </defs>
  <rect class="letter" x="45" y="27" width="390" height="426" mask="url(#original-e)" clip-path="url(#e-only)"/>
</svg>
`;
const app = path.join(root, "src/app");
await writeFile(path.join(app, "icon.svg"), svg);
await sharp(Buffer.from(svg)).resize(32, 32).png().toFile(path.join(app, "icon.png"));
await sharp(Buffer.from(svg)).resize(180, 180).flatten({ background: "#ffffff" }).png().toFile(path.join(app, "apple-icon.png"));

// Assert that the embedded mask is an exact copy of the source crop's alpha.
const originalAlpha = await sharp(source).extract(crop).extractChannel("alpha").raw().toBuffer();
const savedAlpha = await sharp(alpha).extractChannel(0).raw().toBuffer();
if (!originalAlpha.equals(savedAlpha)) throw new Error("The favicon mask must preserve the original e pixels.");
const icon = await sharp(path.join(app, "icon.png")).metadata();
const apple = await sharp(path.join(app, "apple-icon.png")).metadata();
if (icon.width !== 32 || icon.height !== 32 || apple.width !== 180 || apple.height !== 180) throw new Error("Unexpected icon dimensions.");
console.log(JSON.stringify({ source: path.relative(root, source), crop, preservedMaskAlpha: true, svgBytes: Buffer.byteLength(svg), icon: "32x32", apple: "180x180" }));
