import { PortfolioGallery } from "./portfolio-gallery";
import { Icon } from "./icons";
import { sitePath } from "@/lib/site-path";
import { portfolioProjects, type PortfolioProject } from "@/content/portfolio";
import { getSiteSettings } from "@/server/settings";

export async function FeaturedPortfolioSection({ projects = portfolioProjects }: { projects?: PortfolioProject[] }) {
  const { sections } = await getSiteSettings();
  return <section className="featured-portfolio container" id="portfolio" aria-labelledby="featured-portfolio-heading">
    <div className="portfolio-section-heading"><div><h2 id="featured-portfolio-heading">{sections.portfolioTitle}</h2><p>{sections.portfolioDescription}</p></div><a className="portfolio-all-link" href={sitePath("/portfolio/")}>{sections.portfolioActionLabel} <Icon name="arrow" /></a></div>
    <PortfolioGallery featured projects={projects} />
  </section>;
}
