import Image from "next/image";
import { getSiteSettings } from "@/server/settings";
import { Icon } from "./icons";
import { sitePath } from "@/lib/site-path";
import { ContactChannels } from "./contact-channels";

export async function Hero() {
  const { home: { hero, contact, brand } } = await getSiteSettings();
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
          <a className="pill-button secondary-button" href={sitePath("/portfolio/")}>
            {hero.secondaryLabel}<span className="button-circle"><Icon name="arrow" /></span>
          </a>
        </div>
        <div className="hero-contact-options">
          <p className="social-label" id="hero-contact-label">اینجا هم در ارتباطیم</p>
          <ContactChannels contact={contact} includeWhatsapp={false} className="hero-contact-channels" label="راه‌های دیگر ارتباط" />
        </div>
      </div>
      <div className="hero-visual">
        <div className="portrait-halo" aria-hidden="true"><div /><div /><div /></div>
        <div className="portrait-frame">
          <Image className="hero-portrait" src={sitePath(hero.portrait.src)} alt={hero.portrait.alt}
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
        <span className="hero-ribbon-mark" aria-hidden="true">
          <svg viewBox="0 0 120 120" fill="none" focusable="false">
            <defs>
              <linearGradient id="hero-ribbon-body" x1="29" y1="13" x2="86" y2="97" gradientUnits="userSpaceOnUse">
                <stop stopColor="var(--color-tertiary)" /><stop offset=".28" stopColor="var(--color-secondary)" /><stop offset=".64" stopColor="var(--color-primary)" /><stop offset="1" stopColor="var(--primary-hover)" />
              </linearGradient>
              <linearGradient id="hero-ribbon-orbit" x1="11" y1="45" x2="107" y2="82" gradientUnits="userSpaceOnUse">
                <stop stopColor="var(--color-tertiary)" /><stop offset=".4" stopColor="var(--color-secondary)" /><stop offset="1" stopColor="var(--color-primary)" />
              </linearGradient>
              <linearGradient id="hero-ribbon-face" x1="25" y1="73" x2="100" y2="59" gradientUnits="userSpaceOnUse">
                <stop stopColor="var(--color-quaternary)" /><stop offset=".48" stopColor="var(--color-secondary)" /><stop offset="1" stopColor="var(--color-primary)" />
              </linearGradient>
              <linearGradient id="hero-ribbon-blush" x1="88" y1="23" x2="105" y2="39" gradientUnits="userSpaceOnUse">
                <stop stopColor="var(--color-quaternary)" /><stop offset=".48" stopColor="var(--color-tertiary)" /><stop offset="1" stopColor="var(--color-secondary)" />
              </linearGradient>
            </defs>
            <path d="M26 80C9 79 5 68 12 56C24 35 68 24 93 36C107 43 109 56 98 67" stroke="url(#hero-ribbon-orbit)" strokeWidth="14" />
            <path fillRule="evenodd" clipRule="evenodd" d="M33 13C12 22 14 49 28 73C41 96 64 107 82 97C101 87 101 61 86 37C71 14 51 5 33 13ZM43 32C52 28 65 38 74 53C82 67 84 79 76 83C67 88 53 77 44 62C35 47 34 36 43 32Z" fill="url(#hero-ribbon-body)" />
            <path d="M33 19C19 27 23 49 33 66" stroke="var(--color-quaternary)" strokeOpacity=".74" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M47 34C55 32 66 42 73 54C80 66 82 77 77 82" stroke="var(--color-primary)" strokeOpacity=".42" strokeWidth="3" strokeLinecap="round" />
            <path d="M14 69C23 86 64 82 91 68C103 62 109 52 104 44" stroke="var(--color-primary)" strokeWidth="14" strokeLinecap="round" />
            <path d="M14 65C23 82 64 78 91 64C103 58 109 48 104 40" stroke="url(#hero-ribbon-face)" strokeWidth="14" strokeLinecap="round" />
            <path d="M24 72C39 77 68 70 86 62" stroke="var(--color-tertiary)" strokeOpacity=".76" strokeWidth="2" strokeLinecap="round" />
            <path d="M92 22C97 25 102 29 105 34C108 39 104 43 100 40C95 37 90 33 87 28C84 23 88 19 92 22Z" fill="url(#hero-ribbon-blush)" />
            <path d="m89 24 8 7" stroke="var(--color-quaternary)" strokeOpacity=".8" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </span>
        <svg className="sketch-arrow" viewBox="0 0 150 90" fill="none" aria-hidden="true"><path d="M145 70C94 81 77 13 18 20M18 20l17-13M18 20l18 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><path d="M135 76C93 82 74 33 43 28" stroke="currentColor" strokeWidth=".7" /></svg>
        <span className="little-star" aria-hidden="true"><Icon name="sparkle" /></span>
        <span className="visual-dot" aria-hidden="true" />
        <span className="portrait-caption">{brand.owner}<span>همراهِ مسیر دیجیتال برند شما</span></span>
      </div>
    </section>
  );
}
