import { articles as starterArticles, type Article } from "@/content/articles";
import { sitePath } from "@/lib/site-path";
import { ArticleCard } from "./article-card";
import { Icon } from "./icons";

export function InsightsSection({ articles = starterArticles }: { articles?: Article[] }) {
  return (
    <section className="insights-section container" id="insights" aria-labelledby="insights-title">
      <div className="section-heading">
        <h2 id="insights-title"><span>چند دقیقه برای</span><span>حضور بهترِ برندت</span></h2>
        <p>یادداشت‌های کاربردی دربارهٔ محتوا، طراحی و ارتباط با مخاطب.{articles.some(article => article.isMock) && " مقاله‌های دارای نشان نمونه، محتوای نمایشی مجله‌اند."}</p>
        <span className="section-spark insights-spark" aria-hidden="true"><Icon name="sparkle" /></span>
      </div>
      <div className="insights-grid">{articles.slice(0, 3).map(article => <ArticleCard article={article} key={article.slug} />)}</div>
      {articles.length === 0 && <p className="demo-notice">مقاله‌های تازه به‌زودی در مجله منتشر می‌شوند.</p>}
      <a className="pill-button services-action" href={sitePath("/blog/")}>همهٔ مقاله‌های مجله<span className="button-circle"><Icon name="arrow" /></span></a>
    </section>
  );
}
