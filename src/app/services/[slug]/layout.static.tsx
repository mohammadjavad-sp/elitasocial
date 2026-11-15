import type { ReactNode } from "react";
import { services } from "@/content/services";

// Only the GitHub Pages build includes .static.tsx route files.
export function generateStaticParams() {
  return services.map(({ slug }) => ({ slug }));
}

export default function StaticServiceLayout({ children }: { children: ReactNode }) {
  return children;
}
