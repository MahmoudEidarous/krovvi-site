/**
 * The app's icons as SVG: a port of catch8 src/components/glyph.tsx at
 * 272d7cc5. Every icon there is drawn on a 24 unit square from round boxes,
 * open arcs, straight pieces with round ends and the brand's dots (its ICON
 * table, glyph.tsx:233-298, copied here as it is), or, for a few, a stroked
 * path. Each one here is one small <svg>, drawn the way the app's views draw
 * it: a box's line on its centre line, a side that ends in the open cut flat,
 * a corner round only where both its sides are drawn. Server renderable.
 */

import type { CSSProperties } from "react";

import { C } from "./tokens";

type Seg = readonly [number, number, number, number];
type Dot = readonly [number, number, number?, number?];
type Box = readonly [number, number, number, number, number, string?, number?, string?];
type Arc = readonly [number, number, number, number?];

interface Drawing {
  boxes?: readonly Box[];
  arcs?: readonly Arc[];
  segs?: readonly Seg[];
  d?: string;
  body?: string;
  dots?: readonly Dot[];
}

/** glyph.tsx:230 */
const cap = (x: number, y: number): Seg => [x, y, x, y];

/** glyph.tsx:233-298, as it is. */
const ICON = {
  chevronLeft: { segs: [[20.4, -1.9, 6.5, 12], [6.5, 12, 20.4, 25.9]] },
  chevronRight: { segs: [[3.6, -1.9, 17.5, 12], [17.5, 12, 3.6, 25.9]] },
  check: { segs: [[0, 14.1, 6.5, 20.6], [6.5, 20.6, 20.6, 6.5]] },
  cross: { segs: [[4.4, 4.4, 19.6, 19.6], [19.6, 4.4, 4.4, 19.6]] },
  plus: { segs: [[12, 1.7, 12, 22.3], [1.7, 12, 22.3, 12]] },
  outward: { segs: [[4.6, 19.4, 19.6, 4.4], [9, 4.4, 19.6, 4.4], [19.6, 4.4, 19.6, 15]] },
  textLines: { segs: [[2.4, 6, 21.6, 6], [2.4, 12, 21.6, 12], [2.4, 18, 13.6, 18]] },
  waveform: { segs: [[3.4, 9.4, 3.4, 14.6], [7.7, 5.4, 7.7, 18.6], [12, 2.2, 12, 21.8], [16.3, 7, 16.3, 17], [20.6, 9.8, 20.6, 14.2]] },
  search: { boxes: [[1.6, 1.6, 16, 16, 8]], segs: [[15.5, 15.5, 22.2, 22.2]], dots: [[9.6, 9.6]] },
  clock: { boxes: [[1.4, 1.4, 21.2, 21.2, 10.6]], segs: [[12, 6.4, 12, 12], [12, 12, 16.6, 12]] },
  folder: { boxes: [[1.4, 6, 21.2, 14.6, 2.4], [1.4, 3.4, 7, 5, 2, "tl"], [6.4, 3.4, 4.2, 2.6, 2, "tr"]] },
  lock: { boxes: [[2.8, 10.4, 18.4, 12.2, 2.6], [7, 1.8, 10, 8.6, 5, "trl"]], dots: [[12, 16.5]] },
  trash: { boxes: [[9, 2.4, 6, 3.4, 1.8, "trl"], [5, 5.8, 14, 16.8, 2.6, "rbl"]], segs: [[2.2, 5.8, 21.8, 5.8]] },
  bubble: { boxes: [[1.4, 2.4, 21.2, 14, 5.6]], segs: [[11.4, 16.4, 6.8, 20.6], [6.8, 20.6, 6.8, 16.2]], dots: [[12, 9.4]] },
  undo: { boxes: [[8.5, 7.2, 13.4, 13.4, 6.7, "trb"]], segs: [[7.8, 2.4, 3, 7.2], [3, 7.2, 7.8, 12], [3, 7.2, 15.2, 7.2], [6.4, 20.6, 15.2, 20.6]] },
  copy: { boxes: [[1.4, 8.4, 14.2, 14.2, 2.8], [8.4, 1.4, 4, 3.8, 2.8, "tl"], [11.2, 1.4, 11.4, 11, 2.8, "tr"], [18.8, 11.6, 3.8, 4, 2.8, "rb"]], segs: [cap(8.4, 5.2), cap(18.8, 15.6)] },
  doc: { boxes: [[4, 1.4, 16, 21.2, 3]], segs: [[8.4, 8.8, 15.6, 8.8], [8.4, 13.6, 12.6, 13.6]] },
  shareOut: { boxes: [[2.8, 11.8, 18.4, 9.6, 2.8, "rbl"]], segs: [[12, 1.8, 12, 14.4], [7, 6.8, 12, 1.8], [12, 1.8, 17, 6.8], cap(2.8, 11.8), cap(21.2, 11.8)] },
  fileIn: { d: "M5.6 1.4 h8.9 l5.6 5.6 v13.8 a1.8 1.8 0 0 1 -1.8 1.8 h-12.7 a1.8 1.8 0 0 1 -1.8 -1.8 v-17.6 a1.8 1.8 0 0 1 1.8 -1.8 z M14.5 1.6 v5.4 h5.4", dots: [[12, 15, 1.45]] },
  globe: { boxes: [[1.4, 1.4, 21.2, 21.2, 10.6], [7.2, 1.4, 9.6, 21.2, 4.8]], segs: [[1.4, 12, 22.6, 12]] },
  envelope: { boxes: [[1.4, 4.4, 21.2, 15.2, 3]], segs: [[2.6, 6.6, 12, 13.2], [12, 13.2, 21.4, 6.6]] },
  people: {
    boxes: [[5.2, 2.8, 7.2, 7.2, 3.6], [1.6, 13, 14.4, 8.6, 7.2, "trl"], [15.4, 3, 3.4, 6.8, 3.4, "trb"], [15.2, 13.4, 7.2, 8.2, 7.2, "tr"]],
    segs: [cap(1.6, 21.6), cap(16, 21.6), cap(15.4, 3), cap(15.4, 9.8), cap(15.2, 13.4), cap(22.4, 21.6)],
  },
  calendar: { boxes: [[1.4, 3.8, 21.2, 18.8, 3.4]], segs: [[1.4, 9.6, 22.6, 9.6], [7, 1.4, 7, 6], [17, 1.4, 17, 6]], dots: [[7.6, 15.6]] },
  past: { d: "M4.86 7.12 A9.2 9.2 0 1 1 3.51 14.78 M4.48 2.74 L4.86 7.12 L9.11 5.98 M12.4 7.4 v5.2 l3.4 2" },
  marker: { boxes: [[3.8, 1.6, 16.4, 16.4, 8.2, undefined, 45, "br"]], segs: [cap(12, 21.4)], dots: [[12, 9.8, 2.2]] },
  camera: { boxes: [[1.4, 10.5, 21.2, 11.4, 2.5, "rbl"], [1.4, 5.5, 7.8, 6, 2.5, "tl"], [14.8, 5.5, 7.8, 6, 2.5, "tr"], [8.8, 2.7, 6.4, 2.8, 1.4, "trl"], [7.6, 8.8, 8.8, 8.8, 4.4]], dots: [[12, 13.2, 1.4]] },
  picture: { boxes: [[1.4, 2.6, 21.2, 18.8, 3.2]], segs: [[2.2, 18.2, 8.3, 12.1], [8.3, 12.1, 13.5, 17.3], [13.5, 17.3, 16.4, 14.4], [16.4, 14.4, 21.8, 19.8]], dots: [[16.4, 8.2, 1.8]] },
  video: { boxes: [[2.5, 6.6, 13, 10.8, 3.1]], segs: [[15.9, 10.4, 21.2, 7.4], [21.2, 7.4, 21.2, 16.6], [21.2, 16.6, 15.9, 13.6]], dots: [[9, 12, 1.45]] },
  link: { boxes: [[2, 12.3, 12.4, 7, 3.5, undefined, -45], [9.6, 4.7, 12.4, 7, 3.5, undefined, -45]] },
  stack: { boxes: [[1.4, 7.4, 15.2, 15.2, 3], [7.4, 1.4, 4, 3, 2.8, "tl"], [10.2, 1.4, 12.4, 12, 2.8, "tr"], [19.4, 12.6, 3.2, 4, 2.8, "rb"]], segs: [cap(7.4, 4.4), cap(19.4, 16.6)], dots: [[9, 15]] },
  pencil: { segs: [[15.4, 2, 22, 8.6], [22, 8.6, 8.4, 22.2], [8.4, 22.2, 1.8, 22.2], [1.8, 22.2, 1.8, 15.6], [1.8, 15.6, 15.4, 2], [12.2, 5.2, 18.8, 11.8]] },
  reply: { boxes: [[4, 11, 16, 8, 6.5, "tr"]], segs: [[9.5, 5.5, 4, 11], [4, 11, 9.5, 16.5]] },
  retry: { arcs: [[12, 12.5, 8.6]], segs: [[6.5, 10.6, 6.8, 5.6], [6.8, 5.6, 1.8, 5.8]] },
} satisfies Record<string, Drawing>;

