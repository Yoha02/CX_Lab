import { useEffect, useRef, useState } from "react";
import { useRunStore } from "../../state/runStore.js";
import { connectPipeline, type PipelineHandle } from "../../lib/voicePipeline.js";
import { TranscriptTurn } from "./TranscriptTurn.js";
import { Waveform } from "./Waveform.js";

export function CallStage() {
  const { turns, callStatus } = useRunStore();
  const pipeline = useRef<PipelineHandle | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // Auto-connect on page load
  useEffect(() => {
    const handle = connectPipeline();
    pipeline.current = handle;
    return () => {
      handle.disconnect();
      pipeline.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Elapsed timer while speaking
  useEffect(() => {
    if (callStatus !== "speaking") { setElapsed(0); return; }
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, [callStatus]);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  const isMuted = callStatus !== "speaking";

  function toggleMic() {
    const h = pipeline.current;
    if (!h) return;
    if (isMuted) {
      h.unmute();          // unlockAudio() is called inside unmute()
    } else {
      h.mute();
    }
  }

  const statusLabel =
    callStatus === "idle"       ? "Initialising…" :
    callStatus === "connecting" ? "Connecting…" :
    callStatus === "ready"      ? "Ready — tap mic to speak" :
    `Live ${mm}:${ss}`;

  const micColor =
    callStatus === "speaking" ? "#2f7d57" :
    callStatus === "ready"    ? "#3f7cac" :
    "#aaa";

  const micBg =
    callStatus === "speaking" ? "rgba(47,125,87,0.12)" :
    callStatus === "ready"    ? "rgba(63,124,172,0.10)" :
    "rgba(0,0,0,0.04)";

  return (
    <div className="panel call-stage">
      {/* Header row */}
      <div className="call-header">
        <span style={{ fontSize: 12, fontWeight: 500, color: "#68736e", display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--font-mono)", letterSpacing: "0.01em" }}>
          {callStatus === "speaking" && <span className="status-dot" />}
          {statusLabel}
        </span>

        {/* Mic toggle — SVG icon */}
        <button
          onClick={toggleMic}
          disabled={callStatus === "idle" || callStatus === "connecting"}
          style={{
            width: 40, height: 40, borderRadius: "50%",
            border: `1.5px solid ${micColor}`,
            background: micBg,
            cursor: callStatus === "ready" || callStatus === "speaking" ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.18s ease",
            boxShadow: callStatus === "speaking" ? `0 0 0 5px rgba(47,125,87,0.15), 0 0 0 9px rgba(47,125,87,0.06)` : "none",
            flexShrink: 0,
          }}
          title={isMuted ? "Unmute — start speaking" : "Mute — send speech to AI"}
        >
          {callStatus === "speaking" ? (
            /* Mic active */
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2f7d57" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="2" width="6" height="13" rx="3"/>
              <path d="M5 10a7 7 0 0 0 14 0"/>
              <line x1="12" y1="19" x2="12" y2="22"/>
              <line x1="8" y1="22" x2="16" y2="22"/>
            </svg>
          ) : (
            /* Mic muted */
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={micColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="2" y1="2" x2="22" y2="22"/>
              <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12"/>
              <path d="M5 10a7 7 0 0 0 12.65 4.15"/>
              <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/>
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12"/>
              <line x1="12" y1="19" x2="12" y2="22"/>
              <line x1="8" y1="22" x2="16" y2="22"/>
            </svg>
          )}
        </button>
      </div>

      <Waveform active={callStatus === "speaking"} />

      {/* Transcript */}
      <div className="transcript">
        {turns.length === 0 && (
          <p style={{ color: "#68736e", fontSize: 14, margin: 0 }}>Waiting for the shopper…</p>
        )}
        {turns.map(t => <TranscriptTurn key={t.turn_id} turn={t} />)}
      </div>
    </div>
  );
}
