import { portfolioInstagramAccount, portfolioInstagramUrl } from "@/lib/portfolio-destination";
import { Icon } from "./icons";

const topics = [
  { icon: "instagram", title: "ادمینی اینستاگرام", detail: "مدیریت پیج و هویت بصری" },
  { icon: "website", title: "طراحی سایت", detail: "از ویترین برند تا فروشگاه" },
  { icon: "sparkle", title: "سئو", detail: "ساختار و محتوای وب‌سایت" },
  { icon: "menu", title: "تولید محتوا", detail: "ایده، سناریو و محتوای بصری" },
] as const;

type Props = { title: string; description: string; actionLabel: string };

export function PortfolioInvitation({ title, description, actionLabel }: Props) {
  return <section className="portfolio-social-section container" id="portfolio" aria-labelledby="portfolio-social-title">
    <div className="portfolio-social-panel">
      <div className="portfolio-social-copy">
        <p className="portfolio-social-intro"><span aria-hidden="true" />از نزدیک با کارهای الیتا آشنا شو</p>
        <h2 id="portfolio-social-title">{title}</h2>
        <p className="portfolio-social-description">{description}</p>
        <a className="pill-button portfolio-social-action" href={portfolioInstagramUrl} target="_blank" rel="noopener noreferrer" aria-label={`${actionLabel}، پیج ${portfolioInstagramAccount} (پنجرهٔ جدید)`}>
          <span>{actionLabel}</span><span className="button-circle"><Icon name="arrow" /></span>
        </a>
        <p className="portfolio-social-account">همهٔ نمونه‌ها در یک جا <span aria-hidden="true">/</span> <bdi>@{portfolioInstagramAccount}</bdi></p>
      </div>
      <div className="portfolio-social-profile">
        <span className="portfolio-social-watermark" aria-hidden="true"><Icon name="instagram" /></span>
        <div className="portfolio-social-profile-heading">
          <span className="portfolio-social-avatar" aria-hidden="true"><Icon name="instagram" /></span>
          <div><span className="portfolio-social-profile-name" dir="ltr">{portfolioInstagramAccount}</span><p>الیتا سوشیال در اینستاگرام</p></div>
        </div>
        <ul className="portfolio-social-topics" aria-label="حوزه‌های نمونه‌کار در پیج الیتا">
          {topics.map(topic => <li key={topic.icon}><span className="portfolio-social-topic-icon" aria-hidden="true"><Icon name={topic.icon} /></span><div><h3>{topic.title}</h3><p>{topic.detail}</p></div></li>)}
        </ul>
        <p className="portfolio-social-profile-note"><Icon name="sparkle" />از ایده‌های اولیه تا اجرای کارها</p>
      </div>
    </div>
  </section>;
}
