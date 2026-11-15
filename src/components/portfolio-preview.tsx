import { PortfolioInvitation } from "./portfolio-invitation";
import { getSiteSettings } from "@/server/settings";

export async function PortfolioInvitationSection() {
  const { sections } = await getSiteSettings();
  return <PortfolioInvitation title={sections.portfolioTitle} description={sections.portfolioDescription} actionLabel={sections.portfolioActionLabel} />;
}
