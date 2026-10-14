/**
 * The screens Krovvi draws inside its answers, in the night look (catch8
 * src/components/screen at 272d7cc5): one card of dark glass with the card's
 * name, its bricks 20 apart, every brick in the answer's look
 * (components/answer/look.ts). Put them inside a Turn, after KrovviText. The
 * pieces a long answer carries on their own (the stats card, the Tip
 * callout) are here too. Server renderable; content through props.
 */

import "./deep.css";

import type { CSSProperties, ReactNode } from "react";

import { emo, type Piece } from "./chat";
import { Check, Icon } from "./glyphs";
import { C, FACE, HAIR, INK, SCREEN, STAR_ROOM, THREAD_SIDE } from "./tokens";

const cx = (...names: Array<string | false | null | undefined>) => names.filter(Boolean).join(" ") || undefined;

/** components/screen/parts.tsx:17-31 */
export const SCREEN_GAP = 20;
const PAD = 16;
/** The chat's column: the screen less the side margins and the star's room (components/screen/screen.tsx:25). */
export const COLUMN = SCREEN.width - THREAD_SIDE * 2 - STAR_ROOM;
/** A brick's room inside the card. */
export const BRICK_WIDTH = COLUMN - PAD * 2;

/** A hairline between rows (components/answer/look.ts:115). */
const RULE: CSSProperties = { height: HAIR, background: C.line };

/** The screen's glass (look.ts:104, theme/pane.ts:27-34). */
const CARD: CSSProperties = { background: C.glass, border: `${HAIR}px solid ${C.glassEdge}`, borderRadius: 20, overflow: "hidden" };

/**
 * A screen in an answer (components/screen/screen.tsx:180-230, 355-369): a
 * card of dark glass as wide as Krovvi's column, 4 over it and 16 under it,
 * its name in soft ink 14 from its top with the bricks 10 under it (16 with
 * no name), 16 at the sides and the foot, the bricks 20 apart. `label` sits
 * beside the name after a dot ("Saving for the car · You'd have it by").
 * `rise`: it fades up 6 points once, as a screen arriving in a reply.
 */
export function BrickScreen({ title, label, children, foot, rise = false, className, style }: Piece & { title?: string; label?: string; children?: ReactNode; foot?: ReactNode; rise?: boolean }) {
  return (
    <div className={cx(rise && "dk-rise", className)} style={{ ...CARD, width: COLUMN, maxWidth: "100%", margin: "4px 0 16px", ...style }}>
      {title ? (
        <div style={{ ...FACE.label, fontWeight: 600, color: C.soft, padding: `${PAD - 2}px ${PAD}px 0` }}>
          {title}
          {label ? <span style={{ fontWeight: 500, color: C.muted }}>{`  ·  ${label}`}</span> : null}
        </div>
      ) : null}
      <div style={{ padding: `${title ? 10 : PAD}px ${PAD}px ${PAD}px`, display: "flex", flexDirection: "column", gap: SCREEN_GAP }}>
        {children}
        {foot ? <div>{foot}</div> : null}
      </div>
    </div>
  );
}

/** A brick's own quiet label, with a value across from it (components/screen/parts.tsx:92-112). */
function BrickLabel({ text, right }: { text?: string; right?: ReactNode }) {
  if (!text && !right) return null;
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
      {text ? <span style={{ ...FACE.label, color: C.muted, flexShrink: 1 }}>{text}</span> : <span style={{ flex: 1 }} />}
      {right}
    </div>
  );
}

type Step = "display" | "figure" | "body";

/** The unit beside a figure: about half its size, muted, never bold (components/answer/figure.tsx:20-24). */
const UNIT: Record<Step, CSSProperties> = {
  display: { fontSize: 20, fontWeight: 400, letterSpacing: "-0.2px", color: C.muted },
  figure: { fontSize: 14, fontWeight: 400, letterSpacing: 0, color: C.muted },
  body: { fontSize: 13, fontWeight: 400, letterSpacing: 0, color: C.muted },
};

