# تصمیمات و محدودیت‌های طراحی

این فهرست از الگوهای پیاده‌شده در کد و مستندات استخراج شده؛ برای هر مورد جدید قبل از تغییر، نیاز محصول و وضعیت production را دوباره بررسی کنید.

## تصمیم‌های فنی تثبیت‌شده

| تصمیم | دلیل/اثر | قبل از تغییر چه چیزی را بررسی کنیم |
| --- | --- | --- |
| Next.js App Router + React + TypeScript | یک برنامه برای صفحات، metadata، routeهای API و پنل؛ strict TS فعال | Next نصب‌شده `16.4.3` است و `AGENTS.md` الزام می‌کند مستندات محلی نسخهٔ نصب‌شده خوانده شود؛ APIهای نسخه‌های قدیمی را پیش‌فرض نگیرید |
| Node runtime و cPanel Passenger برای CMS | CMS از `node:sqlite`, filesystem, crypto و Sharp استفاده می‌کند | نسخهٔ Node حداقل `22.18.0`، SQLite API، Sharp binary و storage پایدار باید روی همان میزبان بررسی شود |
| پروفایل اختیاری ساخت هاست با `CPANEL_LOW_RESOURCE_BUILD=true` | فقط در Node، `cpus: 1`، `workerThreads: true`، `webpackBuildWorker: false` و `useTypeScriptCli: false` فعال می‌شوند؛ ساخت پیش‌فرض و Pages حفظ می‌شوند | بررسی نوع برنامه با API TypeScript `5.9.3` ادامه دارد؛ برای پوشش خطاهای فایل‌های تست، `npm run typecheck` مستقل لازم است. پیش از ارتقا به TypeScript 7، نیاز Next به compiler API این پروفایل بازبینی شود |
| SQLite داخلی به‌جای ORM/DB بیرونی | وابستگی کمتر برای CMS یک سایت و بکاپ snapshot مستقیم؛ queryها SQL پارامتری‌اند | مناسب‌بودن برای concurrency/scale/HA، WAL، دیسک پایدار، backup/restore و محدودیت I/O هاست را دوباره ارزیابی کنید |
| Starter content در TypeScript و ویرایش CMS در DB | دادهٔ اولیه قابل‌نسخه‌بندی و seed اولیه؛ محتوای live بدون rebuild تغییر می‌کند | رکورد DB بر منبع starter سایه می‌اندازد؛ حذف/seed/migration ممکن است روی محتوای live اثر بگذارد |
| Revision optimistic locking | جلوگیری از overwrite خاموش و تعارض ویرایش هم‌زمان | payloadهای PUT/DELETE و رفتار 409 را حفظ کنید |
| Node production در برابر static Pages preview | preview کم‌هزینهٔ ایستا نگه داشته می‌شود و runtime CMS از Node جداست | Pages endpoint، پنل یا SQLite را اجرا نمی‌کند؛ `DEPLOY_TARGET` و base path باید قبل از build هماهنگ باشند |
| تولید پارامترهای ایستا در `layout.static.tsx` مخصوص Pages | صفحه‌های مشترک خدمات/مقاله/دسته در Node بدون generator ایستا، با دادهٔ زنده رندر می‌شوند | افزودن `generateStaticParams` با خروجی خالی به صفحهٔ مشترک می‌تواند fallback ایستا و خطای `DYNAMIC_SERVER_USAGE` بسازد؛ هر دو هدف Node و Pages باید بررسی شوند |
| FormSubmit به‌جای SMTP credential در مرورگر | از قراردادن Gmail/SMTP secret در bundle جلوگیری می‌شود و وابستگی backend ایمیل اضافه نمی‌شود | Email delivery سمت مرورگر است، تأیید مقصد لازم است، inbox تضمین نیست و retry ممکن است تکرار کند |
| E-mail بعد از ثبت consultation در DB | شکست ایمیل درخواست ثبت‌شده را حذف نمی‌کند؛ پنل مرجع پیگیری است | ارسال صف‌دار نیست و با بستن صفحه ممکن است متوقف شود؛ برای تضمین delivery نیاز به طراحی server-side queue/provider دارد |
| media با Sharp و storage محلی | کنترل decode، پاک‌سازی metadata، خروجی WebP و ذخیرهٔ داخلی | backup رسانه با DB هماهنگ باشد؛ persistent disk لازم است؛ مسیر serve در image allowlist محدود است |
| CSS اختصاصی بدون UI framework | ظاهر کنترل‌شده و وابستگی UI کمتر؛ motion با observer/CSS | theme tokens, responsive, RTL, focus, reduced motion را همراه هم تغییر دهید |
| SEO opt-in و noindex preview | جلوگیری از index شدن preview/محتوای نامکتمل | دامنه و index flags هنگام build تعیین می‌شوند؛ بعد از build تغییر env به‌تنهایی metadata ثابت خروجی را بازسازی نمی‌کند |
| Sitemap بدون lastmod | مدل مقاله CMS تاریخ انتشار/ویرایش عمومی واقعی ندارد | تاریخ build را به‌عنوان تاریخ محتوا جعل نکنید؛ ابتدا مدل و migration را طراحی کنید |

