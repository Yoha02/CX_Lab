import { useEffect } from "react";
import { useRunStore } from "../../state/runStore.js";

export function IterationSwitch() {
  const { iterations, activeIterationIndex, setActiveIteration } = useRunStore();
  const cycle = () => { if (iterations.length) setActiveIteration((activeIterationIndex + 1) % iterations.length); };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === ".") { e.preventDefault(); cycle(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [iterations.length, activeIterationIndex]);
  const active = iterations[activeIterationIndex];
  return (
    <button onClick={cycle} title={active ? `iteration: ${active.id} (⌘.)` : "iteration"}
      className="px-2 py-1.5 rounded-lg border border-black/15 text-muted" aria-label="switch iteration">⚙</button>
  );
}