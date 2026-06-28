export function Waveform({ active }: { active: boolean }) {
  return (
    <div className="waveform" aria-hidden="true">
      {Array.from({ length: 28 }).map((_, i) => (
        <span
          key={i}
          className="waveform-bar"
          style={{
            height: active ? undefined : `${8 + Math.sin(i * 0.7) * 4}px`,
            animation: active
              ? `wave ${700 + (i % 5) * 80}ms ${i * 38}ms ease-in-out infinite`
              : "none",
          }}
        />
      ))}
    </div>
  );
}
