/**
 * The savings answer's arithmetic, ported from the app (catch8 store build 20,
 * 6edb7fca), so the site's car screen moves exactly as the phone's does:
 *
 *   - the plan itself: supabase/functions/_shared/screen/samples.ts:46-56
 *     ("car"): goal 20,000, saved 6,500, a slider of 100 to 1,500 in steps of
 *     50 starting at 400, the date `addMonths(today, monthsTo(goal, saved,
 *     monthly))` said as a month, "N months from now", and "Every $100 more
 *     brings it N months sooner";
 *   - monthsTo (_shared/screen/formula.ts:345-355), addMonths (days.ts:42-49),
 *     how numbers, money, months and counts are said (format.ts);
 *   - the chart (_shared/screen/bricks/chart.ts): its points from the formula,
 *     the domain, the round scale, where each point sits, the axis words, and
 *     the scale held while a finger drags (stepScale, relaxed, scaleOf);
 *   - the slider's dots and thumb (src/components/screen/bricks/track-math.ts)
 *     and its steps (_shared/screen/bricks/slider.ts snap, fractionOf).
 *
 * Pure: no React, no window. The card (answers.tsx) draws what this works out,
 * on the server or in the browser (answers-live.tsx).
 */

/* ------------------------------------------------------------------ */
/* The plan                                                            */
/* ------------------------------------------------------------------ */

/** A calendar day. */
export interface Day {
  year: number;
  month: number;
  date: number;
}

/** The demo world's today: Wednesday 14 October 2026 (the brief). */
export const TODAY: Day = { year: 2026, month: 10, date: 14 };

/** samples.ts:50-53, the car's screen as Krovvi writes it. */
export const CAR = {
  title: "Saving for the car",
  /** The number's label, which goes up beside the card's name (plan.ts headOf). */
  label: "You'd have it by",
  goal: 20000,
  saved: 6500,
  /** The slider: "Put away each month", 100 to 1,500 in steps of 50, at 400. */
  sliderLabel: "Put away each month",
  min: 100,
  max: 1500,
  step: 50,
  start: 400,
  unit: "$",
  lineLabel: "Goal",
  /** The person's question and Krovvi's words over the screen (samples.ts:48-49). */
  ask: "If I put away 400 a month, when can I buy the car?",
} as const;

/** formula.ts:345-355 with no rate: months until savings reach a goal, null when they never do. */
export function monthsTo(goal: number, start: number, monthly: number): number | null {
  if (start >= goal) return 0;
  return monthly > 0 ? Math.ceil((goal - start) / monthly - 1e-9) : null;
}

