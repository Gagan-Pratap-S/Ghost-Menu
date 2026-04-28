import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ghost Menu - Smart Restaurant QR System",
  description: "Smart QR-based restaurant menu system. Fast, responsive, mobile-first.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#f97316" />
      </head>
      <body className="bg-white text-stone-900 min-h-screen antialiased font-sans">
        <div className="mx-auto max-w-md">
          {children}
        </div>
      </body>
    </html>
  );
}