"use client";

import Image from "next/image";
import { useState } from "react";
import { Icon } from "./icons";
import { sitePath } from "@/lib/site-path";

type BenefitsContent = {
  title: readonly string[];
  description: string;
  items: readonly {
    id: string;
    title: string;
    description: string;
    image: { src: string; alt: string; width: number; height: number };
    actionLabel: string;
    href: string;
  }[];
};

export function BenefitsSection({ content }: { content: BenefitsContent }) {
  const [activeId, setActiveId] = useState(content.items[0]?.id);

  return (
    <section id="benefits" className="benefits-section container" aria-labelledby="benefits-title">
      <div className="section-heading">
        <h2 id="benefits-title">{content.title.map(line => <span key={line}>{line}</span>)}</h2>
        <p>{content.description}</p>
      </div>
      <div className="benefits-grid">
        {content.items.map(item => {
          const active = item.id === activeId;
          const triggerId = `benefit-toggle-${item.id}`;
          const panelId = `benefit-content-${item.id}`;
          const opensNewWindow = /^https?:\/\//.test(item.href);

          return (
            <article key={item.id} className={`benefit-panel${active ? " is-active" : ""}`}>
              <Image
                src={sitePath(item.image.src)}
                alt={item.image.alt}
                fill
                className="benefit-photo"
                sizes="(min-width: 1050px) 550px, (min-width: 700px) 65vw, 100vw"
              />
              <span className="benefit-shade" aria-hidden="true" />
              <h3 className="benefit-heading">
                <button
                  id={triggerId}
                  className="benefit-toggle"
                  type="button"
                  aria-expanded={active}
                  aria-controls={panelId}
                  onClick={() => setActiveId(item.id)}
                >
                  <span className="benefit-title">{item.title}</span>
                  <span className="benefit-indicator" aria-hidden="true">{active ? "−" : "+"}</span>
                </button>
              </h3>
              <div
                id={panelId}
                className="benefit-content"
                role="region"
                aria-labelledby={triggerId}
                hidden={!active}
              >
                <p>{item.description}</p>
                <a
                  href={item.href}
                  target={opensNewWindow ? "_blank" : undefined}
                  rel={opensNewWindow ? "noopener noreferrer" : undefined}
                  aria-label={opensNewWindow ? `${item.actionLabel} (پنجره جدید)` : undefined}
                >
                  {item.actionLabel}<Icon name="arrow" />
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
