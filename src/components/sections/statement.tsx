"use client";

import { useRef } from "react";
import { useMotionValueEvent, useScroll } from "motion/react";

import { useReducedMotion } from "@/lib/use-reduced-motion";

/**
 * The idea in one paragraph, lit word by word as it scrolls past. The four
 * ways in carry a small moving tile inside the sentence. One CSS variable
 * moves per frame; every word reads it and works out its own light.
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

/**
 * The pictures inside the sentence: small tiles in the app's graphite, lit
 * from above like a key, each with one live detail. A voice moving, a
 * message being typed, a page going up, the share arrow lifting. Each tile
 * grows into place as the light reaches it.
 */
function Mark({ mark }: { mark: "talk" | "chat" | "upload" | "share" }) {
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
      {mark === "chat" && (
        <svg viewBox="0 0 24 24" className="h-[0.56em] w-[0.56em]">
          {/* The app's own bubble: round corners, the bottom right one tucked. */}
          <path d="M7.5 4.5h9a5 5 0 0 1 5 5v6.7a1.8 1.8 0 0 1-1.8 1.8H7.5a5 5 0 0 1-5-5V9.5a5 5 0 0 1 5-5Z" fill="#F2F1EE" />
          <path d="M7 9.6h10" stroke="#1d1c1b" strokeWidth="1.9" strokeLinecap="round" />
          <path
            className="mark-loop"
            d="M7 13.3h6.5"
            stroke="#1d1c1b"
            strokeWidth="1.9"
            strokeLinecap="round"
            style={{ transformBox: "fill-box", transformOrigin: "left center", animation: "k-type 2.6s var(--ease) infinite" }}
          />
        </svg>
      )}
      {mark === "upload" && (
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
