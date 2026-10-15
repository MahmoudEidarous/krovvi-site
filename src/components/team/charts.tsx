"use client";

/**
 * The board's charts, drawn by hand in SVG in the app's night look: ivory on
 * near black, smooth lines with a soft fall of light under them, bars with
 * round tops, hairline guides, and a small dark card that follows the finger
 * or the pointer with the numbers under it. Every chart takes the width it is
 * given and redraws when the window or the phone turns.
 */

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";

export const FG = "#EDEDEB";
export const MUTED = "#8F8F8A";
export const FAINT = "#7A7A74";
export const DANGER = "#C4574F";
const GUIDE = "rgba(255,255,255,0.05)";
const BASE = "rgba(255,255,255,0.1)";

/** One ink in three strengths: outside people, guests, the team. */
export const SHADE = { outside: FG, guests: "rgba(237,237,235,0.45)", team: "rgba(237,237,235,0.17)" };

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** The width a chart has to draw in, kept up to date. */
export function useWidth<E extends HTMLElement>(): [React.RefObject<E | null>, number] {
  const ref = useRef<E>(null);
  const [width, setWidth] = useState(0);
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

/** A round top for an axis: 1, 2, 2.5 or 5 times a power of ten. */
export function niceMax(v: number): number {
  if (v <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return step * pow;
}

function count(v: number): string {
  return Math.round(v).toLocaleString("en-US");
}

/** The card with the numbers under the pointer, on the side with more room. */
function Tip({ x, width, children }: { x: number; width: number; children: ReactNode }) {
  const right = x > width / 2;
  return (
    <div
      className="pointer-events-none absolute top-0 z-10 min-w-[150px] max-w-[250px] rounded-[12px] border border-white/[0.1] bg-[#161619]/95 px-3 py-2.5 text-[12.5px] leading-[1.5] text-[#EDEDEB] shadow-[0_12px_32px_rgba(0,0,0,0.55)] backdrop-blur-md"
      style={right ? { right: Math.max(0, width - x + 12) } : { left: Math.max(0, x + 12) }}
    >
      {children}
    </div>
  );
}

export function TipTitle({ children }: { children: ReactNode }) {
  return <div className="mb-1 text-[12px] font-medium text-[#A9A8A2]">{children}</div>;
}

export function TipRow({ color, label, value, dotted }: { color?: string; label: ReactNode; value: ReactNode; dotted?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {color ? dotted ? <span className="w-2.5 shrink-0" style={{ borderTop: `1.5px dotted ${color}` }} /> : <span className="h-[7px] w-[7px] shrink-0 rounded-full" style={{ background: color }} /> : null}
      <span className="flex-1 text-[#A9A8A2]">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

/** A smooth line through points that never overshoots them (monotone cubic, Fritsch and Carlson). */
function smooth(pts: Array<[number, number]>): string {
  const n = pts.length;
  if (!n) return "";
  if (n === 1) return `M${pts[0][0]},${pts[0][1]}`;
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) m.push((pts[i + 1][1] - pts[i][1]) / (pts[i + 1][0] - pts[i][0]));
  const t: number[] = new Array(n);
  t[0] = m[0];
  t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = 0;
      t[i + 1] = 0;
      continue;
    }
    const a = t[i] / m[i];
    const b = t[i + 1] / m[i];
    const s = a * a + b * b;
    if (s > 9) {
      const k = 3 / Math.sqrt(s);
      t[i] = k * a * m[i];
      t[i + 1] = k * b * m[i];
    }
  }
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const h = (pts[i + 1][0] - pts[i][0]) / 3;
    d += `C${(pts[i][0] + h).toFixed(1)},${(pts[i][1] + t[i] * h).toFixed(1)} ${(pts[i + 1][0] - h).toFixed(1)},${(pts[i + 1][1] - t[i + 1] * h).toFixed(1)} ${pts[i + 1][0].toFixed(1)},${pts[i + 1][1].toFixed(1)}`;
  }
  return d;
}

/** Runs of indexes with a value: a line breaks where a day had none, unless it joins over them. */
function runs(values: Array<number | null>, join = false): number[][] {
  if (join) {
    const all = values.flatMap((v, i) => (v === null ? [] : [i]));
    return all.length ? [all] : [];
  }
  const out: number[][] = [];
  let run: number[] = [];
  values.forEach((v, i) => {
    if (v === null) {
      if (run.length) out.push(run);
      run = [];
    } else run.push(i);
  });
  if (run.length) out.push(run);
  return out;
}

export interface Series {
  values: Array<number | null>;
  color: string;
  width?: number;
  dotted?: boolean;
  /** A soft fall of light under the line. */
  fill?: boolean;
  /** Mark the last point with a breathing dot: where today has got to. */
  live?: boolean;
  /** Draw straight on over the days that have no value instead of breaking the line. */
  join?: boolean;
}

