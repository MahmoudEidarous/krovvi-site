"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { AskCard, AskStack, C, HAIR, Icon, KrovviBubbles, KrovviK, KThinking, MyBubble, Notification, TaskItem, Turn, emo } from "@/components/deep";
import { Answers, CATEGORY_TINT, DotBar, GroupHead, IconTile, MONEY_TINT, PANE, Row, Tick } from "@/components/deep/money";
import { useReducedMotion } from "@/lib/use-reduced-motion";

import { Scaled } from "./scaled";
import { keepEmoji } from "./emoji";
import { useOnScreen } from "./use-seen";

/**
 * The bento's live pictures: each one keeps moving while it is on screen
 * and rests when it is not. Every piece is the app's own (the notification
 * from KrovviNotify, the question cards, the memory card under a reply, the
 * apps' pages); only the timing is the page's. With motion reduced each
 * stands still on a full, finished frame.
 */

const EASE = "cubic-bezier(0.23, 1, 0.32, 1)";

/** Fades a picture in at its top and out at its foot, so what moves in and out never meets a hard edge. */
function fade(top: number, bottom: number): CSSProperties {
  const mask = `linear-gradient(180deg, transparent 0%, #000 ${top}%, #000 ${100 - bottom}%, transparent 100%)`;
  return { maskImage: mask, WebkitMaskImage: mask };
}

/* ------------------------------------------------------------------ */
/* It starts the conversation: Krovvi's messages arriving on their own   */
/* ------------------------------------------------------------------ */

const MOVES = [
  "Hey! Today was the Northline interview, right? How did it go? 🙂",
  "Your aunt's birthday is tomorrow 🎂 Want a nudge in the morning to text her?",
  "Sam said the contract would come by Monday. It's not here yet. Want me to nudge him?",
  "You wanted a 10K before the year's out. 8 km by the river on Saturday? 🏃",
  "It's been two weeks since you and Lina talked. Send her a hi? 🙂",
  "Dinner with Omar is Saturday at 8:30 now. Want me to tell Mona?",
];
const WHEN = ["now", "1h ago", "3h ago", "5h ago", "6h ago"];

/**
 * Krovvi's messages as they reach the phone (targets/notify: a message from
 * Krovvi with the K picture), one every few seconds, the newest dropping in
 * on top and pushing the others down, the oldest fading out at the foot.
 */
