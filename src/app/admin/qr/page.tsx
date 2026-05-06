"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function QRPage() {
  const router = useRouter();
  const { session, restaurant, loading } = useAuth();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!loading && !session) router.replace("/admin/login?next=/admin/qr");
  }, [session, loading, router]);

  if (loading || !session) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg)" }}>
      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const slug    = restaurant?.slug ?? "cafe-delight";
  const name    = restaurant?.name ?? "Cafe Delight";
  const baseUrl = typeof window !== "undefined" ? `${window.location.protocol}//${window.location.host}` : "https://your-domain.com";
  const menuUrl = `${baseUrl}/menu/${slug}`;
  const qrUrl   = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(menuUrl)}&bgcolor=0f172a&color=f1f5f9&qzone=2`;

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(menuUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch {}
  };

  const glass = { background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.06)" };

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      {/* Atmospheric glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-64 rounded-full" style={{ background: "radial-gradient(circle, rgba(249,115,22,0.05) 0%, transparent 70%)" }} />
      </div>

      <header className="sticky top-0 z-10" style={{ background: "rgba(2,6,23,0.9)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <a href="/admin"
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-white transition-colors flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <div>
            <h1 className="font-display font-bold text-white text-base tracking-tight">QR Code</h1>
            <p className="text-xs text-slate-600">{name}</p>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6 space-y-4 relative z-10">
        {/* QR card */}
        <div className="rounded-3xl p-8 flex flex-col items-center text-center" style={glass}>
          <p className="font-display font-extrabold text-white text-xl mb-1 tracking-tight">{name}</p>
          <p className="text-xs text-slate-600 mb-6">Scan to view our menu</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrUrl} alt={`QR code for ${name}`} width={220} height={220} className="rounded-2xl" style={{ border: "1px solid rgba(255,255,255,0.06)" }} />
          <p className="text-xs text-slate-700 mt-5 break-all max-w-[240px] leading-relaxed">{menuUrl}</p>
          <div className="flex items-center gap-2 mt-4">
            <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: "#f97316" }}>
              <span className="text-white text-xs">🍽️</span>
            </div>
            <span className="text-xs text-slate-500 font-medium">Ghost Menu</span>
          </div>
        </div>

        {/* URL copy */}
        <div className="rounded-2xl p-4" style={glass}>
          <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Menu URL</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs text-slate-400 rounded-xl px-3 py-2 truncate" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
              {menuUrl}
            </code>
            <button onClick={handleCopy}
              className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all"
              style={copied
                ? { background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ade80" }
                : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8" }
              }
            >{copied ? "Copied ✓" : "Copy"}</button>
          </div>
        </div>

        {/* Deploy steps */}
        <div className="rounded-2xl p-4" style={{ background: "rgba(249,115,22,0.05)", border: "1px solid rgba(249,115,22,0.12)" }}>
          <p className="font-display font-bold text-sm text-orange-300 mb-3">📱 Deploy & Test</p>
          <ol className="space-y-2">
            {[
              "Run `vercel` in your project folder — deploys in ~2 minutes (free tier)",
              "Your URL becomes: https://your-app.vercel.app/menu/" + slug,
              "Return here — QR updates automatically to your live URL",
              "Print QR and place on tables — customers scan to order",
              "Watch orders arrive live in the Orders tab",
            ].map((step, i) => (
              <li key={i} className="flex gap-2.5 text-xs text-orange-200/60">
                <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center font-bold text-[10px]"
                  style={{ background: "rgba(249,115,22,0.2)", color: "#fb923c" }}
                >{i+1}</span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={() => window.print()}
            className="flex-1 py-3.5 font-display font-bold rounded-2xl text-sm text-white transition-colors flex items-center justify-center gap-2"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print QR
          </button>
          <a href={menuUrl} target="_blank" rel="noopener noreferrer"
            className="btn-primary flex-1 py-3.5 text-sm flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Preview
          </a>
        </div>
      </div>
    </div>
  );
}
