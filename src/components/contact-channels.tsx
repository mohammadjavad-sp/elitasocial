import type { SiteSettings } from "@/lib/site-settings";
import { sitePath } from "@/lib/site-path";
import { Icon } from "./icons";

type Contact = SiteSettings["home"]["contact"];
export type ContactChannel = "whatsapp" | "phone" | "telegram" | "instagram" | "bale" | "eitaa";

const channels: { id: ContactChannel; name: string; action: string }[] = [
  { id: "whatsapp", name: "واتساپ", action: "گفتگو در واتساپ" },
  { id: "phone", name: "تماس", action: "تماس تلفنی" },
  { id: "telegram", name: "تلگرام", action: "گفتگو در تلگرام" },
  { id: "instagram", name: "اینستاگرام", action: "ارتباط در اینستاگرام" },
  { id: "bale", name: "بله", action: "گفتگو در بله" },
  { id: "eitaa", name: "ایتا", action: "گفتگو در ایتا" },
];

export function ContactIcon({ channel }: { channel: ContactChannel }) {
  if (channel === "bale" || channel === "eitaa") {
    return <img className="contact-network-image" src={sitePath(`/images/${channel}.png`)} alt="" aria-hidden="true" width={24} height={24} decoding="async" />;
  }
  return <Icon name={channel} />;
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
      const external = channel.id !== "phone";
      const accessibleName = external ? `${channel.action} (پنجرهٔ جدید)` : `${channel.action}، ${contact.phoneLabel}`;
      return <a className={`contact-channel-link channel-${channel.id}`} key={channel.id} href={contact[channel.id]} aria-label={accessibleName} title={accessibleName}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} onClick={onNavigate}>
        <span className="contact-link-icon"><ContactIcon channel={channel.id} /></span><span>{channel.name}</span>
      </a>;
    })}
  </div>;
}