export function FirstMovesVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const on = useOnScreen(ref, "0px 0px -10% 0px");
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (reduced || !on) return;
    const id = window.setTimeout(() => setCount((c) => c + 1), count === 0 ? 150 : count === 1 ? 650 : count === 2 ? 1300 : 2900);
    return () => window.clearTimeout(id);
  }, [reduced, on, count]);
  const shown = reduced ? 4 : count;
  const items = Array.from({ length: Math.min(shown, 5) }, (_, i) => {
    const n = shown - 1 - i;
    return { key: n, text: MOVES[n % MOVES.length], when: WHEN[i], i };
  });
  return (
    <div ref={ref}>
      <Scaled w={372} h={516} label={`Krovvi's messages arriving on their own: ${MOVES.slice(0, 4).join(" ")}`}>
        <div className="dk" style={{ position: "absolute", inset: 0, paddingTop: 2, ...fade(0, 18) }}>
          {items.map((it) => (
            <div key={it.key} className={reduced ? undefined : "bl-in"}>
              <div className="bl-inner" style={{ paddingBottom: 9, opacity: it.i >= 4 ? 0 : it.i === 3 ? 0.5 : 1, transition: `opacity 700ms ${EASE}` }}>
                <Notification text={it.text} when={it.when} width={372} />
              </div>
            </div>
          ))}
        </div>
      </Scaled>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* It asks, so it gets you right: the question cards, answered in turn  */
/* ------------------------------------------------------------------ */

type Question = { what: string; where: string; question: string; because?: string; quote?: string; options: string[]; pick: number };

const ROUNDS: Question[][] = [
  [
    { what: "Someone", where: "Chat", question: "Who is Sam to you?", because: "You mentioned him three times this week.", quote: "Sam said he would send the contract by Monday.", options: ["From work", "A friend", "Family"], pick: 0 },
    { what: "Date", where: "Chat", question: "Is dinner with Lina on Friday or Saturday?", because: "You said both, and I want to remind you on the right day.", options: ["Friday", "Saturday"], pick: 0 },
    { what: "You", where: "Chat", question: "Coffee or tea in the morning?", options: ["Coffee", "Tea"], pick: 0 },
  ],
  [
    { what: "Someone", where: "Voice note", question: "Is this the same Mona as Mona from work?", because: "Two Monas, and I don't want to mix them up.", options: ["Same person", "Someone else"], pick: 1 },
    { what: "You", where: "Chat", question: "Still saving for the car?", because: "You haven't mentioned it in a while.", options: ["Yes, still", "Not anymore"], pick: 0 },
    { what: "You", where: "Chat", question: "Run before work, or after?", options: ["Before work", "After work"], pick: 0 },
  ],
];

const QUESTIONS = ROUNDS.flat();

/**
 * The cards answered in turn, without end: each shown a while, its answer
 * lit, then lifting off as the next arrives; after the third, the next three
 * begin. The picture is never empty.
 */
export function AsksLoopVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const on = useOnScreen(ref, "0px 0px -10% 0px");
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (reduced || !on) return;
    const id = window.setTimeout(() => setStep((s) => s + 1), step % 2 === 0 ? 2700 : 240);
    return () => window.clearTimeout(id);
  }, [step, on, reduced]);
  const k = Math.floor(step / 2) % QUESTIONS.length;
  const inRound = k % 3;
  const picked = step % 2 === 1;
  const card = (q: Question, lit: boolean) => (
    <AskCard what={q.what} where={q.where} question={q.question} because={q.because} quote={q.quote} options={q.options} picked={lit ? q.pick : null} tip={step < 2} />
  );
  const prev = QUESTIONS[(k - 1 + QUESTIONS.length) % QUESTIONS.length];
  const leaving = step > 0 && step % 2 === 0 ? card(prev, true) : undefined;
  const round = QUESTIONS.slice(k - inRound, k - inRound + 3);
  return (
    <div ref={ref}>
      <Scaled w={372} h={516} label="When Krovvi isn't sure, it asks, a few quick ones at a time: Who is Sam to you? You mentioned him three times this week. Is dinner with Lina on Friday or Saturday? Coffee or tea in the morning? Each answered with a tap.">
        <div className="dk" style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
          <Turn>
            <KrovviBubbles lines={[emo(keepEmoji("Got a few quick ones for you 🙂"))]} />
          </Turn>
          <AskStack
            label={`${inRound + 1} of 3`}
            next={round.slice(inRound + 1).map((q) => q.question)}
            arrive={step > 0}
            leaving={leaving}
            rise={step === 0}
          >
            {card(QUESTIONS[k], picked)}
          </AskStack>
        </div>
      </Scaled>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* It adapts to you: what you say, and what it keeps from it            */
/* ------------------------------------------------------------------ */

const LESSONS = [
  { said: "Too long 😅 just the answer next time", reply: "Got it 👍", kept: "From now on: short answers" },
  { said: "Honestly, I'd rather text than call", reply: "Noted. Texts it is 🙂", kept: "Saved: You'd rather text than call" },
  { said: "Lina moved to Lisbon, by the way", reply: "Oh nice! Keeping that 🙂", kept: "Updated: Lina lives in Lisbon (was Porto)" },
  { said: "Nothing before 8 on weekends please 😴", reply: "Deal. Weekends start at 8", kept: "From now on: nothing before 8 on weekends" },
];

/**
 * The memory card under a reply (components/memory/turn-chip.tsx): while
 * the turn's save runs it says so with the K's dots, then what it kept,
 * Krovvi's K before the line and its own Undo after it, in the glass
 * Krovvi's cards wear over the stars.
 */
function KeptCard({ text, saved }: { text: string; saved: boolean }) {
  return (
    <Turn>
      <div style={{ position: "relative", background: C.glass, border: `${HAIR}px solid ${C.glassEdge}`, borderRadius: 20, padding: "12px 16px", minHeight: 50 }}>
        <div style={{ position: "absolute", left: 16, top: 0, bottom: 0, display: "flex", alignItems: "center", gap: 8, opacity: saved ? 0 : 1, transition: `opacity 260ms ${EASE}` }}>
          <KThinking size={14} tint={C.soft} />
          <span style={{ color: C.muted, fontSize: 13.5, letterSpacing: "-0.1px" }}>Saving</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, opacity: saved ? 1 : 0, transform: saved ? "none" : "translateY(3px)", transition: `opacity 360ms ${EASE} 80ms, transform 420ms ${EASE} 80ms` }}>
          <div style={{ flex: 1, display: "flex", alignItems: "flex-start", gap: 8 }}>
            <span style={{ width: 14, display: "flex", justifyContent: "center", paddingTop: 4 }}>
              <KrovviK size={11} color={C.muted} />
            </span>
            <span style={{ flex: 1, color: C.soft, fontSize: 13.5, letterSpacing: "-0.1px", lineHeight: "19.6px" }}>{text}</span>
          </div>
          <span style={{ display: "flex", alignItems: "center", gap: 4, height: 24, padding: "0 9px", borderRadius: 999, background: C.surfaceHi, flexShrink: 0 }}>
            <Icon name="undo" size={9} color={C.soft} weight={1.5} />
            <span style={{ color: C.fg, fontSize: 12, fontWeight: 500 }}>Undo</span>
          </span>
        </div>
      </div>
    </Turn>
  );
}

