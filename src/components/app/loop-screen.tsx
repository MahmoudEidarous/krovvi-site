import type { CSSProperties } from "react";

import { an } from "@/lib/anim";
import { ActionIcons, AnswerText, Bullet, ChatNav, ComposerField, DiscFace, MicGlyph, Receipt, SourcesLine, UserBubble, WorkingStrip } from "./chat";

/**
 * The same question on day one and six months in. On day one Krovvi knows
 * nothing about her, so it answers like any AI and asks back. Six months in,
 * it remembers what she said and when you'll see her, and says where it
 * heard each thing.
 */
type Part = string | { r: string; at: string };
type Block = { bullet?: boolean; parts: Part[] };

const ASK = "What should I get my mom for her birthday?";

const DAY_ONE: Block[] = [
  { parts: ["Here are a few ideas most moms love:"] },
  { bullet: true, parts: ["Flowers or a plant for her home"] },
  { bullet: true, parts: ["A spa day or a massage"] },
  { bullet: true, parts: ["A framed family photo"] },
  { bullet: true, parts: ["A piece of jewelry"] },
  { parts: ["What does she enjoy doing?"] },
];

const MONTH_SIX: Block[] = [
  { parts: ["She told you twice she wants to start painting", { r: "Lunch with Mom", at: "4:12" }, ". A beginner watercolor set would make her day."] },
  { parts: ["Her birthday is Sunday, and you're at her place for dinner at 7", { r: "Voice note", at: "0:41" }, ". You could bring it then."] },
];

const SEND = 450;
const WORK = 800;
const ANSWER = 2100;
const WORD_MS = 42;
const PILL_MS = 110;

const seq = (animation: string): CSSProperties => ({ animation });

export function KnowsScreen({ known }: { known: boolean }) {
  const blocks = known ? MONTH_SIX : DAY_ONE;
  let at = ANSWER;
  const body = blocks.map((block, b) => {
    const begin = at;
    const pieces = block.parts.map((part, p) => {
      if (typeof part !== "string") {
        const when = at;
        at += PILL_MS;
        return <Receipt key={p} title={part.r} at={part.at} className="anim" style={an("k-pop", when, 360)} />;
      }
      const words = part.split(" ");
      const glued = /^[.,;]/.test(part);
      return (
        <span key={p}>
          {words.map((w, i) => {
            const when = at;
            at += WORD_MS;
            return (
              <span key={i} className="anim" style={an("k-fade", when, 220)}>
                {i === 0 && !glued && p > 0 ? " " : ""}
                {w}
                {i < words.length - 1 ? " " : ""}
              </span>
            );
          })}
        </span>
      );
    });
    at += 120;
    const text = <AnswerText>{pieces}</AnswerText>;
    return block.bullet ? (
      <Bullet key={b} className="mb-[8px]" dotClass="anim" dotStyle={an("k-fade", begin, 200)}>
        {text}
      </Bullet>
    ) : (
      <div key={b} className="mb-[12px]">
        {text}
      </div>
    );
  });
  const end = at;

  return (
    <div className="relative h-full w-full bg-ground">
      <ChatNav />
      <div className="absolute inset-x-[20px] top-[123px]">
        <UserBubble className="anim" style={an("k-pop", SEND, 360)}>
          {ASK}
        </UserBubble>
        <div className="relative mt-[20px]">
          <WorkingStrip
            status={known ? "Reading what you know about them…" : "Writing the answer…"}
            tick={SEND + 1000}
            className="seq transient absolute inset-x-0 top-0"
            style={seq(`k-rise 320ms var(--ease) ${WORK}ms both, k-gone-fast 120ms linear ${ANSWER - 170}ms forwards`)}
          />
          <div>{body}</div>
          {known && (
            <div className="anim mt-[8px]" style={an("k-fade", end + 150, 400)}>
              <SourcesLine count={2} />
            </div>
          )}
          <div className="anim -ml-[8px] mt-[14px]" style={an("k-fade", end + 380, 400)}>
            <ActionIcons />
          </div>
        </div>
      </div>
      <ComposerField
        disc={
          <DiscFace>
            <MicGlyph />
          </DiscFace>
        }
      >
        <span className="absolute left-[8px] top-[10px] whitespace-nowrap leading-[20px] text-faint">Ask, or give it a job</span>
      </ComposerField>
    </div>
  );
}
