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
        <section className="editorial-hero magazine-editorial-hero container" aria-labelledby="magazine-title">
          <nav className="magazine-breadcrumb" aria-label="مسیر صفحه"><a href={sitePath("/")}>خانه</a><span aria-hidden="true">/</span><span aria-current="page">مجلهٔ الیتا</span></nav>
          <div className="editorial-hero-grid">
            <div className="editorial-hero-copy">
              <p className="editorial-hero-kicker"><span aria-hidden="true" />مجلهٔ الیتا</p>
              <h1 id="magazine-title">یک ایدهٔ تازه،<br />یک قدم رو به جلو</h1>
              <p className="editorial-hero-description">برای سؤال‌های هر روزِ برندت؛ چه محتوایی بسازم، سایتم چه چیزی کم دارد و از کجا شروع کنم؟ اینجا با هم می‌خوانیم و مسیر روشن‌تری پیدا می‌کنیم.</p>
              <div className="editorial-hero-actions"><a className="pill-button" href="#magazine-library">گشت‌وگذار در مجله<span className="button-circle"><Icon name="arrow" /></span></a>{featured && <a className="editorial-hero-text-link" href="#magazine-featured">از این مقاله شروع کن<Icon name="arrow" /></a>}</div>
              <p className="editorial-hero-disciplines">محتوا و اینستاگرام<span aria-hidden="true">/</span>طراحی سایت<span aria-hidden="true">/</span>سئو</p>
            </div>
            <div className="editorial-hero-visual magazine-hero-visual">
              <div className="editorial-photo-backdrop" aria-hidden="true" />
              <div className="editorial-hero-photo magazine-hero-photo"><Image src={sitePath("/images/magazine-hero.webp")} alt="فضای روشن مطالعه و ایده‌پردازی با لپ‌تاپ، دفتر یادداشت و مجله‌های طراحی" width={1500} height={1100} priority sizes="(min-width: 1000px) 46vw, (min-width: 700px) 72vw, 90vw" /></div>
              <div className="magazine-hero-note" aria-hidden="true"><span className="magazine-note-fold" /><Icon name="sparkle" /><span>سؤال امروزِ برندت</span><strong>چطور بهتر<br />دیده شویم؟</strong><span className="magazine-note-rule" /></div>
              <span className="magazine-hero-bookmark" aria-hidden="true"><Icon name="sparkle" /></span>
              <p className="editorial-photo-caption"><span />کمی مطالعه، کلی ایده برای شروع</p>
            </div>
          </div>
        </section>

        {articles.some(article => article.isMock) && <div className="container"><p className="magazine-demo-notice"><Icon name="sparkle" /><span>مقاله‌های دارای نشان نمونه، محتوای نمایشی مجله‌اند و پیش از انتشار رسمی بازبینی و تکمیل می‌شوند.</span></p></div>}

        {featured && <section className="magazine-featured container" id="magazine-featured" aria-labelledby="magazine-featured-title">
          <a className="magazine-featured-image" href={sitePath(`/blog/${featured.slug}/`)} aria-label={`خواندن ${featured.title}`}><Image src={sitePath(featured.image.src)} alt={featured.image.alt} fill sizes="(min-width: 800px) 50vw, 90vw" /></a>
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
