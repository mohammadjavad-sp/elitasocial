import { articles as starterArticles, type Article } from "@/content/articles";
import { pricingContent, type DemoPlan } from "@/content/pricing";
import { retiredPortfolioCopy } from "./retired-portfolio-copy";

// Only replace untouched starter copy. Saved editorial changes and metadata stay intact.
export function publicPlanCopy<T extends DemoPlan>(plan: T): T {
  const features = plan.features.map(retiredPortfolioCopy);
  const starter = plan.id === "care-content" && plan.description === "همراهی با سایتِ در حال توسعه"
    ? pricingContent.categories.find(category => category.id === "support")?.plans.find(candidate => candidate.id === plan.id)
    : undefined;
  return starter || features.some((feature, index) => feature !== plan.features[index])
    ? { ...plan, features, description: starter?.description ?? plan.description }
    : plan;
}

const legacyMaintenanceParagraph = "قیمت‌ها، امکانات پلن‌ها و نمونه‌کارهای قابل انتشار را با دقت بیشتری مرور کن. اگر اطلاعات موقت یا نمایشی در سایت وجود دارد، وضعیت آن باید برای بازدیدکننده روشن باشد. یک تاریخ داخلی برای بازبینی بعدی تعیین کن تا اصلاح محتوا وابسته به یادآوری اتفاقی نباشد.";

function maintenanceArticleCopy(article: Article): Article {
  if (article.slug !== "website-maintenance") return article;
  const replacement = starterArticles
    .find(candidate => candidate.slug === article.slug)
    ?.sections.find(section => section.id === "keep-service-details-current")
    ?.paragraphs[1];
  if (!replacement) return article;

  let changed = false;
  const sections = article.sections.map(section => {
    if (section.id !== "keep-service-details-current") return section;
    const paragraphs = section.paragraphs.map(paragraph => {
      if (paragraph !== legacyMaintenanceParagraph) return paragraph;
      changed = true;
      return replacement;
    });
    return paragraphs.some((paragraph, index) => paragraph !== section.paragraphs[index])
      ? { ...section, paragraphs }
      : section;
  });
  return changed ? { ...article, sections } : article;
}

export function publicArticleCopy(article: Article): Article {
  const current = maintenanceArticleCopy(article);
  let changed = false;
  const sections = current.sections.map(section => {
    const paragraphs = section.paragraphs.map(retiredPortfolioCopy);
    const bullets = section.bullets?.map(retiredPortfolioCopy);
    if (!paragraphs.some((paragraph, index) => paragraph !== section.paragraphs[index]) && !bullets?.some((bullet, index) => bullet !== section.bullets?.[index])) return section;
    changed = true;
    return { ...section, paragraphs, ...(bullets ? { bullets } : {}) };
  });
  return changed ? { ...current, sections } : current;
}
