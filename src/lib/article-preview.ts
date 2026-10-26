import type { Article } from "@/content/articles";

export type ArticlePreview = Pick<Article, "slug" | "title" | "excerpt" | "category" | "image" | "readingMinutes" | "tags">;

/** Keep full article bodies on the server; the searchable library needs summaries only. */
export function toArticlePreview(article: Article): ArticlePreview {
  const { slug, title, excerpt, category, image, readingMinutes, tags } = article;
  return { slug, title, excerpt, category, image, readingMinutes, tags };
}
