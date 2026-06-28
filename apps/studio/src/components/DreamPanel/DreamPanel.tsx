import { useEffect, useState } from "react";
import { useRunStore } from "../../state/runStore.js";
import { getDataSource } from "../../data/index.js";
import type { PlaybookPatch } from "../../lib/contracts.js";

export function DreamPanel() {
  const displayMode = useRunStore((s) => s.displayMode);
  const [open, setOpen] = useState(false);
  const [patch, setPatch] = useState<PlaybookPatch | null>(null);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    if (!open) return;
    getDataSource(displayMode).getPlaybookPatches("ready_for_approval").then((ps) => setPatch(ps[0] ?? null));
  }, [open, displayMode]);

  const approve = async () => {
    if (!patch) return;
    await getDataSource(displayMode).approvePlaybookPatch(patch.id);
    setApproved(true);
  };

  return (
    <div className="mt-4 border-t border-black/10 pt-3">
      <button className="text-xs uppercase tracking-wide text-muted" onClick={() => setOpen((o) => !o)}>
        {open ? "▾" : "▸"} dream pass — offline consolidation
      </button>
      {open && patch && (
        <div className="mt-3 space-y-3">
          <p className="text-sm">{patch.cluster_summary}</p>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {patch.evidence.affected_personas.map((p) => (
              <span key={p} className="px-2 py-0.5 rounded-full bg-accent/10 text-accent">{p}</span>
            ))}
            <span className="px-2 py-0.5 rounded-full bg-pruned/10 text-pruned">Δsentiment {patch.evidence.avg_sentiment_delta}</span>
            <span className="px-2 py-0.5 rounded-full bg-pruned/10 text-pruned">esc risk {patch.evidence.avg_escalation_risk}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs font-medium text-pruned mb-1">remove</div>
              <ul className="text-[13px] space-y-1">{patch.remove.map((r) => <li key={r} className="text-muted line-through">{r}</li>)}</ul>
            </div>
            <div>
              <div className="text-xs font-medium text-promoted mb-1">add</div>
              <ul className="text-[13px] space-y-1">{patch.add.map((a) => <li key={a}>{a}</li>)}</ul>
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted mb-1">per-persona wording</div>
            <ul className="text-[13px] space-y-1">
              {Object.entries(patch.persona_overrides).map(([k, v]) => (
                <li key={k}><span className="text-muted">{k}:</span> {v}</li>
              ))}
            </ul>
          </div>
          {approved
            ? <div className="text-sm text-promoted">✓ approved — playbook updated</div>
            : <button className="px-3 py-1.5 rounded-lg bg-promoted text-white text-sm" onClick={approve}>approve patch</button>}
        </div>
      )}
      {open && !patch && <p className="text-sm text-muted mt-2">no patches ready for approval.</p>}
    </div>
  );
}