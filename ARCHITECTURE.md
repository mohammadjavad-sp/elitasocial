# معماری پروژه — Elita Social

به‌روزرسانی ۱۷ نوامبر ۲۰۲۶: نسخهٔ جاری وابستگی Next.js برابر 16.4.6 است؛ اعداد نسخه در ممیزی‌های تاریخ‌دار پایین تاریخی‌اند. startup مخصوص cPanel با Sharp تک‌تردی و shutdown محدود به ۱۰ ثانیه پس از SIGTERM/SIGINT کار می‌کند؛ جزئیات متغیرهای native pool پیش از شروع Node در docs/cpanel-launch.md آمده است. تعداد instanceها و تحویل سیگنال در LiteSpeed/Passenger خارج از کنترل این کد است و NPROC روی هاست باید جدا اندازه‌گیری شود.

ممیزی اولیه مبتنی بر سورس موجود در ۳۰ اکتبر ۲۰۲۶ بود؛ مسیرها و نسخه‌ها از فایل‌های tracked و `package.json`/`package-lock.json` خوانده شدند و در آن مرحله build یا تست بازاجرا نشد. بررسی‌های بعدی استقرار در انتهای این سند و `docs/verification.md` ثبت شده‌اند.

## وضعیت جاری — ۱۶ نوامبر ۲۰۲۶

فرم عمومی، ارسال خودکار ایمیل و مدیریت/API درخواست‌ها حذف شده‌اند. ارتباط از دعوت فوتر با #contact انجام می‌شود. نصب تازه جدول درخواست نمی‌سازد؛ جدول‌های خصوصی قبلی آرشیو بدون API هستند. تنظیمات دو بخش حذف‌شده هنگام read/migrate اتمیک پاک می‌شوند؛ باقی تنظیمات و داده‌ها محفوظ‌اند. [جزئیات](docs/direct-contact.md).

## نمای کلی

```text
Browser
  ├─ صفحات عمومی (App Router; Server Components + client islands)
  ├─ پنل /admin (Client UI)
  └─ /api/cms/* (یک catch-all route روی Node runtime)
         ├─ auth / origin / CSRF / validation
         ├─ domain services: content, settings, media
         └─ node:sqlite + فایل رسانه روی دیسک پایدار

static GitHub Pages build: صفحات و starter content؛ بدون route سروری CMS و SQLite
```

Node و Pages با متغیر انتخاب هدف build تفکیک می‌شوند. در Pages خروجی `export`، تصاویر unoptimized و CMS غیرفعال است؛ Node حالت عادی Next و APIهای dynamic را اجرا می‌کند. متغیر مسیر پایهٔ عمومی، مسیر preview را می‌سازد. این سند نام تنظیم‌ها را برای توضیح ساختار ذکر می‌کند و هیچ مقدار محیطی را افشا نمی‌کند؛ برای راهنمای تنظیم به `.env.example` و `deploy/cpanel.env.example` رجوع کنید.

سه مسیر پارامتری خدمات، مقاله و دستهٔ مقاله، `generateStaticParams` را در `layout.static.tsx` دارند؛ این پسوند فقط در build مخصوص Pages فعال است. در Node این layoutها شناخته نمی‌شوند و صفحه‌ها با `connection()` در هر درخواست از CMS می‌خوانند. بازگرداندن آرایهٔ خالی از generator مشترک، مسیر Node را به fallback ایستا می‌برد و با خواندن dynamic دیتابیس تعارض دارد؛ این الگو در بررسی production خطای `DYNAMIC_SERVER_USAGE` ایجاد کرد.

## ساختار کد

| مسیر | نقش |
| --- | --- |
| `src/app/` | routeهای Next App Router، layout، صفحه‌ها، metadata، `robots.ts`, `sitemap.ts` و CSS |
| `src/app/api/cms/[...segments]/route.server.ts` | ورودی HTTP CMS؛ Node runtime/dynamic و dispatch متدهای GET/POST/PUT/DELETE |
| `src/components/` | اجزای عمومی و تعاملی؛ `admin/` شامل UI پنل |
| `src/content/` | starter content تایپ‌شده برای خانه، خدمات، پلن‌ها، نمونه‌کار و مقالات |
| `src/lib/` | قراردادهای مشترک CMS، SEO، مسیر، تنظیمات، انتخاب خدمت، متن ایمیل، theme و manifest تصویر |
| `src/server/` | فقط سرور: دیتابیس و repositoryها، احراز هویت، CMS API، validation، media و seed |
| `scripts/` | ابزارهای آماده‌سازی asset/font، preflight هاست، اسکریپت‌های init/backup/migrate و بررسی‌های سفارشی |
| `docs/` | راهنماهای معماری، استقرار، SEO، پنل، ایمیل، تصاویر و گزارش‌های بررسی |
| `public/` | فونت Peyda، لوگو/favicon و assetهای وب؛ تصاویر responsive در آماده‌سازی تولید می‌شوند و Gitignore شده‌اند |
| `server.js` | راه‌انداز سفارشی Node/cPanel Passenger؛ Next server را آماده و درخواست‌ها را تحویل می‌گیرد |

