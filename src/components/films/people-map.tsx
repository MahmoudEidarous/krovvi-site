"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

import { C, DeepFace, personTint } from "@/components/deep";
import { useReducedMotion } from "@/lib/use-reduced-motion";

import { Scaled } from "./scaled";
import { useOnScreen } from "./use-seen";

/**
 * The People map's circles, as the app draws them (catch8
 * src/components/people-map/canvas.tsx and lib/people-map/circles.ts at
 * 6edb7fca, the design approved on 2 October 2026): you in the middle, close
 * family on the first ring, then the people you deal with most, then
 * everyone else, each circle of your life on its own side (family at the
 * top, work at the bottom left, friends at the bottom right), faces in
 * Krovvi's dots on the black, warm hairlines from you to the first ring, and
 * the rings themselves at a whisper.
 *
 * It opens the way the map opens: the rings draw in, the faces land ring by
 * ring, the lines draw out from you. Then the sheet rises (people-map/
 * person-sheet.tsx, Find My's shape) and Krovvi brings one person after
 * another into focus with what it knows and where it heard it. The first is
 * Omar: you have talked every day this week, so he moves a ring closer ("the
 * more you talk, the closer they sit"), and the plan he changed is updated
 * the way the app marks a change (components/memory/diff-text.tsx): the old
 * word struck and faint, the new one lit.
 */

/** circles.ts CIRCLES: the rings' radii and the faces' sizes, you first. */
const RING = [0, 72, 132, 188];
const FACE = [52, 38, 34, 30];
/** canvas.tsx:359-360: names on the outer rings a step quieter. */
const NAME_ALPHA = [1, 1, 0.88, 0.74];
/** canvas.tsx LINE: the warm hairline from you to your close family. */
const LINE = "#E9E4DA";
/** The app's curve, the one easing in Krovvi. */
const EASE = "cubic-bezier(0.23, 1, 0.32, 1)";

/** The map's own frame, at the app's points. */
const W = 440;
const H = 452;
const CX = 220;
const CY = 238;

type Side = "above" | "below" | "left" | "right";
type Person = { name: string; ring: number; angle: number; side: Side };

const PEOPLE: Person[] = [
  // Close family, all around you on the first ring.
  { name: "Mom", ring: 1, angle: -128, side: "above" },
  { name: "Lina", ring: 1, angle: -90, side: "above" },
  { name: "Dad", ring: 1, angle: -52, side: "above" },
  { name: "Nana", ring: 1, angle: 52, side: "below" },
  { name: "Adam", ring: 1, angle: 128, side: "below" },
  // The people you deal with most, on their sides: family's at the top, work's at the bottom left, friends' at the bottom right.
  { name: "Aunt May", ring: 2, angle: -152, side: "left" },
  { name: "Uncle Joe", ring: 2, angle: -28, side: "right" },
  { name: "Sam", ring: 2, angle: 150, side: "below" },
  { name: "Priya", ring: 2, angle: 110, side: "below" },
  { name: "Mona", ring: 2, angle: 68, side: "below" },
  // Everyone else.
  { name: "Rae", ring: 3, angle: -112, side: "above" },
  { name: "Jonah", ring: 3, angle: -68, side: "above" },
  { name: "Daniel", ring: 3, angle: 168, side: "below" },
  { name: "Chen", ring: 3, angle: 122, side: "below" },
  { name: "Ben", ring: 3, angle: 58, side: "below" },
  { name: "Leo", ring: 3, angle: 6, side: "below" },
  { name: "Omar", ring: 3, angle: 30, side: "right" },
];

/** Omar, after a week of talking every day, sits one ring in. */
const OMAR_CLOSER = { ring: 2, angle: 30, side: "right" as Side };

type Sheet = {
  name: string;
  role: string;
  /** What Krovvi knows; `was` and `now` mark a change inside it, after `lead`. */
  lead: string;
  was?: string;
  now?: string;
  said: string;
  where: string;
  often: string;
};

const SHEETS: Sheet[] = [
  { name: "Omar", role: "A close friend", lead: "Dinner on", was: "Friday", now: "Saturday", said: "“Saturday instead? Same place.”", where: "In a chat · Today", often: "You've talked every day this week" },
  { name: "Lina", role: "Your sister", lead: "Moved to Lisbon in March", said: "“The new flat in Lisbon has a spare room 👀”", where: "In a chat · 12 Oct", often: "Most weeks · Last talked yesterday" },
  { name: "Mona", role: "A close friend", lead: "Vegetarian now", said: "“I've gone vegetarian, by the way!”", where: "A voice note · 8 Oct", often: "Most weeks · Last talked Sunday" },
  { name: "Sam", role: "From work", lead: "Owes you the contract by Monday", said: "“I'll send the contract by Monday.”", where: "In a chat · Tuesday", often: "A few times a week" },
];

