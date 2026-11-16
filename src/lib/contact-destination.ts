import { sitePath } from "./site-path";

// Keep the established fragment usable for old links, including URLs with old queries.
export const contactSectionId = "contact";

export function contactSectionHref() {
  return sitePath(`/#${contactSectionId}`);
}
