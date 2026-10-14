"use client";

import type { ReactNode } from "react";

import {
  BrickRows,
  BrickScreen,
  Choices,
  DeepChat,
  KrovviBubbles,
  KrovviText,
  MoveHeader,
  MyBubble,
  ShareSheet,
  ShareTurn,
  StatusBar,
  Turn,
  Working,
  emo,
} from "@/components/deep";
import { Mark } from "@/components/mark";
import { PhoneSky } from "@/components/sky/phone-sky";

import { type Beat, Thread, useBeats } from "./chat-film";
import { keepEmoji } from "./tiles";

/**
 * A day with Krovvi, one phone screen per moment, for "How it works": it
 * checks in after the interview, you play at night, it helps the next
 * morning, it plans Friday's dinner knowing who is coming, and a friend
 * picks the shared chat up from a link. Each film plays once from its first
 * beat when its step comes on screen and holds its last frame; with motion
 * reduced it stands finished.
 */

/** Krovvi's glass bubbles, as one row of the thread. */
function Says({ lines, stagger = 420 }: { lines: string[]; stagger?: number }) {
  return (
    <Turn>
      <KrovviBubbles lines={lines.map((l) => emo(keepEmoji(l)))} rise stagger={stagger} />
    </Turn>
  );
}

/** A chat screen on the phone's still sky, at the hour of its moment. */
function Screen({ time, seed, children, over }: { time?: string; seed?: number; children: ReactNode; over?: ReactNode }) {
  return (
    <div className="absolute inset-0">
      <DeepChat sky={<PhoneSky seed={seed} />} veil time={time} over={over} columnStyle={{ gap: 0, paddingTop: 6 }}>
        {children}
      </DeepChat>
    </div>
  );
}

/** Plays once while on screen, holds its last frame; `still` shows it finished. */
function usePlayed(beats: Beat[], playing: boolean, still: boolean) {
  const { n } = useBeats(beats, { playing: playing && !still, loop: false });
  return still ? beats.length : n;
}

export type FilmProps = { playing: boolean; still?: boolean };

/* ------------------------------------------------------------------ */
/* 1. It checks in                                                      */
/* ------------------------------------------------------------------ */

const CHECK_IN: Beat[] = [
  {
    id: "m",
    wait: 500,
    gap: 0,
    show: () => (
      <Turn>
        <MoveHeader text="Your interview at Northline" kind="thread" />
        <KrovviBubbles lines={["Hey! Today was the Northline interview, right?", emo("How did it go? 🙂")]} rise stagger={520} />
      </Turn>
    ),
  },
  {
    id: "c",
    wait: 1300,
    gap: 20,
    until: "sent",
    show: (has) => (
      <Turn>
        <Choices options={["It went great 🎉", "It was okay", "Not great, honestly"]} picked={has("p") ? 0 : null} style={{ marginTop: 0 }} />
      </Turn>
    ),
  },
  { id: "p", wait: 1700 },
  { id: "sent", wait: 380, gap: 16, show: () => <MyBubble text="It went great 🎉" rise /> },
  { id: "w", wait: 450, gap: 16, until: "r", show: () => <Working /> },
  { id: "r", wait: 1300, gap: 0, show: () => <Says lines={["Yes!! I knew you'd nail it 🎉", "Tell me everything. What did they ask you?"]} /> },
];

export const CHECK_IN_LABEL =
  "6:30 PM. Krovvi writes first, about your interview at Northline: Hey! Today was the Northline interview, right? How did it go? Three answers to tap: It went great, It was okay, Not great, honestly. You tap It went great, and Krovvi says: Yes!! I knew you'd nail it. Tell me everything. What did they ask you?";