const at = (ring: number, angle: number) => {
  const a = (angle * Math.PI) / 180;
  return { x: CX + RING[ring] * Math.cos(a), y: CY + RING[ring] * Math.sin(a) };
};

/** canvas.tsx:184-189: where each face appears as the map opens, ring by ring, closest first. */
const landAt = (p: Person, i: number) => 300 + (p.ring - 1) * 260 + (i % 24) * 34;

/** How long a person stays in focus, and the beat before the first. */
const HOLD = 4600;
const FIRST = 2700;

function Name({ text, side, size, alpha, lit }: { text: string; side: Side; size: number; alpha: number; lit: boolean }) {
  const r = size / 2;
  // circles.ts LABEL: over a face, under it or beside it, with the black halo so a line never cuts a name.
  const base: CSSProperties = {
    position: "absolute",
    whiteSpace: "nowrap",
    fontSize: 12,
    lineHeight: "14px",
    fontWeight: 500,
    letterSpacing: "-0.1px",
    color: lit ? C.fg : `rgba(237,237,235,${alpha})`,
    textShadow: "0 0 3px #030303, 0 0 2px #030303, 0 0 1px #030303",
    pointerEvents: "none",
    transition: `color 300ms ${EASE}`,
  };
  if (side === "above") return <span style={{ ...base, left: "50%", bottom: `calc(50% + ${r + 6}px)`, transform: "translateX(-50%)" }}>{text}</span>;
  if (side === "below") return <span style={{ ...base, left: "50%", top: `calc(50% + ${r + 5}px)`, transform: "translateX(-50%)" }}>{text}</span>;
  if (side === "right") return <span style={{ ...base, left: `calc(50% + ${r + 6}px)`, top: "50%", transform: "translateY(-50%)" }}>{text}</span>;
  return <span style={{ ...base, right: `calc(50% + ${r + 6}px)`, top: "50%", transform: "translateY(-50%)" }}>{text}</span>;
}

/** One face on the map: it lands on the design's spring, and moves to a new place on the app's curve. */
function Face({ name, x, y, size, alpha, side, show, delay, dimmed, lit }: { name: string; x: number; y: number; size: number; alpha: number; side: Side; show: boolean; delay: number; dimmed: boolean; lit: boolean }) {
  const tint = personTint(name);
  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        opacity: show ? (dimmed ? 0.42 : 1) : 0,
        transform: show ? "scale(1)" : "scale(0.4)",
        transition: [
          `opacity 420ms ${EASE} ${delay}ms`,
          // The design's spring (stiffness 105, damping ratio 0.92): a landing that barely passes its mark.
          `transform 700ms cubic-bezier(0.34, 1.25, 0.5, 1) ${delay}ms`,
          `left 1100ms ${EASE}`,
          `top 1100ms ${EASE}`,
          `width 1100ms ${EASE}`,
          `height 1100ms ${EASE}`,
        ].join(", "),
      }}
    >
      {/* Its own light behind it while in focus. */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: -size * 0.6,
          borderRadius: "50%",
          background: `radial-gradient(closest-side, ${tint}40, ${tint}00)`,
          opacity: lit ? 1 : 0,
          transition: `opacity 500ms ${EASE}`,
        }}
      />
      {/* Drawn once at 40 and scaled to its ring, as the map draws a face (people-map/text.ts BASE), so a face that moves rings keeps every dot. */}
      <span style={{ position: "absolute", left: 0, top: 0, width: 40, height: 40, transform: `scale(${size / 40})`, transformOrigin: "0 0", transition: `transform 1100ms ${EASE}` }}>
        <DeepFace name={name} size={40} />
      </span>
      {/* The ring round the face in focus (canvas.tsx FocusRing): its own colour, 1.5 wide. */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: -4,
          borderRadius: "50%",
          border: `1.5px solid ${tint}`,
          opacity: lit ? 1 : 0,
          transform: lit ? "scale(1)" : "scale(0.85)",
          transition: `opacity 300ms ${EASE}, transform 420ms ${EASE}`,
        }}
      />
      <Name text={name} side={side} size={size} alpha={alpha} lit={lit} />
    </div>
  );
}