## راهکارها/مسائل تاریخی ثبت‌شده

- در ۳۰ اکتبر ۲۰۲۶، پس از اعلام سقف Node `22.18.0` در هاست کاربر، حداقل runtime از `22.19.0` به `22.18.0` کاهش یافت. APIهای SQLite مورد استفاده، از جمله `timeout` و `backup`، طبق [مستندات دقیق Node 22.18](https://nodejs.org/download/release/v22.18.0/docs/api/sqlite.html) موجودند؛ dependencyها عوض نشدند. پیش‌نیازسنج نیز timeout را در حافظه آزمایش می‌کند. نتیجه و محدودیت‌های بررسی اجرایی در `docs/verification.md` ثبت می‌شود. این حداقل، شرط سازگاری فنی است؛ برای انتخاب نسخهٔ production، آخرین patch پشتیبانی‌شدهٔ میزبان نیز باید بررسی شود.
- طبق تصاویر خروجی ارائه‌شده در ادامهٔ همین نشست، Setup Node.js App میهن‌وب‌هاست، اجرای موفق `check:host` روی Node `22.18.0` و اجرای موفق `cms:migrate` پس از انتقال بکاپ تأیید شدند. کاربر حفظ محتوا و حساب فعلی CMS را انتخاب کرد؛ مسیر تازه‌سازی حساب یا `cms:init` برای این انتقال لازم نیست. ورود با حساب منتقل‌شده و صحت کامل محتوا و رسانه هنوز بررسی نشده‌اند.
- ساخت webpack روی هاست دو بار در ایجاد فرایند `tsc --showConfig` با `EAGAIN` متوقف شد؛ بار دوم CLI مستقیم و poolهای محدود نیز این مانع را رفع نکردند. پروفایل اختیاری بالا این subprocess را با compiler API جایگزین می‌کند. ساخت کامل پروفایل و `tsc --noEmit` مستقل ابتدا با باینری رسمی Node `22.18.0` روی Windows و سپس طبق خروجی Terminal کاربر روی خود هاست موفق شدند؛ پیام `BUILD_AND_TYPECHECK_OK` با Next `16.4.3` مشاهده شد. تأیید build به‌معنای تأیید runtime Passenger نیست.
- در بررسی محلی پروفایل، انتقال `--v8-pool-size` از `NODE_OPTIONS` به worker thread خطای `ERR_WORKER_INVALID_EXEC_ARGV` ایجاد کرد؛ این پرچم از محیط ساخت حذف شد و ساخت نهایی با poolهای UV/Rayon محدود موفق بود. استفادهٔ مستقیم از همین پرچم در CLI Node نیز راه‌حل نیست، زیرا Next آرگومان‌های Node را به worker منتقل می‌کند. این خطای thread مشاهدهٔ محلی است و نباید به‌عنوان خروجی هاست گزارش شود.
- `docs/verification.md` خطای بایت NUL در `src/content/home.ts` را ثبت می‌کند؛ فایل از Git سالم بازیابی و تغییرات دوباره اعمال شد. اگر خطای مشابه رخ داد، فایل encoding/binary را بررسی کنید و source را بی‌دلیل بازنویسی نکنید.
- `docs/release-audit.md` می‌گوید اندازهٔ JS/RSC/عکس و امنیت body parsing، scrypt، trace و رسانه بررسی/بهبود شده‌اند. جزئیات و محدودیت‌های اندازه‌گیری در همان گزارش است؛ اعداد گزارش را به تجربهٔ کاربران production تعمیم ندهید.
- تغییر فونت‌ها، تصاویر واکنش‌گرا، تم، پری‌لودر و animations روی CSS/assetهای محلی تکیه دارند. اسکریپت‌های `prepare-*` بخشی از تولید خروجی‌اند؛ پیش از حذف آن‌ها بررسی کنید build و GitHub workflow چه کارهایی اجرا می‌کنند.
- `AGENTS.md` از قبل block خودکار Next را داشت. این بخش توسط `next dev` بازتولید می‌شود؛ حذف/تغییر آن بی‌دلیل می‌تواند diff را دوباره ایجاد کند.

## موارد نامعلوم که نباید حدس زده شوند

- وضعیت نهایی DNS/SSL و اجرای Passenger؛ میزبان، پنل Node و ساخت موفق پروفایل روی هاست مشخص شده‌اند، اما پاسخ وب‌سایت هنوز به‌عنوان deployment موفق تأیید نشده است.
- صحت کامل محتوا، رسانه و ورود با حساب منتقل‌شده؛ انتخاب حفظ اطلاعات و اجرای migration روی هاست تأیید شده‌اند، ولی نتیجهٔ migration به‌تنهایی این بررسی‌های کاربردی را پوشش نمی‌دهد.
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
