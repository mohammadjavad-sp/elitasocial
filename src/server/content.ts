import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { articles as starterArticles, type Article } from "@/content/articles";
import { services as starterServices, type ServiceDetail } from "@/content/services";
import { pricingContent, type DemoPlan, type PricingContent, type PricingCategoryId } from "@/content/pricing";
import { publicArticleCopy, publicPlanCopy, publicServiceCopy } from "@/lib/public-content-copy";
import { getStarterSeed } from "./seed";
import { ensurePricingCategories } from "./pricing-migration";

type PublicContent = {
  articles: Article[];
  services: ServiceDetail[];
  pricing: PricingContent;
};

/** Static previews use starter content; Node requests read published records directly. */
export const getCmsContent = cache(async (): Promise<PublicContent> => {
  if (process.env.DEPLOY_TARGET === "github-pages") {
    return { articles: starterArticles, services: starterServices.map(publicServiceCopy), pricing: pricingContent };
  }

  // Exclude this database read from prerendering and the full-route cache.
  await connection();
  const { ensureSeed, listRecords } = await import("./database");
  ensureSeed(getStarterSeed());
  ensurePricingCategories();
  const articles = listRecords("articles", true).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(record => publicArticleCopy(record.data as Article));
  const services = listRecords("services", true).map(record => publicServiceCopy(record.data as ServiceDetail));
  const plans = listRecords("plans", true).map(record => publicPlanCopy(record.data as DemoPlan & { categoryId: PricingCategoryId }));
  const pricing: PricingContent = {
    ...pricingContent,
    categories: pricingContent.categories.map(category => ({ ...category, plans: plans.filter(plan => plan.categoryId === category.id) })),
  };
  // Empty collections are intentional. Never replace deletions or drafts with demo records.
  return { articles, services, pricing };
});
