import Image from "next/image";
import { homeContent } from "@/content/home";
import { Icon } from "./icons";

export function Hero() {
  const { hero, contact } = homeContent;
  return (
    <section className="hero container" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="eyebrow"><Icon name="sparkle" />{hero.eyebrow}</p>
        <h1 id="hero-title">{hero.title.map(line => <span key={line}>{line}</span>)}</h1>
        <p className="hero-description">{hero.description}</p>
        <div className="hero-actions">
          <a className="pill-button primary-button" href={contact.whatsapp} target="_blank" rel="noopener noreferrer">
            {hero.primaryLabel}<span className="button-circle"><Icon name="arrow" /></span>
          </a>
          <a className="pill-button secondary-button" href={contact.instagram} target="_blank" rel="noopener noreferrer" aria-label="دیدن نمونه‌کارها در اینستاگرام (پنجره جدید)">
            {hero.secondaryLabel}<span className="button-circle"><Icon name="arrow" /></span>
          </a>
        </div>
        <div className="hero-socials">
          <span className="social-label">اینجا هم در ارتباطیم</span><span className="social-divider" aria-hidden="true" />
          <a href={contact.instagram} target="_blank" rel="noopener noreferrer" aria-label="اینستاگرام الیتا سوشال (پنجره جدید)"><Icon name="instagram" /></a>
          <a href={contact.telegram} target="_blank" rel="noopener noreferrer" aria-label="تلگرام الیتا سوشال (پنجره جدید)"><Icon name="telegram" /></a>
          <a href={contact.phone} aria-label={`تماس با الیتا سوشال، ${contact.phoneLabel}`}><Icon name="phone" /></a>
        </div>
      </div>
      <div className="hero-visual">
        <div className="portrait-halo" aria-hidden="true"><div /><div /><div /></div>
        <div className="portrait-frame">
          <Image className="hero-portrait" src={hero.portrait.src} alt={hero.portrait.alt}
            width={hero.portrait.width} height={hero.portrait.height} sizes="(max-width: 599px) 80vw, (max-width: 1049px) 420px, 480px" preload />
        </div>
        <div className="service-card instagram-card">
          <span className="service-icon"><Icon name="instagram" /></span>
          <span><strong>{hero.services[0].title}</strong><small>{hero.services[0].caption}</small></span>
          <span className="card-spark" aria-hidden="true"><Icon name="sparkle" /></span>
        </div>
        <div className="service-card website-card">
          <span className="mini-browser" aria-hidden="true"><span className="browser-dots"><i /><i /><i /></span><span className="browser-content"><i /><i /><i /><i /></span></span>
          <span><strong>{hero.services[1].title}</strong><small>{hero.services[1].caption}</small></span>
        </div>
        <span className="floating-mark megaphone" aria-hidden="true"><svg viewBox="0 0 64 64" fill="none"><path d="m15 27 30-13v35L15 36v-9Z" fill="currentColor" /><path d="m18 38 4 14h9l-6-12" fill="currentColor" /><path d="M45 20c12 0 12 24 0 24M10 18l-6-4M11 27H3M14 9l-2-6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /><path d="m42 21-22 9 22 9V21Z" fill="#e5dcff" /></svg></span>
        <svg className="sketch-arrow" viewBox="0 0 150 90" fill="none" aria-hidden="true"><path d="M145 70C94 81 77 13 18 20M18 20l17-13M18 20l18 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><path d="M135 76C93 82 74 33 43 28" stroke="currentColor" strokeWidth=".7" /></svg>
        <span className="little-star" aria-hidden="true"><Icon name="sparkle" /></span>
        <span className="visual-dot" aria-hidden="true" />
        <span className="portrait-caption">الهه طاهری<span>همراهِ مسیر دیجیتال برند شما</span></span>
      </div>
    </section>
  );
}
