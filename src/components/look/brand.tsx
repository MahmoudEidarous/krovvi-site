/**
 * Krovvi's mark and name, drawn the way the app draws them: the Heavy k (the owner's pick, 31 October 2026, on
 * catch8 design/krovvi-new-look-2026-10-28/the-k.html; the app's lib/k-shape.ts and its icon are the same strokes) and
 * the word "krovvi" written in the same round-ended strokes. Units are the logo page's: baseline 78.3, x-height 32,
 * the top of the k 15.5, the Heavy stroke 14.3.
 */

const B = 78.3;
const X = 32;
const T = 15.5;
const HEAVY = 14.3;
const f = (n: number) => (+n).toFixed(2);

/** One drawn piece of a letter: a round-ended stroke along a path, or the dot of the i. */
export type Piece = { d: string; w: number } | { cx: number; cy: number; r: number };

/** A letter: its pieces, and its left and right edges with the round ends included. */
export interface Letter {
  ch: string;
  pieces: Piece[];
  left: number;
  right: number;
}

/** The k: a straight stem, an arm up to the x-height, and a leg that springs from the arm. x is the stem's left edge. */
function kAt(x: number, w: number): Letter {
  const r = w / 2;
  const s = x + r;
  const J = [s, 68];
  const A = [s + 26.55, X + r];
  const lt = 0.48;
  const L0 = [J[0] + lt * (A[0] - J[0]), J[1] + lt * (A[1] - J[1])];
  const L1 = [s + 27.6, B - r];
  return {
    ch: "k",
    // the arm and the leg run a hair thinner than the stem, so the three look the same weight
    pieces: [
      { d: `M${f(s)} ${f(T + r)}V${f(B - r)}`, w },
      { d: `M${f(J[0])} ${f(J[1])}L${f(A[0])} ${f(A[1])}M${f(L0[0])} ${f(L0[1])}L${f(L1[0])} ${f(L1[1])}`, w: w * 0.96 },
    ],
    left: x,
    right: L1[0] + r,
  };
}

/** "krovvi" in the k's strokes, letter by letter, as the logo page writes it. */
export function wordLetters(w = HEAVY): Letter[] {
  const r = w / 2;
  const xh = B - X;
  const thin = 0.96;
  const out: Letter[] = [];
  const k = kAt(0, w);
  out.push(k);
  let x = k.right + 6;
  {
    // r
    const s = x + r;
    const tx = s + 19;
    const ty = X + r + 1.2;
    out.push({
      ch: "r",
      pieces: [
        { d: `M${f(s)} ${f(X + r)}V${f(B - r)}`, w },
        { d: `M${f(s)} ${f(X + r + 17)}C${f(s)} ${f(X + r + 3)} ${f(s + 6.5)} ${f(X + r - 0.6)} ${f(tx)} ${f(ty)}`, w: w * thin },
      ],
      left: x,
      right: tx + r,
    });
    x = tx + r + 3.2;
  }
  {
    // o
    const ow = xh * 1.03;
    const cx = x + ow / 2;
    const cy = B - xh / 2;
    const ex = ow / 2 - r;
    const ey = (xh + 1.6) / 2 - r;
    out.push({
      ch: "o",
      pieces: [{ d: `M${f(cx - ex)} ${f(cy)}A${f(ex)} ${f(ey)} 0 1 0 ${f(cx + ex)} ${f(cy)}A${f(ex)} ${f(ey)} 0 1 0 ${f(cx - ex)} ${f(cy)}Z`, w }],
      left: x,
      right: x + ow,
    });
    x += ow + 3.6;
  }
  for (let n = 0; n < 2; n++) {
    // v v
    const vw = xh * 0.95;
    const a = x + r;
    const b = x + vw - r;
    const m = x + vw / 2;
    out.push({ ch: "v", pieces: [{ d: `M${f(a)} ${f(X + r)}L${f(m)} ${f(B - r)}L${f(b)} ${f(X + r)}`, w: w * thin }], left: x, right: x + vw });
    x += vw + (n === 0 ? 2.4 : 5);
  }
  {
    // i
    const s = x + r;
    const dr = r * 0.94;
    out.push({
      ch: "i",
      pieces: [
        { d: `M${f(s)} ${f(X + r)}V${f(B - r)}`, w },
        { cx: s, cy: X - 3.6 - dr, r: dr },
      ],
      left: x,
      right: s + r,
    });
  }
  return out;
}

/** The word's box in its own units: from its first stroke to its last, from the top of the k to the baseline. */
export const WORD_TOP = T - 1.5;
export const WORD_BOTTOM = B + 1;

export function Pieces({ pieces }: { pieces: Piece[] }) {
  return (
    <>
      {pieces.map((p, i) =>
        "d" in p ? (
          <path key={i} d={p.d} fill="none" stroke="currentColor" strokeWidth={f(p.w)} strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <circle key={i} cx={f(p.cx)} cy={f(p.cy)} r={f(p.r)} fill="currentColor" />
        )
      )}
    </>
  );
}

/** "krovvi", drawn: as tall as its box, in currentColor. */
export function Wordmark({ className }: { className?: string }) {
  const letters = wordLetters();
  const right = letters[letters.length - 1].right;
  return (
    <svg className={className} viewBox={`-1 ${f(WORD_TOP)} ${f(right + 2)} ${f(WORD_BOTTOM - WORD_TOP)}`} aria-hidden="true" focusable="false">
      {letters.map((l, i) => (
        <Pieces key={i} pieces={l.pieces} />
      ))}
    </svg>
  );
}

/** The k on its own, centred in a square of 100 the way the logo page centres it (a touch right, a touch high). */
export function KGlyph({ className, share = 60 }: { className?: string; share?: number }) {
  const k = kAt(0, HEAVY);
  const sc = share / (B - T);
  const tx = 50.8 - (k.right / 2) * sc;
  const ty = 48.4 - ((T + B) / 2) * sc;
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <g transform={`translate(${f(tx)} ${f(ty)}) scale(${f(sc)})`}>
        <Pieces pieces={k.pieces} />
      </g>
    </svg>
  );
}

/** The app icon: the white k on Krovvi's colour (the colour you picked on the page), as the icon tile draws it. */
export function KTile({ size }: { size: number }) {
  return (
    <span className="ktile" style={{ width: size, height: size }} aria-hidden="true">
      <KGlyph />
    </span>
  );
}
