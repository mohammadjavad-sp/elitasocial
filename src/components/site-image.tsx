import NextImage, { type ImageProps } from "next/image";
import manifest from "@/lib/image-manifest.json";
import { sitePath } from "@/lib/site-path";

type Variant = { width: number; src: string };
type Asset = { width: number; height: number; avif: Variant[]; webp: Variant[] };
const assets: Record<string, Asset> = manifest;
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

/** Responsive bundled images work on static hosting as well as the Node server.
 * Uploaded CMS images retain Next's normal optimizer and remote-source policy.
 * A picture has no layout box, so the image keeps its existing sizing and crop.
 */
export default function SiteImage(props: ImageProps) {
  const src = typeof props.src === "string" ? props.src : "";
  const local = basePath && src.startsWith(`${basePath}/`) ? src.slice(basePath.length) : src;
  const asset = assets[local];
  if (!asset || props.loader || props.overrideSrc) return <NextImage {...props} />;

  const srcSet = (variants: Variant[]) => variants.map(variant => `${sitePath(variant.src)} ${variant.width}w`).join(", ");
  const eager = Boolean(props.preload || props.priority);
  return <picture style={{ display: "contents", borderRadius: "inherit" }}>
    {asset.avif.length > 0 && <source type="image/avif" srcSet={srcSet(asset.avif)} sizes={props.sizes} />}
    <source type="image/webp" srcSet={srcSet(asset.webp)} sizes={props.sizes} />
    <NextImage {...props} unoptimized preload={false} priority={false}
      loading={props.loading ?? (eager ? "eager" : "lazy")}
      fetchPriority={props.fetchPriority ?? (eager ? "high" : undefined)} />
  </picture>;
}
