"use client";

import { useRef, type ReactNode } from "react";

import {
  AppTile,
  AskCard,
  AskFold,
  AskStack,
  C,
  DeepChat,
  GameFolded,
  KrovviBubbles,
  MyBubble,
  ThisOrThat,
  Turn,
  Working,
  emo,
  type AppId,
  type Pair,
} from "@/components/deep";
import { Phone } from "@/components/phone";
import { PhoneSky } from "@/components/sky/phone-sky";
import { useReducedMotion } from "@/lib/use-reduced-motion";

import { type Beat, Thread, useBeats } from "./chat-film";
import { Scaled } from "./scaled";
import { useFirstSeen } from "./use-seen";

/**
 * The bento's pictures: each a piece of today's app on the night sky,
 * drawn at the app's points and scaled to its tile. Each plays once when
 * its tile comes into view; with motion reduced it stands finished.
 */

/** A pane of the app's night with its still stars, the app drawn on it at `w` points wide. */
export function SkyPanel({ w = 393, h, seed = 7, children, label, className }: { w?: number; h: number; seed?: number; children: ReactNode; label?: string; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-[22px] ${className ?? ""}`} style={{ background: C.sky, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)" }}>
      <Scaled w={w} h={h} label={label}>
        <div className="absolute inset-0">
          <PhoneSky seed={seed} />
        </div>
        {/* Words stand on the sky here at any height, so the stars keep about half their light, as the app's reading band keeps a third. */}
        <div aria-hidden="true" className="absolute inset-0" style={{ background: "rgba(1,1,1,0.45)" }} />
        <div className="dk absolute inset-0">{children}</div>
      </Scaled>
    </div>
  );
}

/** A thread of the chat on a panel: the app's 16 point sides, top-aligned, 10 between rows unless a beat says. */
export function PanelThread({ beats, at, pad = 18 }: { beats: Beat[]; at: number; pad?: number }) {
  return (
    <div style={{ position: "absolute", inset: 0, padding: `${pad}px 16px`, display: "flex", flexDirection: "column" }}>
      <Thread beats={beats} at={at} />
    </div>
  );
}

/** Plays once from when `ref` comes into view. */
export function usePlayOnce(beats: Beat[], ref: React.RefObject<Element | null>) {
  const reduced = useReducedMotion();
  const seen = useFirstSeen(ref, "0px 0px -20% 0px");
  const { n } = useBeats(beats, { playing: seen && !reduced, loop: false });
  return reduced ? beats.length : n;
}

/** A trailing emoji stays on the line of the word before it, never alone on a line of its own. */
export function keepEmoji(text: string): string {
  return text.replace(/ (\p{Extended_Pictographic}[\uFE0F\u200D\p{Extended_Pictographic}]*)$/u, "\u00a0$1");
}

export function Says({ lines, stagger = 380 }: { lines: string[]; stagger?: number }) {
  return (
    <Turn>
      <KrovviBubbles lines={lines.map((l) => emo(keepEmoji(l)))} rise stagger={stagger} />
    </Turn>
  );
}

/* ------------------------------------------------------------------ */
/* It's fun to talk to                                                  */
/* ------------------------------------------------------------------ */

const COFFEE: Pair = { a: { emoji: "☕", label: "Coffee" }, b: { emoji: "🍵", label: "Tea" }, guess: "a" };
const OWL: Pair = { a: { emoji: "🦉", label: "Night owl" }, b: { emoji: "🐦", label: "Early bird" }, guess: "a" };
const GUESSED = "I already guessed each of yours 😏";

/**
 * The deck, by the beats so far: the first card, pulled toward Tea, chosen
 * with Krovvi's guess shown on the other side, then lifting off as the next
 * card grows in (this-or-that.tsx: the pick shows 620 ms before its card goes).
 */
function Deck({ has }: { has: (id: string) => boolean }) {
  if (has("next")) return <ThisOrThat pair={OWL} at={2} line={GUESSED} arrive leaving={{ pair: COFFEE, chosen: "b", from: 56 }} />;
  if (has("pick")) return <ThisOrThat pair={COFFEE} at={1} line={GUESSED} pull={56} glide={240} chosen="b" pop />;
  if (has("pull")) return <ThisOrThat pair={COFFEE} at={1} line={GUESSED} pull={84} glide={420} />;
  return <ThisOrThat pair={COFFEE} at={1} line={GUESSED} glide={420} rise delay={700} />;
}

const BORED: Beat[] = [
  { id: "q", wait: 300, gap: 0, show: () => <MyBubble text="I'm bored" rise /> },
  { id: "w", wait: 400, gap: 16, until: "a", show: () => <Working /> },
  {
    id: "a",
    wait: 1000,
    gap: 0,
    show: (has) => (
      <Turn>
        <KrovviBubbles lines={[emo(keepEmoji("Let's fix that 😄")), "Quick round of This or That. Tap one, or swipe toward it."]} rise stagger={420} />
        <Deck has={has} />
      </Turn>
    ),
  },
  { id: "pull", wait: 2300 },
  { id: "pick", wait: 460 },
  { id: "next", wait: 620 },
];

/** How the round went, kept as one line with a dot for each card (lit where Krovvi read the person right). */
const MARKS = [true, false, true, false, false, false, true, false, true, true];

const READ: Beat[] = [
  { id: "f", wait: 2400, gap: 0, show: () => <Turn><GameFolded text="This or That · I read you right 5 of 10" marks={MARKS} live /></Turn> },
  { id: "p", wait: 700, gap: 16, show: () => <MyBubble text="Coffee, Night owl, Mountains, Text, Wing it, Cook, Podcasts, Sunset..." rise /> },
  { id: "w", wait: 400, gap: 16, until: "a", show: () => <Working /> },
  { id: "a", wait: 1100, gap: 0, show: () => <Says lines={["Ha, I knew you were a night owl 🦉", "Didn't see the mountains coming though.", "I'll remember you'd rather text than call."]} stagger={520} /> },
];

export function FunVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const a = usePlayOnce(BORED, ref);
  const b = usePlayOnce(READ, ref);
  return (
    <div ref={ref} className="grid gap-4 md:grid-cols-2">
      <SkyPanel h={430} seed={41} label="You write: I'm bored. Krovvi: Let's fix that. Quick round of This or That. Tap one, or swipe toward it. A card: Coffee or Tea. You swipe toward Tea; Krovvi had guessed Coffee. The next card: Night owl or Early bird.">
        <PanelThread beats={BORED} at={a} />
      </SkyPanel>
      <SkyPanel h={430} seed={53} label="After the round: This or That, I read you right 5 of 10. Your picks: Coffee, Night owl, Mountains, Text, Wing it, Cook, Podcasts, Sunset. Krovvi: Ha, I knew you were a night owl. Didn't see the mountains coming though. I'll remember you'd rather text than call.">
        <PanelThread beats={READ} at={b} />
      </SkyPanel>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* It knows your people                                                 */
/* ------------------------------------------------------------------ */

const SAM = {
  what: "Someone",
  where: "Chat",
  question: "Who is Sam to you?",
  because: "You mentioned him three times this week.",
  quote: "Sam said he would send the contract by Monday.",
  options: ["From work", "A friend", "Family"],
};
const LINA = {
  what: "Date",
  where: "Chat",
  question: "Is dinner with Lina on Friday or Saturday?",
  because: "You said both, and I want to remind you on the right day.",
  quote: "Dinner with Lina on the weekend, Friday I think.",
  options: ["Friday", "Saturday"],
};
const COFFEE_Q = { what: "You", where: "Chat", question: "Coffee or tea in the morning?", options: ["Coffee", "Tea"] };

/** Krovvi's questions, one card at a time: an answer is lit a beat, its card lifts off, the next grows in (krovvi-asks.tsx:784, krovvi-stack.tsx). */
function Asks({ has }: { has: (id: string) => boolean }) {
  const at = has("q2") ? (has("q3") ? 3 : 2) : 1;
  if (has("done")) return <AskFold text="All 3 answered" check live />;
  const card1 = <AskCard {...SAM} tip picked={has("t1") ? 0 : null} />;
  const card2 = <AskCard {...LINA} picked={has("t2") ? 0 : null} />;
  const card3 = <AskCard {...COFFEE_Q} picked={has("t3") ? 0 : null} />;
  const leaving = has("q2") && !has("s2") ? card1 : has("q3") && !has("s3") ? card2 : undefined;
  return (
    <AskStack label={`${at} of 3`} next={[LINA.question, COFFEE_Q.question].slice(at - 1)} arrive={at > 1} leaving={leaving} rise={at === 1} delay={500}>
      {at === 1 ? card1 : at === 2 ? card2 : card3}
    </AskStack>
  );
}

const ASKS: Beat[] = [
  {
    id: "m",
    wait: 500,
    gap: 0,
    show: (has) => (
      <Turn>
        <KrovviBubbles lines={[emo(keepEmoji("Got a few quick ones for you 🙂"))]} rise />
        <Asks has={has} />
      </Turn>
    ),
  },
  { id: "t1", wait: 3200 },
  { id: "q2", wait: 160 },
  { id: "s2", wait: 700 },
  { id: "t2", wait: 2600 },
  { id: "q3", wait: 160 },
  { id: "s3", wait: 700 },
];

export function PeopleVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const at = usePlayOnce(ASKS, ref);
  return (
    <div ref={ref} className="mx-auto w-[min(330px,100%)]">
      <Phone label="Krovvi asks a few quick questions when it isn't sure. Who is Sam to you? You mentioned him three times this week, and Sam said he would send the contract by Monday. You tap From work. Next: Is dinner with Lina on Friday or Saturday? You tap Friday. Then: Coffee or tea in the morning?">
        <div className="absolute inset-0">
          <DeepChat sky={<PhoneSky seed={19} />} veil columnStyle={{ gap: 0, paddingTop: 6 }}>
            <Thread beats={ASKS} at={at} />
          </DeepChat>
        </div>
      </Phone>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* It keeps your life in order                                          */
/* ------------------------------------------------------------------ */

const LIT: Array<{ app: AppId; line: string; at: number }> = [
  { app: "money", line: "2 to confirm", at: 500 },
  { app: "plans", line: "Friday dinner", at: 1100 },
  { app: "trips", line: "Lisbon, March", at: 1700 },
  { app: "fitness", line: "10K plan", at: 2300 },
];

const QUIET: AppId[] = ["todo", "nutrition", "habits", "kitchen", "health", "watch", "library", "meetings"].slice(0, 8) as AppId[];

function AppsPanel({ cols, seen, reduced, className }: { cols: number; seen: boolean; reduced: boolean; className?: string }) {
  const cell = 86;
  const rows = Math.ceil((LIT.length + QUIET.length) / cols);
  return (
    <SkyPanel
      className={className}
      w={cols * cell + 48}
      h={rows * 104 + 42}
      seed={61}
      label="Krovvi's apps behind the chat: Money has 2 to confirm, Plans has Friday dinner, Trips has Lisbon in March, Fitness has a 10K plan. To-do, Nutrition, Habits, Kitchen, Health, Watch, Library and Meetings stand beside them."
    >
      <div style={{ position: "absolute", inset: 0, padding: "26px 24px 0", display: "flex", flexWrap: "wrap" }}>
        {LIT.map((t) => (
          <AppTile key={t.app} app={t.app} width={cell} line={seen || reduced ? t.line : undefined} lit={seen || reduced} arrive={seen && !reduced ? t.at : undefined} />
        ))}
        {QUIET.map((app) => (
          <AppTile key={app} app={app} width={cell} />
        ))}
      </div>
    </SkyPanel>
  );
}

/** The apps behind the chat, the four that just took something lit in turn: six across on a wide tile, four on a phone. */
export function OrderVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const seen = useFirstSeen(ref, "0px 0px -20% 0px");
  return (
    <div ref={ref}>
      <AppsPanel cols={6} seen={seen} reduced={reduced} className="hidden md:block" />
      <AppsPanel cols={4} seen={seen} reduced={reduced} className="md:hidden" />
    </div>
  );
}
