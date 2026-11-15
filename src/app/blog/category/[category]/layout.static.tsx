import type { ReactNode } from "react";
import { articleCategories } from "@/content/articles";

// Static category URLs are enumerated only for the GitHub Pages export.
export function generateStaticParams() {
  return articleCategories.map(({ slug }) => ({ category: slug }));
}

export default function StaticCategoryLayout({ children }: { children: ReactNode }) {
  return children;
}
