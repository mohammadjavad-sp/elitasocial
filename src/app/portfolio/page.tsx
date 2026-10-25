import type { Metadata } from "next";
import Image from "next/image";
import { Header } from "@/components/header";
import { SiteFooter } from "@/components/site-footer";
import { PortfolioGallery } from "@/components/portfolio-gallery";
import { Icon } from "@/components/icons";
import { getNavigation } from "@/content/home";
import { sitePath } from "@/lib/site-path";
import { getCmsContent } from "@/server/content";
import { getSiteSettings } from "@/server/settings";
import { ContactChannels } from "@/components/contact-channels";

export async function generateMetadata(): Promise<Metadata> {
  const { home: { brand } } = await getSiteSettings();
  return { title: `نمونه‌کارها و ایده‌های طراحی | ${brand.name}`, description: "گالری نمونه‌کارهای طراحی سایت، مدیریت اینستاگرام و تولید محتوا در الیتا سوشیال. سبک مناسب برندتان را پیدا کنید." };
}

export default async function PortfolioPage() {
  const [{ portfolio }, { home: { contact } }] = await Promise.all([getCmsContent(), getSiteSettings()]);
  return <div className="home-shell portfolio-shell"><a className="skip-link" href="#main-content">رفتن به محتوای اصلی</a><Header activePage="portfolio" navigation={getNavigation("portfolio")} />
    <main id="main-content">
      <section className="editorial-hero portfolio-editorial-hero container" aria-labelledby="portfolio-heading">
        <nav className="portfolio-breadcrumb" aria-label="مسیر صفحه"><a href={sitePath("/")}>خانه</a><span aria-hidden="true">/</span><span aria-current="page">نمونه‌کارها</span></nav>
        <div className="editorial-hero-grid">
          <div className="editorial-hero-copy">
            <p className="editorial-hero-kicker"><span aria-hidden="true" />دنیای طراحی الیتا</p>
            <h1 id="portfolio-heading">ایده‌هایی که<br />رنگِ برند تو را می‌گیرند</h1>
            <p className="editorial-hero-description">از یک ویترین دیجیتال تا یک روایت تازه در اینستاگرام؛ اینجا می‌توانی سبک‌ها را ببینی و حال‌وهوای نزدیک به برندت را پیدا کنی.</p>
            <div className="editorial-hero-actions">
              <a className="pill-button" href="#portfolio-gallery">کشف نمونه‌کارها<span className="button-circle"><Icon name="arrow" /></span></a>
              <a className="editorial-hero-text-link" href={sitePath("/#contact")}>دربارهٔ برندم صحبت کنیم<Icon name="arrow" /></a>
            </div>
            <p className="editorial-hero-disciplines">طراحی سایت<span aria-hidden="true">/</span>هویت پیج<span aria-hidden="true">/</span>تولید محتوا</p>
          </div>
          <div className="editorial-hero-visual portfolio-hero-visual">
            <div className="editorial-photo-backdrop" aria-hidden="true" />
            <div className="editorial-hero-photo portfolio-hero-photo"><Image src={sitePath("/images/portfolio-hero.webp")} alt="میز کار خلاقانه با لپ‌تاپ، طرح‌های گرافیکی و نمونه‌های رنگ برای طراحی هویت دیجیتال" width={1500} height={1100} priority sizes="(min-width: 1000px) 46vw, (min-width: 700px) 72vw, 90vw" /></div>
            <div className="portfolio-hero-preview" aria-hidden="true">
              <div className="portfolio-preview-chrome"><i /><i /><i /><span>طراحی فروشگاه برگ</span></div>
              <div className="portfolio-preview-content"><span className="portfolio-preview-brand">برگ</span><strong>یک گوشهٔ سبز،<br />برای تو</strong><span className="portfolio-preview-leaf" /><span className="portfolio-preview-rule" /><span className="portfolio-preview-rule" /></div>
            </div>
            <span className="editorial-hero-seal" aria-hidden="true"><Icon name="sparkle" /><span>از ایده<br />تا تجربه</span></span>
            <p className="editorial-photo-caption"><span />جایی برای شکل‌گرفتن ایده‌های تازه</p>
          </div>
        </div>
      </section>
      <section className="portfolio-page-gallery container" id="portfolio-gallery" aria-label="گالری نمونه‌کارها">
        <PortfolioGallery projects={portfolio} />
      </section>
      <section className="portfolio-invitation container" aria-labelledby="portfolio-invitation-title"><div><h2 id="portfolio-invitation-title">حالا نوبت قصهٔ برند توست</h2><p>بگو چه در ذهن داری تا دربارهٔ مسیر و سبک مناسب کسب‌وکارت صحبت کنیم.</p></div><div className="contact-actions"><a className="pill-button" href={contact.whatsapp} target="_blank" rel="noopener noreferrer"><span>شروع گفت‌وگو دربارهٔ برندم</span><span className="button-circle"><Icon name="arrow" /></span></a><ContactChannels contact={contact} includeWhatsapp={false} compact /></div></section>
    </main><SiteFooter /></div>;
}
