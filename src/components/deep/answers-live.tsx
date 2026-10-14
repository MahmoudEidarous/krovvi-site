"use client";

/**
 * The savings screen a visitor can move (answers.tsx SavingsCard, drawn the
 * same): drag the thumb with a mouse or a finger, tap the track, or use the
 * arrow keys, and the date, the months, the line and the note follow, the way
 * the app's screen follows a finger (catch8 src/components/screen/bricks/
 * slider.tsx, chart.tsx, screen/roll.tsx):
 *
 *   - while dragging, the value moves step by step (50 at a time) and the
 *     line lands at once with the finger, its scale held where the drag
 *     started so the change shows; 700 ms after the finger rests the scale
 *     eases back to fit in 260 ms (chart.ts stepScale, relaxed);
 *   - a finger lifted, the thumb lands on its step in 190 ms; a tap or a key
 *     moves it there in 240 ms;
 *   - the date rolls to its new month (the new one rising in as the old one
 *     leaves) only after a quiet moment, never during a drag.
 *
 * `auto` drives it from outside: give it a value and the thumb travels there
 * as a finger would, the screen following, then rests (`autoMs`, `autoDelay`).
 * It renders on the server at `value`, with no motion.
 */

import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";

import { useReducedMotion } from "@/lib/use-reduced-motion";

import { savingsGeometry, SavingsCard, type SavingsPlan } from "./answers";
import { COLUMN, Figure, figureSize } from "./bricks";
import { type Piece } from "./chat";
import {
  CAR,
  dataDomain,
  domainKey,
  ease,
  fractionOf,
  FOLLOW_MS,
  lerpGeometry,
  MOVE_MS,
  relaxed,
  RELAX_MS,
  savingsPoints,
  savingsWords,
  scaleOf,
  sliderShare,
  snap,
  stepScale,
  type Domain,
  type Geometry,
  type HeldScale,
} from "./savings";

/** theme/motion.ts:22-35: a finger lifted lands in `morph`, a value moved from outside in `enter`, a press in `press`. */
const LAND_MS = 190;
const GLIDE_MS = 240;
/** screen/roll.tsx:21-24: a change this soon after the last is part of a drag (no roll); the roll's length. */
const QUIET_MS = 280;
const ROLL_MS = 360;
/** slider.tsx:92: a drag takes the thumb once the finger has moved this far across. */
const DRAG_FROM = 4;

/** The scale as the screen first drew it (at the plan's start), then moved to `value` at rest. */
function firstScale(value: number, start: number, plan?: SavingsPlan): HeldScale {
  const goal = plan?.goal ?? CAR.goal;
  const first = dataDomain(savingsPoints(start, plan), goal);
  const data = dataDomain(savingsPoints(value, plan), goal);
  return { first, data, held: null, key: domainKey(data), at: -1e9 };
}

function domainOf(value: number, plan?: SavingsPlan): Domain | null {
  return dataDomain(savingsPoints(value, plan), plan?.goal ?? CAR.goal);
}

/** A finger's own motion, for the scripted drag: slow off, quick through, slow in. */
function hand(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x * x * x * (x * (6 * x - 15) + 10);
}

