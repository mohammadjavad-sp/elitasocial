import { homeContent } from "@/content/home";
import { closingContent } from "@/content/closing";
import { pricingContent } from "@/content/pricing";
import { normalizeBrandText } from "./brand-text";

export type SiteSettings = {
  home: typeof homeContent;
  faqs: typeof closingContent.faqs;
  header: { ctaLabel: string; mobileCtaLabel: string };
  footer: {
    ctaTitle: string;
    ctaDescription: string;
    ctaLabel: string;
    description: string;
    contactTitle: string;
    contactDescription: string;
    bottomNote: string;
  };
  seo: { title: string; description: string };
  sections: {
    portfolioTitle: string;
    portfolioDescription: string;
    portfolioActionLabel: string;
    pricingTitle: string[];
    pricingDescription: string;
    pricingFootnote: string;
    insightsTitle: string[];
    insightsDescription: string;
    insightsActionLabel: string;
    faqTitle: string;
    faqDescription: string;
  };
};

export type CmsSiteSettings = { data: SiteSettings; revision: number; updatedAt: string };

/** Starter data is also the content of the static GitHub Pages preview. */
export function getDefaultSiteSettings(): SiteSettings {
  return {
    home: structuredClone(homeContent),
    faqs: structuredClone(closingContent.faqs),
    header: { ctaLabel: "بیا از برندت بگیم", mobileCtaLabel: "مشاوره و شروع همکاری" },
    footer: {
      ctaTitle: "حالا نوبت برند توئه",
      ctaDescription: "برای یک حضور منسجم‌تر، از یک گفتگوی ساده شروع کنیم.",
      ctaLabel: "بیا دربارهٔ برندت حرف بزنیم",
      description: "از اینستاگرام تا وب‌سایت؛\nمحتوا، طراحی و همراهی برای برند تو.",
      contactTitle: "یک گفتگو تا شروع",
      contactDescription: "کسب‌وکارت را معرفی کن؛\nدربارهٔ قدم بعدی حرف می‌زنیم.",
      bottomNote: "",
    },
    seo: {
      title: "الیتا سوشیال | مدیریت اینستاگرام و طراحی سایت با الهه طاهری",
      description: "با الهه طاهری در الیتا سوشیال، از مدیریت اینستاگرام تا طراحی وب‌سایت همراه برند شما هستیم. برای مشاوره و شروع همکاری در ارتباط باشید.",
    },
    sections: {
      portfolioTitle: "از ایده تا اجرا، نمونه‌ها را در پیج ببین",
      portfolioDescription: "نمونه‌های ادمینی اینستاگرام، طراحی سایت، سئو و تولید محتوا را در پیج الیتا دنبال کن؛ با سبک کارها آشنا شو و ایدهٔ نزدیک به برندت را پیدا کن.",
      portfolioActionLabel: "دیدن نمونه‌کارها در اینستاگرام",
      pricingTitle: [...pricingContent.title],
      pricingDescription: pricingContent.description,
      pricingFootnote: "هزینهٔ نهایی و محدودهٔ همکاری، بعد از بررسی نیازهای برندت مشخص می‌شود.",
      insightsTitle: ["چند دقیقه برای", "حضور بهترِ برندت"],
      insightsDescription: "یادداشت‌های کاربردی دربارهٔ محتوا، طراحی و ارتباط با مخاطب.",
      insightsActionLabel: "همهٔ مقاله‌های مجله",
      faqTitle: "قبل از شروع، شاید سؤال تو هم باشه",
      faqDescription: "چند نکته دربارهٔ مسیر همکاری",
    },
  };
}

/** Saved values follow the current settings shape; layout keys remain code-owned. */
export function normalizeSiteSettings(value: SiteSettings): SiteSettings {
  const defaults = getDefaultSiteSettings();
  // Preserve intentional empty values; the former Rubika placeholder is upgraded below.
  const fillDefaults = (template: unknown, saved: unknown): unknown => {
    if (Array.isArray(template)) {
      if (!Array.isArray(saved)) return structuredClone(template);
      return saved.map((entry, index) => fillDefaults(template[index] ?? template[0], entry));
    }
    if (template && typeof template === "object") {
      const source = saved && typeof saved === "object" && !Array.isArray(saved) ? saved as Record<string, unknown> : {};
      return Object.fromEntries(Object.entries(template).map(([key, entry]) => [key, fillDefaults(entry, source[key])]));
    }
    return saved !== undefined && typeof saved === typeof template ? saved : structuredClone(template);
  };
  const settings = normalizeBrandText(fillDefaults(defaults, value) as SiteSettings);
  // Rubika used to be an icon-only placeholder in saved CMS settings.
  if (settings.home.contact.rubika === "") settings.home.contact.rubika = defaults.home.contact.rubika;
  // Upgrade unchanged starter copy while preserving the owner's edited content.
  if (settings.sections.portfolioTitle === "هر برند، یک دنیای دیدنی") settings.sections.portfolioTitle = defaults.sections.portfolioTitle;
  if (["از ویترین یک فروشگاه تا قصهٔ یک پیج؛ چند ایده برای آنچه می‌توانیم با هم بسازیم.", "نمونه‌هایی از طراحی سایت، تولید محتوا و سئو؛ برای ایده گرفتن از آنچه می‌توانیم با هم بسازیم."].includes(settings.sections.portfolioDescription)) {
    settings.sections.portfolioDescription = defaults.sections.portfolioDescription;
  }
  if (settings.sections.portfolioActionLabel === "همهٔ نمونه‌ها") settings.sections.portfolioActionLabel = defaults.sections.portfolioActionLabel;
  if (settings.home.hero.secondaryLabel === "دیدن نمونه‌کارها") settings.home.hero.secondaryLabel = defaults.home.hero.secondaryLabel;
  if (settings.footer.bottomNote === "محتوای نمونهٔ سایت در حال تکمیل است.") {
    settings.footer.bottomNote = defaults.footer.bottomNote;
  }
  if (settings.sections.insightsDescription === "یادداشت‌های کاربردی دربارهٔ محتوا، طراحی و ارتباط با مخاطب. مقاله‌ها فعلاً محتوای نمونهٔ مجله‌اند.") {
    settings.sections.insightsDescription = defaults.sections.insightsDescription;
  }
  settings.faqs = settings.faqs.map(faq => faq.question === "قیمت نهایی چطور مشخص می‌شه؟" && faq.answer === "پلن‌های فعلی نمونه‌اند. مبلغ و جزئیات نهایی، پس از بررسی نیازها و توافق دربارهٔ خدمات و خروجی‌ها مشخص می‌شود."
    ? { ...faq, answer: closingContent.faqs[3].answer }
    : faq);
  settings.home.navigation = structuredClone(homeContent.navigation);
  settings.home.services.items = structuredClone(homeContent.services.items);
  return settings;
}
