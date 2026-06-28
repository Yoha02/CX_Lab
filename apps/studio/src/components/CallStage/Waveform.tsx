export function Waveform({ active }: { active: boolean }) {
  return (
    <div className="flex items-end gap-1 h-8" aria-hidden>
      {Array.from({ length: 16 }).map((_, i) => (
        <span
          key={i}
          className="w-1 bg-accent rounded"
          style={{
            height: active ? `${20 + ((i * 7) % 60)}%` : "10%",
            transition: "height .2s",
            animation: active ? `pulse 1s ${i * 0.05}s ease-in-out infinite` : "none",
          }}
        />
      ))}
      <style>{`@keyframes pulse{0%,100%{transform:scaleY(.5)}50%{transform:scaleY(1.4)}}`}</style>
    </div>
  );
}