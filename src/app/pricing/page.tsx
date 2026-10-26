import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Icon } from "@/components/icons";
import { PricingSection } from "@/components/pricing-section";
import { SiteFooter } from "@/components/site-footer";
import { getNavigation } from "@/content/home";
import { sitePath } from "@/lib/site-path";
import { getCmsContent } from "@/server/content";
import { getSiteSettings } from "@/server/settings";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { home: { brand } } = await getSiteSettings();
  return createPageMetadata({
    title: `پلن‌ها و قیمت‌ها | ${brand.name}`,
    description: `پلن‌های مدیریت اینستاگرام، طراحی وب‌سایت و سئو و پشتیبانی ${brand.name} را همراه با امکانات، دوره و هزینه مقایسه کنید و برای همکاری مشاوره بگیرید.`,
    path: "/pricing/",
    siteName: brand.name,
  });
}

export default async function PricingPage() {
  const [content, settings] = await Promise.all([getCmsContent(), getSiteSettings()]);
  const { sections, faqs } = settings;
  return <div className="home-shell pricing-shell">
    <a className="skip-link" href="#main-content">رفتن به محتوای اصلی</a>
    <Header activePage="pricing" navigation={getNavigation("pricing")} />
    <main id="main-content">
      <section className="pricing-page-hero container" aria-labelledby="pricing-page-title">
        <nav className="service-breadcrumb" aria-label="مسیر صفحه"><a href={sitePath("/")}>خانه</a><span aria-hidden="true">/</span><span aria-current="page">پلن‌ها و قیمت‌ها</span></nav>
        <div className="pricing-page-intro">
          <p className="eyebrow"><Icon name="sparkle" />پلن‌ها و قیمت‌های همکاری</p>
          <h1 id="pricing-page-title">{sections.pricingTitle.map((line, index) => <span key={index}>{line}</span>)}</h1>
          <p className="pricing-page-lead">{sections.pricingDescription}</p>
          <div className="pricing-page-actions"><a className="pill-button" href="#pricing">مقایسهٔ پلن‌ها<span className="button-circle"><Icon name="arrow" /></span></a><a className="service-text-link" href={sitePath("/#contact")}>برای انتخاب راهنمایی می‌خواهم<Icon name="arrow" /></a></div>
        </div>
        <div className="pricing-page-visual" aria-hidden="true">
          <span className="pricing-visual-orbit"><span /></span>
          <div className="pricing-visual-card pricing-visual-card-back" />
          <div className="pricing-visual-card pricing-visual-card-front">
            <span className="pricing-visual-tag"><Icon name="sparkle" />همکاری با {settings.home.brand.name}</span>
            <strong>برای برند تو،<br />با نیازهای خودت</strong>
            {content.pricing.categories.map(category => <div className="pricing-visual-service" key={category.id}><span><Icon name={category.id === "instagram" ? "instagram" : category.id === "website" ? "website" : "sparkle"} /></span>{category.label}</div>)}
            <p className="pricing-visual-note">از یک انتخاب روشن شروع کنیم.</p>
          </div>
        </div>
      </section>

      <PricingSection pricing={content.pricing} variant="page" />

      <section className="pricing-choice-section container" aria-labelledby="pricing-choice-title">
        <div className="pricing-choice-heading"><h2 id="pricing-choice-title">پلن مناسب را چطور انتخاب کنم؟</h2><p>لازم نیست از همان اول همهٔ جزئیات را بدانی؛ از چیزی که برندت الان به آن نیاز دارد شروع کن.</p></div>
        <ol className="pricing-choice-steps">
          <li><span className="pricing-step-marker" aria-hidden="true">۰۱</span><div><h3>مسیرت را انتخاب کن</h3><p>مدیریت پیج، طراحی سایت یا رسیدگی به سایت فعلی؟ از تب‌های بالا خدمت موردنیازت را پیدا کن.</p></div></li>
          <li><span className="pricing-step-marker" aria-hidden="true">۰۲</span><div><h3>خروجی‌ها را کنار هم ببین</h3><p>امکانات، مبلغ و دورهٔ هر پلن را مقایسه کن و ببین کدام به اولویت‌ها و بودجه‌ات نزدیک‌تر است.</p></div></li>
          <li><span className="pricing-step-marker" aria-hidden="true">۰۳</span><div><h3>دربارهٔ انتخابت گفتگو کنیم</h3><p>روی مشاورهٔ همان پلن بزن؛ نام پلن و خدمت به فرم منتقل می‌شود تا از همان نقطه گفتگو را شروع کنیم.</p></div></li>
        </ol>
      </section>

      {faqs.length > 0 && <section className="pricing-questions container" aria-labelledby="pricing-questions-title">
        <div className="pricing-choice-heading"><h2 id="pricing-questions-title">قبل از شروع، شاید سؤال تو هم باشه</h2><p>چند نکته برای انتخاب و شروع همکاری</p></div>
        <div className="pricing-questions-list">{faqs.map((faq, index) => <details key={`${index}-${faq.question}`}><summary>{faq.question}<span aria-hidden="true">+</span></summary><p>{faq.answer}</p></details>)}</div>
      </section>}

      <section className="pricing-page-cta container" aria-labelledby="pricing-page-cta-title"><div><h2 id="pricing-page-cta-title">برندت به ترکیب متفاوتی نیاز داره؟</h2><p>اگر بین چند پلن مانده‌ای یا به چند خدمت در کنار هم فکر می‌کنی، از کسب‌وکارت بگو تا مسیر همکاری را مشخص کنیم.</p></div><a className="pill-button" href={sitePath("/#contact")}>از برندم بگم<span className="button-circle"><Icon name="arrow" /></span></a></section>
    </main>
    <SiteFooter />
  </div>;
}
