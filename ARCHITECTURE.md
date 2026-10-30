# معماری پروژه — Elita Social

ممیزی مبتنی بر سورس موجود در ۳۰ اکتبر ۲۰۲۶؛ مسیرها و نسخه‌ها از فایل‌های tracked و `package.json`/`package-lock.json` خوانده شده‌اند. اجرای مجدد build یا تست جزو این ممیزی نبود.

## نمای کلی

```text
Browser
  ├─ صفحات عمومی (App Router; Server Components + client islands)
  ├─ پنل /admin (Client UI)
  └─ /api/cms/* (یک catch-all route روی Node runtime)
         ├─ auth / origin / CSRF / validation
         ├─ domain services: content, settings, media, consultations
         └─ node:sqlite + فایل رسانه روی دیسک پایدار

static GitHub Pages build: صفحات و starter content؛ بدون route سروری CMS و SQLite
```

Node و Pages با متغیر انتخاب هدف build تفکیک می‌شوند. در Pages خروجی `export`، تصاویر unoptimized و CMS غیرفعال است؛ Node حالت عادی Next و APIهای dynamic را اجرا می‌کند. متغیر مسیر پایهٔ عمومی، مسیر preview را می‌سازد. این سند نام تنظیم‌ها را برای توضیح ساختار ذکر می‌کند و هیچ مقدار محیطی را افشا نمی‌کند؛ برای راهنمای تنظیم به `.env.example` و `deploy/cpanel.env.example` رجوع کنید.

## ساختار کد

| مسیر | نقش |
| --- | --- |
| `src/app/` | routeهای Next App Router، layout، صفحه‌ها، metadata، `robots.ts`, `sitemap.ts` و CSS |
| `src/app/api/cms/[...segments]/route.server.ts` | ورودی HTTP CMS؛ Node runtime/dynamic و dispatch متدهای GET/POST/PUT/DELETE |
| `src/components/` | اجزای عمومی و تعاملی؛ `admin/` شامل UI پنل |
| `src/content/` | starter content تایپ‌شده برای خانه، خدمات، پلن‌ها، نمونه‌کار و مقالات |
| `src/lib/` | قراردادهای مشترک CMS، SEO، مسیر، تنظیمات، انتخاب خدمت، متن ایمیل، theme و manifest تصویر |
| `src/server/` | فقط سرور: دیتابیس و repositoryها، احراز هویت، CMS API، validation، media، consultation و seed |
| `scripts/` | ابزارهای آماده‌سازی asset/font، preflight هاست، اسکریپت‌های init/backup/migrate و بررسی‌های سفارشی |
| `docs/` | راهنماهای معماری، استقرار، SEO، پنل، ایمیل، تصاویر و گزارش‌های بررسی |
| `public/` | فونت Peyda، لوگو/favicon و assetهای وب؛ تصاویر responsive در آماده‌سازی تولید می‌شوند و Gitignore شده‌اند |
| `server.js` | راه‌انداز سفارشی Node/cPanel Passenger؛ Next server را آماده و درخواست‌ها را تحویل می‌گیرد |

## پشته و نسخه‌ها

نسخه‌های اعلامی `package.json` و lockfile:

| فناوری | نسخه/قید |
| --- | --- |
| Node.js | `>=22.19.0` (قید package و بررسی `server.js`/`check:host`) |
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

1. محتوای اولیه در `src/content/*` تعریف است؛ تنظیمات اولیه و مدل عمومی در `src/lib/site-settings.ts` است.
2. در runtime Node، `src/server/content.ts` دادهٔ published CMS را در صورت وجود به صفحه‌ها می‌دهد و seed اولیه در دیتابیس با پرچم meta فقط یک بار درج می‌شود. تغییر published در درخواست بعدی روی خروجی صفحه اعمال می‌شود.
3. مرورگر پنل از `/api/cms/*` می‌خواند/می‌نویسد. route به `handleCmsRequest` می‌رسد که Origin، نشست، CSRF، محدودیت payload، اعتبارسنجی و dispatch دامنه را اجرا می‌کند.
4. SQLite با نام `elita.sqlite` در مسیر دادهٔ runtime که با تنظیم محیطی قابل انتخاب است نگهداری می‌شود. رسانه‌ها زیر همان data directory در فضای `media` هستند؛ API فایل فقط رسانهٔ ثبت‌شده را ارائه می‌کند.
5. فرم مشاوره در Node، ورودی را در `cms_consultations` ثبت و کد پیگیری می‌دهد. پس از ثبت، مرورگر با `src/lib/consultation-email.ts` به FormSubmit درخواست می‌فرستد. static build مستقیماً فرم را به FormSubmit می‌دهد و DB/reference ندارد.
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
| `cms_consultations` | کد پیگیری یکتا، نام/راه تماس/نوع تماس/خدمت/پیام/پلن، وضعیت، یادداشت داخلی، revision و تاریخ‌ها |
| `cms_consultation_receipts` | request id و payload hash برای idempotency؛ reference یکتا |
| `cms_consultation_attempts` | کلید محدودسازی، تعداد تلاش و انقضا |

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
| `/records/:collection` | GET, POST | فهرست/ایجاد رکورد در یکی از چهار collection |
| `/records/:collection/:id` | PUT, DELETE | به‌روزرسانی/حذف revisionدار |
| `/media` | GET, POST | فهرست/بارگذاری multipart رسانه |
| `/media/:id` | DELETE | حذف رسانهٔ بدون ارجاع |
| `/files/:filename` | GET | ارائهٔ فایل رسانهٔ شناخته‌شده |
| `/consultations` | POST عمومی، GET مدیریتی | ثبت فرم، یا فهرست مدیریتی با query search/filter/pagination |
| `/consultations/:id` | PUT, DELETE | تغییر وضعیت/یادداشت یا حذف مدیریتی |
| `/stats` | GET | شمارنده‌های داشبورد |

API عمومیِ مشاهدهٔ درخواست با کد پیگیری در این dispatch دیده نمی‌شود. تعریف دقیق payloadها در `src/server/validation.ts` و `src/server/consultations.ts` است.

## استقرار

- Local: `npm install`, `npm run dev`؛ مرورگر محلی `127.0.0.1:3000` طبق README.
- Node production: build با `npm run build` و `server.js` برای Passenger؛ داده روی دیسک پایدار خارج از web root.
- GitHub Pages: هدف build static و base path متناسب؛ API و پنل DB اجرا نمی‌شوند.
- پیش از build، SEO origin/indexing باید برای مقصد تعیین شود. هیچ مقدار خصوصی یا واقعی از env نباید در commit/گزارش باشد.
- مراحل اجرایی و branching حفظ DB/شروع نو در `docs/cpanel-launch.md`; GitHub Pages در `docs/deployment.md`.
