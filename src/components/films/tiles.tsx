"use client";

import { useRef } from "react";

import {
  AppTile,
  AskCard,
  AskStack,
  C,
  Choices,
  DateLine,
  DeepFace,
  HAIR,
  Icon,
  KrovviBubbles,
  KrovviK,
  MoveHeader,
  MyBubble,
  ThisOrThat,
  Turn,
  Working,
  emo,
  type AppId,
  type Pair,
} from "@/components/deep";
import { useReducedMotion } from "@/lib/use-reduced-motion";

import { type Beat, Thread, useBeats } from "./chat-film";
import { Scaled } from "./scaled";
import { useFirstSeen } from "./use-seen";

/**
 * The bento's pictures: the four things that make Krovvi a friend, each as
 * the app draws it, large, straight on the tile's night (no phone, no status
 * bar, no wallpaper). Each plays once when its tile comes into view; with
 * motion reduced it stands finished.
 */

/** A trailing emoji stays on the line of the word before it, never alone on a line of its own. */
export function keepEmoji(text: string): string {
  return text.replace(/ (\p{Extended_Pictographic}[️‍\p{Extended_Pictographic}]*)$/u, " $1");
}

export function Says({ lines, stagger = 380 }: { lines: string[]; stagger?: number }) {
  return (
    <Turn>
      <KrovviBubbles lines={lines.map((l) => emo(keepEmoji(l)))} rise stagger={stagger} />
    </Turn>
  );
}

/** Plays once from when `ref` comes into view. */
export function usePlayOnce(beats: Beat[], ref: React.RefObject<Element | null>) {
  const reduced = useReducedMotion();
  const seen = useFirstSeen(ref, "0px 0px -20% 0px");
  const { n } = useBeats(beats, { playing: seen && !reduced, loop: false });
  return reduced ? beats.length : n;
}

/**
 * A thread of the chat drawn on the tile at the app's points. `end`: held at
 * its foot the way the app holds a chat, so each new message lands at the
 * bottom and lifts the ones before it.
 */
function Column({ beats, at, end = false }: { beats: Beat[]; at: number; end?: boolean }) {
  return (
    <div className="dk" style={{ position: "absolute", inset: 0, padding: "4px 0", display: "flex", flexDirection: "column", justifyContent: end ? "flex-end" : "flex-start", overflow: "hidden" }}>
      <Thread beats={beats} at={at} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* It remembers your world                                              */
/* ------------------------------------------------------------------ */

/** The people of the demo world, as the People app lists them: a face, a name, one quiet line (components/own/people/row.tsx). */
const PEOPLE = [
  { name: "Lina", line: "Your sister. Moved to Lisbon in March." },
  { name: "Sam", line: "From work. Contract due Monday." },
  { name: "Mona", line: "A close friend. Vegetarian now." },
  { name: "Omar", line: "A close friend. Dinner on Friday." },
];

/** One person as the People app's row draws them: the 44 point face, 12 to the words, the name over its line (row.tsx:93-95). */
function Person({ name, line, delay, show, still }: { name: string; line: string; delay: number; show: boolean; still: boolean }) {
  return (
    <div
      className={show && !still ? "dk-rise" : undefined}
      style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 64, opacity: show || still ? undefined : 0, ...({ "--dk-delay": `${delay}ms` } as React.CSSProperties) }}
    >
      <DeepFace name={name} size={44} />
      <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ color: C.fg, fontSize: 17, lineHeight: "22px", fontWeight: 500, letterSpacing: "-0.3px" }}>{name}</span>
        <span style={{ color: C.muted, fontSize: 13.5, lineHeight: "18px" }}>{line}</span>
      </div>
    </div>
  );
}

function PeopleGrid({ cols, show, still }: { cols: 1 | 2; show: boolean; still: boolean }) {
  return (
    <div className="dk" style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: cols === 2 ? "1fr 1fr" : "1fr", columnGap: 28, rowGap: 6, alignContent: "start" }}>
      {PEOPLE.map((p, i) => (
        <Person key={p.name} name={p.name} line={p.line} delay={i * 110} show={show} still={still} />
      ))}
    </div>
  );
}

