import type { Metadata } from "next";
import { AdminPanel } from "../../components/admin/admin-panel";
import "../admin.css";

export const metadata: Metadata = {
  title: "مدیریت سایت | الیتا سوشیال",
  description: "پنل مدیریت محتوای الیتا سوشیال",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
  openGraph: null,
  twitter: null,
};

export default function AdminPage() {
  return <AdminPanel />;
}
