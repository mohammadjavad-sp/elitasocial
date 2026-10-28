"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ContactChannels } from "./contact-channels";
import { Icon } from "./icons";
import { useSiteSettings } from "./site-settings-provider";

const blinkPreferenceKey = "elita-contact-blink";

export function FloatingContact() {
  const pathname = usePathname() || "/";
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");
  const localPath = basePath && pathname.startsWith(`${basePath}/`) ? pathname.slice(basePath.length) : pathname;
  if (/^\/admin(?:\/|$)/.test(localPath)) return null;
  return <FloatingContactPanel key={pathname} />;
}

function FloatingContactPanel() {
  const { home: { brand, contact } } = useSiteSettings();
  const id = useId();
  const details = useRef<HTMLDetailsElement>(null);
  const trigger = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [blinkEnabled, setBlinkEnabled] = useState(false);
  const close = useCallback((restoreFocus = false) => {
    if (details.current) details.current.open = false;
    setOpen(false);
    if (restoreFocus) trigger.current?.focus();
  }, []);

  useEffect(() => {
    setOpen(details.current?.open ?? false);
    try { setBlinkEnabled(window.localStorage.getItem(blinkPreferenceKey) !== "off"); } catch { setBlinkEnabled(true); }
    const update = () => setPaused(document.visibilityState === "hidden");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!details.current?.contains(event.target as Node)) close();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) {
        event.preventDefault();
        close(true);
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  function toggleBlink() {
    const enabled = !blinkEnabled;
    setBlinkEnabled(enabled);
    try { window.localStorage.setItem(blinkPreferenceKey, enabled ? "on" : "off"); } catch { /* The preference still works for this page. */ }
  }

  return <>
    <details className="floating-contact" ref={details} data-paused={paused ? "true" : undefined} data-blink={blinkEnabled ? "on" : "off"}
      onToggle={event => setOpen(event.currentTarget.open)}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) close(); }}>
      <summary ref={trigger} className="floating-contact-trigger" aria-controls={`${id}-panel`}
        aria-label={`ارتباط با ما؛ راه‌های ارتباطی ${brand.name}`}>
        <span className="floating-contact-icon"><Icon name={open ? "close" : "phone"} /></span>
        <span>ارتباط با ما</span>
        <span className="floating-contact-dot" aria-hidden="true" />
      </summary>
      <div className="floating-contact-panel" id={`${id}-panel`} role="region" aria-labelledby={`${id}-title`}>
        <div className="floating-contact-heading">
          <div><p className="floating-contact-kicker">{brand.name}</p><h2 id={`${id}-title`}>از اینجا در ارتباط باشیم</h2></div>
          <button type="button" className="floating-contact-close" aria-label="بستن راه‌های ارتباطی" onClick={() => close(true)}><Icon name="close" /></button>
        </div>
        <p className="floating-contact-description">راهی که راحت‌تری را انتخاب کن.</p>
        <ContactChannels contact={contact} className="floating-contact-channels" onNavigate={() => close(true)} />
        <button type="button" className="floating-contact-motion-toggle" onClick={toggleBlink}>{blinkEnabled ? "توقف چشمک" : "فعال کردن چشمک"}</button>
      </div>
    </details>
    <noscript><style>{".floating-contact-close,.floating-contact-motion-toggle{display:none}"}</style></noscript>
  </>;
}
