import type { PricingCategoryId } from "@/lib/pricing-categories";
export type { PricingCategoryId } from "@/lib/pricing-categories";

export type DemoPlan = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  period: string;
  features: string[];
  recommended?: boolean;
  isMock: boolean;
};

export type PricingContent = {
  title: string[];
  description: string;
  notice: string;
  categories: { id: PricingCategoryId; label: string; plans: DemoPlan[] }[];
};

export const pricingContent: PricingContent = {
  title: ["یک همکاری،", "متناسب با نیازِ برندت"],
  description: "از همراهی با پیج تا طراحی سایت؛ مسیر مناسب را بر اساس نیاز کسب‌وکارت انتخاب کن.",
  notice: "",
  categories: [
    { id: "instagram", label: "مدیریت اینستاگرام", plans: [
      { id: "ig-start", name: "شروع منظم", description: "برای شروع یک حضور منسجم", price: 4900000, currency: "تومان", period: "ماهانه", features: ["تقویم محتوای ماهانه", "۸ محتوای پست و ریلز", "طراحی قالب استوری", "هماهنگی و بازبینی محتوا"], isMock: true },
      { id: "ig-growth", name: "همراهی بیشتر", description: "برای پیجی با فعالیت مستمر", price: 7900000, currency: "تومان", period: "ماهانه", features: ["تقویم و ایده‌پردازی محتوا", "۱۲ محتوای پست و ریلز", "استوری و مدیریت انتشار", "گزارش و جلسهٔ بازخورد", "هماهنگی لحن و هویت بصری"], recommended: true, isMock: true },
      { id: "ig-team", name: "همراه برند", description: "برای همکاری با دامنهٔ گسترده‌تر", price: 11900000, currency: "تومان", period: "ماهانه", features: ["برنامهٔ محتوایی اختصاصی", "۱۶ محتوای پست و ریلز", "سناریونویسی کمپین", "مدیریت انتشار و تعامل", "بازبینی و گزارش دوره‌ای"], isMock: true },
    ] satisfies DemoPlan[] },
    { id: "website", label: "طراحی وب‌سایت", plans: [
      { id: "web-intro", name: "معرفی برند", description: "یک خانهٔ آنلاین برای کسب‌وکارت", price: 19000000, currency: "تومان", period: "پروژه‌ای", features: ["طراحی صفحهٔ اصلی و خدمات", "چیدمان مناسب موبایل", "راه‌های ارتباط و مشاوره", "آموزش مدیریت محتوای پایه"], isMock: true },
      { id: "web-business", name: "سایت کسب‌وکار", description: "برای معرفی کامل‌تر خدمات", price: 29000000, currency: "تومان", period: "پروژه‌ای", features: ["طراحی اختصاصی صفحات اصلی", "مجله و معرفی خدمات", "مدیریت محتوای سایت", "ساختار اولیهٔ سئو", "آموزش و همراهی راه‌اندازی"], recommended: true, isMock: true },
      { id: "web-custom", name: "تجربهٔ اختصاصی", description: "برای نیازهای متنوع‌تر برند", price: 45000000, currency: "تومان", period: "پروژه‌ای", features: ["بررسی نیاز و مسیر کاربر", "طراحی رابط اختصاصی", "بخش‌ها و فرم‌های سفارشی", "مدیریت محتوا و رسانه", "بررسی و بهینه‌سازی تجربه"], isMock: true },
    ] satisfies DemoPlan[] },
    { id: "seo", label: "سئو", plans: [
      { id: "seo-base", name: "شروع سئو", description: "برای شناخت وضعیت و اولویت‌های سایت", price: 3900000, currency: "تومان", period: "ماهانه", features: ["بررسی فنی و وضعیت ایندکس", "تحقیق اولیهٔ کلمات کلیدی", "اصلاح عنوان و توضیحات صفحات", "گزارش اولویت‌های بهبود"], isMock: true },
      { id: "seo-growth", name: "رشد در جست‌وجو", description: "برای بهبود منظم محتوا و ساختار", price: 6900000, currency: "تومان", period: "ماهانه", features: ["تمام موارد شروع سئو", "تحلیل رقبا و فرصت‌های محتوا", "بهینه‌سازی محتوای صفحات منتخب", "بررسی لینک‌سازی داخلی", "گزارش و جلسهٔ ماهانه"], recommended: true, isMock: true },
      { id: "seo-full", name: "مسیر جامع سئو", description: "برای برنامهٔ فنی و محتوایی گسترده‌تر", price: 10900000, currency: "تومان", period: "ماهانه", features: ["برنامهٔ اختصاصی سئو", "ممیزی فنی و پیگیری اصلاحات", "استراتژی و تقویم محتوای سایت", "تحلیل عملکرد صفحات و جست‌وجوها", "بازبینی دوره‌ای مسیر رشد"], isMock: true },
    ] satisfies DemoPlan[] },
    { id: "support", label: "پشتیبانی", plans: [
      { id: "care-base", name: "مراقبت پایه", description: "برای رسیدگی منظم به سایت", price: 2500000, currency: "تومان", period: "ماهانه", features: ["بررسی وضعیت عمومی سایت", "به‌روزرسانی محتوای موجود", "بررسی لینک‌ها و فرم‌ها", "پیگیری مشکلات گزارش‌شده"], isMock: true },
      { id: "care-content", name: "محتوا و مراقبت", description: "همراهی با رشد و محتوای سایت", price: 4900000, currency: "تومان", period: "ماهانه", features: ["تمام موارد مراقبت پایه", "بهینه‌سازی محتوای صفحات", "بازبینی عنوان و توضیحات", "گزارش و پیشنهادهای بهبود", "هماهنگی برنامهٔ محتوایی"], recommended: true, isMock: true },
      { id: "care-full", name: "همراه سایت", description: "برای نیازهای محتوایی و فنی بیشتر", price: 7900000, currency: "تومان", period: "ماهانه", features: ["برنامهٔ پشتیبانی اختصاصی", "بازبینی ساختار و محتوا", "بهبود تجربهٔ صفحات", "پیگیری تغییرات و نیازها", "جلسهٔ بازخورد دوره‌ای"], isMock: true },
    ] satisfies DemoPlan[] },
    { id: "redesign", label: "ری دیزاین و اصلاح طراحی", plans: [
      { id: "redesign-refresh", name: "تازه‌سازی ظاهر", description: "برای اصلاح بخش‌های اصلی طراحی فعلی", price: 7900000, currency: "تومان", period: "پروژه‌ای", features: ["بررسی ظاهر و مشکلات فعلی", "اصلاح رنگ، فونت و فاصله‌ها", "بازطراحی بخش‌های منتخب", "بهبود نمایش در موبایل"], isMock: true },
      { id: "redesign-structure", name: "بازطراحی تجربه", description: "برای یک مسیر روشن‌تر در سایت", price: 14900000, currency: "تومان", period: "پروژه‌ای", features: ["تمام موارد تازه‌سازی ظاهر", "بازطراحی صفحهٔ اصلی و خدمات", "اصلاح ساختار و مسیر کاربر", "بهبود فرم‌ها و دعوت به اقدام", "بازبینی نسخهٔ موبایل"], recommended: true, isMock: true },
      { id: "redesign-full", name: "طراحی دوباره", description: "برای بازنگری کامل تجربهٔ برند", price: 24900000, currency: "تومان", period: "پروژه‌ای", features: ["بررسی نیازهای برند و مخاطب", "طراحی مجدد صفحات کلیدی", "هماهنگی هویت بصری سایت", "اجرای چیدمان واکنش‌گرا", "بررسی نهایی مسیرها و تعامل‌ها"], isMock: true },
    ] satisfies DemoPlan[] },
    { id: "content", label: "تولید محتوا", plans: [
      { id: "content-start", name: "شروع محتوا", description: "برای انتشار منظم با پیام مشخص", price: 2900000, currency: "تومان", period: "ماهانه", features: ["بررسی لحن و موضوعات برند", "تقویم پیشنهادی محتوا", "۴ محتوای تصویری یا اسلایدی", "کپشن و دعوت به اقدام"], isMock: true },
      { id: "content-growth", name: "روایت منسجم", description: "برای محتوای متنوع و هماهنگ", price: 4900000, currency: "تومان", period: "ماهانه", features: ["ایده‌پردازی و تقویم محتوا", "۸ محتوای تصویری یا اسلایدی", "سناریوی پیشنهادی ریلز", "طراحی هماهنگ با هویت برند", "بازبینی و اصلاح محتوا"], recommended: true, isMock: true },
      { id: "content-brand", name: "محتوای اختصاصی", description: "برای برنامهٔ محتوایی گسترده‌تر", price: 7900000, currency: "تومان", period: "ماهانه", features: ["استراتژی محتوایی اختصاصی", "۱۲ محتوای تصویری یا اسلایدی", "سناریونویسی مجموعهٔ ریلز", "ایدهٔ کمپین و محتوای مناسبتی", "جلسهٔ بازخورد و برنامه‌ریزی"], isMock: true },
    ] satisfies DemoPlan[] },
  ],
};
