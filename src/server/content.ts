import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { articles as starterArticles, type Article } from "@/content/articles";
import { services as starterServices, type ServiceDetail } from "@/content/services";
import { portfolioProjects as starterPortfolio, type PortfolioProject } from "@/content/portfolio";
import { pricingContent, type DemoPlan, type PricingContent, type PricingCategoryId } from "@/content/pricing";
import { getStarterSeed } from "./seed";

type PublicContent = {
  articles: Article[];
  services: ServiceDetail[];
  portfolio: PortfolioProject[];
  pricing: PricingContent;
};

/** Static previews use starter content; Node requests read published records directly. */
export const getCmsContent = cache(async (): Promise<PublicContent> => {
  if (process.env.DEPLOY_TARGET === "github-pages") {
    return { articles: starterArticles, services: starterServices, portfolio: starterPortfolio, pricing: pricingContent };
  }

  // Exclude this database read from prerendering and the full-route cache.
  await connection();
  const { ensureSeed, listRecords } = await import("./database");
  ensureSeed(getStarterSeed());
  const articles = listRecords("articles", true).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(record => record.data as Article);
  const services = listRecords("services", true).map(record => record.data as ServiceDetail);
  const portfolio = listRecords("portfolio", true).map(record => record.data as PortfolioProject);
  const plans = listRecords("plans", true).map(record => record.data as DemoPlan & { categoryId: PricingCategoryId });
  const pricing: PricingContent = {
    ...pricingContent,
    categories: pricingContent.categories.map(category => ({ ...category, plans: plans.filter(plan => plan.categoryId === category.id) })),
  };
  // Empty collections are intentional. Never replace deletions or drafts with demo records.
  return { articles, services, portfolio, pricing };
});