/**
 * Lines over time, smooth, with light falling under the first. Hover or
 * touch for the numbers at that moment.
 */
export function Lines({
  series,
  height = 200,
  label,
  tip,
  unit = count,
  floor = 4,
  marks,
}: {
  series: Series[];
  height?: number;
  label: (i: number) => string;
  tip: (i: number) => ReactNode;
  unit?: (v: number) => string;
  floor?: number;
  /** Indexes to mark with a faint upright line (now, say). */
  marks?: number[];
}) {
  const id = useId().replace(/:/g, "");
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const axisW = 34;
  const top = 10;
  const bottom = 24;
  const plotW = Math.max(0, width - axisW);
  const plotH = height - top - bottom;
  const n = series[0]?.values.length ?? 0;
  const pad = 4;
  const x = (i: number) => pad + (n > 1 ? (i * (plotW - pad * 2)) / (n - 1) : plotW / 2);
  const most = Math.max(floor, ...series.flatMap((s) => s.values.filter((v): v is number => v !== null)));
  const max = niceMax(most);
  const y = (v: number) => top + plotH - (v / max) * plotH;
  const ticks = [0, max / 2, max];

  const at = (clientX: number) => {
    const el = ref.current;
    if (!el || n === 0) return null;
    const px = clientX - el.getBoundingClientRect().left;
    const i = Math.round(((px - pad) / Math.max(1, plotW - pad * 2)) * (n - 1));
    return Math.min(n - 1, Math.max(0, i));
  };

  return (
    <div ref={ref} className="relative select-none" style={{ height }}>
      {width > 0 ? (
        <svg
          width={width}
          height={height}
          className="block touch-pan-y"
          onPointerMove={(e) => setHover(at(e.clientX))}
          onPointerLeave={() => setHover(null)}
          onPointerUp={(e) => (e.pointerType !== "mouse" ? setTimeout(() => setHover(null), 1600) : undefined)}
          role="img"
        >
          <defs>
            <linearGradient id={`fall-${id}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={FG} stopOpacity={0.2} />
              <stop offset="100%" stopColor={FG} stopOpacity={0} />
            </linearGradient>
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={0} x2={plotW} y1={y(t)} y2={y(t)} stroke={t === 0 ? BASE : GUIDE} />
              <text x={width} y={y(t) + 3.5} textAnchor="end" fontSize={11} fill={FAINT} className="tabular-nums">
                {unit(t)}
              </text>
            </g>
          ))}
          {(marks ?? []).map((i) => (
            <line key={`m${i}`} x1={x(i)} x2={x(i)} y1={top} y2={top + plotH} stroke="rgba(237,237,235,0.14)" strokeDasharray="2 3" />
          ))}
          {series.map((s, si) =>
            s.fill
              ? runs(s.values, s.join).map((r) => {
                  const pts = r.map((i) => [x(i), y(s.values[i] as number)] as [number, number]);
                  if (pts.length < 2) return null;
                  return <path key={`f${si}-${r[0]}`} d={`${smooth(pts)}L${pts[pts.length - 1][0]},${y(0)}L${pts[0][0]},${y(0)}Z`} fill={`url(#fall-${id})`} className="team-draw" />;
                })
              : null,
          )}
          {series.map((s, si) =>
            runs(s.values, s.join).map((r) => {
              const pts = r.map((i) => [x(i), y(s.values[i] as number)] as [number, number]);
              if (pts.length === 1) return <circle key={`p${si}-${r[0]}`} cx={pts[0][0]} cy={pts[0][1]} r={2.5} fill={s.color} />;
              return (
                <path
                  key={`l${si}-${r[0]}`}
                  d={smooth(pts)}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={s.width ?? 2}
                  strokeDasharray={s.dotted ? "1.5 4" : undefined}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="team-draw"
                />
              );
            }),
          )}
          {series.map((s, si) => {
            if (!s.live) return null;
            let last = -1;
            s.values.forEach((v, i) => {
              if (v !== null) last = i;
            });
            if (last < 0) return null;
            return (
              <g key={`live${si}`}>
                <circle cx={x(last)} cy={y(s.values[last] as number)} r={9} fill={s.color} opacity={0.12} className="team-breathe" />
                <circle cx={x(last)} cy={y(s.values[last] as number)} r={3.5} fill={s.color} />
              </g>
            );
          })}
          {hover !== null ? (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={top} y2={top + plotH} stroke="rgba(237,237,235,0.22)" />
              {series.map((s, si) => {
                const v = s.values[hover];
                return v === null ? null : <circle key={si} cx={x(hover)} cy={y(v)} r={3.5} fill="#030303" stroke={s.color} strokeWidth={2} />;
              })}
            </g>
          ) : null}
          {Array.from({ length: n }, (_, i) => {
            const text = label(i);
            return text ? (
              <text key={i} x={x(i)} y={height - 6} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} fontSize={11} fill={FAINT} className="tabular-nums">
                {text}
              </text>
            ) : null;
          })}
        </svg>
      ) : null}
      {hover !== null && width > 0 ? <Tip x={x(hover)} width={width}>{tip(hover)}</Tip> : null}
    </div>
  );
}