/** The map: rings, lines, the sides' names and every face. */
function Circles({ show, landed, focus, closer, reduced }: { show: boolean; landed: boolean; focus: string | null; closer: boolean; reduced: boolean }) {
  const dim = focus !== null;
  return (
    <div className="dk" style={{ position: "relative", width: W, height: H }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }} aria-hidden="true">
        {RING.slice(1).map((r, i) => {
          const len = 2 * Math.PI * r;
          return (
            <circle
              key={r}
              cx={CX}
              cy={CY}
              r={r}
              fill="none"
              stroke={C.fg}
              strokeWidth={1}
              strokeDasharray={len}
              strokeDashoffset={show ? 0 : len}
              transform={`rotate(-90 ${CX} ${CY})`}
              style={{ opacity: 0.085, transition: `stroke-dashoffset 1000ms ${EASE} ${120 + i * 120}ms` }}
            />
          );
        })}
        {PEOPLE.filter((p) => p.ring === 1).map((p, i) => {
          const a = (p.angle * Math.PI) / 180;
          const x1 = CX + (FACE[0] / 2 + 3) * Math.cos(a);
          const y1 = CY + (FACE[0] / 2 + 3) * Math.sin(a);
          const x2 = CX + (RING[1] - FACE[1] / 2 - 3) * Math.cos(a);
          const y2 = CY + (RING[1] - FACE[1] / 2 - 3) * Math.sin(a);
          const len = Math.hypot(x2 - x1, y2 - y1);
          const lit = focus === p.name;
          return (
            <line
              key={p.name}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={lit ? personTint(p.name) : LINE}
              strokeWidth={lit ? 1.8 : 1.5}
              strokeLinecap="round"
              strokeDasharray={len}
              strokeDashoffset={show ? 0 : len}
              style={{
                opacity: dim ? (lit ? 0.95 : 0.14) : 0.32,
                transition: `stroke-dashoffset 620ms ${EASE} ${landed ? 0 : 900 + i * 60}ms, opacity 400ms ${EASE}, stroke 300ms ${EASE}`,
              }}
            />
          );
        })}
      </svg>

      {/* The sides' names (canvas.tsx SideName): 10.5 medium, tracked 1.3, faint. */}
      {[
        { text: "FAMILY", x: CX, y: CY - RING[3] - 30, rot: 0 },
        { text: "WORK", x: CX - 160, y: CY + 160, rot: 45 },
        { text: "FRIENDS", x: CX + 160, y: CY + 160, rot: -45 },
      ].map((s) => (
        <span
          key={s.text}
          aria-hidden="true"
          style={{
            position: "absolute",
            left: s.x,
            top: s.y,
            transform: `translate(-50%, -50%) rotate(${s.rot}deg)`,
            fontSize: 10.5,
            fontWeight: 500,
            letterSpacing: "1.3px",
            color: C.faint,
            whiteSpace: "nowrap",
            opacity: show ? 1 : 0,
            transition: `opacity 700ms ${EASE} ${landed || reduced ? 0 : 1400}ms`,
          }}
        >
          {s.text}
        </span>
      ))}

      <Face name="You" x={CX} y={CY} size={FACE[0]} alpha={1} side="below" show={show} delay={landed || reduced ? 0 : 240} dimmed={false} lit={false} />
      {PEOPLE.map((p, i) => {
        const moved = p.name === "Omar" && closer;
        const ring = moved ? OMAR_CLOSER.ring : p.ring;
        const pos = at(ring, moved ? OMAR_CLOSER.angle : p.angle);
        return (
          <Face
            key={p.name}
            name={p.name}
            x={pos.x}
            y={pos.y}
            size={FACE[ring]}
            alpha={NAME_ALPHA[ring]}
            side={moved ? OMAR_CLOSER.side : p.side}
            show={show}
            delay={landed || reduced ? 0 : landAt(p, i)}
            dimmed={dim && focus !== p.name}
            lit={focus === p.name}
          />
        );
      })}
    </div>
  );
}

/** What Krovvi knows, with a change marked as the app marks one: the old words struck and faint, the new ones lit (memory/diff-text.tsx). */
function Knows({ sheet, changed }: { sheet: Sheet; changed: boolean }) {
  if (!sheet.was || !sheet.now) return <>{sheet.lead}</>;
  return (
    <>
      {sheet.lead}{" "}
      <span
        style={{
          color: changed ? C.faint : C.fg,
          textDecorationLine: changed ? "line-through" : "none",
          textDecorationColor: C.faint,
          transition: `color 300ms ${EASE}`,
        }}
      >
        {sheet.was}
      </span>
      <span
        style={{
          display: "inline-block",
          marginLeft: changed ? 6 : 0,
          maxWidth: changed ? 120 : 0,
          overflow: "hidden",
          verticalAlign: "bottom",
          transition: `max-width 520ms ${EASE}, margin-left 520ms ${EASE}`,
        }}
      >
        <span style={{ display: "inline-block", background: C.fg, color: C.bg, fontWeight: 600, borderRadius: 5, padding: "0 5px", whiteSpace: "nowrap" }}>{sheet.now}</span>
      </span>
    </>
  );
}

