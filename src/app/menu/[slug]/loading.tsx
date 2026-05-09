export default function MenuLoading() {
  return (
    <div style={{ minHeight: "100vh", paddingBottom: 112, background: "var(--gm-bg)" }}>
      <div style={{ height: 64, background: "var(--gm-surface)", borderBottom: "1px solid var(--gm-border)" }} />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px" }}>
        <div style={{ display: "flex", gap: 12, overflow: "hidden", marginBottom: 24 }}>
          {[0,1,2,3].map(i => (
            <div key={i} className="animate-skeleton" style={{ width: 144, height: 128, borderRadius: 18, flexShrink: 0 }} />
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          {[0,1,2,3].map(i => (
            <div key={i} className="animate-skeleton" style={{ height: 160, borderRadius: 18 }} />
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[0,1,2,3,4].map(i => (
            <div key={i} className="animate-skeleton" style={{ height: 88, borderRadius: 16 }} />
          ))}
        </div>
      </div>
    </div>
  );
}
