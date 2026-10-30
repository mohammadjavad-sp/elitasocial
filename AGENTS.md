<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# دستورالعمل دائمی Codex برای این مخزن

## پیش از شروع هر وظیفه

- اول `HANDOFF.md`, `ARCHITECTURE.md`, `PROJECT_STATUS.md`, `DECISIONS.md` و README را بخوان و سپس فایل‌های مرتبط و مستندات تخصصی `docs/` را بررسی کن. این اسناد راهنمایند؛ در صورت اختلاف، وضعیت واقعی source/config/package lock مقدم است و اختلاف را گزارش کن.
- `git status --short` را پیش از هر تغییر بررسی کن. تغییرهای موجود کاربر را حفظ کن و فقط فایل‌های داخل محدودهٔ درخواست را دست بزن.
- قبل از نوشتن/تغییر کد Next.js، مستندات محلی نسخهٔ نصب‌شده را از `node_modules/next/dist/docs/` بخوان؛ در monorepo مسیر package را از محل AGENTS resolve کن. deprecated APIs و تفاوت‌های نسخه را بررسی کن.
- هیچ فایل `.env*` به‌جز نمونه‌های عمومی را بازنشر یا commit نکن. مقدار secret، رمز، token، دادهٔ شخصی، محتوای دیتابیس، backup یا خروجی runtime را در پاسخ/مستندات نیاور.
- برای تغییرات schema/API ابتدا consumers، validation و migration را بررسی کن. دادهٔ CMS، حساب مدیر و رسانه را reset یا حذف نکن؛ `cms:init` و `cms:backup`/`cms:migrate` روی محیط زنده عملیات واقعی هستند و فقط با هدف روشن اجرا شوند.

## استاندارد توسعه

- TypeScript strict است؛ alias `@/*` به `src/*` اشاره دارد. کد سرور در `src/server` و UI در `src/components`/`src/app` نگه داشته شود. دسترسی DB/crypto/filesystem را به client bundle نبر.
- Persian/RTL، responsive layout، keyboard/focus، semantic HTML و `prefers-reduced-motion` را حفظ کن. در تغییر theme از tokenهای موجود استفاده کن و برای تعامل، state/error/empty/loading را پوشش بده.
- قراردادهای عمومی را بدون بررسی تغییر نده: static Pages CMS ندارد؛ Node runtime دارد؛ schema، revision locking، Origin/CSRF و مسیر رسانه در APIها اهمیت دارند.
- سورس را از مستندات قابل‌تولید Next جدا نگه دار. Block خودکار ابتدای فایل را تغییر نده یا حذف نکن.
- مستندات را از وضعیت واقعی مخزن به‌روزرسانی کن؛ ادعای تست، build، deployment یا تحویل ایمیل را فقط با نتیجهٔ قابل مشاهده و تاریخ/محدودیت دقیق گزارش کن.

## اجرای محلی و بررسی‌ها

نیاز اعلامی پروژه: Node.js `22.19.0+` و npm. دستورات متداول:

```sh
npm install
npm run dev
```

بررسی‌های تعریف‌شده در `package.json`:

```sh
npm run typecheck
npm run build
npm run check:host
npm run check:ui
npm run check:portfolio
npm run check:security
npm run check:seo
```

اجرا را به محدودهٔ تغییر و درخواست کاربر محدود کن؛ نتیجه را از خود خروجی تأیید کن. `check:host` preflight محلی است و جای اجرای واقعی روی cPanel نیست. UI checks به Playwright/browser نصب‌شده وابسته‌اند. برای دستورهای محتوا/دیتابیس (`cms:init`, `cms:migrate`, `cms:backup`) ابتدا آثار جانبی را از اسکریپت بخوان و محیط/هدف را روشن کن. برای استقرار Node راهنمای `docs/cpanel-launch.md` و برای static preview راهنمای `docs/deployment.md` را دنبال کن.

## محدودهٔ تغییر و تحویل

- اگر کاربر صریحاً فقط مستندات خواست، کد، package/config و دیتابیس را تغییر نده.
- پس از تغییر، diff و `git status` را بازبینی کن؛ فایل‌های نامرتبط، خروجی‌های build، screenshotها، backupها و secrets را وارد تحویل نکن.
- جمع‌بندی را به فارسی (مگر درخواست دیگر) با فایل‌های تغییرکرده، بررسی‌های اجراشده/نشده، محدودیت‌ها و گام بعدی دقیق ارائه کن.
