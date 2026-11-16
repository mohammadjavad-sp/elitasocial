import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { AboutSection, ServicesSection } from "@/components/home-sections";
import { PortfolioInvitationSection } from "@/components/portfolio-preview";
import { PricingSection } from "@/components/pricing-section";
import { FrequentlyAskedSection } from "@/components/frequently-asked-section";
import { InsightsSection } from "@/components/insights-section";
import { SiteFooter } from "@/components/site-footer";
import { getNavigation } from "@/content/home";
import { getCmsContent } from "@/server/content";
import { getSiteSettings } from "@/server/settings";
import { createPageMetadata } from "@/lib/seo";
import { StructuredData } from "@/components/structured-data";
import { brandStructuredData } from "@/lib/structured-data";

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
        <StructuredData data={brandStructuredData(settings)} />
        <Hero />
        <div className="home-continuation">
          <AboutSection />
          <PortfolioInvitationSection />
          <PricingSection pricing={content.pricing} />
          <ServicesSection items={content.services} />
          <InsightsSection articles={content.articles} />
          <FrequentlyAskedSection />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