/** Each lesson in four beats: what you said, Krovvi's reply, the card saving, the card saved. */
const LESSON_WAITS = [500, 700, 650, 900];
const LESSON_GAP = 1900;

export function LearnsVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const on = useOnScreen(ref, "0px 0px -10% 0px");
  const [beat, setBeat] = useState(LESSON_WAITS.length);
  useEffect(() => {
    if (reduced || !on) return;
    const within = beat % LESSON_WAITS.length;
    const wait = beat === LESSON_WAITS.length ? 600 : within === 0 ? LESSON_GAP : LESSON_WAITS[within];
    const id = window.setTimeout(() => setBeat((b) => b + 1), wait);
    return () => window.clearTimeout(id);
  }, [beat, on, reduced]);
  // Finished frames when still: the first two lessons, kept.
  const total = reduced ? LESSON_WAITS.length * 2 : beat;
  const lessons = Math.ceil(total / LESSON_WAITS.length);
  const first = Math.max(0, lessons - 3);
  const rows: ReactNode[] = [];
  for (let n = first; n < lessons; n += 1) {
    const l = LESSONS[n % LESSONS.length];
    const done = total - n * LESSON_WAITS.length;
    rows.push(
      <div key={`s${n}`} className={reduced ? undefined : "film-in"}>
        <div className="film-inner" style={{ paddingTop: n === first ? 0 : 26 }}>
          <MyBubble text={emo(keepEmoji(l.said))} />
        </div>
      </div>
    );
    if (done >= 2)
      rows.push(
        <div key={`r${n}`} className={reduced ? undefined : "film-in"}>
          <div className="film-inner" style={{ paddingTop: 14 }}>
            <Turn>
              <KrovviBubbles lines={[emo(keepEmoji(l.reply))]} />
            </Turn>
          </div>
        </div>
      );
    if (done >= 3)
      rows.push(
        <div key={`k${n}`} className={reduced ? undefined : "film-in"}>
          <div className="film-inner" style={{ paddingTop: 8 }}>
            <KeptCard text={l.kept} saved={done >= 4} />
          </div>
        </div>
      );
  }
  return (
    <div ref={ref}>
      <Scaled w={372} h={516} label={`It learns how you like things: ${LESSONS.map((l) => `you said ${l.said}; Krovvi kept: ${l.kept}`).join(". ")}.`}>
        <div className="dk" style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", paddingBottom: 4, overflow: "hidden", ...fade(22, 0) }}>
          {rows}
        </div>
      </Scaled>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Your life, organized: the apps keeping themselves                    */
/* ------------------------------------------------------------------ */

/** The top of an app's page (deep/page.tsx AppPage): its name large and light, its tabs with the chosen one underlined in the app's colour. */
function MiniApp({ title, tabs = [], tint, children }: { title: string; tabs?: string[]; tint: string; children: ReactNode }) {
  return (
    <div style={{ width: 330, height: 410, borderRadius: 30, background: C.bg, boxShadow: `inset 0 0 0 ${HAIR}px rgba(255,255,255,0.12), 0 40px 70px -24px rgba(0,0,0,0.9)`, overflow: "hidden" }}>
      <div style={{ padding: "22px 18px 8px", fontSize: 38, lineHeight: "44px", fontWeight: 300, letterSpacing: "-1.4px", color: C.fg }}>{title}</div>
      {tabs.length ? (
        <div>
          <div style={{ display: "flex", gap: 20, padding: "0 18px" }}>
            {tabs.map((name, i) => (
              <div key={name} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 15, lineHeight: "20px", fontWeight: 600, letterSpacing: "-0.25px", color: i === 0 ? C.fg : C.faint }}>{name}</span>
                <span style={{ height: 2.5, borderRadius: 1.25, background: i === 0 ? tint : "transparent" }} />
              </div>
            ))}
          </div>
          <div style={{ height: HAIR, background: C.line }} />
        </div>
      ) : null}
      <div style={{ padding: "6px 12px 0", ...fade(0, 10), height: 410 - 74 - (tabs.length ? 31 : 0) }}>{children}</div>
    </div>
  );
}