## پشته و نسخه‌ها

نسخه‌های اعلامی `package.json` و lockfile:

| فناوری | نسخه/قید |
| --- | --- |
| Node.js | `>=22.18.0` (قید package و بررسی `server.js`/`check:host`) |
| Next.js | `16.4.3` |
| React / React DOM | `19.3.1` |
| TypeScript | `^5.9.3` در package؛ lockfile نسخهٔ `5.9.3` |
| SQLite | `node:sqlite` داخلی Node، API همگام `DatabaseSync` |
| Sharp | `0.35.5` |
| آزمون UI | `@playwright/test` `^1.56.1`؛ مستندات بررسی Edge را گزارش می‌کنند |
| ابزار اجرای TS | `tsx` `4.23.15` |
| styles | CSS اختصاصی؛ در dependency list کتابخانهٔ UI/CSS framework دیده نمی‌شود |

قید Node برای CMS مهم است: `node:sqlite` و `node:crypto` scrypt در runtime استفاده می‌شوند. محیط Node خارج از قید نباید مفروض گرفته شود.

## رندر و جریان داده

در نسخهٔ ۱۶ نوامبر، پنل تصویری پنج‌تاییِ مزیت‌ها از UI، محتوا و تنظیمات حذف شده است. `readSiteSettings` در نصب‌های قبلی فقط property قدیمی `home.benefits` را با `json_remove` به‌صورت اتمیک حذف و revision را یک بار افزایش می‌دهد؛ دیگر فیلدها بازنویسی نمی‌شوند. normalize/validation مطابق شکل فعلی، این property را از خروجی و ذخیرهٔ کلاینت قدیمی کنار می‌گذارند. این پاک‌سازی با خواندن تنظیمات یا `cms:migrate` اعمال می‌شود و نیازی به reset جدول یا حساب‌ها ندارد.

1. محتوای اولیه در `src/content/*` تعریف است؛ تنظیمات اولیه و مدل عمومی در `src/lib/site-settings.ts` است.
2. در runtime Node، `src/server/content.ts` دادهٔ published CMS را در صورت وجود به صفحه‌ها می‌دهد و seed اولیه در دیتابیس با پرچم meta فقط یک بار درج می‌شود. تغییر published در درخواست بعدی روی خروجی صفحه اعمال می‌شود.
3. مرورگر پنل از `/api/cms/*` می‌خواند/می‌نویسد. route به `handleCmsRequest` می‌رسد که Origin، نشست، CSRF، محدودیت payload، اعتبارسنجی و dispatch دامنه را اجرا می‌کند.
4. SQLite با نام `elita.sqlite` در مسیر دادهٔ runtime که با تنظیم محیطی قابل انتخاب است نگهداری می‌شود. رسانه‌ها زیر همان data directory در فضای `media` هستند؛ API فایل فقط رسانهٔ ثبت‌شده را ارائه می‌کند.
5. دکمه‌های همکاری به دعوت تماس فوتر می‌روند؛ فرم و ثبت درخواست وجود ندارد.
6. settings DB از طریق `src/server/site-settings.ts` normalize/validate می‌شود و provider مشترک آن را به UI می‌رساند.

## دیتابیس SQLite

فایل `elita.sqlite` با WAL، foreign keys و timeout تنظیم‌شده باز می‌شود. مسیر با تنظیم محیطی داده قابل انتخاب است. `cms:migrate` جداول/تنظیمات را با حفظ رکوردها ارتقا می‌دهد. schema marker فعلی در کد ۳ است.

| جدول | ستون/کارکرد سطح بالا |
| --- | --- |
| `cms_meta` | کلید/مقدار، از جمله schema version و پرچم seed |
| `cms_users` | مدیر؛ شناسه، ایمیل یکتا، نام، password hash، تاریخ ایجاد |
| `cms_sessions` | هش نشست، user FK، CSRF token، زمان ایجاد/انقضا |
| `cms_login_attempts` | شمارنده و انقضای محدودسازی ورود |
| `cms_records` | collection (`articles/services/portfolio/plans`)، status (`draft/published`)، content key یکتا در collection، JSON، revision و تاریخ‌ها |
| `cms_media` | URL و filename یکتا، alt، MIME، size، timestamp |
| `cms_settings` | رکورد settings با JSON، revision و updated_at |

