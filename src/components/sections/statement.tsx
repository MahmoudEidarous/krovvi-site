"use client";

import { useRef } from "react";
import { useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";

/**
 * The idea in one paragraph, lit word by word as it scrolls past. The four
 * ways in carry a small moving picture inside the sentence: a voice, a
 * message, a page, the share arrow. One CSS variable moves per frame; every
 * word reads it and works out its own light.
 */
type Piece = string | { mark: "talk" | "chat" | "upload" | "share" };

const PIECES: Piece[] = [
  ..."Most AI only knows what you type into it. Krovvi knows what's going on.".split(" "),
  "Talk", "to", "it", { mark: "talk" }, ".",
  "Chat", "with", "it", { mark: "chat" }, ".",
  "Upload", "anything", { mark: "upload" }, ".",
  "Share", "from", "any", "app", { mark: "share" }, ".",
  ..."It works out what it all means and who it's about. And it remembers, so you don't have to.".split(" "),
];

function Mark({ mark }: { mark: "talk" | "chat" | "upload" | "share" }) {
  const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  return (
    <span
      aria-hidden="true"
      className="ml-[0.04em] mr-[0.05em] inline-flex h-[0.8em] min-w-[1.45em] items-center justify-center rounded-[0.28em] bg-card-hi px-[0.26em] align-[-0.1em] text-ink"
    >
      {mark === "talk" && (
        <span className="flex h-[0.42em] items-center gap-[0.07em]">
          {[0.5, 0.9, 0.62, 1, 0.45, 0.78].map((h, i) => (
            <span
              key={i}
              className="bar block w-[0.07em] rounded-full bg-ink"
              style={{ height: `${h * 100}%`, "--d": `${i * -170}ms`, "--t": `${0.95 + (i % 3) * 0.22}s` } as React.CSSProperties}
            />
          ))}
        </span>
      )}
      {mark === "chat" && (
        <svg viewBox="0 0 24 24" className="h-[0.5em] w-[0.5em]" {...stroke}>
          <path d="M4 5.5h16a1.5 1.5 0 0 1 1.5 1.5v8.5a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 3.5V17H4a1.5 1.5 0 0 1-1.5-1.5V7A1.5 1.5 0 0 1 4 5.5Z" />
          <path d="M7 10h10M7 13.2h6" />
        </svg>
      )}
      {mark === "upload" && (
        <svg viewBox="0 0 24 24" className="h-[0.5em] w-[0.5em]" {...stroke}>
          <path d="M6.5 2.5h7.5l4.5 4.5v13a1.5 1.5 0 0 1-1.5 1.5h-10.5a1.5 1.5 0 0 1-1.5-1.5v-16a1.5 1.5 0 0 1 1.5-1.5Z" />
          <path d="M13.5 2.5V7.5h5M8.5 12.5h7M8.5 16h5" />
        </svg>
      )}
      {mark === "share" && (
        <svg viewBox="0 0 24 24" className="h-[0.5em] w-[0.5em]" {...stroke}>
          <path d="M8 9H6.5A1.5 1.5 0 0 0 5 10.5v9A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 17.5 9H16" />
          <path d="M12 14.5V2.5M8.2 6.2 12 2.4l3.8 3.8" />
        </svg>
      )}
    </span>
  );
}

export function Statement() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 55%"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    ref.current?.style.setProperty("--p", reduced ? "1" : v.toFixed(4));
  });
  const lit = (i: number) =>
    ({
      "--i": i,
      opacity: "calc(0.14 + 0.86 * clamp(0, calc(var(--p) * (var(--n) + 4) - var(--i)), 1))",
      transition: "opacity 120ms linear",
    }) as React.CSSProperties;
  return (
    <section className="relative px-5 pb-[72px] pt-[120px] md:pb-[110px] md:pt-[200px]">
      <div
        ref={ref}
        className="mx-auto max-w-[1040px]"
        style={{ "--p": reduced ? 1 : 0, "--n": PIECES.length } as React.CSSProperties}
      >
        <p className="text-[clamp(30px,4.6vw,56px)] font-semibold leading-[1.22] tracking-[-0.035em]">
          {PIECES.map((piece, i) => {
            const next = PIECES[i + 1];
            // A full stop sits right after its word or picture; everything else is followed by a space.
            const space = next === "." ? "" : " ";
            if (typeof piece !== "string") {
              return (
                <span key={i} style={lit(i)}>
                  <Mark mark={piece.mark} />
                  {space}
                </span>
              );
            }
            return (
              <span key={i} style={lit(i)}>
                {piece}
                {space}
              </span>
            );
          })}
        </p>
      </div>
    </section>
  );
}
