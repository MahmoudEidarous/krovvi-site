"use client";

import { useRef, type ReactNode } from "react";

import { AppTile, C, KrovviBubbles, MyBubble, Turn, Working, emo, type AppId } from "@/components/deep";
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

const BORED: Beat[] = [
  { id: "q", wait: 300, gap: 0, show: () => <MyBubble text="I'm bored" rise /> },
  { id: "w", wait: 400, gap: 16, until: "a", show: () => <Working /> },
  { id: "a", wait: 1000, gap: 0, show: () => <Says lines={["Let's fix that 😄", "Quick round of This or That. Tap one, or swipe toward it."]} /> },
];

const READ: Beat[] = [
  { id: "p", wait: 2600, gap: 0, show: () => <MyBubble text="Coffee, Early bird, Mountains, Call, Wing it, Cook, Podcasts, Sunrise..." rise /> },
  { id: "w", wait: 400, gap: 16, until: "a", show: () => <Working /> },
  { id: "a", wait: 1100, gap: 0, show: () => <Says lines={["Ha, I knew you were a night owl 🦉", "Didn't see the mountains coming though.", "I'll remember you'd rather text than call."]} stagger={520} /> },
];

export function FunVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const a = usePlayOnce(BORED, ref);
  const b = usePlayOnce(READ, ref);
  return (
    <div ref={ref} className="grid gap-4 md:grid-cols-2">
      <SkyPanel h={340} seed={41} label="You write: I'm bored. Krovvi: Let's fix that. Quick round of This or That. Tap one, or swipe toward it.">
        <PanelThread beats={BORED} at={a} />
      </SkyPanel>
      <SkyPanel h={340} seed={53} label="After the round, Krovvi: Ha, I knew you were a night owl. Didn't see the mountains coming though. I'll remember you'd rather text than call.">
        <PanelThread beats={READ} at={b} />
      </SkyPanel>
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
