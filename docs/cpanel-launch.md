# راه‌اندازی elitasocial.ir روی cPanel

این راهنما مخصوص «Setup Node.js App» و Passenger است. فایل شروع آمادهٔ پروژه `server.js` است؛ اجرای عادی `npm start` برای میزبان‌هایی که فرایند Node را مستقیم مدیریت می‌کنند نیز حفظ شده است. اجرای واقعی روی حساب هاست هنوز باید با مراحل زیر تأیید شود.

## ۱. ساخت برنامه

در Setup Node.js App، گزینهٔ Create Application را بزنید:

| گزینه | مقدار |
| --- | --- |
| Node.js version | `22`، با نسخهٔ دقیق حداقل `22.19.0` |
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

`check:host` نسخهٔ دقیق Node، API داخلی SQLite و تبدیل WebP با Sharp را بدون بازکردن دیتابیس یا خواندن رمز بررسی می‌کند. خطای قدیمی‌بودن Node یعنی ارائه‌دهنده باید نسخهٔ ۲۲ را به `22.19.0` یا بالاتر ارتقا دهد.

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

## ۷. بررسی انتشار و ایندکس

- `https://elitasocial.ir` و صفحه‌های خدمات، نمونه‌کار، پلن‌ها و مقاله باز شوند و عکس‌ها درست باشند.
- در `https://elitasocial.ir/admin` ورود، ذخیرهٔ تغییرات و بارگذاری یک تصویر را بررسی کنید.
- خودتان یک درخواست آزمایشی مشاوره بفرستید، ثبت آن را در پنل ببینید و دریافت ایمیل را هم بررسی کنید؛ تأیید مقصد FormSubmit ممکن است لازم باشد.
- در این مرحله `SITE_INDEXING=false` است. پس از تأیید محتوای عمومی و عملکرد سایت، مقدار را به `true` تغییر دهید، دوباره build و Restart کنید. سپس canonical، `robots.txt` و `sitemap.xml` را از دامنهٔ واقعی بررسی و نقشه را در Search Console ثبت کنید.
- بکاپ بعدی را با `cms:backup` روی هاست بگیرید و نگهداری دوره‌ای آن را تنظیم کنید.

## خطاهای رایج

| خطا | اقدام |
| --- | --- |
| `requires Node.js 22.19.0 or newer` | نسخهٔ دقیق Node انتخاب‌شده را با پشتیبانی بررسی کنید. |
| `node:sqlite` در دسترس نیست | خروجی `check:host` را برای پشتیبانی بفرستید تا build نسخهٔ Node و پشتیبانی SQLite را بررسی کند. |
| `Could not find a production build` | build روی همین Application root موفق نشده یا Restart به پوشهٔ دیگری اشاره دارد. |
| `tsx` یا `typescript` پیدا نشد | نصب را با وابستگی‌های توسعه انجام دهید. |
| `Killed` یا `ENOMEM` در build | خروجی خطا و محدودیت RAM/فرایند برنامه را برای پشتیبانی ارسال کنید. |
| خطای دسترسی به دیتابیس | مسیر واقعی، مالکیت و مجوز نوشتن `CMS_DATA_DIR` را بررسی کنید. |
| خطای مبدأ یا `403` در ذخیره | HTTPS و انطباق `CMS_ORIGIN` با مبدأ واقعی دامنه را بررسی کنید؛ `www` نباید مبدأ متفاوتی برای فرم بسازد. |

دسترسی واقعی cPanel، Passenger و SSL حساب کاربر از داخل این پروژه قابل تأیید نیست. آزمون محلی راه‌انداز با شبیه‌سازی Passenger جای اجرای `check:host`، build و بررسی دامنهٔ واقعی را نمی‌گیرد.

منابع: [Node.js Selector در CloudLinux](https://docs.cloudlinux.com/cloudlinuxos/lve_manager/#node-js-selector)، [اتصال سرور Node در Passenger](https://www.phusionpassenger.com/docs/advanced_guides/in_depth/node/reverse_port_binding.html)، [سرور سفارشی Next.js](https://nextjs.org/docs/app/guides/custom-server)، [تنظیم include در npm](https://docs.npmjs.com/cli/commands/npm-install/#include).
