import type { ReactNode } from "react";
import { articles } from "@/content/articles";

// Node requests read current CMS content instead of entering static fallback.
export function generateStaticParams() {
  return articles.map(({ slug }) => ({ slug }));
}

export default function StaticArticleLayout({ children }: { children: ReactNode }) {
  return children;
}
