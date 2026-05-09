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
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--gm-bg)" }}>
      <div style={{ width: 32, height: 32, border: "2.5px solid var(--gm-border)", borderTopColor: "var(--gm-primary)", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
    </div>
  );

  const slug    = restaurant?.slug ?? "cafe-delight";
  const name    = restaurant?.name ?? "Cafe Delight";
  const baseUrl = typeof window !== "undefined" ? `${window.location.protocol}//${window.location.host}` : "https://your-domain.com";
  const menuUrl = `${baseUrl}/menu/${slug}`;
  const qrUrl   = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(menuUrl)}&bgcolor=FFFFFF&color=1A1A1A&qzone=2`;

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(menuUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch {}
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--gm-bg)" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 10, background: "var(--gm-surface)", borderBottom: "1px solid var(--gm-border)", boxShadow: "var(--gm-shadow-sm)" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "12px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/admin" style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, border: "1px solid var(--gm-border)", background: "var(--gm-bg)", color: "var(--gm-text-secondary)", textDecoration: "none", flexShrink: 0 }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 600, color: "var(--gm-text)", margin: 0 }}>QR Code</h1>
            <p style={{ fontSize: 12, color: "var(--gm-text-tertiary)", margin: 0 }}>{name}</p>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* QR card */}
        <div className="gm-card" style={{ padding: 40, textAlign: "center" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--gm-text)", marginBottom: 4 }}>{name}</h2>
          <p style={{ fontSize: 13, color: "var(--gm-text-secondary)", marginBottom: 24 }}>Scan to view our menu</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrUrl} alt={`QR code for ${name}`} width={220} height={220} style={{ borderRadius: 16, border: "1px solid var(--gm-border)" }} />
          <p style={{ fontSize: 12, color: "var(--gm-text-tertiary)", marginTop: 16, wordBreak: "break-all" }}>{menuUrl}</p>
        </div>

        {/* URL copy */}
        <div className="gm-card" style={{ padding: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--gm-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Menu URL</p>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <code style={{ flex: 1, fontSize: 12, background: "var(--gm-bg)", borderRadius: 10, padding: "10px 14px", border: "1px solid var(--gm-border)", color: "var(--gm-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{menuUrl}</code>
            <button className="gm-btn-secondary" style={{ height: 40, fontSize: 13, flexShrink: 0, padding: "0 16px" }} onClick={handleCopy}>
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
        </div>

        {/* Deploy steps */}
        <div style={{ background: "#FFF7ED", border: "1px solid #FDBA74", borderRadius: 20, padding: 20 }}>
          <p style={{ fontWeight: 600, fontSize: 14, color: "#C2410C", marginBottom: 12 }}>📱 Deploy & Test</p>
          <ol style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              "Run `vercel` in your project folder — deploys in ~2 minutes (free tier)",
              "Your URL becomes: https://your-app.vercel.app/menu/" + slug,
              "Return here — QR updates automatically to your live URL",
              "Print QR and place on tables — customers scan to order",
              "Watch orders arrive live in the Orders tab",
            ].map((step, i) => (
              <li key={i} style={{ display: "flex", gap: 10, fontSize: 13, color: "#92400E" }}>
                <span style={{ flexShrink: 0, width: 20, height: 20, borderRadius: "50%", background: "rgba(223,88,48,0.15)", color: "#C2410C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>{i+1}</span>
                <span style={{ lineHeight: 1.5 }}>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 12 }}>
          <button className="gm-btn-secondary" style={{ flex: 1 }} onClick={() => window.print()}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print QR
          </button>
          <a href={slug ? menuUrl : "#"} target="_blank" rel="noopener noreferrer" className="gm-btn-primary" style={{ flex: 1, textDecoration: "none" }}>
            Preview Menu ↗
          </a>
        </div>
      </div>
    </div>
  );
}
