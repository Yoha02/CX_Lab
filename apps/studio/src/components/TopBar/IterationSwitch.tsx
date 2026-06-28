import { useEffect } from "react";
import { useRunStore } from "../../state/runStore.js";

export function IterationSwitch() {
  const { iterations, activeIterationIndex, setActiveIteration } = useRunStore();
  const active = iterations[activeIterationIndex];

  const cycle = () => {
    if (iterations.length) setActiveIteration((activeIterationIndex + 1) % iterations.length);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ".") {
        e.preventDefault();
        cycle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [iterations.length, activeIterationIndex]);

  return (
    <button
      onClick={cycle}
      title={active ? `Switch mode from ${active.label ?? active.id}` : "Switch mode"}
      className="btn btn-secondary"
      aria-label="switch iteration"
    >
      {active?.label ?? active?.id ?? "Switch mode"}
    </button>
  );
}
