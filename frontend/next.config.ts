import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages: remove standalone for edge deployment
  // output: "standalone",
  experimental: {
    optimizePackageImports: ["@phosphor-icons/react", "framer-motion"],
  },
};

export default nextConfig;

if (process.env.NODE_ENV === 'development') {
  import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
}
