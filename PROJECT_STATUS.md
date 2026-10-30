# وضعیت پروژه — Elita Social

تاریخ بررسی: ۳۰ اکتبر ۲۰۲۶. این گزارش وضعیت source/docs/Git را توصیف می‌کند، نه سلامت فعلی deployment. تست تازه اجرا نشده است.

## وضعیت Git و workspace

- شاخهٔ فعال `main`؛ commit فعلی `fc357c6`؛ ابتدای ممیزی HEAD با `origin/main` برابر بود.
- پیش از این تغییرات، فقط `HANDOFF.md` untracked بود. این ممیزی آن را جایگزین و چهار سند دیگر را ایجاد می‌کند و `AGENTS.md` را تکمیل می‌کند.
- سورس، تنظیمات runtime و دیتابیس محلی تغییری نکرده‌اند. پس از نوشتن اسناد وضعیت نهایی Git را در جمع‌بندی اعلام می‌کنم.
- `.env.local`, `.data`, `backups`, `artifacts` و فایل‌های مشابه از Gitignore خارج‌اند. داده/credential محلی در این گزارش درج نشده.

## وضعیت ماژول‌ها

| ماژول | پیاده‌سازی قابل مشاهده | وضعیت/بازمانده |
| --- | --- | --- |
| خانه و رابط عمومی | خانه، سکشن‌ها، منو، فوتر، تماس، responsive/RTL | کد موجود؛ محتوای تجاری نهایی/تأیید مالک از سورس معلوم نیست |
| خدمات | فهرست و جزئیات خدمات، انتقال انتخاب به consultation | مسیرها موجود؛ بررسی عملی دامنه انجام نشده |
| قیمت و نمونه‌کار | صفحات مستقل، فیلتر/انتخاب دسته، دادهٔ نمایشی | داده‌ها/قیمت‌ها mock نشان داده شده؛ پروژهٔ واقعی بودن طرح‌ها تأیید نشده |
| مجله | فهرست، search/filter/sort/page، مقاله و category archive | محتوا در starter files؛ زمان انتشار واقعی در مدل نیست |
| Theme/motion/preloader | روشن/تاریک، CSS motion، reduced-motion، preloader | پیاده‌سازی موجود؛ تست فیزیکی/کاربر نهایی نامعلوم |
| SEO | metadata/canonical/OG/robots/sitemap | آمادهٔ تنظیم build؛ دامنهٔ واقعی، indexing و Search Console تأیید نشده |
| CMS/auth | پنل، نشست، CSRF/Origin، scrypt، تغییر رمز | کد موجود؛ ورود واقعی/هاست production در ممیزی اجرا نشده |
| محتوای CMS | چهار collection، draft/published، revision | کد موجود؛ backup/restore production نامعلوم |
| Site settings | DB settings و editor/provider | کد موجود؛ محتوای نهایی برند از صاحب محصول تأیید نشده |
| Media | upload، Sharp normalize، serving و reference guard | کد موجود؛ پایداری disk/perms هاست تأیید نشده |
| Consultations/email | Node DB record، مدیریت، FormSubmit client send | نیازمند آزمون واقعی دامنه و مقصد ایمیل؛ صف server ندارد |
| Node/cPanel | custom `server.js`, check:host, docs | آماده‌سازی مخزنی انجام شده؛ اجرای واقعی Passenger/SSL اثبات نشده |
| GitHub Pages | static export branch در config | preview ایستا؛ CMS/API/DB ندارد |

## مشکلات و ریسک‌های باز

1. **Deployment:** cPanel account, Passenger, Linux build, permissions, SSL/redirect و Node `22.19+` عملیاتی تأیید نشده‌اند.
2. **Data continuity:** باید مشخص شود data directory هاست با backup/migrate از داده‌های موجود پر شود یا با CMS تازه آغاز شود. انتقال دیتابیس زنده/WAL به‌صورت دستی راهنما توصیه نمی‌کند.
3. **Email:** تأیید مقصد FormSubmit و دریافت یک پیام واقعی نامعلوم است. Client send قابل retry است، اما ممکن است ایمیل تکراری بسازد؛ ثبت DB مستقل می‌ماند.
4. **SEO:** indexing را تا تأیید محتوای اصلی خاموش نگه دارید؛ canonical/robots/sitemap را از دامنهٔ نهایی بررسی کنید.
5. **Last-modified metadata:** CMS updated_at دارد اما sitemap مدل lastmod واقعی ندارد.
6. **Security headers:** CSP موجود محدودیت‌های مشخص دارد اما nonce-based نیست؛ سرور واقعی بازبینی نشده.
7. **Verification drift:** تاریخچهٔ `docs/verification.md` چند مرحلهٔ بدون build/test را ثبت می‌کند. نتایج قدیمی به‌تنهایی گواهی HEAD فعلی نیستند.

باگ باز و قطعی از این مرور کد/مستندات ثبت نشد. این نتیجه معادل آزمون جامع runtime نیست. یک خطای NUL قدیمی در `src/content/home.ts` در `docs/verification.md` گزارش شده که طبق همان گزارش از نسخهٔ سالم Git بازیابی و بررسی شده است؛ این ممیزی مستقل آن بررسی تاریخی را بازاجرا نکرد.

## تست و راستی‌آزمایی

### دستورهای موجود

- `npm run typecheck`
- `npm run build`
- `npm run check:host` (preflight فقط خواندنی Node/SQLite/Sharp)
- `npm run check:ui`, `npm run check:portfolio`
- `npm run check:security`, `npm run check:seo`
- `npm run cms:init`, `npm run cms:migrate`, `npm run cms:backup` (این سه مورد عملیاتی‌اند؛ دیتابیس را می‌خوانند/می‌نویسند و نباید برای ممیزی بی‌هدف اجرا شوند)

### آنچه مستندات تاریخی می‌گویند

- `docs/verification.md` نتایج مراحل مختلف UI، typecheck، static Pages build و مواردی را که عمداً تست نشدند با تاریخچهٔ توسعه ثبت می‌کند.
- `docs/release-audit.md` گزارش می‌کند که `check:security` شامل ۳۲ آزمون موفق بوده، npm audit در آن مقطع آسیب‌پذیری گزارش نکرده، buildهای Node/Pages و TypeScript انجام شده و preview واقعی Node به‌دلیل `blocked by policy` اجرا نشده است.
- این اظهارات گزارش قبلی‌اند و در این تحویل دوباره اجرا/بازاجرا نشده‌اند. در ممیزی حاضر هیچ دستور آزمون، build، DB mutation یا browser automation اجرا نشد.
- ممیزی حاضر فقط ساختار/سورس/مستندات و Git را خواند؛ لینک‌های داخلی و whitespace اسناد تازه با اسکریپت read-only بررسی و `git diff --check` اجرا شد. تست نرم‌افزار اجرا نشد.

## اولویت بعدی

طبق آخرین commit و راهنمای cPanel، گام بعدی خارج از کد: دسترسی هاست و نسخهٔ Node را تأیید، سپس staging/راه‌اندازی Passenger و SSL را شروع کنید. قبل از init/migrate حتماً مسیر حفظ دیتابیس یا شروع تازه را انتخاب کنید. بعد `check:host`، build و smoke verification واقعی را در هاست اجرا کنید. پس از آن فعال‌سازی email و SEO انجام شود.
