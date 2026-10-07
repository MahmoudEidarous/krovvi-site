"use client";

/**
 * The charts Health and Fitness draw on the page, as the app draws them
 * (catch8 src/components/objects/kit/chart.tsx): a bar for each day with its
 * number written over it, two bars side by side for this week and the last,
 * a line through readings over time, and a row of small squares for the last
 * days. Each wears its app's one colour and says its numbers in words, so
 * nothing has to be read off a shape alone.
 */

import type { ReactNode } from "react";

import { EASE, INK, STEP } from "../kit";
import { over, wash } from "./sheet";

/** A hundredth of a pixel: the server's HTML and the browser then write the same number, so the page hydrates clean. */
const px = (v: number) => Math.round(v * 100) / 100;

export interface DayBar {
  key: string;
  /** Under the bar: "Mon", "M". */
  label: string;
  value: number;
  /** Over the bar, when there is something to say: "11,200", "7h 10m". */
  text?: string | null;
  /** The whole column in words, for a screen reader. */
  says: string;
  now?: boolean;
  /** A second fact about the day, as a small dot under its bar: filled when it holds, a ring when it does not. Left out when the chart has none. */
  mark?: boolean;
}

/**
 * A bar for each day, the day's number over it. `goal` draws a dashed line
 * across. The bars follow the page's direction, as a calendar's week does.
 */
