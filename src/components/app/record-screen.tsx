"use client";

import { useEffect, useState } from "react";

import { an } from "@/lib/anim";
import { StatusBar } from "./ui";

/** Speech-like bursts, silences included: the app's live waveform grammar. */
const AMPS = [
  0.2, 0.5, 0.85, 0.6, 0.3, 0.16, 0.4, 0.9, 1, 0.7, 0.4, 0.2, 0.16, 0.55, 0.8, 0.5,
  0.25, 0.16, 0.35, 0.75, 0.95, 0.65, 0.35, 0.16, 0.5, 0.85, 0.6, 0.3, 0.16, 0.45,
  0.9, 0.75, 0.5, 0.28, 0.16, 0.6, 0.8, 0.45,
];

function clock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Recording in person: the timer runs, the voice moves, nothing else asks for attention. */
export function RecordScreen({ start = 724 }: { start?: number }) {
  const [t, setT] = useState(start);
  useEffect(() => {
    const id = setInterval(() => setT((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="relative h-full w-full bg-ground">
      <StatusBar />
      <div className="absolute inset-x-0 top-[96px] flex flex-col items-center">
        <span className="rounded-full bg-card px-[14px] py-[7px] text-[13px] font-medium text-soft">
          Recording
        </span>
      </div>
      <div className="absolute inset-x-0 top-[208px] flex flex-col items-center">
        <div className="text-[72px] font-light leading-none tracking-[-3px] text-ink tabular">{clock(t)}</div>
        <div className="mt-[14px] text-[17px] text-soft">Hearing you</div>
      </div>
      <div className="absolute inset-x-[28px] top-[372px] flex h-[120px] items-center justify-between">
        {AMPS.map((a, i) => (
          <span
            key={i}
            className="bar block h-full w-[4px] rounded-[2px] bg-ink"
            style={
              {
                "--amp": a,
                "--t": `${(1.1 + ((i * 37) % 9) * 0.09).toFixed(2)}s`,
                "--d": `${(((i * 53) % 11) * -0.13).toFixed(2)}s`,
                opacity: 0.35 + a * 0.65,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
      {/* A moment, marked with one tap while talking. */}
      <div className="absolute inset-x-0 top-[540px] flex justify-center">
        <span
          className="anim flex items-center gap-[8px] rounded-full bg-card-hi px-[14px] py-[8px] text-[14px] text-ink"
          style={an("k-pop", 2200, 600)}
        >
          <span className="h-[7px] w-[7px] rounded-full bg-ink" />
          Moment marked at {clock(start + 2)}
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-[70px] flex flex-col items-center">
        <div className="mb-[22px] text-[14px] text-faint">Tap anywhere to mark a moment</div>
        <span className="flex h-[78px] w-[78px] items-center justify-center rounded-full bg-ink">
          <span className="h-[26px] w-[26px] rounded-[6px] bg-ground" />
        </span>
        <div className="mt-[16px] text-[13px] text-faint">Saved on this phone as you go</div>
      </div>
    </div>
  );
}
