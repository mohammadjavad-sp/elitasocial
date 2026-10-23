/** Consultation information is only returned by the authenticated administration API. */
export const consultationStatuses = ["new", "contacted", "completed", "archived"] as const;
export type ConsultationStatus = typeof consultationStatuses[number];
export const consultationStatusLabels: Record<ConsultationStatus, string> = {
  new: "جدید",
  contacted: "تماس گرفته شده",
  completed: "تکمیل شده",
  archived: "بایگانی شده",
};

export const consultationServiceLabels = {
  undecided: "هنوز مطمئن نیستم",
  instagram: "مدیریت اینستاگرام",
  website: "طراحی وب‌سایت",
  content: "تولید محتوا",
  seo: "سئو و پشتیبانی سایت",
  multiple: "چند خدمت",
} as const;
export type ConsultationService = keyof typeof consultationServiceLabels;
export type ConsultationPlan = {
  id: string;
  categoryId: "instagram" | "website" | "support";
  name: string;
  categoryLabel: string;
  isMock: boolean;
};

export type Consultation = {
  id: string;
  reference: string;
  name: string;
  contact: string;
  contactKind: "phone" | "email";
  service: ConsultationService;
  message: string;
  plan: ConsultationPlan | null;
  status: ConsultationStatus;
  note: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
};

export type ConsultationList = {
  requests: Consultation[];
  counts: Record<ConsultationStatus, number> & { total: number };
  total: number;
  page: number;
  pageSize: number;
};
