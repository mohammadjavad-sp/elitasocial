"use client";

import { useEffect, useRef, useState } from "react";
import type { NavigationItem } from "@/content/home";
import { Icon } from "./icons";
import { sitePath } from "@/lib/site-path";
import { useSiteSettings } from "./site-settings-provider";
import { BrandLogo } from "./brand-logo";
import { ContactChannels } from "./contact-channels";
import { ContactChooser } from "./contact-chooser";

type ActivePage = "home" | "portfolio" | "services" | "blog" | "pricing";
type Props = { navigation: NavigationItem[]; whatsapp?: string; activePage?: ActivePage };
const activePaths: Record<ActivePage, string> = { home: "/", portfolio: "/portfolio/", services: "/services/", blog: "/blog/", pricing: "/pricing/" };

function NavigationLinks({ items, onNavigate, activePage }: { items: NavigationItem[]; onNavigate?: () => void; activePage: ActivePage }) {
  return items.map((item) => item.upcoming ? (
    <span className="nav-upcoming" key={item.label}>
      <span aria-disabled="true">{item.label}</span><span className="coming-soon">به‌زودی</span>
    </span>
  ) : (
    <a key={item.label} href={sitePath(item.href ?? "/")} onClick={onNavigate} aria-current={item.href === activePaths[activePage] ? "page" : undefined}
      {...(item.external ? { target: "_blank", rel: "noopener noreferrer", "aria-label": `${item.label} در اینستاگرام (پنجره جدید)` } : {})}>
      {item.label}
    </a>
  ));
}

export function Header({ navigation, activePage = "home" }: Props) {
  const { home: { brand, contact }, header } = useSiteSettings();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); toggle.current?.focus(); }
    };
    const onPointer = (event: PointerEvent) => {
      if (!panel.current?.contains(event.target as Node) && !toggle.current?.contains(event.target as Node)) setOpen(false);
    };
    const query = window.matchMedia("(min-width: 1050px)");
    const closeOnDesktop = () => setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    query.addEventListener("change", closeOnDesktop);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      query.removeEventListener("change", closeOnDesktop);
    };
  }, [open]);

  return (
    <header className="site-header">
      <div className="header-inner container">
        <a className="brand" href={sitePath("/")} aria-label={`${brand.name}، خانه`}>
          <BrandLogo name={brand.name} priority />
        </a>
        <nav className="desktop-nav" aria-label="منوی اصلی"><NavigationLinks items={navigation} activePage={activePage} /></nav>
        <ContactChooser contact={contact} label={header.ctaLabel} className="header-cta" />
        <button className="menu-toggle" ref={toggle} type="button" aria-expanded={open} aria-controls="mobile-navigation"
          aria-label={open ? "بستن منو" : "باز کردن منو"} onClick={() => setOpen(!open)}>
          <Icon name={open ? "close" : "menu"} />
        </button>
      </div>
      <div className="mobile-panel container" id="mobile-navigation" ref={panel} hidden={!open}>
        <nav aria-label="منوی موبایل"><NavigationLinks items={navigation} activePage={activePage} onNavigate={() => setOpen(false)} /></nav>
        <div className="mobile-contact-options">
          <p>{header.mobileCtaLabel}</p>
          <ContactChannels contact={contact} compact onNavigate={() => setOpen(false)} />
        </div>
      </div>
    </header>
  );
}