export type IconName = keyof typeof ICON;

/** glyph.tsx:49-51, one dot of the system, never under 1.6. */
function unitDot(size: number): number {
  return Math.max(1.6, (2.7 * size) / 24);
}

const f = (n: number) => Math.round(n * 1000) / 1000;

type Side = "t" | "r" | "b" | "l";
const SIDES: readonly Side[] = ["t", "r", "b", "l"];
const NEXT: Record<Side, Side> = { t: "r", r: "b", b: "l", l: "t" };
const PREV: Record<Side, Side> = { t: "l", r: "t", b: "r", l: "b" };
/** The corner a side runs into, going clockwise, by the app's names for them (glyph.tsx:136). */
const CORNER_AFTER: Record<Side, "tr" | "br" | "bl" | "tl"> = { t: "tr", r: "br", b: "bl", l: "tl" };
const DIR: Record<Side, readonly [number, number]> = { t: [1, 0], r: [0, 1], b: [-1, 0], l: [0, -1] };

/**
 * A box's line by its centre, with only the sides it has (glyph.tsx:120-160):
 * a corner is round only where both its sides are drawn and it is not left
 * square, and a side that stops in the open is cut flat on the corner's line.
 * The radii are fitted the way iOS fits a view's corners: the two on one side
 * never add up to more than that side (both measured outside the line).
 */
