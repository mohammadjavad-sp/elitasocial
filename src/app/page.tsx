import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { AboutSection, ServicesSection } from "@/components/home-sections";
import { ApproachSection } from "@/components/approach-section";
import { BenefitsSection } from "@/components/benefits-section";
import { FeaturedPortfolioSection } from "@/components/portfolio-preview";
import { PricingSection } from "@/components/pricing-section";
import { TestimonialsSection, InsightsSection, ContactSection } from "@/components/closing-sections";
import { SiteFooter } from "@/components/site-footer";
import { homeContent, getNavigation } from "@/content/home";

export default function Home() {
  return (
    <div className="home-shell">
      <a className="skip-link" href="#main-content">رفتن به محتوای اصلی</a>
      <div className="ambient-orb" aria-hidden="true" />
      <Header navigation={getNavigation()} whatsapp={homeContent.contact.whatsapp} />
      <main id="main-content">
        <Hero />
        <div className="home-continuation">
          <AboutSection />
          <ServicesSection />
          <ApproachSection />
          <BenefitsSection content={homeContent.benefits} />
          <FeaturedPortfolioSection />
          <PricingSection />
          <TestimonialsSection />
          <InsightsSection />
          <ContactSection />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
