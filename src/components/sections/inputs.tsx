import { InView } from "@/components/in-view";
import { an } from "@/lib/anim";

/** Everything Krovvi can learn from, in the words a person would use. */
const SOURCES = [
  "Conversations in person",
  "Zoom, Meet and Teams calls",
  "Voice notes",
  "Photos and screenshots",
  "PDFs and documents",
  "Links and videos",
  "WhatsApp chats",
  "Gmail and your calendar",
  "Your contacts",
  "What ChatGPT and Claude know about you",
];

const CYCLE = SOURCES.length * 1.3; // seconds for the light to pass down the whole list

export function Inputs() {
  return (
    <section className="relative px-5 pt-[140px] md:pt-[200px]">
      <InView className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
        <div>
          <h2
            className="anim text-balance text-[clamp(38px,5.6vw,68px)] font-semibold leading-[1.02] tracking-[-0.045em]"
            style={an("k-rise-lg", 0, 1000)}
          >
            Tell it things. Send it things.
          </h2>
          <p className="anim mt-6 max-w-[440px] text-pretty text-[clamp(17px,2vw,20px)] leading-[1.6] text-muted" style={an("k-rise", 150, 900)}>
            However it reaches Krovvi, it lands in one place, linked to the people and plans it&apos;s about.
          </p>
        </div>
        <ul className="flex flex-col gap-[6px]">
          {SOURCES.map((s, i) => (
            <li key={s} className="anim" style={an("k-rise", 250 + i * 90, 800)}>
              <span
                className="anim-loop text-[clamp(24px,3vw,40px)] font-semibold leading-[1.22] tracking-[-0.03em]"
                style={
                  {
                    "--a": "k-hl",
                    "--dur": `${CYCLE}s`,
                    "--delay": `${1.4 + i * 1.3}s`,
                    animationTimingFunction: "linear",
                    color: "var(--soft)",
                  } as React.CSSProperties
                }
              >
                {s}
              </span>
            </li>
          ))}
        </ul>
      </InView>
    </section>
  );
}