function boxPath(x0: number, y0: number, x1: number, y1: number, rad: number, weight: number, sides: string | undefined, sharp: string | undefined): string {
  const has = (s: Side) => !sides || sides.includes(s);
  const out = (s: Side) => (has(s) ? weight / 2 : 0);
  const W = x1 - x0 + out("l") + out("r");
  const H = y1 - y0 + out("t") + out("b");
  const outer: Record<string, number> = {};
  for (const s of SIDES) {
    const name = CORNER_AFTER[s];
    outer[name] = has(s) && has(NEXT[s]) && !sharp?.includes(name) ? rad + weight / 2 : 0;
  }
  let k = 1;
  const fit = (len: number, a: number, b: number) => {
    if (a + b > len && a + b > 0) k = Math.min(k, len / (a + b));
  };
  fit(W, outer.tl, outer.tr);
  fit(W, outer.bl, outer.br);
  fit(H, outer.tl, outer.bl);
  fit(H, outer.tr, outer.br);
  const r = (name: string) => (outer[name] > 0 ? Math.max(0, outer[name] * k - weight / 2) : 0);
  const from: Record<Side, readonly [number, number]> = { t: [x0, y0], r: [x1, y0], b: [x1, y1], l: [x0, y1] };
  const all = SIDES.every(has);
  const start = all ? "t" : SIDES.find((s) => has(s) && !has(PREV[s]));
  if (!start) return "";
  let d = "";
  let inRun = false;
  let s: Side = start;
  for (let n = 0; n < 4; n += 1) {
    if (has(s)) {
      if (!inRun) {
        const before = r(CORNER_AFTER[PREV[s]]);
        d += `M${f(from[s][0] + DIR[s][0] * before)} ${f(from[s][1] + DIR[s][1] * before)}`;
        inRun = true;
      }
      const after = r(CORNER_AFTER[s]);
      const [tx, ty] = from[NEXT[s]];
      d += `L${f(tx - DIR[s][0] * after)} ${f(ty - DIR[s][1] * after)}`;
      if (after > 0) d += `A${f(after)} ${f(after)} 0 0 1 ${f(tx + DIR[NEXT[s]][0] * after)} ${f(ty + DIR[NEXT[s]][1] * after)}`;
    } else {
      inRun = false;
    }
    s = NEXT[s];
  }
  return all ? `${d}Z` : d;
}

