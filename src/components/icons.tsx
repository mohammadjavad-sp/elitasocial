import type { SVGProps } from "react";

type IconName = "arrow" | "instagram" | "website" | "phone" | "sparkle" | "menu" | "close" | "telegram";
export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {name === "arrow" && <><path d="M18 6 6 18M6 6v12h12" /></>}
      {name === "instagram" && <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.5 6.5h.01" /></>}
      {name === "website" && <><rect x="2" y="4" width="20" height="16" rx="3" /><path d="M2 9h20M6 6.5h.01M9 6.5h.01M10 13l-2 2 2 2M14 13l2 2-2 2" /></>}
      {name === "phone" && <path d="m7 3 3 5-2 2c1.3 2.7 3.3 4.7 6 6l2-2 5 3c0 3-2 5-5 4C8 19 5 16 3 8 2 5 4 3 7 3Z" />}
      {name === "sparkle" && <path d="m12 2 2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2Z" />}
      {name === "menu" && <><path d="M4 6h16M4 12h16M4 18h16" /></>}
      {name === "close" && <><path d="m6 6 12 12M18 6 6 18" /></>}
      {name === "telegram" && <><path d="m21 3-4 18-6-6-4 3 1-7L21 3ZM8 11l9-5-6 9" /><path d="m3 10 18-7" /></>}
    </svg>
  );
}
