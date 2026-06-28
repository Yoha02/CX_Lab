import { useRunStore } from "../../state/runStore.js";

export function PredictionPanel() {
  const candidates = useRunStore((s) =>
    s.branchCandidates.length ? s.branchCandidates : s.lastGoodCandidates,
  );
  const rows = [...candidates].sort((a, b) => b.score - a.score).slice(0, 4);
  return (
    <div className="mt-4">
      <div className="text-xs uppercase tracking-wide text-muted mb-2">next-turn prediction</div>
      {rows.map((c) => (
        <div key={c.id} className="mb-2">
          <div className="flex justify-between text-[13px]">
            <span>{c.predicted_next_intent}</span>
            <span>{(c.score * 100) | 0}%</span>
          </div>
          <div className="h-1.5 bg-black/10 rounded">
            <div
              className="h-full bg-accent rounded"
              style={{ width: `${(c.score * 100) | 0}%`, transition: "width .4s" }}
            />
          </div>
        </div>
      ))}
      {rows.length === 0 && <p className="text-muted text-sm">—</p>}
    </div>
  );
}