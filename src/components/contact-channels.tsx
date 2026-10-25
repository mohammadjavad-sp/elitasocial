import type { SiteSettings } from "@/lib/site-settings";
import { Icon } from "./icons";

type Contact = SiteSettings["home"]["contact"];
export type ContactChannel = "whatsapp" | "phone" | "telegram" | "instagram" | "bale" | "eitaa" | "rubika" | "email";

const channels: { id: ContactChannel; name: string; action: string }[] = [
  { id: "whatsapp", name: "واتساپ", action: "گفتگو در واتساپ" },
  { id: "phone", name: "تماس", action: "تماس تلفنی" },
  { id: "telegram", name: "تلگرام", action: "گفتگو در تلگرام" },
  { id: "instagram", name: "اینستاگرام", action: "ارتباط در اینستاگرام" },
  { id: "bale", name: "بله", action: "گفتگو در بله" },
  { id: "eitaa", name: "ایتا", action: "گفتگو در ایتا" },
  { id: "rubika", name: "روبیکا", action: "گفتگو در روبیکا" },
  { id: "email", name: "جیمیل", action: "ارسال ایمیل" },
];

export function ContactIcon({ channel }: { channel: ContactChannel }) {
  return <Icon name={channel} />;
}

export function contactEmailHref(address: string) {
  return `mailto:${encodeURIComponent(address).replace(/%40/gi, "@")}`;
}

type Props = {
  contact: Contact;
  includeWhatsapp?: boolean;
  className?: string;
  tone?: "default" | "light";
  compact?: boolean;
  label?: string;
  onNavigate?: () => void;
};

/** Explicit links keep every channel usable with or without JavaScript. */
export function ContactChannels({ contact, includeWhatsapp = true, className = "", tone = "default", compact = false, label = "انتخاب راه ارتباط", onNavigate }: Props) {
  return <div className={`contact-channels contact-channels-${tone}${compact ? " contact-channels-compact" : ""} ${className}`.trim()} role="group" aria-label={label}>
    {channels.filter(channel => includeWhatsapp || channel.id !== "whatsapp").map(channel => {
      const contents = <><span className="contact-link-icon"><ContactIcon channel={channel.id} /></span><span className="contact-channel-name">{channel.name}</span></>;
      if (channel.id === "rubika" && !contact.rubika) {
        return <span className="contact-channel-link channel-rubika contact-channel-pending" key={channel.id} title="روبیکا">{contents}</span>;
      }
      const external = channel.id !== "phone" && channel.id !== "email";
      const accessibleName = external ? `${channel.action} (پنجرهٔ جدید)` : channel.id === "email" ? `${channel.action} به ${contact.email}` : `${channel.action}، ${contact.phoneLabel}`;
      const href = channel.id === "email" ? contactEmailHref(contact.email) : contact[channel.id];
      return <a className={`contact-channel-link channel-${channel.id}`} key={channel.id} href={href} aria-label={accessibleName} title={accessibleName}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} onClick={onNavigate}>
        {contents}
      </a>;
    })}
  </div>;
}
