"use client";

import { useEffect, useState } from "react";
import { pricingContent, type DemoPlan, type PricingContent } from "@/content/pricing";
import { planContactHref, readServiceSelection } from "@/lib/service-selection";
import { sitePath } from "@/lib/site-path";
import { Icon } from "./icons";
import { useSiteSettings } from "./site-settings-provider";

const priceFormatter = new Intl.NumberFormat("fa-IR");

export function PricingSection({ pricing = pricingContent, variant = "home" }: { pricing?: PricingContent; variant?: "home" | "page" }) {
  const { sections } = useSiteSettings();
  const [categoryId, setCategoryId] = useState("instagram");
  useEffect(() => {
    function selectFromUrl() {
      const { categoryId: requestedCategory } = readServiceSelection(window.location.search, pricing);
      setCategoryId(requestedCategory ?? "instagram");
    }
    selectFromUrl();
    window.addEventListener("popstate", selectFromUrl);
    return () => window.removeEventListener("popstate", selectFromUrl);
  }, [pricing]);
  const category = pricing.categories.find(item => item.id === categoryId) ?? pricing.categories[0];
  const plans: DemoPlan[] = category.plans;

  function selectCategory(id: string) {
    setCategoryId(id);
    if (variant !== "page") return;

    const url = new URL(window.location.href);
    url.searchParams.set("planCategory", id);
    url.searchParams.delete("plan");
    url.searchParams.delete("service");
    if (url.href !== window.location.href) window.history.pushState(null, "", url);
  }

  return (
    <section id="pricing" className={`pricing-section container${variant === "page" ? " pricing-section-page" : ""}`} aria-labelledby="pricing-title">
      {variant === "page" ? <h2 id="pricing-title" className="sr-only">مقایسهٔ پلن‌های همکاری</h2> : <div className="section-heading"><h2 id="pricing-title">{sections.pricingTitle.map((line, index) => <span key={index}>{line}</span>)}</h2><p>{sections.pricingDescription}</p></div>}
      <div className="pricing-tabs" role="group" aria-label="نوع خدمات پلن‌ها">
        {pricing.categories.map(item => <button key={item.id} type="button" aria-pressed={category.id === item.id} aria-controls="pricing-plans" onClick={() => selectCategory(item.id)}>{item.label}</button>)}
      </div>
      <p className="sr-only" role="status">پلن‌های {category.label} نمایش داده می‌شوند.</p>
      <div id="pricing-plans" className="pricing-grid" role="region" aria-label={`پلن‌های ${category.label}`}>
        {plans.map(plan => <article key={plan.id} className={`pricing-card${plan.recommended ? " pricing-recommended" : ""}`}>
          <div className="plan-badges">{plan.recommended && <span className="plan-recommended-label">پیشنهادی</span>}</div>
          <h3>{plan.name}</h3><p className="plan-description">{plan.description}</p>
          <div className="plan-price"><data value={plan.price}>{priceFormatter.format(plan.price)}</data><span>{plan.currency}<small>{plan.period}</small></span></div>
          <ul>{plan.features.map(feature => <li key={feature}><svg viewBox="0 0 20 20" aria-hidden="true" fill="none"><path d="m4 10 4 4 8-8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>{feature}</li>)}</ul>
          <a className={`pill-button ${plan.recommended ? "" : "secondary-button"}`} href={planContactHref(category.id, plan.id)}>مشاوره دربارهٔ این پلن<span className="button-circle"><Icon name="arrow" /></span></a>
        </article>)}
      </div>
      {plans.length === 0 && <p className="pricing-footnote">برای پیشنهاد همکاری متناسب با این خدمت، با ما گفتگو کن.</p>}
      <p className="pricing-footnote">{sections.pricingFootnote}</p>
      {variant === "home" && <a className="pill-button secondary-button services-action" href={sitePath("/pricing/")}>همهٔ پلن‌ها و جزئیات همکاری<span className="button-circle"><Icon name="arrow" /></span></a>}
    </section>
  );
}
