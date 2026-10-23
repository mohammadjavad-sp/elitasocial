# انتشار با GitHub Pages

مخزن مقصد: [mohammadjavad-sp/elitasocial](https://github.com/mohammadjavad-sp/elitasocial)

در تنظیمات مخزن، بخش **Settings → Pages → Build and deployment → Source** روی **GitHub Actions** تنظیم شده است. جریان انتشار در `.github/workflows/deploy-pages.yml` با هر push به شاخهٔ `main` اجرا می‌شود؛ از تب **Actions** نیز می‌توان آن را دستی اجرا کرد.

آدرس مورد انتظار پس از انتشار موفق: [نمایش سایت](https://mohammadjavad-sp.github.io/elitasocial/). نتیجهٔ هر اجرا در تب Actions مخزن مشخص است.

ساخت نسخهٔ Pages با `DEPLOY_TARGET=github-pages` و `NEXT_PUBLIC_BASE_PATH=/elitasocial` انجام می‌شود و خروجی ایستا در پوشهٔ `out` قرار می‌گیرد. در صورت تغییر نام مخزن باید مسیر پایه در workflow نیز تغییر کند.

GitHub Pages فقط فایل‌های ایستا را میزبانی می‌کند. برای افزودن CMS یا قابلیت‌های سمت سرور در آینده، پروژه می‌تواند با تنظیمات عادی Next.js روی Vercel یا یک سرور Node.js اجرا شود؛ در آن حالت این دو متغیر محیطی را تنظیم نکنید.

مرجع: [راهنمای رسمی انتشار با GitHub Actions](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
