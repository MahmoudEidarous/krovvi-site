/**
 * The app's own pieces, drawn for the web at the phone's 393-point scale:
 * the status bar, round nav buttons, cards, rows and people's dotted
 * initials. Sizes and inks come from the app (theme/tokens.ts and the
 * screens in design/deck-2026-09-27), so the site shows Krovvi as it is.
 */

export function StatusBar({ time = "9:41" }: { time?: string }) {
  return (
    <div className="absolute inset-x-0 top-0 z-40 flex h-[54px] items-center justify-between px-[30px] pt-[6px]">
      <span className="w-[54px] text-center text-[17px] font-semibold tracking-[-0.2px] text-ink tabular">{time}</span>
      <span className="flex items-center gap-[6px]">
        {/* signal */}
        <svg width="18" height="12" viewBox="0 0 18 12" fill="#EDEDEB" aria-hidden="true">
          <rect x="0" y="8" width="3" height="4" rx="1" />
          <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
          <rect x="10" y="3" width="3" height="9" rx="1" />
          <rect x="15" y="0" width="3" height="12" rx="1" />
        </svg>
        {/* wifi */}
        <svg width="16" height="12" viewBox="0 0 16 12" fill="#EDEDEB" aria-hidden="true">
          <path d="M8 2.2c2.4 0 4.6.9 6.2 2.5l1.2-1.3C13.4 1.5 10.8.4 8 .4S2.6 1.5.6 3.4l1.2 1.3C3.4 3.1 5.6 2.2 8 2.2Z" />
          <path d="M8 5.6c1.5 0 2.8.6 3.8 1.5l1.2-1.3C11.7 4.6 9.9 3.8 8 3.8s-3.7.8-5 2l1.2 1.3c1-.9 2.3-1.5 3.8-1.5Z" />
          <path d="M8 9c.6 0 1.1.2 1.5.6L8 11.4 6.5 9.6C6.9 9.2 7.4 9 8 9Z" />
        </svg>
        {/* battery */}
        <svg width="27" height="13" viewBox="0 0 27 13" aria-hidden="true">
          <rect x="0.5" y="0.5" width="23" height="12" rx="3.8" fill="none" stroke="#EDEDEB" strokeOpacity="0.4" />
          <rect x="2" y="2" width="20" height="9" rx="2.5" fill="#EDEDEB" />
          <path d="M25 4.5v4c.8-.3 1.4-1.1 1.4-2s-.6-1.7-1.4-2Z" fill="#EDEDEB" fillOpacity="0.4" />
        </svg>
      </span>
    </div>
  );
}

type IconName = "back" | "close" | "more" | "plus";

export function NavCircle({ icon, className }: { icon: IconName; className?: string }) {
  return (
    <span className={`flex h-[44px] w-[44px] items-center justify-center rounded-full bg-card-hi ${className ?? ""}`}>
      {icon === "back" && (
        <svg width="12" height="20" viewBox="0 0 12 20" fill="none" stroke="#EDEDEB" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10 2 2 10l8 8" />
        </svg>
      )}
      {icon === "close" && (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#EDEDEB" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
          <path d="M2 2l10 10M12 2 2 12" />
        </svg>
      )}
      {icon === "more" && (
        <svg width="20" height="4" viewBox="0 0 20 4" fill="#EDEDEB" aria-hidden="true">
          <circle cx="2" cy="2" r="2" />
          <circle cx="10" cy="2" r="2" />
          <circle cx="18" cy="2" r="2" />
        </svg>
      )}
      {icon === "plus" && (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#EDEDEB" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
          <path d="M9 1.5v15M1.5 9h15" />
        </svg>
      )}
    </span>
  );
}

export function Play({ className, size = 9 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 9 10.4" className={className} aria-hidden="true">
      <path d="M0 0.6v9.2c0 .5.5.7.9.5l7.6-4.6c.4-.2.4-.8 0-1L.9.1C.5-.1 0 .1 0 .6Z" fill="currentColor" />
    </svg>
  );
}

export function UndoGlyph() {
  return (
    <svg width="14" height="12" viewBox="0 0 14 12" fill="none" stroke="#EDEDEB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4.5 1 1.5 4l3 3" />
      <path d="M1.8 4h6.7a4 4 0 0 1 0 8H5" />
    </svg>
  );
}

export function UndoPill() {
  return (
    <span className="flex h-[30px] items-center gap-[6px] rounded-full bg-card-hi px-[12px] text-[14px] font-medium text-ink">
      <UndoGlyph />
      Undo
    </span>
  );
}

