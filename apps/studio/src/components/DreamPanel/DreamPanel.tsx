import { useEffect, useState } from "react";
import { getDataSource } from "../../data/index.js";
import type { PlaybookPatch } from "../../lib/contracts.js";

const STEPS = [
  { title: "Review transcripts", detail: "Scan recent calls, tool events, and prediction misses." },
  { title: "Cluster failures", detail: "Group calls by failure mode and shopper segment." },
  { title: "Score patch", detail: "Evaluate patch quality, containment lift, and compliance risk." },
  { title: "Promote challenger", detail: "Update playbook with the best-scoring policy candidate." },
];

export function DreamPanel() {
  const [patch, setPatch] = useState<PlaybookPatch | null>(null);
  const [approved, setApproved] = useState(false);
  const [running, setRunning] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [doneSteps, setDoneSteps] = useState<number[]>([]);

  useEffect(() => {
    getDataSource().getPlaybookPatches("ready_for_approval").then((ps) => setPatch(ps[0] ?? null));
  }, []);

  const runDream = () => {
    if (running) return;
    setRunning(true);
    setActiveStep(0);
    setDoneSteps([]);
    STEPS.forEach((_, i) => {
      setTimeout(() => {
        setDoneSteps((d) => [...d, ...Array.from({ length: i }, (__, k) => k)]);
        setActiveStep(i);
      }, i * 900);
    });
    setTimeout(() => {
      setDoneSteps([0, 1, 2, 3]);
      setActiveStep(-1);
      setRunning(false);
    }, STEPS.length * 900 + 400);
  };

  const approve = async () => {
    if (!patch) return;
    await getDataSource().approvePlaybookPatch(patch.id);
    setApproved(true);
  };

  return (
    <div className="panel" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div className="section-kicker">Offline Consolidation</div>
          <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Dream pass</h3>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <span className="pill">
            {doneSteps.length === STEPS.length ? "complete" : running ? "running" : "queued"}
          </span>
          <button className="btn btn-primary" onClick={runDream} disabled={running} style={{ fontSize: 13 }}>
            Run dream pass
          </button>
        </div>
      </div>

      <div className="dream-flow">
        {STEPS.map((step, i) => (
          <article
            key={i}
            className={`dream-step ${activeStep === i ? "active" : ""} ${doneSteps.includes(i) && activeStep !== i ? "complete" : ""}`}
          >
            <span className="dream-step-num">{i + 1}</span>
            <strong style={{ fontSize: 14, fontWeight: 800 }}>{step.title}</strong>
            <p style={{ margin: "3px 0 0", fontSize: 13, color: "#68736e", lineHeight: 1.35 }}>{step.detail}</p>
          </article>
        ))}
      </div>

      {patch && (
        <>
          <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: "#68736e", margin: "14px 0 6px" }}>
            Cluster · {patch.intent.replace(/_/g, " ")}
          </div>
          <p style={{ fontSize: 13, color: "#68736e", margin: "0 0 12px", lineHeight: 1.4 }}>{patch.cluster_summary}</p>

          <div className="policy-diff">
            <div className="policy-diff-cell">
              <span className="diff-label diff-label-remove">Remove</span>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 6 }}>
                {patch.remove.map((r) => (
                  <li key={r} style={{ fontSize: 13, lineHeight: 1.4, color: "#1f2726", textDecoration: "line-through", textDecorationColor: "#b75d55" }}>{r}</li>
                ))}
              </ul>
            </div>
            <div className="policy-diff-cell">
              <span className="diff-label diff-label-add">Add</span>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 6 }}>
                {patch.add.map((a) => (
                  <li key={a} style={{ fontSize: 13, lineHeight: 1.4, color: "#1f2726" }}>{a}</li>
                ))}
              </ul>
            </div>
          </div>

          {Object.keys(patch.persona_overrides).length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: "#68736e", marginBottom: 8 }}>
                Per-persona wording
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 6 }}>
                {Object.entries(patch.persona_overrides).map(([k, v]) => (
                  <li key={k} style={{ fontSize: 13, lineHeight: 1.4 }}>
                    <span style={{ color: "#68736e", fontWeight: 700 }}>{k.replace(/_/g, " ")}:</span> {v}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ marginTop: 14 }}>
            {approved
              ? <p style={{ fontSize: 14, fontWeight: 800, color: "#2f7d57" }}>✓ Approved — playbook updated</p>
              : <button className="btn btn-primary" onClick={approve} style={{ fontSize: 13 }}>Approve patch</button>
            }
          </div>
        </>
      )}

      {!patch && (
        <p style={{ fontSize: 13, color: "#68736e", marginTop: 14 }}>No patches pending approval.</p>
      )}
    </div>
  );
}
