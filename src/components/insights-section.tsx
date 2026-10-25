import { articles as starterArticles, type Article } from "@/content/articles";
import { sitePath } from "@/lib/site-path";
import { ArticleCard } from "./article-card";
import { Icon } from "./icons";
import { getSiteSettings } from "@/server/settings";

export async function InsightsSection({ articles = starterArticles }: { articles?: Article[] }) {
  const { sections } = await getSiteSettings();
  return (
    <section className="insights-section container" id="insights" aria-labelledby="insights-title">
      <div className="section-heading">
        <h2 id="insights-title">{sections.insightsTitle.map((line, index) => <span key={index} data-reveal="line" data-reveal-order={index}>{line}</span>)}</h2>
        <p>{sections.insightsDescription}</p>
        <span className="section-spark insights-spark" aria-hidden="true"><Icon name="sparkle" /></span>
      </div>
      <div className="insights-grid" data-reveal="rise">{articles.slice(0, 3).map(article => <ArticleCard article={article} key={article.slug} />)}</div>
      {articles.length === 0 && <p className="demo-notice">مقاله‌های تازه به‌زودی در مجله منتشر می‌شوند.</p>}
      <a className="pill-button services-action" href={sitePath("/blog/")}>{sections.insightsActionLabel}<span className="button-circle"><Icon name="arrow" /></span></a>
    </section>
  );
}
