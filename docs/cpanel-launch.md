# راه‌اندازی elitasocial.ir روی cPanel

## جلوگیری از تکرار اشباع پردازش — ۱۷ نوامبر ۲۰۲۶

تصویر مالک NPROC برابر ۱۵۰/۱۵۰ با رم ۱۳۱ مگابایت از ۲ گیگابایت را نشان داد؛ پشتیبانی پردازش‌ها را پاک کرد و مالک بازشدن Terminal را تأیید کرد. در شواهد قبلی، دو lsnode با NLWP برابر ۹۹ و ۵۱ دیده شده بودند؛ عدد NPROC شامل تردهاست و به‌تنهایی نشانهٔ ۱۵۰ اجرای مستقل یا نشت برنامه نیست. علت قطعیِ سهم هر کتابخانه هنوز روی Linux هاست اندازه‌گیری نشده است.

پیش از اجرای نسخهٔ جدید، در **Environment variables خود Setup Node.js App** سه متغیر `UV_THREADPOOL_SIZE=1`، `VIPS_CONCURRENCY=1` و `RAYON_NUM_THREADS=1` را ثبت کنید. `NODE_OPTIONS` حاوی پرچم V8 اضافه نشود. فایل dotenv می‌تواند برای poolهای ایجادشده پیش از بارگذاری برنامه دیر باشد؛ تنظیم پنل لازم است. این تنظیمات کیفیت، ابعاد و محتوای تصاویر را تغییر نمی‌دهند.

فایل `server.js` پیش از بارگذاری Next، Sharp را به یک ترد پردازش هر تصویر محدود می‌کند؛ مسیر upload، آماده‌سازی تصاویر و تنظیم optimizer نیز محدود شده‌اند. startup هنگام SIGTERM/SIGINT ورودی تازه را می‌بندد، درخواست جاری را تا ۱۰ ثانیه مهلت می‌دهد و Next را می‌بندد؛ پس از مهلت، فرایند خارج می‌شود. این کار برای فرایندی که سیگنال توقف دریافت نکرده کافی نیست؛ تعداد instanceها و تحویل سیگنال توسط LiteSpeed/Passenger در صورت تکرار باید از سمت میزبان بررسی شوند.

