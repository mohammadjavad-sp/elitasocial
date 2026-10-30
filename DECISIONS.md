# تصمیمات و محدودیت‌های طراحی

این فهرست از الگوهای پیاده‌شده در کد و مستندات استخراج شده؛ برای هر مورد جدید قبل از تغییر، نیاز محصول و وضعیت production را دوباره بررسی کنید.

## تصمیم‌های فنی تثبیت‌شده

| تصمیم | دلیل/اثر | قبل از تغییر چه چیزی را بررسی کنیم |
| --- | --- | --- |
| Next.js App Router + React + TypeScript | یک برنامه برای صفحات، metadata، routeهای API و پنل؛ strict TS فعال | Next نصب‌شده `16.4.3` است و `AGENTS.md` الزام می‌کند مستندات محلی نسخهٔ نصب‌شده خوانده شود؛ APIهای نسخه‌های قدیمی را پیش‌فرض نگیرید |
| Node runtime و cPanel Passenger برای CMS | CMS از `node:sqlite`, filesystem, crypto و Sharp استفاده می‌کند | نسخهٔ Node حداقل `22.19.0`، SQLite API، Sharp binary و storage پایدار باید روی همان میزبان بررسی شود |
| SQLite داخلی به‌جای ORM/DB بیرونی | وابستگی کمتر برای CMS یک سایت و بکاپ snapshot مستقیم؛ queryها SQL پارامتری‌اند | مناسب‌بودن برای concurrency/scale/HA، WAL، دیسک پایدار، backup/restore و محدودیت I/O هاست را دوباره ارزیابی کنید |
| Starter content در TypeScript و ویرایش CMS در DB | دادهٔ اولیه قابل‌نسخه‌بندی و seed اولیه؛ محتوای live بدون rebuild تغییر می‌کند | رکورد DB بر منبع starter سایه می‌اندازد؛ حذف/seed/migration ممکن است روی محتوای live اثر بگذارد |
| Revision optimistic locking | جلوگیری از overwrite خاموش و تعارض ویرایش هم‌زمان | payloadهای PUT/DELETE و رفتار 409 را حفظ کنید |
| Node production در برابر static Pages preview | preview کم‌هزینهٔ ایستا نگه داشته می‌شود و runtime CMS از Node جداست | Pages endpoint، پنل یا SQLite را اجرا نمی‌کند؛ `DEPLOY_TARGET` و base path باید قبل از build هماهنگ باشند |
| FormSubmit به‌جای SMTP credential در مرورگر | از قراردادن Gmail/SMTP secret در bundle جلوگیری می‌شود و وابستگی backend ایمیل اضافه نمی‌شود | Email delivery سمت مرورگر است، تأیید مقصد لازم است، inbox تضمین نیست و retry ممکن است تکرار کند |
| E-mail بعد از ثبت consultation در DB | شکست ایمیل درخواست ثبت‌شده را حذف نمی‌کند؛ پنل مرجع پیگیری است | ارسال صف‌دار نیست و با بستن صفحه ممکن است متوقف شود؛ برای تضمین delivery نیاز به طراحی server-side queue/provider دارد |
| media با Sharp و storage محلی | کنترل decode، پاک‌سازی metadata، خروجی WebP و ذخیرهٔ داخلی | backup رسانه با DB هماهنگ باشد؛ persistent disk لازم است؛ مسیر serve در image allowlist محدود است |
| CSS اختصاصی بدون UI framework | ظاهر کنترل‌شده و وابستگی UI کمتر؛ motion با observer/CSS | theme tokens, responsive, RTL, focus, reduced motion را همراه هم تغییر دهید |
| SEO opt-in و noindex preview | جلوگیری از index شدن preview/محتوای نامکتمل | دامنه و index flags هنگام build تعیین می‌شوند؛ بعد از build تغییر env به‌تنهایی metadata ثابت خروجی را بازسازی نمی‌کند |
| Sitemap بدون lastmod | مدل مقاله CMS تاریخ انتشار/ویرایش عمومی واقعی ندارد | تاریخ build را به‌عنوان تاریخ محتوا جعل نکنید؛ ابتدا مدل و migration را طراحی کنید |

## راهکارها/مسائل تاریخی ثبت‌شده

- `docs/verification.md` خطای بایت NUL در `src/content/home.ts` را ثبت می‌کند؛ فایل از Git سالم بازیابی و تغییرات دوباره اعمال شد. اگر خطای مشابه رخ داد، فایل encoding/binary را بررسی کنید و source را بی‌دلیل بازنویسی نکنید.
- `docs/release-audit.md` می‌گوید اندازهٔ JS/RSC/عکس و امنیت body parsing، scrypt، trace و رسانه بررسی/بهبود شده‌اند. جزئیات و محدودیت‌های اندازه‌گیری در همان گزارش است؛ اعداد گزارش را به تجربهٔ کاربران production تعمیم ندهید.
- تغییر فونت‌ها، تصاویر واکنش‌گرا، تم، پری‌لودر و animations روی CSS/assetهای محلی تکیه دارند. اسکریپت‌های `prepare-*` بخشی از تولید خروجی‌اند؛ پیش از حذف آن‌ها بررسی کنید build و GitHub workflow چه کارهایی اجرا می‌کنند.
- `AGENTS.md` از قبل block خودکار Next را داشت. این بخش توسط `next dev` بازتولید می‌شود؛ حذف/تغییر آن بی‌دلیل می‌تواند diff را دوباره ایجاد کند.

## موارد نامعلوم که نباید حدس زده شوند

- میزبان واقعی، مشخصات حساب، وضعیت DNS/SSL، نتیجهٔ Passenger و محل فعلی دیتابیس production.
- اینکه اطلاعات محلی CMS دقیقاً باید به هاست منتقل شوند یا هاست از نو ساخته شود.
- اینکه مقصد FormSubmit فعال شده و پیام واقعی تحویل شده باشد.
- اینکه محتوا/پلن‌های نمایشی تأیید نهایی تجاری دارند، یا نمونه‌کارها پروژهٔ واقعی‌اند.
- پذیرش CSP، سطح دسترس‌پذیری رسمی، benchmark کاربر واقعی و نیاز scale آتی.
- سیاست retention/حذف و زمان‌بندی بکاپ برای داده‌های شخصی consultation.

## قواعد پیش از تصمیم جدید

1. کد و قرارداد مصرف‌کننده‌ها را قبل از تغییر schema/API بخوانید.
2. migration را سازگار با دادهٔ موجود طراحی کنید؛ `cms:init` را برای reset داده استفاده نکنید.
3. public preview و runtime Node را جداگانه ارزیابی کنید.
4. تغییراتی که دادهٔ مشتری/محتوای منتشرشده را حذف می‌کند بدون بکاپ و plan بازگشت اجرا نکنید.
5. نسخهٔ dependency را از package و lockfile تأیید کنید و مستندات نسخهٔ نصب‌شده را بخوانید.
