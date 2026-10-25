import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { getSiteSettings } from "@/server/settings";
import { SiteSettingsProvider } from "@/components/site-settings-provider";
import { SitePreloader } from "@/components/site-preloader";
import "./globals.css";
import "./sections.css";
import "./portfolio.css";
import "./pricing.css";
import "./closing.css";
import "./services.css";
import "./magazine.css";
import "./article.css";
import "./admin.css";
import "./preloader.css";
import "./atmosphere.css";
import "./hero-ornament.css";
import "./pricing-page.css";
import "./editorial-heroes.css";
import "./brand-logo.css";

const estedad = localFont({ src: "../../public/fonts/Estedad-Variable.woff2", variable: "--font-estedad", display: "swap", weight: "100 900" });

export async function generateMetadata(): Promise<Metadata> {
  const { seo, home: { brand } } = await getSiteSettings();
  return {
    title: seo.title,
    description: seo.description,
    applicationName: brand.latinName,
    robots: { index: false, follow: false },
    openGraph: { title: seo.title, description: seo.description, locale: "fa_IR", type: "website" },
  };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f7f7fc" };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSiteSettings();
  return <html lang="fa" dir="rtl"><body className={estedad.variable}><SiteSettingsProvider settings={settings}><SitePreloader />{children}</SiteSettingsProvider></body></html>;
}