export function SavingsLive({
  value = CAR.start,
  auto,
  autoMs = 1100,
  autoDelay = 0,
  onChange,
  interactive = true,
  start = CAR.start,
  plan,
  title,
  label,
  width = COLUMN,
  rise = false,
  draw = false,
  className,
  style,
}: Piece & {
  /** Where the slider starts (the server draws it here). */
  value?: number;
  /** A value to travel to, as a finger would: change it to drive the screen. */
  auto?: number;
  /** How long the scripted drag takes. */
  autoMs?: number;
  /** How long it waits before it starts. */
  autoDelay?: number;
  onChange?: (perMonth: number) => void;
  /** False: a picture that only `auto` moves. */
  interactive?: boolean;
  start?: number;
  plan?: SavingsPlan;
  title?: string;
  label?: string;
  width?: number;
  rise?: boolean;
  draw?: boolean;
}) {
  const reduced = useReducedMotion();
  const inner = width - 32;
  const range = CAR;
  const [perMonth, setPerMonth] = useState(() => snap(value));
  const [share, setShare] = useState<number | null>(null);
  const [held, setHeld] = useState(false);
  const scale = useRef<HeldScale>(firstScale(snap(value), start, plan));
  const [geo, setGeo] = useState<Geometry | null>(() => savingsGeometry(snap(value), scaleOf(scale.current), inner, plan));

  const last = useRef(snap(value));
  const geoNow = useRef<Geometry | null>(geo);
  const geoAt = useRef(-1e9);
  const geoFrame = useRef(0);
  const shareNow = useRef<number>(fractionOf(snap(value)));
  const shareFrame = useRef(0);
  const relaxTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const press = useRef<{ id: number; x0: number; dragging: boolean } | null>(null);
  const changed = useRef(onChange);
  changed.current = onChange;

  // Nothing left running when the piece goes.
  useEffect(
    () => () => {
      cancelAnimationFrame(geoFrame.current);
      cancelAnimationFrame(shareFrame.current);
      if (relaxTimer.current) clearTimeout(relaxTimer.current);
      if (autoTimer.current) clearTimeout(autoTimer.current);
    },
    [],
  );

  /** The line to a new place: at once during a drag, with motion off, or when the points changed; else eased over MOVE_MS (chart.tsx:359-391). */
  const moveGeo = useCallback(
    (target: Geometry | null) => {
      cancelAnimationFrame(geoFrame.current);
      const now = performance.now();
      const was = geoNow.current;
      const quick = now - geoAt.current < FOLLOW_MS;
      geoAt.current = now;
      if (!target || !was || reduced || quick || was.xs.length !== target.xs.length) {
        geoNow.current = target;
        setGeo(target);
        return;
      }
      const t0 = now;
      const step = (t: number) => {
        const k = ease((t - t0) / MOVE_MS);
        const g = lerpGeometry(was, target, k);
        geoNow.current = g;
        setGeo(g);
        if (k < 1) geoFrame.current = requestAnimationFrame(step);
      };
      geoFrame.current = requestAnimationFrame(step);
    },
    [reduced],
  );

  /** The value moved: the words follow, the scale is held while changes come quickly, and fits again once they rest. */
  const take = useCallback(
    (raw: number) => {
      const next = snap(raw);
      if (next === last.current) return;
      last.current = next;
      setPerMonth(next);
      changed.current?.(next);
      scale.current = stepScale(scale.current, domainOf(next, plan), performance.now());
      moveGeo(savingsGeometry(next, scaleOf(scale.current), inner, plan));
      if (relaxTimer.current) clearTimeout(relaxTimer.current);
      if (scale.current.held) {
        relaxTimer.current = setTimeout(() => {
          scale.current = relaxed(scale.current);
          moveGeo(savingsGeometry(last.current, scaleOf(scale.current), inner, plan));
        }, RELAX_MS);
      }
    },
    [inner, moveGeo, plan],
  );

  /** The thumb to a share of the track over `ms`, then back to riding the value. */
  const glide = useCallback(
    (to: number, ms: number) => {
      cancelAnimationFrame(shareFrame.current);
      const from = shareNow.current;
      if (reduced || Math.abs(from - to) < 1e-4) {
        shareNow.current = to;
        setShare(null);
        return;
      }
      const t0 = performance.now();
      const step = (t: number) => {
        const k = ease((t - t0) / ms);
        const s = from + (to - from) * k;
        shareNow.current = s;
        setShare(k < 1 ? s : null);
        if (k < 1) shareFrame.current = requestAnimationFrame(step);
      };
      shareFrame.current = requestAnimationFrame(step);
    },
    [reduced],
  );

  const follow = useCallback(
    (s: number) => {
      cancelAnimationFrame(shareFrame.current);
      shareNow.current = s;
      setShare(s);
      take(range.min + s * (range.max - range.min));
    },
    [range.max, range.min, take],
  );

  /* A finger or a mouse on the track. */
  const pointsAt = (clientX: number): number => {
    const el = areaRef.current;
    if (!el) return 0;
    const box = el.getBoundingClientRect();
    // The phone's canvas is scaled to its glass: the track's own points, from its measured width.
    const k = box.width / inner || 1;
    return (clientX - box.left) / k;
  };
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!interactive || (e.pointerType === "mouse" && e.button !== 0)) return;
    if (autoTimer.current) clearTimeout(autoTimer.current);
    e.currentTarget.setPointerCapture(e.pointerId);
    press.current = { id: e.pointerId, x0: e.clientX, dragging: false };
    // A tap jumps there (slider.tsx:108-110); the thumb glides to its step.
    const s = sliderShare(pointsAt(e.clientX), inner);
    take(range.min + s * (range.max - range.min));
    glide(fractionOf(last.current), GLIDE_MS);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const p = press.current;
    if (!p || p.id !== e.pointerId) return;
    if (!p.dragging) {
      if (Math.abs(e.clientX - p.x0) < DRAG_FROM * ((areaRef.current?.getBoundingClientRect().width ?? inner) / inner)) return;
      p.dragging = true;
      setHeld(true);
    }
    follow(sliderShare(pointsAt(e.clientX), inner));
  };
  const onPointerEnd = (e: PointerEvent<HTMLDivElement>) => {
    const p = press.current;
    if (!p || p.id !== e.pointerId) return;
    press.current = null;
    if (p.dragging) {
      setHeld(false);
      // Lifted: the thumb lands on its step (slider.tsx:86-89).
      glide(fractionOf(last.current), LAND_MS);
    }
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const by: Record<string, number> = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 5, PageDown: -5 };
    let next: number | null = null;
    if (e.key in by) next = last.current + by[e.key] * range.step;
    else if (e.key === "Home") next = range.min;
    else if (e.key === "End") next = range.max;
    if (next === null) return;
    e.preventDefault();
    take(next);
    glide(fractionOf(last.current), GLIDE_MS);
  };

  /* Driven from outside: the thumb travels to `auto` as a finger would. */
  useEffect(() => {
    if (auto === undefined || !Number.isFinite(auto)) return;
    const target = snap(auto);
    if (autoTimer.current) clearTimeout(autoTimer.current);
    autoTimer.current = setTimeout(() => {
      if (target === last.current) return;
      if (reduced) {
        take(target);
        glide(fractionOf(target), 0);
        return;
      }
      const from = shareNow.current;
      const to = fractionOf(target);
      const t0 = performance.now();
      setHeld(true);
      const step = (t: number) => {
        const k = hand((t - t0) / autoMs);
        follow(from + (to - from) * k);
        if (k < 1) shareFrame.current = requestAnimationFrame(step);
        else {
          setHeld(false);
          glide(fractionOf(last.current), LAND_MS);
        }
      };
      shareFrame.current = requestAnimationFrame(step);
    }, autoDelay);
    return () => {
      if (autoTimer.current) clearTimeout(autoTimer.current);
    };
    // Driven by `auto` alone: the timings are read when it changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto]);

  const words = savingsWords(perMonth, plan);
  return (
    <SavingsCard
      perMonth={perMonth}
      start={start}
      plan={plan}
      title={title}
      label={label}
      width={width}
      rise={rise}
      draw={draw}
      geometry={geo ?? undefined}
      figure={<RollingDate value={words.date} room={inner} still={reduced} />}
      share={share}
      held={held}
      areaRef={areaRef}
      area={{
        role: "slider",
        tabIndex: interactive ? 0 : -1,
        "aria-label": CAR.sliderLabel,
        "aria-valuemin": range.min,
        "aria-valuemax": range.max,
        "aria-valuenow": perMonth,
        "aria-valuetext": `${words.amount} a month, ${words.date}`,
        className: "dkx-slider",
        style: { cursor: interactive ? (held ? "grabbing" : "pointer") : undefined },
        onPointerDown,
        onPointerMove,
        onPointerUp: onPointerEnd,
        onPointerCancel: onPointerEnd,
        onKeyDown,
      }}
      className={className}
      style={style}
    />
  );
}

/**
 * The date at display size, rolling to a new month after a quiet moment: the
 * new one rising in from below as the old one leaves above, 360 ms
 * (components/screen/roll.tsx, a figure that is not one number rolls whole).
 * A run of changes close together (a drag) keeps up with the finger instead.
 */
function RollingDate({ value, room, still }: { value: string; room: number; still: boolean }) {
  const [shown, setShown] = useState<{ now: string; was: string | null; beat: number }>({ now: value, was: null, beat: 0 });
  const at = useRef(-1e9);
  useEffect(() => {
    if (value === shown.now) return;
    const now = performance.now();
    const quiet = now - at.current > QUIET_MS;
    at.current = now;
    setShown((s) => ({ now: value, was: quiet && !still ? s.now : null, beat: quiet && !still ? s.beat + 1 : s.beat }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, still]);
  useEffect(() => {
    if (shown.was === null) return;
    const timer = setTimeout(() => setShown((s) => (s.beat === shown.beat ? { ...s, was: null } : s)), ROLL_MS + 30 * 12 + 80);
    return () => clearTimeout(timer);
  }, [shown.beat, shown.was]);
  if (shown.was === null) return <Figure value={shown.now} step="display" room={room} />;
  const size = figureSize(shown.now, "display", room);
  const line = Math.ceil(46 * Math.min(1, size / 40));
  const lift = { "--dk-lift": `${Math.round(line * 0.62)}px` } as CSSProperties;
  return (
    <div key={shown.beat} style={{ position: "relative", overflow: "hidden", height: line }}>
      <div className="dkx-roll-in" style={lift}>
        <Figure value={shown.now} step="display" room={room} />
      </div>
      <div className="dkx-roll-out" style={{ ...lift, position: "absolute", left: 0, top: 0, right: 0 }} aria-hidden="true">
        <Figure value={shown.was} step="display" room={room} />
      </div>
    </div>
  );
}
