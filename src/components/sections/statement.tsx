"use client";

import { useRef } from "react";
import { useMotionValueEvent, useScroll } from "motion/react";

import { InView } from "@/components/in-view";
import { useReducedMotion } from "@/lib/use-reduced-motion";

/**
 * The idea in one paragraph, lit word by word as it scrolls past: a friend is
 * someone you talk to all day, not a tool you open for a task. The four ways
 * in carry a small moving tile inside the sentence. One CSS variable moves
 * per frame; every word reads it and works out its own light.
 */
type MarkName = "talk" | "send" | "play" | "share";
type Piece = string | { mark: MarkName };

const PIECES: Piece[] = [
  ..."You don't open a friend's chat for a task. You open it all day. Krovvi is that friend.".split(" "),
  "Talk", "to", "it", { mark: "talk" }, ".",
  "Send", "it", "anything", { mark: "send" }, ".",
  "Play", "with", "it", { mark: "play" }, ".",
  "Bring", "friends", "in", { mark: "share" }, ".",
  ..."It remembers what you said, brings it up later, and helps when it matters.".split(" "),
];

/**
 * The pictures inside the sentence: small tiles in the app's graphite, lit
 * from above like a key, each with one live detail. A voice moving, a page
 * going up, the app's Play die being shaken (components/games/shelf.tsx
 * PlayMark: a die showing one, leaned 8 degrees), the share arrow lifting.
 * Each tile grows into place as the light reaches it.
 */
function Mark({ mark }: { mark: MarkName }) {
  const line = { fill: "none", stroke: "#F2F1EE", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  return (
    <span
      aria-hidden="true"
      className="relative top-[-0.07em] ml-[0.04em] mr-[0.05em] inline-flex h-[0.94em] w-[0.94em] items-center justify-center rounded-[0.27em] align-middle"
      style={{
        background:
          "radial-gradient(120% 90% at 50% 0%, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0) 58%), linear-gradient(180deg, #31302e 0%, #1a1918 100%)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.16), inset 0 0 0 1px rgba(255,255,255,0.06), 0 0.04em 0.08em rgba(0,0,0,0.45), 0 0.2em 0.42em -0.12em rgba(0,0,0,0.6)",
        transform: "scale(calc(0.78 + 0.22 * clamp(0, calc(var(--p) * (var(--n) + 4) - var(--i)), 1)))",
        transition: "transform 180ms var(--ease)",
      }}
    >
      {mark === "talk" && (
        <span className="flex h-[0.46em] items-center gap-[0.05em]">
          {[0.45, 0.85, 1, 0.62, 0.9, 0.5].map((h, i) => (
            <span
              key={i}
              className="bar block w-[0.06em] rounded-full bg-[#F2F1EE]"
              style={{ height: "100%", transform: `scaleY(${h})`, "--d": `${i * -160}ms`, "--t": `${0.9 + (i % 3) * 0.2}s`, "--amp": h } as React.CSSProperties}
            />
          ))}
        </span>
      )}
      {mark === "play" && (
        <svg viewBox="0 0 24 24" className="h-[0.6em] w-[0.6em]" style={{ overflow: "visible" }}>
          <g className="mark-loop" style={{ transformBox: "fill-box", transformOrigin: "center", animation: "k-roll 2.4s var(--ease) infinite" }}>
            <rect x="4.6" y="4.6" width="14.8" height="14.8" rx="4.2" {...line} transform="rotate(-8 12 12)" />
            <circle cx="12" cy="12" r="1.9" fill="#F2F1EE" />
          </g>
        </svg>
      )}
      {mark === "send" && (
        <svg viewBox="0 0 24 24" className="h-[0.56em] w-[0.56em]">
          <path d="M7 3h7l4.5 4.5V19a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" {...line} />
          <path d="M14 3v4.5h4.5" {...line} />
          <g className="mark-loop" style={{ animation: "k-lift 2.2s var(--ease) infinite" }}>
            <path d="M11.75 17V11M9.3 13.3l2.45-2.45 2.45 2.45" {...line} />
          </g>
        </svg>
      )}
      {mark === "share" && (
        <svg viewBox="0 0 24 24" className="h-[0.56em] w-[0.56em]">
          <path d="M8.5 9.5H7a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7.5a2 2 0 0 0-2-2h-1.5" {...line} />
          <g className="mark-loop" style={{ animation: "k-nudge 1.9s ease-in-out infinite" }}>
            <path d="M12 14.5V3.4M8.7 6.7 12 3.4l3.3 3.3" {...line} />
          </g>
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
      <InView hold={false}>
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
      </InView>
    </section>
  );
}
