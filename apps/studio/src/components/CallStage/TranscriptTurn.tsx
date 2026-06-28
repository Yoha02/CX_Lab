import type { Turn } from "../../lib/contracts.js";

export function TranscriptTurn({ turn }: { turn: Turn }) {
  const isShopper = turn.speaker === "shopper";
  return (
    <article className={`my-2 max-w-[85%] ${isShopper ? "mr-auto" : "ml-auto"}`}>
      <div className="text-xs uppercase tracking-wide text-muted mb-0.5">
        {turn.speaker}
        {isShopper && turn.lang !== "en-US" ? ` · ${turn.lang}` : ""}
      </div>
      <div
        className={`rounded-xl p-3 ${
          isShopper
            ? "bg-panel border border-black/10"
            : "bg-promoted/10 border border-promoted/30"
        }`}
      >
        <p className="text-[15px]">{turn.original}</p>
        {isShopper && turn.english && turn.english !== turn.original && (
          <p className="text-[13px] text-muted mt-1">EN: {turn.english}</p>
        )}
        {isShopper && turn.sentiment && (
          <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-pruned/10 text-pruned">
            {turn.sentiment.label} · {(turn.sentiment.frustration * 100) | 0}%
          </span>
        )}
      </div>
    </article>
  );
}