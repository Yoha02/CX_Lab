import { useRunStore } from "../../state/runStore.js";
import { IterationSwitch } from "./IterationSwitch.js";

export function TopBar({ onReset }: { onReset: () => void }) {
  const callStatus = useRunStore(s => s.callStatus);
  const statusPill = callStatus === "connecting" ? "connecting…"
    : callStatus === "ready"     ? "ready"
    : callStatus === "speaking"  ? "live"
    : "idle";
  return (
    <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 68, padding: "0 4px" }}>
      <div>
        <div className="section-kicker">Simulated Live Call</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 2px" }}>Voice containment loop</h2>
        <span className="sr-only">CX_lab Dojo</span>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 3,
          fontFamily: "var(--font-mono)", letterSpacing: "0.04em",
          background: callStatus === "speaking" ? "rgba(47,125,87,0.12)" : "rgba(63,124,172,0.08)",
          color: callStatus === "speaking" ? "#2f7d57" : "#3f7cac",
          border: `1px solid ${callStatus === "speaking" ? "rgba(47,125,87,0.25)" : "rgba(63,124,172,0.2)"}`,
        }}>{statusPill}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button className="btn btn-secondary" onClick={onReset}>↺ Reset call</button>
        <IterationSwitch />
      </div>
    </header>
  );
}
