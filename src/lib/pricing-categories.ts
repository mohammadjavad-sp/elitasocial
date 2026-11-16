export const pricingCategoryIds = ["instagram", "website", "seo", "support", "redesign", "content"] as const;
export type PricingCategoryId = typeof pricingCategoryIds[number];
export const pricingCategoryLabels: Record<PricingCategoryId, string> = {
  instagram: "مدیریت اینستاگرام", website: "طراحی وب‌سایت", seo: "سئو", support: "پشتیبانی",
  redesign: "ری دیزاین و اصلاح طراحی", content: "تولید محتوا",
};
export const pricingCategoryIcons = {
  instagram: "instagram", website: "website", seo: "sparkle", support: "phone", redesign: "website", content: "menu",
} as const;
