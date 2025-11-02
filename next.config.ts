// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ไม่หยุด build แม้มี lint error
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ไม่หยุด build แม้มี type error
    ignoreBuildErrors: true,
  },
};

export default nextConfig;