const NUMBER = /[+\-−~≈]?[0-9٠-٩][0-9٠-٩,٬.٫]*(?:\s?%|[kKmMbB](?![a-zA-Z]))?/;

/**
 * A value as its figure and the words around it, or null when it is not one
 * figure with words around it (lib/answer/look-data.ts:39-50): a currency or
 * a sign before, a few words after.
 */
export function splitFigure(value: string): { before: string; figure: string; after: string } | null {
  const text = value.trim();
  const m = NUMBER.exec(text);
  if (!m) return null;
  const before = text.slice(0, m.index);
  const after = text.slice(m.index + m[0].length);
  if (before && !/^(?:[$€£¥₹~≈]|US\$|[A-Z]{3} ?)$/.test(before)) return null;
  if (/[0-9٠-٩]/.test(after) || after.trim().length > 18) return null;
  return { before, figure: m[0], after };
}

/** About how wide a run of a figure sets, in points: digits and capitals wide, separators narrow (look-data.ts:53-57). */
export function figureWidth(text: string, size: number): number {
  let em = 0;
  for (const ch of text) em += /[0-9٠-٩]/.test(ch) ? 0.62 : /[.,:;'·٬٫ ]/.test(ch) ? 0.3 : /[A-Z%$€£]/.test(ch) ? 0.68 : /[\u0600-\u06FF]/.test(ch) ? 0.5 : 0.56;
  return em * size;
}

/** The size a figure and its unit fit `room` at: the step's own when it fits, else smaller, never under `min` (look-data.ts:65-69). */
export function fitSize(figure: string, unit: string, room: number, size: number, unitSize: number, min: number): number {
  const wide = figureWidth(figure, size) + figureWidth(unit, unitSize);
  if (!(room > 0) || wide <= room) return size;
  return Math.max(min, Math.floor((size * room) / wide));
}

/** The size a display or grid figure fits `room` at (figure.tsx:81-85). */
export function figureSize(value: string, step: "display" | "figure", room: number): number {
  const parts = splitFigure(value);
  const base = FACE[step].fontSize;
  return fitSize(parts ? parts.figure : value, parts ? `${parts.before}${parts.after}` : "", room, base, UNIT[step].fontSize as number, step === "display" ? 26 : 15);
}

/**
 * A value set as a figure (components/answer/figure.tsx:31-79): a currency or
 * a unit around it small and muted, on one line. `room`: the points it has,
 * so a figure too wide steps down to fit; `size`: a size worked out for a
 * whole group, so every figure of a row is set alike.
 */
export function Figure({ value, step = "figure", room, size: given, color = C.fg, style }: { value: string; step?: Step; room?: number; size?: number; color?: string; style?: CSSProperties }) {
  const parts = splitFigure(value);
  const base = step === "body" ? null : FACE[step];
  const unit = UNIT[step];
  const size = step === "body" ? null : (given ?? (room ? figureSize(value, step, room) : null));
  const scale = base && size ? size / base.fontSize : 1;
  const sized: CSSProperties | null = base && size && scale < 1 ? { fontSize: size, lineHeight: `${Math.ceil(parseFloat(base.lineHeight) * scale)}px`, letterSpacing: `${parseFloat(base.letterSpacing) * scale}px` } : null;
  const unitSized: CSSProperties = sized ? { ...unit, fontSize: Math.round((unit.fontSize as number) * Math.max(scale, 0.8)) } : unit;
  const face: CSSProperties = step === "body" ? { ...FACE.body, fontWeight: 500, fontVariantNumeric: "tabular-nums" } : FACE[step];
  return (
    <span style={{ ...face, color, whiteSpace: "nowrap", display: "block", ...sized, ...style }}>
      {parts ? (
        <>
          {parts.before ? <span style={unitSized}>{parts.before}</span> : null}
          {parts.figure}
          {parts.after ? <span style={unitSized}>{parts.after}</span> : null}
        </>
      ) : (
        value
      )}
    </span>
  );
}

/** A change said with a mark and words in the direction's ink, or muted words with no direction (figure.tsx:92-107). */
export function Trend({ trend = null, good, note, size = "meta" }: { trend?: "up" | "down" | null; good?: boolean; note: string; size?: "meta" | "label" }) {
  const tone = !trend ? C.muted : (good ?? trend === "up") ? INK.up : INK.down;
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
      {trend ? <span style={{ width: 0, height: 0, borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderBottom: `6px solid ${tone}`, transform: trend === "down" ? "rotate(180deg)" : undefined, flexShrink: 0 }} /> : null}
      <span style={{ ...(size === "label" ? FACE.label : { ...FACE.meta, fontWeight: 500 }), color: tone }}>{note}</span>
    </span>
  );
}

