"use client";

/**
 * The board's charts, drawn by hand in SVG so they look like the app and not
 * like a chart library: ivory on black, thin lines, small round bars, and a
 * quiet card that follows the finger or the pointer with the numbers of the
 * bar under it. Every chart takes the width it is given and redraws when the
 * window or the phone turns.
 */

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

export const FG = "#EDEDEB";
export const LINE = "#262625";
export const MUTED = "#8F8F8A";
export const DANGER = "#C4574F";
/** The three shades of one ink: outside people, guests, the team. */
export const SHADE = { outside: FG, guests: "rgba(237,237,235,0.5)", team: "rgba(237,237,235,0.2)" };

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** The width a chart has to draw in, kept up to date. */
export function useWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T>(null);
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

/** The card with a bar's numbers. It sits beside the bar, on the side with more room. */
function Tip({ x, width, children }: { x: number; width: number; children: ReactNode }) {
  const right = x > width / 2;
  return (
    <div
      className="pointer-events-none absolute top-0 z-10 min-w-[136px] max-w-[240px] rounded-xl border border-[#2C2C2A] bg-[#1F1F1E]/95 px-3 py-2.5 text-[12.5px] leading-[1.45] text-[#EDEDEB] shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-md"
      style={right ? { right: Math.max(0, width - x + 10) } : { left: Math.max(0, x + 10) }}
    >
      {children}
    </div>
  );
}

export function TipTitle({ children }: { children: ReactNode }) {
  return <div className="mb-1 font-semibold text-[#EDEDEB]">{children}</div>;
}

export function TipRow({ color, label, value }: { color?: string; label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[#A9A8A2]">
      {color ? <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} /> : null}
      <span className="flex-1">{label}</span>
      <span className="font-medium tabular-nums text-[#EDEDEB]">{value}</span>
    </div>
  );
}

export interface BarPoint {
  key: string;
  /** Stacked from the bottom, one value per series. */
  values: number[];
  /** A mark at this height on the bar: the same hour yesterday, say. */
  ghost?: number;
}

/**
 * Bars, stacked. Hover or touch a bar for its numbers; tap it to pick it
 * (onPick), tap again to let it go. The current bar (now) is marked under
 * the axis.
 */
export function Bars({
  points,
  colors,
  height = 176,
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
  /** The smallest top the axis may have, so a quiet day does not look like a busy one. */
  floor?: number;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const axisW = 30;
  const top = 10;
  const bottom = 22;
  const plotW = Math.max(0, width - axisW);
  const plotH = height - top - bottom;
  const n = points.length;
  const step = n ? plotW / n : 0;
  const barW = Math.max(2, Math.min(26, step * 0.62));
  const most = Math.max(floor, ...points.map((p) => Math.max(p.values.reduce((a, b) => a + b, 0), p.ghost ?? 0)));
  const max = niceMax(most);
  const y = (v: number) => top + plotH - (v / max) * plotH;
  const active = hover ?? picked;
  const ticks = Number.isInteger(max / 2) ? [0, max / 2, max] : [0, max];

  const at = (clientX: number) => {
    const el = ref.current;
    if (!el || !step) return null;
    const x = clientX - el.getBoundingClientRect().left;
    const i = Math.floor(x / step);
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
            if (e.pointerType !== "mouse") setHover(null);
            const i = at(e.clientX);
            if (onPick) onPick(i === null || i === picked ? null : i);
          }}
          role="img"
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={0} x2={plotW} y1={y(t)} y2={y(t)} stroke={LINE} strokeDasharray={t === 0 ? undefined : "2 4"} />
              <text x={width - 2} y={y(t) + 3.5} textAnchor="end" fontSize={10.5} fill={MUTED} className="tabular-nums">
                {unit(t)}
              </text>
            </g>
          ))}
          <g className="team-grow">
            {points.map((p, i) => {
              const cx = i * step + step / 2;
              let base = 0;
              const dim = active !== null && active !== i;
              return (
                <g key={p.key} opacity={dim ? 0.42 : 1} style={{ transition: "opacity 160ms ease" }}>
                  {p.ghost ? (
                    <rect x={cx - barW / 2 + 0.5} y={y(p.ghost) + 0.5} width={barW - 1} height={Math.max(1, y(0) - y(p.ghost) - 1)} rx={Math.min(3, barW / 2)} fill="none" stroke="rgba(237,237,235,0.4)" strokeWidth={1} strokeDasharray="2 2" />
                  ) : null}
                  {p.values.map((v, s) => {
                    if (v <= 0) return null;
                    const y0 = y(base);
                    const y1 = y(base + v);
                    base += v;
                    const h = Math.max(1.5, y0 - y1 - (s > 0 ? 1.5 : 0));
                    return <rect key={s} x={cx - barW / 2} y={y0 - h - (s > 0 ? 1.5 : 0)} width={barW} height={h} rx={Math.min(3, barW / 2)} fill={colors[s]} />;
                  })}
                </g>
              );
            })}
          </g>
          {points.map((p, i) => {
            const text = label(i);
            if (!text) return null;
            return (
              <text key={p.key} x={i * step + step / 2} y={height - 6} textAnchor="middle" fontSize={10.5} fill={i === now ? FG : MUTED} fontWeight={i === now ? 600 : 400} className="tabular-nums">
                {text}
              </text>
            );
          })}
          {now !== undefined && now >= 0 && now < n ? <circle cx={now * step + step / 2} cy={height - 18} r={1.6} fill={FG} /> : null}
        </svg>
      ) : null}
      {active !== null && width > 0 ? <Tip x={active * step + step / 2} width={width}>{tip(active)}</Tip> : null}
    </div>
  );
}

