/** Speech-like bursts, silences included — the app's live waveform grammar. */
const AMPS = [
  0.2, 0.5, 0.85, 0.6, 0.3, 0.16, 0.4, 0.9, 1, 0.7, 0.4, 0.2, 0.16, 0.55, 0.8, 0.5,
  0.25, 0.16, 0.35, 0.75, 0.95, 0.65, 0.35, 0.16, 0.5, 0.85, 0.6, 0.3, 0.16, 0.45,
  0.9, 0.75, 0.5, 0.28, 0.16, 0.6, 0.8, 0.45, 0.2, 0.16, 0.4, 0.7, 0.55, 0.3,
];

export function Wave({ className }: { className?: string }) {
  return (
    <div
      className={`flex h-16 max-w-full items-center justify-center gap-1 sm:gap-[5px] ${className ?? ""}`}
      aria-hidden="true"
    >
      {AMPS.map((a, i) => (
        <span
          key={i}
          className="wavebar shrink-0"
          style={
            {
              "--a": a,
              "--t": `${(1.15 + ((i * 37) % 9) * 0.09).toFixed(2)}s`,
              "--d": `${(((i * 53) % 11) * -0.13).toFixed(2)}s`,
              "--o": (0.35 + a * 0.65).toFixed(2),
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
