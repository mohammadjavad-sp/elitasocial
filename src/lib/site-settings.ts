import { homeContent } from "@/content/home";
import { closingContent } from "@/content/closing";
import { pricingContent } from "@/content/pricing";

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
    contactTitle: string[];
    contactDescription: string;
    contactInfoTitle: string;
    contactInfoDescription: string;
    contactFormTitle: string;
    contactFormDescription: string;
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
      bottomNote: "محتوای نمونهٔ سایت در حال تکمیل است.",
    },
    seo: {
      title: "الیتا سوشال | مدیریت اینستاگرام و طراحی سایت با الهه طاهری",
      description: "با الهه طاهری در الیتا سوشال، از مدیریت اینستاگرام تا طراحی وب‌سایت همراه برند شما هستیم. برای مشاوره و شروع همکاری در ارتباط باشید.",
    },
    sections: {
      portfolioTitle: "هر برند، یک دنیای دیدنی",
      portfolioDescription: "از ویترین یک فروشگاه تا قصهٔ یک پیج؛ چند ایده برای آنچه می‌توانیم با هم بسازیم.",
      portfolioActionLabel: "همهٔ نمونه‌ها",
      pricingTitle: [...pricingContent.title],
      pricingDescription: pricingContent.description,
      pricingFootnote: "هزینهٔ نهایی و محدودهٔ همکاری، بعد از بررسی نیازهای برندت مشخص می‌شود.",
      insightsTitle: ["چند دقیقه برای", "حضور بهترِ برندت"],
      insightsDescription: "یادداشت‌های کاربردی دربارهٔ محتوا، طراحی و ارتباط با مخاطب. مقاله‌ها فعلاً محتوای نمونهٔ مجله‌اند.",
      insightsActionLabel: "همهٔ مقاله‌های مجله",
      contactTitle: ["از ایده‌ات بگو،", "قدم اول را با هم برداریم"],
      contactDescription: "برای پیجت برنامه داری یا به یک وب‌سایت فکر می‌کنی؟ راه ارتباطی دلخواهت را انتخاب کن.",
      contactInfoTitle: "مستقیم در ارتباط باشیم",
      contactInfoDescription: "من الهه طاهری‌ام. دربارهٔ برندت و چیزی که می‌خوای بسازی، برام بنویس.",
      contactFormTitle: "برندت به چی نیاز داره؟",
      contactFormDescription: "درخواستت را بنویس؛ برای هماهنگی مشاوره از راه ارتباطی‌ای که وارد می‌کنی با تو تماس می‌گیریم.",
      faqTitle: "قبل از شروع، شاید سؤال تو هم باشه",
      faqDescription: "چند نکته دربارهٔ مسیر همکاری",
    },
  };
}

/** Action URLs follow the saved contact number; layout keys remain code-owned. */
export function normalizeSiteSettings(value: SiteSettings): SiteSettings {
  // New fields receive defaults on upgrades; intentional empty strings/FAQ lists stay empty.
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
  const settings = fillDefaults(getDefaultSiteSettings(), value) as SiteSettings;
  if (settings.sections.contactFormDescription === "اطلاعات را بنویس تا پیامت برای ادامهٔ گفتگو در واتساپ آماده شود.") {
    settings.sections.contactFormDescription = getDefaultSiteSettings().sections.contactFormDescription;
  }
  settings.home.navigation = structuredClone(homeContent.navigation);
  settings.home.services.items = structuredClone(homeContent.services.items);
  settings.home.benefits.items = settings.home.benefits.items.map((item, index) => {
    const original = homeContent.benefits.items[index];
    const href = new URL(settings.home.contact.whatsapp);
    const message = new URL(original.href).searchParams.get("text");
    if (message) href.searchParams.set("text", message);
    return { ...item, href: href.toString() };
  });
  return settings;
}
