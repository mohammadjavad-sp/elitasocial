# Release image delivery

`SiteImage` serves bundled photographs with native responsive AVIF and WebP sources. It works with both GitHub Pages and the Node server, including a project `basePath`. Browsers choose the appropriate width and supported format. There is no image JavaScript, client state, external image service, or runtime encoding for these bundled files. CMS uploads continue through the normal Next Image optimizer on Node hosting.

The original supplied portrait, the thin wordmark and the transparent dark SVG remain unchanged. The light wordmark has lossless, smaller delivery variants. Hidden theme logos use lazy loading with a high fetch priority for the visible header variant, rather than preloading both versions. Above-the-fold photographs load eagerly with a high fetch priority; other photographs remain lazy. Image dimensions, crops, alt text and dark-mode styling are retained.

## Source quality

Six editorial photographs were re-encoded from their existing original lossless PNG masters at WebP quality 92, with no enlargement, sharpening, redrawing or new image generation. Fine detail is retained at the original dimensions:

| Asset | Previous dimensions | Current master |
| --- | --- | --- |
| Portfolio and magazine hero | 1440 × 960 | 1536 × 1024 |
| Campaign workspace | 1500 × 1000 | 1536 × 1024 |
| Social marketing and website workspace | 960 × 1280 | 1086 × 1448 |
| Content studio | 1000 × 1333 | 1086 × 1448 |
| Supplied portrait | 853 × 1280 | Unchanged |

Original master provenance remains in `editorial-image-prompts.md`, `marketing-image-prompts.md` and `additional-image-prompts.md`. A responsive derivative cannot recover detail beyond its source; the portrait retains the resolution of the supplied photograph.

## Maintenance

Run `node scripts/prepare-images.mjs` after replacing a bundled image. Both `npm run dev` and `npm run build` run this command automatically before starting. The script uses Sharp to create AVIF quality 68 and WebP quality 88 variants at 320, 480, 640, 960 and 1280 pixels, plus the source width when applicable. No derivative exceeds its source dimensions. The logo uses lossless WebP at 160, 240, 320 and 480 pixels. All encoders strip source metadata by default.

The full-resolution bundled sources and `src/lib/image-manifest.json` are checked in. Generated files in `public/images/responsive/` are ignored by Git to keep the repository small; the dev and build hooks create them from the tracked sources, including on a clean CI checkout. The first run encodes all variants; later runs skip unchanged files. URLs include a digest of the source bytes and encoding recipe, preventing stale cached images after an update. Keep the full-resolution bundled sources so that a future width or encoding change does not depend on a developer's private image archive.

The header photograph's `sizes` matches its actual CSS widths, and the editorial heroes declare their correct 3:2 source dimensions. The native `picture` wrapper has no layout box and preserves the existing image crop and rounded service cover. A browser without AVIF support selects WebP; the original source remains the final fallback.