/**
 * The sheet under the map, at the page's own size so it reads on any screen
 * (person-sheet.tsx: the face, the name at 22 semibold, who they are, the
 * line Krovvi heard and where, and how often you talk), in a sheet's fill
 * with its grabber.
 */
function PersonSheet({ sheet, open, changed }: { sheet: Sheet | null; open: boolean; changed: boolean }) {
  return (
    <div className="relative h-[212px] overflow-hidden md:h-[200px]">
      <div
        className="absolute inset-x-0 top-0 rounded-[26px] px-5 pb-5 pt-2"
        style={{
          background: C.sheet,
          boxShadow: "inset 0 0.5px 0 rgba(255,255,255,0.1)",
          transform: open ? "translateY(0)" : "translateY(105%)",
          transition: `transform 620ms ${EASE}`,
        }}
      >
        <div className="flex justify-center pb-3">
          <span className="h-[4px] w-[36px] rounded-full" style={{ background: "rgba(237,237,235,0.2)" }} />
        </div>
        {sheet ? (
          <div key={sheet.name} className="dk-fade" style={{ ["--dk-dur" as string]: "260ms" }}>
            <div className="flex items-center gap-3">
              <DeepFace name={sheet.name} size={40} />
              <div className="min-w-0">
                <div className="text-[20px] font-semibold leading-[25px] tracking-[-0.6px]" style={{ color: C.fg }}>
                  {sheet.name}
                </div>
                <div className="text-[14px] leading-[19px]" style={{ color: C.soft }}>
                  {sheet.role}
                </div>
              </div>
            </div>
            <div className="mt-3 text-[16px] font-medium leading-[23px] tracking-[-0.2px]" style={{ color: C.fg }}>
              <Knows sheet={sheet} changed={changed} />
            </div>
            <div className="mt-1 line-clamp-2 text-[13.5px] leading-[19px]" style={{ color: C.muted }}>
              {sheet.said} <span style={{ color: C.faint }}>· {sheet.where}</span>
            </div>
            <div className="mt-2 text-[12.5px] leading-[17px]" style={{ color: C.faint }}>
              {sheet.often}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * The film. It opens once when it comes into view; then, while it is on
 * screen, the sheet walks from one person to the next. With motion reduced
 * it stands open with Omar already closer and his sheet up, the change shown.
 */
export function PeopleMapVisual({ label }: { label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const on = useOnScreen(ref, "0px 0px -12% 0px");
  const [opened, setOpened] = useState(false);
  const [landed, setLanded] = useState(false);
  const [closer, setCloser] = useState(false);
  const [index, setIndex] = useState<number | null>(null);
  const [changed, setChanged] = useState(false);

  // The opening, once.
  useEffect(() => {
    if (reduced || !on || opened) return;
    const id = window.setTimeout(() => setOpened(true), 60);
    return () => window.clearTimeout(id);
  }, [on, opened, reduced]);
  useEffect(() => {
    if (!opened) return;
    const id = window.setTimeout(() => setLanded(true), 2400);
    return () => window.clearTimeout(id);
  }, [opened]);

  // The sheet: the first person after the map has landed, then the next one every few seconds, while on screen.
  useEffect(() => {
    if (reduced || !opened || !on) return;
    const id = window.setTimeout(() => setIndex((i) => (i === null ? 0 : (i + 1) % SHEETS.length)), index === null ? FIRST : HOLD);
    return () => window.clearTimeout(id);
  }, [reduced, opened, on, index]);

  // Omar's moment: he moves a ring closer, and the changed plan is marked.
  useEffect(() => {
    setChanged(false);
    if (index === null || SHEETS[index].name !== "Omar") return;
    const a = window.setTimeout(() => setCloser(true), 500);
    const b = window.setTimeout(() => setChanged(true), 1300);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, [index]);

  const still = reduced;
  const sheet = still ? SHEETS[0] : index === null ? null : SHEETS[index];
  return (
    <div ref={ref}>
      <Scaled w={W} h={H} label={label}>
        <Circles show={opened || still} landed={landed || still} focus={sheet?.name ?? null} closer={closer || still} reduced={still} />
      </Scaled>
      <PersonSheet sheet={sheet} open={!!sheet} changed={changed || still} />
    </div>
  );
}