/** days.ts:42-49: months added the way people count them (31 January plus one month is the last day of February). */
export function addMonths(day: Day, n: number): Day {
  const total = day.year * 12 + (day.month - 1) + Math.trunc(n);
  const year = Math.floor(total / 12);
  const month = total - year * 12 + 1;
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { year, month, date: Math.min(day.date, last) };
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** format.ts showMonth: "March", with the year when it is not this year's ("August 2029"). */
export function showMonth(day: Day, today: Day = TODAY): string {
  const words = MONTHS[day.month - 1];
  return day.year === today.year ? words : `${words} ${day.year}`;
}

/** format.ts showNumber for whole numbers: "12,500". */
export function showNumber(n: number): string {
  if (!Number.isFinite(n)) return "–";
  const body = String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return n < 0 && Math.round(n) !== 0 ? `−${body}` : body;
}

/** format.ts showMoney, whole: "$400", "$1,500". */
export function showMoney(n: number, unit: string = CAR.unit): string {
  return `${unit}${showNumber(n)}`;
}

/** format.ts plural, two forms: "1 month", "34 months". */
export function plural(n: number, one: string, other: string): string {
  if (!Number.isFinite(n)) return "–";
  return `${showNumber(n)} ${n === 1 ? one : other}`;
}

export interface SavingsWords {
  perMonth: number;
  /** Months until the goal: 34 at $400. */
  months: number | null;
  /** The figure: "August 2029". */
  date: string;
  /** Under the figure: "34 months from now". */
  fromNow: string;
  /** The slider's value: "$400". */
  amount: string;
  /** The note under the slider: "Every $100 more brings it 7 months sooner." */
  sooner: string;
  /** Krovvi's words over the screen. */
  answer: string;
}

/** What the screen says at a monthly amount (samples.ts:51-55, every formula worked out). */
export function savingsWords(perMonth: number, plan: { goal?: number; saved?: number; today?: Day } = {}): SavingsWords {
  const goal = plan.goal ?? CAR.goal;
  const saved = plan.saved ?? CAR.saved;
  const today = plan.today ?? TODAY;
  const months = monthsTo(goal, saved, perMonth);
  const more = monthsTo(goal, saved, perMonth + 100);
  const date = months === null ? "–" : showMonth(addMonths(today, months), today);
  const fromNow = months === null ? "–" : `${plural(months, "month", "months")} from now`;
  const sooner = months === null || more === null ? "–" : `Every $100 more brings it ${plural(months - more, "month", "months")} sooner.`;
  const answer = `With ${showMoney(saved)} saved and ${showMoney(perMonth)} a month, you'd have the ${showMoney(goal)} by **${date}**. Slide to see how much a bigger amount brings it in.`;
  return { perMonth, months, date, fromNow, amount: showMoney(perMonth), sooner, answer };
}

/* ------------------------------------------------------------------ */
/* The chart (_shared/screen/bricks/chart.ts)                          */
/* ------------------------------------------------------------------ */

/** components/screen/bricks/chart.tsx:98-106: room for a called-out value, the plot, under it, its words. */
export const HEAD = 24;
export const PLOT = 120;
export const FOOT = 8;
export const AXIS = 16;
export const BOX = HEAD + PLOT + FOOT + AXIS;
export const CANVAS = HEAD + PLOT + 4;
export const GUTTER_GAP = 6;
/** chart.ts LINE_INSET: a line's ends sit this far in from the plot's sides. */
export const LINE_INSET = 6;
/** The most points a line draws (chart.ts LIMIT.line). */
const LINE_LIMIT = 60;

/** chart.ts FOLLOW_MS, RELAX_MS; bricks/follow.tsx MOVE_MS; chart.tsx DRAW_MS. */
export const FOLLOW_MS = 240;
export const RELAX_MS = 700;
export const MOVE_MS = 260;
export const DRAW_MS = 900;

export interface ChartPt {
  x: number;
  label: string;
  value: number;
}

export interface Domain {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/** chart.ts plotXs: whole months from `from` to `to`, at most `max` of them, the last one always `to`. */
export function plotXs(from: number, to: number, max = LINE_LIMIT): number[] {
  let a = Math.round(from);
  let b = Math.round(to);
  if (a > b) [a, b] = [b, a];
  if (!(b > a)) return [];
  const step = Math.max(1, Math.ceil((b - a) / (max - 1)));
  const out: number[] = [];
  for (let x = a; x < b; x += step) out.push(x);
  out.push(b);
  return out;
}

/** chart.ts xWords for months: "Now" for the point that is now, "Oct" this year, "Aug 2029" another. */
export function monthTick(x: number, today: Day = TODAY): string {
  if (x === 0) return "Now";
  const d = addMonths(today, x);
  return d.year === today.year ? SHORT_MONTHS[d.month - 1] : `${SHORT_MONTHS[d.month - 1]} ${d.year}`;
}

/** The car chart's points: `min(goal, saved + monthly * x)` from now to the month it is reached (samples.ts:52). */
export function savingsPoints(perMonth: number, plan: { goal?: number; saved?: number; today?: Day } = {}): ChartPt[] {
  const goal = plan.goal ?? CAR.goal;
  const saved = plan.saved ?? CAR.saved;
  const to = monthsTo(goal, saved, perMonth);
  if (to === null) return [];
  return plotXs(0, to).map((x) => ({ x, label: monthTick(x, plan.today), value: Math.min(goal, saved + perMonth * x) }));
}

/** chart.ts dataDomain for a line: its values and the goal, zero taken in when the lowest is under half the highest. */
export function dataDomain(points: readonly ChartPt[], line: number | null): Domain | null {
  if (!points.length) return null;
  const values = points.map((p) => p.value);
  let y0 = Math.min(...values);
  let y1 = Math.max(...values);
  if (line !== null && Number.isFinite(line)) {
    y0 = Math.min(y0, line);
    y1 = Math.max(y1, line);
  }
  if (y0 > 0 && y0 <= y1 * 0.5) y0 = 0;
  else if (y1 < 0 && y1 >= y0 * 0.5) y1 = 0;
  const xs = points.map((p) => p.x);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0, y1 };
}

export function unionDomain(a: Domain, b: Domain): Domain {
  return { x0: Math.min(a.x0, b.x0), x1: Math.max(a.x1, b.x1), y0: Math.min(a.y0, b.y0), y1: Math.max(a.y1, b.y1) };
}

export function domainKey(d: Domain | null): string {
  return d ? [d.x0, d.x1, d.y0, d.y1].map((n) => Number(n.toPrecision(9))).join(",") : "";
}

/** chart.ts roundStep: 1, 2, 2.5 or 5 times a power of ten, the nearest by ratio. */
export function roundStep(raw: number): number {
  if (!(raw > 0) || !Number.isFinite(raw)) return 1;
  const power = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / power;
  let best = 1;
  for (const nice of [1, 2, 2.5, 5, 10]) if (Math.abs(Math.log(f / nice)) < Math.abs(Math.log(f / best))) best = nice;
  return best * power;
}

/** chart.ts niceScale: the scale's ends on round numbers, about five steps apart. */
export function niceScale(lo: number, hi: number): { min: number; max: number } {
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return { min: 0, max: 1 };
  let a = Math.min(lo, hi);
  let b = Math.max(lo, hi);
  if (a === b) {
    if (a === 0) return { min: 0, max: 1 };
    const pad = Math.abs(a) * 0.5;
    a = a > 0 && a - pad < 0 ? 0 : a - pad;
    b += pad;
  }
  const step = roundStep((b - a) / 5);
  return { min: Number((Math.floor(a / step + 1e-9) * step).toPrecision(12)), max: Number((Math.ceil(b / step - 1e-9) * step).toPrecision(12)) };
}

/** Where a line's points sit in the plot, from its top left (chart.ts geometry, kind line). */
export interface Geometry {
  xs: number[];
  ys: number[];
  /** The goal line's height, NaN for none. */
  ref: number;
}

export function geometry(points: readonly ChartPt[], domain: Domain, width: number, ref: number | null, height = PLOT): Geometry {
  const { min, max } = niceScale(domain.y0, domain.y1);
  const yOf = (v: number) => height * (1 - (v - min) / (max - min));
  const span = domain.x1 - domain.x0;
  const room = Math.max(0, width - LINE_INSET * 2);
  return {
    xs: points.map((p) => (span > 0 ? LINE_INSET + ((p.x - domain.x0) / span) * room : width / 2)),
    ys: points.map((p) => yOf(p.value)),
    ref: ref === null || !Number.isFinite(ref) ? NaN : yOf(ref),
  };
}

/** chart.ts lerpGeometry: between two geometries of the same points, `k` from 0 to 1. */
export function lerpGeometry(a: Geometry, b: Geometry, k: number): Geometry {
  if (a.xs.length !== b.xs.length) return b;
  const mix = (p: number, q: number) => (Number.isNaN(p) || Number.isNaN(q) ? q : p + (q - p) * k);
  return { xs: b.xs.map((x, i) => mix(a.xs[i], x)), ys: b.ys.map((y, i) => mix(a.ys[i], y)), ref: mix(a.ref, b.ref) };
}

export function geometryKey(g: Geometry): string {
  const r = (n: number) => (Number.isNaN(n) ? "n" : String(Math.round(n * 10) / 10));
  return `${g.xs.map(r).join(",")}|${g.ys.map(r).join(",")}|${r(g.ref)}`;
}

/** chart.ts wordsWidth: about how wide words set at a size, in points. */
export function wordsWidth(text: string, size: number): number {
  let em = 0;
  for (const ch of text) {
    if (/[0-9]/.test(ch)) em += 0.6;
    else if (/[A-Z$€£¥%]/.test(ch)) em += 0.66;
    else if (/[a-z]/.test(ch)) em += 0.52;
    else if (/[\s.,:;'·]/.test(ch)) em += 0.28;
    else em += 0.58;
  }
  return em * size;
}

export interface Tick {
  index: number;
  text: string;
  left: number;
  width: number;
  /** Set against the plot's far edge (chart.tsx:718-722). */
  atEnd: boolean;
}

/** chart.ts axisTicks: the first and last points' words, centred under their points, kept inside the plot, never touching. */
export function axisTicks(labels: readonly string[], xs: readonly number[], width: number, size = 12): Tick[] {
  const n = Math.min(labels.length, xs.length);
  if (!n) return [];
  const out: Tick[] = [];
  for (const i of [0, n - 1]) {
    if (out.some((t) => t.index === i)) continue;
    const text = labels[i];
    if (!text) continue;
    const w = Math.ceil(wordsWidth(text, size));
    const left = Math.max(0, Math.min(width - w, xs[i] - w / 2));
    if (out.some((t) => left < t.left + t.width + 8 && t.left < left + w + 8)) continue;
    out.push({ index: i, text, left, width: w, atEnd: left + w >= width - 0.5 && i !== 0 });
  }
  return out.sort((a, b) => a.left - b.left);
}

/* ------------------------------------------------------------------ */
/* The scale held while a finger drags (chart.ts:442-470)              */
/* ------------------------------------------------------------------ */

export interface HeldScale {
  first: Domain | null;
  data: Domain | null;
  held: Domain | null;
  key: string;
  at: number;
}

export const NO_SCALE: HeldScale = { first: null, data: null, held: null, key: "", at: 0 };

/** chart.ts stepScale: grown during a quick run of changes (a drag), fitted again once it rests. */
export function stepScale(state: HeldScale, data: Domain | null, now: number): HeldScale {
  if (!data) return state.data || state.key ? { ...state, data: null, held: null, key: "" } : state;
  const key = domainKey(data);
  if (key === state.key) return state;
  const first = state.first ?? data;
  const quick = state.key !== "" && now - state.at < FOLLOW_MS;
  const before = state.data ? (state.held ?? unionDomain(first, state.data)) : unionDomain(first, data);
  return { first, data, held: quick ? unionDomain(before, data) : null, key, at: now };
}

export function relaxed(state: HeldScale): HeldScale {
  return state.held ? { ...state, held: null } : state;
}

export function scaleOf(state: HeldScale): Domain | null {
  if (!state.data || !state.first) return null;
  return state.held ?? unionDomain(state.first, state.data);
}

/** The scale a still picture is drawn at: as the screen first drew it (at the plan's start) grown to what it shows now, at rest. */
export function restingScale(perMonth: number, start: number = CAR.start, plan: { goal?: number; saved?: number; today?: Day } = {}): Domain | null {
  const goal = plan.goal ?? CAR.goal;
  const first = dataDomain(savingsPoints(start, plan), goal);
  const now = dataDomain(savingsPoints(perMonth, plan), goal);
  if (!first || !now) return now ?? first;
  return unionDomain(first, now);
}

/* ------------------------------------------------------------------ */
/* The slider (bricks/track-math.ts, _shared bricks/slider.ts)         */
/* ------------------------------------------------------------------ */

/** components/screen/bricks/slider.tsx:42-50 */
export const THUMB = 26;
export const AREA = 36;
export const HALO = THUMB + 10;
export const SLIDER_DOT = 4;
export const SLIDER_PITCH = 8;

/** slider.ts snap: inside the range, on a step counted from the low end. */
export function snap(value: number, range: { min: number; max: number; step: number } = CAR): number {
  const { min, max, step } = range;
  const clamped = Math.min(max, Math.max(min, value));
  const steps = Math.round((clamped - min) / step);
  const out = Math.min(max, min + steps * step);
  const digits = Math.max(0, -Math.floor(Math.log10(step)) + 1);
  return Number(out.toFixed(Math.min(8, digits)));
}

/** slider.ts fractionOf: where a value sits on the track, 0 at the low end. */
export function fractionOf(value: number, range: { min: number; max: number } = CAR): number {
  return range.max === range.min ? 0 : Math.min(1, Math.max(0, (value - range.min) / (range.max - range.min)));
}

export function dotCount(width: number, dot = SLIDER_DOT, pitch = SLIDER_PITCH): number {
  if (!(width > dot) || !(pitch > 0)) return 2;
  return Math.max(2, Math.floor((width - dot) / pitch) + 1);
}

export function stepOf(count: number, dot: number, width: number): number {
  return count > 1 ? Math.max(0, width - dot) / (count - 1) : 0;
}

export function centreOf(i: number, count: number, dot: number, width: number): number {
  return dot / 2 + i * stepOf(count, dot, width);
}

export function dotsWithin(reach: number, count: number, dot: number, width: number): number {
  if (!(reach >= dot / 2)) return 0;
  const step = stepOf(count, dot, width);
  if (!(step > 0)) return count;
  return Math.max(0, Math.min(count, Math.floor((reach - dot / 2) / step + 1e-6) + 1));
}

/** track-math.ts runWindow, from the left: the first `lit` dots, ending halfway into the gap after the last. */
export function runEnd(lit: number, count: number, dot: number, width: number): number {
  if (lit <= 0) return 0;
  return lit >= count ? width : centreOf(lit - 1, count, dot, width) + stepOf(count, dot, width) / 2;
}

/** track-math.ts thumbLeft: the thumb's left edge for a share of the way. */
export function thumbLeft(share: number, width: number, thumb = THUMB): number {
  const f = Math.max(0, Math.min(1, Number.isFinite(share) ? share : 0));
  return f * Math.max(1, width - thumb);
}

/** track-math.ts sliderShare: the share a finger at `x` means, held on the track. */
export function sliderShare(x: number, width: number, thumb = THUMB): number {
  return Math.max(0, Math.min(1, (x - thumb / 2) / Math.max(1, width - thumb)));
}

/** track-math.ts sliderWindow: where the lit dots end, every dot from the low end to the thumb's centre, whole. */
export function sliderLitEnd(share: number, width: number, count: number, dot = SLIDER_DOT, thumb = THUMB): number {
  const centre = thumbLeft(share, width, thumb) + thumb / 2;
  return runEnd(dotsWithin(centre, count, dot, width), count, dot, width);
}

/** The app's one curve, cubic-bezier(0.23, 1, 0.32, 1) (theme/motion.ts:16), as a function of time for scripted motion. */
export function ease(t: number): number {
  return bezier(0.23, 1, 0.32, 1, t);
}

/** A cubic-bezier timing curve at `t` (0 to 1): x solved by halving, then y read. */
export function bezier(x1: number, y1: number, x2: number, y2: number, t: number): number {
  const x = Math.max(0, Math.min(1, t));
  const at = (p1: number, p2: number, u: number) => 3 * (1 - u) * (1 - u) * u * p1 + 3 * (1 - u) * u * u * p2 + u * u * u;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 26; i += 1) {
    const mid = (lo + hi) / 2;
    if (at(x1, x2, mid) < x) lo = mid;
    else hi = mid;
  }
  return at(y1, y2, (lo + hi) / 2);
}
