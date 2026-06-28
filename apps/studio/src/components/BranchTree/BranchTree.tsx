import { motion, AnimatePresence } from "framer-motion";
import { useRunStore } from "../../state/runStore.js";
import type { Candidate } from "../../lib/contracts.js";

// ── Layout ────────────────────────────────────────────────────────────────────
const W = 700;
const LEVEL_Y   = [50,  155, 295, 430];  // y-center of each level
const LEVEL_R   = [30,  26,  24,  20];   // node radius per level
const ROOT_X    = W / 2;

// ── Colors ────────────────────────────────────────────────────────────────────
const C = {
  kept:      { stroke: "#2f7d57", fill: "#e0f0e5", text: "#1a5c3a" },
  preserved: { stroke: "#b8842f", fill: "#f2e6cf", text: "#7a4f15" },
  pruned:    { stroke: "#b75d55", fill: "#f4dfdc", text: "#8a2a24" },
};

function xPositions(n: number): number[] {
  if (n === 0) return [];
  if (n === 1) return [ROOT_X];
  const pad = 85;
  const step = (W - 2 * pad) / (n - 1);
  return Array.from({ length: n }, (_, i) => pad + i * step);
}

function bezier(x1: number, y1: number, x2: number, y2: number) {
  const m = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1} ${m} ${x2} ${m} ${x2} ${y2}`;
}

function nodeLabel(strategy: string): string {
  const skip = new Set(["the","a","an","and","or","with","of","in","to","for","by","on","at","check"]);
  const words = strategy.replace(/[+]/g, " ").trim().split(/\s+/)
    .filter(w => w.length > 2 && !skip.has(w.toLowerCase()));
  return (words[0] ?? strategy.slice(0, 6)).slice(0, 8);
}

function wrapAt(s: string, n = 26): [string, string] {
  if (s.length <= n) return [s, ""];
  const cut = s.lastIndexOf(" ", n);
  return cut > 0 ? [s.slice(0, cut), s.slice(cut + 1, cut + 1 + n + 2)]
                 : [s.slice(0, n), s.slice(n, n * 2)];
}

// ── Component ─────────────────────────────────────────────────────────────────
export function BranchTree() {
  const live           = useRunStore(s => s.branchCandidates);
  const lastGood       = useRunStore(s => s.lastGoodCandidates);
  const detectedIntent = useRunStore(s => s.detectedIntent);
  const candidates = live.length ? live : lastGood;
  const isExploring = live.length > 0;
  const champion = candidates.find(c => c.status === "kept");
  const xs = xPositions(candidates.length);
  const svgH = candidates.length > 0 ? 520 : 180;

  const statusLabel = candidates.length === 0 ? "awaiting"
    : isExploring ? "branches exploring"
    : champion ? "champion ready"
    : "complete";

  return (
    <div className="panel">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div className="section-kicker">Experiment Tree</div>
          <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Promote · prune · preserve diversity</h3>
        </div>
        <span className="pill">{statusLabel}</span>
      </div>

      {/* SVG tree */}
      <svg viewBox={`0 0 ${W} ${svgH}`} width="100%" style={{ display: "block" }}>
        <defs>
          <linearGradient id="treeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2f7d57" />
            <stop offset="100%" stopColor="#3f7cac" />
          </linearGradient>
          <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* ── LEVEL 0: Start node ─────────────────────────────────────────── */}
        <circle cx={ROOT_X} cy={LEVEL_Y[0]} r={LEVEL_R[0]} fill="white" stroke="#1f2726" strokeWidth={2.5} />
        <text x={ROOT_X} y={LEVEL_Y[0] + 5} textAnchor="middle" fontSize={11} fontWeight={900} fill="#1f2726">start</text>

        {/* ── LEVEL 0→1 connector + intent node ─────────────────────────── */}
        {candidates.length > 0 && (
          <>
            <motion.path
              d={bezier(ROOT_X, LEVEL_Y[0] + LEVEL_R[0], ROOT_X, LEVEL_Y[1] - LEVEL_R[1])}
              fill="none" stroke="url(#treeGrad)" strokeWidth={5} strokeLinecap="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
            <motion.g initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              style={{ transformOrigin: `${ROOT_X}px ${LEVEL_Y[1]}px` }}>
              <circle cx={ROOT_X} cy={LEVEL_Y[1]} r={LEVEL_R[1]} fill="#ddebf4" stroke="#3f7cac" strokeWidth={2.5} />
              {(() => {
                const label = detectedIntent || "intent";
                const [w1, w2] = wrapAt(label, 10);
                return <>
                  <text x={ROOT_X} y={LEVEL_Y[1] - 2} textAnchor="middle" fontSize={10} fontWeight={900} fill="#3f7cac">{w1}</text>
                  {w2 && <text x={ROOT_X} y={LEVEL_Y[1] + 11} textAnchor="middle" fontSize={10} fontWeight={900} fill="#3f7cac">{w2}</text>}
                </>;
              })()}
            </motion.g>
          </>
        )}

        {/* ── LEVELS 2 + 3: Candidates + outcomes ────────────────────────── */}
        <AnimatePresence>
          {candidates.map((c, i) => {
            const x = xs[i];
            const col = C[c.status];
            const isPruned = c.status === "pruned";
            const isKept = c.status === "kept";
            const [sl1, sl2] = wrapAt(c.strategy);
            const [ol1, ol2] = wrapAt(c.predicted_next_intent, 20);
            const delay = 0.5 + i * 0.14;

            return (
              <motion.g key={c.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: isPruned ? 0.42 : 1 }}
                transition={{ duration: 0.3, delay }}>

                {/* L1 → L2 connector */}
                <motion.path
                  d={bezier(ROOT_X, LEVEL_Y[1] + LEVEL_R[1], x, LEVEL_Y[2] - LEVEL_R[2])}
                  fill="none"
                  stroke={isKept ? "url(#treeGrad)" : col.stroke}
                  strokeWidth={isKept ? 5 : isPruned ? 2.5 : 3.5}
                  strokeLinecap="round"
                  strokeDasharray={isPruned ? "7 5" : undefined}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.6, ease: "easeInOut", delay: delay + 0.05 }}
                />

                {/* L2 circle */}
                <motion.circle cx={x} cy={LEVEL_Y[2]} r={LEVEL_R[2]}
                  fill={col.fill} stroke={col.stroke}
                  strokeWidth={isKept ? 3 : 2}
                  filter={isKept ? "url(#glow)" : undefined}
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ duration: 0.28, delay: delay + 0.5 }}
                  style={{ transformOrigin: `${x}px ${LEVEL_Y[2]}px` }}
                />
                <text x={x} y={LEVEL_Y[2] + 4} textAnchor="middle" fontSize={10} fontWeight={900} fill={col.text}>
                  {nodeLabel(c.strategy)}
                </text>

                {/* Score badge */}
                <text x={x} y={LEVEL_Y[2] + LEVEL_R[2] + 16}
                  textAnchor="middle" fontSize={14} fontWeight={900} fill={col.stroke}>
                  {c.score.toFixed(2)}
                </text>

                {/* Strategy text */}
                <text x={x} y={LEVEL_Y[2] + LEVEL_R[2] + 34} textAnchor="middle" fontSize={11} fill="#68736e">{sl1}</text>
                {sl2 && <text x={x} y={LEVEL_Y[2] + LEVEL_R[2] + 47} textAnchor="middle" fontSize={11} fill="#68736e">{sl2}</text>}

                {/* Pruned: dead-end marker */}
                {isPruned && (
                  <text x={x} y={LEVEL_Y[2] + LEVEL_R[2] + 63} textAnchor="middle" fontSize={10} fill="#b75d55" fontStyle="italic">
                    ✕ {(c.reason ?? "").slice(0, 28)}
                  </text>
                )}

                {/* ── LEVEL 3: Outcome node (kept + preserved only) ───────── */}
                {!isPruned && (
                  <>
                    <motion.path
                      d={bezier(x, LEVEL_Y[2] + LEVEL_R[2], x, LEVEL_Y[3] - LEVEL_R[3])}
                      fill="none" stroke={col.stroke} strokeWidth={isKept ? 3.5 : 2.5}
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, ease: "easeInOut", delay: delay + 0.8 }}
                    />

                    {/* Champion glow ring */}
                    {isKept && (
                      <motion.circle cx={x} cy={LEVEL_Y[3]} r={LEVEL_R[3] + 9}
                        fill="none" stroke="#2f7d57" strokeWidth={1.5}
                        strokeDasharray="5 4" opacity={0.55}
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ duration: 0.35, delay: delay + 1.3 }}
                        style={{ transformOrigin: `${x}px ${LEVEL_Y[3]}px` }}
                      />
                    )}

                    <motion.circle cx={x} cy={LEVEL_Y[3]} r={LEVEL_R[3]}
                      fill={col.fill} stroke={col.stroke}
                      strokeWidth={isKept ? 2.5 : 1.5}
                      filter={isKept ? "url(#glow)" : undefined}
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ duration: 0.25, delay: delay + 1.25 }}
                      style={{ transformOrigin: `${x}px ${LEVEL_Y[3]}px` }}
                    />
                    <text x={x} y={LEVEL_Y[3] - 3} textAnchor="middle" fontSize={9} fontWeight={900} fill={col.text}>
                      {ol1}
                    </text>
                    {ol2 && (
                      <text x={x} y={LEVEL_Y[3] + 9} textAnchor="middle" fontSize={9} fontWeight={700} fill={col.text}>
                        {ol2}
                      </text>
                    )}

                    {/* Champion label */}
                    {isKept && (
                      <motion.text x={x} y={LEVEL_Y[3] + LEVEL_R[3] + 16}
                        textAnchor="middle" fontSize={11} fontWeight={900} fill="#2f7d57"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        transition={{ delay: delay + 1.5 }}>
                        ★ champion
                      </motion.text>
                    )}
                  </>
                )}
              </motion.g>
            );
          })}
        </AnimatePresence>

        {/* Empty state */}
        {candidates.length === 0 && (
          <text x={ROOT_X} y={120} textAnchor="middle" fontSize={13} fill="#68736e">
            the tree builds when the shopper speaks…
          </text>
        )}
      </svg>

      {/* Legend */}
      <div className="legend-row" style={{ fontSize: 13, fontWeight: 800, color: "#68736e", marginTop: 10 }}>
        <span><i className="legend-dot" style={{ background: "#2f7d57" }} />promoted · champion</span>
        <span><i className="legend-dot" style={{ background: "#b8842f" }} />preserved</span>
        <span><i className="legend-dot" style={{ background: "#b75d55" }} />pruned</span>
      </div>
    </div>
  );
}
