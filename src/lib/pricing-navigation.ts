import type { PricingContent } from "@/content/pricing";
import type { PricingCategoryId } from "./pricing-categories";
import { sitePath } from "./site-path";

export function servicePricingHref(category: PricingCategoryId) {
  return sitePath(`/pricing/?planCategory=${category}#pricing`);
}

export function readPricingCategory(search: string, pricing: PricingContent) {
  const requested = new URLSearchParams(search).get("planCategory");
  return pricing.categories.find(category => category.id === requested)?.id ?? null;
}
