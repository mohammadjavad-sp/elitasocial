import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { Icon } from "@/components/icons";
import { MagazineGallery } from "@/components/magazine-gallery";
import { SiteFooter } from "@/components/site-footer";
import { articleCategories, getArticleCategory } from "@/content/articles";
import { getNavigation } from "@/content/home";
import { sitePath } from "@/lib/site-path";
import { getCmsContent } from "@/server/content";
import { getSiteSettings } from "@/server/settings";

type PageProps = { params: Promise<{ category: string }> };

export function generateStaticParams() { return process.env.DEPLOY_TARGET === "github-pages" ? articleCategories.map(item => ({ category: item.slug })) : []; }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const { home: { brand } } = await getSiteSettings();
  const category = getArticleCategory(slug);
  return category ? { title: `${category.label} | مجلهٔ ${brand.name}`, description: category.description } : { title: `موضوع پیدا نشد | مجلهٔ ${brand.name}` };
}

export default async function MagazineCategoryPage({ params }: PageProps) {
  const { articles } = await getCmsContent();
  const { category: slug } = await params;
  const category = getArticleCategory(slug);
  if (!category) notFound();
  return (
    <div className="home-shell magazine-shell">
      <a className="skip-link" href="#main-content">رفتن به محتوای اصلی</a>
      <Header activePage="blog" navigation={getNavigation("blog")} />
      <main id="main-content">
        <section className="magazine-intro container" aria-labelledby="magazine-category-title">
          <nav className="magazine-breadcrumb" aria-label="مسیر صفحه"><a href={sitePath("/")}>خانه</a><span aria-hidden="true">/</span><a href={sitePath("/blog/")}>مجلهٔ الیتا</a><span aria-hidden="true">/</span><span aria-current="page">{category.label}</span></nav>
          <div className="magazine-page-heading"><div><h1 id="magazine-category-title">{category.label}</h1><p>{category.description} یادداشت‌های این موضوع را اینجا پیدا کن.</p></div><a className="service-text-link" href={sitePath("/blog/")}>همهٔ مقاله‌ها<Icon name="arrow" /></a></div>
        </section>
        <nav className="magazine-category-links container" aria-label="موضوع‌های دیگر مجله">{articleCategories.map(item => <a className="magazine-category-link" href={sitePath(`/blog/category/${item.slug}/`)} aria-current={item.id === category.id ? "page" : undefined} key={item.id}><strong>{item.label}</strong><span>{item.description}</span><Icon name="arrow" /></a>)}</nav>
        <section className="magazine-library container" id="magazine-library" aria-labelledby="category-library-title"><h2 className="sr-only" id="category-library-title">مقاله‌های {category.label}</h2><MagazineGallery category={category.id} articles={articles} /></section>
      </main>
      <SiteFooter />
    </div>
  );
}