export interface Small {
  label?: string;
  value: string;
}

/**
 * number: the figure that answers, at display size (light, 40 on 46) with
 * its label over it and its note under it; up to three small figures under a
 * hairline below it (components/screen/bricks/number.tsx). A later number in
 * the same screen is a figure (`hero` false).
 */
export function BrickNumber({ label, value, note, trend, good, also, hero = true, className, style }: Piece & { label?: string; /** "June 2027", "$1,104", "18,000 EGP": a currency or unit around the figure is set small. */ value: string; note?: string; trend?: "up" | "down"; good?: boolean; also?: Small[]; hero?: boolean }) {
  return (
    <div className={className} style={style}>
      {label ? <div style={{ ...FACE.label, color: C.muted, marginBottom: 2 }}>{label}</div> : null}
      <Figure value={value} step={hero ? "display" : "figure"} room={BRICK_WIDTH} />
      {note ? (
        <div style={{ marginTop: 4 }}>
          <Trend trend={trend} good={good} note={note} size="label" />
        </div>
      ) : null}
      {also?.length ? (
        <>
          <div style={{ ...RULE, marginTop: 16 }} />
          <div style={{ display: "flex", paddingTop: 14 }}>
            {also.map((f, i) => (
              <div key={i} style={{ position: "relative", flex: 1, minWidth: 0, ...(i > 0 ? { marginLeft: 12, paddingLeft: 12 } : null) }}>
                {i > 0 ? <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: HAIR, background: C.line }} /> : null}
                <Figure value={f.value} step="figure" room={(BRICK_WIDTH - 12 * (also.length - 1)) / also.length - 4} />
                {f.label ? <div style={{ ...FACE.meta, color: C.muted, marginTop: 2 }}>{f.label}</div> : null}
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

export interface Stat {
  label?: string;
  /** "18,000", "$1,450", "6 km": a currency or unit around the figure is set small. */
  value: string;
  note?: string;
  trend?: "up" | "down";
  good?: boolean;
}

/**
 * Two to six figures of equal weight in a grid split by hairlines, two to a
 * row for two or four, three for three, five or six (components/answer/native-blocks.tsx
 * StatsGrid 128-193, styles 923-935). In a screen (`inScreen`), the outer
 * cells give up their side padding so the first figure starts on the
 * column's edge; on its own (the default), it is the answer's own card, as a
 * stats block draws it: "Rent 18,000 a month".
 */
export function BrickStats({ stats, title, inScreen = false, className, style }: Piece & { stats: Stat[]; title?: string; inScreen?: boolean }) {
  const per = stats.length === 2 || stats.length === 4 ? 2 : 3;
  const rows: Stat[][] = [];
  for (let i = 0; i < stats.length; i += per) rows.push(stats.slice(i, i + per));
  const ruled = !!title;
  const room = inScreen ? BRICK_WIDTH : COLUMN;
  const words = (room - (per - 1) * 14 * 2) / per;
  // One size for every figure of the grid, the one the longest fits its cell at (native-blocks.tsx:140-142).
  const cellRoom = inScreen ? words - 4 : room / per - 14 * 2 - 4;
  const gridSize = Math.min(...stats.map((st) => figureSize(st.value, "figure", cellRoom)));
  const grid = (
    <>
      {rows.map((row, r) => (
        <div key={r} style={{ position: "relative", display: "flex" }}>
          {r > 0 || ruled ? <span style={{ position: "absolute", top: 0, left: 0, right: 0, ...RULE }} /> : null}
          {Array.from({ length: per }, (_, i) => {
            const s = row[i];
            const pad = inScreen
              ? { flex: `0 0 ${words + (i > 0 ? 14 : 0) + (i < per - 1 ? 14 : 0)}px`, paddingLeft: i === 0 ? 0 : 14, paddingRight: i === per - 1 ? 0 : 14, paddingTop: r === 0 && !ruled ? 0 : 12, paddingBottom: r === rows.length - 1 ? 0 : 14 }
              : { flex: 1, padding: "12px 14px 14px" };
            return (
              <div key={i} style={{ position: "relative", minWidth: 0, display: "flex", flexDirection: "column", gap: 2, ...pad }}>
                {i > 0 ? <span style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: HAIR, background: C.line }} /> : null}
                {s?.label ? <span style={{ ...FACE.label, color: C.muted }}>{s.label}</span> : null}
                {s ? <Figure value={s.value} step="figure" size={gridSize} style={{ marginTop: 2 }} /> : null}
                {s?.note ? (
                  <span style={{ marginTop: 4 }}>
                    <Trend trend={s.trend} good={s.good} note={s.note} />
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
  if (inScreen) {
    return (
      <div className={className} style={style}>
        {title ? <BrickLabel text={title} /> : null}
        {grid}
      </div>
    );
  }
  return (
    <div className={className} style={{ ...CARD, margin: "4px 0 16px", ...style }}>
      {title ? <div style={{ ...FACE.label, color: C.muted, padding: "12px 16px 4px" }}>{title}</div> : null}
      {grid}
    </div>
  );
}

export interface RowItem {
  title: string;
  detail?: string;
  note?: string;
  /** "$4,800", "12 km": a currency or unit around the figure is set small. */
  value?: string;
  /** Krovvi's pick: a bone dot and the words for it, its value in bone. */
  pick?: boolean;
  /** Opens a page: the small arrow at its end. */
  opens?: boolean;
  /** A picture for its 48 point thumbnail (an image URL or a CSS background); with none, the title's letter. */
  picture?: string;
}

/**
 * rows: a short list drawn the way iOS draws one (components/screen/bricks/rows.tsx):
 * each row its title, a muted detail under it, its value across from them in
 * tabular figures, hairlines that start where the words do and run to the
 * card's edge. `rise`: the rows rise in one after another, 45 ms apart.
 */
export function BrickRows({ label, rows, thumbs, rise = false, className, style }: Piece & { label?: string; rows: RowItem[]; thumbs?: boolean; rise?: boolean }) {
  const withThumbs = thumbs ?? rows.some((r) => r.picture !== undefined);
  return (
    <div className={className} style={style}>
      <BrickLabel text={label} />
      {rows.map((row, i) => (
        <div key={i} className={rise ? "dk-row" : undefined} style={rise ? ({ "--dk-delay": `${Math.min(i, 6) * 45}ms` } as CSSProperties) : undefined}>
          {i > 0 ? <div style={{ ...RULE, marginLeft: withThumbs ? 60 : 0, marginRight: -PAD }} /> : null}
          <div style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 44, paddingTop: i === 0 ? 2 : 12, paddingBottom: i === rows.length - 1 ? 2 : 12 }}>
            {withThumbs ? (
              <span style={{ width: 48, height: 48, borderRadius: 11, flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: row.picture ? (row.picture.includes("(") ? row.picture : `center / cover no-repeat url("${row.picture}")`) : "rgba(255,255,255,0.06)" }}>
                {row.picture ? null : <span style={{ fontSize: 17, lineHeight: "22px", fontWeight: 600, color: C.muted }}>{row.title.trim().charAt(0).toUpperCase()}</span>}
              </span>
            ) : null}
            <div style={{ flex: 1, minWidth: 0 }}>
              {row.pick ? (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: INK.pick }} />
                  <span style={{ ...FACE.meta, fontWeight: 600, color: INK.pick, letterSpacing: "0.1px" }}>Krovvi&apos;s pick</span>
                </div>
              ) : null}
              <div style={{ ...FACE.body, fontWeight: 500, color: C.fg }}>{emo(row.title)}</div>
              {row.detail ? <div style={{ ...FACE.label, fontWeight: 400, color: C.muted, marginTop: 1 }}>{row.detail}</div> : null}
              {row.note ? <div style={{ ...FACE.meta, color: C.muted, marginTop: 3 }}>{row.note}</div> : null}
            </div>
            {row.value ? (
              <div style={{ flexShrink: 0, maxWidth: "42%", textAlign: "right" }}>
                <Figure value={row.value} step="body" color={row.pick ? INK.pick : C.fg} style={{ fontWeight: 600 }} />
              </div>
            ) : null}
            {row.opens ? (
              <span style={{ width: 12, display: "flex", justifyContent: "center" }}>
                <Icon name="outward" size={10} color={C.muted} weight={1.6} />
              </span>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * table: the grid markdown tables use (components/answer/table-view.tsx), in
 * a screen's column: the quiet header 13 on 18 semibold, cells 16 on 22,
 * numbers at the far side in tabular figures, 13 between columns and 11 over
 * and under a row, a hairline under the header and between rows. `total`:
 * the last row is set apart by a heavier rule and face. `pick`: that row in
 * bone with the bone dot before its name.
 */
export function BrickTable({ label, headers, rows, numeric, total = false, pick, className, style }: Piece & { label?: string; headers: string[]; rows: string[][]; numeric?: boolean[]; total?: boolean; pick?: number }) {
  const n = headers.length;
  const isNum = numeric ?? headers.map((_, c) => c > 0 && rows.every((r) => /^[\s$€£¥]*[-+]?[\d.,]+\s*[%a-zA-Z]*$/.test(r[c] ?? "")));
  const cols = headers.map((_, c) => (c === 0 ? "minmax(0, 1fr)" : "auto")).join(" ");
  const cell = (c: number, head: boolean, last: boolean): CSSProperties => ({
    paddingLeft: c === 0 ? 0 : 13,
    paddingRight: c === n - 1 ? 0 : 13,
    paddingTop: head ? 2 : 11,
    paddingBottom: head ? 8 : last ? 2 : 11,
    textAlign: isNum[c] ? "right" : "left",
  });
  return (
    <div className={className} style={style}>
      <BrickLabel text={label} />
      <div style={{ display: "grid", gridTemplateColumns: cols, alignItems: "end" }}>
        {headers.map((h, c) => (
          <div key={`h${c}`} style={{ ...cell(c, true, false), fontSize: 13, lineHeight: "18px", fontWeight: 600, color: C.muted, borderBottom: `${HAIR}px solid ${C.line}` }}>
            {h}
          </div>
        ))}
        {rows.map((row, r) => {
          const last = r === rows.length - 1;
          const isTotal = total && last;
          const picked = pick === r;
          return row.map((value, c) => (
            <div
              key={`${r}-${c}`}
              style={{
                ...cell(c, false, last),
                position: "relative",
                alignSelf: "stretch",
                fontSize: 16,
                lineHeight: "22px",
                letterSpacing: "-0.2px",
                fontWeight: isTotal || picked ? 600 : c === 0 ? 500 : 400,
                color: picked ? INK.pick : C.fg,
                fontVariantNumeric: isNum[c] ? "tabular-nums" : undefined,
                borderTop: r > 0 ? (isTotal ? `${HAIR * 2}px solid ${C.muted}` : `${HAIR}px solid ${C.line}`) : undefined,
                whiteSpace: c === 0 ? "normal" : "nowrap",
              }}
            >
              {picked && c === 0 ? <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 3, background: INK.pick, marginRight: 5, verticalAlign: "2px" }} /> : null}
              {value}
            </div>
          ));
        })}
      </div>
    </div>
  );
}

/** The dots of a track: `count` dots 5 across spread from end to end, the first `lit` in ivory, now's dot glowing (components/screen/bricks/track.tsx, track-math.ts). */
function DotTrack({ width, share, fill = false }: { width: number; share: number; fill?: boolean }) {
  const dot = 5;
  const count = Math.max(2, Math.floor((width - dot) / 10) + 1);
  const step = (width - dot) / (count - 1);
  const lit = Math.max(0, Math.min(count, Math.round(share * count)));
  const circle = (i: number) => {
    const x = dot / 2 + i * step;
    return `M${(x - dot / 2).toFixed(2)} ${dot / 2}a${dot / 2} ${dot / 2} 0 1 0 ${dot} 0a${dot / 2} ${dot / 2} 0 1 0 ${-dot} 0Z`;
  };
  const off = Array.from({ length: count }, (_, i) => i).filter((i) => i >= lit).map(circle).join("");
  const on = Array.from({ length: lit }, (_, i) => circle(i)).join("");
  const head = lit > 0 ? dot / 2 + (lit - 1) * step : null;
  const glow = dot * 3;
  return (
    <div style={{ position: "relative", width, height: dot }}>
      {head !== null ? (
        <span style={{ position: "absolute", left: head - glow / 2, top: (dot - glow) / 2, width: glow, height: glow, background: "radial-gradient(circle closest-side, rgba(237,237,235,0.5) 0%, rgba(237,237,235,0.16) 45%, rgba(237,237,235,0) 100%)" }} />
      ) : null}
      <svg width={width} height={dot} viewBox={`0 0 ${width} ${dot}`} style={{ position: "absolute", inset: 0, overflow: "visible" }} aria-hidden="true">
        <path d={off} fill="rgba(237,237,235,0.12)" />
        <path className={fill ? "dk-fill" : undefined} d={on} fill={C.fg} />
      </svg>
    </div>
  );
}

/**
 * progress: where you stand (components/screen/bricks/progress.tsx). The
 * figure first ("$312" with "of $600" small and muted), then a row of dots
 * lit to it with now's dot glowing, the even pace a small column of dots in
 * the gap nearest it with its word under it, and whether it is over or under
 * that pace, in words with the direction's mark. A small whole (`of` up to 12
 * with `units`) is dots, one per unit: done filled ivory, the last done
 * glowing, waiting an empty ring. `fill`: the dots light once as it arrives.
 */
export function BrickProgress({
  label,
  value,
  rest,
  share,
  pace,
  paceLabel = "Today",
  verdict,
  note,
  units,
  hero = false,
  fill = false,
  className,
  style,
}: Piece & {
  label?: string;
  /** The figure: "$312". */
  value: string;
  /** What it is out of: "of $600". */
  rest?: string;
  /** How far, 0 to 1. */
  share: number;
  /** Where an even pace stands today, 0 to 1. */
  pace?: number;
  paceLabel?: string;
  /** Over or under the pace: the amount and its words, the mark and whether that is good. */
  verdict?: { amount?: string; words: string; trend?: "up" | "down"; good?: boolean };
  note?: string;
  /** A small whole as dots: how many done of how many. */
  units?: { done: number; of: number };
  hero?: boolean;
  fill?: boolean;
}) {
  const width = BRICK_WIDTH;
  const dot = 5;
  const count = Math.max(2, Math.floor((width - dot) / 10) + 1);
  const step = (width - dot) / (count - 1);
  const paceX = pace === undefined ? null : Math.max(0, Math.min(width, dot / 2 + (Math.max(-1, Math.min(count - 1, Math.round((pace * width - dot / 2) / step - 0.5))) + 0.5) * step));
  const tone = verdict?.trend ? ((verdict.good ?? verdict.trend === "up") ? INK.up : INK.down) : C.muted;
  return (
    <div className={className} style={style}>
      <BrickLabel text={label} />
      <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
        <Figure value={value} step={hero ? "display" : "figure"} room={Math.max(80, width - figureWidth(rest ?? "", hero ? 15 : 13) - 12)} />
        {rest ? <span style={{ ...(hero ? { ...FACE.body, fontWeight: 500 } : FACE.label), color: C.muted, whiteSpace: "nowrap" }}>{rest}</span> : null}
      </div>
      {units ? (
        <div style={{ marginTop: 14, height: Math.max(6, Math.min(14, (width - (units.of - 1) * 10) / units.of)) + 10, display: "flex", alignItems: "center", gap: 10 }}>
          {Array.from({ length: units.of }, (_, i) => {
            const size = Math.max(6, Math.min(14, (width - (units.of - 1) * 10) / units.of));
            const on = i < units.done;
            const now = i === units.done - 1;
            return (
              <span
                key={i}
                className={fill && on ? "dk-dot-in" : undefined}
                style={{ position: "relative", width: size, height: size, borderRadius: size / 2, background: on ? C.fg : "transparent", border: now ? "none" : `1.5px solid ${on ? C.fg : C.faint}`, flexShrink: 0, ...(fill && on ? ({ "--dk-delay": `${120 + i * 90}ms` } as CSSProperties) : null) }}
              >
                {now ? <span style={{ position: "absolute", left: (size - size * 3) / 2, top: (size - size * 3) / 2, width: size * 3, height: size * 3, background: "radial-gradient(circle closest-side, rgba(237,237,235,0.5) 0%, rgba(237,237,235,0.16) 45%, rgba(237,237,235,0) 100%)" }} /> : null}
              </span>
            );
          })}
        </div>
      ) : (
        <div style={{ marginTop: 14 }}>
          <div style={{ position: "relative", height: 18, display: "flex", alignItems: "center" }}>
            <DotTrack width={width} share={share} fill={fill} />
            {paceX !== null ? (
              <span style={{ position: "absolute", left: paceX - 3, top: -1, width: 6, height: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between" }}>
                {[0, 1, 2, 3].map((k) => (
                  <span key={k} style={{ width: 3, height: 3, borderRadius: 1.5, background: C.soft }} />
                ))}
              </span>
            ) : null}
          </div>
          {paceX !== null ? (
            <div style={{ position: "relative", height: 16, marginTop: 6 }}>
              <span style={{ position: "absolute", left: Math.max(0, Math.min(width - 40, paceX - 20)), width: 40, textAlign: "center", ...FACE.meta, fontWeight: 500, color: C.muted }}>{paceLabel}</span>
            </div>
          ) : null}
        </div>
      )}
      {verdict ? (
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 12 }}>
          {verdict.trend ? <span style={{ width: 0, height: 0, borderLeft: "4.5px solid transparent", borderRight: "4.5px solid transparent", borderBottom: `7px solid ${tone}`, transform: verdict.trend === "down" ? "rotate(180deg)" : undefined }} /> : null}
          <span style={{ ...FACE.label, color: C.soft }}>
            {verdict.amount ? <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums", color: tone }}>{verdict.amount}</span> : null}
            {verdict.words}
          </span>
        </div>
      ) : null}
      {note ? <div style={{ ...FACE.label, fontWeight: 400, color: C.muted, marginTop: verdict ? 4 : 12 }}>{note}</div> : null}
    </div>
  );
}

export interface TimelineDay {
  /** "Tomorrow", "Saturday", "Sat 17 Oct". */
  day: string;
  items: Array<{ time?: string; half?: string; title: string; detail?: string; place?: string }>;
}

/**
 * timeline: a plan by day and time (components/screen/bricks/timeline.tsx):
 * each day under its own header, a quiet rail down the day with a ring for
 * each item, the time beside the ring in tabular figures (its half of the day
 * quiet), then what happens, its detail and where. `rise`: the items rise in
 * one after another.
 */
export function BrickTimeline({ days, rise = false, className, style }: Piece & { days: TimelineDay[]; rise?: boolean }) {
  const anyTime = days.some((d) => d.items.some((it) => it.time));
  let row = 0;
  return (
    <div className={className} style={style}>
      {days.map((day, d) => (
        <div key={d} style={{ marginTop: d > 0 ? 18 : 0 }}>
          <div style={{ ...FACE.label, fontWeight: 600, color: C.soft, marginBottom: 8 }}>{day.day}</div>
          {day.items.map((item, k) => {
            const last = k === day.items.length - 1;
            const at = row++;
            return (
              <div key={k} className={rise ? "dk-row" : undefined} style={{ display: "flex", gap: 12, ...(rise ? ({ "--dk-delay": `${Math.min(at, 6) * 45}ms` } as CSSProperties) : null) }}>
                {anyTime ? (
                  <div style={{ width: 62, flexShrink: 0, display: "flex", justifyContent: "flex-end", paddingTop: 2 }}>
                    <span style={{ ...FACE.label, color: C.soft, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                      {item.time}
                      {item.half ? <span style={{ color: C.muted }}>{` ${item.half}`}</span> : null}
                    </span>
                  </div>
                ) : null}
                <div style={{ width: 14, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 5 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 5, border: `1.5px solid ${C.muted}`, flexShrink: 0 }} />
                  {last ? null : <span style={{ flex: 1, width: 2, borderRadius: 1, background: C.line, marginTop: 4, marginBottom: -1 }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0, paddingBottom: last ? 0 : 16 }}>
                  <div style={{ ...FACE.body, fontWeight: 600, color: C.fg }}>{item.title}</div>
                  {item.detail ? <div style={{ ...FACE.label, fontWeight: 400, color: C.soft, marginTop: 1 }}>{item.detail}</div> : null}
                  {item.place ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
                      <Icon name="marker" size={11} color={C.muted} weight={1.3} />
                      <span style={{ ...FACE.meta, color: C.muted }}>{item.place}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/**
 * checklist: things to tick (components/screen/bricks/checklist.tsx:263-292):
 * a 22 point box with 7 point corners, 12 before the words, items 11 over
 * and under, a done item's box filled ivory with its tick and its words
 * struck through in muted ink; how many are left at its label's end.
 */
export function BrickChecklist({ label, items, className, style }: Piece & { label?: string; items: Array<{ text: string; hint?: string; done?: boolean }> }) {
  const left = items.filter((i) => !i.done).length;
  return (
    <div className={className} style={style}>
      <BrickLabel text={label} right={<span style={{ ...FACE.meta, fontWeight: 500, color: C.muted, fontVariantNumeric: "tabular-nums" }}>{left ? `${left} left` : "All done"}</span>} />
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: `${i === 0 ? 6 : 11}px 0 11px`, minHeight: 44 }}>
          <span style={{ position: "relative", width: 22, height: 22, borderRadius: 7, border: `1.5px solid ${C.muted}`, flexShrink: 0, overflow: "hidden" }}>
            {item.done ? (
              <span style={{ position: "absolute", inset: -1.5, borderRadius: 7, background: C.fg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Check size={11} color={C.bg} weight={2} />
              </span>
            ) : null}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...FACE.body, lineHeight: "22px", color: item.done ? C.muted : C.fg, textDecoration: item.done ? "line-through" : undefined }}>{item.text}</div>
            {item.hint ? <div style={{ ...FACE.label, fontWeight: 400, color: C.muted, marginTop: 1 }}>{item.hint}</div> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * A callout in an answer: a pane of dark glass, its word in soft ink beside
 * its mark (a ring with a dot for a Tip), then its words at the answer's size
 * (components/answer/blocks.tsx:23-61, 120-141). Its words come as children
 * (P, B) and end on a paragraph's own 16.
 */
export function Callout({ kind = "tip", children, className, style }: Piece & { kind?: "tip" | "note" | "important" | "warning"; children?: ReactNode }) {
  const ink = kind === "warning" ? INK.down : kind === "important" ? INK.pick : C.soft;
  const word = { tip: "Tip", note: "Note", important: "Important", warning: "Warning" }[kind];
  return (
    <div className={className} style={{ ...CARD, overflow: "hidden", margin: "4px 0 16px", padding: "12px 16px 0", ...style }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
        <span style={{ width: 14, height: 14, borderRadius: 7, border: `1.3px solid ${ink}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {kind === "tip" ? <span style={{ width: 4, height: 4, borderRadius: 2, background: ink }} /> : <span style={{ width: 1.5, height: 4.8, borderRadius: 1, background: ink }} />}
        </span>
        <span style={{ fontSize: 13, lineHeight: "18px", fontWeight: 600, letterSpacing: "0.1px", color: ink }}>{word}</span>
      </div>
      {children}
    </div>
  );
}
