import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { getSiteSettings } from "@/server/settings";
import { SiteSettingsProvider } from "@/components/site-settings-provider";
import { SitePreloader } from "@/components/site-preloader";
import { FloatingContact } from "@/components/floating-contact";
import { ThemeProvider } from "@/components/theme-provider";
import { themeBootstrapScript } from "@/lib/theme";
import { preloaderBootstrapScript } from "@/lib/preloader";
import { getSeoConfig, indexingMetadata } from "@/lib/seo";
import "./globals.css";
import "./sections.css";
import "./portfolio.css";
import "./pricing.css";
import "./closing.css";
import "./services.css";
import "./magazine.css";
import "./article.css";
import "./preloader.css";
import "./atmosphere.css";
import "./hero-ornament.css";
import "./pricing-page.css";
import "./editorial-heroes.css";
import "./brand-logo.css";
import "./gentle-motion.css";
import "./interactions.css";
import "./contact-channels.css";
import "./dark-tokens.css";
import "./dark-home.css";
import "./dark-pages.css";
import "./theme-toggle.css";
import "./floating-contact.css";

const peyda = localFont({
  src: [
    { path: "../../public/fonts/peyda/Peyda-Thin.woff2", weight: "100", style: "normal" },
    { path: "../../public/fonts/peyda/Peyda-ExtraLight.woff2", weight: "200", style: "normal" },
    { path: "../../public/fonts/peyda/Peyda-Light.woff2", weight: "300", style: "normal" },
    { path: "../../public/fonts/peyda/Peyda-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/peyda/Peyda-Medium.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/peyda/Peyda-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../../public/fonts/peyda/Peyda-Bold.woff2", weight: "700", style: "normal" },
    { path: "../../public/fonts/peyda/Peyda-ExtraBold.woff2", weight: "800", style: "normal" },
    { path: "../../public/fonts/peyda/Peyda-Black.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-peyda",
  display: "swap",
  preload: false,
});

export async function generateMetadata(): Promise<Metadata> {
  const { seo, home: { brand } } = await getSiteSettings();
  return {
    metadataBase: getSeoConfig().siteUrl,
    title: seo.title,
    description: seo.description,
    applicationName: brand.latinName,
    robots: indexingMetadata(),
  };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSiteSettings();
  return <html lang="fa" dir="rtl" data-theme="light" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} /><script dangerouslySetInnerHTML={{ __html: preloaderBootstrapScript }} /><noscript><style>{".theme-toggle{display:none!important}"}</style></noscript></head><body className={peyda.variable}><ThemeProvider><SiteSettingsProvider settings={settings}><SitePreloader />{children}<FloatingContact /></SiteSettingsProvider></ThemeProvider></body></html>;
}
