"use client";

import { useLayoutEffect, useRef, type CSSProperties } from "react";

import { an } from "@/lib/anim";
import {
  ActionIcons,
  AnswerText,
  ArrowUpGlyph,
  Bullet,
  ChatNav,
  ComposerField,
  DictationBar,
  DiscFace,
  MicGlyph,
  Receipt,
  SourcesLine,
  StopSquare,
  UserBubble,
  WorkingStrip,
} from "./chat";

/**
 * The hero's film: one ongoing conversation with Krovvi, five corners of a
 * life. The week, a price agreed in a meeting, the kids' schedule from a
 * WhatsApp chat, a friend's recommendation, and the minute before a meeting.
 * Each answer could only come from something that was there, and each line
 * carries where it was said. Typed or spoken, as people do.
 */
type Part = string | { r: string; at?: string; kind?: "rec" | "doc" | "chat" };
type Block = { bullet?: boolean; parts: Part[] };
export type HeroTurn = { ask: string; voice?: boolean; status: string; blocks: Block[]; sources: number };

export const HERO_TURNS: HeroTurn[] = [
  {
    ask: "What's going on with me this week?",
    status: "Looking over your week…",
    blocks: [
      { parts: ["Four things stand out."] },
      { bullet: true, parts: ["Sara needs your new deck by Friday. The launch moved to the 15th", { r: "Atlas sync", at: "7:40" }] },
      { bullet: true, parts: ["Karim asked twice for the signed quote. You told him Monday", { r: "Meeting with Karim", at: "3:12" }] },
      { bullet: true, parts: ["Dinner at your mom's on Sunday at 7. You're bringing dessert", { r: "Voice note", at: "0:41" }] },
      { bullet: true, parts: ["Lina has the kids on Wednesday, so you're free after 4", { r: "Chat with Lina", kind: "chat" }] },
    ],
    sources: 4,
  },
  {
    ask: "What did Karim say about the price?",
    voice: true,
    status: "Searching your notes…",
    blocks: [
      { parts: ["He said 42,000, not the 46,000 in the quote", { r: "Meeting with Karim", at: "12:08" }, ". Half up front, and half when the kitchen is done."] },
      { parts: ["You said you'd send him the signed quote on Monday", { r: "Meeting with Karim", at: "3:12" }] },
    ],
    sources: 2,
  },
  {
    ask: "When do I have the kids this month?",
    status: "Reading what you know about them…",
    blocks: [
      { parts: ["Every Wednesday after school, and the weekend of the 18th", { r: "Chat with Lina", kind: "chat" }] },
      { parts: ["Lina asked to swap the 25th for the 11th. You haven't answered her yet."] },
    ],
    sources: 2,
  },
  {
    ask: "What was the restaurant Omar told me about?",
    status: "Searching your notes…",
    blocks: [
      { parts: ["Sora, the Japanese place on 9th Street", { r: "Lunch with Omar", at: "22:40" }, ". He said to book the counter seats and ask for the chef's menu."] },
    ],
    sources: 1,
  },
  {
    ask: "Anything I should know before I see Sara?",
    voice: true,
    status: "Reading what you know about them…",
    blocks: [
      { parts: ["Three things."] },
      { bullet: true, parts: ["You still owe her the new deck with the updated numbers", { r: "Atlas sync", at: "3:12" }] },
      { bullet: true, parts: ["She owes you the final copy by Sunday", { r: "Atlas sync", at: "9:40" }] },
      { bullet: true, parts: ["She's moving to Dubai in November", { r: "Coffee with Sara", at: "14:02" }] },
    ],
    sources: 3,
  },
];

const TYPE_MS = 38; // per letter of a typed question
const WORD_MS = 42; // per word of the answer, a calm stream
const PILL_MS = 110; // a moment cited gets a beat of its own
const GAP = 16; // between rows of the thread, as the app spaces them

