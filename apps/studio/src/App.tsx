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
      <SideRail />
      <main className="workbench">
        <TopBar onReset={reset} />
        <div className="hero-grid">
          <CallStage />
          <PredictionPanel />
        </div>
        <MetricsRow />
        <div className="lower-grid">
          <BranchTree />
          <DreamPanel />
        </div>
      </main>
    </div>
  );
}
