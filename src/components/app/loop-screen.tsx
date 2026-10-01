import { an } from "@/lib/anim";
import { AnswerText, ChatNav, ComposerField, DiscFace, DraftCard, MemoryChip, MicGlyph, UserBubble } from "./chat";

/**
 * The same email to Karim, asked for three times as the weeks go by. On day
 * one everything has to be said, and Krovvi keeps what it learns. By month
 * three, three words do it. The draft never changes.
 */
export const LOOP_STAGES: Array<{ when: string; ask: string; saved: string[] }> = [
  {
    when: "Day 1",
    ask: "Write to Karim. He's the contractor doing our kitchen, we agreed on 42,000. Ask when he can start. Keep it short, I don't like long emails.",
    saved: ["Saved: Karim is building your kitchen", "From now on: short emails"],
  },
  {
    when: "Week 3",
    ask: "Write to Karim and ask when he can start.",
    saved: [],
  },
  {
    when: "Month 3",
    ask: "Karim, start date?",
    saved: [],
  },
];

export function LoopScreen({ stage }: { stage: number }) {
  const s = LOOP_STAGES[stage];
  return (
    <div className="relative h-full w-full bg-ground">
      <ChatNav />
      <div className="absolute inset-x-[20px] top-[123px]">
        <div key={`ask-${stage}`}>
          <UserBubble className="anim" style={an("k-pop", 0, 420)}>
            {s.ask}
          </UserBubble>
        </div>
        <div className="mt-[16px]">
          <AnswerText>Here&apos;s a draft for Karim.</AnswerText>
          {s.saved.length > 0 && (
            <div key={`saved-${stage}`}>
              <MemoryChip lines={s.saved} className="anim mt-[16px]" style={an("k-pop", 450, 450)} />
            </div>
          )}
        </div>
      </div>
      <div className="absolute inset-x-[20px] bottom-[110px]">
        <DraftCard
          to="Karim Nabil"
          subject="Starting the kitchen"
          body="Hi Karim, we're all set on our side. When can you start on the kitchen? Thanks, Sam"
        />
      </div>
      <ComposerField
        disc={
          <DiscFace>
            <MicGlyph />
          </DiscFace>
        }
      >
        <span className="absolute left-[8px] top-[10px] whitespace-nowrap text-faint">Ask, or give it a job</span>
      </ComposerField>
    </div>
  );
}
