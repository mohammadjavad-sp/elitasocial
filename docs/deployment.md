# انتشار با GitHub Pages

مخزن مقصد: [mohammadjavad-sp/elitasocial](https://github.com/mohammadjavad-sp/elitasocial)

در تنظیمات مخزن، بخش **Settings → Pages → Build and deployment → Source** روی **GitHub Actions** تنظیم شده است. جریان انتشار در `.github/workflows/deploy-pages.yml` با هر push به شاخهٔ `main` اجرا می‌شود؛ از تب **Actions** نیز می‌توان آن را دستی اجرا کرد.

پیش‌نمایش منتشرشده: [صفحهٔ اصلی](https://mohammadjavad-sp.github.io/elitasocial/). نسخهٔ تکمیل‌شده، مسیر [نمونه‌کارها](https://mohammadjavad-sp.github.io/elitasocial/portfolio/) را هم به خروجی ایستا اضافه می‌کند؛ به‌روزرسانی این مسیر به موفقیت اجرای انتشار همان commit وابسته است. نتیجهٔ هر اجرا در تب Actions مخزن مشخص است.

ساخت نسخهٔ Pages با `DEPLOY_TARGET=github-pages` و `NEXT_PUBLIC_BASE_PATH=/elitasocial` انجام می‌شود و خروجی ایستا در پوشهٔ `out` قرار می‌گیرد. در صورت تغییر نام مخزن باید مسیر پایه در workflow نیز تغییر کند.

صفحهٔ اصلی و `/portfolio/` هر دو ایستا هستند. فیلتر نمونه‌کارها، پنجره‌های جزئیات و یادداشت، انتخاب دستهٔ پلن‌ها و اعتبارسنجی فرم تماس در مرورگر اجرا می‌شوند. فرم فقط یک لینک واتساپ با متن آماده می‌سازد؛ هیچ پیام یا اطلاعات تماسی روی GitHub Pages ذخیره یا از سرور ارسال نمی‌شود. ارسال پیام به اقدام خود کاربر در واتساپ نیاز دارد.

محتوای طرح‌ها، پلن‌ها و قیمت‌ها و بازخوردها فعلاً نمایشی است و با برچسب در سایت مشخص می‌شود. فایل‌های `src/content/portfolio.ts`، `pricing.ts` و `closing.ts` محل جایگزینی این داده‌ها با محتوای تأییدشده‌اند؛ متن‌ها و راه‌های ارتباطی اصلی در `src/content/home.ts` قرار دارند. پیش‌نمایش همچنان `noindex` است.

GitHub Pages فقط فایل‌های ایستا را میزبانی می‌کند. برای افزودن CMS یا قابلیت‌های سمت سرور در آینده، پروژه می‌تواند با تنظیمات عادی Next.js روی Vercel یا یک سرور Node.js اجرا شود؛ در آن حالت این دو متغیر محیطی را تنظیم نکنید.

مرجع: [راهنمای رسمی انتشار با GitHub Actions](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
