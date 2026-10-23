import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { AboutSection, ServicesSection } from "@/components/home-sections";
import { ApproachSection } from "@/components/approach-section";
import { BenefitsSection } from "@/components/benefits-section";
import { FeaturedPortfolioSection } from "@/components/portfolio-preview";
import { PricingSection } from "@/components/pricing-section";
import { TestimonialsSection, ContactSection } from "@/components/closing-sections";
import { InsightsSection } from "@/components/insights-section";
import { SiteFooter } from "@/components/site-footer";
import { homeContent, getNavigation } from "@/content/home";
import { getCmsContent } from "@/server/content";

export default async function Home() {
  const content = await getCmsContent();
  return (
    <div className="home-shell">
      <a className="skip-link" href="#main-content">رفتن به محتوای اصلی</a>
      <div className="ambient-orb" aria-hidden="true" />
      <Header navigation={getNavigation()} whatsapp={homeContent.contact.whatsapp} />
      <main id="main-content">
        <Hero />
        <div className="home-continuation">
          <AboutSection />
          <ServicesSection items={content.services} />
          <ApproachSection />
          <BenefitsSection content={homeContent.benefits} />
          <FeaturedPortfolioSection projects={content.portfolio} />
          <PricingSection pricing={content.pricing} />
          <TestimonialsSection />
          <InsightsSection articles={content.articles} />
          <ContactSection pricing={content.pricing} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
