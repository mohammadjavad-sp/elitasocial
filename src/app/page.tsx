import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { AboutSection, ServicesSection } from "@/components/home-sections";
import { ApproachSection } from "@/components/approach-section";
import { BenefitsSection } from "@/components/benefits-section";
import { FeaturedPortfolioSection } from "@/components/portfolio-preview";
import { PricingSection } from "@/components/pricing-section";
import { ContactSection } from "@/components/closing-sections";
import { InsightsSection } from "@/components/insights-section";
import { SiteFooter } from "@/components/site-footer";
import { getNavigation } from "@/content/home";
import { getCmsContent } from "@/server/content";
import { getSiteSettings } from "@/server/settings";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { seo, home: { brand } } = await getSiteSettings();
  return createPageMetadata({
    title: seo.title,
    description: seo.description,
    path: "/",
    siteName: brand.name,
  });
}

export default async function Home() {
  const [content, settings] = await Promise.all([getCmsContent(), getSiteSettings()]);
  return (
    <div className="home-shell">
      <a className="skip-link" href="#main-content">رفتن به محتوای اصلی</a>
      <div className="ambient-orb" aria-hidden="true" />
      <Header navigation={getNavigation()} />
      <main id="main-content">
        <Hero />
        <div className="home-continuation">
          <AboutSection />
          <FeaturedPortfolioSection projects={content.portfolio} />
          <PricingSection pricing={content.pricing} />
          <ServicesSection items={content.services} />
          <ApproachSection />
          <BenefitsSection content={settings.home.benefits} />
          <InsightsSection articles={content.articles} />
          <ContactSection pricing={content.pricing} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
