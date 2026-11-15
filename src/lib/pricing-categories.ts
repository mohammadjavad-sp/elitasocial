export const pricingCategoryIds = ["instagram", "website", "seo", "support", "redesign", "content"] as const;
export type PricingCategoryId = typeof pricingCategoryIds[number];
export const pricingCategoryLabels: Record<PricingCategoryId, string> = {
  instagram: "مدیریت اینستاگرام", website: "طراحی وب‌سایت", seo: "سئو", support: "پشتیبانی",
  redesign: "ری دیزاین و اصلاح طراحی", content: "تولید محتوا",
};
// Consultation services keep their existing identifiers; the selected plan
// records the precise category separately, including support and redesign.
export const pricingCategoryServices = {
  instagram: "instagram", website: "website", seo: "seo", support: "seo", redesign: "website", content: "content",
} as const;
export const pricingCategoryIcons = {
  instagram: "instagram", website: "website", seo: "sparkle", support: "phone", redesign: "website", content: "menu",
} as const;
