import Image from "next/image";
import { getSiteSettings } from "@/server/settings";
import { Icon } from "./icons";
import { ServiceArt } from "./service-art";
import { sitePath } from "@/lib/site-path";
import { services as starterServices, type ServiceDetail } from "@/content/services";

export async function AboutSection() {
  const { home: { about } } = await getSiteSettings();
  return (
    <section id="about" className="about-section container" aria-labelledby="about-title">
      <div className="about-main-image">
        <div className="about-photo-frame"><Image {...about.image} src={sitePath(about.image.src)} sizes="(min-width: 1050px) 380px, (min-width: 600px) 44vw, 80vw" /></div>
        <span className="about-photo-caption"><strong>{about.caption}</strong><span>{about.captionDetail}</span></span>
        <span className="section-spark about-spark" aria-hidden="true"><Icon name="sparkle" /></span>
      </div>
      <div className="about-copy">
        <div className="about-seal" aria-hidden="true">
          <span>هر برند،</span><Icon name="arrow" /><span>قصهٔ خودش را دارد</span>
        </div>
        <h2 id="about-title">{about.title.map(line => <span key={line}>{line}</span>)}</h2>
        <p>{about.description}</p>
        <p>{about.detail}</p>
        <a className="pill-button about-action" href="#services">{about.actionLabel}<span className="button-circle"><Icon name="arrow" /></span></a>
      </div>
      <div className="about-secondary-image">
        <div className="about-orbits" aria-hidden="true"><span /><span /><span /><i /></div>
        <div className="about-small-frame"><Image {...about.secondaryImage} src={sitePath(about.secondaryImage.src)} sizes="(min-width: 1050px) 245px, (min-width: 600px) 25vw, 38vw" /></div>
      </div>
    </section>
  );
}

export async function ServicesSection({ items = starterServices }: { items?: ServiceDetail[] }) {
  const { home: { services } } = await getSiteSettings();
  return (
    <section id="services" className="services-section container" aria-labelledby="services-title">
      <div className="services-heading">
        <span className="section-spark services-spark-start" aria-hidden="true"><Icon name="sparkle" /></span>
        <h2 id="services-title">{services.title.map(line => <span key={line}>{line}</span>)}</h2>
        <p>{services.description}</p>
        <span className="section-spark services-spark-end" aria-hidden="true"><Icon name="sparkle" /></span>
      </div>
      <div className="services-grid">
        {items.map(service => (
          <article key={service.slug} className={`offering-card offering-${service.theme}`}>
            <h3>{service.title}</h3>
            <ServiceArt type={service.slug} />
            <p>{service.intro}</p>
            <a href={sitePath(`/services/${service.slug}/`)} aria-label={`جزئیات ${service.title}`}>بیشتر دربارهٔ این خدمت<Icon name="arrow" /></a>
          </article>
        ))}
      </div>
      {items.length === 0 && <p className="demo-notice">برای انتخاب خدمات متناسب با نیاز برندت با ما گفتگو کن.</p>}
      <a className="pill-button services-action" href={sitePath("/services/")}>{services.actionLabel}<span className="button-circle"><Icon name="arrow" /></span></a>
    </section>
  );
}
