import { useRunStore } from "../../state/runStore.js";
import { TranscriptTurn } from "./TranscriptTurn.js";
import { Waveform } from "./Waveform.js";

export function CallStage() {
  const { turns, callStatus } = useRunStore();
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted">
          {callStatus === "live" ? "🟢 voice room active" : "idle"}
        </span>
        <Waveform active={callStatus === "live"} />
      </div>
      <div className="flex-1 overflow-y-auto">
        {turns.length === 0 && (
          <p className="text-muted text-sm">waiting for the shopper…</p>
        )}
        {turns.map((t) => (
          <TranscriptTurn key={t.turn_id} turn={t} />
        ))}
      </div>
    </div>
  );
}