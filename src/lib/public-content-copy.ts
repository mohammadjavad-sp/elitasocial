import { articles as starterArticles, type Article } from "@/content/articles";
import { portfolioProjects as starterPortfolio, type PortfolioProject } from "@/content/portfolio";
import { pricingContent, type DemoPlan } from "@/content/pricing";

// Only replace untouched starter copy. Saved editorial changes and metadata stay intact.
const legacyPortfolioDescriptions: Record<string, string> = {
  botanical: "کانسپت نمایشی یک فروشگاه گیاه؛ با تمرکز بر دسته‌بندی روشن، معرفی نیازهای هر گیاه و خرید آسان در موبایل. نام برند و تمام محتوای این طرح ساختگی‌اند.",
  cafe: "یک تمرین نمایشی برای ساختن هویت منسجم در اینستاگرام کافه؛ از معرفی منو تا قصه‌های پشت هر فنجان. این کانسپت به مشتری یا پیج واقعی تعلق ندارد.",
  jewelry: "کانسپت محتوایی نمایشی برای معرفی مجموعه‌ای از زیورآلات؛ با تمرکز بر فرم محصول، کاربرد و قصهٔ ساخت. محصول، نام برند و کمپین صرفاً برای نمایش طراحی شده‌اند.",
  beauty: "طرح نمایشی فروشگاه محصولات مراقبت پوست، با دسته‌بندی بر اساس نوع محصول و معرفی روشن ویژگی‌ها. هیچ ادعای درمانی یا نتیجهٔ تجاری در این نمونه مطرح نمی‌شود.",
  studio: "طرح نمایشی بازچینی ساختار یک وب‌سایت خدمات طراحی؛ برای نشان دادن رابطهٔ صفحات خدمات، محتوای آموزشی و مسیر ارتباط. این طرح گزارش سئوی یک کسب‌وکار واقعی نیست.",
  travel: "یک کانسپت نمایشی برای پیج خدمات سفر با مجموعه‌های محتوایی مشخص؛ از معرفی مقصد تا راهنمای آماده‌شدن برای سفر. نام و هویت این برند فرضی است.",
  interior: "کانسپت نمایشی یک سایت معماری؛ با فضای تنفس زیاد، نمایش دسته‌بندی پروژه‌ها و معرفی رویکرد استودیو. طرح‌ها و برند، نمونه‌های فرضی طراحی هستند.",
  wellness: "یک مجموعهٔ نمایشی از محتوای سبک زندگی با تمرکز بر خوانایی و روایت تصویری ساده. محتوای این کانسپت پیشنهاد پزشکی یا تخصصی سلامت نیست.",
};

export function publicPortfolioCopy(project: PortfolioProject): PortfolioProject {
  if (project.description !== legacyPortfolioDescriptions[project.id]) return project;
  const starter = starterPortfolio.find(candidate => candidate.id === project.id);
  return starter ? { ...project, description: starter.description } : project;
}

export function publicPlanCopy<T extends DemoPlan>(plan: T): T {
  if (plan.id !== "care-content" || plan.description !== "همراهی با سایتِ در حال توسعه") return plan;
  const starter = pricingContent.categories
    .find(category => category.id === "support")
    ?.plans.find(candidate => candidate.id === plan.id);
  return starter ? { ...plan, description: starter.description } : plan;
}

const legacyMaintenanceParagraph = "قیمت‌ها، امکانات پلن‌ها و نمونه‌کارهای قابل انتشار را با دقت بیشتری مرور کن. اگر اطلاعات موقت یا نمایشی در سایت وجود دارد، وضعیت آن باید برای بازدیدکننده روشن باشد. یک تاریخ داخلی برای بازبینی بعدی تعیین کن تا اصلاح محتوا وابسته به یادآوری اتفاقی نباشد.";

export function publicArticleCopy(article: Article): Article {
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
