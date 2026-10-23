/** Data sent between the administration interface and its authenticated API. */
export const cmsCollections = ["articles", "services", "portfolio", "plans"] as const;
export type CmsCollection = typeof cmsCollections[number];
export type CmsStatus = "draft" | "published";

export type CmsRecord = {
  id: string;
  collection: CmsCollection;
  status: CmsStatus;
  data: Record<string, unknown>;
  revision: number;
  createdAt: string;
  updatedAt: string;
};

export type CmsMedia = {
  id: string;
  url: string;
  alt: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

export type CmsSession = {
  user: { id: string; email: string; name: string };
  csrfToken: string;
};

export const cmsCollectionLabels: Record<CmsCollection, string> = {
  articles: "مقاله‌ها",
  services: "خدمات",
  portfolio: "نمونه‌کارها",
  plans: "پلن‌ها و قیمت‌ها",
};