ویرایش رکورد/settings/مشاوره با revision خوش‌بینانه کنترل می‌شود. مدل دقیق و constraints را در `src/server/database.ts` بخوانید؛ این جدول خلاصه جای schema SQL نیست.

## APIهای CMS

همه زیر `/api/cms` هستند؛ مسیرها از dispatch فعلی `src/server/cms-api.ts` استخراج شده‌اند. مسیرهای مدیریتی پس از ورود نیازمند نشست هستند و متدهای تغییردهنده Origin و CSRF می‌خواهند.

| مسیر | متد | کاربرد |
| --- | --- | --- |
| `/login` | POST | ورود مدیر، ایجاد cookie نشست |
| `/session` | GET | وضعیت نشست |
| `/logout` | POST | خروج و حذف نشست |
| `/password` | PUT | تغییر رمز |
| `/settings` | GET, PUT | تنظیمات سایت و revision |
| `/records/:collection` | GET, POST | فهرست/ایجاد رکورد در یکی از سه collection |
| `/records/:collection/:id` | PUT, DELETE | به‌روزرسانی/حذف revisionدار |
| `/media` | GET, POST | فهرست/بارگذاری multipart رسانه |
| `/media/:id` | DELETE | حذف رسانهٔ بدون ارجاع |
| `/files/:filename` | GET | ارائهٔ فایل رسانهٔ شناخته‌شده |
| `/stats` | GET | شمارنده‌های داشبورد |

مسیرهای حذف‌شدهٔ درخواست، پاسخ ۴۰۴ می‌دهند. تعریف payloadهای فعلی در `src/server/validation.ts` است.

## استقرار

- Local: `npm install`, `npm run dev`؛ مرورگر محلی `127.0.0.1:3000` طبق README.
- Node production: build با `npm run build` و `server.js` برای Passenger؛ داده روی دیسک پایدار خارج از web root.
- GitHub Pages: هدف build static و base path متناسب؛ API و پنل DB اجرا نمی‌شوند.
- پیش از build، SEO origin/indexing باید برای مقصد تعیین شود. هیچ مقدار خصوصی یا واقعی از env نباید در commit/گزارش باشد.
- مراحل اجرایی و branching حفظ DB/شروع نو در `docs/cpanel-launch.md`; GitHub Pages در `docs/deployment.md`.

برای ساخت Node روی هاست دارای محدودیت ایجاد فرایند، `CPANEL_LOW_RESOURCE_BUILD=true` پروفایل اختیاری `next.config.ts` را فعال می‌کند: `experimental.cpus: 1`، `workerThreads: true`، `webpackBuildWorker: false` و `useTypeScriptCli: false`. بدون این پرچم و در تمام buildهای Pages، تنظیمات قبلی حفظ می‌شوند. این پروفایل فرایند مستقل webpack و CLI تایپ‌اسکریپت را حذف می‌کند و workerهای بررسی نوع و تولید صفحات را به thread منتقل می‌کند؛ کاهش تعداد threadها تضمین عبور از محدودیت‌های هاست نیست.

بررسی نوع برنامه با API نسخهٔ نصب‌شدهٔ TypeScript `5.9.3` فعال می‌ماند. checker این مسیر خطاهای فایل‌های تست را فیلتر می‌کند؛ برای پوشش کل `tsconfig`، `npm run typecheck` نیز مستقل اجرا شود. ارتقا به TypeScript 7 نیازمند بازبینی این پروفایل است، زیرا API جاوااسکریپت آن در مسیر مستندشدهٔ Next در دسترس نیست. هنگام استفاده از worker thread، `--v8-pool-size` در `NODE_OPTIONS` یا آرگومان مستقیم Node قرار نگیرد؛ Next آن را به worker منتقل می‌کند و در بررسی محلی خطای `ERR_WORKER_INVALID_EXEC_ARGV` ایجاد شد.

طبق تصاویر خروجی هاست میهن‌وب‌هاست، `check:host` روی Node `22.18.0` و سپس انتقال بکاپ و `cms:migrate` موفق شدند. ساخت هاست دو بار هنگام ایجاد فرایند `tsc --showConfig` با `EAGAIN` شکست خورد؛ تلاش دوم با CLI مستقیم و poolهای محدود نیز همین خطا را داشت. پروفایل جدید و `tsc --noEmit` مستقل با باینری رسمی Node `22.18.0` روی Windows موفق شدند. سپس خروجی Terminal ارسالی کاربر، موفقیت build کامل Webpack و typecheck مستقل روی خود هاست با همین Node و Next `16.4.3`، بدون پرچم V8 فوق و با poolهای UV/Rayon محدود را نشان داد؛ پیام پایانی `BUILD_AND_TYPECHECK_OK` مشاهده شد. اجرای واقعی Passenger و پاسخ دامنه هنوز تأیید نشده‌اند.
