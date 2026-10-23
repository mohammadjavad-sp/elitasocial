import type { Metadata } from "next";
import Image from "next/image";
import { Header } from "@/components/header";
import { Icon } from "@/components/icons";
import { MagazineGallery } from "@/components/magazine-gallery";
import { SiteFooter } from "@/components/site-footer";
import { articleCategories, getArticleCategory } from "@/content/articles";
import { getNavigation } from "@/content/home";
import { sitePath } from "@/lib/site-path";
import { getCmsContent } from "@/server/content";
import { getSiteSettings } from "@/server/settings";

export async function generateMetadata(): Promise<Metadata> {
  const { home: { brand } } = await getSiteSettings();
  return {
    title: `مجلهٔ ${brand.name} | راهنمای محتوا، طراحی سایت و حضور دیجیتال`,
    description: "یادداشت‌های کاربردی الیتا دربارهٔ مدیریت اینستاگرام، طراحی وب‌سایت، تولید محتوا و سئو. موضوع دلخواهت را پیدا کن و قدم بعدی برندت را روشن‌تر بردار.",
  };
}

export default async function MagazinePage() {
  const { articles } = await getCmsContent();
  const featured = articles.find(article => article.featured) ?? articles[0];
  const category = featured ? getArticleCategory(featured.category) : undefined;
  return (
    <div className="home-shell magazine-shell">
      <a className="skip-link" href="#main-content">رفتن به محتوای اصلی</a>
      <Header activePage="blog" navigation={getNavigation("blog")} />
      <main id="main-content">
        <section className="magazine-intro container" aria-labelledby="magazine-title">
          <nav className="magazine-breadcrumb" aria-label="مسیر صفحه"><a href={sitePath("/")}>خانه</a><span aria-hidden="true">/</span><span aria-current="page">مجلهٔ الیتا</span></nav>
          <div className="magazine-page-heading"><div><h1 id="magazine-title">مجلهٔ الیتا؛<br />از ایده تا اجرای بهتر</h1><p>برای سؤال‌های روزمرهٔ یک برند: چه محتوایی بسازم، سایتم به چه چیزی نیاز دارد و از کجا شروع کنم؟ اینجا قدم به قدم درباره‌شان می‌خوانیم.</p></div><a className="service-text-link" href="#magazine-library">پیدا کردن موضوع دلخواهم<Icon name="arrow" /></a></div>
          {articles.some(article => article.isMock) && <p className="magazine-demo-notice"><Icon name="sparkle" /><span>مقاله‌های دارای نشان نمونه، محتوای نمایشی مجله‌اند و پیش از انتشار رسمی بازبینی و تکمیل می‌شوند.</span></p>}
        </section>

        {featured && <section className="magazine-featured container" aria-labelledby="magazine-featured-title">
          <a className="magazine-featured-image" href={sitePath(`/blog/${featured.slug}/`)} aria-label={`خواندن ${featured.title}`}><Image src={sitePath(featured.image.src)} alt={featured.image.alt} fill priority sizes="(min-width: 800px) 50vw, 90vw" /></a>
          <div className="magazine-featured-copy"><span className="eyebrow">پیشنهاد برای شروع مطالعه</span><p className="article-card-meta"><a href={sitePath(`/blog/category/${featured.category}/`)}>{category?.label}</a><span>{featured.readingMinutes.toLocaleString("fa-IR")} دقیقه مطالعه</span></p><h2 id="magazine-featured-title"><a href={sitePath(`/blog/${featured.slug}/`)}>{featured.title}</a></h2><p>{featured.excerpt}</p><a className="pill-button" href={sitePath(`/blog/${featured.slug}/`)}>خواندن مقاله<span className="button-circle"><Icon name="arrow" /></span></a></div>
        </section>}

        <nav className="magazine-category-links container" aria-label="موضوع‌های مجله">
          {articleCategories.map(item => <a className="magazine-category-link" href={sitePath(`/blog/category/${item.slug}/`)} key={item.id}><strong>{item.label}</strong><span>{item.description}</span><Icon name="arrow" /></a>)}
        </nav>

        <section className="magazine-library container" id="magazine-library" aria-labelledby="magazine-library-title"><div className="section-heading"><h2 id="magazine-library-title">از کدام موضوع شروع کنیم؟</h2><p>موضوع یا سؤال موردنظرت را جست‌وجو کن؛ یا یادداشت‌های هر دسته را ببین.</p></div><MagazineGallery articles={articles} /></section>
      </main>
      <SiteFooter />
    </div>
  );
}
