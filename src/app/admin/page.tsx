import type { Metadata } from "next";
import { AdminPanel } from "../../components/admin/admin-panel";

export const metadata: Metadata = {
  title: "مدیریت سایت | الیتا سوشال",
  description: "پنل مدیریت محتوای الیتا سوشال",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminPanel />;
}
