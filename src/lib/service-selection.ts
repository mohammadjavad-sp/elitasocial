import { pricingContent, type DemoPlan } from "@/content/pricing";
import { sitePath } from "@/lib/site-path";

export const serviceLabels = {
  instagram: "مدیریت اینستاگرام",
  website: "طراحی وب‌سایت",
  content: "تولید محتوا",
  seo: "سئو و پشتیبانی سایت",
} as const;

export type ServiceId = keyof typeof serviceLabels;
export type PlanCategoryId = "instagram" | "website" | "support";
export type SelectedPlan = { plan: DemoPlan; categoryId: string; categoryLabel: string; service: ServiceId };

const categoryServices: Record<string, ServiceId> = { instagram: "instagram", website: "website", support: "seo" };

export function serviceContactHref(service: ServiceId) {
  return sitePath(`/?service=${service}#contact`);
}

export function servicePricingHref(category: PlanCategoryId) {
  return sitePath(`/?planCategory=${category}#pricing`);
}

export function planContactHref(categoryId: string, planId: string) {
  const params = new URLSearchParams({ service: categoryServices[categoryId] ?? "seo", planCategory: categoryId, plan: planId });
  return sitePath(`/?${params.toString()}#contact`);
}

/** Only known service and plan values can become visible form context. */
export function readServiceSelection(search: string) {
  const params = new URLSearchParams(search);
  const requestedService = params.get("service");
  const service = requestedService && Object.hasOwn(serviceLabels, requestedService) ? requestedService as ServiceId : null;
  const category = pricingContent.categories.find(item => item.id === params.get("planCategory"));
  let selectedPlan: SelectedPlan | null = null;
  for (const item of pricingContent.categories) {
    const plan = item.plans.find(candidate => candidate.id === params.get("plan"));
    const planService = categoryServices[item.id];
    if (plan && (!service || service === planService) && (!category || category.id === item.id)) {
      selectedPlan = { plan, categoryId: item.id, categoryLabel: item.label, service: planService };
      break;
    }
  }
  return { service: service ?? selectedPlan?.service ?? null, categoryId: category?.id ?? selectedPlan?.categoryId ?? null, selectedPlan };
}
