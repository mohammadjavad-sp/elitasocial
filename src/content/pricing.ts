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

export type PricingCategoryId = "instagram" | "website" | "support";
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
      { id: "web-business", name: "سایت کسب‌وکار", description: "برای معرفی کامل‌تر خدمات", price: 29000000, currency: "تومان", period: "پروژه‌ای", features: ["طراحی اختصاصی صفحات اصلی", "نمونه‌کارها و مجله", "مدیریت محتوای سایت", "ساختار اولیهٔ سئو", "آموزش و همراهی راه‌اندازی"], recommended: true, isMock: true },
      { id: "web-custom", name: "تجربهٔ اختصاصی", description: "برای نیازهای متنوع‌تر برند", price: 45000000, currency: "تومان", period: "پروژه‌ای", features: ["بررسی نیاز و مسیر کاربر", "طراحی رابط اختصاصی", "بخش‌ها و فرم‌های سفارشی", "مدیریت محتوا و رسانه", "بررسی و بهینه‌سازی تجربه"], isMock: true },
    ] satisfies DemoPlan[] },
    { id: "support", label: "سئو و پشتیبانی", plans: [
      { id: "care-base", name: "مراقبت پایه", description: "برای رسیدگی منظم به سایت", price: 2500000, currency: "تومان", period: "ماهانه", features: ["بررسی وضعیت عمومی سایت", "به‌روزرسانی محتوای موجود", "بررسی لینک‌ها و فرم‌ها", "پیگیری مشکلات گزارش‌شده"], isMock: true },
      { id: "care-content", name: "محتوا و مراقبت", description: "همراهی با رشد و محتوای سایت", price: 4900000, currency: "تومان", period: "ماهانه", features: ["تمام موارد مراقبت پایه", "بهینه‌سازی محتوای صفحات", "بازبینی عنوان و توضیحات", "گزارش و پیشنهادهای بهبود", "هماهنگی برنامهٔ محتوایی"], recommended: true, isMock: true },
      { id: "care-full", name: "همراه سایت", description: "برای نیازهای محتوایی و فنی بیشتر", price: 7900000, currency: "تومان", period: "ماهانه", features: ["برنامهٔ پشتیبانی اختصاصی", "بازبینی ساختار و محتوا", "بهبود تجربهٔ صفحات", "پیگیری تغییرات و نیازها", "جلسهٔ بازخورد دوره‌ای"], isMock: true },
    ] satisfies DemoPlan[] },
  ],
};
