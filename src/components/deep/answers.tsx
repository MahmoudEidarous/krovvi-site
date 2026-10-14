/**
 * Answers as real screens: the savings answer of the newest app (catch8 store
 * build 20, 6edb7fca), a screen of four bricks in one card of Krovvi's glass
 * (components/screen/screen.tsx): the date it is reached at display size, the
 * chart of the money growing to the goal, the slider that moves both, and the
 * line that says what a bigger amount buys. The plan is the app's own
 * (supabase/functions/_shared/screen/samples.ts:46-56, "car"); every number
 * is worked out by savings.ts the way the app works it out, so `perMonth`
 * moves the date, the months, the line and the note together.
 *
 * Server renderable: plain markup and SVG at the app's points. To let a
 * visitor move it, wrap it in SavingsLive (answers-live.tsx), which renders
 * this same card.
 */

import "./deep.css";
import "./friend.css";

import type { CSSProperties, HTMLAttributes, ReactNode, Ref } from "react";

import { BRICK_WIDTH, COLUMN, Figure, Trend } from "./bricks";
import { ActionsRow, DateLine, KrovviText, MyBubble, P, Turn, type Piece } from "./chat";
import {
  AREA,
  axisTicks,
  CANVAS,
  CAR,
  dotCount,
  fractionOf,
  geometry,
  GUTTER_GAP,
  HALO,
  HEAD,
  PLOT,
  restingScale,
  savingsPoints,
  savingsWords,
  SLIDER_DOT,
  sliderLitEnd,
  snap,
  stepOf,
  THUMB,
  thumbLeft,
  wordsWidth,
  type Day,
  type Domain,
  type Geometry,
} from "./savings";
import { C, FACE, HAIR, INK } from "./tokens";

const cx = (...names: Array<string | false | null | undefined>) => names.filter(Boolean).join(" ") || undefined;
const f = (n: number) => Math.round(n * 100) / 100;

/** The plan's numbers, all optional: the car's by default. */
export interface SavingsPlan {
  goal?: number;
  saved?: number;
  today?: Day;
}

/* ------------------------------------------------------------------ */
/* The chart (components/screen/bricks/chart.tsx PlotChart, a line)    */
/* ------------------------------------------------------------------ */

/** chart.tsx:111-112, 124-125, 142-171: the line's dots, the goal's, the area's light, the ring of glass round the end dot. */
const DOT = 3.5;
const RING = 2;
const LINE_DOT = 2.2;
const LINE_PITCH = 3.1;
const REF_DOT = 1.7;
const REF_PITCH = 4;
const AREA_LIGHT = "linear-gradient(180deg, rgba(237,237,235,0.12) 0%, rgba(237,237,235,0) 100%)";
/** components/screen/parts.tsx screenInk.ground: the screen's glass as one solid ink. */
const GROUND = "#121214";

