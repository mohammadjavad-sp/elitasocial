import { PortfolioGallery } from "./portfolio-gallery";
import { Icon } from "./icons";
import { sitePath } from "@/lib/site-path";

export function FeaturedPortfolioSection() {
  return <section className="featured-portfolio container" id="portfolio" aria-labelledby="featured-portfolio-heading">
    <div className="portfolio-section-heading"><div><h2 id="featured-portfolio-heading">هر برند، یک دنیای دیدنی</h2><p>از ویترین یک فروشگاه تا قصهٔ یک پیج؛ چند ایده برای آنچه می‌توانیم با هم بسازیم.</p></div><a className="portfolio-all-link" href={sitePath("/portfolio/")}>همهٔ نمونه‌ها <Icon name="arrow" /></a></div>
    <p className="portfolio-demo-notice"><Icon name="sparkle" /><span>این طرح‌ها نمایشی‌اند؛ نمونه‌کارهای واقعی پس از تکمیل اینجا قرار می‌گیرند.</span></p>
    <PortfolioGallery featured />
  </section>;
}