/** When each thing happens in a turn, in ms from the moment it starts. */
export function heroTimeline(turn: HeroTurn, first: boolean) {
  const start = first ? 900 : 700;
  const dictStart = start + 160;
  const typeEnd = start + turn.ask.length * TYPE_MS;
  const sendAt = turn.voice ? dictStart + 2300 : typeEnd + 380;
  const workAt = sendAt + 600;
  const answerAt = sendAt + 2000;
  let span = 0;
  for (const block of turn.blocks) {
    for (const part of block.parts) span += typeof part === "string" ? part.split(" ").length * WORD_MS : PILL_MS;
    span += 140;
  }
  const answerEnd = answerAt + span;
  return { start, dictStart, typeEnd, sendAt, workAt, answerAt, answerEnd, total: answerEnd + 4600 };
}

const seq = (animation: string): CSSProperties => ({ animation });

/** One question and its answer. Still (no motion) when it is the turn before, about to scroll up. */
function Turn({ turn, t, still = false }: { turn: HeroTurn; t: ReturnType<typeof heroTimeline>; still?: boolean }) {
  const ease = "var(--ease)";
  const A = still ? "" : "anim";
  const at0 = (name: string, delay: number, dur?: number) => (still ? undefined : an(name, delay, dur));

  // The answer, word by word, with each cited moment popping in after its words.
  let at = t.answerAt;
  const blocks = turn.blocks.map((block, b) => {
    const begin = at;
    const pieces = block.parts.map((part, p) => {
      if (typeof part !== "string") {
        const when = at;
        at += PILL_MS;
        return <Receipt key={p} title={part.r} at={part.at} kind={part.kind} className={A} style={at0("k-pop", when, 360)} />;
      }
      const words = part.split(" ");
      // A part that starts with punctuation sits right after the pill before it.
      const glued = /^[.,;]/.test(part);
      return (
        <span key={p}>
          {words.map((w, i) => {
            const when = at;
            at += WORD_MS;
            return (
              <span key={i} className={A} style={at0("k-fade", when, 220)}>
                {i === 0 && !glued && p > 0 ? " " : ""}
                {w}
                {i < words.length - 1 ? " " : ""}
              </span>
            );
          })}
        </span>
      );
    });
    at += 140;
    const body = <AnswerText>{pieces}</AnswerText>;
    return block.bullet ? (
      <Bullet key={b} className="mb-[8px]" dotClass={A} dotStyle={at0("k-fade", begin, 200)}>
        {body}
      </Bullet>
    ) : (
      <div key={b} className="mb-[12px]">
        {body}
      </div>
    );
  });

  return (
    <div>
      <UserBubble className={A} style={at0("k-pop", t.sendAt + 80, 320)}>
        {turn.ask}
      </UserBubble>
      <div className="relative mt-[20px]">
        {!still && (
          <WorkingStrip
            status={turn.status}
            tick={t.sendAt + 1000}
            className="seq transient absolute inset-x-0 top-0"
            style={seq(`k-rise 320ms ${ease} ${t.workAt}ms both, k-gone-fast 120ms linear ${t.answerAt - 170}ms forwards`)}
          />
        )}
        <div>{blocks}</div>
        <div className={`${A} mt-[8px]`} style={at0("k-fade", t.answerEnd + 150, 400)}>
          <SourcesLine count={turn.sources} />
        </div>
        <div className={`${A} -ml-[8px] mt-[14px]`} style={at0("k-fade", t.answerEnd + 380, 400)}>
          <ActionIcons />
        </div>
      </div>
    </div>
  );
}

