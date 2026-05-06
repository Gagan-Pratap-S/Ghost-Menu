export default function MenuLoading() {
  return (
    <div className="min-h-screen pb-28" style={{ background: "var(--color-bg)" }}>
      <div className="sticky top-0 h-16" style={{ background: "rgba(2,6,23,0.9)", borderBottom: "1px solid rgba(255,255,255,0.05)" }} />
      <div className="max-w-md mx-auto px-4 pt-5 space-y-4">
        <div className="flex gap-3 overflow-hidden">
          {[0,1,2,3].map(i => <div key={i} className="flex-shrink-0 w-36 h-32 rounded-2xl animate-pulse" style={{ background: "rgba(30,41,59,0.5)" }} />)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[0,1,2,3].map(i => <div key={i} className="h-40 rounded-2xl animate-pulse" style={{ background: "rgba(30,41,59,0.5)" }} />)}
        </div>
        <div className="space-y-2">
          {[0,1,2,3,4].map(i => <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: "rgba(30,41,59,0.5)" }} />)}
        </div>
      </div>
    </div>
  );
}
