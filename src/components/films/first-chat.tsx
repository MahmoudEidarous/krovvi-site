"use client";

import { useEffect, useState } from "react";

import { Composer, DeepChat, KrovviBubbles, MyBubble, Turn, Working, emo } from "@/components/deep";
import { PhoneSky } from "@/components/sky/phone-sky";

import { type Beat, Thread, useBeats } from "./chat-film";
import { DeletedMark, GuestTop, StillBubble } from "./guest-top";

/**
 * Krovvi's first chat with someone new, word for word and on the app's own
 * rhythm (catch8 src/lib/first-meeting/lines.ts and rules.ts at 6edb7fca):
 * Krovvi writes the line every app opens with, thinks better of it and takes
 * it back, twice. Then it says so, says what it is trying to be, admits it
 * has no good first line, and asks the person the question it would like to
 * be asked. The person answers in the box, and Krovvi turns it back on them.
 *
 * Krovvi's next words in a real chat are written fresh each time; the line
 * here is an example of them.
 */

const GREETINGS = ["Hi! I'm Krovvi, your personal AI assist", "Welcome! Here's everything I can do for"];

const SAYS = [
  "Sorry. Those sounded like every other app.",
  "Truth: I'm not trying to be a super intelligence. I'm trying to be a super friend.",
  "And I don't have a good first line. So help me.",
  "When you meet someone new, what's the first thing you ask them?",
];

const ASKED = "What are you excited about lately?";

const BACK = "Good one. Now you answer it 😄";

/** rules.ts OPENING: the screen settles, then each greeting is written, stands, and is taken back. */
const OPENING = { settle: 600, greetingTyping: 650, greetingSaid: 1250, greetingDeleted: 750, sayRest: 470 } as const;

/** rules.ts sayTyping: how long a bubble that stays is being written, longer for more words, capped. */
const typingFor = (say: string) => 340 + Math.min(620, say.length * 10);

/** A person's thumbs: about 26 letters a second, with the first one a beat after the box is touched. */
const LETTER_MS = 38;

/** Krovvi's glass bubble, one line or more, arriving with the app's 180 ms rise. */
function Say({ text }: { text: string }) {
  return (
    <Turn>
      <KrovviBubbles lines={[emo(text)]} rise />
    </Turn>
  );
}

/** One stock greeting in its one place: typing dots, the line cut off where Krovvi gave up on it, then its mark. */
function Greeting({ text, said, gone }: { text: string; said: boolean; gone: boolean }) {
  if (!said) return <Working />;
  return (
    <Turn>
      <StillBubble>{gone ? <DeletedMark fresh /> : <span className="dk-rise block">{text}</span>}</StillBubble>
    </Turn>
  );
}

const BEATS: Beat[] = [
  ...GREETINGS.flatMap((text, i): Beat[] => [
    {
      id: `g${i}`,
      wait: i === 0 ? OPENING.settle : OPENING.greetingDeleted,
      gap: i === 0 ? 0 : 4,
      show: (has) => <Greeting text={text} said={has(`g${i}said`)} gone={has(`g${i}gone`)} />,
    },
    { id: `g${i}said`, wait: OPENING.greetingTyping },
    { id: `g${i}gone`, wait: OPENING.greetingSaid },
  ]),
  ...SAYS.flatMap((text, i): Beat[] => [
    {
      id: `s${i}`,
      wait: i === 0 ? OPENING.greetingDeleted : OPENING.sayRest,
      gap: 4,
      show: (has) => (has(`s${i}in`) ? <Say text={text} /> : <Working />),
    },
    { id: `s${i}in`, wait: typingFor(text) },
  ]),
  // The person's turn: the box takes their words (useTyped below), then they send them.
  { id: "type", wait: 1700 },
  { id: "sent", wait: 600 + ASKED.length * LETTER_MS, gap: 16, show: () => <MyBubble text={ASKED} rise /> },
  { id: "r", wait: 450, gap: 16, show: (has) => (has("r0") ? <Say text={BACK} /> : <Working />) },
  { id: "r0", wait: 1250 },
];

const ALL = BEATS.length;
const TYPE_AT = BEATS.findIndex((b) => b.id === "type");
const SENT_AT = BEATS.findIndex((b) => b.id === "sent");

/** How much of the person's line is in the box: letter by letter once they start, empty again once it is sent. */
function useTyped(active: boolean, playing: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) {
      setCount(0);
      return;
    }
    if (!playing) return;
    const id = window.setInterval(() => setCount((c) => (c >= ASKED.length ? c : c + 1)), LETTER_MS);
    return () => window.clearInterval(id);
  }, [active, playing]);
  return ASKED.slice(0, count);
}

export const FIRST_CHAT_LABEL =
  "Krovvi's first chat with someone new. It starts typing the greeting every app opens with, and deletes it, twice. Then it says: Sorry. Those sounded like every other app. Truth: I'm not trying to be a super intelligence. I'm trying to be a super friend. And I don't have a good first line. So help me. When you meet someone new, what's the first thing you ask them? The person answers: What are you excited about lately? Krovvi: Good one. Now you answer it.";

/**
 * The film. `playing`: on screen, in a tab in front, and not paused. With
 * motion reduced it stands finished: the greetings taken back, every line there.
 */
export function FirstChatFilm({ playing, still = false }: { playing: boolean; still?: boolean }) {
  const { n, fading } = useBeats(BEATS, { playing: playing && !still, loop: true, rest: 5200 });
  const at = still ? ALL : n;
  const typing = at > TYPE_AT && at <= SENT_AT;
  const typed = useTyped(typing, playing && !still);
  return (
    <div className="absolute inset-0">
      <DeepChat
        sky={<PhoneSky />}
        veil
        top={<GuestTop />}
        composer={<Composer placeholder="Say it your way" text={typing ? typed : undefined} caret={typing} />}
        columnStyle={{ gap: 0, paddingTop: 10, transition: "opacity 600ms cubic-bezier(0.23, 1, 0.32, 1)", opacity: fading ? 0 : 1 }}
      >
        <Thread beats={BEATS} at={at} />
      </DeepChat>
    </div>
  );
}
