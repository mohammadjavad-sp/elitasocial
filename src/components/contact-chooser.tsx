"use client";

import { useEffect, useRef, useState } from "react";
import type { SiteSettings } from "@/lib/site-settings";
import { ContactChannels } from "./contact-channels";
import { Icon } from "./icons";

type Props = { contact: SiteSettings["home"]["contact"]; label: string; className?: string };

export function ContactChooser({ contact, label, className = "" }: Props) {
  const details = useRef<HTMLDetailsElement>(null);
  const summary = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);

  function close(restoreFocus = false) {
    if (details.current) details.current.open = false;
    setOpen(false);
    if (restoreFocus) summary.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (!details.current?.contains(event.target as Node)) close();
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); close(true); }
    }
    const small = window.matchMedia("(max-width: 599px)");
    function onResize() { if (small.matches) close(); }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    small.addEventListener("change", onResize);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
      small.removeEventListener("change", onResize);
    };
  }, [open]);

  return <details className={`contact-chooser ${className}`.trim()} ref={details} onToggle={event => setOpen(event.currentTarget.open)}>
    <summary ref={summary} className="pill-button contact-chooser-summary"><span>{label}</span><span className="button-circle"><Icon name="arrow" /></span></summary>
    <div className="contact-chooser-panel"><p>از کجا در ارتباط باشیم؟</p><ContactChannels contact={contact} compact onNavigate={() => close()} /></div>
  </details>;
}