/** The line of a whole round box in the drawing's units, for an icon drawn as one path (glyph.tsx:226-227). */
const unitBox = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y} h${w - r * 2} a${r} ${r} 0 0 1 ${r} ${r} v${h - r * 2} a${r} ${r} 0 0 1 ${-r} ${r} h${-(w - r * 2)} a${r} ${r} 0 0 1 ${-r} ${-r} v${-(h - r * 2)} a${r} ${r} 0 0 1 ${r} ${-r} z`;

const circle = (cx: number, cy: number, r: number) => `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(r * 2)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-r * 2)} 0Z`;

export interface GlyphProps {
  size?: number;
  color?: string;
  weight?: number;
  className?: string;
  style?: CSSProperties;
}

/** Draws one drawing, as glyph.tsx's Stroke (glyph.tsx:120-224). `w` and `h` are the room it takes when that is not a square of `size`. */
function Stroke({ drawing, size, color, weight, w = size, h = size, className, style }: { drawing: Drawing; size: number; color: string; weight: number; w?: number; h?: number; className?: string; style?: CSSProperties }) {
  const u = size / 24;
  const left = (w - size) / 2;
  const top = (h - size) / 2;
  const dotOf = (r?: number) => (r === undefined ? unitDot(size) : Math.max(1.6, 2 * r * u));
  const svgStyle: CSSProperties = { display: "block", overflow: "visible", flexShrink: 0, ...style };
  const dots = drawing.dots ?? [];
  if (!drawing.d && !drawing.body) {
    const segs = drawing.segs ?? [];
    const segD = segs
      .map(([x1, y1, x2, y2]) => (x1 === x2 && y1 === y2 ? `M${f(x1 * u)} ${f(y1 * u)}l0.001 0` : `M${f(x1 * u)} ${f(y1 * u)}L${f(x2 * u)} ${f(y2 * u)}`))
      .join("");
    return (
      <svg width={f(w)} height={f(h)} viewBox={`0 0 ${f(w)} ${f(h)}`} className={className} style={svgStyle} aria-hidden="true">
        <g transform={`translate(${f(left)} ${f(top)})`} fill="none" stroke={color} strokeWidth={weight}>
          {(drawing.boxes ?? []).map(([x, y, bw, bh, r, sides, turn, sharp], i) => {
            const rot = turn ? `rotate(${turn} ${f((x + bw / 2) * u)} ${f((y + bh / 2) * u)})` : undefined;
            if (!sides && !sharp) {
              return <rect key={`b${i}`} x={f(x * u)} y={f(y * u)} width={f(bw * u)} height={f(bh * u)} rx={f(Math.min(r * u, (bw * u) / 2, (bh * u) / 2))} transform={rot} />;
            }
            return <path key={`b${i}`} d={boxPath(x * u, y * u, (x + bw) * u, (y + bh) * u, r * u, weight, sides, sharp)} strokeLinecap="butt" strokeLinejoin="miter" transform={rot} />;
          })}
          {(drawing.arcs ?? []).map(([cx, cy, r, turn], i) => {
            // A ring with its top quarter left clear: from 45 degrees right of the top, round the far side, to 45 degrees left of it.
            const R = r * u;
            const X = cx * u;
            const Y = cy * u;
            const a0 = (-45 * Math.PI) / 180;
            const a1 = (225 * Math.PI) / 180;
            const d = `M${f(X + R * Math.cos(a0))} ${f(Y + R * Math.sin(a0))}A${f(R)} ${f(R)} 0 1 1 ${f(X + R * Math.cos(a1))} ${f(Y + R * Math.sin(a1))}`;
            return <path key={`a${i}`} d={d} strokeLinecap="butt" transform={turn ? `rotate(${turn} ${f(X)} ${f(Y)})` : undefined} />;
          })}
          {segD ? <path d={segD} strokeLinecap="round" strokeLinejoin="round" /> : null}
          {dots.length ? (
            <g stroke="none" fill={color}>
              {dots.map(([cx, cy, r, light], i) => (
                <path key={`d${i}`} d={circle(cx * u, cy * u, dotOf(r) / 2)} opacity={light} />
              ))}
            </g>
          ) : null}
        </g>
      </svg>
    );
  }
  const line = [drawing.d ?? "", ...(drawing.boxes ?? []).map(([x, y, bw, bh, r]) => unitBox(x, y, bw, bh, r)), ...(drawing.segs ?? []).map(([x1, y1, x2, y2]) => `M${x1} ${y1} L${x2} ${y2}`)].filter(Boolean).join(" ");
  return (
    <svg width={f(w)} height={f(h)} viewBox={`0 0 ${f(w)} ${f(h)}`} className={className} style={svgStyle} aria-hidden="true">
      <g transform={`translate(${f(left)} ${f(top)}) scale(${f(u)})`}>
        {drawing.body ? <path d={drawing.body} fill={color} fillRule="evenodd" /> : null}
        {line && drawing.d !== undefined ? <path d={line} fill="none" stroke={color} strokeWidth={weight / u} strokeLinecap="round" strokeLinejoin="round" /> : null}
        {dots.map(([cx, cy, r, light], i) => (
          <path key={i} d={circle(cx, cy, dotOf(r) / 2 / u)} fill={color} opacity={light ?? 1} />
        ))}
      </g>
    </svg>
  );
}

/** Any icon of the table by its name. */
export function Icon({ name, size = 16, color = C.fg, weight = 1.5, ...rest }: GlyphProps & { name: IconName }) {
  return <Stroke drawing={ICON[name]} size={size} color={color} weight={weight} {...rest} />;
}

/** Tick: as wide as its size, a little over half as tall (glyph.tsx:369-371). */
export function Check({ size = 12, color = C.bg, weight = 2, ...rest }: GlyphProps) {
  return <Stroke drawing={ICON.check} size={size} color={color} weight={weight} h={size * 0.55} {...rest} />;
}

/** Krovvi's K: seven dots on the 120 unit square, each 20 across (glyph.tsx:301-339). */
export const K_DOTS: ReadonlyArray<readonly [number, number]> = [
  [40, 28],
  [40, 60],
  [40, 92],
  [61, 45],
  [82, 30],
  [61, 75],
  [82, 90],
];

export function KrovviK({ size = 16, color = C.fg, className, style }: { size?: number; color?: string; className?: string; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={className} style={{ display: "block", flexShrink: 0, ...style }} aria-hidden="true">
      <path d={K_DOTS.map(([x, y]) => circle(x, y, 10)).join("")} fill={color} />
    </svg>
  );
}

/**
 * The mic the owner chose (glyph.tsx:545-573): a solid capsule with three of
 * the brand's dots cut through it, on a cradle, stem and foot drawn as one
 * line 1.9 of the 24 units at every size.
 */
const MIC_BODY =
  "M8.5 5.3 a3.5 3.5 0 0 1 7 0 v5.4 a3.5 3.5 0 0 1 -7 0 z" +
  " M10.95 5.3 a1.05 1.05 0 1 0 2.1 0 a1.05 1.05 0 1 0 -2.1 0 z" +
  " M10.95 8.1 a1.05 1.05 0 1 0 2.1 0 a1.05 1.05 0 1 0 -2.1 0 z" +
  " M10.95 10.9 a1.05 1.05 0 1 0 2.1 0 a1.05 1.05 0 1 0 -2.1 0 z";
const MIC_BASE = "M4.9 10.4 a7.1 7.1 0 0 0 14.2 0 M12 17.5 v3.6 M8.7 21.1 h6.6";

export function Mic({ size = 16, color = C.fg, className, style }: { size?: number; color?: string; className?: string; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={{ display: "block", overflow: "visible", flexShrink: 0, ...style }} aria-hidden="true">
      <path d={MIC_BODY} fill={color} fillRule="evenodd" />
      <path d={MIC_BASE} fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Send: a stem and two arms meeting on one round joint (glyph.tsx:416-475),
 * each a bar with round ends, the arms turned 45 degrees about their middles.
 */
export function ArrowUp({ size = 13, color = C.bg, weight = 1.8, className, style }: GlyphProps) {
  const inset = 1;
  const arm = size * 0.46;
  const cx = size / 2;
  const apexY = inset + weight / 2;
  const shift = arm * 0.354;
  const half = arm / 2 - weight / 2;
  const k = Math.SQRT1_2;
  const lx = cx - shift;
  const rx = cx + shift;
  const my = apexY + shift;
  const d =
    `M${f(cx)} ${f(inset + weight / 2)}L${f(cx)} ${f(size - inset - weight / 2)}` +
    `M${f(lx - half * k)} ${f(my + half * k)}L${f(lx + half * k)} ${f(my - half * k)}` +
    `M${f(rx - half * k)} ${f(my - half * k)}L${f(rx + half * k)} ${f(my + half * k)}`;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className} style={{ display: "block", overflow: "visible", flexShrink: 0, ...style }} aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth={weight} strokeLinecap="round" />
    </svg>
  );
}

/** More: three of the system's dots, a step larger (glyph.tsx:487-510). */
export function More({ size = 16, color = C.fg, className, style }: { size?: number; color?: string; className?: string; style?: CSSProperties }) {
  const u = size / 24;
  const dot = Math.max(2.5, 3.2 * u);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className} style={{ display: "block", flexShrink: 0, ...style }} aria-hidden="true">
      <path d={[6, 12, 18].map((x) => circle(x * u, 12 * u, dot / 2)).join("")} fill={color} />
    </svg>
  );
}

/** Not right (components/answer/not-right.tsx:27-40). */
const THUMB_DOWN = "M17 14V2M9 18.12L10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z";

export function ThumbDown({ size = 14, color = C.faint, weight = 1.5, className, style }: GlyphProps) {
  const u = size / 24;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={{ display: "block", overflow: "visible", flexShrink: 0, ...style }} aria-hidden="true">
      <path d={THUMB_DOWN} fill="none" stroke={color} strokeWidth={weight / u} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Add a reaction: a face with a small + at its top corner (components/answer/reply-menu.tsx:548-579). */
export function ReactGlyph({ size = 15, color = C.fg, weight = 1.5, className, style }: GlyphProps) {
  const face = size * 0.86;
  const eye = Math.max(1.6, size * 0.12);
  const smile = face * 0.48;
  const plus = size * 0.42;
  const W = size + plus * 0.45;
  const fy = size - face;
  const r = face / 2;
  return (
    <svg width={f(W)} height={size} viewBox={`0 0 ${f(W)} ${size}`} className={className} style={{ display: "block", overflow: "visible", flexShrink: 0, ...style }} aria-hidden="true">
      <circle cx={f(r)} cy={f(fy + r)} r={f(r - weight / 2)} fill="none" stroke={color} strokeWidth={weight} />
      <path d={circle(face * 0.31, size - face * 0.56 - eye / 2, eye / 2) + circle(face * 0.69, size - face * 0.56 - eye / 2, eye / 2)} fill={color} />
      <path
        d={`M${f((face - smile) / 2 + weight * 0.3)} ${f(size - face * 0.2 - smile / 2)}A${f(smile / 2 - weight * 0.3)} ${f(smile / 2 - weight / 2)} 0 0 0 ${f((face + smile) / 2 - weight * 0.3)} ${f(size - face * 0.2 - smile / 2)}`}
        fill="none"
        stroke={color}
        strokeWidth={weight}
      />
      <rect x={f(W - plus)} y={f(plus / 2 - weight / 2)} width={f(plus)} height={f(weight)} fill={color} />
      <rect x={f(W - plus / 2 - weight / 2)} y={0} width={f(weight)} height={f(plus)} fill={color} />
    </svg>
  );
}
