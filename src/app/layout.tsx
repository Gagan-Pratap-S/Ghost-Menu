import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "Ghost Menu",
  description: "Smart QR-based restaurant menu system.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f97316",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <meta charSet="utf-8" />
        {/* Preconnect to image CDNs to reduce first-image load time */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        {/* Preconnect to Supabase if configured */}
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
        )}
      </head>
      <body className="bg-stone-50 text-stone-900 min-h-screen antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
