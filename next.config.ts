import type { NextConfig } from "next";

const githubPages = process.env.DEPLOY_TARGET === "github-pages";
const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: { root: process.cwd() },
  outputFileTracingRoot: process.cwd(),
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  output: githubPages ? "export" : undefined,
  trailingSlash: githubPages,
  images: { formats: ["image/avif", "image/webp"], unoptimized: githubPages },
};

export default nextConfig;