/** A row that has just arrived: it grows into its place and glows a moment in its app's colour. */
function Arrived({ tint, children, live }: { tint: string; children: ReactNode; live: boolean }) {
  return (
    <div className={live ? "bl-in bl-up" : undefined}>
      <div className={live ? "bl-inner bl-lit" : undefined} style={{ ["--bl-tint" as string]: `${tint}26` } as CSSProperties}>
        {children}
      </div>
    </div>
  );
}

function MoneyApp({ step }: { step: number }) {
  const lume = step >= 1;
  return (
    <MiniApp title="Money" tabs={["Overview", "Spends", "Bills"]} tint={MONEY_TINT}>
      <div style={{ ...PANE, padding: "14px 14px 16px" }}>
        <div style={{ color: C.soft, fontSize: 13, fontWeight: 500 }}>October</div>
        <div style={{ fontSize: 46, lineHeight: "52px", fontWeight: 300, letterSpacing: "-2px", color: C.fg, fontVariantNumeric: "tabular-nums" }}>$1,104</div>
        <div style={{ color: C.soft, fontSize: 14, lineHeight: "20px" }}>$1,394 left after bills</div>
        <div style={{ marginTop: 10 }}>
          <DotBar share={1104 / 2600} held={101.98 / 2600} tint={MONEY_TINT} width={278} />
        </div>
      </div>
      <GroupHead title="To confirm" value={lume ? "3" : "2"} />
      <div style={PANE}>
        {lume ? (
          <Arrived tint={MONEY_TINT} live={step === 1}>
            <Row first lead={<IconTile mark="receipt" tint={CATEGORY_TINT.eating} />} title="Lume" sub="$42.80 · Today · from a receipt" trail={<Answers yes="Confirm" tint={MONEY_TINT} />} />
          </Arrived>
        ) : null}
        <Row first={!lume} lead={<IconTile mark="heart" tint={CATEGORY_TINT.health} />} title="Pharmacy" sub="$12.75 · Sat 3 Oct · from a receipt" trail={<Answers yes="Confirm" tint={MONEY_TINT} />} />
      </div>
    </MiniApp>
  );
}

function TodoApp({ step }: { step: number }) {
  const deck = step >= 1;
  const called = step >= 2;
  return (
    <MiniApp title="To-do" tabs={["Today", "Upcoming", "Lists"]} tint="#E6DCC8">
      <GroupHead title="Today" value={deck ? "4" : "3"} />
      <div style={PANE}>
        {deck ? (
          <Arrived tint="#E6DCC8" live={step === 1}>
            <TaskItem first text="Send the deck to Sam" sub="Work" time="3:00 PM" />
          </Arrived>
        ) : null}
        <TaskItem first={!deck} text="Tell Lina about Saturday" />
        <TaskItem text="Book the table" sub="Basil House" />
        <div style={{ transition: `opacity 500ms ${EASE}`, opacity: called ? 0.55 : 1 }}>
          <TaskItem text="Call the dentist" time="Thu 1 Oct" done={called} />
        </div>
      </div>
    </MiniApp>
  );
}

const PLANS_TINT = "#86B9E0";