/** The record mark: the app's dot mic (design/mic-marks.html). */
export function DotMic({ size = 22, color = "#0A0A0A" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="8" y="2.5" width="8" height="13" rx="4" fill={color} />
      <circle cx="12" cy="6.2" r="1.35" fill="#EDEDEB" />
      <circle cx="12" cy="9" r="1.35" fill="#EDEDEB" />
      <circle cx="12" cy="11.8" r="1.35" fill="#EDEDEB" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 18v4.5M8.8 22.5h6.4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** The seven-dot K, as the app's Krovvi glyph. */
export function KGlyph({ size = 18, color = "#EDEDEB" }: { size?: number; color?: string }) {
  const dots: Array<[number, number]> = [[40, 28], [40, 60], [40, 92], [61, 45], [82, 30], [61, 75], [82, 90]];
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
      {dots.map(([cx, cy]) => (
        <circle key={`${cx}${cy}`} cx={cx} cy={cy} r={10} fill={color} />
      ))}
    </svg>
  );
}

/** Krovvi's home-screen icon (brand/icon-1024.svg): eleven ivory dots as a K on black, in iOS's rounded square. */
const ICON_DOTS: Array<[number, number]> = [
  [358, 268.8], [358, 390.4], [358, 512], [358, 633.6], [358, 755.2],
  [464.4, 436], [570.8, 360], [677.2, 284], [464.4, 588], [570.8, 664], [677.2, 740],
];
export function AppIcon({ size = 60 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 1024 1024" className="shrink-0" aria-hidden="true">
      <rect width="1024" height="1024" rx="229" fill="#0A0A0A" />
      <rect x="2" y="2" width="1020" height="1020" rx="227" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="4" />
      {ICON_DOTS.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={49.4} fill="#EDEDEB" />
      ))}
    </svg>
  );
}

/** A round check, empty or done. */
export function Check({ done = false, className, style }: { done?: boolean; className?: string; style?: React.CSSProperties }) {
  return (
    <span className={`relative inline-flex h-[24px] w-[24px] shrink-0 items-center justify-center ${className ?? ""}`} style={style}>
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10.5" fill={done ? "#EDEDEB" : "none"} stroke={done ? "#EDEDEB" : "#7A7A74"} strokeWidth="2" />
        {done && <path d="M7.5 12.3l3 3 6-6.6" fill="none" stroke="#0A0A0A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />}
      </svg>
    </span>
  );
}

/* ── People: their first letter in Krovvi's dots, as the app draws it ──────
   A port of the app's components/person-face.tsx and lib/letter-dots.ts: the
   same dot-matrix capitals, the same pitch and dot size, and the same colour
   hashed from the name, so a person looks the same here as on the phone. */

const LATIN: Record<string, string[]> = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".###.", "#...#", "#....", "#....", "#....", "#...#", ".###."],
  D: ["###..", "#..#.", "#...#", "#...#", "#...#", "#..#.", "###.."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".###.", "#...#", "#....", "#.###", "#...#", "#...#", ".####"],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: [".###.", "..#..", "..#..", "..#..", "..#..", "..#..", ".###."],
  J: ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  N: ["#...#", "#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "#.#.#", ".#.#."],
  X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
};

/** The transcript's speaker inks (theme/tokens.ts voice). */
const VOICE = ["#E6DCC8", "#C98A62", "#B0A89D", "#C2A470", "#8F7864", "#D4B49A"];

/** The same warmth for the same person everywhere: hashed from the name, as the app does. */
export function personTint(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return VOICE[h % VOICE.length];
}

export function PersonFace({ name, size = 36 }: { name: string; size?: number }) {
  const tint = personTint(name);
  const letter = name.trim().charAt(0).toUpperCase();
  const rows = LATIN[letter];
  if (!rows) {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-full bg-card-hi font-semibold"
        style={{ width: size, height: size, fontSize: size * 0.44, color: tint }}
      >
        {letter}
      </span>
    );
  }
  const dots: Array<[number, number]> = [];
  rows.forEach((line, y) => [...line].forEach((cell, x) => cell === "#" && dots.push([x, y])));
  const xs = dots.map((d) => d[0]);
  const ys = dots.map((d) => d[1]);
  const cols = Math.max(...xs) - Math.min(...xs) + 1;
  const tall = Math.max(...ys) - Math.min(...ys) + 1;
  const small = size < 30;
  const pitch = (size * (small ? 0.64 : 0.56)) / 6;
  const r = pitch * (small ? 0.42 : 0.37);
  const x0 = size / 2 - ((cols - 1) * pitch) / 2 - Math.min(...xs) * pitch;
  const y0 = size / 2 - ((tall - 1) * pitch) / 2 - Math.min(...ys) * pitch;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0" aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={size / 2} fill="#1F1F1E" />
      {dots.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x0 + x * pitch} cy={y0 + y * pitch} r={r} fill={tint} />
      ))}
    </svg>
  );
}

/** A card, as the app's surface: one step above the ground, radius 17. */
export function Card({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`rounded-[17px] bg-card ${className ?? ""}`} style={style}>
      {children}
    </div>
  );
}

export function Divider({ inset = 16 }: { inset?: number }) {
  return <div className="h-px bg-line" style={{ marginLeft: inset, marginRight: inset }} />;
}
