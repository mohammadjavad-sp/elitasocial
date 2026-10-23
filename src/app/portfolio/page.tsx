import type { Metadata } from "next";
import { Header } from "@/components/header";
import { SiteFooter } from "@/components/site-footer";
import { PortfolioGallery } from "@/components/portfolio-gallery";
import { Icon } from "@/components/icons";
import { getNavigation } from "@/content/home";
import { portfolioDemoNotice } from "@/content/portfolio";
import { sitePath } from "@/lib/site-path";
import { getCmsContent } from "@/server/content";
import { getSiteSettings } from "@/server/settings";

export async function generateMetadata(): Promise<Metadata> {
  const { home: { brand } } = await getSiteSettings();
  return { title: `نمونه‌کارها و ایده‌های طراحی | ${brand.name}`, description: "گالری نمونه‌کارهای طراحی سایت، مدیریت اینستاگرام و تولید محتوا در الیتا سوشال. سبک مناسب برندتان را پیدا کنید." };
}

export default async function PortfolioPage() {
  const [{ portfolio }, { home: { contact } }] = await Promise.all([getCmsContent(), getSiteSettings()]);
  return <div className="home-shell portfolio-shell"><a className="skip-link" href="#main-content">رفتن به محتوای اصلی</a><Header activePage="portfolio" navigation={getNavigation("portfolio")} />
    <main id="main-content">
      <section className="portfolio-page-heading container" aria-labelledby="portfolio-heading">
        <nav className="portfolio-breadcrumb" aria-label="مسیر صفحه"><a href={sitePath("/")}>خانه</a><span aria-hidden="true">/</span><span aria-current="page">نمونه‌کارها</span></nav>
        <div className="portfolio-page-title"><div><h1 id="portfolio-heading">ایده‌هایی برای<br />دنیای دیجیتال برند تو</h1><p>یک پیج منسجم، یک سایت خوش‌ساخت، یک روایت به‌یادماندنی.<br />از میان این طرح‌ها، حال‌وهوای نزدیک به برندت را پیدا کن.</p></div><div className="portfolio-heading-mark" aria-hidden="true"><Icon name="sparkle" /><span>از ایده<br />تا یک تجربه</span></div></div>
        {portfolio.some(project => project.isMock !== false) && <p className="portfolio-demo-notice"><Icon name="sparkle" /><span>{portfolio.some(project => project.isMock === false) ? "نمونه‌های دارای نشان نمایشی، کانسپت طراحی‌اند و پروژهٔ واقعی مشتریان نیستند." : portfolioDemoNotice}</span></p>}
      </section>
      <section className="portfolio-page-gallery container" aria-label="گالری نمونه‌کارها"><PortfolioGallery projects={portfolio} /></section>
      <section className="portfolio-invitation container" aria-labelledby="portfolio-invitation-title"><div><h2 id="portfolio-invitation-title">حالا نوبت قصهٔ برند توست</h2><p>بگو چه در ذهن داری تا دربارهٔ مسیر و سبک مناسب کسب‌وکارت صحبت کنیم.</p></div><a className="pill-button" href={contact.whatsapp} target="_blank" rel="noopener noreferrer"><span>شروع گفت‌وگو دربارهٔ برندم</span><span className="button-circle"><Icon name="arrow" /></span></a></section>
    </main><SiteFooter /></div>;
}
