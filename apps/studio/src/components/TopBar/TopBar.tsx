import { useRunStore } from "../../state/runStore.js";
import { IterationSwitch } from "./IterationSwitch.js";

export function TopBar({ onReset }: { onReset: () => void }) {
  const { callStatus, setCallStatus } = useRunStore();
  const live = callStatus === "live";
  return (
    <header className="flex items-center justify-between px-5 py-3 bg-panel border-b border-black/10">
      <div className="font-medium text-lg">CX_lab Dojo</div>
      <div className="flex items-center gap-2 text-sm">
        <button className="px-3 py-1.5 rounded-lg border border-black/15" onClick={onReset} aria-label="reset">↺ reset</button>
        <button className="px-3 py-1.5 rounded-lg border border-black/15"
          onClick={() => setCallStatus(live ? "paused" : "live")}
          aria-label={live ? "pause" : "play"}>{live ? "⏸ pause" : "▶ start"}</button>
        <span className="text-muted">status: {callStatus}</span>
        <IterationSwitch />
      </div>
    </header>
  );
}