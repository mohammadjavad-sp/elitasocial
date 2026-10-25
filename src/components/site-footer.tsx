import { getSiteSettings } from "@/server/settings";
import { sitePath } from "@/lib/site-path";
import { Icon } from "./icons";
import { AmbientShapes } from "./ambient-shapes";
import { BrandLogo } from "./brand-logo";
import { MotionEnhancements } from "./motion-enhancements";
import { ContactChannels } from "./contact-channels";

export async function SiteFooter() {
  const { home: { contact, brand }, footer } = await getSiteSettings();
  return (
    <>
    <AmbientShapes />
    <footer className="site-footer">
      <div className="footer-cta-band"><div className="container"><h2>{footer.ctaTitle}</h2><p>{footer.ctaDescription}</p><div className="contact-actions footer-contact-actions"><a className="pill-button" href={contact.whatsapp} target="_blank" rel="noopener noreferrer">{footer.ctaLabel}<span className="button-circle"><Icon name="arrow" /></span></a><ContactChannels contact={contact} includeWhatsapp={false} tone="light" label="راه‌های دیگر شروع گفتگو" /></div></div></div>
      <div className="footer-main container">
        <div className="footer-brand-column"><a className="brand" href={sitePath("/")} aria-label={`${brand.name}، خانه`}><BrandLogo name={brand.name} /><span className="sr-only">{brand.latinName}</span></a><p>{footer.description}</p><ContactChannels contact={contact} compact className="footer-contact-channels" /></div>
        <nav className="footer-links" aria-label="صفحه‌های سایت"><h3>در الیتا</h3><a href={sitePath("/")}>خانه</a><a href={sitePath("/#about")}>دربارهٔ الیتا</a><a href={sitePath("/portfolio/")}>نمونه‌کارها</a><a href={sitePath("/pricing/")}>پلن‌ها و قیمت‌ها</a></nav>
        <nav className="footer-links" aria-label="خدمات و راهنما"><h3>برای برند تو</h3><a href={sitePath("/services/")}>خدمات الیتا</a><a href={sitePath("/blog/")}>مجلهٔ الیتا</a><a href={sitePath("/#faq-title")}>پرسش‌های متداول</a><a href={sitePath("/#contact")}>شروع همکاری</a></nav>
        <div className="footer-contact"><h3>{footer.contactTitle}</h3><p>{footer.contactDescription}</p><a href={contact.phone} dir="ltr">{contact.phoneLabel}</a><a href={sitePath("/#contact")}>همهٔ راه‌های ارتباط<Icon name="arrow" /></a></div>
      </div>
      <div className="footer-bottom container"><span>{brand.name}؛ {brand.owner}</span><span>{footer.bottomNote}</span><a href="#main-content">بازگشت به ابتدای صفحه</a></div>
    </footer>
    <MotionEnhancements />
    </>
  );
}