پس از بکاپ و انتشار، فقط یک بار Start کنید و خروجی `ps -u "$USER" -o pid,ppid,nlwp,etime,comm --sort=-nlwp` و Resource Usage را بعد از بازدید چند صفحه/تصویر بررسی کنید. کاهش مصرف روی هاست تا این اندازه‌گیری تأیید نشده است. [CloudLinux: NPROC](https://docs.cloudlinux.com/cloudlinuxos/limits/#number-of-processes)، [Sharp: concurrency](https://sharp.pixelplumbing.com/api-utility/#concurrency)، [LiteSpeed: چرخهٔ lsnode](https://docs.litespeedtech.com/lsws/cp/cpanel/ts-cloudlinux/#resource-temporarily-unavailable).

**به‌روزرسانی ۱۶ نوامبر ۲۰۲۶:** نسخهٔ Elita فعال و ممیزی زندهٔ ایندکس/robots/sitemap موفق شده است؛ گزارش‌های ۳۰ اکتبر دربارهٔ صفحهٔ پیش‌فرض تاریخی‌اند. در build اخیر، `EAGAIN` با محدودکردن فرمان‌های Node به دو CPU مجاز (`taskset -c 0,1` پس از مشاهدهٔ mask برابر `0-87`) رفع شد. پرچم `--v8-pool-size` در `NODE_OPTIONS` تنظیم‌شده در پنل با workerهای build ناسازگار بود؛ حذف ردیف مربوط از پنل لازم شد و خالی‌کردن آن در shell به‌تنهایی کافی نبود. پیش از build بعدی این نکته‌ها و دستور تأییدشده در [گزارش سئو](seo-launch.md) را بخوانید. ماسک CPU هاست‌های دیگر باید جداگانه بررسی شود. برای راه‌اندازی مجدد، اطلاعات موجود reset نشوند.

این راهنما مخصوص «Setup Node.js App» و Passenger است. فایل شروع آمادهٔ پروژه `server.js` است؛ اجرای عادی `npm start` برای میزبان‌هایی که فرایند Node را مستقیم مدیریت می‌کنند نیز حفظ شده است. اجرای واقعی روی حساب هاست هنوز باید با مراحل زیر تأیید شود.

## ۱. ساخت برنامه

در Setup Node.js App، گزینهٔ Create Application را بزنید:

| گزینه | مقدار |
| --- | --- |
| Node.js version | `22`، با نسخهٔ دقیق حداقل `22.18.0` |
| Application mode | `Production` |
| Application root | `elita-social`، در پوشهٔ اصلی حساب و خارج از `public_html` |
| Application URL | `elitasocial.ir`؛ مسیر زیر دامنه خالی یا `/` |
| Application startup file | `server.js` |

اگر نام کاربری cPanel مثلاً `myaccount` باشد، ریشهٔ برنامه معمولاً `/home/myaccount/elita-social` است. مسیر واقعی نمایش‌داده‌شده در پنل ملاک است؛ این نام کاربری مثال است. ابتدا وضعیت گواهی دامنه را در SSL/TLS Status بررسی کنید تا `https://elitasocial.ir` گواهی معتبر داشته باشد. سپس در بخش Domains، گزینهٔ **Force HTTPS Redirect** را برای همین دامنه روشن کنید؛ داشتن گواهی به‌تنهایی بازدیدکنندهٔ HTTP را منتقل نمی‌کند. اگر `www` هم سرویس می‌دهید، DNS و گواهی معتبر آن را برقرار و آن را به `https://elitasocial.ir` هدایت کنید تا مبدأ ورود و فرم‌ها یکسان بماند.

## ۲. انتقال کد

سورس ZIP آماده‌شده یا محتوای آخرین نسخهٔ مخزن را در Application root استخراج کنید؛ `package.json` و `server.js` باید مستقیماً در همین پوشه باشند، نه داخل پوشهٔ تودرتوی دیگری. پوشه‌های `node_modules`، `.next` و `out` کامپیوتر ویندوزی را منتقل نکنید. وابستگی‌ها و build روی هاست Linux ساخته می‌شوند. `node_modules` مدیریت‌شدهٔ پنل را دستی جایگزین نکنید.

## ۳. تنظیمات خصوصی هاست

فایل `deploy/cpanel.env.example` را داخل Application root با نام `.env.local` کپی کنید. نمایش فایل‌های مخفی را در File Manager روشن کنید. نام کاربری موجود در `CMS_DATA_DIR` را با نام واقعی حساب عوض کنید:

```dotenv
NODE_ENV=production
SITE_URL=https://elitasocial.ir
CMS_ORIGIN=https://elitasocial.ir
SITE_INDEXING=false
CMS_DATA_DIR=/home/YOUR_CPANEL_USERNAME/elita-data
```

پوشهٔ `elita-data` را در فضای خصوصی حساب، خارج از `public_html` و پوشهٔ کد بسازید. فقط کاربر برنامه باید دسترسی نوشتن داشته باشد؛ مجوز `700` برای پوشه مناسب است. این مسیر باید با به‌روزرسانی کد باقی بماند.

این تنظیمات را می‌توان در Environment variables پنل هم تعریف کرد؛ مقادیر پنل بر فایل اولویت دارند. در نتیجه مقدار متناقض یا قدیمی را هم‌زمان در دو جا نگه ندارید. متغیرهای `DEPLOY_TARGET` و `NEXT_PUBLIC_BASE_PATH` در این انتشار تعریف نشوند. `CMS_COOKIE_SECURE=false` نیز روی دامنهٔ HTTPS تنظیم نشود. فایل خصوصی کامپیوتر را بدون بازبینی تنظیمات روی هاست کپی نکنید؛ نمونهٔ مخصوص هاست مبناست.

## ۴. نصب وابستگی‌ها و بررسی هاست

اگر Terminal دارید، دستور فعال‌سازی محیط Node را **عیناً از بالای صفحهٔ Setup Node.js App** کپی و اجرا کنید؛ سپس در Application root:

```sh
npm install --include=dev
npm run check:host
```

`check:host` نسخهٔ دقیق Node، API داخلی SQLite، timeout روی دیتابیس موقتِ درون‌حافظه‌ای و تبدیل WebP با Sharp را بدون بازکردن دیتابیس سایت یا خواندن رمز بررسی می‌کند. خطای قدیمی‌بودن Node یعنی ارائه‌دهنده باید نسخهٔ ۲۲ را به `22.18.0` یا بالاتر ارتقا دهد.

اگر Terminal ندارید، در Environment variables پنل `NPM_CONFIG_INCLUDE=dev` را اضافه کنید، Save بزنید و **Run NPM Install** را اجرا کنید. سپس در **Run JS Script**، نام `check:host` را اجرا کنید. نصب وابستگی‌های توسعه برای TypeScript و دستورهای CMS لازم است. اگر پنل این متغیر را به نصب منتقل نکرد و `tsx` یا `typescript` پیدا نشد، از پشتیبانی بخواهید در محیط فعال‌شدهٔ همین برنامه `npm install --include=dev` را اجرا کند.

## ۵. انتقال اطلاعات پنل یا ساخت حساب تازه

کد موجود در Git، اطلاعات دیتابیس و رسانه‌های بارگذاری‌شدهٔ کامپیوتر را شامل نمی‌شود. یکی از دو مسیر زیر را انتخاب کنید:

### حفظ محتوا و حساب فعلی

روی کامپیوتر فعلی، در پوشهٔ پروژه:

```sh
npm run cms:backup
```

هنگام بکاپ، بارگذاری و حذف رسانه را انجام ندهید. از پوشهٔ بکاپی که دستور اعلام می‌کند، `elita.sqlite` و پوشهٔ `media` همان بکاپ را به `CMS_DATA_DIR` خصوصی هاست انتقال دهید. فایل زندهٔ SQLite و فایل‌های WAL را جداگانه کپی نکنید. بکاپ شامل حساب‌ها و درخواست‌های مشاوره است و در Git یا پوشهٔ عمومی قرار نمی‌گیرد.

انتقال و تنظیم مسیر داده را پیش از ارائهٔ سایت به بازدیدکنندگان انجام دهید. سپس روی هاست اجرا کنید:

```sh
npm run cms:migrate
```

در Run JS Script نیز نام `cms:migrate` همین کار را می‌کند. حساب قبلی حفظ می‌شود؛ برای این مسیر `cms:init` یا بازیابی رمز را به‌صورت روتین اجرا نکنید.

### شروع با دیتابیس تازه

فقط اگر انتقال داده لازم نیست، سه خط حساب اولیه را در `.env.local` هاست با اطلاعات خصوصی خودتان کامل کنید:

```dotenv
CMS_ADMIN_EMAIL=your-admin-email@example.com
CMS_ADMIN_NAME=Elita Administrator
CMS_ADMIN_PASSWORD=YOUR_NEW_PRIVATE_PASSWORD
```

رمز باید ۱۲ تا ۱۲۸ نویسه و شامل حرف و عدد باشد. مثال بالا را به‌عنوان رمز استفاده نکنید. سپس روی هاست `npm run cms:init` یا در Run JS Script نام `cms:init` را اجرا کنید. این مسیر حساب و محتوای اولیهٔ پروژه را می‌سازد و اطلاعات ویرایش‌شدهٔ کامپیوتر را منتقل نمی‌کند.

## ۶. ساخت و اجرا

روی هاست:

```sh
npm run build
```

یا در Run JS Script نام `build` را اجرا کنید؛ آماده‌سازی تصاویر نیز خودکار اجرا می‌شود. بعد از موفقیت build، در Setup Node.js App دکمهٔ **Restart** را بزنید. Passenger با `server.js` برنامه را اجرا می‌کند؛ پورت عمومی را خودش مدیریت می‌کند. برای این روش، فرایند دائمی دیگری با `npm start` در Terminal باز نکنید.

اگر خطای Turbopack دربارهٔ مسیر `node_modules` خارج از ریشهٔ پروژه دیدید، ممکن است پنل این پوشه را به محیط Node بیرون از Application root پیوند داده باشد. در این حالت از Terminal محیط فعال‌شدهٔ همان برنامه اجرا کنید؛ این دستور آماده‌سازی تصاویر را نیز نگه می‌دارد:

```sh
npm run build -- --webpack
```

این راه جایگزین مربوط به ساختار symlink هاست است؛ محدودیت RAM یا نسخهٔ Node را رفع نمی‌کند.

### خطای `spawn ... node EAGAIN` هنگام `tsc --showConfig`

در حساب فعلی میهن‌وب‌هاست، این خطا با Webpack و حتی اجرای مستقیم Next با threadهای کمتر تکرار شد. خروجی نشان می‌دهد فرایند جداگانهٔ TypeScript ایجاد نشده است؛ مقدار دقیق محدودیت فرایند/thread یا RAM از این خروجی معلوم نیست. `next.config.ts` یک حالت اختیاری مخصوص build روی Node دارد که با `CPANEL_LOW_RESOURCE_BUILD=true` فعال می‌شود: یک worker، استفاده از worker thread، اجرای Webpack در فرایند اصلی و خواندن تنظیمات TypeScript از API به‌جای CLI جداگانه. بررسی TypeScript غیرفعال نمی‌شود. این حالت در Pages فعال نیست.

بعد از انتقال نسخهٔ جدید `next.config.ts`، محیط Node خود برنامه را فعال کنید و در Application root اجرا کنید:

```sh
(
set -e
unset NODE_OPTIONS
export CPANEL_LOW_RESOURCE_BUILD=true UV_THREADPOOL_SIZE=1 RAYON_NUM_THREADS=1
node scripts/prepare-images.mjs
node node_modules/next/dist/bin/next build --webpack
node node_modules/typescript/bin/tsc --noEmit
)
```

این دستورها بدون فرایند واسط npm و به‌ترتیب اجرا می‌شوند؛ آماده‌سازی تصاویرِ `prebuild` نیز حفظ می‌شود. اجرای مستقل `tsc` پس از build لازم است، چون checker مبتنی بر API در Next خطاهای فایل‌های test/spec را فیلتر می‌کند. `unset NODE_OPTIONS` فقط در subshell این دستور اثر دارد؛ گزینهٔ قبلی `--v8-pool-size=1` در بررسی محلی با worker threadهای این build خطای `ERR_WORKER_INVALID_EXEC_ARGV` ایجاد کرد و نباید در این مسیر اضافه شود.

ساخت کامل این حالت و typecheck مستقل ابتدا با Node رسمی `22.18.0` روی Windows در کپی مستقل و دادهٔ ساختگی موفق بودند. در ۳۰ اکتبر ۲۰۲۶، خروجی Terminal ارسال‌شدهٔ کاربر از هاست Linux نیز تکمیل build و `tsc --noEmit` مستقل را با نشانگر `BUILD_AND_TYPECHECK_OK` تأیید کرد؛ خطای قبلی `EAGAIN` در این مسیر تکرار نشد. اجرای Passenger و بررسی دامنه هنوز مرحلهٔ بعد است. این تنظیم‌ها experimental هستند و منابع نامحدود ایجاد نمی‌کنند؛ threadها هم در سهمیهٔ CloudLinux حساب می‌شوند. اگر خطا در ساخت بعدی تکرار شد، خروجی جدید و صفحهٔ Resource Usage را برای بررسی محدودیت حساب به پشتیبانی بدهید. `ignoreBuildErrors` را برای عبور از خطا فعال نکنید. در ارتقای Next یا TypeScript، پشتیبانی از API و این گزینه‌ها دوباره بررسی شود.

## ۷. بررسی انتشار و ایندکس

- `https://elitasocial.ir` و صفحه‌های خدمات، نمونه‌کار، پلن‌ها و مقاله باز شوند و عکس‌ها درست باشند.
- در `https://elitasocial.ir/admin` ورود، ذخیرهٔ تغییرات و بارگذاری یک تصویر را بررسی کنید.
- دکمه‌های همکاری و پلن‌ها باید به دعوت تماس فوتر برسند؛ لینک‌های تماس و شبکه‌های اجتماعی را بررسی کنید. فرم یا سرویس ارسال خودکار ایمیل وجود ندارد.
- در این مرحله `SITE_INDEXING=false` است. پس از تأیید محتوای عمومی و عملکرد سایت، مقدار را به `true` تغییر دهید، دوباره build و Restart کنید. سپس canonical، `robots.txt` و `sitemap.xml` را از دامنهٔ واقعی بررسی و نقشه را در Search Console ثبت کنید.
- بکاپ بعدی را با `cms:backup` روی هاست بگیرید و نگهداری دوره‌ای آن را تنظیم کنید.

## خطاهای رایج

| خطا | اقدام |
| --- | --- |
| `requires Node.js 22.18.0 or newer` | نسخهٔ دقیق Node انتخاب‌شده را با پشتیبانی بررسی کنید. |
| `node:sqlite` در دسترس نیست | خروجی `check:host` را برای پشتیبانی بفرستید تا build نسخهٔ Node و پشتیبانی SQLite را بررسی کند. |
| `Could not find a production build` | build روی همین Application root موفق نشده یا Restart به پوشهٔ دیگری اشاره دارد. |
| `tsx` یا `typescript` پیدا نشد | نصب را با وابستگی‌های توسعه انجام دهید. |
| `Killed` یا `ENOMEM` در build | خروجی خطا و محدودیت RAM/فرایند برنامه را برای پشتیبانی ارسال کنید. |
| `EAGAIN` در `tsc --showConfig` | بخش حالت اختیاری build با منابع کمتر را دنبال کنید؛ اگر ادامه داشت، محدودیت فرایند/thread را با پشتیبانی بررسی کنید. |
| خطای دسترسی به دیتابیس | مسیر واقعی، مالکیت و مجوز نوشتن `CMS_DATA_DIR` را بررسی کنید. |
| خطای مبدأ یا `403` در ذخیره | HTTPS و انطباق `CMS_ORIGIN` با مبدأ واقعی دامنه را بررسی کنید؛ `www` نباید مبدأ متفاوتی برای فرم بسازد. |

در تصاویر ارسالی کاربر، اجرای `check:host` روی Linux با Node `22.18.0` و اجرای موفق `cms:migrate` پس از انتقال بکاپ دیده شد. خروجی Terminal بعدی کاربر در ۳۰ اکتبر ۲۰۲۶ تکمیل build با پروفایل بالا و typecheck مستقل را نیز تأیید کرد. دسترسی مستقیم به حساب در این مرحله وجود نداشت.

درخواست عمومی فقط‌خواندنی به `https://elitasocial.ir/` با اعتبارسنجی پیش‌فرض گواهی، پاسخ ۲۰۰ و بدنهٔ ۵۱۰ بایت با عنوان «سرویس شما ایجاد شد» داد؛ ریشهٔ دامنه صفحهٔ پیش‌فرض میزبانی را نشان می‌داد. HTTPS این درخواست موفق بود، اما نمایش برنامهٔ الیتا هنوز تأیید نشده است. گام بعد Start App/Restart و بررسی اجرای Passenger و نمایش برنامه، هدایت HTTP/HTTPS، ورود مدیر، محتوای منتقل‌شده و رسانه‌ها و دریافت واقعی ایمیل است. از صفحهٔ پیش‌فرض، ایراد DNS یا گواهی نتیجه‌گیری نشود؛ این مشاهده به‌تنهایی مبنای حذف فایل‌های `public_html` نیست.

منابع: [Node.js Selector در CloudLinux](https://docs.cloudlinux.com/cloudlinuxos/lve_manager/#node-js-selector)، [اتصال سرور Node در Passenger](https://www.phusionpassenger.com/docs/advanced_guides/in_depth/node/reverse_port_binding.html)، [سرور سفارشی Next.js](https://nextjs.org/docs/app/guides/custom-server)، [تنظیم include در npm](https://docs.npmjs.com/cli/commands/npm-install/#include).