export function HeroChat({ turn, prev, first }: {
  turn: HeroTurn;
  /** The turn before, finished, which scrolls up when this question is sent. */
  prev?: HeroTurn | null;
  /** The very first play: the chat starts empty and the K arrives with the first message. */
  first: boolean;
}) {
  const t = heroTimeline(turn, first);
  const ease = "var(--ease)";
  // Typing swaps the mic for the arrow at once; a spoken question keeps the mic until it is sent.
  const micOff = turn.voice ? t.sendAt : t.start;

  // The thread scrolls by exactly the turn before plus one row gap, so the new
  // question lands 12 points under the nav, where the app pins it.
  const before = useRef<HTMLDivElement>(null);
  const column = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const h = before.current?.offsetHeight ?? 0;
    column.current?.style.setProperty("--shift", `${h ? h + GAP : 0}px`);
  }, []);

  return (
    <div className="relative h-full w-full bg-ground">
      <ChatNav kClass={first ? "anim" : undefined} kStyle={first ? an("k-fade", t.sendAt, 240) : undefined} />

      {/* The thread, between the nav and the composer; it scrolls inside its own frame. */}
      <div className="absolute inset-x-0 bottom-[110px] top-[111px] overflow-hidden">
        <div
          ref={column}
          className="seq absolute inset-x-[20px] top-[12px]"
          style={prev ? seq(`k-thread-up 620ms ${ease} ${t.sendAt}ms forwards`) : undefined}
        >
          {prev && (
            <div ref={before}>
              <Turn turn={prev} t={heroTimeline(prev, false)} still />
            </div>
          )}
          <div style={prev ? { marginTop: GAP } : undefined}>
            <Turn turn={turn} t={t} />
          </div>
        </div>
      </div>

      {/* The composer: typed letters, or the dictation bar, then the stop square while it answers. */}
      <ComposerField
        rowStyle={turn.voice ? seq(`k-off ${t.sendAt - t.dictStart}ms linear ${t.dictStart}ms`) : undefined}
        discStyle={turn.voice ? seq(`k-press 260ms ${ease} ${t.start}ms both`) : seq(`k-press 260ms ${ease} ${t.typeEnd + 180}ms both`)}
        overlay={
          turn.voice ? (
            <DictationBar
              tick={t.dictStart + 1000}
              className="seq transient opacity-0"
              style={seq(`k-on ${t.sendAt - t.dictStart}ms linear ${t.dictStart}ms`)}
            />
          ) : undefined
        }
        disc={
          <>
            <DiscFace className="seq" style={seq(`k-off ${t.answerEnd - micOff}ms linear ${micOff}ms`)}>
              <MicGlyph />
            </DiscFace>
            {!turn.voice && (
              <DiscFace className="seq opacity-0" style={seq(`k-on ${t.sendAt - t.start}ms linear ${t.start}ms`)}>
                <ArrowUpGlyph />
              </DiscFace>
            )}
            <DiscFace className="seq opacity-0" style={seq(`k-on ${t.answerEnd - t.sendAt}ms linear ${t.sendAt}ms`)}>
              <StopSquare />
            </DiscFace>
          </>
        }
      >
        {/* The placeholder steps aside while there are words in the field. */}
        <span
          className="seq absolute left-[8px] top-[10px] whitespace-nowrap leading-[20px] text-faint"
          style={turn.voice ? undefined : seq(`k-off ${t.sendAt - t.start}ms linear ${t.start}ms`)}
        >
          Ask, or give it a job
        </span>
        {!turn.voice && (
          <span className="seq transient" style={seq(`k-collapse 1ms linear ${t.sendAt}ms forwards`)}>
            {turn.ask.split("").map((c, i) => (
              <span key={i} className="anim" style={an("k-char", t.start + i * TYPE_MS, 1)}>
                {c}
              </span>
            ))}
            {/* The caret sits inside the line (aligned to its top, as tall as it), so the field never grows. */}
            <span
              className="seq ml-[1px] inline-block h-[20px] w-[2px] rounded-full bg-ink align-top opacity-0"
              style={seq(`k-on ${t.sendAt - t.start}ms steps(1) ${t.start}ms`)}
            />
          </span>
        )}
      </ComposerField>
    </div>
  );
}
