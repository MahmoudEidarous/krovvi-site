import { an } from "@/lib/anim";
import { KGlyph, NavCircle, Play, StatusBar } from "./ui";

/**
 * The hero's film: one vague, personal question, and an answer that could
 * only come from something that has been there all week. Work, family, a
 * client, the kids, each with the place Krovvi heard it.
 */
const ITEMS: Array<{ text: string; source: string }> = [
  { text: "The Atlas launch moved to October 15, so Sara needs your new deck by Friday.", source: "Atlas sync · Tuesday" },
  { text: "Karim asked twice for the signed quote. You told him Monday.", source: "Call with Karim · 3:12" },
  { text: "Dinner at your mom's on Sunday at 7. You said you'd bring dessert.", source: "Voice note · Saturday" },
  { text: "Lina is picking up the kids on Wednesday, so you're free after 4.", source: "Call with Lina · Monday" },
];

const START = 2100; // the first word, after the question and a beat of thought
const WORD = 38; // ms between words, a calm reading pace

export function WeekScreen({ still = false }: { still?: boolean }) {
  const A = still ? "" : "anim";
  const seq = (steps: string) => (still ? undefined : { animation: steps });
  let t = START + 260;
  const timed = ITEMS.map((item) => {
    const words = item.text.split(" ");
    const begin = t;
    t += words.length * WORD + 160;
    const pill = t;
    t += 260;
    return { ...item, words, begin, pill };
  });
  const offer = t + 200;
  return (
    <div className="relative h-full w-full bg-ground">
      <StatusBar />
      <div className="absolute inset-x-[16px] top-[58px] flex items-center justify-between">
        <NavCircle icon="back" />
        <span className="flex items-center gap-[8px] text-[17px] font-semibold text-ink">
          <KGlyph size={16} /> Krovvi
        </span>
        <NavCircle icon="more" />
      </div>

      <div className="absolute inset-x-[16px] top-[124px] flex flex-col">
        <div
          className={`${A} self-end rounded-[20px] bg-card-hi px-[15px] py-[10px] text-[16px] text-ink`}
          style={an("k-pop", 500, 500)}
        >
          What&apos;s going on with me this week?
        </div>

        <div className="relative mt-[16px]">
          <span
            className="seq transient absolute left-0 top-0 flex items-center gap-[8px] text-[14px] text-muted"
            style={seq("k-fade 250ms linear 1100ms both, k-gone 200ms linear 2050ms forwards")}
          >
            <KGlyph size={14} color="#8F8F8A" /> Looking at your week
          </span>
          <div className="text-[16px] font-semibold text-ink">
            <span className={A} style={an("k-fade", START, 300)}>Here&apos;s your week.</span>
          </div>
          <div className="mt-[10px] flex flex-col gap-[12px]">
            {timed.map((item, i) => (
              <div key={i} className="flex gap-[10px]">
                <span className={`${A} mt-[8px] h-[5px] w-[5px] shrink-0 rounded-full bg-soft`} style={an("k-fade", item.begin, 200)} />
                <div>
                  <div className="text-[15.5px] leading-[1.42] text-ink">
                    {item.words.map((w, j) => (
                      <span key={j} className={A} style={an("k-fade", item.begin + j * WORD, 260)}>
                        {w}{" "}
                      </span>
                    ))}
                  </div>
                  <span
                    className={`${A} mt-[6px] inline-flex items-center gap-[6px] rounded-full bg-card px-[10px] py-[4px] text-[12px] text-soft`}
                    style={an("k-pop", item.pill, 400)}
                  >
                    <Play size={6} className="text-ink" /> {item.source}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className={`${A} mt-[16px] text-[15.5px] leading-[1.42] text-ink`} style={an("k-rise", offer, 500)}>
            Want me to draft the quote email to Karim?
          </div>
          <div className={`${A} mt-[10px] flex gap-[8px]`} style={an("k-rise", offer + 250, 500)}>
            <span className="rounded-full bg-ink px-[16px] py-[7px] text-[14px] font-semibold text-ground">Draft it</span>
            <span className="rounded-full bg-card-hi px-[14px] py-[7px] text-[14px] font-medium text-ink">Not now</span>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-[12px] bottom-[30px] flex h-[54px] items-center gap-[10px] rounded-[27px] bg-card px-[8px]">
        <span className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-card-hi">
          <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="#EDEDEB" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M9 1.5v15M1.5 9h15" /></svg>
        </span>
        <span className="flex-1 text-[16px] text-faint">Ask, or give it a job</span>
        <span className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-ink">
          <svg width="14" height="16" viewBox="0 0 14 16" fill="none" stroke="#0A0A0A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 14V2M2 7l5-5 5 5" /></svg>
        </span>
      </div>
    </div>
  );
}
