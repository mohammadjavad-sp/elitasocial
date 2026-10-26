# انتشار با GitHub Pages

مخزن مقصد: [mohammadjavad-sp/elitasocial](https://github.com/mohammadjavad-sp/elitasocial)

در تنظیمات مخزن، بخش **Settings → Pages → Build and deployment → Source** روی **GitHub Actions** تنظیم شده است. جریان انتشار در `.github/workflows/deploy-pages.yml` با هر push به شاخهٔ `main` اجرا می‌شود؛ از تب **Actions** نیز می‌توان آن را دستی اجرا کرد.

پیش‌نمایش منتشرشده: [صفحهٔ اصلی](https://mohammadjavad-sp.github.io/elitasocial/). نسخهٔ تکمیل‌شده، مسیر [نمونه‌کارها](https://mohammadjavad-sp.github.io/elitasocial/portfolio/) را هم به خروجی ایستا اضافه می‌کند؛ به‌روزرسانی این مسیر به موفقیت اجرای انتشار همان commit وابسته است. نتیجهٔ هر اجرا در تب Actions مخزن مشخص است.

ساخت نسخهٔ Pages با `DEPLOY_TARGET=github-pages` و `NEXT_PUBLIC_BASE_PATH=/elitasocial` انجام می‌شود و خروجی ایستا در پوشهٔ `out` قرار می‌گیرد. در صورت تغییر نام مخزن باید مسیر پایه در workflow نیز تغییر کند.

workflow مبدأ سئو را با `SITE_URL=https://mohammadjavad-sp.github.io` و `SITE_INDEXING=false` مشخص می‌کند. canonicalها پیشوند `/elitasocial` را یک بار دارند. پیش‌نمایش noindex است و نقشهٔ آن عمداً خالی می‌ماند. برای انتشار رسمی Node، دامنهٔ واقعی و ایندکس را پیش از build مطابق [راهنمای سئوی فنی](seo.md) تنظیم کنید؛ صفحه‌های مدیریت مستقل از آن noindex هستند.

در نسخهٔ Pages، صفحه‌های عمومی ایستا هستند و از دادهٔ اولیهٔ فایل‌ها ساخته می‌شوند. فیلتر نمونه‌کارها و مجله، انتخاب پلن‌ها و اعتبارسنجی فرم تماس در مرورگر اجرا می‌شوند. فرم از مرورگر مستقیماً به FormSubmit درخواست می‌فرستد تا به ایمیل ارتباطی سایت برسد؛ روی GitHub Pages دیتابیس یا ثبت درخواست وجود ندارد. اولین ارسال به تأیید ایمیل فعال‌سازی توسط صاحب مقصد نیاز دارد. متن واتساپ برای ادامهٔ اختیاری گفتگو حفظ شده است. [فعال‌سازی و محدودیت‌های ارسال ایمیل](email-delivery.md).

رابط عمومی، برچسب یا اعلان موقت برای طرح‌ها، پلن‌ها و مقاله‌ها نمایش نمی‌دهد. فایل‌های `src/content/portfolio.ts`، `pricing.ts` و `closing.ts` محل ویرایش داده‌های اولیه‌اند؛ متن‌ها و راه‌های ارتباطی اصلی در `src/content/home.ts` قرار دارند. پیش‌نمایش همچنان `noindex` است.

پنل و دیتابیس اکنون در اجرای Node برنامه پیاده شده‌اند. برای فعال شدن آنلاین آن‌ها، هاست Node.js با دیسک دائمی برای SQLite و رسانه‌ها لازم است؛ در آن حالت متغیرهای Pages را تنظیم نکنید. `/admin/` روی Pages فقط توضیح راه‌اندازی را نشان می‌دهد. مراحل حساب اولیه، محیط هاست و بکاپ در [راهنمای پنل و دیتابیس](admin.md) آمده‌اند. میزبانی دارای فایل‌سیستم موقت بدون انتقال دیتابیس و رسانه به ذخیره‌سازی دائمی برای این تنظیم مناسب نیست.

مرجع: [راهنمای رسمی انتشار با GitHub Actions](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
