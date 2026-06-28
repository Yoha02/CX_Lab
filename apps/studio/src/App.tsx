import { TopBar } from "./components/TopBar/TopBar.js";
import { SideRail } from "./components/SideRail/SideRail.js";
import { CallStage } from "./components/CallStage/CallStage.js";
import { useRunStore } from "./state/runStore.js";

export default function App() {
  const reset = useRunStore((s) => s.reset);
  return (
    <div className="app-shell">
      <TopBar onReset={reset} />
      <div className="grid grid-cols-[260px_1fr_minmax(320px,40%)] overflow-hidden">
        <SideRail />
        <main id="call-stage-slot" className="p-4 overflow-y-auto border-r border-black/10">
          <CallStage />
        </main>
        <section id="branch-tree-slot" className="p-4 overflow-y-auto">
          <div className="text-muted text-sm">branch tree — Plan 04</div>
        </section>
      </div>
    </div>
  );
}