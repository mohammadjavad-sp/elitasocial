"use client";

import { useEffect, useRef, useState } from "react";
import type { NavigationItem } from "@/content/home";
import { Icon } from "./icons";
import { sitePath } from "@/lib/site-path";

type Props = { navigation: NavigationItem[]; whatsapp: string };

function NavigationLinks({ items, onNavigate }: { items: NavigationItem[]; onNavigate?: () => void }) {
  return items.map((item) => item.upcoming ? (
    <span className="nav-upcoming" key={item.label}>
      <span aria-disabled="true">{item.label}</span><span className="coming-soon">به‌زودی</span>
    </span>
  ) : (
    <a key={item.label} href={sitePath(item.href ?? "/")} onClick={onNavigate} aria-current={item.href === "/" ? "page" : undefined}
      {...(item.external ? { target: "_blank", rel: "noopener noreferrer", "aria-label": `${item.label} در اینستاگرام (پنجره جدید)` } : {})}>
      {item.label}
    </a>
  ));
}

export function Header({ navigation, whatsapp }: Props) {
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
        <a className="brand" href={sitePath("/")} aria-label="الیتا سوشال، خانه">
          <span className="brand-symbol"><Icon name="sparkle" /></span>
          <span className="brand-words"><span className="brand-persian">الیتا سوشال</span><span className="brand-latin" lang="en" dir="ltr">ELITA SOCIAL</span></span>
        </a>
        <nav className="desktop-nav" aria-label="منوی اصلی"><NavigationLinks items={navigation} /></nav>
        <a className="header-cta pill-button" href={whatsapp} target="_blank" rel="noopener noreferrer">
          <span>بیا از برندت بگیم</span><span className="button-circle"><Icon name="arrow" /></span>
        </a>
        <button className="menu-toggle" ref={toggle} type="button" aria-expanded={open} aria-controls="mobile-navigation"
          aria-label={open ? "بستن منو" : "باز کردن منو"} onClick={() => setOpen(!open)}>
          <Icon name={open ? "close" : "menu"} />
        </button>
      </div>
      <div className="mobile-panel container" id="mobile-navigation" ref={panel} hidden={!open}>
        <nav aria-label="منوی موبایل"><NavigationLinks items={navigation} onNavigate={() => setOpen(false)} /></nav>
        <a className="mobile-contact" href={whatsapp} target="_blank" rel="noopener noreferrer">مشاوره و شروع همکاری <Icon name="arrow" /></a>
      </div>
    </header>
  );
}
