import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { Icon } from "@/components/icons";
import { ServiceArt } from "@/components/service-art";
import { SiteFooter } from "@/components/site-footer";
import { getNavigation } from "@/content/home";
import { services as starterServices } from "@/content/services";
import { sitePath } from "@/lib/site-path";
import { serviceContactHref, servicePricingHref } from "@/lib/service-selection";
import { getCmsContent } from "@/server/content";
import { getSiteSettings } from "@/server/settings";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() { return process.env.DEPLOY_TARGET === "github-pages" ? starterServices.map(({ slug }) => ({ slug })) : []; }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [{ services }, { home: { brand } }] = await Promise.all([getCmsContent(), getSiteSettings()]);
  const service = services.find(item => item.slug === slug);
  return service ? { title: `${service.title} | ${brand.name}`, description: service.intro } : { title: `خدمت پیدا نشد | ${brand.name}` };
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const { services } = await getCmsContent();
  const service = services.find(item => item.slug === slug);
  if (!service) notFound();
  const consultationHref = serviceContactHref(service.slug);
  const pricingHref = service.pricingCategory ? servicePricingHref(service.pricingCategory) : consultationHref;
  const relatedServices = services.filter((item) => item.slug !== service.slug);

  return (
    <div className={`home-shell service-shell service-detail-shell service-theme-${service.theme}`}>
      <a className="skip-link" href="#main-content">رفتن به محتوای اصلی</a>
      <Header activePage="services" navigation={getNavigation("services")} />
      <main id="main-content">
        <section className="service-detail-hero container" aria-labelledby="service-detail-title">
          <div>
            <nav className="service-breadcrumb" aria-label="مسیر صفحه"><a href={sitePath("/")}>خانه</a><span aria-hidden="true">/</span><a href={sitePath("/services/")}>خدمات</a><span aria-hidden="true">/</span><span aria-current="page">{service.shortTitle}</span></nav>
            <p className="eyebrow"><Icon name="sparkle" />{service.title}</p>
            <h1 id="service-detail-title">{service.headline}</h1>
            <p className="service-lead">{service.intro}</p>
            <div className="service-hero-actions"><a className="pill-button" href={consultationHref}>مشاوره دربارهٔ این خدمت<span className="button-circle"><Icon name="arrow" /></span></a><a className="service-text-link" href="#service-deliverables">چه چیزی دریافت می‌کنم؟<Icon name="arrow" /></a></div>
          </div>
          <div className="service-detail-visual"><Image src={sitePath(service.image.src)} alt={service.image.alt} fill sizes="(max-width: 800px) 90vw, 42vw" priority /><div className="service-detail-art"><ServiceArt type={service.slug} /></div><span className="service-detail-image-label">{service.shortTitle}<Icon name="sparkle" /></span></div>
        </section>

        <nav className="service-page-index container" aria-label="بخش‌های این خدمت"><a href="#service-deliverables">خروجی‌های همکاری</a><a href="#service-process">مراحل انجام کار</a><a href="#service-faq">پرسش‌های متداول</a><a href={pricingHref}>{service.pricingCategory ? "دیدن پلن‌های همکاری" : "گفتگو دربارهٔ هزینه"}</a></nav>

        <section className="service-deliverables container" id="service-deliverables" aria-labelledby="service-deliverables-title">
          <div className="service-section-intro"><p className="service-kicker">خدمت با محدودهٔ روشن</p><h2 id="service-deliverables-title">چه چیزی<br />دریافت می‌کنی؟</h2><p>{service.description}</p><div className="service-audience"><Icon name="sparkle" /><div><h3>این خدمت برای توست اگر...</h3><p>{service.audience}</p></div></div></div>
          <div className="service-deliverable-list">{service.deliverables.map((item, index) => <article key={item.title}><span className="service-deliverable-number">{new Intl.NumberFormat("fa-IR", { minimumIntegerDigits: 2 }).format(index + 1)}</span><div><h3>{item.title}</h3><p>{item.description}</p></div></article>)}</div>
        </section>

        <section className="service-process-band" id="service-process" aria-labelledby="service-process-title"><div className="container"><div className="service-process-heading"><div><p className="service-kicker">یک مسیر مشترک</p><h2 id="service-process-title">از اولین گفتگو تا تحویل کار</h2></div><p>در هر مرحله می‌دانی کجای مسیر هستیم و قدم بعدی چیست.</p></div><ol className="service-detail-steps">{service.steps.map((step, index) => <li key={step.title}><span>{new Intl.NumberFormat("fa-IR", { minimumIntegerDigits: 2 }).format(index + 1)}</span><h3>{step.title}</h3><p>{step.description}</p></li>)}</ol></div></section>

        <section className="service-faq-section container" id="service-faq" aria-labelledby="service-faq-title"><div className="section-heading"><h2 id="service-faq-title">قبل از شروع، شاید بپرسی...</h2><p>اگر پرسش دیگری داری، در فرم مشاوره بنویس تا درباره‌اش صحبت کنیم.</p></div><div className="service-faq-list">{service.faqs.map((faq) => <details key={faq.question}><summary>{faq.question}<span aria-hidden="true">+</span></summary><p>{faq.answer}</p></details>)}</div></section>

        <section className="service-plan-invitation container" aria-labelledby="service-plan-invitation-title"><div><p className="service-kicker">قدم بعدی برای برند تو</p><h2 id="service-plan-invitation-title">دربارهٔ {service.shortTitle} صحبت کنیم</h2><p>{service.pricingCategory ? "پلن‌ها برای آشنایی اولیه با ساختار همکاری نمایش داده شده‌اند؛ محدوده و هزینهٔ نهایی پس از بررسی نیازت مشخص می‌شود." : "نیاز محتوایی برندت را بگو تا دربارهٔ قالب، حجم کار و هزینه با هم هماهنگ کنیم."}</p><div className="service-hero-actions"><a className="pill-button" href={consultationHref}>درخواست مشاوره<span className="button-circle"><Icon name="arrow" /></span></a>{service.pricingCategory && <a className="service-text-link" href={pricingHref}>{service.pricingLabel}<Icon name="arrow" /></a>}</div></div><div className="service-plan-art" aria-hidden="true"><ServiceArt type={service.slug} /></div></section>

        <section className="service-related container" aria-labelledby="service-related-title"><div className="service-related-heading"><h2 id="service-related-title">برای قدم‌های بعدی برندت</h2><a className="service-text-link" href={sitePath("/portfolio/")}>دیدن نمونه‌کارها<Icon name="arrow" /></a></div><div className="service-related-grid">{relatedServices.map((item) => <a className={`service-related-card service-theme-${item.theme}`} href={sitePath(`/services/${item.slug}/`)} key={item.slug}><ServiceArt type={item.slug} /><h3>{item.shortTitle}</h3><span>آشنایی با این خدمت<Icon name="arrow" /></span></a>)}</div></section>
      </main>
      <SiteFooter />
    </div>
  );
}
