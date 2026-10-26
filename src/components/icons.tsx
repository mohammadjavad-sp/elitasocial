import type { SVGProps } from "react";

type IconName = "arrow" | "instagram" | "website" | "phone" | "sparkle" | "menu" | "close" | "telegram" | "whatsapp" | "bale" | "eitaa" | "rubika" | "email" | "moon" | "sun";
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
      {name === "whatsapp" && <><path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.5L3 21l1.7-4.8A8.5 8.5 0 1 1 20.5 11.7Z" /><path d="m8 7 2 3-1 1a8 8 0 0 0 4 4l1-1 3 2c-.6 1.6-2 1.7-3.5 1-3-1.3-5.3-3.6-6.5-6.5C6.3 9 6.5 7.8 8 7Z" strokeWidth="1.3" /></>}
      {name === "bale" && <><path d="M21 11.5A9 9 0 0 1 8 19.6L3 21l1.4-5A9 9 0 1 1 21 11.5Z" /><path d="m7.5 11.5 3 3 6-6" strokeWidth="2.2" /></>}
      {name === "eitaa" && <><path d="M20.5 12A8.5 8.5 0 0 1 8 19.5L3 21l1.5-5A8.5 8.5 0 1 1 20.5 12Z" /><path d="M16.5 8.6c-1.4-2.2-5-2.1-7 .2-1.7 2-1.5 5.2.5 6.6 2.1 1.5 4.7.4 5.7-1.5M7.5 13.2l9-4.6M8.5 17l9-4.7" /></>}
      {name === "rubika" && <><path d="m12 2 9 5v10l-9 5-9-5V7l9-5Z" /><path d="m12 7 4.5 2.5v5L12 17l-4.5-2.5v-5L12 7ZM3 7l4.5 2.5m9 0L21 7m-9-5v5m0 10v5m-9-5 4.5-2.5m9 0L21 17M7.5 9.5l4.5 2.6 4.5-2.6M12 12.1V17" /></>}
      {name === "email" && <><rect x="2.5" y="4.5" width="19" height="15" rx="3" /><path d="m3.5 6 7 5.4a2.5 2.5 0 0 0 3 0L20.5 6" /></>}
      {name === "moon" && <path d="M20.6 14.2A8.7 8.7 0 0 1 9.8 3.4a8.8 8.8 0 1 0 10.8 10.8Z" />}
      {name === "sun" && <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4m0-14.2-1.4 1.4M6.3 17.7l-1.4 1.4" /></>}
    </svg>
  );
}