/** The words of a chart at the app's meta size (look.ts meta 12 on 16). */
const META: CSSProperties = { ...FACE.meta, color: C.muted, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" };

/** chart.tsx:345-347: the goal's words stand at the line's end in a gutter of their own; the plot is the rest. */
export function savingsGutter(width: number): number {
  return Math.min(Math.ceil(wordsWidth(CAR.lineLabel, 12) * 1.12) + GUTTER_GAP + 4, Math.round(width * 0.3));
}

/** Where the car chart's points sit at a monthly amount, on a scale, for a chart `width` wide. */
export function savingsGeometry(perMonth: number, domain: Domain | null, width: number = BRICK_WIDTH, plan?: SavingsPlan): Geometry | null {
  const points = savingsPoints(perMonth, plan);
  if (!points.length || !domain) return null;
  return geometry(points, domain, Math.max(40, width - savingsGutter(width)), plan?.goal ?? CAR.goal);
}

/**
 * The savings chart: the money growing month by month to the goal, as the app
 * draws a line in the night look. A dotted ivory line over a soft fall of
 * light, its end a dot in a ring of the card's glass; the goal a quieter
 * dotted line across with "Goal" at its end, in a gutter of its own; "Now"
 * and the month it is reached under the plot. `domain`: the scale to draw at
 * (by default the one the screen rests at: the scale it first drew at, at the
 * plan's start, grown to take in this amount, so a bigger amount ends the
 * line sooner). `geometry` overrides where the points sit (the live wrapper
 * eases it). `draw`: the line draws in once, as it arrives with the answer.
 */
export function SavingsChart({
  perMonth = CAR.start,
  start = CAR.start,
  plan,
  domain,
  geometry: given,
  width = BRICK_WIDTH,
  draw = false,
  className,
  style,
}: Piece & {
  perMonth?: number;
  /** The slider's value when the screen first drew (the plan's start): the scale holds what it showed then. */
  start?: number;
  plan?: SavingsPlan;
  domain?: Domain | null;
  geometry?: Geometry;
  width?: number;
  draw?: boolean;
}) {
  const goal = plan?.goal ?? CAR.goal;
  const points = savingsPoints(perMonth, plan);
  const scale = domain ?? restingScale(perMonth, start, plan);
  const refWords = CAR.lineLabel;
  const gutter = savingsGutter(width);
  const plotW = Math.max(40, width - gutter);
  if (!points.length || !scale) return null;
  const g = given ?? geometry(points, scale, plotW, goal);
  const n = g.xs.length;
  const line = g.xs.map((x, i) => `${i ? "L" : "M"}${f(x)} ${f(g.ys[i])}`).join("");
  // The area: down from the first point to the plot's foot, along the line, and back (chart.tsx linePath, area).
  const area = [`${f(g.xs[0])}px ${PLOT}px`, ...g.xs.map((x, i) => `${f(x)}px ${f(g.ys[i])}px`), `${f(g.xs[n - 1])}px ${PLOT}px`].join(", ");
  const end = { x: g.xs[n - 1], y: g.ys[n - 1] };
  const ticks = axisTicks(
    points.map((p) => p.label),
    g.xs,
    plotW,
  );
  const refY = g.ref;
  const label = `${savingsWords(perMonth, plan).date}. From ${points[0].label} to ${points[n - 1].label}. Goal ${refWords}`;
  return (
    <div className={className} role="img" aria-label={label} style={{ position: "relative", width, height: HEAD + PLOT + 8 + 16, ...style }}>
      {/* The fall of light under the line, ivory at an eighth at the plot's top to nothing at its foot. */}
      <div
        aria-hidden="true"
        className={draw ? "dkx-fade" : undefined}
        style={{ position: "absolute", left: 0, top: HEAD, width: plotW, height: PLOT, background: AREA_LIGHT, clipPath: `polygon(${area})`, ...(draw ? ({ "--dk-delay": "90ms", "--dk-dur": "620ms" } as CSSProperties) : null) }}
      />
      {/* One canvas as wide as the brick and a little under the plot (chart.tsx:649): what falls outside it is cut, as Skia cuts it. */}
      <svg width={width} height={CANVAS} viewBox={`0 0 ${width} ${CANVAS}`} style={{ position: "absolute", left: 0, top: 0, overflow: "hidden" }} aria-hidden="true">
        <g transform={`translate(0 ${HEAD})`}>
          {Number.isNaN(refY) ? null : (
            <path d={`M0 ${f(refY)}L${f(plotW)} ${f(refY)}`} fill="none" stroke={C.muted} strokeWidth={REF_DOT} strokeLinecap="round" strokeDasharray={`0.01 ${REF_PITCH - 0.01}`} />
          )}
          <path className={draw ? "dkx-draw" : undefined} d={line} fill="none" stroke={C.fg} strokeWidth={LINE_DOT} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`0.01 ${LINE_PITCH - 0.01}`} />
          <g className={draw ? "dkx-fade" : undefined} style={draw ? ({ "--dk-delay": "420ms", "--dk-dur": "300ms" } as CSSProperties) : undefined}>
            <circle cx={f(end.x)} cy={f(end.y)} r={DOT + RING} fill={GROUND} />
            <circle cx={f(end.x)} cy={f(end.y)} r={DOT} fill={C.fg} />
          </g>
        </g>
      </svg>
      {Number.isNaN(refY) ? null : (
        // chart.tsx:801-818 RefWords: at the line's end, centred on it, kept inside the plot's height.
        <span style={{ ...META, position: "absolute", left: plotW + GUTTER_GAP, width: gutter - GUTTER_GAP, top: Math.max(0, Math.min(HEAD + PLOT - 16, HEAD + refY - 8)), overflow: "hidden" }}>{refWords}</span>
      )}
      {ticks.map((tick) => (
        <span key={tick.index} style={{ ...META, position: "absolute", top: HEAD + PLOT + 8, ...(tick.atEnd ? { right: width - plotW } : { left: tick.left }) }}>
          {tick.text}
        </span>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The slider (components/screen/bricks/slider.tsx)                    */
/* ------------------------------------------------------------------ */

/**
 * The thumb's light (slider.tsx halo, glow(ink.fg, 0.35) on a 57 point view):
 * on the phone it shows as a band of ivory at about a tenth round the thumb,
 * ending about 18 points from its middle, the handle's own 36 point box
 * (measured on car.png, 14 October 2026).
 */
const THUMB_LIGHT = "radial-gradient(circle closest-side, rgba(237,237,235,0.095) 0%, rgba(237,237,235,0.088) 88%, rgba(237,237,235,0) 100%)";
const THUMB_LIGHT_SIZE = 37;

/**
 * The slider: its label with the value across from it, large enough to read
 * while a thumb covers the thumb, then the track in dots (4 points, about 8
 * apart, edge to edge), lit in bone from the low end to the thumb, and the
 * thumb, the one bright handle, 26 across in its soft light. `share` puts the
 * thumb somewhere else than the value's own place (under a finger, between
 * steps); `held` swells it to 1.12 as a finger holds it. `area` and
 * `areaRef` go on the track (the live wrapper's pointer and keys).
 */
export function SavingsSlider({
  perMonth = CAR.start,
  share,
  held = false,
  width = BRICK_WIDTH,
  label = CAR.sliderLabel,
  area,
  areaRef,
  className,
  style,
}: Piece & {
  perMonth?: number;
  share?: number | null;
  held?: boolean;
  width?: number;
  label?: string;
  area?: HTMLAttributes<HTMLDivElement>;
  areaRef?: Ref<HTMLDivElement>;
}) {
  const value = snap(perMonth);
  const at = share ?? fractionOf(value);
  const count = dotCount(width);
  const step = stepOf(count, SLIDER_DOT, width);
  const litEnd = sliderLitEnd(at, width, count);
  const dot = (i: number) => {
    const x = SLIDER_DOT / 2 + i * step;
    return `M${f(x - SLIDER_DOT / 2)} 2a2 2 0 1 0 ${SLIDER_DOT} 0a2 2 0 1 0 ${-SLIDER_DOT} 0Z`;
  };
  const lit: string[] = [];
  const off: string[] = [];
  for (let i = 0; i < count; i += 1) (SLIDER_DOT / 2 + i * step < litEnd ? lit : off).push(dot(i));
  const left = thumbLeft(at, width);
  const words = savingsWords(value);
  return (
    <div className={className} style={style}>
      {/* parts.tsx BrickLabel with the value across: label 13 on 18 muted, the value 15 on 21 semibold, 8 over the track. */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
        <span style={{ ...FACE.label, color: C.muted }}>{label}</span>
        <span style={{ ...FACE.body, fontWeight: 600, color: C.fg, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{words.amount}</span>
      </div>
      <div
        ref={areaRef}
        {...area}
        className={cx(area?.className)}
        style={{ position: "relative", width, height: AREA, touchAction: "pan-y", userSelect: "none", WebkitUserSelect: "none", ...area?.style }}
      >
        <svg width={width} height={SLIDER_DOT} viewBox={`0 0 ${f(width)} ${SLIDER_DOT}`} style={{ position: "absolute", left: 0, top: (AREA - SLIDER_DOT) / 2, overflow: "visible" }} aria-hidden="true">
          <path d={off.join("")} fill="rgba(237,237,235,0.12)" />
          <path d={lit.join("")} fill={INK.pick} />
        </svg>
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 0,
            top: (AREA - HALO) / 2,
            width: HALO,
            height: HALO,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `translateX(${f(left - (HALO - THUMB) / 2)}px) scale(${held ? 1.12 : 1})`,
            transition: "transform 110ms cubic-bezier(0.23, 1, 0.32, 1)",
            pointerEvents: "none",
          }}
        >
          <span style={{ position: "absolute", left: (HALO - THUMB_LIGHT_SIZE) / 2, top: (HALO - THUMB_LIGHT_SIZE) / 2, width: THUMB_LIGHT_SIZE, height: THUMB_LIGHT_SIZE, background: THUMB_LIGHT }} />
          <span className="dkx-thumb" style={{ position: "relative", width: THUMB, height: THUMB, borderRadius: THUMB / 2, background: C.fg }} />
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The card                                                            */
/* ------------------------------------------------------------------ */

/**
 * A screen's card (components/screen/screen.tsx:180-230, 355-369; look.ts
 * piece and card): Krovvi's glass, corners 20, one hairline, 4 over and 16
 * under; its name 13 on 18 semibold in soft ink, 14 from the top and 16 in,
 * the label after a dot with two spaces each side as the app sets it ("Saving
 * for the car  ·  You'd have it by"); the bricks 10 under the name (16 with
 * none), 16 at the sides and foot, 20 apart. The kit's BrickScreen is the
 * same card, but HTML folds its two spaces into one.
 */
export function ScreenCard({ title, label, rise = false, width = COLUMN, children, className, style }: Piece & { title?: string; label?: string; rise?: boolean; width?: number; children?: ReactNode }) {
  return (
    <div
      className={cx(rise && "dk-rise", className)}
      style={{ background: C.glass, border: `${HAIR}px solid ${C.glassEdge}`, borderRadius: 20, overflow: "hidden", width, maxWidth: "100%", margin: "4px 0 16px", ...style }}
    >
      {title ? (
        <div style={{ ...FACE.label, fontWeight: 600, color: C.soft, padding: "14px 16px 0", whiteSpace: "pre-wrap" }}>
          {title}
          {label ? <span style={{ fontWeight: 500, color: C.muted }}>{`  ·  ${label}`}</span> : null}
        </div>
      ) : null}
      <div style={{ padding: `${title ? 10 : 16}px 16px 16px`, display: "flex", flexDirection: "column", gap: 20 }}>{children}</div>
    </div>
  );
}

/**
 * The whole screen as it stands in the answer: "Saving for the car · You'd
 * have it by", the date ("August 2029") with "34 months from now" under it,
 * the chart, "Put away each month" with its value and the slider, and "Every
 * $100 more brings it 7 months sooner." (components/screen/screen.tsx with
 * bricks/number.tsx, chart.tsx, slider.tsx and text.tsx; the bricks 20
 * apart). `perMonth` is the slider's value: 400 is the plan's.
 *
 * `figure` replaces the date's figure (the live wrapper rolls it); `share`,
 * `held`, `area`, `areaRef` and `geometry` pass to the slider and the chart.
 * `rise`: the card fades up as it arrives; `draw`: its line draws in.
 */
export function SavingsCard({
  perMonth = CAR.start,
  start = CAR.start,
  plan,
  title = CAR.title,
  label = CAR.label,
  domain,
  geometry: given,
  figure,
  share,
  held,
  area,
  areaRef,
  rise = false,
  draw = false,
  width = COLUMN,
  className,
  style,
}: Piece & {
  perMonth?: number;
  start?: number;
  plan?: SavingsPlan;
  title?: string;
  label?: string;
  domain?: Domain | null;
  geometry?: Geometry;
  figure?: ReactNode;
  share?: number | null;
  held?: boolean;
  area?: HTMLAttributes<HTMLDivElement>;
  areaRef?: Ref<HTMLDivElement>;
  rise?: boolean;
  draw?: boolean;
  /** The card's width: the chat's column (343) by default. */
  width?: number;
}) {
  const value = snap(perMonth);
  const words = savingsWords(value, plan);
  const inner = width - 32;
  return (
    <ScreenCard title={title} label={label} rise={rise} width={width} className={className} style={style}>
      {/* bricks/number.tsx: the figure at display size (its label went up beside the card's name), the note 4 under it.
          The figure stands 1.3 points higher than CSS would set it: iOS hangs a 40 point face on its 46 point line from
          the line's foot (car.png, 14 October 2026). */}
      <div>
        <div style={{ position: "relative", top: -1.3 }}>{figure ?? <Figure value={words.date} step="display" room={inner} />}</div>
        <div style={{ marginTop: 4 }}>
          <Trend note={words.fromNow} size="label" />
        </div>
      </div>
      <SavingsChart perMonth={value} start={start} plan={plan} domain={domain} geometry={given} draw={draw} width={inner} />
      <SavingsSlider perMonth={value} share={share} held={held} area={area} areaRef={areaRef} width={inner} />
      {/* bricks/text.tsx, style note: 13 on 18, regular, muted. */}
      <div style={{ ...FACE.label, fontWeight: 400, color: C.muted }} aria-live="polite">
        {words.sooner}
      </div>
    </ScreenCard>
  );
}

/**
 * Krovvi's whole turn for the car, as the chat shows it: its words over the
 * screen with the star by them ("With $6,500 saved and $400 a month, you'd
 * have the $20,000 by **August 2029**. Slide to see ..."), the card, and the
 * verbs under a finished answer. `card` replaces the card (SavingsLive).
 * Put it in DeepChat after the person's question (SavingsQuestion).
 */
export function SavingsTurn({ perMonth = CAR.start, card, actions = true, className, style }: Piece & { perMonth?: number; card?: ReactNode; actions?: boolean }) {
  const words = savingsWords(snap(perMonth));
  const [before, bold, after] = words.answer.split("**");
  return (
    <Turn className={className} style={style}>
      <KrovviText>
        <P>
          {before}
          <strong style={{ fontWeight: 600, color: C.fg }}>{bold}</strong>
          {after}
        </P>
        {card ?? <SavingsCard perMonth={perMonth} />}
      </KrovviText>
      {actions ? <ActionsRow /> : null}
    </Turn>
  );
}

/** The person's side of it: when they asked, and the question (car.png: "Today 6:36 am"). */
export function SavingsQuestion({ day = "Today", time = "6:36 am", text = CAR.ask, className, style }: Piece & { day?: string; time?: string; text?: string }) {
  return (
    <>
      <DateLine day={day} time={time} className={className} style={style} />
      <MyBubble text={text} />
    </>
  );
}
