import { articles as starterArticles, type Article } from "@/content/articles";
import { pricingContent, type DemoPlan } from "@/content/pricing";
import { services as starterServices, type ServiceDetail } from "@/content/services";
import { retiredPortfolioCopy } from "./retired-portfolio-copy";

const serviceSearchCopy = {
  website: {
    title: "طراحی سایت و توسعهٔ وب‌سایت",
    headline: "طراحی سایت برای حضور حرفه‌ای برندت",
    intro: "طراحی سایت متناسب با هویت برند، با ساختار روشن و نمایش مناسب در موبایل و دسکتاپ؛ از بررسی نیازها تا راه‌اندازی و تحویل وب‌سایت.",
  },
  instagram: {
    title: "ادمینی اینستاگرام و مدیریت پیج",
    headline: "ادمینی اینستاگرام با برنامه و هویت مشخص",
    intro: "خدمات ادمینی اینستاگرام؛ از تقویم محتوا و انتشار پست، ریلز و استوری تا رسیدگی به دایرکت و کامنت، در محدودهٔ همکاری هماهنگ با برندت.",
  },
};

/** Upgrade only untouched starter fields, including on existing CMS installations. */
export function publicServiceCopy(service: ServiceDetail): ServiceDetail {
  if (service.slug !== "website" && service.slug !== "instagram") return service;
  const starter = starterServices.find(item => item.slug === service.slug)!;
  const copy = serviceSearchCopy[service.slug];
  return {
    ...service,
    title: service.title === starter.title ? copy.title : service.title,
    headline: service.headline === starter.headline ? copy.headline : service.headline,
    intro: service.intro === starter.intro ? copy.intro : service.intro,
  };
}

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
