"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Ordered by visual importance. Only two visible accents run at the same time.
const accents = [
  ".hero-ribbon-mark",
  ".instagram-card",
  ".ambient-orb",
  ".little-star > svg",
  ".portfolio-hero-preview",
  ".editorial-hero-seal > svg",
  ".magazine-hero-note",
  ".magazine-hero-bookmark > svg",
  ".pricing-visual-orbit > span",
  ".about-spark > svg",
  ".services-spark-end > svg",
  ".site-ornament-1 > svg",
  ".site-ornament-4 > svg",
  ".site-ornament-7 > svg",
  ".site-ornament-10 > svg",
];

/** Gate CSS accents at viewport boundaries; content never depends on this effect. */
export function MotionEnhancements() {
  const pathname = usePathname();

  useEffect(() => {
    const shell = document.querySelector(".home-shell");
    if (!shell || typeof IntersectionObserver === "undefined") return;

    const targets = accents.flatMap(selector => Array.from(shell.querySelectorAll(selector)));
    const visible = new Set<Element>();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const smallScreen = window.matchMedia("(max-width: 599px)");

    function sync() {
      let remaining = document.hidden || reducedMotion.matches ? 0 : 2;
      for (const target of targets) {
        const eligible = visible.has(target) && !(smallScreen.matches && target.matches(".instagram-card"));
        const active = remaining > 0 && eligible;
        target.setAttribute("data-elita-motion", active ? "active" : "paused");
        if (active) remaining--;
      }
    }

    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio >= .15) visible.add(entry.target);
        else visible.delete(entry.target);
      }
      sync();
    }, { threshold: [0, .15] });

    for (const target of targets) {
      target.setAttribute("data-elita-motion", "paused");
      observer.observe(target);
    }
    reducedMotion.addEventListener("change", sync);
    smallScreen.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);

    return () => {
      observer.disconnect();
      reducedMotion.removeEventListener("change", sync);
      smallScreen.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      for (const target of targets) target.removeAttribute("data-elita-motion");
    };
  }, [pathname]);

  return null;
}
