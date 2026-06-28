import type { Turn } from "../../lib/contracts.js";

export function TranscriptTurn({ turn }: { turn: Turn }) {
  const isShopper = turn.speaker === "shopper";
  const frustPct = (turn.sentiment?.frustration ?? 0) * 100 | 0;
  const frustColor = frustPct > 60 ? "#b75d55" : frustPct > 30 ? "#b8842f" : "#2f7d57";

  return (
    <article className={`turn ${isShopper ? "turn-shopper" : "turn-agent"}`}>
      <div className="turn-label">
        <span>{isShopper ? "shopper" : "agent"}</span>
        {isShopper && turn.lang && turn.lang !== "en-US" && turn.lang !== "en" && (
          <span style={{ fontFamily: "var(--font-mono)", opacity: 0.7, marginLeft: 6 }}>{turn.lang}</span>
        )}
        <span style={{ fontFamily: "var(--font-mono)", opacity: 0.45, marginLeft: "auto" }}>#{turn.turn_id}</span>
      </div>
      <div className={isShopper ? "turn-bubble-shopper" : "turn-bubble-agent"}>
        <p className="turn-text">{turn.original}</p>
        {isShopper && turn.english && turn.english !== turn.original && (
          <p className="turn-translation">↳ {turn.english}</p>
        )}
        {isShopper && turn.sentiment && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, fontFamily: "var(--font-mono)",
              padding: "2px 7px", borderRadius: 3,
              background: `${frustColor}18`, color: frustColor,
              border: `1px solid ${frustColor}30`,
            }}>
              {turn.sentiment.label}
            </span>
            {/* Frustration bar */}
            <div style={{ flex: 1, height: 3, borderRadius: 2, background: "#e8e4d8", overflow: "hidden" }}>
              <div style={{ width: `${frustPct}%`, height: "100%", background: frustColor, borderRadius: "inherit", transition: "width 400ms ease" }} />
            </div>
            <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: frustColor, fontWeight: 700, minWidth: 28, textAlign: "right" }}>
              {frustPct}%
            </span>
          </div>
        )}
      </div>
    </article>
  );
}