function PlansApp({ step }: { step: number }) {
  const moved = step >= 1;
  return (
    <MiniApp title="Plans" tint={PLANS_TINT}>
      <GroupHead title="Saturday" value="18 Oct" />
      <div style={PANE}>
        <Row first title="Run by the river" sub="8 km" value="9:00 AM" />
        {moved ? (
          <Arrived tint={PLANS_TINT} live={step === 1}>
            <Row first={false} title="Dinner with Omar" sub="Basil House · Moved from Friday" value="8:30 PM" />
          </Arrived>
        ) : null}
      </div>
      <GroupHead title="Sunday" value="19 Oct" />
      <div style={PANE}>
        <Row first title="Call Lina" sub="She's free after lunch" value="2:00 PM" />
      </div>
    </MiniApp>
  );
}

const APPS_ORDER = [
  { key: "money", said: "Lunch at Lume was $42.80", App: MoneyApp, steps: [700, 3800] },
  { key: "todo", said: "Remind me to send Sam the deck", App: TodoApp, steps: [700, 1500, 2300] },
  { key: "plans", said: "Omar moved dinner to Saturday", App: PlansApp, steps: [700, 3800] },
] as const;

/** One app's own beat: nothing new, then each step in turn while it is in front. */
function useAppBeat(front: boolean, steps: readonly number[]) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!front) {
      const id = window.setTimeout(() => setStep(0), 6000);
      return () => window.clearTimeout(id);
    }
    if (step >= steps.length) return;
    const id = window.setTimeout(() => setStep((s) => s + 1), steps[step]);
    return () => window.clearTimeout(id);
  }, [front, step, steps]);
  return step;
}

function Card({ slot, compact, children }: { slot: number; compact: boolean; children: ReactNode }) {
  // The app in front, then the two behind it to its side, each a step smaller and dimmer, as a stack of cards.
  const dx = compact ? 16 : 92;
  const t = `translate3d(${slot * dx}px, ${slot * 12}px, 0) scale(${1 - slot * 0.075})`;
  return (
    <div
      aria-hidden={slot !== 0}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        transformOrigin: "0% 50%",
        transform: t,
        // Solid cards, the ones behind in shade: what is behind never shows through the front.
        filter: `brightness(${slot === 0 ? 1 : slot === 1 ? 0.5 : 0.3})`,
        zIndex: 10 - slot,
        transition: `transform 900ms ${EASE}, filter 900ms ${EASE}`,
      }}
    >
      {children}
    </div>
  );
}

function AppStack({ compact }: { compact: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const on = useOnScreen(ref, "0px 0px -10% 0px");
  const [front, setFront] = useState(0);
  useEffect(() => {
    if (reduced || !on) return;
    const id = window.setTimeout(() => setFront((f) => (f + 1) % APPS_ORDER.length), 5200);
    return () => window.clearTimeout(id);
  }, [front, on, reduced]);
  const money = useAppBeat(on && front === 0, APPS_ORDER[0].steps);
  const todo = useAppBeat(on && front === 1, APPS_ORDER[1].steps);
  const plans = useAppBeat(on && front === 2, APPS_ORDER[2].steps);
  const steps = reduced ? [1, 2, 1] : [money, todo, plans];
  const said = APPS_ORDER[front].said;
  const w = compact ? 362 : 560;
  return (
    <div ref={ref}>
      <Scaled w={w} h={506} label="Krovvi's apps keeping themselves as you talk: Lunch at Lume was $42.80, and it waits in Money to confirm. Remind me to send Sam the deck, and it is in To-do for today. Omar moved dinner to Saturday, and Plans moves it.">
        <div className="dk" style={{ position: "absolute", inset: 0 }}>
          {/* What you said, the moment it lands in the app. */}
          <div style={{ position: "absolute", left: 0, top: 0, width: 330, display: "flex", flexDirection: "column" }}>
            <MyBubble key={said} text={said} rise={!reduced} />
          </div>
          <div style={{ position: "absolute", left: 0, top: 84 }}>
            {APPS_ORDER.map((app, i) => {
              const slot = (i - front + APPS_ORDER.length) % APPS_ORDER.length;
              const App = app.App;
              return (
                <Card key={app.key} slot={slot} compact={compact}>
                  <App step={steps[i]} />
                </Card>
              );
            })}
          </div>
        </div>
      </Scaled>
    </div>
  );
}

export function OrganizedVisual() {
  return (
    <>
      <div className="hidden md:block">
        <AppStack compact={false} />
      </div>
      <div className="md:hidden">
        <AppStack compact />
      </div>
    </>
  );
}

