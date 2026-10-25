"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { articleCategories, articles as starterArticles, getArticleCategory, type Article, type ArticleCategoryId } from "@/content/articles";
import { ArticleCard } from "./article-card";

const pageSize = 6;
type CategoryFilter = ArticleCategoryId | "all";
type ArticleSort = "newest" | "shortest";

function normalizePersian(value: string) {
  return value.replace(/ي|ى/g, "ی").replace(/ك/g, "ک").replace(/[\u064b-\u065f\u0670\u0640]/g, "").replace(/[\u200c\u200d]/g, " ").replace(/\s+/g, " ").trim().toLocaleLowerCase("fa-IR");
}

function validCategory(value: string | null): value is ArticleCategoryId {
  return articleCategories.some((item) => item.id === value);
}

export function MagazineGallery({ category, articles = starterArticles }: { category?: ArticleCategoryId; articles?: Article[] }) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>(category ?? "all");
  const [sort, setSort] = useState<ArticleSort>("newest");
  const [page, setPage] = useState(1);
  const [urlReady, setUrlReady] = useState(false);
  const searchInput = useRef<HTMLInputElement>(null);
  const resultsCount = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const readLocation = () => {
      const parameters = new URLSearchParams(window.location.search);
      const requestedCategory = parameters.get("category");
      setQuery(parameters.get("q") ?? "");
      setActiveCategory(category ?? (validCategory(requestedCategory) ? requestedCategory : "all"));
      setSort(parameters.get("sort") === "shortest" ? "shortest" : "newest");
      const requestedPage = Number(parameters.get("page"));
      setPage(Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1);
      setUrlReady(true);
    };
    readLocation();
    window.addEventListener("popstate", readLocation);
    return () => window.removeEventListener("popstate", readLocation);
  }, [category]);

  const filteredArticles = useMemo(() => {
    const terms = normalizePersian(query).split(" ").filter(Boolean);
    const result = articles.filter((article) => {
      if (activeCategory !== "all" && article.category !== activeCategory) return false;
      const searchable = normalizePersian([article.title, article.excerpt, article.tags.join(" "), getArticleCategory(article.category)?.label ?? ""].join(" "));
      return terms.every((term) => searchable.includes(term));
    });
    return sort === "shortest" ? [...result].sort((first, second) => first.readingMinutes - second.readingMinutes) : result;
  }, [activeCategory, articles, query, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleArticles = filteredArticles.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    if (!urlReady) return;
    const url = new URL(window.location.href);
    if (query.trim()) url.searchParams.set("q", query); else url.searchParams.delete("q");
    if (!category && activeCategory !== "all") url.searchParams.set("category", activeCategory); else url.searchParams.delete("category");
    if (sort !== "newest") url.searchParams.set("sort", sort); else url.searchParams.delete("sort");
    if (currentPage > 1) url.searchParams.set("page", String(currentPage)); else url.searchParams.delete("page");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, [activeCategory, category, currentPage, query, sort, urlReady]);

  function clearFilters() {
    setQuery("");
    setActiveCategory(category ?? "all");
    setSort("newest");
    setPage(1);
    searchInput.current?.focus();
  }

  function changePage(nextPage: number) {
    setPage(nextPage);
    requestAnimationFrame(() => {
      resultsCount.current?.focus({ preventScroll: true });
      resultsCount.current?.scrollIntoView({ block: "start", behavior: "instant" });
    });
  }

  return (
    <div className="magazine-gallery">
      <div className="magazine-search-row">
        <div className="magazine-search-field"><label htmlFor="magazine-search">دنبال چه موضوعی می‌گردید؟</label><div className="magazine-search-input"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></svg><input id="magazine-search" ref={searchInput} type="search" value={query} placeholder="مثلاً تقویم محتوا یا طراحی سایت" onChange={(event) => { setQuery(event.target.value); setPage(1); }} aria-controls="magazine-results" autoComplete="off" /></div></div>
        <div className="magazine-sort-field"><label htmlFor="magazine-sort">ترتیب نمایش</label><select id="magazine-sort" value={sort} onChange={(event) => { setSort(event.target.value as ArticleSort); setPage(1); }}><option value="newest">تازه‌ترین نوشته‌ها</option><option value="shortest">زمان مطالعهٔ کمتر</option></select></div>
      </div>
      {!category && <div className="magazine-filters" role="group" aria-label="موضوع مقاله‌ها"><button type="button" aria-pressed={activeCategory === "all"} onClick={() => { setActiveCategory("all"); setPage(1); }}>همهٔ موضوع‌ها</button>{articleCategories.map((item) => <button key={item.id} type="button" aria-pressed={activeCategory === item.id} onClick={() => { setActiveCategory(item.id); setPage(1); }}>{item.label}</button>)}</div>}
      <p ref={resultsCount} tabIndex={-1} className="magazine-results-count" role="status" aria-live="polite" aria-atomic="true">{filteredArticles.length.toLocaleString("fa-IR")} مقاله{query.trim() ? ` برای «${query.trim()}»` : ""}{totalPages > 1 ? `؛ صفحهٔ ${currentPage.toLocaleString("fa-IR")} از ${totalPages.toLocaleString("fa-IR")}` : ""}</p>
      <div id="magazine-results" className="magazine-results">
        {visibleArticles.length > 0 ? <div className="magazine-article-grid">{visibleArticles.map((article) => <ArticleCard key={article.slug} article={article} />)}</div> : <div className="magazine-empty"><h3>{articles.length === 0 ? "مقاله‌ای برای نمایش وجود ندارد" : "مقاله‌ای با این جست‌وجو پیدا نشد"}</h3><p>{articles.length === 0 ? "برای راهنمایی دربارهٔ محتوا و طراحی با ما در ارتباط باشید." : "عبارت کوتاه‌تری بنویسید یا فیلترها را پاک کنید تا نوشته‌های بیشتری ببینید."}</p>{articles.length > 0 && <button type="button" onClick={clearFilters}>پاک کردن جست‌وجو و فیلترها</button>}</div>}
      </div>
      {totalPages > 1 && <nav className="magazine-pagination" aria-label="صفحه‌بندی مقاله‌ها"><button type="button" disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)}>قبلی</button>{Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => <button key={pageNumber} type="button" aria-current={pageNumber === currentPage ? "page" : undefined} aria-label={`صفحهٔ ${pageNumber.toLocaleString("fa-IR")}`} onClick={() => changePage(pageNumber)}>{pageNumber.toLocaleString("fa-IR")}</button>)}<button type="button" disabled={currentPage === totalPages} onClick={() => changePage(currentPage + 1)}>بعدی</button></nav>}
    </div>
  );
}
