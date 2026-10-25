# Editorial hero images and supplied logo restoration

These assets were prepared for the portfolio and magazine hero refresh. Generated photos are editorial decoration; they do not depict real client projects.

Mode: built-in `image_gen.imagegen`. No CLI or API-key fallback was used.

## Portfolio hero

- File: `public/images/portfolio-hero.webp`
- Generated source: `C:/Users/Mohamad Javad/.codex/generated_images/01a17225-0847-7ac3-92b2-d6edec544ff6/exec-4298d089-c3a1-4396-9228-fd5efe06ae3e.png`
- Output: 1440 × 960 px, WebP quality 84, 181404 bytes.
- Source was generated at 1536 × 1024 px and inspected before resizing with Sharp.
- Exact prompt:

```text
Use case: photorealistic-natural.
Asset type: photographic hero image for a premium Persian digital design studio's portfolio page, landscape 3:2 composition, final intended image approximately 1500 by 1100.
Primary request: a beautifully art-directed creative digital design workspace showing the tangible work behind branding and websites. A slim open silver laptop displays a refined abstract web design composition made only of color blocks, cropped fashion objects and elegant non-readable type shapes. Around it are printed brand layout sheets, lilac and warm ivory tone papers, a phone showing an abstract matching mobile composition, and a few considered color swatches.
Style/medium: convincing high-end editorial photography, realistic materials, subtle film grain, sophisticated design magazine quality.
Composition/framing: close three-quarter overhead angle, interesting arranged subject fills the image, balanced layered papers and screen, no huge empty background, image itself is a real scene rather than a flat website screenshot.
Lighting/mood: soft directional natural sunlight and gentle shadows, warm creative studio atmosphere.
Color palette: warm ivory desk, muted lavender, blush pink and deep plum design accents.
Constraints: no people or faces; no logos, brands, watermark, icons floating in air, fake performance charts, readable text, or customer claims; keep objects plausible and elegant.
```

## Magazine hero

- File: `public/images/magazine-hero.webp`
- Generated source: `C:/Users/Mohamad Javad/.codex/generated_images/01a17225-0847-7ac3-92b2-d6edec544ff6/exec-4f72f4b3-8e0e-4588-911a-b212845c9d86.png`
- Output: 1440 × 960 px, WebP quality 84, 193712 bytes.
- Source was generated at 1536 × 1024 px and inspected before resizing with Sharp.
- Exact prompt:

```text
Use case: photorealistic-natural.
Asset type: photographic hero image for the editorial journal of a premium Persian digital marketing studio, landscape 3:2 composition, final intended image approximately 1500 by 1100.
Primary request: an inspiring editorial content-planning workspace captured slightly overhead. An open editorial notebook with tasteful abstract thumbnail sketches and simple ruled planning marks sits among beautiful photographic contact-sheet printouts, ivory layout papers and a few lavender editorial cards. A slim laptop is partially visible along the side, plus a simple pen and a single small glass tumbler.
Style/medium: high-end natural editorial photography with convincing paper textures, real photographic contact sheets showing architectural and creative-detail subjects, subtle film grain.
Composition/framing: a tighter arranged still life, notebook and layered photographic pages fill the frame and give clear visual interest; distinct from a website-design mockup, no empty half frame.
Lighting/mood: warm diffuse studio daylight with delicate directional shadows.
Color palette: creamy white paper, warm pale stone tabletop, lavender and dusty rose studio accents, rich charcoal pen.
Constraints: no people, faces, brands, logos, readable letters or numbers, watermark, fabricated statistics, floating symbols; editorial photographic still life, not an illustration or website screenshot.
```

## Supplied logo

- File: `public/images/elita-social-logo.webp`
- Site icon: `src/app/icon.png`, derived from the final logo at 512 × 512 px with transparent padding; replaces the earlier generic star icon.
- Edit target supplied by the user: `C:/Users/Mohamad Javad/Downloads/IMG_7115.PNG` (171 × 109 px, transparent).
- Generated source: `C:/Users/Mohamad Javad/.codex/generated_images/01a17225-0847-7ac3-92b2-d6edec544ff6/exec-a5894d86-92c2-49f0-ad60-6d4214289107.png`.
- Output: 1200 × 767 px, lossless WebP with transparent alpha, 58982 bytes.
- The existing custom serif ligature wordmark and spaced SOCIAL were preserved rather than redesigned. Sharp removed faint alpha speckles using a 128 threshold, lightly smoothed the remaining contours with a 5 px median and 0.8 px blur, trimmed the empty bounds, resized, and added 8 px of transparent breathing room. All eight meaningful connected components were retained: connected wordmark, i-dot, and the six SOCIAL letters.
- Foreground colors were restored from the supplied source, rather than retaining generated color variation: the main wordmark is `#694F8E` (source dominant RGB 105, 79, 142), and SOCIAL is `#B692C2` (source alpha-weighted RGB approximately 182, 146, 194).
- Exact edit prompt:

```text
Use case: background-extraction.
Asset type: high-resolution transparent website brand logo.
Input images: Image 1 is the exact logo to clean up and upscale; it is an edit target, not a style reference.
Primary request: restore this small raster logo as an extremely clean high-resolution transparent version with crisp smooth edges, ideally about 1400 pixels wide at the same aspect ratio. The logo reads exactly "elita" in its existing highly distinctive custom-ligature serif wordmark, and "SOCIAL" in widely spaced uppercase lettering underneath.
Constraints: preserve the exact supplied design and identity: every existing letter shape, stroke, interlocking ligature, letter position, baseline, spacing, relative size, and muted purple coloring. Do not redesign, re-typeset, reinterpret, add embellishments, change spelling, or invent different glyphs. The peculiar connected e-l-i-t-a contours in the source must remain the same. Retain the small uppercase SOCIAL below exactly where it is. Change only raster quality: remove jagged pixel edges and blur while keeping contours faithful. Use a genuinely transparent alpha background, no black or white rectangle, no checkerboard baked into the pixels, no shadow, no border.
```

All final assets were visually checked. The logo preserves genuine alpha, while the editorial photographs are opaque. The original files in the generated-images directory were left in place.

