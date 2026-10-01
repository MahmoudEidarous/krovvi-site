import { InView } from "@/components/in-view";
import { an } from "@/lib/anim";

/** The loop, in plain words: what happens each time, and why it gets better. */
const STAGES = [
  "You talk, write or send something.",
  "Krovvi updates what it knows.",
  "It helps at the right moment.",
  "You say yes, or change it.",
  "It sees what happened.",
  "Next time, it does better.",
];

const STEP = 1.8; // seconds each line holds the light
const CYCLE = STAGES.length * STEP;

export function Loop() {
  return (
    <section className="relative px-5 pt-[140px] md:pt-[200px]">
      <InView className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
        <div>
          <h2
            className="anim text-balance text-[clamp(38px,5.6vw,68px)] font-semibold leading-[1.02] tracking-[-0.045em]"
            style={an("k-rise-lg", 0, 1000)}
          >
            The more you use it, the less you explain.
          </h2>
          <p className="anim mt-6 max-w-[440px] text-pretty text-[clamp(17px,2vw,20px)] leading-[1.6] text-muted" style={an("k-rise", 150, 900)}>
            Krovvi learns how you talk, who matters to you, and which help you actually use. When you correct it, your
            correction wins.
          </p>
        </div>
        <ol className="flex flex-col">
          {STAGES.map((s, i) => (
            <li
              key={s}
              className="anim flex items-baseline gap-6 py-[14px] first:pt-0"
              style={an("k-rise", 250 + i * 110, 800)}
            >
              <span className="w-8 shrink-0 text-[15px] text-faint tabular">0{i + 1}</span>
              <span
                className="anim-loop text-[clamp(22px,2.6vw,34px)] font-semibold leading-[1.2] tracking-[-0.025em]"
                style={
                  {
                    "--a": "k-hl",
                    "--dur": `${CYCLE}s`,
                    "--delay": `${1.2 + i * STEP}s`,
                    animationTimingFunction: "linear",
                    color: "var(--soft)",
                  } as React.CSSProperties
                }
              >
                {s}
              </span>
            </li>
          ))}
        </ol>
      </InView>
    </section>
  );
}
