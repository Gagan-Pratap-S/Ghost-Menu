import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.supabase.in" },
      { protocol: "https", hostname: "*.cloudinary.com" },
      { protocol: "https", hostname: "*.imgix.net" },
      { protocol: "https", hostname: "*.amazonaws.com" },
      // Removed catch-all "**" — only trusted CDN domains are allowed
    ],
    deviceSizes: [390, 640, 750, 828, 1080],
    imageSizes: [32, 48, 64, 128, 256],
  },
  compress: true,
  reactStrictMode: true,
  serverExternalPackages: ["qr-scanner"],
};

export default nextConfig;
