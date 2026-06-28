import { motion, AnimatePresence } from "framer-motion";
import { useRunStore } from "../../state/runStore.js";
import type { Candidate } from "../../lib/contracts.js";

const colorFor = (s: Candidate["status"]) =>
  s === "kept"
    ? "var(--promoted)"
    : s === "preserved"
      ? "var(--preserved)"
      : "var(--pruned)";

export function BranchTree() {
  const live = useRunStore((s) => s.branchCandidates);
  const lastGood = useRunStore((s) => s.lastGoodCandidates);
  const candidates = live.length ? live : lastGood;
  const kept = candidates.filter((c) => c.status === "kept").length;
  const pruned = candidates.filter((c) => c.status === "pruned").length;
  const best = Math.max(0, ...candidates.map((c) => c.score));

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 text-xs text-muted">
        <span className="px-2 py-1 rounded-full bg-panel border border-black/10">generating</span>
        <span className="px-2 py-1 rounded-full bg-panel border border-black/10">kept {kept}</span>
        <span className="px-2 py-1 rounded-full bg-panel border border-black/10">pruned {pruned}</span>
        <span
          className="px-2 py-1 rounded-full bg-panel border border-black/10"
          style={{ color: "var(--promoted)" }}
        >
          best {best.toFixed(2)}
        </span>
      </div>
      <div className="relative flex flex-col items-stretch gap-3">
        <AnimatePresence>
          {candidates.map((c) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, scale: 0.85, y: -8 }}
              animate={{ opacity: c.status === "pruned" ? 0.45 : 1, scale: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="rounded-xl bg-panel border p-3"
              style={{
                borderColor: colorFor(c.status),
                borderWidth: c.status === "kept" ? 2 : 1,
              }}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-[14px]">{c.strategy}</span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: `${colorFor(c.status)}1a`, color: colorFor(c.status) }}
                >
                  {c.score.toFixed(2)}
                </span>
              </div>
              <div className="text-[12px] text-muted mt-1">
                → {c.predicted_next_intent}
                {c.status === "pruned" ? ` · pruned (${c.reason})` : ""}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {candidates.length === 0 && (
          <p className="text-muted text-sm">the tree builds when the shopper speaks…</p>
        )}
      </div>
    </div>
  );
}