"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function QRPage() {
  const router = useRouter();
  const { session, restaurant, loading } = useAuth();
  const [copied, setCopied] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !session) router.replace("/admin/login?next=/admin/qr");
  }, [session, loading, router]);

  if (loading || !session) return null;

  const slug    = restaurant?.slug ?? "";
  const name    = restaurant?.name ?? "Ghost Menu";

  // Use NEXT_PUBLIC_APP_URL if set (production), fall back to window.location.origin
  // This ensures QR codes always point to the canonical domain, not a preview URL
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (typeof window !== "undefined" ? window.location.origin : "https://your-domain.com");

  const menuUrl = `${baseUrl}/menu/${slug}`;
  const qrUrl   = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(menuUrl)}&bgcolor=ffffff&color=1c1917&qzone=2`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(menuUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 z-10 bg-white border-b border-stone-100 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <a href="/admin" className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors flex-shrink-0" aria-label="Back">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <div>
            <h1 className="font-display font-bold text-stone-900 text-base">QR Code</h1>
            <p className="text-xs text-stone-400">{name}</p>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        <div ref={printRef} className="bg-white rounded-3xl border border-stone-100 shadow-sm p-8 flex flex-col items-center text-center print:shadow-none print:border-none">
          <p className="font-display font-bold text-stone-900 text-xl mb-1">{name}</p>
          <p className="text-xs text-stone-400 mb-6">Scan to view our menu</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrUrl} alt={`QR code for ${name}`} width={220} height={220} className="rounded-2xl border border-stone-100" />
          <p className="text-xs text-stone-400 mt-5 break-all max-w-[240px] leading-relaxed">{menuUrl}</p>
          <div className="flex items-center gap-2 mt-4">
            <div className="w-6 h-6 bg-orange-500 rounded-md flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs">🍽️</span>
            </div>
            <span className="text-xs text-stone-500 font-medium">Ghost Menu</span>
          </div>
        </div>

        {/* Environment notice */}
        {!process.env.NEXT_PUBLIC_APP_URL && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3">
            <p className="text-xs text-amber-700">
              <strong>Note:</strong> QR code is using the current browser URL. Set <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_APP_URL</code> in your <code className="bg-amber-100 px-1 rounded">.env.local</code> to lock it to your production domain.
            </p>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-stone-500 mb-2">Menu URL</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs text-stone-700 bg-stone-50 rounded-xl px-3 py-2 truncate border border-stone-200">{menuUrl}</code>
            <button onClick={handleCopy} className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              copied ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 hover:bg-stone-200 text-stone-700"
            }`}>
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 space-y-2.5">
          <p className="font-display font-bold text-sm text-orange-900">📱 Deployment steps</p>
          <ol className="space-y-2">
            {[
              "Deploy to Vercel: run `vercel` in your project folder (free tier works fine)",
              `Set NEXT_PUBLIC_APP_URL=https://your-app.vercel.app in Vercel environment variables`,
              "Come back to this page — the QR code will use your live domain automatically",
              "Print and place on tables — customers scan to land on the menu",
            ].map((step, i) => (
              <li key={i} className="flex gap-2.5 text-xs text-orange-800">
                <span className="flex-shrink-0 w-4 h-4 bg-orange-200 text-orange-800 rounded-full flex items-center justify-center font-bold text-[10px]">{i + 1}</span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex gap-3">
          <button onClick={() => window.print()} className="flex-1 py-3.5 bg-stone-900 hover:bg-stone-800 active:bg-stone-950 text-white font-display font-bold rounded-2xl text-sm transition-colors shadow-md flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print QR
          </button>
          <a href={menuUrl} target="_blank" rel="noopener noreferrer" className="flex-1 py-3.5 bg-orange-500 hover:bg-orange-400 text-white font-display font-bold rounded-2xl text-sm transition-colors shadow-md flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Preview Menu
          </a>
        </div>
      </div>
    </div>
  );
}
