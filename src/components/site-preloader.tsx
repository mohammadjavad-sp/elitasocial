"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "./icons";
import { useSiteSettings } from "./site-settings-provider";

type Phase = "loading" | "leaving" | "hidden";

/** A short brand entrance; resource failures must never keep the site covered. */
export function SitePreloader() {
  const { home: { brand } } = useSiteSettings();
  const pathname = usePathname() || "/";
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");
  const localPath = basePath && pathname.startsWith(`${basePath}/`) ? pathname.slice(basePath.length) : pathname;
  const isAdmin = /^\/admin(?:\/|$)/.test(localPath);
  const [phase, setPhase] = useState<Phase>("loading");
  const dismiss = useRef<() => void>(() => {});

  useEffect(() => {
    if (isAdmin) return;
    let disposed = false;
    let finished = false;
    let minimumElapsed = false;
    let assetsReady = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const cleanup: (() => void)[] = [];
    const later = (callback: () => void, delay: number) => {
      timers.push(setTimeout(() => { if (!disposed) callback(); }, delay));
    };
    const hide = () => {
      if (disposed) return;
      finished = true;
      timers.forEach(clearTimeout);
      cleanup.splice(0).forEach(remove => remove());
      dismiss.current = () => {};
      setPhase("hidden");
    };
    const leave = () => {
      if (disposed || finished) return;
      finished = true;
      setPhase("leaving");
      later(hide, 440);
    };
    dismiss.current = leave;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (motion.matches || window.location.hash || navigation?.type === "back_forward" || document.visibilityState === "hidden") {
      hide();
      return () => { disposed = true; dismiss.current = () => {}; };
    }

    // Follow deliberate navigation immediately; never swallow the original action.
    const onPointer = (event: PointerEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest(".preloader-skip")) hide();
    };
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

    const image = document.querySelector<HTMLImageElement>(".hero-portrait, .service-overview-hero img, .editorial-hero-photo img, .magazine-featured-image img");
    const imageReady = !image || image.complete ? Promise.resolve() : new Promise<void>(resolve => {
      const ready = () => { remove(); resolve(); };
      const remove = () => { image.removeEventListener("load", ready); image.removeEventListener("error", ready); };
      image.addEventListener("load", ready, { once: true });
      image.addEventListener("error", ready, { once: true });
      cleanup.push(remove);
      if (image.complete) ready();
    });
    const finishIfReady = () => { if (minimumElapsed && assetsReady) leave(); };
    later(() => { minimumElapsed = true; finishIfReady(); }, 700);
    later(leave, 1700);
    void Promise.allSettled([document.fonts.ready, imageReady]).then(() => {
      if (disposed) return;
      assetsReady = true;
      finishIfReady();
    });

    return () => {
      disposed = true;
      timers.forEach(clearTimeout);
      cleanup.forEach(remove => remove());
      dismiss.current = () => {};
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
              <defs><linearGradient id="preloader-sparkle-gradient" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#b59aff" /><stop offset=".42" stopColor="#865cf5" /><stop offset=".72" stopColor="#582be8" /><stop offset="1" stopColor="#4420bb" /></linearGradient></defs>
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
        <button className="preloader-skip" type="button" disabled={phase === "leaving"} onClick={() => dismiss.current()}>ورود به سایت<Icon name="arrow" /></button>
      </div>
    </div>
    <noscript><style>{".site-preloader{display:none!important}"}</style></noscript>
  </>;
}
