import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Unsplash (seed data + demo images)
      { protocol: "https", hostname: "images.unsplash.com" },
      // Supabase storage buckets
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.supabase.in" },
      // Allow any https hostname so admins can paste any image URL
      // Restrict to https only — no http allowed
      { protocol: "https", hostname: "**" },
    ],
    // Limit image sizes that Next.js generates to reduce build output
    deviceSizes: [390, 640, 750, 828, 1080],
    imageSizes: [32, 48, 64, 128, 256],
  },
  // Compress responses
  compress: true,
  // Strict mode catches double-render issues in dev
  reactStrictMode: true,
};

export default nextConfig;
