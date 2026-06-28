import { useRunStore } from "../../state/runStore.js";

export function PredictionPanel() {
  const candidates = useRunStore((s) =>
    s.branchCandidates.length ? s.branchCandidates : s.lastGoodCandidates,
  );
  const rows = [...candidates].sort((a, b) => b.score - a.score).slice(0, 4);

  return (
    <div className="panel" style={{ display: "flex", flexDirection: "column", minHeight: 380 }}>
      <div className="section-kicker">Before Shopper Speaks</div>
      <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 18px" }}>Next-turn prediction</h3>

      <div style={{ flex: 1 }}>
        {rows.map((c) => (
          <div key={c.id} className="bar-row">
            <div className="bar-copy">
              <span>{c.predicted_next_intent}</span>
              <span className="bar-copy-pct">{(c.score * 100) | 0}%</span>
            </div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${(c.score * 100) | 0}%` }} />
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <p style={{ color: "#68736e", fontSize: 14, margin: 0 }}>Predictions appear as branches generate…</p>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: "auto", paddingTop: 14 }}>
        {[
          { label: "Model confidence", value: rows[0] ? `${(rows[0].score * 100) | 0}%` : "—" },
          { label: "Best score", value: rows[0] ? rows[0].score.toFixed(2) : "—" },
          { label: "Blend alpha", value: "0.65" },
        ].map(({ label, value }) => (
          <div key={label} style={{ padding: "12px", borderRadius: 6, background: "#f8f6f0", border: "1px solid #eae7de" }}>
            <span style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#8a9490", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
            <strong style={{ display: "block", fontSize: 16, fontWeight: 700, marginTop: 6, fontFamily: "var(--font-mono)", letterSpacing: "-0.01em" }}>{value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
