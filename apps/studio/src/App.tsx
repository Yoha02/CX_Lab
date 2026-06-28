import { useEffect } from "react";
import { TopBar } from "./components/TopBar/TopBar.js";
import { SideRail } from "./components/SideRail/SideRail.js";
import { CallStage } from "./components/CallStage/CallStage.js";
import { BranchTree } from "./components/BranchTree/BranchTree.js";
import { PredictionPanel } from "./components/PredictionPanel/PredictionPanel.js";
import { MetricsRow } from "./components/MetricsRow/MetricsRow.js";
import { DreamPanel } from "./components/DreamPanel/DreamPanel.js";
import { useRunStore } from "./state/runStore.js";
import { fetchIterations } from "./state/iterations.js";

export default function App() {
  const reset = useRunStore((s) => s.reset);
  useEffect(() => {
    fetchIterations().then(useRunStore.getState().setIterations);
  }, []);
  return (
    <div className="app-shell">
      <TopBar onReset={reset} />
      <div className="grid grid-cols-[260px_1fr_minmax(320px,40%)] overflow-hidden">
        <SideRail />
        <main id="call-stage-slot" className="p-4 overflow-y-auto border-r border-black/10">
          <CallStage />
          <PredictionPanel />
          <MetricsRow />
        </main>
        <section id="branch-tree-slot" className="p-4 overflow-y-auto">
          <BranchTree />
          <DreamPanel />
        </section>
      </div>
    </div>
  );
}