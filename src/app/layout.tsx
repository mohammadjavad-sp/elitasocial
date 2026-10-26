import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { getSiteSettings } from "@/server/settings";
import { SiteSettingsProvider } from "@/components/site-settings-provider";
import { SitePreloader } from "@/components/site-preloader";
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

const estedad = localFont({ src: "../../public/fonts/Estedad-Variable.woff2", variable: "--font-estedad", display: "swap", weight: "100 900" });

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
  return <html lang="fa" dir="rtl" data-theme="light" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} /><script dangerouslySetInnerHTML={{ __html: preloaderBootstrapScript }} /><noscript><style>{".theme-toggle{display:none!important}"}</style></noscript></head><body className={estedad.variable}><ThemeProvider><SiteSettingsProvider settings={settings}><SitePreloader />{children}</SiteSettingsProvider></ThemeProvider></body></html>;
}
