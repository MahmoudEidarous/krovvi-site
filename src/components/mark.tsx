/** The eleven-dot K. Equal dots, no lines, no special dot — the locked mark. */
const DOTS: Array<[number, number]> = [
  [40, 28], [40, 44], [40, 60], [40, 76], [40, 92],
  [54, 50], [68, 40], [82, 30],
  [54, 70], [68, 80], [82, 90],
];

export function Mark({ size = 32, color = "#EDEDEB", className }: {
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true" className={className}>
      {DOTS.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={6.5} fill={color} />
      ))}
    </svg>
  );
}
