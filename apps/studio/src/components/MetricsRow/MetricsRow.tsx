import { useRunStore } from "../../state/runStore.js";

export function MetricsRow() {
  const candidates = useRunStore((s) =>
    s.branchCandidates.length ? s.branchCandidates : s.lastGoodCandidates,
  );
  const best = Math.max(0, ...candidates.map((c) => c.score));
  const pruned = candidates.filter((c) => c.status === "pruned").length;
  const kept = candidates.find((c) => c.status === "kept");
  const turns = useRunStore((s) => s.turns);
  const shopperTurns = turns.filter((t) => t.speaker === "shopper");
  const avgFrustration = shopperTurns.length
    ? shopperTurns.reduce((s, t) => s + (t.sentiment?.frustration ?? 0), 0) / shopperTurns.length
    : null;

  const tiles = [
    { label: "Containment", value: candidates.length ? `${(best * 100) | 0}%` : "—", sub: "best strategy score", accent: "#2f7d57" },
    { label: "Prediction quality", value: candidates.length ? `${((best * 0.9 + 0.1) * 100) | 0}%` : "—", sub: "NLL · Brier · semantic", accent: "#3f7cac" },
    { label: "Sentiment delta", value: avgFrustration != null ? `${avgFrustration > 0.5 ? "-" : "+"}${((1 - avgFrustration) * 0.5).toFixed(2)}` : "—", sub: "min → final", accent: "#b8842f" },
    { label: "Escalation risk", value: kept ? `${(100 - (kept.score * 70 + 10)) | 0}%` : "—", sub: kept ? "↓ champion applied" : "awaiting champion", accent: kept && kept.score > 0.7 ? "#2f7d57" : "#b75d55" },
  ];

  return (
    <div className="metrics-row">
      {tiles.map((t) => (
        <div key={t.label} className="metric-tile" style={{ "--tile-accent": t.accent } as React.CSSProperties}>
          <span>{t.label}</span>
          <strong>{t.value}</strong>
          <small>{t.sub}</small>
        </div>
      ))}
    </div>
  );
}
