"use client";

import { useRef } from "react";
import { useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";

const TEXT =
  "Most AI only knows what you type into it. Krovvi knows what's going on. It hears your conversations, reads what you share, and keeps track of the people in your life. What they told you. What you promised. What changed. The longer you use it, the less you explain.";

/**
 * The problem in one paragraph, lit word by word as it scrolls past. One CSS
 * variable moves per frame; every word reads it and works out its own light.
 */
export function Statement() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 55%"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    ref.current?.style.setProperty("--p", reduced ? "1" : v.toFixed(4));
  });
  const words = TEXT.split(" ");
  return (
    <section className="relative px-5 pb-[72px] pt-[120px] md:pb-[110px] md:pt-[200px]">
      <div
        ref={ref}
        className="mx-auto max-w-[1040px]"
        style={{ "--p": reduced ? 1 : 0, "--n": words.length } as React.CSSProperties}
      >
        <p className="text-[clamp(30px,4.6vw,56px)] font-semibold leading-[1.18] tracking-[-0.035em]">
          {words.map((w, i) => (
            <span
              key={i}
              style={
                {
                  "--i": i,
                  opacity: "calc(0.14 + 0.86 * clamp(0, calc(var(--p) * (var(--n) + 4) - var(--i)), 1))",
                  transition: "opacity 120ms linear",
                } as React.CSSProperties
              }
            >
              {w}{" "}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
