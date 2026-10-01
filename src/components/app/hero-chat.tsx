import type { CSSProperties } from "react";

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
  Wordmark,
  WorkingStrip,
} from "./chat";

/**
 * The hero's film: Krovvi's chat as it is, asked three personal questions.
 * The week (typed), what Karim said about the price (spoken), and what to
 * know before seeing Sara (typed). Each answer could only come from
 * something that was there, and each line carries the moment it was said.
 */
type Part = string | { r: string; at: string };
type Block = { bullet?: boolean; parts: Part[] };
export type HeroScene = { name: string; ask: string; voice?: boolean; status: string; blocks: Block[]; sources: number };

export const HERO_SCENES: HeroScene[] = [
  {
    name: "Your week",
    ask: "What's going on with me this week?",
    status: "Looking over your week…",
    blocks: [
      { parts: ["Four things stand out."] },
      { bullet: true, parts: ["Sara needs your new deck by Friday. The launch moved to the 15th", { r: "Atlas sync", at: "7:40" }] },
      { bullet: true, parts: ["Karim asked twice for the signed quote. You told him Monday", { r: "Call with Karim", at: "3:12" }] },
      { bullet: true, parts: ["Dinner at your mom's on Sunday at 7. You're bringing dessert", { r: "Voice note", at: "0:41" }] },
      { bullet: true, parts: ["Lina has the kids on Wednesday, so you're free after 4", { r: "Call with Lina", at: "2:05" }] },
    ],
    sources: 4,
  },
  {
    name: "Karim's price",
    ask: "What did Karim say about the price?",
    voice: true,
    status: "Searching your notes…",
    blocks: [
      { parts: ["He said 42,000, not the 46,000 in the quote", { r: "Call with Karim", at: "12:08" }, ". Half up front, and half when the kitchen is done."] },
      { parts: ["You said you'd send him the signed quote on Monday", { r: "Call with Karim", at: "3:12" }] },
    ],
    sources: 2,
  },
  {
    name: "Before Sara",
    ask: "Anything I should know before I see Sara?",
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

/** The person's own lines on an empty chat, each with where it comes from (lib/starter-text.ts). */
const STARTERS: Array<[string, string]> = [
  ["What did Sara and I settle on Tuesday?", "Sara · Tuesday · 31 min"],
  ["What's still open with Karim?", "Karim · Monday · 12 min"],
  ["Who am I waiting on, and since when?", "Your week"],
];

const TYPE_MS = 38; // per letter of a typed question
const WORD_MS = 42; // per word of the answer, a calm stream
const PILL_MS = 110; // a moment cited gets a beat of its own

/** When each thing happens in a scene, in ms from the moment it starts. */
export function heroTimeline(scene: HeroScene, first: boolean) {
  const start = first ? 1500 : 500;
  const dictStart = start + 160;
  const typeEnd = start + scene.ask.length * TYPE_MS;
  const sendAt = scene.voice ? dictStart + 2300 : typeEnd + 380;
  const workAt = sendAt + 260;
  const answerAt = sendAt + 1800;
  let span = 0;
  for (const block of scene.blocks) {
    for (const part of block.parts) span += typeof part === "string" ? part.split(" ").length * WORD_MS : PILL_MS;
    span += 140;
  }
  const answerEnd = answerAt + span;
  return { start, dictStart, typeEnd, sendAt, workAt, answerAt, answerEnd, total: answerEnd + 5200 };
}

const seq = (animation: string): CSSProperties => ({ animation });

/** One question and its answer. Still (no motion) when it is the turn before, waiting to scroll away. */
function Turn({ scene, t, still = false }: { scene: HeroScene; t: ReturnType<typeof heroTimeline>; still?: boolean }) {
  const ease = "var(--ease)";
  const A = still ? "" : "anim";
  const at0 = (name: string, delay: number, dur?: number) => (still ? undefined : an(name, delay, dur));

  // The answer, word by word, with each cited moment popping in after its words.
  let at = t.answerAt;
  const blocks = scene.blocks.map((block, b) => {
    const begin = at;
    const pieces = block.parts.map((part, p) => {
      if (typeof part !== "string") {
        const when = at;
        at += PILL_MS;
        return <Receipt key={p} title={part.r} at={part.at} className={A} style={at0("k-pop", when, 360)} />;
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
    <>
      <UserBubble className={A} style={at0("k-pop", t.sendAt + 60, 320)}>
        {scene.ask}
      </UserBubble>
      <div className="relative mt-[20px]">
        {!still && (
          <WorkingStrip
            status={scene.status}
            tick={t.sendAt + 1000}
            className="seq transient absolute inset-x-0 top-0"
            style={seq(`k-rise 320ms ${ease} ${t.workAt}ms both, k-gone-fast 120ms linear ${t.answerAt - 170}ms forwards`)}
          />
        )}
        <div>{blocks}</div>
        <div className={`${A} mt-[8px]`} style={at0("k-fade", t.answerEnd + 150, 400)}>
          <SourcesLine count={scene.sources} />
        </div>
        <div className={`${A} -ml-[8px] mt-[14px]`} style={at0("k-fade", t.answerEnd + 380, 400)}>
          <ActionIcons />
        </div>
      </div>
    </>
  );
}

export function HeroChat({ scene, prev, first }: {
  scene: HeroScene;
  /** The turn before, finished, which scrolls away when this question is sent. */
  prev?: HeroScene | null;
  /** The very first play: the chat starts empty. */
  first: boolean;
}) {
  const t = heroTimeline(scene, first);
  const ease = "var(--ease)";
  // Typing swaps the mic for the arrow at once; a spoken question keeps the mic until it is sent.
  const micOff = scene.voice ? t.sendAt : t.start;

  return (
    <div className="relative h-full w-full bg-ground">
      <ChatNav kClass={first ? "anim" : undefined} kStyle={first ? an("k-fade", t.sendAt, 240) : undefined} />

      {/* An empty chat: the dotted wordmark and the person's own questions. */}
      {first && (
        <div
          className="seq transient absolute inset-x-[20px] top-[111px] flex h-[591px] flex-col items-center justify-center pb-[32px]"
          style={seq(`k-gone 240ms ${ease} ${t.sendAt - 120}ms forwards`)}
        >
          <div className="anim mb-[40px]" style={an("k-fade", 150, 500)}>
            <Wordmark pitch={8} />
          </div>
          <div className="flex flex-col items-center gap-[26px]">
            {STARTERS.map(([line, from], i) => (
              <div key={line} className="anim max-w-[300px] px-[8px] py-[4px] text-center" style={an("k-rise", 380 + i * 110, 500)}>
                <div className="text-[17px] font-medium leading-[22px] tracking-[-0.3px] text-ink">{line}</div>
                <div className="mt-[6px] text-[12px] text-faint">{from}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* The turn before stays while the next question is asked, then scrolls up out of the way. */}
      {prev && (
        <div
          className="seq absolute inset-x-[20px] top-[123px]"
          style={seq(`k-scroll-away 560ms ${ease} ${t.sendAt - 40}ms forwards`)}
        >
          <Turn scene={prev} t={heroTimeline(prev, false)} still />
        </div>
      )}

      {/* The thread: the question just sent sits 12 points under the nav, the answer grows below it. */}
      <div className="absolute inset-x-[20px] top-[123px]">
        <Turn scene={scene} t={t} />
      </div>

      {/* The composer: typed letters, or the dictation bar, then the stop square while it answers. */}
      <ComposerField
        rowStyle={scene.voice ? seq(`k-off ${t.sendAt - t.dictStart}ms linear ${t.dictStart}ms`) : undefined}
        discStyle={scene.voice ? seq(`k-press 260ms ${ease} ${t.start}ms both`) : seq(`k-press 260ms ${ease} ${t.typeEnd + 180}ms both`)}
        overlay={
          scene.voice ? (
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
            {!scene.voice && (
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
          className="seq absolute left-[8px] top-[10px] whitespace-nowrap text-faint"
          style={scene.voice ? undefined : seq(`k-off ${t.sendAt - t.start}ms linear ${t.start}ms`)}
        >
          Ask, or give it a job
        </span>
        {!scene.voice && (
          <span className="seq transient" style={seq(`k-collapse 1ms linear ${t.sendAt}ms forwards`)}>
            {scene.ask.split("").map((c, i) => (
              <span key={i} className="anim" style={an("k-char", t.start + i * TYPE_MS, 1)}>
                {c}
              </span>
            ))}
            <span
              className="seq ml-[1px] inline-block h-[19px] w-[2px] translate-y-[3px] rounded-full bg-ink opacity-0"
              style={seq(`k-on ${t.sendAt - t.start}ms steps(1) ${t.start}ms`)}
            />
          </span>
        )}
      </ComposerField>
    </div>
  );
}
