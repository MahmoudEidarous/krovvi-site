import { InView } from "@/components/in-view";
import { an } from "@/lib/anim";

/** The loop, in plain words: what happens each time, and why it gets better. */
const STAGES = [
  "You talk, write or send",
  "Krovvi updates what it knows",
  "It helps at the right moment",
  "You say yes, or change it",
  "It sees what happened",
  "Next time, it does better",
];

const CYCLE = 12; // seconds for the travelling dot to go round once
const RING_DOTS = 84;

export function Loop() {
  return (
    <section className="relative px-5 pt-[140px] md:pt-[200px]">
      <div className="mx-auto max-w-[1120px]">
        <InView className="grid gap-6 md:grid-cols-2 md:gap-16">
          <h2 className="anim text-balance text-[clamp(36px,5.6vw,64px)] font-semibold leading-[1.04] tracking-[-0.04em]" style={an("k-rise-lg", 0, 1000)}>
            The more you use it, the less you explain.
          </h2>
          <p className="anim max-w-[500px] self-end text-pretty text-[clamp(17px,2.2vw,20px)] leading-[1.6] text-muted" style={an("k-rise", 150, 900)}>
            Krovvi learns from what you keep, change and skip. It learns how you write to each person and which help you
            actually use. When you correct it, your correction wins, and it stays fixed.
          </p>
        </InView>

        <ol className="mt-10 flex flex-col gap-3 md:hidden">
          {STAGES.map((s, i) => (
            <li key={s} className="flex items-center gap-3 text-[16px] text-soft">
              <span className="w-5 text-[13px] text-faint tabular">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>

        <InView className="relative mx-auto mt-10 aspect-square w-[min(820px,100%)] md:mt-6" style={{ containerType: "inline-size" }}>
          <div className="glow left-1/2 top-1/2 h-[80cqw] w-[80cqw] -translate-x-1/2 -translate-y-1/2" />
          <svg className="absolute inset-[14%] h-[72%] w-[72%]" viewBox="0 0 400 400" aria-hidden="true">
            {Array.from({ length: RING_DOTS }, (_, i) => {
              const a = (i / RING_DOTS) * Math.PI * 2;
              return <circle key={i} cx={200 + Math.sin(a) * 170} cy={200 - Math.cos(a) * 170} r={1.7} fill="#3a3a37" />;
            })}
            {STAGES.map((_, k) => {
              const a = (k / STAGES.length) * Math.PI * 2;
              return (
                <circle
                  key={k}
                  cx={200 + Math.sin(a) * 170}
                  cy={200 - Math.cos(a) * 170}
                  r={4.5}
                  fill="#EDEDEB"
                  className="anim-loop"
                  style={
                    {
                      transformBox: "fill-box",
                      transformOrigin: "center",
                      "--a": "k-node",
                      "--dur": `${CYCLE}s`,
                      "--delay": `${(k * CYCLE) / STAGES.length - CYCLE * 0.06}s`,
                      animationTimingFunction: "linear",
                    } as React.CSSProperties
                  }
                />
              );
            })}
            {/* The travelling dot, and a soft light around it. */}
            <g
              className="anim-loop"
              style={
                {
                  transformOrigin: "200px 200px",
                  "--a": "k-orbit",
                  "--dur": `${CYCLE}s`,
                  "--delay": "0s",
                  animationTimingFunction: "linear",
                } as React.CSSProperties
              }
            >
              <circle cx="200" cy="30" r="18" fill="url(#k-trail)" />
              <circle cx="200" cy="30" r="6" fill="#EDEDEB" />
            </g>
            <defs>
              <radialGradient id="k-trail">
                <stop offset="0%" stopColor="#EDEDEB" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#EDEDEB" stopOpacity="0" />
              </radialGradient>
            </defs>
          </svg>
          {/* Labels around the ring, lighting as the dot passes. */}
          <div className="absolute inset-0 hidden md:block">
            {STAGES.map((s, k) => {
              const a = (k / STAGES.length) * Math.PI * 2;
              const x = 50 + Math.sin(a) * 36.5 * 1.12;
              const y = 50 - Math.cos(a) * 36.5 * 1.12;
              const side = Math.sin(a) > 0.2 ? "left" : Math.sin(a) < -0.2 ? "right" : "center";
              const shift = side === "left" ? "0%" : side === "right" ? "-100%" : "-50%";
              return (
                <span
                  key={s}
                  className="anim-loop absolute w-max max-w-[24cqw] text-[clamp(13px,2.1cqw,17px)] font-medium leading-[1.3]"
                  style={
                    {
                      left: `${x}%`,
                      top: `${y}%`,
                      transform: `translate(${shift}, -50%)`,
                      textAlign: side === "left" ? "left" : side === "right" ? "right" : "center",
                      color: "var(--faint)",
                      "--a": "k-label",
                      "--dur": `${CYCLE}s`,
                      "--delay": `${(k * CYCLE) / STAGES.length - CYCLE * 0.06}s`,
                      animationTimingFunction: "linear",
                    } as React.CSSProperties
                  }
                >
                  {s}
                </span>
              );
            })}
          </div>
          <div className="absolute left-1/2 top-1/2 w-[34cqw] -translate-x-1/2 -translate-y-1/2 text-center text-[clamp(15px,2.6cqw,22px)] font-medium leading-[1.35] tracking-[-0.01em] text-soft">
            Each time round, a little less to explain.
          </div>
        </InView>
      </div>
    </section>
  );
}