export function CheckInFilm({ playing, still = false }: FilmProps) {
  const at = usePlayed(CHECK_IN, playing, still);
  return (
    <Screen time="6:30" seed={41}>
      <Thread beats={CHECK_IN} at={at} />
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* 4. It plans                                                          */
/* ------------------------------------------------------------------ */

const ASK_DINNER = "Find a place for dinner on Friday. Four of us, near Omar.";
const ANSWER_DINNER = "Three places near Omar: Nono, Basil House and Lume. Basil House is all vegetarian, so Mona will love it.";

const PLAN: Beat[] = [
  { id: "q", wait: 450, gap: 0, show: () => <MyBubble text={ASK_DINNER} rise /> },
  { id: "w", wait: 450, gap: 16, until: "a", show: () => <Working /> },
  {
    id: "a",
    wait: 1700,
    gap: 0,
    show: () => (
      <Turn>
        <KrovviText text={ANSWER_DINNER} bloom style={{ marginBottom: -16 }} />
      </Turn>
    ),
  },
  {
    id: "l",
    wait: 500,
    gap: 16,
    show: () => (
      <Turn>
        <BrickScreen title="Friday dinner" label="near Omar" rise style={{ margin: 0 }}>
          <BrickRows
            rise
            rows={[
              { title: "Basil House", detail: "All vegetarian. 6 min from Omar.", pick: true },
              { title: "Nono", detail: "The one you saved. Loud after 9." },
              { title: "Lume", detail: "Small and quiet. Books up fast." },
            ]}
          />
        </BrickScreen>
      </Turn>
    ),
  },
  { id: "sheet", wait: 2200 },
];

export const PLAN_LABEL = `You ask: "${ASK_DINNER}" Krovvi: "${ANSWER_DINNER}" A small screen lists the three, with Basil House as Krovvi's pick. Then you share the chat: the share sheet shows the chat, ready to send as a link.`;

export function PlanFilm({ playing, still = false }: FilmProps) {
  const at = usePlayed(PLAN, playing, still);
  const sheet = at >= PLAN.length;
  return (
    <Screen
      time="4:12"
      seed={53}
      over={
        sheet ? (
          <ShareSheet title="Friday dinner" rise={!still} cardSky={<PhoneSky seed={23} light={0.7} />}>
            <ShareTurn date={{ day: "Today", time: "4:12 PM" }} asked={ASK_DINNER} answer={ANSWER_DINNER} />
          </ShareSheet>
        ) : null
      }
    >
      <Thread beats={PLAN} at={at} />
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* 5. Friends join in                                                   */
/* ------------------------------------------------------------------ */

/** The film's clock: each beat only moves time on; what shows is read from how far it got. */
const FRIEND: Beat[] = [
  { id: "page", wait: 400 },
  { id: "cont", wait: 2300 },
  { id: "theirs", wait: 750 },
  { id: "ask", wait: 900 },
  { id: "w", wait: 700 },
  { id: "answer", wait: 1300 },
];
const step = (id: string) => FRIEND.findIndex((b) => b.id === id) + 1;

const SHARED_TURN = (
  <>
    <MyBubble text={ASK_DINNER} />
    <Turn>
      <KrovviText text={ANSWER_DINNER} style={{ marginBottom: -16 }} />
    </Turn>
  </>
);

export const FRIEND_LABEL =
  "Omar opens the link in Safari: krovvi.com shows the chat, Friday dinner, shared today, and one button, Continue in Krovvi. He taps it, and the same chat goes on in his own Krovvi: he writes Basil House works for me. 8:30? and Krovvi answers: Done. Basil House, Friday at 8:30, in your Plans.";

export function FriendFilm({ playing, still = false }: FilmProps) {
  const at = usePlayed(FRIEND, playing, still);
  const n = still ? step("cont") - 1 : at;
  const page = n >= step("page");
  const pressed = n >= step("cont");
  const theirs = n >= step("theirs");
  const ask = n >= step("ask");
  const working = n >= step("w");
  const answer = n >= step("answer");
  return (
    <div className="absolute inset-0 overflow-hidden">
      <PhoneSky seed={19} light={0.8} />

      {/* krovvi.com in Safari: the chat and one button (src/components/share/share-page.tsx, this site's own page). */}
      <div
        className="absolute inset-0 z-10 bg-[#0A0A0A] transition-[opacity,transform] duration-500"
        style={{ opacity: page && !theirs ? 1 : 0, transform: page ? "none" : "translateY(24px)", transitionTimingFunction: "var(--ease)" }}
      >
        <div className="absolute inset-x-0 top-[58px] px-[16px]">
          <div className="flex h-[44px] items-center">
            <Mark size={22} />
          </div>
          <div className="mt-[6px] text-[24px] font-semibold tracking-[-0.5px] text-[#EDEDEB]">Friday dinner</div>
          <div className="mt-[2px] text-[13px] text-[#8F8F8A]">Shared today</div>
          <div className="mt-[18px] flex flex-col gap-[10px]">{SHARED_TURN}</div>
        </div>
        <div className="absolute inset-x-[16px] bottom-[98px]">
          <div
            className="flex h-[52px] items-center justify-center rounded-full bg-[#EDEDEB] text-[17px] font-semibold text-[#0A0A0A]"
            style={{ animation: pressed ? "k-press 420ms var(--ease)" : undefined }}
          >
            Continue in Krovvi
          </div>
        </div>
        {/* Safari's bar, floating at the foot. */}
        <div
          className="absolute inset-x-[14px] bottom-[30px] flex h-[48px] items-center justify-center rounded-full text-[15px] text-[#D9D8D3]"
          style={{ background: "rgba(40,40,44,0.92)", boxShadow: "inset 0 0 0 0.5px rgba(255,255,255,0.10), inset 0 1px 0 rgba(255,255,255,0.04)" }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" className="mr-[6px]" aria-hidden="true">
            <rect x="5" y="10.5" width="14" height="10" rx="2.2" fill="#8F8F8A" />
            <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" fill="none" stroke="#8F8F8A" strokeWidth="2" />
          </svg>
          krovvi.com
        </div>
      </div>

      {/* Their own Krovvi: the same chat, and they carry it on. */}
      <div className="absolute inset-0 z-20 transition-opacity duration-500" style={{ opacity: theirs ? 1 : 0 }}>
        <DeepChat sky={<PhoneSky seed={19} />} veil statusBar={false} columnStyle={{ gap: 0, paddingTop: 6 }}>
          <div className="flex flex-col gap-[16px]">
            {SHARED_TURN}
            {ask ? <MyBubble text="Basil House works for me. 8:30?" rise /> : null}
            {working && !answer ? <Working /> : null}
            {answer ? <Says lines={["Done. Basil House, Friday at 8:30, in your Plans 🙌"]} /> : null}
          </div>
        </DeepChat>
      </div>
      {/* The phone's own clock stays put while the pages change under it. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30">
        <StatusBar time="7:48" />
      </div>
    </div>
  );
}