const PEOPLE_LABEL = `The people in your life, as Krovvi keeps them: ${PEOPLE.map((p) => `${p.name}: ${p.line}`).join(" ")}`;

export function RemembersVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const seen = useFirstSeen(ref, "0px 0px -15% 0px");
  return (
    <div ref={ref}>
      <Scaled w={330} h={282} label={PEOPLE_LABEL}>
        <PeopleGrid cols={1} show={seen} still={reduced} />
      </Scaled>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* It starts the conversation                                           */
/* ------------------------------------------------------------------ */

const FIRST: Beat[] = [
  {
    id: "m1",
    wait: 400,
    gap: 0,
    show: () => (
      <Turn>
        <MoveHeader text="Your aunt's birthday" kind="event" />
        <KrovviBubbles lines={[emo(keepEmoji("Your aunt's birthday is tomorrow 🎂")), "Want a nudge in the morning to text her?"]} rise stagger={520} />
      </Turn>
    ),
  },
  {
    id: "c",
    wait: 1300,
    gap: 20,
    until: "y",
    show: (has) => (
      <Turn>
        <Choices options={["Yes, at 9", "I've got it"]} picked={has("p") ? 0 : null} style={{ marginTop: 0 }} />
      </Turn>
    ),
  },
  { id: "p", wait: 1600 },
  { id: "y", wait: 380, gap: 16, show: () => <MyBubble text="Yes, at 9" rise /> },
  { id: "w", wait: 450, gap: 16, until: "r", show: () => <Working /> },
  { id: "r", wait: 1100, gap: 0, show: () => <Says lines={["Done. I'll nudge you at 9 🙂"]} /> },
  { id: "d", wait: 1700, gap: 28, show: () => <DateLine day="Tomorrow" time="9:00 AM" className="dk-rise" /> },
  {
    id: "m2",
    wait: 700,
    gap: 0,
    show: () => (
      <Turn>
        <MoveHeader text="Your aunt's birthday" kind="event" />
        <KrovviBubbles lines={[emo(keepEmoji("Morning! It's her birthday today 🎂")), "Text her before your day gets busy?"]} rise stagger={520} />
      </Turn>
    ),
  },
];

export function FirstVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const at = usePlayOnce(FIRST, ref);
  return (
    <div ref={ref}>
      <Scaled
        w={340}
        h={560}
        label="Krovvi writes first: Your aunt's birthday is tomorrow. Want a nudge in the morning to text her? You tap Yes, at 9. Krovvi: Done. I'll nudge you at 9. The next morning at 9: Morning! It's her birthday today. Text her before your day gets busy?"
      >
        <Column beats={FIRST} at={at} end />
      </Scaled>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Fun, made from your life                                             */
/* ------------------------------------------------------------------ */

const OWL: Pair = { a: { emoji: "🦉", label: "Night owl" }, b: { emoji: "🐦", label: "Early bird" }, guess: "a" };
const GUESSED = "I already guessed each of yours 😏";

/** The card by the beats so far: pulled toward Night owl, then chosen, with Krovvi's guess on the same side. */
function Deck({ has }: { has: (id: string) => boolean }) {
  // Chosen: the card settles back to the middle, Night owl lit and Krovvi's guess on it.
  if (has("pick")) return <ThisOrThat pair={OWL} at={3} line={GUESSED} pull={0} glide={300} chosen="a" pop />;
  if (has("pull")) return <ThisOrThat pair={OWL} at={3} line={GUESSED} pull={-84} glide={420} />;
  return <ThisOrThat pair={OWL} at={3} line={GUESSED} glide={420} rise delay={200} />;
}

const FUN: Beat[] = [
  { id: "deck", wait: 300, gap: 0, show: (has) => <Deck has={has} /> },
  { id: "pull", wait: 1700 },
  { id: "pick", wait: 460 },
  // Its line after the round, word for word from the app (the deck's tot-en-3-done.png).
  { id: "r", wait: 1300, gap: 14, show: () => <Says lines={["Ha, I knew you were a night owl 🦉"]} /> },
];

export function FunVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const at = usePlayOnce(FUN, ref);
  return (
    <div ref={ref}>
      <Scaled w={360} h={336} label="This or That, made from what Krovvi knows: Night owl or Early bird. You swipe toward Night owl, and Krovvi had guessed it. Krovvi: Ha, I knew you were a night owl.">
        <Column beats={FUN} at={at} />
      </Scaled>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* It asks, so it gets you right                                        */
/* ------------------------------------------------------------------ */

const SAM = {
  what: "Someone",
  where: "Chat",
  question: "Who is Sam to you?",
  because: "You mentioned him three times this week.",
  quote: "Sam said he would send the contract by Monday.",
  options: ["From work", "A friend", "Family"],
};
const LINA_Q = {
  what: "Date",
  where: "Chat",
  question: "Is dinner with Lina on Friday or Saturday?",
  because: "You said both, and I want to remind you on the right day.",
  quote: "Dinner with Lina on the weekend, Friday I think.",
  options: ["Friday", "Saturday"],
};

/** A tapped answer is lit a beat, its card lifts off and the next grows in (krovvi-asks.tsx:784, krovvi-stack.tsx). */
function Asks({ has }: { has: (id: string) => boolean }) {
  const two = has("q2");
  const card1 = <AskCard {...SAM} tip picked={has("t1") ? 0 : null} />;
  const card2 = <AskCard {...LINA_Q} picked={null} />;
  return (
    <AskStack
      label={two ? "2 of 3" : "1 of 3"}
      next={two ? ["Coffee or tea in the morning?"] : [LINA_Q.question, "Coffee or tea in the morning?"]}
      arrive={two}
      leaving={two && !has("s2") ? card1 : undefined}
      rise={!two}
    >
      {two ? card2 : card1}
    </AskStack>
  );
}

const ASKS: Beat[] = [
  { id: "a", wait: 300, gap: 0, show: (has) => <Asks has={has} /> },
  { id: "t1", wait: 2600 },
  { id: "q2", wait: 160 },
  { id: "s2", wait: 700 },
];

export function AsksVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const at = usePlayOnce(ASKS, ref);
  return (
    <div ref={ref}>
      <Scaled w={340} h={468} label="When Krovvi isn't sure, it asks: Who is Sam to you? You mentioned him three times this week, and Sam said he would send the contract by Monday. You tap From work. The next question: Is dinner with Lina on Friday or Saturday?">
        <Column beats={ASKS} at={at} />
      </Scaled>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Your life, in order: the apps it fills as you talk                   */
/* ------------------------------------------------------------------ */

/** The apps behind the chat in the order they stand (kit APPS, lib/apps.ts), Recording left out. */
const SHELF: AppId[] = ["library", "meetings", "nutrition", "money", "todo", "fitness", "habits", "kitchen", "health", "plans", "trips", "watch"];

/** What you say, and the app that takes it: its tile lifts and glows in its colour, then its dot and its new line arrive. */
const FEEDS: Array<{ id: string; said: string; app: AppId; line: string }> = [
  { id: "f1", said: "Lunch at Lume was $42.80", app: "money", line: "1 to confirm" },
  { id: "f2", said: "Omar moved dinner to Saturday", app: "plans", line: "Saturday dinner" },
  { id: "f3", said: "Booked Lisbon for March ✈️", app: "trips", line: "Lisbon, March" },
  { id: "f4", said: "Ran 8 km by the river", app: "fitness", line: "8 km today" },
];

const FED: Beat[] = FEEDS.flatMap((f, i): Beat[] => [
  { id: f.id, wait: i === 0 ? 500 : 2300 },
  { id: `${f.id}in`, wait: 750 },
]);

export function AppsVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const at = usePlayOnce(FED, ref);
  const done = new Set(FED.slice(0, at).map((b) => b.id));
  const latest = [...FEEDS].reverse().find((f) => done.has(f.id));
  const cell = 96;
  return (
    <div ref={ref}>
      <Scaled
        w={4 * cell + 36}
        h={420}
        label={`As you talk, Krovvi's apps fill themselves: ${FEEDS.map((f) => `${f.said}, and ${f.app === "todo" ? "To-do" : f.app[0].toUpperCase() + f.app.slice(1)} shows ${f.line}`).join("; ")}.`}
      >
        <div className="dk" style={{ position: "absolute", inset: 0, padding: "6px 18px 0" }}>
          {/* The last thing you said, as you sent it. */}
          <div style={{ height: 52, display: "flex", flexDirection: "column" }}>
            {latest ? <MyBubble key={latest.id} text={latest.said} rise={!reduced} /> : null}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", marginTop: 14 }}>
            {SHELF.map((app) => {
              const feed = FEEDS.find((f) => f.app === app);
              const lit = !!feed && done.has(`${feed.id}in`);
              return <AppTile key={app} app={app} width={cell} lit={lit} line={lit ? feed.line : undefined} arrive={lit && !reduced ? 0 : undefined} />;
            })}
          </div>
        </div>
      </Scaled>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* It adapts to you                                                     */
/* ------------------------------------------------------------------ */

/**
 * The memory card under a reply (components/memory/turn-chip.tsx at
 * 6edb7fca): what the turn really kept, each line with Krovvi's K before it
 * and its own Undo, in the glass Krovvi's cards wear over the stars.
 */
function Kept({ lines }: { lines: string[] }) {
  return (
    <Turn>
      <div
        className="dk-rise"
        style={{ background: C.glass, border: `${HAIR}px solid ${C.glassEdge}`, borderRadius: 20, padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}
      >
        {lines.map((line) => (
          <div key={line} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
            <div style={{ flex: 1, display: "flex", alignItems: "flex-start", gap: 8 }}>
              <span style={{ width: 14, display: "flex", justifyContent: "center", paddingTop: 4 }}>
                <KrovviK size={11} color={C.muted} />
              </span>
              <span style={{ flex: 1, color: C.soft, fontSize: 13.5, letterSpacing: "-0.1px", lineHeight: "19.6px" }}>{line}</span>
            </div>
            <span style={{ display: "flex", alignItems: "center", gap: 4, height: 24, padding: "0 9px", borderRadius: 999, background: C.surfaceHi, flexShrink: 0 }}>
              <Icon name="undo" size={9} color={C.soft} weight={1.5} />
              <span style={{ color: C.fg, fontSize: 12, fontWeight: 500 }}>Undo</span>
            </span>
          </div>
        ))}
      </div>
    </Turn>
  );
}

const ADAPTS: Beat[] = [
  { id: "q", wait: 400, gap: 0, show: () => <MyBubble text="Too long 😅 just the answer next time" rise /> },
  { id: "w", wait: 450, gap: 16, until: "a", show: () => <Working /> },
  { id: "a", wait: 1000, gap: 0, show: () => <Says lines={["Got it. Short from now on 👍"]} /> },
  { id: "k", wait: 900, gap: 8, show: () => <Kept lines={["From now on: short answers"]} /> },
  { id: "d", wait: 1900, gap: 30, show: () => <DateLine day="Saturday" time="6:10 PM" className="dk-rise" /> },
  { id: "q2", wait: 600, gap: 0, show: () => <MyBubble text="What time is dinner?" rise /> },
  { id: "w2", wait: 450, gap: 16, until: "a2", show: () => <Working /> },
  { id: "a2", wait: 900, gap: 0, show: () => <Says lines={["8:30, Basil House 🙂"]} /> },
];

export function AdaptsVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const at = usePlayOnce(ADAPTS, ref);
  return (
    <div ref={ref}>
      <Scaled
        w={340}
        h={452}
        label="You write: Too long, just the answer next time. Krovvi: Got it. Short from now on. Under it, what Krovvi kept: From now on: short answers, with Undo. On Saturday you ask: What time is dinner? Krovvi: 8:30, Basil House."
      >
        <Column beats={ADAPTS} at={at} end />
      </Scaled>
    </div>
  );
}
