import { homeContent } from "@/content/home";
import { sitePath } from "@/lib/site-path";
import { Icon } from "./icons";

export function SiteFooter() {
  const { contact } = homeContent;
  return (
    <footer className="site-footer">
      <div className="footer-cta-band"><div className="container"><h2>حالا نوبت برند توئه</h2><p>برای یک حضور منسجم‌تر، از یک گفتگوی ساده شروع کنیم.</p><a className="pill-button" href={contact.whatsapp} target="_blank" rel="noopener noreferrer">بیا دربارهٔ برندت حرف بزنیم<span className="button-circle"><Icon name="arrow" /></span></a></div></div>
      <div className="footer-main container">
        <div className="footer-brand-column"><a className="brand" href={sitePath("/")} aria-label="الیتا سوشال، خانه"><span className="brand-symbol"><Icon name="sparkle" /></span><span className="brand-words"><span className="brand-persian">الیتا سوشال</span><span className="brand-latin" lang="en" dir="ltr">ELITA SOCIAL</span></span></a><p>از اینستاگرام تا وب‌سایت؛<br />محتوا، طراحی و همراهی برای برند تو.</p><div className="footer-socials"><a href={contact.instagram} target="_blank" rel="noopener noreferrer" aria-label="اینستاگرام الیتا سوشال"><Icon name="instagram" /></a><a href={contact.telegram} target="_blank" rel="noopener noreferrer" aria-label="تلگرام الیتا سوشال"><Icon name="telegram" /></a><a href={contact.phone} aria-label="تماس با الیتا سوشال"><Icon name="phone" /></a></div></div>
        <nav className="footer-links" aria-label="صفحه‌های سایت"><h3>در الیتا</h3><a href={sitePath("/")}>خانه</a><a href={sitePath("/#about")}>دربارهٔ الیتا</a><a href={sitePath("/portfolio/")}>نمونه‌کارها</a><a href={sitePath("/#pricing")}>پلن‌ها و قیمت‌ها</a></nav>
        <nav className="footer-links" aria-label="خدمات و راهنما"><h3>برای برند تو</h3><a href={sitePath("/#services")}>خدمات الیتا</a><a href={sitePath("/#insights")}>مجلهٔ الیتا</a><a href={sitePath("/#faq-title")}>پرسش‌های متداول</a><a href={sitePath("/#contact")}>شروع همکاری</a></nav>
        <div className="footer-contact"><h3>یک گفتگو تا شروع</h3><p>کسب‌وکارت را معرفی کن؛<br />دربارهٔ قدم بعدی حرف می‌زنیم.</p><a href={contact.phone} dir="ltr">{contact.phoneLabel}</a><a href={contact.whatsapp} target="_blank" rel="noopener noreferrer">گفتگو در واتساپ<Icon name="arrow" /></a></div>
      </div>
      <div className="footer-bottom container"><span>الیتا سوشال؛ الهه طاهری</span><span>محتوای نمونهٔ سایت در حال تکمیل است.</span><a href="#main-content">بازگشت به ابتدای صفحه</a></div>
    </footer>
  );
}
