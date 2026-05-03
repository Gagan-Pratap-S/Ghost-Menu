import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.supabase.in" },
      { protocol: "https", hostname: "**" },
    ],
    deviceSizes: [390, 640, 750, 828, 1080],
    imageSizes: [32, 48, 64, 128, 256],
  },
  compress: true,
  reactStrictMode: true,
  // qr-scanner uses browser APIs — exclude from server bundle
  serverExternalPackages: ["qr-scanner"],
};

export default nextConfig;
