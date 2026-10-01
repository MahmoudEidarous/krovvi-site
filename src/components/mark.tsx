/**
 * The eleven-dot K. Equal dots, no lines, no special dot: the locked mark
 * (brand/mark-rest.svg in the app). The order below is the order a hand
 * draws the K: the spine top to bottom, then the upper arm outward, then
 * the lower arm outward. Both motions follow it.
 */
export const K_DOTS: Array<[number, number]> = [
  [40, 28], [40, 44], [40, 60], [40, 76], [40, 92],
  [54, 50], [68, 40], [82, 30],
  [54, 70], [68, 80], [82, 90],
];

/** The small mark's seven dots (brand/mark-small.svg), for sizes under 48px. */
export const K_SMALL: Array<[number, number]> = [
  [40, 28], [40, 60], [40, 92], [61, 45], [82, 30], [61, 75], [82, 90],
];

export function Mark({ size = 32, color = "#EDEDEB", className }: {
  size?: number;
  color?: string;
  className?: string;
}) {
  const small = size < 48;
  const dots = small ? K_SMALL : K_DOTS;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true" className={className}>
      {dots.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={small ? 8 : 6.5} fill={color} />
      ))}
    </svg>
  );
}

/**
 * The K, alive: the two moves the identity allows. The dots land, in drawing
 * order, from wherever they were; then a slow brightness wave travels through
 * them, the app's KThinking stretched for a page that is read, not waited on.
 * Opacity and position only; the dots never change size at rest.
 */
export function KAlive({ size = 160, land = true, wave = true, delay = 0, className }: {
  size?: number;
  land?: boolean;
  wave?: boolean;
  /** Seconds before the first dot moves. */
  delay?: number;
  className?: string;
}) {
  const landMs = 1100;
  const stepMs = 70;
  const waveStart = delay * 1000 + (land ? landMs + stepMs * K_DOTS.length : 0);
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true" className={`k-alive ${className ?? ""}`} overflow="visible">
      {K_DOTS.map(([cx, cy], i) => {
        // Golden-angle scatter: every dot comes from its own direction, the same on every load.
        const angle = (i * 137.508 * Math.PI) / 180;
        const reach = 46 + (i % 4) * 16;
        const x = Math.round(Math.cos(angle) * reach);
        const y = Math.round(Math.sin(angle) * reach);
        return (
          <g
            key={i}
            className={land ? "anim" : undefined}
            style={
              {
                "--a": "k-land",
                "--dur": `${landMs}ms`,
                "--delay": `${delay * 1000 + i * stepMs}ms`,
                "--x": `${x}px`,
                "--y": `${y}px`,
              } as React.CSSProperties
            }
          >
            <circle
              cx={cx}
              cy={cy}
              r={6.5}
              fill="#EDEDEB"
              className={wave ? "anim-loop" : undefined}
              style={
                {
                  "--a": "k-wave-soft",
                  "--dur": "4200ms",
                  "--delay": `${waveStart + i * 110}ms`,
                } as React.CSSProperties
              }
            />
          </g>
        );
      })}
    </svg>
  );
}
