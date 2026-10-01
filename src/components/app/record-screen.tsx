"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

import { an } from "@/lib/anim";
import { HomeScreen } from "./home";
import { StatusBar } from "./ui";

/**
 * Talking, recorded: Home, the record button tapped, and the recording stage
 * as the app draws it (catch8 app/index.tsx, components/record-button.tsx,
 * waveform.tsx; docs/app-visual-spec.md 5.6). A thin timer, the line that
 * says it hears you, the live wave, a moment marked with a tap, and the
 * button grown into stop between Discard and Pause.
 */

/** Speech-like bursts, silences included. */
const AMPS = Array.from({ length: 54 }, (_, i) => {
  const v = Math.abs(Math.sin(i * 0.9) * 0.6 + Math.sin(i * 0.23) * 0.35 + Math.sin(i * 2.7) * 0.2);
  return Math.max(0.03, Math.min(1, v));
});

const PRESS = 700; // the record button is tapped
const OPEN = 950; // and the stage covers Home
const MARK = 3300; // a tap anywhere marks a moment

function clock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const seq = (animation: string): CSSProperties => ({ animation });

export function RecordScreen() {
  const [t, setT] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  // The clock starts with the film: when this screen is first seen, as the animations do (components/in-view.tsx).
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let start: ReturnType<typeof setTimeout> | undefined;
    let id: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        start = setTimeout(() => {
          id = setInterval(() => setT((v) => v + 1), 1000);
        }, OPEN);
      },
      { rootMargin: "0px 0px -18% 0px" }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (start) clearTimeout(start);
      if (id) clearInterval(id);
    };
  }, []);
  const marked = clock(Math.floor((MARK - OPEN) / 1000));

  return (
    <div ref={root} className="relative h-full w-full overflow-hidden bg-ground">
      {/* Home, until the record button is tapped. */}
      <div className="seq transient absolute inset-0" style={seq(`k-home-out 240ms var(--ease) ${OPEN}ms forwards`)}>
        <HomeScreen press={PRESS} />
      </div>

      {/* The recording stage. */}
      <div className="anim absolute inset-0 bg-ground" style={an("k-fade", OPEN, 260)}>
        <StatusBar />
        <div className="absolute left-1/2 top-[61px] flex h-[28px] w-[44px] -translate-x-1/2 items-center justify-center">
          <svg width="13" height="8" viewBox="0 0 13 8" fill="none" stroke="#8F8F8A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m1.5 1.5 5 5 5-5" />
          </svg>
        </div>

        <div className="absolute inset-x-0 top-[196px] flex flex-col items-center">
          <div className="text-[64px] font-extralight leading-[70px] tracking-[-3px] text-ink tabular">{clock(t)}</div>
          <div className="relative mt-[6px] h-[22px] w-full text-center text-[14px] leading-[22px]">
            <span className="seq absolute inset-x-0 text-ink" style={seq(`k-off 1700ms linear ${MARK}ms`)}>
              Hearing you
            </span>
            <span className="seq absolute inset-x-0 text-ink opacity-0" style={seq(`k-on 1700ms linear ${MARK}ms`)}>
              Marked {marked}
            </span>
          </div>
          <div className="mt-[4px] text-[12px] text-faint tabular">Saved on this phone as you go</div>
        </div>

        {/* The live wave: newest on the right, brightest. */}
        <div className="absolute left-[24px] right-[24px] top-[386px] flex h-[156px] items-center justify-between">
          {AMPS.map((a, i) => (
            <span
              key={i}
              className="bar block h-full w-[3px] rounded-full bg-ink"
              style={
                {
                  "--amp": a,
                  "--t": `${(0.9 + ((i * 37) % 9) * 0.08).toFixed(2)}s`,
                  "--d": `${(((i * 53) % 11) * -0.11).toFixed(2)}s`,
                  opacity: 0.32 + (0.68 * i) / (AMPS.length - 1),
                  transform: `scaleY(${a})`,
                } as CSSProperties
              }
            />
          ))}
        </div>

        {/* Marks: until the first one, the hint; then a dot for each moment marked. */}
        <div className="absolute inset-x-0 top-[566px] flex h-[20px] justify-center">
          <span className="seq transient absolute text-[13px] text-faint" style={seq(`k-gone 200ms var(--ease) ${MARK}ms forwards`)}>
            Tap anywhere to mark a moment
          </span>
          <span className="anim mt-[7px] h-[6px] w-[6px] rounded-full bg-ink" style={an("k-pop", MARK + 150, 400)} />
        </div>

        {/* The record button grown into stop, inside its ring, with Discard and Pause risen beside it. */}
        <div className="absolute inset-x-0 top-[719px] flex items-center justify-center">
          <span className="anim mr-[12.5px] flex h-[52px] w-[52px] items-center justify-center rounded-full bg-card" style={an("k-rise", OPEN + 120, 420)}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="#8F8F8A" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
              <path d="m3 3 9 9M12 3l-9 9" />
            </svg>
          </span>
          <span className="flex h-[87px] w-[87px] items-center justify-center rounded-full border border-line">
            <span
              className="flex h-[64px] w-[64px] items-center justify-center rounded-full bg-ink"
              style={{ boxShadow: "0 10px 16px rgba(0,0,0,0.5), 0 3px 5px rgba(0,0,0,0.4)" }}
            >
              <span className="h-[18px] w-[18px] rounded-[5px] bg-ground" />
            </span>
          </span>
          <span className="anim ml-[12.5px] flex h-[52px] w-[52px] items-center justify-center rounded-full bg-card" style={an("k-rise", OPEN + 120, 420)}>
            <svg width="15" height="15" viewBox="0 0 15 15" aria-hidden="true">
              <rect x="3" y="2" width="3" height="11" rx="1.2" fill="#EDEDEB" />
              <rect x="9" y="2" width="3" height="11" rx="1.2" fill="#EDEDEB" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}
