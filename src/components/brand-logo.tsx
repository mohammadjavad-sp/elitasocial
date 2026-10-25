import Image from "next/image";
import { sitePath } from "@/lib/site-path";

type Props = { name: string; priority?: boolean; className?: string };

/** The supplied wordmark keeps the same proportions in every site entry point. */
export function BrandLogo({ name, priority = false, className = "" }: Props) {
  return <Image className={`brand-logo ${className}`.trim()} src={sitePath("/images/elita-social-logo-thin.webp")} alt={name} width={1200} height={767} sizes="(max-width: 599px) 112px, 124px" priority={priority} />;
}
