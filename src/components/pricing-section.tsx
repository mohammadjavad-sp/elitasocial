"use client";

import { useState } from "react";
import { pricingContent, type DemoPlan } from "@/content/pricing";
import { homeContent } from "@/content/home";
import { Icon } from "./icons";

const priceFormatter = new Intl.NumberFormat("fa-IR");

export function PricingSection() {
  const [categoryId, setCategoryId] = useState("instagram");
  const category = pricingContent.categories.find(item => item.id === categoryId)!;
  const plans: DemoPlan[] = category.plans;
  return (
    <section id="pricing" className="pricing-section container" aria-labelledby="pricing-title">
      <div className="section-heading"><h2 id="pricing-title">{pricingContent.title.map(line => <span key={line}>{line}</span>)}</h2><p>{pricingContent.description}</p></div>
      <div className="pricing-tabs" role="group" aria-label="نوع خدمات پلن‌ها">
        {pricingContent.categories.map(item => <button key={item.id} type="button" aria-pressed={categoryId === item.id} aria-controls="pricing-plans" onClick={() => setCategoryId(item.id)}>{item.label}</button>)}
      </div>
      <p className="demo-notice pricing-notice"><Icon name="sparkle" />{pricingContent.notice}</p>
      <p className="sr-only" role="status">پلن‌های {category.label} نمایش داده می‌شوند.</p>
      <div id="pricing-plans" className="pricing-grid" role="region" aria-label={`پلن‌های ${category.label}`}>
        {plans.map(plan => <article key={plan.id} className={`pricing-card${plan.recommended ? " pricing-recommended" : ""}`}>
          <div className="plan-badges"><span>پلن نمایشی</span>{plan.recommended && <span className="plan-recommended-label">پیشنهادی</span>}</div>
          <h3>{plan.name}</h3><p className="plan-description">{plan.description}</p>
          <div className="plan-price"><data value={plan.price}>{priceFormatter.format(plan.price)}</data><span>{plan.currency}<small>{plan.period}</small></span></div>
          <ul>{plan.features.map(feature => <li key={feature}><svg viewBox="0 0 20 20" aria-hidden="true" fill="none"><path d="m4 10 4 4 8-8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>{feature}</li>)}</ul>
          <a className={`pill-button ${plan.recommended ? "" : "secondary-button"}`} href={`${homeContent.contact.whatsapp}?text=${encodeURIComponent(`سلام، دربارهٔ همکاری برای ${category.label} با نیازهایی شبیه پلن نمایشی «${plan.name}» مشاوره می‌خوام.`)}`} target="_blank" rel="noopener noreferrer">مشاوره دربارهٔ این پلن<span className="button-circle"><Icon name="arrow" /></span></a>
        </article>)}
      </div>
      <p className="pricing-footnote">هزینهٔ نهایی و محدودهٔ همکاری، بعد از بررسی نیازهای برندت مشخص می‌شود.</p>
    </section>
  );
}