export interface LineSeries {
  values: Array<number | null>;
  color: string;
  width?: number;
  dash?: string;
  /** A soft fill under the line. */
  fill?: boolean;
  /** A dot on every day that has a value, so a day alone between empty days still shows. */
  dots?: boolean;
}

/** Lines over days: the answer time's middle and its slow end. Gaps where a day had nothing. */
export function Lines({
  keys,
  series,
  height = 176,
  label,
  tip,
  unit,
  floor = 1,
}: {
  keys: string[];
  series: LineSeries[];
  height?: number;
  label: (i: number) => string;
  tip: (i: number) => ReactNode;
  unit: (v: number) => string;
  floor?: number;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const axisW = 38;
  const top = 12;
  const bottom = 22;
  const plotW = Math.max(0, width - axisW);
  const plotH = height - top - bottom;
  const n = keys.length;
  const pad = 6;
  const x = (i: number) => pad + (n > 1 ? (i * (plotW - pad * 2)) / (n - 1) : plotW / 2);
  const most = Math.max(floor, ...series.flatMap((s) => s.values.filter((v): v is number => v !== null)));
  const max = niceMax(most);
  const y = (v: number) => top + plotH - (v / max) * plotH;
  const ticks = [0, max / 2, max];

  const path = (values: Array<number | null>) => {
    let d = "";
    let pen = false;
    values.forEach((v, i) => {
      if (v === null) {
        pen = false;
        return;
      }
      d += `${pen ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
      pen = true;
    });
    return d;
  };

  const area = (values: Array<number | null>) => {
    const runs: string[] = [];
    let run: number[] = [];
    const flush = () => {
      if (run.length > 1) {
        runs.push(`M${x(run[0]).toFixed(1)},${y(0).toFixed(1)}${run.map((i) => `L${x(i).toFixed(1)},${y(values[i] as number).toFixed(1)}`).join("")}L${x(run[run.length - 1]).toFixed(1)},${y(0).toFixed(1)}Z`);
      }
      run = [];
    };
    values.forEach((v, i) => (v === null ? flush() : run.push(i)));
    flush();
    return runs.join("");
  };

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
          onPointerUp={(e) => (e.pointerType !== "mouse" ? setHover(null) : undefined)}
          role="img"
        >
          <defs>
            <linearGradient id="team-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={FG} stopOpacity={0.16} />
              <stop offset="100%" stopColor={FG} stopOpacity={0} />
            </linearGradient>
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={0} x2={plotW} y1={y(t)} y2={y(t)} stroke={LINE} strokeDasharray={t === 0 ? undefined : "2 4"} />
              <text x={width - 2} y={y(t) + 3.5} textAnchor="end" fontSize={10.5} fill={MUTED} className="tabular-nums">
                {unit(t)}
              </text>
            </g>
          ))}
          {series.map((s, si) => (s.fill ? <path key={`a${si}`} d={area(s.values)} fill="url(#team-area)" /> : null))}
          {series.map((s, si) => (
            <path key={`l${si}`} d={path(s.values)} fill="none" stroke={s.color} strokeWidth={s.width ?? 2} strokeDasharray={s.dash} strokeLinejoin="round" strokeLinecap="round" className="team-draw" />
          ))}
          {series.map((s, si) =>
            s.dots
              ? s.values.map((v, i) => (v === null ? null : <circle key={`d${si}-${i}`} cx={x(i)} cy={y(v)} r={2.4} fill={s.color} className="team-draw" />))
              : null,
          )}
          {hover !== null ? (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={top} y2={top + plotH} stroke="rgba(237,237,235,0.25)" />
              {series.map((s, si) => {
                const v = s.values[hover];
                return v === null ? null : <circle key={si} cx={x(hover)} cy={y(v)} r={3.5} fill="#0A0A0A" stroke={s.color} strokeWidth={2} />;
              })}
            </g>
          ) : null}
          {keys.map((k, i) => {
            const text = label(i);
            return text ? (
              <text key={k} x={x(i)} y={height - 6} textAnchor="middle" fontSize={10.5} fill={MUTED} className="tabular-nums">
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

/** Fourteen days in a row as tiny bars: a person's rhythm at a glance. */
export function Spark({ values, width = 86, height = 24 }: { values: number[]; width?: number; height?: number }) {
  const max = Math.max(1, ...values);
  const step = width / values.length;
  const w = Math.max(2, step * 0.6);
  return (
    <svg width={width} height={height} aria-hidden="true" className="block">
      {values.map((v, i) => {
        const cx = i * step + step / 2;
        if (v <= 0) return <circle key={i} cx={cx} cy={height - 1.5} r={1} fill="rgba(237,237,235,0.18)" />;
        const h = Math.max(3, (v / max) * (height - 2));
        return <rect key={i} x={cx - w / 2} y={height - h} width={w} height={h} rx={w / 2} fill={FG} opacity={0.35 + 0.65 * (v / max)} />;
      })}
    </svg>
  );
}

/** The 24 hours of a day as cells, brighter where more happened. */
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
            className="h-9 rounded-[5px] transition-[outline-color] duration-150"
            style={{
              width: cell,
              background: v ? `rgba(237,237,235,${0.1 + 0.85 * (v / max)})` : "#161615",
              outline: hover === h ? "1.5px solid rgba(237,237,235,0.8)" : "1.5px solid transparent",
              outlineOffset: 1,
            }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[10.5px] tabular-nums text-[#8F8F8A]">
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

/** Rows of what was done, each with a bar against the biggest. */
export function Breakdown({ rows }: { rows: Array<{ label: string; value: number; shown?: string }> }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="flex flex-col gap-3">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="flex items-baseline justify-between text-[13.5px]">
            <span className="text-[#A9A8A2]">{r.label}</span>
            <span className="font-medium tabular-nums text-[#EDEDEB]">{r.shown ?? r.value.toLocaleString("en-US")}</span>
          </div>
          <div className="mt-1.5 h-[5px] overflow-hidden rounded-full bg-[#1F1F1E]">
            <div className="team-fill h-full rounded-full bg-[#EDEDEB]" style={{ width: `${(r.value / max) * 100}%`, opacity: r.value ? 0.9 : 0 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Steps people pass one after another, each as a share of the first. */
export function Steps({ steps }: { steps: Array<{ label: string; value: number; note?: string }> }) {
  const first = Math.max(1, steps[0]?.value ?? 1);
  return (
    <div className="flex flex-col gap-2.5">
      {steps.map((s, i) => {
        const share = s.value / first;
        return (
          <div key={s.label} className="relative overflow-hidden rounded-xl bg-[#161615]">
            <div className="team-fill absolute inset-y-0 left-0 rounded-xl" style={{ width: `${Math.max(share * 100, s.value ? 6 : 0)}%`, background: `rgba(237,237,235,${0.16 - i * 0.02})` }} />
            <div className="relative flex items-center justify-between gap-3 px-3.5 py-3">
              <div className="min-w-0">
                <div className="text-[14px] font-medium text-[#EDEDEB]">{s.label}</div>
                {s.note ? <div className="mt-0.5 truncate text-[12px] text-[#8F8F8A]">{s.note}</div> : null}
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[18px] font-semibold tabular-nums text-[#EDEDEB]">{s.value}</div>
                <div className="text-[11.5px] tabular-nums text-[#8F8F8A]">{i === 0 ? "everyone" : `${Math.round(share * 100)}%`}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
