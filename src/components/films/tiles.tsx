"use client";

import { useRef, type ReactNode } from "react";

import {
  AppsHome,
  AppTile,
  AskCard,
  AskFold,
  AskStack,
  C,
  DeepChat,
  GameFolded,
  HomeScreen,
  KrovviBubbles,
  LockScreen,
  MoneyOverview,
  MyBubble,
  Sent,
  SentPhotos,
  ThisOrThat,
  Turn,
  VoiceNote,
  CATEGORY_TINT,
  type ConfirmRow,
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


/** What waits for a yes in Money: the receipt sent in the chat today (Send it anything), and one from earlier. */
const TO_CONFIRM: ConfirmRow[] = [
  { title: "Lume", sub: "$42.80 · Today · from a receipt", mark: "receipt", tint: CATEGORY_TINT.eating },
  { title: "Pharmacy", sub: "$12.75 · Sat 3 Oct · from a receipt", mark: "heart", tint: CATEGORY_TINT.health },
];

/**
 * The apps behind the chat, the four that just took something lit in turn
 * (the home in the night look, kit AppsHome), and Money open beside it: the
 * month at a glance, what came from a receipt or the mail waiting for a
 * confirm, and the bills coming up.
 */
export function OrderVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const seen = useFirstSeen(ref, "0px 0px -20% 0px");
  const lit = seen || reduced;
  const apps = Object.fromEntries(LIT.map((t) => [t.app, { line: lit ? t.line : undefined, lit, arrive: seen && !reduced ? t.at : undefined }]));
  return (
    <div ref={ref} className="grid gap-4 md:grid-cols-2">
      <div className="overflow-hidden rounded-[22px]" style={{ background: C.sky, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)" }}>
        <Scaled w={393} h={560} label="Krovvi's apps behind the chat: Money has 2 to confirm, Plans has Friday dinner, Trips has Lisbon in March, Fitness has a 10K plan.">
          <AppsHome day="Wednesday" date="14 October" name="Alex" apps={apps} dock={false} sky={<PhoneSky seed={61} />} />
        </Scaled>
      </div>
      <div className="overflow-hidden rounded-[22px]" style={{ background: C.bg, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)" }}>
        <Scaled w={393} h={560} label="Money in Krovvi: October, $1,104 spent, $1,394 left after bills. To confirm: Lume, $42.80 today from a receipt, and Pharmacy, $12.75 from a receipt. Coming up: Streaming and Music.">
          <MoneyOverview confirm={TO_CONFIRM} />
        </Scaled>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* It texts you first                                                   */
/* ------------------------------------------------------------------ */

const NUDGES = [
  { text: "Your aunt's birthday is tomorrow 🎂 Want a nudge in the morning to text her?", when: "now" },
  { text: "Sam said the contract would come by Monday. It's not here yet. Want me to nudge him?", when: "2h ago" },
];

/**
 * The lock screen at night with Krovvi's messages resting on it, as build 20
 * shows them (KrovviNotify: a message from Krovvi with the K picture), the
 * older one first and the newest dropping in on top. Drawn 560 points tall:
 * the clock, the two messages, the flashlight and the camera.
 */
export function TextsFirstVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const seen = useFirstSeen(ref, "0px 0px -20% 0px");
  return (
    <div ref={ref} className="overflow-hidden rounded-[22px]" style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)" }}>
      <Scaled w={393} h={560} label={`A lock screen at 8:30 on Wednesday 14 October, with two messages from Krovvi. Now: ${NUDGES[0].text} Two hours ago: ${NUDGES[1].text}`}>
        <LockScreen time="8:30" notes={seen || reduced ? NUDGES : []} rise={!reduced} delay={350} stagger={950} style={{ height: 560 }} />
      </Scaled>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Send it anything                                                     */
/* ------------------------------------------------------------------ */

const SENT: Beat[] = [
  {
    id: "v",
    wait: 400,
    gap: 0,
    show: (has) => (
      <Sent>
        <VoiceNote ms={23000} about="How the Northline interview went" rise reading={!has("r1")} />
      </Sent>
    ),
  },
  { id: "w1", wait: 500, gap: 16, until: "r1", show: () => <Working /> },
  { id: "r1", wait: 1500, gap: 0, show: () => <Says lines={["Sounds like it went really well 😄", "I'll check in Friday, when they said they'd call."]} stagger={480} /> },
  {
    id: "p",
    wait: 1700,
    gap: 16,
    show: (has) => (
      <Sent>
        <SentPhotos photos={["receipt"]} rise reading={!has("r2")} />
        {/* Its own row across the column, so the bubble takes its 82 percent of the column, not of itself. */}
        <MyBubble text="Lunch with Omar" rise style={{ alignSelf: "stretch" }} />
      </Sent>
    ),
  },
  { id: "w2", wait: 500, gap: 16, until: "r2", show: () => <Working /> },
  { id: "r2", wait: 1300, gap: 0, show: () => <Says lines={["Lume, $42.80. It's in Money to confirm."]} /> },
];

export function SendVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const at = usePlayOnce(SENT, ref);
  return (
    <div ref={ref}>
      <SkyPanel h={560} seed={23} label="You send a voice note, 23 seconds, about how the Northline interview went. Krovvi: Sounds like it went really well. I'll check in Friday, when they said they'd call. Then a photo of a receipt: Lunch with Omar. Krovvi: Lume, $42.80. It's in Money to confirm.">
        <PanelThread beats={SENT} at={at} />
      </SkyPanel>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* It's on your Home Screen                                             */
/* ------------------------------------------------------------------ */

/** The two widgets of build 20 at the top of a Home Screen, Krovvi's latest message and the chat's own box, with Krovvi's icon among the apps under them. */
export function CloseVisual() {
  return (
    <div className="overflow-hidden rounded-[22px]" style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)" }}>
      <Scaled w={393} h={600} label="A Home Screen with two Krovvi widgets. Krovvi: its latest message, How did the Northline interview go? Message Krovvi: Ask, or give it a job, with Camera, Photos and Record. Krovvi's app icon sits among the apps below.">
        <HomeScreen layout="phone" />
      </Scaled>
    </div>
  );
}

/** What waits for a yes in Money: the receipt sent in the chat today (Send it anything), and one from earlier. */
const TO_CONFIRM: ConfirmRow[] = [
  { title: "Lume", sub: "$42.80 · Today · from a receipt", mark: "receipt", tint: CATEGORY_TINT.eating },
  { title: "Pharmacy", sub: "$12.75 · Sat 3 Oct · from a receipt", mark: "heart", tint: CATEGORY_TINT.health },
];

/**
 * The apps behind the chat, the four that just took something lit in turn
 * (the home in the night look, kit AppsHome), and Money open beside it: the
 * month at a glance, what came from a receipt or the mail waiting for a
 * confirm, and the bills coming up.
 */
export function OrderVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const seen = useFirstSeen(ref, "0px 0px -20% 0px");
  const lit = seen || reduced;
  const apps = Object.fromEntries(LIT.map((t) => [t.app, { line: lit ? t.line : undefined, lit, arrive: seen && !reduced ? t.at : undefined }]));
  return (
    <div ref={ref} className="grid gap-4 md:grid-cols-2">
      <div className="overflow-hidden rounded-[22px]" style={{ background: C.sky, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)" }}>
        <Scaled w={393} h={560} label="Krovvi's apps behind the chat: Money has 2 to confirm, Plans has Friday dinner, Trips has Lisbon in March, Fitness has a 10K plan.">
          <AppsHome day="Wednesday" date="14 October" name="Alex" apps={apps} dock={false} sky={<PhoneSky seed={61} />} />
        </Scaled>
      </div>
      <div className="overflow-hidden rounded-[22px]" style={{ background: C.bg, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)" }}>
        <Scaled w={393} h={560} label="Money in Krovvi: October, $1,104 spent, $1,394 left after bills. To confirm: Lume, $42.80 today from a receipt, and Pharmacy, $12.75 from a receipt. Coming up: Streaming and Music.">
          <MoneyOverview confirm={TO_CONFIRM} />
        </Scaled>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* It texts you first                                                   */
/* ------------------------------------------------------------------ */

const NUDGES = [
  { text: "Your aunt's birthday is tomorrow 🎂 Want a nudge in the morning to text her?", when: "now" },
  { text: "Sam said the contract would come by Monday. It's not here yet. Want me to nudge him?", when: "2h ago" },
];

/**
 * The lock screen at night with Krovvi's messages resting on it, as build 20
 * shows them (KrovviNotify: a message from Krovvi with the K picture), the
 * older one first and the newest dropping in on top. Drawn 560 points tall:
 * the clock, the two messages, the flashlight and the camera.
 */
export function TextsFirstVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const seen = useFirstSeen(ref, "0px 0px -20% 0px");
  return (
    <div ref={ref} className="overflow-hidden rounded-[22px]" style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)" }}>
      <Scaled w={393} h={560} label={`A lock screen at 8:30 on Wednesday 14 October, with two messages from Krovvi. Now: ${NUDGES[0].text} Two hours ago: ${NUDGES[1].text}`}>
        <LockScreen time="8:30" notes={seen || reduced ? NUDGES : []} rise={!reduced} delay={350} stagger={950} style={{ height: 560 }} />
      </Scaled>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Send it anything                                                     */
/* ------------------------------------------------------------------ */

const SENT: Beat[] = [
  {
    id: "v",
    wait: 400,
    gap: 0,
    show: (has) => (
      <Sent>
        <VoiceNote ms={23000} about="How the Northline interview went" rise reading={!has("r1")} />
      </Sent>
    ),
  },
  { id: "w1", wait: 500, gap: 16, until: "r1", show: () => <Working /> },
  { id: "r1", wait: 1500, gap: 0, show: () => <Says lines={["Sounds like it went really well 😄", "I'll check in Friday, when they said they'd call."]} stagger={480} /> },
  {
    id: "p",
    wait: 1700,
    gap: 16,
    show: (has) => (
      <Sent>
        <SentPhotos photos={["receipt"]} rise reading={!has("r2")} />
        {/* Its own row across the column, so the bubble takes its 82 percent of the column, not of itself. */}
        <MyBubble text="Lunch with Omar" rise style={{ alignSelf: "stretch" }} />
      </Sent>
    ),
  },
  { id: "w2", wait: 500, gap: 16, until: "r2", show: () => <Working /> },
  { id: "r2", wait: 1300, gap: 0, show: () => <Says lines={["Lume, $42.80. It's in Money to confirm."]} /> },
];

export function SendVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const at = usePlayOnce(SENT, ref);
  return (
    <div ref={ref}>
      <SkyPanel h={560} seed={23} label="You send a voice note, 23 seconds, about how the Northline interview went. Krovvi: Sounds like it went really well. I'll check in Friday, when they said they'd call. Then a photo of a receipt: Lunch with Omar. Krovvi: Lume, $42.80. It's in Money to confirm.">
        <PanelThread beats={SENT} at={at} />
      </SkyPanel>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* It's on your Home Screen                                             */
/* ------------------------------------------------------------------ */

/** A widget's name under it on the Home Screen: 12 points, white, in the soft shadow iOS gives words over a wallpaper. */
function WidgetName({ text }: { text: string }) {
  return <div style={{ marginTop: 6, textAlign: "center", fontSize: 12, lineHeight: "15px", color: "#FFFFFF", textShadow: "0 0.5px 3px rgba(0,0,0,0.45)" }}>{text}</div>;
}

/** The two widgets of build 20 on a Home Screen: Krovvi's latest message, and the chat's own box with Camera, Photos and Record. */
export function CloseVisual() {
  return (
    <div className="overflow-hidden rounded-[22px]" style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)" }}>
      <Scaled w={393} h={428} label="Two Krovvi widgets on a Home Screen. Krovvi: its latest message, How did the Northline interview go? Message Krovvi: Ask, or give it a job, with Camera, Photos and Record.">
        <div className="dk absolute inset-0" style={{ background: HOME_WALLPAPER }}>
          <div style={{ position: "absolute", left: (393 - WIDGET.medium) / 2, top: 28, width: WIDGET.medium, display: "flex", flexDirection: "column" }}>
            <KrovviWidget size="medium" text="How did the Northline interview go? 🙂" when="now" />
            <WidgetName text="Krovvi" />
            <div style={{ height: 22 }} />
            <MessageWidget size="medium" />
            <WidgetName text="Message Krovvi" />
          </div>
        </div>
      </Scaled>
    </div>
  );
}
