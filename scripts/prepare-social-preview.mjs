import { fileURLToPath } from "node:url";
import path from "node:path";
import { stat } from "node:fs/promises";
import sharp from "sharp";

// A single portable JPEG for crawlers and messaging apps; no request-time image
// generation, remote assets or upscaling. Keep the original thin wordmark intact.
const root = fileURLToPath(new URL("../", import.meta.url));
const imagePath = (name) => path.join(root, "public/images", name);
const destination = imagePath("social-share.jpg");
const width = 1200;
const height = 630;
const svg = (body, w = width, h = height) => Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`,
);

const background = svg(`
  <rect width="1200" height="630" fill="#fcf7fe"/>
  <path d="M1200 0H940C1028 111 1112 167 1200 181Z" fill="#fde2f3"/>
  <path d="M0 630V480C112 498 218 548 300 630Z" fill="#e5beec" opacity=".55"/>
  <path d="M600 94c0 25 9 34 34 34-25 0-34 9-34 34 0-25-9-34-34-34 25 0 34-9 34-34Z" fill="#917fb3"/>
  <circle cx="610" cy="519" r="27" fill="none" stroke="#e5beec" stroke-width="2"/>
  <circle cx="610" cy="519" r="10" fill="#694f8d"/>
`);

const photo = await sharp(imagePath("website-workspace.webp"))
  .rotate()
  .resize({ width: 510, height: 510, fit: "cover", position: "centre", withoutEnlargement: true })
  .composite([{ input: svg('<path d="M255 0C396 0 510 114 510 255V474Q510 510 474 510H36Q0 510 0 474V255C0 114 114 0 255 0Z" fill="white"/>', 510, 510), blend: "dest-in" }])
  .png()
  .toBuffer();

const logo = await sharp(imagePath("elita-social-logo-thin.webp"))
  .trim({ threshold: 5 })
  .resize({ width: 356, withoutEnlargement: true })
  .png()
  .toBuffer({ resolveWithObject: true });

async function textLayer(text, size, color, weight = 400) {
  const fontfile = path.join(root, "public/fonts/peyda", weight >= 600 ? "Peyda-SemiBold.woff2" : "Peyda-Regular.woff2");
  return sharp({ text: {
    text: `<span foreground="${color}" weight="${weight}">${text}</span>`,
    font: `Peyda ${size}`,
    fontfile,
    rgba: true,
    dpi: 72,
  } }).png().toBuffer({ resolveWithObject: true });
}

const title = await textLayer("الیتاسوشیال", 45, "#694f8d", 600);
const description = await textLayer("طراحی وب، محتوا و شبکه‌های اجتماعی", 24, "#594b6d");
const center = 884;
const layers = [
  { input: photo, top: 60, left: 58 },
  { input: logo.data, top: 105, left: Math.round(center - logo.info.width / 2) },
  { input: title.data, top: 376, left: Math.round(center - title.info.width / 2) },
  { input: description.data, top: 462, left: Math.round(center - description.info.width / 2) },
];

await sharp(background)
  .composite(layers)
  .flatten({ background: "#fcf7fe" })
  .jpeg({ quality: 91, mozjpeg: true, chromaSubsampling: "4:4:4" })
  .toFile(destination);

const metadata = await sharp(destination).metadata();
const { size } = await stat(destination);
if (metadata.width !== width || metadata.height !== height || size > 250_000) {
  throw new Error(`Unexpected social preview dimensions or size: ${JSON.stringify({ width: metadata.width, height: metadata.height, size })}`);
}
console.log(`Social preview ready: ${width}×${height}, ${size} bytes (${path.relative(root, destination)}).`);
