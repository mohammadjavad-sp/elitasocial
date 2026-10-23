import Image from "next/image";
import { getArticleCategory, type Article } from "@/content/articles";
import { sitePath } from "@/lib/site-path";
import { Icon } from "./icons";

export function ArticleCard({ article }: { article: Article }) {
  const category = getArticleCategory(article.category);
  const href = sitePath(`/blog/${article.slug}/`);

  if (!category) return null;

  return (
    <article className="article-card">
      <a className="article-card-image" href={href} tabIndex={-1} aria-hidden="true">
        <Image src={sitePath(article.image.src)} alt="" fill sizes="(max-width: 699px) 100vw, (max-width: 1049px) 50vw, 33vw" />
        <span className="article-sample-badge">مقالهٔ نمونه</span>
      </a>
      <div className="article-card-copy">
        <div className="article-card-meta"><a href={sitePath(`/blog/category/${category.id}/`)}>{category.label}</a><span>{article.readingMinutes.toLocaleString("fa-IR")} دقیقه مطالعه</span></div>
        <h3><a href={href}>{article.title}</a></h3>
        <p>{article.excerpt}</p>
        <a className="article-card-read" href={href} aria-label={`مطالعهٔ ${article.title}`}>مطالعهٔ مقاله<Icon name="arrow" /></a>
      </div>
    </article>
  );
}
