"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Prioritize nearby details, with a smaller simultaneous budget on phones.
const accents = [
  ".hero-ribbon-mark",
  ".instagram-card",
  ".website-card",
  ".ambient-orb",
  ".little-star > svg",
  ".visual-dot",
  ".portfolio-hero-preview",
  ".editorial-hero-seal",
  ".magazine-hero-note",
  ".magazine-hero-bookmark",
  ".pricing-visual-orbit > span",
  ".pricing-visual-card-back",
  ".pricing-visual-tag > svg",
  ".about-seal > svg",
  ".about-orbits > i",
  ".section-spark > svg",
  ".service-visual-note > svg",
  ".site-ornament > svg",
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
      let remaining = document.hidden || reducedMotion.matches ? 0 : smallScreen.matches ? 4 : 5;
      for (const target of targets) {
        const active = remaining > 0 && visible.has(target);
        const state = active ? "active" : "paused";
        if (target.getAttribute("data-elita-motion") !== state) target.setAttribute("data-elita-motion", state);
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
