"use client";

import { useEffect } from "react";

type DeviceHints = Navigator & {
  connection?: { saveData?: boolean };
  deviceMemory?: number;
};

/** Progressive enhancement: no scroll handlers, hidden server content or external animation runtime. */
export function ScrollMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-motion-root]");
    if (!root) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktop = window.matchMedia("(min-width: 1050px)");
    const device = navigator as DeviceHints;
    // CPU thread counts do not describe the GPU's ability to animate a transform.
    const minimalMotion = Boolean(device.connection?.saveData)
      || Boolean(device.deviceMemory && device.deviceMemory <= 2);
    const previousLevel = root.dataset.motionLevel;
    const pending = new Set<HTMLElement>();
    const active = new Map<HTMLElement, Animation>();
    let observer: IntersectionObserver | null = null;
    let disposed = false;

    function updateLevel() {
      root!.dataset.motionLevel = preference.matches ? "off" : minimalMotion ? "minimal" : desktop.matches ? "full" : "subtle";
    }
    function settle(element: HTMLElement) {
      pending.delete(element);
      observer?.unobserve(element);
      active.get(element)?.cancel();
      active.delete(element);
    }
    function settleAll() {
      observer?.disconnect();
      pending.clear();
      active.forEach(animation => animation.cancel());
      active.clear();
    }
    function settleAround(target: Element) {
      for (const element of [...pending, ...active.keys()]) {
        if (element === target || element.contains(target) || target.contains(element)) settle(element);
      }
    }
    function followHash() {
      if (!window.location.hash) return;
      try {
        const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
        if (target && root!.contains(target)) settleAround(target.closest("section") || target);
      } catch { /* An invalid fragment must not affect normal navigation. */ }
    }
    function onFocus(event: FocusEvent) {
      if (event.target instanceof Element && root!.contains(event.target)) settleAround(event.target);
    }
    function onPageShow(event: PageTransitionEvent) { if (event.persisted) settleAll(); }
    function onPreference() {
      updateLevel();
      if (preference.matches) settleAll();
    }
    updateLevel();
    preference.addEventListener("change", onPreference);
    desktop.addEventListener("change", updateLevel);

    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    // Deep links, restored pages and unsupported browsers keep their immediately readable layout.
    if (!preference.matches && !window.location.hash && navigation?.type !== "back_forward"
      && "IntersectionObserver" in window && typeof Element.prototype.animate === "function") {
      observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting || disposed) continue;
          const element = entry.target as HTMLElement;
          if (!pending.has(element)) continue;
          pending.delete(element);
          observer!.unobserve(element);
          const bounds = entry.boundingClientRect;
          const focused = document.activeElement;
          // Fast scrolling and keyboard navigation should reveal useful content immediately.
          if (bounds.bottom <= 0 || bounds.top < window.innerHeight * .08
            || focused instanceof Element && element.contains(focused) || active.size >= (minimalMotion ? 3 : 6)) continue;
          const light = !desktop.matches;
          const variant = element.dataset.reveal;
          const order = Math.max(0, Math.min(3, Number(element.dataset.revealOrder) || 0));
          const distance = minimalMotion ? 12 : variant === "line" ? (light ? 18 : 26) : (light ? 28 : 44);
          const rotation = variant === "tilt" && !minimalMotion ? (order % 2 ? -1 : 1) * (light ? 1.1 : 2.4) : 0;
          const scale = minimalMotion ? 1 : variant === "image" ? (light ? .98 : .96) : variant === "tilt" ? .975 : 1;
          try {
            const animation = element.animate([
              { opacity: variant === "line" ? .18 : .08, translate: `0 ${distance}px`, rotate: `${rotation}deg`, scale },
              { opacity: 1, translate: "0 0", rotate: "0deg", scale: 1 },
            ], {
              duration: minimalMotion ? 500 : variant === "line" ? (light ? 640 : 760) : variant === "image" ? (light ? 900 : 1000) : (light ? 780 : 900),
              delay: order * (light ? 50 : 80),
              easing: "cubic-bezier(.2,.75,.25,1)",
              fill: "both",
            });
            active.set(element, animation);
            const release = () => {
              if (active.get(element) === animation) active.delete(element);
              animation.onfinish = null;
              animation.oncancel = null;
              animation.cancel();
            };
            animation.onfinish = release;
            animation.oncancel = release;
          } catch { /* Animation support is optional; original content stays visible. */ }
        }
        if (pending.size === 0) observer?.disconnect();
      // Start after content actually enters the viewport, including very slow scrolling.
      }, { threshold: .06, rootMargin: "0px 0px -64px 0px" });

      for (const element of root.querySelectorAll<HTMLElement>("[data-reveal]")) {
        if (element.closest("dialog") || element.getBoundingClientRect().top < window.innerHeight) continue;
        pending.add(element);
        observer.observe(element);
      }
      window.addEventListener("focusin", onFocus, true);
      window.addEventListener("hashchange", followHash);
      window.addEventListener("pageshow", onPageShow);
    }

    return () => {
      disposed = true;
      settleAll();
      preference.removeEventListener("change", onPreference);
      desktop.removeEventListener("change", updateLevel);
      window.removeEventListener("focusin", onFocus, true);
      window.removeEventListener("hashchange", followHash);
      window.removeEventListener("pageshow", onPageShow);
      if (previousLevel === undefined) delete root.dataset.motionLevel;
      else root.dataset.motionLevel = previousLevel;
    };
  }, []);

  return null;
}
