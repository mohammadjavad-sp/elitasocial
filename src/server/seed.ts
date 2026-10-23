import { articles } from "@/content/articles";
import { services } from "@/content/services";
import { portfolioProjects } from "@/content/portfolio";
import { pricingContent } from "@/content/pricing";
import type { CmsCollection, CmsStatus } from "@/lib/cms-shared";

/** Pure starter data shared by first-run provisioning and the Node content repository. */
export function getStarterSeed(): { collection: CmsCollection; data: Record<string, unknown>; status: CmsStatus }[] {
  return [
    ...articles.map(data => ({ collection: "articles" as const, data: { ...data }, status: "published" as const })),
    ...services.map(data => ({ collection: "services" as const, data: { ...data }, status: "published" as const })),
    ...portfolioProjects.map(data => ({ collection: "portfolio" as const, data: { ...data, isMock: data.isMock ?? true }, status: "published" as const })),
    ...pricingContent.categories.flatMap(category => category.plans.map(data => ({ collection: "plans" as const, data: { ...data, categoryId: category.id }, status: "published" as const }))),
  ];
}