/** A bar with a round top and a flat foot. */
function topRound(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.min(r, w / 2, h);
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
}

export interface BarPoint {
  key: string;
  /** Stacked from the bottom, one value per series. */
  values: number[];
}

/** Bars, stacked, round on top. Hover or touch a bar for its numbers; tap to pick it (onPick), tap again to let go. */
export function Bars({
  points,
  colors,
  height = 190,
  label,
  tip,
  picked = null,
  onPick,
  now,
  unit = count,
  floor = 4,
}: {
  points: BarPoint[];
  colors: string[];
  height?: number;
  label: (i: number) => string;
  tip: (i: number) => ReactNode;
  picked?: number | null;
  onPick?: (i: number | null) => void;
  now?: number;
  unit?: (v: number) => string;
  floor?: number;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const axisW = 30;
  const top = 10;
  const bottom = 24;
  const plotW = Math.max(0, width - axisW);
  const plotH = height - top - bottom;
  const n = points.length;
  const step = n ? plotW / n : 0;
  const barW = Math.max(2, Math.min(20, step * 0.56));
  const most = Math.max(floor, ...points.map((p) => p.values.reduce((a, b) => a + b, 0)));
  const max = niceMax(most);
  const y = (v: number) => top + plotH - (v / max) * plotH;
  const active = hover ?? picked;
  const ticks = Number.isInteger(max / 2) ? [0, max / 2, max] : [0, max];

  const at = (clientX: number) => {
    const el = ref.current;
    if (!el || !step) return null;
    const i = Math.floor((clientX - el.getBoundingClientRect().left) / step);
    return i >= 0 && i < n ? i : null;
  };

  return (
    <div ref={ref} className="relative select-none" style={{ height }}>
      {width > 0 ? (
        <svg
          width={width}
          height={height}
          className="block touch-pan-y"
          onPointerMove={(e) => setHover(at(e.clientX))}
          onPointerLeave={(e) => (e.pointerType === "mouse" ? setHover(null) : undefined)}
          onPointerUp={(e) => {
            if (e.pointerType !== "mouse") setTimeout(() => setHover(null), 1600);
            const i = at(e.clientX);
            if (onPick) onPick(i === null || i === picked ? null : i);
          }}
          role="img"
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={0} x2={plotW} y1={y(t)} y2={y(t)} stroke={t === 0 ? BASE : GUIDE} />
              <text x={width} y={y(t) + 3.5} textAnchor="end" fontSize={11} fill={FAINT} className="tabular-nums">
                {unit(t)}
              </text>
            </g>
          ))}
          <g className="team-grow">
            {points.map((p, i) => {
              const cx = i * step + step / 2;
              const total = p.values.reduce((a, b) => a + b, 0);
              if (total <= 0) return <rect key={p.key} x={cx - barW / 2} y={y(0) - 1.5} width={barW} height={1.5} rx={0.75} fill="rgba(237,237,235,0.12)" />;
              const lastSeg = p.values.reduce((last, v, s) => (v > 0 ? s : last), -1);
              let base = 0;
              return (
                <g key={p.key} opacity={active !== null && active !== i ? 0.35 : 1} style={{ transition: "opacity 160ms ease" }}>
                  {p.values.map((v, s) => {
                    if (v <= 0) return null;
                    const y0 = y(base);
                    const y1 = y(base + v);
                    base += v;
                    const h = Math.max(1.5, y0 - y1);
                    return s === lastSeg ? (
                      <path key={s} d={topRound(cx - barW / 2, y0 - h, barW, h, 3.5)} fill={colors[s]} />
                    ) : (
                      <rect key={s} x={cx - barW / 2} y={y0 - h} width={barW} height={h} fill={colors[s]} />
                    );
                  })}
                </g>
              );
            })}
          </g>
          {points.map((p, i) => {
            const text = label(i);
            return text ? (
              <text key={p.key} x={i * step + step / 2} y={height - 6} textAnchor="middle" fontSize={11} fill={i === now ? FG : FAINT} fontWeight={i === now ? 500 : 400} className="tabular-nums">
                {text}
              </text>
            ) : null;
          })}
        </svg>
      ) : null}
      {active !== null && width > 0 ? <Tip x={active * step + step / 2} width={width}>{tip(active)}</Tip> : null}
    </div>
  );
}

