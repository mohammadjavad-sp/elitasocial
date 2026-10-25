"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { portfolioCategories, portfolioProjects as starterProjects, projectConsultationUrl, type PortfolioProject } from "@/content/portfolio";
import { sitePath } from "@/lib/site-path";
import { Icon } from "./icons";
import { useSiteSettings } from "./site-settings-provider";
import { ContactChannels } from "./contact-channels";

/** Small original compositions, not screenshots of clients or third-party projects. */
function ProjectArtwork({ project }: { project: PortfolioProject }) {
  if (project.image?.src) return <div className={`project-art art-${project.theme}`}><Image src={sitePath(project.image.src)} alt={project.image.alt} fill sizes="(max-width: 680px) 90vw, (max-width: 1049px) 45vw, 30vw" style={{ objectFit: "cover" }} /></div>;
  const social = project.category === "instagram";
  const editorial = project.category === "content";
  return <div className={`project-art art-${project.theme} ${social ? "art-social" : editorial ? "art-editorial" : "art-web"}`} aria-hidden="true">
    <div className="art-orbit" />
    {social ? <div className="art-phone">
      <div className="art-phone-top"><span className="art-avatar">{project.brand}</span><span><b>{project.brand}</b><i>داستان‌های یک برند</i></span><span className="art-menu">•••</span></div>
      <div className="art-social-grid">{[0, 1, 2, 3, 4, 5].map((n) => <div key={n} className={`art-tile art-tile-${n}`}><span className="art-object" />{n === 1 ? <b>{project.headline}</b> : n === 4 ? <b>{project.brand}</b> : null}</div>)}</div>
      <div className="art-phone-bottom"><span>♡</span><span>⌕</span><span>◯</span></div>
    </div> : editorial ? <div className="art-editorial-stack">
      <div className="art-paper art-paper-back"><span>{project.brand}</span><span className="art-object" /></div>
      <div className="art-paper art-paper-front"><span className="art-paper-brand">{project.brand}</span><span className="art-object" /><strong>{project.headline}</strong><span className="art-paper-rule" /></div>
    </div> : <div className="art-browser">
      <div className="art-browser-chrome"><span /><span /><span /><i /></div>
      <div className="art-browser-nav"><b>{project.brand}</b><span /><span /><span /><i /></div>
      {project.category === "seo" ? <div className="art-search-page"><div className="art-search-input"><span>خدمات طراحی برند</span><span>⌕</span></div><b>{project.headline}</b><div className="art-search-result"><strong>استودیو مدار | طراحی هویت برند</strong><span /><span /></div><div className="art-search-result"><strong>از ایده تا هویت یکپارچه</strong><span /><span /></div><div className="art-search-tags"><span>خدمات</span><span>پروژه‌ها</span><span>ارتباط</span></div></div> : <><div className="art-browser-hero"><div><span className="art-tiny-label">با {project.brand}</span><strong>{project.headline}</strong><i className="art-faux-button">کشف دنیای {project.brand}</i></div><span className="art-object" /></div><div className="art-browser-products">{[0, 1, 2].map((n) => <div key={n}><span className="art-object" /><i /></div>)}</div></>}
    </div>}
  </div>;
}

export function PortfolioGallery({ featured = false, projects: source = starterProjects }: { featured?: boolean; projects?: PortfolioProject[] }) {
  const settings = useSiteSettings();
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<PortfolioProject | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const projects = featured ? source.slice(0, 3) : source.filter((project) => category === "all" || project.category === category);

  useEffect(() => {
    if (!selected || !dialog.current) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (!dialog.current.open) dialog.current.showModal();
    return () => { document.body.style.overflow = previous; };
  }, [selected]);

  function closeProject() {
    dialog.current?.close();
    setSelected(null);
    trigger.current?.focus();
  }

  return <>
    {!featured && <div className="portfolio-filters" role="group" aria-label="فیلتر نمونه‌کارها بر اساس خدمت">{portfolioCategories.map((item) => <button key={item.id} type="button" aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>{item.label}</button>)}</div>}
    {!featured && <p className="portfolio-count" role="status" aria-live="polite">{projects.length.toLocaleString("fa-IR")} نمونه‌کار{category === "all" ? " در همهٔ دسته‌ها" : ` در دستهٔ ${portfolioCategories.find((item) => item.id === category)?.label}`}</p>}
    <div className="portfolio-grid">{projects.map((project) => <article className="portfolio-card" key={project.id}>
      <button className="project-open" type="button" aria-haspopup="dialog" aria-label={`جزئیات طرح ${project.title}`} onClick={(event) => { trigger.current = event.currentTarget; setSelected(project); }}>
        <ProjectArtwork project={project} />
        <span className="project-card-body"><span className="project-card-meta"><span>{project.discipline}</span></span><span className="project-card-title">{project.title}<span className="project-card-arrow"><Icon name="arrow" /></span></span><span className="project-card-caption">{project.caption}</span><span className="project-detail-label">دیدن جزئیات طرح</span></span>
      </button>
    </article>)}</div>
    {projects.length === 0 && <p className="portfolio-count">برای دیدن طرح‌های بیشتر، دستهٔ دیگری را انتخاب کن.</p>}
    <dialog className="project-dialog" ref={dialog} aria-labelledby="project-dialog-title" aria-describedby={selected ? "project-dialog-description" : undefined} onCancel={(event) => { event.preventDefault(); closeProject(); }} onClose={() => { setSelected(null); trigger.current?.focus(); }} onClick={(event) => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeProject(); } }}>
      {selected && <><button className="project-close" type="button" aria-label="بستن جزئیات طرح" onClick={closeProject} autoFocus><Icon name="close" /></button><ProjectArtwork project={selected} /><div className="project-dialog-copy"><span className="project-dialog-category">{selected.discipline}</span><h2 id="project-dialog-title">{selected.title}</h2><p id="project-dialog-description">{selected.description}</p><h3>اجزای طرح</h3><ul>{selected.deliverables.map((item) => <li key={item}>{item}</li>)}</ul><div className="contact-actions"><a className="pill-button" href={projectConsultationUrl(selected, settings.home.contact.whatsapp)} target="_blank" rel="noopener noreferrer"><span>برای برند من هم صحبت کنیم</span><span className="button-circle"><Icon name="arrow" /></span></a><ContactChannels contact={settings.home.contact} includeWhatsapp={false} compact /></div></div></>}
    </dialog>
  </>;
}
