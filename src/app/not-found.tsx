import type { Metadata } from "next";
import { Icon } from "@/components/icons";
import { sitePath } from "@/lib/site-path";

export const metadata: Metadata = {
  title: "صفحه پیدا نشد | الیتاسوشیال",
  description: "این صفحه در دسترس نیست؛ به صفحهٔ اصلی الیتاسوشیال برگردید.",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
  openGraph: null,
  twitter: null,
};

export default function NotFound() {
  return (
    <main className="not-found-page container">
      <p className="eyebrow"><Icon name="sparkle" />خطای ۴۰۴</p>
      <h1>این صفحه پیدا نشد</h1>
      <p className="not-found-description">ممکن است نشانی تغییر کرده باشد. از صفحهٔ اصلی، مسیرت را دوباره پیدا کن.</p>
      <a className="pill-button" href={sitePath("/")}>بازگشت به صفحهٔ اصلی<span className="button-circle"><Icon name="arrow" /></span></a>
    </main>
  );
}
