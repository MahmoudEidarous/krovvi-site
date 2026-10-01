import type { CSSProperties } from "react";

import { an } from "@/lib/anim";
import { ActionIcons, AnswerText, Bullet, ChatNav, ComposerField, DiscFace, MicGlyph, Receipt, SourcesLine, UserBubble, WorkingStrip } from "./chat";

/**
 * The same big question on day one and six months in. On day one Krovvi
 * knows nothing of your life, so it answers like any AI and asks back. Six
 * months in, it weighs what the move would touch: the kids, the lease, money
 * owed, what you said you wanted. Each with where it heard it.
 */
type Part = string | { b: string } | { r: string; at?: string; kind?: "rec" | "doc" | "chat" };
type Block = { bullet?: boolean; parts: Part[] };

const ASK = "Should I take the job in Dubai?";

const DAY_ONE: Block[] = [
  { parts: ["It depends on what matters most to you. A few things to weigh:"] },
  { bullet: true, parts: ["The salary against the cost of living"] },
  { bullet: true, parts: ["What it does for your career"] },
  { bullet: true, parts: ["Being far from family and friends"] },
  { bullet: true, parts: ["How easy it would be to come back"] },
  { parts: ["What's making you think about it?"] },
];

const MONTH_SIX: Block[] = [
  { parts: ["Here's what it would touch in your life:"] },
  { bullet: true, parts: [{ b: "The kids." }, " You'd lose your Wednesdays with them", { r: "Chat with Lina", kind: "chat" }] },
  { bullet: true, parts: [{ b: "Your lease." }, " It needs 60 days' notice, so December at the earliest", { r: "Lease 2026.pdf", kind: "doc" }] },
  { bullet: true, parts: [{ b: "Money." }, " You still owe Karim 21,000 for the kitchen", { r: "Kitchen walkthrough", at: "12:08" }] },
  { bullet: true, parts: [{ b: "Work." }, " It's the lead role you told Omar you wanted", { r: "Lunch with Omar", at: "31:05" }] },
  { parts: ["Want a list of what to settle first?"] },
];

const SEND = 450;
const WORK = 800;
const ANSWER = 2100;
const WORD_MS = 34;
const PILL_MS = 90;

const seq = (animation: string): CSSProperties => ({ animation });

export function KnowsScreen({ known }: { known: boolean }) {
  const blocks = known ? MONTH_SIX : DAY_ONE;
  let at = ANSWER;
  const body = blocks.map((block, b) => {
    const begin = at;
    const pieces = block.parts.map((part, p) => {
      if (typeof part !== "string" && "b" in part) {
        const when = at;
        at += WORD_MS;
        return (
          <b key={p} className="anim font-semibold" style={an("k-fade", when, 220)}>
            {part.b}
          </b>
        );
      }
      if (typeof part !== "string") {
        const when = at;
        at += PILL_MS;
        return <Receipt key={p} title={part.r} at={part.at} kind={part.kind} className="anim" style={an("k-pop", when, 360)} />;
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
            status={known ? "Searching your notes…" : "Writing the answer…"}
            tick={SEND + 1000}
            className="seq transient absolute inset-x-0 top-0"
            style={seq(`k-rise 320ms var(--ease) ${WORK}ms both, k-gone-fast 120ms linear ${ANSWER - 170}ms forwards`)}
          />
          <div>{body}</div>
          {known && (
            <div className="anim mt-[8px]" style={an("k-fade", end + 150, 400)}>
              <SourcesLine count={4} docs={1} />
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
