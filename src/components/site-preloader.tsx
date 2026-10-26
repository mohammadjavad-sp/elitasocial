"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "./icons";
import { useSiteSettings } from "./site-settings-provider";
import { preloaderSessionKey } from "@/lib/preloader";

type Phase = "loading" | "leaving" | "hidden";

/** A short brand entrance; resource failures must never keep the site covered. */
export function SitePreloader() {
  const { home: { brand } } = useSiteSettings();
  const pathname = usePathname() || "/";
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");
  const localPath = basePath && pathname.startsWith(`${basePath}/`) ? pathname.slice(basePath.length) : pathname;
  const isAdmin = /^\/admin(?:\/|$)/.test(localPath);
  const [phase, setPhase] = useState<Phase>("loading");

  useEffect(() => {
    if (isAdmin) return;
    let disposed = false;
    let finished = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const cleanup: (() => void)[] = [];
    const later = (callback: () => void, delay: number) => {
      timers.push(setTimeout(() => { if (!disposed) callback(); }, delay));
    };
    const hide = () => {
      if (disposed) return;
      finished = true;
      document.documentElement.dataset.elitaIntro = "seen";
      try { window.sessionStorage.setItem(preloaderSessionKey, "shown"); } catch { /* Optional in private/storage-blocked contexts. */ }
      timers.forEach(clearTimeout);
      cleanup.splice(0).forEach(remove => remove());
      setPhase("hidden");
    };
    const leave = () => {
      if (disposed || finished) return;
      finished = true;
      setPhase("leaving");
      later(hide, 280);
    };

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    let alreadyShown = document.documentElement.dataset.elitaIntro === "seen";
    try { alreadyShown ||= window.sessionStorage.getItem(preloaderSessionKey) === "shown"; } catch { /* The animation still has a bounded duration. */ }
    if (alreadyShown || motion.matches || window.location.hash || navigation?.type === "back_forward" || document.visibilityState === "hidden") {
      hide();
      return () => { disposed = true; };
    }

    // Follow deliberate navigation immediately; never swallow the original action.
    const onPointer = () => { hide(); };
    const onKey = (event: KeyboardEvent) => {
      if (!["Shift", "Control", "Alt", "Meta"].includes(event.key)) hide();
    };
    const onFocus = (event: FocusEvent) => {
      if (event.target instanceof Element && !event.target.closest(".site-preloader")) hide();
    };
    const onPageShow = (event: PageTransitionEvent) => { if (event.persisted) hide(); };
    const onMotion = () => { if (motion.matches) hide(); };
    window.addEventListener("pointerdown", onPointer, { capture: true, passive: true });
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("focusin", onFocus, true);
    window.addEventListener("pageshow", onPageShow);
    motion.addEventListener("change", onMotion);
    cleanup.push(() => {
      window.removeEventListener("pointerdown", onPointer, true);
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("focusin", onFocus, true);
      window.removeEventListener("pageshow", onPageShow);
      motion.removeEventListener("change", onMotion);
    });

    // A decorative intro must not hold the page behind slow images or fonts.
    later(leave, 420);

    return () => {
      disposed = true;
      timers.forEach(clearTimeout);
      cleanup.forEach(remove => remove());
    };
  }, [isAdmin]);

  if (isAdmin || phase === "hidden") return null;

  return <>
    <div className="site-preloader" data-state={phase}>
      <div className="preloader-backdrop" aria-hidden="true" />
      <div className="preloader-content">
        <div className="preloader-art" aria-hidden="true">
          <div className="preloader-orbit preloader-orbit-one" />
          <div className="preloader-orbit preloader-orbit-two" />
          <span className="preloader-satellite preloader-satellite-one"><Icon name="instagram" /></span>
          <span className="preloader-satellite preloader-satellite-two"><Icon name="website" /></span>
          <span className="preloader-satellite preloader-satellite-three"><Icon name="sparkle" /></span>
          <div className="preloader-gem">
            <svg className="preloader-spark" viewBox="0 0 24 24" fill="currentColor">
              <defs><linearGradient id="preloader-sparkle-gradient" x1="0" y1="0" x2="1" y2="1"><stop stopColor="var(--color-tertiary)" /><stop offset=".42" stopColor="var(--color-secondary)" /><stop offset=".72" stopColor="var(--color-primary)" /><stop offset="1" stopColor="var(--primary-hover)" /></linearGradient></defs>
              <path d="m12 2 2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2Z" />
            </svg>
            <span className="preloader-gem-glint" />
          </div>
          <span className="preloader-twinkle preloader-twinkle-one"><Icon name="sparkle" /></span>
          <span className="preloader-twinkle preloader-twinkle-two"><Icon name="sparkle" /></span>
          <span className="preloader-dot preloader-dot-one" />
          <span className="preloader-dot preloader-dot-two" />
        </div>
        <div className="preloader-wordmark"><strong>{brand.name}</strong><span dir="ltr" lang="en">{brand.latinName}</span></div>
        <p className="preloader-caption" role="status">یک جرقه تا شروع…</p>
        <div className="preloader-indicator" aria-hidden="true"><span /><span /><span /></div>
      </div>
    </div>
    <noscript><style>{".site-preloader{display:none!important}"}</style></noscript>
  </>;
}
