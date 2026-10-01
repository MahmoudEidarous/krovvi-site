"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

import { LoopScreen, LOOP_STAGES } from "@/components/app/loop-screen";
import { InView } from "@/components/in-view";
import { Phone } from "@/components/phone";
import { an } from "@/lib/anim";

/** How long each stage stays before the next; the last one stays longer. */
const HOLD = [3800, 3400, 5600];

const words = (text: string) => text.trim().split(/\s+/).length;
const MOST = Math.max(...LOOP_STAGES.map((s) => words(s.ask)));

/**
 * The loop, shown by what it saves you: the same email to Karim on day one,
 * in week three and in month three, and how much you had to say to get it.
 */
export function Loop() {
  const reduced = useReducedMotion();
  const [stage, setStage] = useState(0);
  const [seen, setSeen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { rootMargin: "0px 0px -20% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduced || !seen) return;
    const id = setTimeout(() => setStage((s) => (s + 1) % LOOP_STAGES.length), HOLD[stage]);
    return () => clearTimeout(id);
  }, [reduced, seen, stage]);

  const shown = reduced ? LOOP_STAGES.length - 1 : stage;

  return (
    <section className="relative px-5 pt-[140px] md:pt-[200px]">
      <InView className="mx-auto grid max-w-[1160px] items-center gap-14 md:grid-cols-[minmax(0,400px)_minmax(0,1fr)] md:gap-16 lg:gap-28">
        <div ref={ref} className="relative order-2 md:order-1">
          <div className="glow-warm left-1/2 top-1/2 h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2" />
          <div className="relative mx-auto w-[min(300px,78vw)] md:w-[min(310px,calc(34vh_+_20px))]">
            <Phone label={`Asking Krovvi to write to Karim, ${LOOP_STAGES[shown].when.toLowerCase()}: "${LOOP_STAGES[shown].ask}" The draft is the same each time.`}>
              <LoopScreen stage={shown} />
            </Phone>
          </div>
        </div>

        <div className="order-1 md:order-2">
          <h2
            className="anim text-balance text-[clamp(38px,5.6vw,68px)] font-semibold leading-[1.02] tracking-[-0.045em]"
            style={an("k-rise-lg", 0, 1000)}
          >
            The more you use it, the less you explain.
          </h2>
          <p className="anim mt-6 max-w-[460px] text-pretty text-[clamp(17px,2vw,20px)] leading-[1.6] text-muted" style={an("k-rise", 150, 900)}>
            It learns who matters to you, what you agreed and how you like things. When you correct it, your correction
            wins.
          </p>

          {/* What you had to say for the same email, as it shrinks over time. */}
          <div className="anim mt-12 flex flex-col gap-5" style={an("k-rise", 300, 900)} role="tablist" aria-label="Over time">
            {LOOP_STAGES.map((s, i) => {
              const n = words(s.ask);
              const on = i === shown;
              return (
                <button
                  key={s.when}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setStage(i)}
                  className="group grid cursor-pointer grid-cols-[84px_minmax(0,1fr)] items-center gap-4 text-left"
                >
                  <span className={`text-[15px] font-medium transition-colors duration-500 ${on ? "text-ink" : "text-faint group-hover:text-muted"}`}>
                    {s.when}
                  </span>
                  <span className="flex items-center gap-4">
                    <span
                      className="block h-[12px] rounded-full transition-[background-color] duration-500"
                      style={{ width: `${Math.max(6, (n / MOST) * 100) * 0.78}%`, background: on ? "var(--fg)" : "var(--surface-hi)" }}
                    />
                    <span
                      className={`whitespace-nowrap text-[clamp(20px,2vw,26px)] font-semibold tracking-[-0.02em] tabular transition-colors duration-500 ${on ? "text-ink" : "text-faint"}`}
                    >
                      {n} words
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <p className="anim mt-8 text-[15px] text-faint" style={an("k-fade", 600, 900)}>
            Same email to Karim every time.
          </p>
        </div>
      </InView>
    </section>
  );
}
