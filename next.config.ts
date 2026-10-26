import type { NextConfig } from "next";

const githubPages = process.env.DEPLOY_TARGET === "github-pages";
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");
const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: { root: process.cwd() },
  outputFileTracingRoot: process.cwd(),
  outputFileTracingExcludes: {
    "/*": ["./.env*", "./.data/**/*", "./backups/**/*", "./artifacts/**/*", "./.git/**/*"],
  },
  basePath,
  pageExtensions: githubPages ? ["tsx", "ts", "jsx", "js"] : ["server.tsx", "server.ts", "tsx", "ts", "jsx", "js"],
  env: { NEXT_PUBLIC_CMS_ENABLED: githubPages ? "false" : "true" },
  output: githubPages ? "export" : undefined,
  trailingSlash: githubPages,
  images: {
    formats: ["image/avif", "image/webp"],
    unoptimized: githubPages,
    // Only bundled images and validated public CMS media may reach the optimizer.
    localPatterns: [
      { pathname: `${basePath}/images/**`, search: "" },
      { pathname: `${basePath}/api/cms/files/**`, search: "" },
    ],
    maximumRedirects: 0,
    dangerouslyAllowSVG: false,
  },
  // GitHub Pages controls its own HTTP headers. These apply to the Node release.
  ...(githubPages ? {} : {
    async headers() {
      return [
        {
          source: "/:path*",
          headers: [
            { key: "X-Content-Type-Options", value: "nosniff" },
            { key: "X-Frame-Options", value: "DENY" },
            { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
            { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
            { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
            // Keep Next hydration and inline theme styles compatible; these
            // directives protect framing, base URLs, objects and form targets.
            { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self' https://formsubmit.co" },
            ...(process.env.NODE_ENV === "production" ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }] : []),
          ],
        },
        {
          source: "/images/responsive/:path*",
          headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
        },
      ];
    },
  }),
};

export default nextConfig;
