import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./sections.css";
import "./portfolio.css";
import "./pricing.css";
import "./closing.css";
import "./services.css";
import "./magazine.css";
import "./article.css";
import "./admin.css";

const estedad = localFont({ src: "../../public/fonts/Estedad-Variable.woff2", variable: "--font-estedad", display: "swap", weight: "100 900" });

export const metadata: Metadata = {
  title: "الیتا سوشال | مدیریت اینستاگرام و طراحی سایت با الهه طاهری",
  description: "با الهه طاهری در الیتا سوشال، از مدیریت اینستاگرام تا طراحی وب‌سایت همراه برند شما هستیم. برای مشاوره و شروع همکاری در ارتباط باشید.",
  applicationName: "Elita Social",
  robots: { index: false, follow: false },
  openGraph: { title: "الیتا سوشال | حرفه‌ای دیده شو", description: "مدیریت اینستاگرام و طراحی وب‌سایت با الهه طاهری", locale: "fa_IR", type: "website" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f7f7fc" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fa" dir="rtl"><body className={estedad.variable}>{children}</body></html>;
}
