import type { NextConfig } from "next";

const githubPages = process.env.DEPLOY_TARGET === "github-pages";
const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: { root: process.cwd() },
  outputFileTracingRoot: process.cwd(),
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  pageExtensions: githubPages ? ["tsx", "ts", "jsx", "js"] : ["server.tsx", "server.ts", "tsx", "ts", "jsx", "js"],
  env: { NEXT_PUBLIC_CMS_ENABLED: githubPages ? "false" : "true" },
  output: githubPages ? "export" : undefined,
  trailingSlash: githubPages,
  images: { formats: ["image/avif", "image/webp"], unoptimized: githubPages },
};

export default nextConfig;
