import Image from "next/image";
import { homeContent } from "@/content/home";
import { Icon } from "./icons";
import { sitePath } from "@/lib/site-path";

export function ApproachSection() {
  const { approach, contact } = homeContent;
  return (
    <section id="approach" className="approach-section container" aria-labelledby="approach-title">
      <div className="section-heading">
        <span className="section-spark approach-spark" aria-hidden="true"><Icon name="sparkle" /></span>
        <h2 id="approach-title">{approach.title.map(line => <span key={line}>{line}</span>)}</h2>
        <p>{approach.description}</p>
      </div>
      <div className="approach-grid">
        <article className="approach-feature">
          <Image {...approach.image} src={sitePath(approach.image.src)} sizes="(min-width: 1050px) 750px, 100vw" className="approach-image" />
          <div className="approach-image-shade" aria-hidden="true" />
          <div className="approach-feature-copy">
            <p className="approach-feature-label">{approach.featureLabel}</p>
            <h3>{approach.featureTitle.map(line => <span key={line}>{line}</span>)}</h3>
            <p>{approach.featureDescription}</p>
            <a className="pill-button" href={contact.whatsapp} target="_blank" rel="noopener noreferrer">{approach.actionLabel}<span className="button-circle"><Icon name="arrow" /></span></a>
          </div>
        </article>
        <div className="approach-values">
          {approach.values.map(value => <article key={value.title} className={`approach-value approach-value-${value.theme}`}>
            <span className="value-symbol" aria-hidden="true"><Icon name={value.icon === "sparkle" ? "sparkle" : "arrow"} /></span>
            <h3>{value.title}</h3><p>{value.text}</p>
          </article>)}
        </div>
      </div>
    </section>
  );
}