export function DayBars({ bars, height = 92, goal, tint, label }: { bars: DayBar[]; height?: number; goal?: number | null; tint: string; label: string }) {
  const most = Math.max(0, ...bars.map((b) => b.value), goal ?? 0);
  const top = most > 0 ? most : 1;
  const marks = bars.some((b) => b.mark !== undefined);
  // The line of text over the tallest bar.
  const HEAD = 16;
  return (
    <div role="img" aria-label={`${label}. ${bars.map((b) => b.says).join(". ")}`}>
      <div className="relative flex" style={{ height: height + HEAD, gap: 4 }} aria-hidden>
        {goal && goal > 0 ? <span className="absolute inset-x-0" style={{ bottom: px((goal / top) * height), borderTop: `1px dashed ${INK.faint}`, opacity: 0.7 }} /> : null}
        {bars.map((b) => {
          const h = b.value > 0 ? Math.max(3, px((b.value / top) * height)) : 0;
          return (
            <div key={b.key} className="relative flex min-w-0 flex-1 flex-col items-center justify-end">
              {b.text ? (
                // The card's own ground behind the number, so the goal's line never runs through it.
                <span dir="ltr" style={{ ...STEP.meta, fontSize: 11, lineHeight: `${HEAD}px`, color: b.now ? INK.fg : INK.soft, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", background: INK.surface, padding: "0 2px" }}>
                  {b.text}
                </span>
              ) : null}
              <span
                style={{
                  width: "58%",
                  maxWidth: 24,
                  height: h || 2,
                  borderRadius: h ? 5 : 1,
                  background: h ? (b.now ? tint : over(tint, INK.surface, 0.6)) : INK.track,
                  transition: `height 420ms ${EASE}`,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex" style={{ gap: 4, marginTop: 8 }} aria-hidden>
        {bars.map((b) => (
          <div key={b.key} className="flex min-w-0 flex-1 flex-col items-center" style={{ gap: 6 }}>
            {marks ? <span style={{ width: 8, height: 8, borderRadius: "50%", boxSizing: "border-box", background: b.mark ? INK.fg : "transparent", border: b.mark ? "none" : `1.2px solid ${b.now ? INK.soft : INK.faint}`, opacity: b.mark || b.now ? 1 : 0.55 }} /> : null}
            <span style={{ ...STEP.meta, color: b.now ? INK.fg : INK.muted }}>{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** One line under a chart that says what its marks are: a small sample of each, then its words. */
export function Legend({ items, tint }: { items: Array<{ sample: "bar" | "dash" | "dot"; text: string }>; tint: string }) {
  return (
    <div className="flex flex-wrap items-center" style={{ columnGap: 14, rowGap: 4 }}>
      {items.map((it) => (
        <span key={it.text} className="inline-flex items-center" style={{ ...STEP.meta, color: INK.muted, gap: 6 }}>
          {it.sample === "bar" ? (
            <span aria-hidden style={{ width: 6, height: 10, borderRadius: 2, background: tint }} />
          ) : it.sample === "dash" ? (
            <span aria-hidden style={{ width: 12, borderTop: `1px dashed ${INK.faint}` }} />
          ) : (
            <span aria-hidden style={{ width: 8, height: 8, borderRadius: "50%", background: INK.fg }} />
          )}
          {it.text}
        </span>
      ))}
    </div>
  );
}

export interface Pair {
  key: string;
  name: string;
  /** This week's number, and the words after it: a unit ("kg"), or the aim it is said against ("of 20 km"). */
  value: string;
  after?: string | null;
  now: number;
  before: number;
  /** "last week 83". */
  beforeText: string;
}

/**
 * This week beside the last, a thing a row: two bars on one scale, this
 * week's in the app's colour and last week's quiet, each with its number
 * written beside it. The numbers share one column, so every bar starts and
 * ends at the same place down the card.
 */
export function Pairs({ rows, tint }: { rows: Pair[]; tint: string }) {
  const bar = (share: number, colour: string) => (
    <span className="block self-center" style={{ height: 8, borderRadius: 4, background: INK.track }}>
      <span className="block" style={{ height: 8, borderRadius: 4, width: `${px(Math.max(share > 0 ? 2 : 0, share * 100))}%`, background: colour, transition: `width 420ms ${EASE}` }} />
    </span>
  );
  return (
    <div className="grid" style={{ gridTemplateColumns: "minmax(0, 1fr) auto", columnGap: 12, rowGap: 5, padding: "2px 16px 16px" }}>
      {rows.map((r, i) => {
        const top = Math.max(r.now, r.before, 1e-9);
        return (
          <div key={r.key} className="contents" role="group" aria-label={`${r.name}: ${r.value}${r.after ? ` ${r.after}` : ""}. ${r.beforeText}`}>
            <span aria-hidden style={{ ...STEP.label, color: INK.muted, gridColumn: "1 / -1", textAlign: "start", marginTop: i ? 11 : 4, paddingTop: i ? 12 : 0, borderTop: i ? `0.5px solid ${INK.line}` : undefined }}>
              {r.name}
            </span>
            {bar(r.now / top, tint)}
            <span aria-hidden className="inline-flex items-baseline justify-end" style={{ gap: 5 }}>
              <span style={{ ...STEP.title, fontVariantNumeric: "tabular-nums" }}>{r.value}</span>
              {r.after ? <span style={{ ...STEP.meta, color: INK.muted }}>{r.after}</span> : null}
            </span>
            {bar(r.before / top, INK.faint)}
            <span aria-hidden style={{ ...STEP.meta, color: INK.muted, textAlign: "end", fontVariantNumeric: "tabular-nums" }}>
              {r.beforeText}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** A smooth line through points that never rises above or dips below them between two readings (monotone cubic). */
function curve(pts: Array<{ x: number; y: number }>): string {
  if (!pts.length) return "";
  if (pts.length === 1) return `M ${px(pts[0].x)} ${px(pts[0].y)}`;
  const n = pts.length;
  const d: number[] = [];
  for (let i = 0; i < n - 1; i += 1) d.push((pts[i + 1].y - pts[i].y) / (pts[i + 1].x - pts[i].x));
  const m: number[] = [d[0]];
  for (let i = 1; i < n - 1; i += 1) m.push(d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2);
  m.push(d[n - 2]);
  for (let i = 0; i < n - 1; i += 1) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }
  let path = `M ${px(pts[0].x)} ${px(pts[0].y)}`;
  for (let i = 0; i < n - 1; i += 1) {
    const h = pts[i + 1].x - pts[i].x;
    path += ` C ${px(pts[i].x + h / 3)} ${px(pts[i].y + (m[i] * h) / 3)} ${px(pts[i + 1].x - h / 3)} ${px(pts[i + 1].y - (m[i + 1] * h) / 3)} ${px(pts[i + 1].x)} ${px(pts[i + 1].y)}`;
  }
  return path;
}

/**
 * A number over time, as a line with a soft area under it: a blood pressure
 * over three months. Its lowest and highest are written at the side and its
 * first and last days under it. Time runs left to right in both languages,
 * as the app draws it.
 */
export function LineChart({ points, tint, format, ticks, label }: { points: number[]; tint: string; format: (n: number) => string; /** The first and the last day, in words. */ ticks: [string, string]; label: string }) {
  const W = 300;
  const H = 104;
  const PAD = 8;
  const lo = Math.min(...points);
  const hi = Math.max(...points);
  const span = hi - lo < 1e-9 ? 1 : hi - lo;
  // A little air above and below, so the line never touches the frame.
  const y = (v: number) => PAD + (1 - (v - lo + span * 0.12) / (span * 1.24)) * (H - PAD * 2);
  const x = (i: number) => PAD + (points.length === 1 ? (W - PAD * 2) / 2 : (i / (points.length - 1)) * (W - PAD * 2));
  const pts = points.map((v, i) => ({ x: x(i), y: y(v) }));
  const line = curve(pts);
  const last = pts[pts.length - 1];
  const id = `line-${label.replace(/[^a-z0-9]/gi, "")}-${points.length}`;
  return (
    <div dir="ltr" role="img" aria-label={label}>
      <div className="flex items-stretch" style={{ gap: 8 }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="min-w-0 flex-1" style={{ display: "block", height: "auto" }} aria-hidden>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={tint} stopOpacity="0.2" />
              <stop offset="1" stopColor={tint} stopOpacity="0" />
            </linearGradient>
          </defs>
          {pts.length > 1 ? <path d={`${line} L ${px(last.x)} ${H} L ${px(pts[0].x)} ${H} Z`} fill={`url(#${id})`} /> : null}
          <path d={line} fill="none" stroke={tint} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={px(last.x)} cy={px(last.y)} r="4.2" fill={tint} stroke={INK.surface} strokeWidth="2" />
        </svg>
        <div className="flex shrink-0 flex-col justify-between" style={{ ...STEP.meta, color: INK.muted, padding: "2px 0", fontVariantNumeric: "tabular-nums", minWidth: 28 }} aria-hidden>
          <span>{format(hi)}</span>
          <span>{format(lo)}</span>
        </div>
      </div>
      <div className="flex justify-between" style={{ ...STEP.meta, color: INK.muted, marginTop: 4, paddingInlineEnd: 36 }} aria-hidden>
        <span>{ticks[0]}</span>
        <span>{ticks[1]}</span>
      </div>
    </div>
  );
}

/** The last days as a row of small squares, oldest first: 1 full, between a half, 0 empty, null a day that had nothing to do. */
export function Squares({ days, tint, label, level }: { days: Array<number | null>; tint: string; label: string; /** How strong a square is drawn for its number, 0 to 1; a dose's days are full or half. */ level?: (n: number) => number }) {
  const strength = level ?? ((n: number) => (n >= 1 ? 1 : 0.45));
  return (
    <div className="flex" style={{ gap: 4 }} role="img" aria-label={label}>
      {days.map((d, i) => (
        <span
          key={i}
          aria-hidden
          className="min-w-0 flex-1"
          style={{
            height: 14,
            borderRadius: 4,
            boxSizing: "border-box",
            background: d === null ? "transparent" : d > 0 ? wash(tint, strength(d)) : INK.track,
            border: d === null ? `0.5px solid ${INK.line}` : "none",
          }}
        />
      ))}
    </div>
  );
}

/** A few numbers side by side, each under its name: the head of a chart. */
export function Stats({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start justify-between" style={{ gap: 12 }}>
      {children}
    </div>
  );
}

export function Stat({ name, value, unit, sub, end, small }: { name: string; value: string; unit?: string | null; sub?: string | null; /** Set at the far edge, its words lined up with it. */ end?: boolean; /** One of several under a chart, not the card's point. */ small?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col" style={{ gap: 1, alignItems: end ? "flex-end" : "flex-start" }}>
      <span style={{ ...(small ? STEP.meta : STEP.label), color: INK.muted }}>{name}</span>
      <span className="inline-flex items-baseline" style={{ gap: 5 }}>
        <span style={small ? { ...STEP.title, fontVariantNumeric: "tabular-nums" } : STEP.figure}>{value}</span>
        {unit ? <span style={{ ...STEP.label, color: INK.muted }}>{unit}</span> : null}
      </span>
      {sub ? <span style={{ ...STEP.meta, color: INK.muted }}>{sub}</span> : null}
    </div>
  );
}
