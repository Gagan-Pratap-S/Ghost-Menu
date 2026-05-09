export default function AdminLoading() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--gm-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 32, height: 32, border: "2.5px solid var(--gm-border)", borderTopColor: "var(--gm-primary)", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
    </div>
  );
}
