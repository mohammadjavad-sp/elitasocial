/** Demo concepts only. Replace these records with approved client work before presenting real projects. */
export const portfolioCategories = [
  { id: "all", label: "همهٔ نمونه‌ها" },
  { id: "website", label: "طراحی وب‌سایت" },
  { id: "instagram", label: "مدیریت اینستاگرام" },
  { id: "content", label: "تولید محتوا" },
  { id: "seo", label: "سئو و ساختار سایت" },
] as const;

export type PortfolioCategory = Exclude<(typeof portfolioCategories)[number]["id"], "all">;
export type PortfolioProject = {
  id: string;
  title: string;
  category: PortfolioCategory;
  discipline: string;
  theme: "botanical" | "cafe" | "jewelry" | "beauty" | "studio" | "travel" | "interior" | "wellness";
  brand: string;
  headline: string;
  caption: string;
  description: string;
  deliverables: string[];
  isMock?: boolean;
  image?: { src: string; alt: string };
};

export const portfolioProjects: PortfolioProject[] = [
  { id: "botanical", title: "فروشگاه آنلاین گیاه و گلدان", category: "website", discipline: "طراحی فروشگاه اینترنتی", theme: "botanical", brand: "برگ", headline: "یک گوشهٔ سبز، برای تو", caption: "مسیر ساده از کشف محصول تا انتخاب گیاه مناسب خانه.", description: "کانسپت نمایشی یک فروشگاه گیاه؛ با تمرکز بر دسته‌بندی روشن، معرفی نیازهای هر گیاه و خرید آسان در موبایل. نام برند و تمام محتوای این طرح ساختگی‌اند.", deliverables: ["طراحی صفحهٔ اصلی و دسته‌بندی محصولات", "کارت محصول با اطلاعات نگهداری", "چیدمان واکنش‌گرا برای موبایل"] },
  { id: "cafe", title: "هویت محتوایی یک کافه", category: "instagram", discipline: "طراحی هویت پیج و تقویم محتوا", theme: "cafe", brand: "مکث", headline: "کمی مکث، یک فنجان قهوه", caption: "رنگ، لحن و محتوایی که حال‌وهوای کافه را منتقل کند.", description: "یک تمرین نمایشی برای ساختن هویت منسجم در اینستاگرام کافه؛ از معرفی منو تا قصه‌های پشت هر فنجان. این کانسپت به مشتری یا پیج واقعی تعلق ندارد.", deliverables: ["مسیر بصری و قالب پست‌های پیج", "ایدهٔ ریلز و استوری روزانه", "تقویم پیشنهادی محتوا و لحن برند"] },
  { id: "jewelry", title: "روایت یک کالکشن زیورآلات", category: "content", discipline: "ایده‌پردازی و طراحی محتوای محصول", theme: "jewelry", brand: "رَسا", headline: "جزئیات کوچک، قصه‌های ماندگار", caption: "یک روایت تصویری برای معرفی محصول و جزئیاتش.", description: "کانسپت محتوایی نمایشی برای معرفی مجموعه‌ای از زیورآلات؛ با تمرکز بر فرم محصول، کاربرد و قصهٔ ساخت. محصول، نام برند و کمپین صرفاً برای نمایش طراحی شده‌اند.", deliverables: ["ایده و سناریوی معرفی کالکشن", "چیدمان محتوای معرفی محصول", "متن پست و دعوت به گفت‌وگو"] },
  { id: "beauty", title: "ویترین یک برند مراقبت پوست", category: "website", discipline: "طراحی وب‌سایت فروشگاهی", theme: "beauty", brand: "روشا", headline: "مراقبت، به سادگی هر روز", caption: "طراحی آرام با تمرکز بر شناخت محصول و انتخاب آگاهانه.", description: "طرح نمایشی فروشگاه محصولات مراقبت پوست، با دسته‌بندی بر اساس نوع محصول و معرفی روشن ویژگی‌ها. هیچ ادعای درمانی یا نتیجهٔ تجاری در این نمونه مطرح نمی‌شود.", deliverables: ["طراحی ویترین محصولات", "ساختار صفحهٔ جزئیات محصول", "راهنمای تصویری انتخاب دسته‌بندی"] },
  { id: "studio", title: "ساختار محتوایی استودیوی طراحی", category: "seo", discipline: "معماری اطلاعات و محتوای سایت", theme: "studio", brand: "مدار", headline: "هر جست‌وجو، یک مسیر روشن", caption: "ساختاری که مخاطب را به خدمت موردنیازش برساند.", description: "طرح نمایشی بازچینی ساختار یک وب‌سایت خدمات طراحی؛ برای نشان دادن رابطهٔ صفحات خدمات، محتوای آموزشی و مسیر ارتباط. این طرح گزارش سئوی یک کسب‌وکار واقعی نیست.", deliverables: ["دسته‌بندی صفحات خدمات", "پیشنهاد عنوان و ساختار محتوای صفحات", "نقشهٔ لینک‌سازی داخلی و مسیر ارتباط"] },
  { id: "travel", title: "داستان‌های یک برند سفر", category: "instagram", discipline: "طراحی سری محتوایی اینستاگرام", theme: "travel", brand: "راهی", headline: "قصهٔ بعدی، کجاست؟", caption: "محتوای دنباله‌دار از الهام سفر تا برنامه‌ریزی مسیر.", description: "یک کانسپت نمایشی برای پیج خدمات سفر با مجموعه‌های محتوایی مشخص؛ از معرفی مقصد تا راهنمای آماده‌شدن برای سفر. نام و هویت این برند فرضی است.", deliverables: ["ستون‌های محتوایی و موضوعات سریالی", "قالب راهنمای مقصد و استوری", "پیشنهاد سناریوی ریلز"] },
  { id: "interior", title: "ارائهٔ پروژه‌های استودیوی معماری", category: "website", discipline: "طراحی وب‌سایت نمونه‌کار", theme: "interior", brand: "فرم", headline: "فضایی برای زندگی کردن", caption: "یک گالری خلوت که به ایده‌ها فضای دیده‌شدن می‌دهد.", description: "کانسپت نمایشی یک سایت معماری؛ با فضای تنفس زیاد، نمایش دسته‌بندی پروژه‌ها و معرفی رویکرد استودیو. طرح‌ها و برند، نمونه‌های فرضی طراحی هستند.", deliverables: ["طراحی گالری پروژه‌ها", "ساختار معرفی پروژه و رویکرد استودیو", "مسیر تماس برای درخواست همکاری"] },
  { id: "wellness", title: "مجموعهٔ محتوای سبک زندگی", category: "content", discipline: "طراحی محتوای آموزشی", theme: "wellness", brand: "آهسته", headline: "جا برای یک عادت خوب", caption: "مجموعه‌ای خوانا برای رساندن یک پیام در هر محتوا.", description: "یک مجموعهٔ نمایشی از محتوای سبک زندگی با تمرکز بر خوانایی و روایت تصویری ساده. محتوای این کانسپت پیشنهاد پزشکی یا تخصصی سلامت نیست.", deliverables: ["ساختار محتوای اسلایدی", "طراحی قالب‌های آموزشی یکپارچه", "متن کوتاه و دعوت به مشارکت"] },
];

export const portfolioDemoNotice = "این طرح‌ها نمایشی‌اند و برای معرفی سبک طراحی ساخته شده‌اند؛ پروژهٔ واقعی مشتریان الیتا سوشال نیستند.";

export function projectConsultationUrl(project: PortfolioProject, whatsapp: string) {
  const url = new URL(whatsapp);
  url.searchParams.set("text", `سلام، دربارهٔ خدمات مشابه ${project.isMock !== false ? "طرح نمایشی" : "پروژهٔ"} «${project.title}» مشاوره می‌خواهم.`);
  return url.toString();
}
