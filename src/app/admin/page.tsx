import type { Metadata } from "next";
import { AdminPanel } from "../../components/admin/admin-panel";

export const metadata: Metadata = {
  title: "مدیریت سایت | الیتا سوشیال",
  description: "پنل مدیریت محتوای الیتا سوشیال",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminPanel />;
}