/** Fourteen days in a row as tiny bars: a person's rhythm at a glance. */
export function Spark({ values, width = 84, height = 22 }: { values: number[]; width?: number; height?: number }) {
  const max = Math.max(1, ...values);
  const step = width / values.length;
  const w = Math.max(2, step * 0.5);
  return (
    <svg width={width} height={height} aria-hidden="true" className="block">
      {values.map((v, i) => {
        const cx = i * step + step / 2;
        if (v <= 0) return <rect key={i} x={cx - w / 2} y={height - 1.5} width={w} height={1.5} rx={0.75} fill="rgba(237,237,235,0.14)" />;
        const h = Math.max(3, (v / max) * (height - 1));
        return <path key={i} d={topRound(cx - w / 2, height - h, w, h, w / 2)} fill={FG} opacity={0.4 + 0.6 * (v / max)} />;
      })}
    </svg>
  );
}

/** The 24 hours of a day as a row of cells, brighter where more happened. */
export function HourStrip({ values, tip }: { values: number[]; tip: (h: number) => ReactNode }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...values);
  const gap = 3;
  const cell = width ? (width - gap * 23) / 24 : 0;
  return (
    <div ref={ref} className="relative select-none">
      <div className="flex" style={{ gap }} onPointerLeave={() => setHover(null)}>
        {values.map((v, h) => (
          <div
            key={h}
            onPointerEnter={() => setHover(h)}
            onPointerDown={() => setHover(h)}
            onPointerUp={(e) => (e.pointerType !== "mouse" ? setTimeout(() => setHover(null), 1400) : undefined)}
            className="h-8 rounded-[5px] transition-[box-shadow] duration-150"
            style={{
              width: cell,
              background: v ? `rgba(237,237,235,${0.08 + 0.82 * (v / max)})` : "rgba(255,255,255,0.04)",
              boxShadow: hover === h ? "0 0 0 1.5px rgba(237,237,235,0.85)" : "none",
            }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] tabular-nums text-[#7A7A74]">
        <span>00</span>
        <span>06</span>
        <span>12</span>
        <span>18</span>
        <span>23</span>
      </div>
      {hover !== null && width > 0 ? (
        <div className="absolute -top-2 left-0 right-0">
          <Tip x={hover * (cell + gap) + cell / 2} width={width}>
            {tip(hover)}
          </Tip>
        </div>
      ) : null}
    </div>
  );
}

/** Rows of what was done: the words, the number, and a thin line against the biggest. */
export function Breakdown({ rows }: { rows: Array<{ label: string; value: number; shown?: string }> }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="flex flex-col gap-3.5">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="flex items-baseline justify-between gap-3 text-[14px] leading-[20px]">
            <span className={r.value ? "text-[#D9D8D3]" : "text-[#7A7A74]"}>{r.label}</span>
            <span className={`tabular-nums ${r.value ? "text-[#EDEDEB]" : "text-[#7A7A74]"}`}>{r.shown ?? r.value.toLocaleString("en-US")}</span>
          </div>
          <div className="mt-1.5 h-[3px] overflow-hidden rounded-full bg-white/[0.06]">
            <div className="team-fill h-full rounded-full bg-[#EDEDEB]" style={{ width: `${(r.value / max) * 100}%`, opacity: r.value ? 0.85 : 0 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Steps people pass one after another: how many reached each, and the share of the first. */
export function Steps({ steps }: { steps: Array<{ label: string; value: number; note?: string }> }) {
  const first = Math.max(1, steps[0]?.value ?? 1);
  return (
    <div className="flex flex-col">
      {steps.map((s, i) => {
        const share = s.value / first;
        return (
          <div key={s.label} className={`py-3 ${i ? "border-t border-white/[0.06]" : ""}`}>
            <div className="flex items-baseline justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[14px] text-[#D9D8D3]">{s.label}</span>
                {s.note ? <span className="ml-2 text-[12px] text-[#7A7A74]">{s.note}</span> : null}
              </div>
              <div className="shrink-0 text-right tabular-nums">
                <span className="text-[17px] font-light tracking-[-0.4px] text-[#EDEDEB]">{s.value}</span>
                <span className="ml-2 inline-block w-10 text-[12px] text-[#7A7A74]">{i === 0 ? "" : `${Math.round(share * 100)}%`}</span>
              </div>
            </div>
            <div className="mt-2 h-[3px] overflow-hidden rounded-full bg-white/[0.06]">
              <div className="team-fill h-full rounded-full bg-[#EDEDEB]" style={{ width: `${share * 100}%`, opacity: 0.35 + 0.6 * share }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
