import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "static-production.bakesy.app" },
      { protocol: "https", hostname: "*.up.railway.app" },
    ],
    unoptimized: process.env.NODE_ENV === "production",
  },
};

export default nextConfig;
