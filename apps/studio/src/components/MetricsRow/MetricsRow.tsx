import { useRunStore } from "../../state/runStore.js";

export function MetricsRow() {
  const candidates = useRunStore((s) =>
    s.branchCandidates.length ? s.branchCandidates : s.lastGoodCandidates,
  );
  const best = Math.max(0, ...candidates.map((c) => c.score));
  const pruned = candidates.filter((c) => c.status === "pruned").length;
  const tiles = [
    { label: "containment (best)", value: `${(best * 100) | 0}%` },
    { label: "candidates", value: String(candidates.length) },
    { label: "pruned", value: String(pruned) },
    { label: "champion", value: candidates.find((c) => c.status === "kept") ? "ready" : "—" },
  ];
  return (
    <div className="grid grid-cols-4 gap-3 mt-4">
      {tiles.map((t) => (
        <div key={t.label} className="bg-panel border border-black/10 rounded-xl p-3">
          <div className="text-xs text-muted">{t.label}</div>
          <div className="text-xl font-medium">{t.value}</div>
        </div>
      ))}
    </div>
  );
}