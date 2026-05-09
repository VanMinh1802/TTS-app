import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages: remove standalone for edge deployment
  // output: "standalone",
  experimental: {
    optimizePackageImports: ["@phosphor-icons/react", "framer-motion"],
  },
};

export default nextConfig;
import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
