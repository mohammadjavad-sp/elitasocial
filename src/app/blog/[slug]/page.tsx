import type { Metadata } from "next";
import Image from "@/components/site-image";
import { notFound } from "next/navigation";
import { ArticleActions } from "@/components/article-actions";
import { ArticleCard } from "@/components/article-card";
import { Header } from "@/components/header";
import { Icon } from "@/components/icons";
import { SiteFooter } from "@/components/site-footer";
import { articles as starterArticles, getArticle, getArticleCategory, getRelatedArticles } from "@/content/articles";
import { getNavigation } from "@/content/home";
import { serviceContactHref } from "@/lib/service-selection";
import { sitePath } from "@/lib/site-path";
import { getCmsContent } from "@/server/content";
import { getSiteSettings } from "@/server/settings";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return process.env.DEPLOY_TARGET === "github-pages" ? starterArticles.map(({ slug }) => ({ slug })) : [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [{ articles }, { home: { brand } }] = await Promise.all([getCmsContent(), getSiteSettings()]);
  const article = getArticle(slug, articles);
  if (!article) return { title: `مقاله پیدا نشد | ${brand.name}` };
  return {
    title: `${article.title} | مجلهٔ ${brand.name}`,
    description: article.excerpt,
    openGraph: { type: "article", title: article.title, description: article.excerpt, locale: "fa_IR", siteName: brand.name },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const { articles } = await getCmsContent();
  const article = getArticle(slug, articles);
  if (!article) notFound();
  const category = getArticleCategory(article.category);
  if (!category) notFound();
  const related = getRelatedArticles(article, 3, articles);
  const articleIndex = articles.findIndex((item) => item.slug === article.slug);
  const previous = articles[articleIndex - 1];
  const next = articles[articleIndex + 1];
  const readingMinutes = new Intl.NumberFormat("fa-IR").format(article.readingMinutes);
  const tableOfContents = article.sections.map((section) => <li key={section.id}><a href={`#${section.id}`}>{section.heading}</a></li>);

  return (
    <div className="home-shell article-shell">
      <a className="skip-link" href="#main-content">رفتن به محتوای مقاله</a>
      <Header activePage="blog" navigation={getNavigation("blog")} />
      <main id="main-content">
        <article aria-labelledby="article-title">
          <header className="article-hero container">
            <nav className="article-breadcrumb" aria-label="مسیر صفحه">
              <a href={sitePath("/")}>خانه</a><span aria-hidden="true">/</span>
              <a href={sitePath("/blog/")}>مجلهٔ الیتا</a><span aria-hidden="true">/</span>
              <a href={sitePath(`/blog/category/${category.slug}/`)}>{category.label}</a><span aria-hidden="true">/</span>
              <span aria-current="page">{article.title}</span>
            </nav>
            <div className="article-heading-wrap">
              <a className="article-category-label" href={sitePath(`/blog/category/${category.slug}/`)}>{category.label}</a>
              <h1 id="article-title">{article.title}</h1>
              <p className="article-intro">{article.excerpt}</p>
              <div className="article-byline"><span>{article.author}</span><span>{readingMinutes} دقیقه مطالعه</span></div>
            </div>
            <figure className="article-cover"><Image src={sitePath(article.image.src)} alt={article.image.alt} fill sizes="(min-width: 1400px) 1240px, 90vw" preload /></figure>
          </header>

          <div className="article-reading-layout container">
            <aside className="article-sidebar">
              <nav className="article-toc-desktop" aria-label="فهرست این مقاله"><h2>در این مقاله می‌خوانی</h2><ol>{tableOfContents}</ol><a className="article-back-to-magazine" href={sitePath("/blog/")}>بازگشت به مجله<Icon name="arrow" /></a></nav>
              <details className="article-toc-mobile"><summary>فهرست این مقاله<span aria-hidden="true">+</span></summary><nav aria-label="فهرست این مقاله"><ol>{tableOfContents}</ol></nav></details>
            </aside>
            <div className="article-reading-column">
              <div className="article-prose">
                {article.sections.map((section) => <section id={section.id} key={section.id} aria-labelledby={`${section.id}-heading`}>
                  <h2 id={`${section.id}-heading`}>{section.heading}</h2>
                  {section.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
                  {section.bullets && section.bullets.length > 0 && <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}
                </section>)}
                <aside className="article-takeaway" aria-labelledby="article-takeaway-title"><Icon name="sparkle" /><div><h2 id="article-takeaway-title">یک قدم برای شروع</h2><p>{article.takeaway}</p></div></aside>
              </div>
              <nav className="article-tags" aria-label="موضوعات مقاله">{article.tags.map((tag) => <a key={tag} href={sitePath(`/blog/?q=${encodeURIComponent(tag)}#magazine-library`)}>{tag}</a>)}</nav>
              <div className="article-author"><span className="article-author-mark" aria-hidden="true"><Icon name="sparkle" /></span><div><h2>{article.author}</h2><p>یادداشت‌هایی دربارهٔ محتوا، طراحی و حضور دیجیتال برندها در مجلهٔ الیتا.</p></div></div>
              <ArticleActions title={article.title} />
              <section className="article-consultation" aria-labelledby="article-consultation-title"><h2 id="article-consultation-title">این موضوع به کسب‌و‌کارت مربوط است؟</h2><p>دربارهٔ نیاز برندت بنویس تا قدم بعدی را با هم مشخص کنیم.</p><a className="pill-button" href={serviceContactHref(article.category)}>گفتگو دربارهٔ برندت<span className="button-circle"><Icon name="arrow" /></span></a></section>
            </div>
          </div>

          <nav className="article-neighbors container" aria-label="مقاله‌های قبل و بعد">
            {previous ? <a href={sitePath(`/blog/${previous.slug}/`)}><span>مقالهٔ قبلی</span><strong>{previous.title}</strong><Icon name="arrow" /></a> : <a href={sitePath("/blog/")}><span>برای مطالعهٔ بیشتر</span><strong>همهٔ مقاله‌های مجله</strong><Icon name="arrow" /></a>}
            {next ? <a href={sitePath(`/blog/${next.slug}/`)}><span>مقالهٔ بعدی</span><strong>{next.title}</strong><Icon name="arrow" /></a> : <a href={sitePath("/blog/")}><span>برای مطالعهٔ بیشتر</span><strong>همهٔ مقاله‌های مجله</strong><Icon name="arrow" /></a>}
          </nav>
        </article>
        <section className="article-related container" aria-labelledby="article-related-title"><div className="article-related-heading"><h2 id="article-related-title">برای ادامهٔ مطالعه</h2><a href={sitePath("/blog/")}>همهٔ مقاله‌ها<Icon name="arrow" /></a></div><div className="article-related-grid">{related.map((item) => <ArticleCard key={item.slug} article={item} />)}</div></section>
      </main>
      <SiteFooter />
    </div>
  );
}
