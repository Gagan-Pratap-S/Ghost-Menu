"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

interface TableQR {
  table: number;
  url: string;
  qrUrl: string;
  copied: boolean;
}

import AdminBottomNav from "@/components/navigation/AdminBottomNav";

export default function QRPage() {
  const router = useRouter();
  const { session, restaurant, loading } = useAuth();

  const [startTable, setStartTable] = useState(1);
  const [endTable,   setEndTable]   = useState(10);
  const [tableQRs,   setTableQRs]   = useState<TableQR[]>([]);
  const [generated,  setGenerated]  = useState(false);
  const [copiedAll,  setCopiedAll]  = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // single-table copy state
  const [singleCopied, setSingleCopied] = useState(false);

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

  const makeQrUrl = (url: string) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}&bgcolor=FFFFFF&color=1A1A1A&qzone=2`;

  // Single (no table) QR
  const singleQrUrl = makeQrUrl(menuUrl);

  const handleGenerate = () => {
    const from = Math.max(1, Math.min(startTable, 200));
    const to   = Math.max(from, Math.min(endTable, 200));
    const qrs: TableQR[] = [];
    for (let t = from; t <= to; t++) {
      const url = `${menuUrl}?table=${t}`;
      qrs.push({ table: t, url, qrUrl: makeQrUrl(url), copied: false });
    }
    setTableQRs(qrs);
    setGenerated(true);
  };

  const copyUrl = async (index: number) => {
    try {
      await navigator.clipboard.writeText(tableQRs[index].url);
      setTableQRs(prev => prev.map((q, i) => i === index ? { ...q, copied: true } : q));
      setTimeout(() => setTableQRs(prev => prev.map((q, i) => i === index ? { ...q, copied: false } : q)), 2000);
    } catch {}
  };

  const copyAll = async () => {
    try {
      const all = tableQRs.map(q => `Table ${q.table}: ${q.url}`).join("\n");
      await navigator.clipboard.writeText(all);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {}
  };

  const handleSingleCopy = async () => {
    try { await navigator.clipboard.writeText(menuUrl); setSingleCopied(true); setTimeout(() => setSingleCopied(false), 2000); }
    catch {}
  };

  const handlePrint = () => window.print();

  return (
    <div style={{ minHeight: "100vh", background: "var(--gm-bg)" }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .qr-grid { display: grid !important; grid-template-columns: repeat(3, 1fr); gap: 16px; padding: 0; }
          .qr-card-print { break-inside: avoid; border: 1px solid #E5E2DC; border-radius: 12px; padding: 16px; text-align: center; }
        }
      `}</style>

      <header className="no-print" style={{ position: "relative", background: "linear-gradient(180deg, rgba(255,255,255,0.35), transparent)", borderBottom: "none", boxShadow: "none" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px 20px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/admin" style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "var(--gm-radius-sm)", border: "1px solid var(--gm-border)", background: "var(--gm-bg)", color: "var(--gm-text-secondary)", textDecoration: "none", flexShrink: 0 }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 600, color: "var(--gm-text)", margin: 0 }}>QR Codes</h1>
            <p style={{ fontSize: 12, color: "var(--gm-text-tertiary)", margin: 0 }}>{name}</p>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px 20px 120px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Single QR card */}
        <div className="gm-card no-print" style={{ padding: 32, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--gm-text)", marginBottom: 4 }}>Your QR Code</h2>
          <p style={{ fontSize: 13, color: "var(--gm-text-secondary)", marginBottom: 20 }}>General menu QR (no table)</p>
          {/* Premium QR design */}
          <div style={{ background: "#FFFFFF", padding: 20, borderRadius: 24, boxShadow: "0 8px 24px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.06)", position: "relative", marginBottom: 16 }}>
            {/* Decorative corner highlights */}
            <div style={{ position: "absolute", top: -2, left: -2, width: 12, height: 12, borderTop: "2px solid var(--gm-primary)", borderLeft: "2px solid var(--gm-primary)", borderRadius: "8px 0 0 0" }} />
            <div style={{ position: "absolute", top: -2, right: -2, width: 12, height: 12, borderTop: "2px solid var(--gm-primary)", borderRight: "2px solid var(--gm-primary)", borderRadius: "0 8px 0 0" }} />
            <div style={{ position: "absolute", bottom: -2, left: -2, width: 12, height: 12, borderBottom: "2px solid var(--gm-primary)", borderLeft: "2px solid var(--gm-primary)", borderRadius: "0 0 0 8px" }} />
            <div style={{ position: "absolute", bottom: -2, right: -2, width: 12, height: 12, borderBottom: "2px solid var(--gm-primary)", borderRight: "2px solid var(--gm-primary)", borderRadius: "0 0 8px 0" }} />
            {/* Center logo */}
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 32, height: 32, background: "var(--gm-primary)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🍽️</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={singleQrUrl} alt={`QR code for ${name}`} width={180} height={180}
              style={{ borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)" }} />
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
            <code style={{ flex: 1, fontSize: 11, background: "var(--gm-bg)", borderRadius: 8, padding: "8px 12px", border: "1px solid var(--gm-border)", color: "var(--gm-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{menuUrl}</code>
            <button className="gm-btn-secondary" style={{ height: 36, fontSize: 12, flexShrink: 0, padding: "0 14px" }} onClick={handleSingleCopy}>
              {singleCopied ? "Copied ✓" : "Copy"}
            </button>
          </div>
          <div style={{ display: "flex", gap: 8, width: "100%" }}>
            <button className="gm-btn-secondary" style={{ flex: 1, height: 40, fontSize: 13 }} onClick={() => window.print()}>
              📄 Print
            </button>
            <button className="gm-btn-primary" style={{ flex: 1, height: 40, fontSize: 13 }} onClick={() => {
              const link = document.createElement('a');
              link.href = singleQrUrl;
              link.download = `${slug}-qr.png`;
              link.click();
            }}>
              💾 Download
            </button>
          </div>
        </div>

        {/* Bulk QR Generator */}
        <div className="gm-card no-print" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--gm-text)", marginBottom: 4 }}>📊 Bulk Table QR Generator</h3>
          <p style={{ fontSize: 13, color: "var(--gm-text-secondary)", marginBottom: 20 }}>Generate QR codes for all your tables at once.</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--gm-text-secondary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>From Table</label>
              <input className="gm-input tabular-nums" type="number" min={1} max={200} value={startTable}
                onChange={e => setStartTable(Math.max(1, parseInt(e.target.value) || 1))} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--gm-text-secondary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>To Table</label>
              <input className="gm-input tabular-nums" type="number" min={1} max={200} value={endTable}
                onChange={e => setEndTable(Math.max(1, parseInt(e.target.value) || 1))} />
            </div>
          </div>

          <button className="gm-btn-primary" style={{ width: "100%" }} onClick={handleGenerate}>
            Generate {Math.max(0, endTable - startTable + 1)} QR Codes →
          </button>
        </div>

        {/* Generated QR Grid */}
        {generated && tableQRs.length > 0 && (
          <>
            {/* Actions bar */}
            <div className="no-print" style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <p style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--gm-text)" }}>
                {tableQRs.length} QR codes — Tables {tableQRs[0].table}–{tableQRs[tableQRs.length - 1].table}
              </p>
              <button className="gm-btn-secondary" style={{ height: 38, fontSize: 13, padding: "0 16px", flexShrink: 0 }} onClick={copyAll}>
                {copiedAll ? "Copied ✓" : "Copy All URLs"}
              </button>
              <button className="gm-btn-primary" style={{ height: 38, fontSize: 13, padding: "0 16px", flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }} onClick={handlePrint}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print All
              </button>
            </div>

            {/* Grid of QR cards */}
            <div ref={printRef} className="qr-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
              {tableQRs.map((qr, i) => (
                <div key={qr.table} className="qr-card-print" style={{ background: "var(--gm-surface)", border: "1px solid var(--gm-border)", borderRadius: 16, padding: 16, textAlign: "center", boxShadow: "var(--gm-shadow-sm)" }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--gm-text)", marginBottom: 2 }}>{name}</p>
                  <p style={{ fontSize: 11, color: "var(--gm-text-secondary)", marginBottom: 10, fontWeight: 500 }}>Table {qr.table}</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qr.qrUrl} alt={`Table ${qr.table}`} width={140} height={140}
                    style={{ borderRadius: 8, border: "1px solid var(--gm-border)", width: "100%", height: "auto" }} />
                  <p style={{ fontSize: 9, color: "var(--gm-text-tertiary)", marginTop: 8, wordBreak: "break-all", lineHeight: 1.4 }}>
                    /menu/{slug}?table={qr.table}
                  </p>
                  <button className="no-print" onClick={() => copyUrl(i)}
                    style={{ marginTop: 8, width: "100%", padding: "5px 0", borderRadius: 8, border: "1px solid var(--gm-border)", background: "var(--gm-bg)", fontSize: 11, color: "var(--gm-text-secondary)", cursor: "pointer", fontWeight: 500 }}>
                    {qr.copied ? "Copied ✓" : "Copy URL"}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Deploy steps */}
        <div className="no-print" style={{ background: "#FFF7ED", border: "1px solid #FDBA74", borderRadius: 20, padding: 20 }}>
          <p style={{ fontWeight: 600, fontSize: 14, color: "#C2410C", marginBottom: 12 }}>📱 Deploy & Test</p>
          <ol style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              "Run `vercel` in your project folder — deploys in ~2 minutes (free tier)",
              "Your URL becomes: https://your-app.vercel.app/menu/" + slug,
              "Return here — QR codes update automatically to your live URL",
              "Print all QRs and place on each table — customers scan to order",
              "Watch live orders arrive in the Orders tab with table numbers",
            ].map((step, i) => (
              <li key={i} style={{ display: "flex", gap: 10, fontSize: 13, color: "#92400E" }}>
                <span style={{ flexShrink: 0, width: 20, height: 20, borderRadius: "50%", background: "rgba(255,122,0,0.15)", color: "#C2410C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>{i + 1}</span>
                <span style={{ lineHeight: 1.5 }}>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Preview Menu link */}
        <div className="no-print" style={{ display: "flex", gap: 12 }}>
          <a href={menuUrl} target="_blank" rel="noopener noreferrer" className="gm-btn-primary" style={{ flex: 1, textDecoration: "none" }}>
            Preview Menu ↗
          </a>
        </div>
      </div>

      <AdminBottomNav restaurantId={restaurant?.id} />
    </div>
  );
}
