import type { Metadata } from "next";
import Image from "next/image";
import { Header } from "@/components/header";
import { Icon } from "@/components/icons";
import { ServiceArt } from "@/components/service-art";
import { SiteFooter } from "@/components/site-footer";
import { getNavigation } from "@/content/home";
import { sitePath } from "@/lib/site-path";
import { getCmsContent } from "@/server/content";
import { getSiteSettings } from "@/server/settings";

export async function generateMetadata(): Promise<Metadata> {
  const { home: { brand } } = await getSiteSettings();
  return {
    title: `خدمات دیجیتال مارکتینگ | ${brand.name}`,
    description: "مدیریت اینستاگرام، طراحی وب‌سایت، تولید محتوا و سئو؛ با خدمات الیتا سوشیال، خروجی‌ها و مراحل همکاری آشنا شوید.",
  };
}

export default async function ServicesPage() {
  const { services } = await getCmsContent();
  return (
    <div className="home-shell service-shell">
      <a className="skip-link" href="#main-content">رفتن به محتوای اصلی</a>
      <Header activePage="services" navigation={getNavigation("services")} />
      <main id="main-content">
        <section className="service-overview-hero container" aria-labelledby="services-page-title">
          <div className="service-overview-copy">
            <nav className="service-breadcrumb" aria-label="مسیر صفحه"><a href={sitePath("/")}>خانه</a><span aria-hidden="true">/</span><span aria-current="page">خدمات الیتا</span></nav>
            <p className="eyebrow"><Icon name="sparkle" />برای هر بخش از حضور دیجیتال تو</p>
            <h1 id="services-page-title">یک برند،<br />چند مسیر برای دیده شدن</h1>
            <p className="service-lead">از اولین ایدهٔ محتوا تا وب‌سایتی که خانهٔ برندت می‌شود؛ با توجه به نیاز کسب‌وکارت، مسیر مناسب را با هم انتخاب می‌کنیم.</p>
            <div className="service-hero-actions"><a className="pill-button" href="#choose-service">خدمت مناسبم را پیدا کنم<span className="button-circle"><Icon name="arrow" /></span></a><a className="service-text-link" href={sitePath("/#contact")}>دربارهٔ انتخابم مشاوره می‌خواهم<Icon name="arrow" /></a></div>
          </div>
          <div className="service-overview-visual">
            <Image src={sitePath("/images/campaign-workspace.webp")} alt="فضای کار برنامه‌ریزی دیجیتال مارکتینگ، محتوا و طراحی سایت" width={1500} height={1000} sizes="(max-width: 800px) 90vw, 45vw" priority />
            <div className="service-visual-note"><Icon name="sparkle" /><span>محتوا، طراحی و همراهی<br /><strong>در یک مسیر هماهنگ</strong></span></div>
          </div>
        </section>

        <section className="service-catalog container" id="choose-service" aria-labelledby="service-catalog-title">
          <div className="section-heading"><h2 id="service-catalog-title">برندت الان به چه چیزی نیاز داره؟</h2><p>خروجی هر خدمت و روش همکاری را ببین؛ اگر هنوز مطمئن نیستی، از یک گفتگو شروع کنیم.</p></div>
          <div className="service-catalog-grid">
            {services.map((service, index) => <article className={`service-catalog-card service-theme-${service.theme}`} key={service.slug}>
              <div className="service-catalog-art"><span className="service-item-number">{new Intl.NumberFormat("fa-IR", { minimumIntegerDigits: 2 }).format(index + 1)}</span><ServiceArt type={service.slug} /></div>
              <div className="service-catalog-body"><h3><a href={sitePath(`/services/${service.slug}/`)}>{service.title}</a></h3><p>{service.intro}</p><a className="service-text-link" href={sitePath(`/services/${service.slug}/`)}>خروجی‌ها و مراحل همکاری<Icon name="arrow" /></a></div>
            </article>)}
          </div>
          {services.length === 0 && <p className="demo-notice">برای انتخاب خدمات متناسب با نیاز برندت با ما گفتگو کن.</p>}
        </section>

        <section className="service-overview-process container" aria-labelledby="service-overview-process-title">
          <div><p className="service-kicker">از نیاز تو تا یک برنامهٔ روشن</p><h2 id="service-overview-process-title">شروع همکاری،<br />قدم به قدم</h2><p>قبل از شروع اجرا، دربارهٔ انتظارات و محدودهٔ کار به یک تصویر مشترک می‌رسیم.</p></div>
          <ol className="service-intro-steps">
            <li><span>۰۱</span><div><h3>از کسب‌وکارت بگو</h3><p>دربارهٔ مخاطب، وضعیت فعلی و هدفی که در ذهن داری حرف می‌زنیم.</p></div></li>
            <li><span>۰۲</span><div><h3>مسیر را با هم مشخص کنیم</h3><p>خدمت مناسب، خروجی‌ها، زمان‌بندی و هزینه پیش از شروع هماهنگ می‌شوند.</p></div></li>
            <li><span>۰۳</span><div><h3>اجرا، بازخورد و همراهی</h3><p>کار با بازخورد تو پیش می‌رود تا تصمیم‌ها و قدم بعدی روشن باشند.</p></div></li>
          </ol>
        </section>

        <section className="service-invitation container" aria-labelledby="service-invitation-title"><div><p className="service-kicker">لازم نیست از همین حالا همه‌چیز مشخص باشد</p><h2 id="service-invitation-title">اول از نیاز برندت حرف بزنیم</h2><p>وضعیت فعلی و چیزی که می‌خواهی تغییر کند را بنویس؛ از همان‌جا شروع می‌کنیم.</p></div><a className="pill-button" href={sitePath("/#contact")}>مشاوره و شروع همکاری<span className="button-circle"><Icon name="arrow" /></span></a></section>
      </main>
      <SiteFooter />
    </div>
  );
}
