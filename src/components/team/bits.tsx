"use client";

/**
 * The board's pieces, in the app's own night look (components/deep/tokens.ts,
 * read from the shipped app): the near black ground, panes with a hairline
 * edge, big numbers set light the way the app sets an answer's figures,
 * people as their dotted letter in their own ink, and ivory only for what is
 * chosen. No boxes inside boxes: a pane holds one thing, rows inside it are
 * split by hairlines that start at the words.
 */

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { DeepFace } from "@/components/deep/face";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import type { Person } from "@/lib/team";
import { nameOf } from "./words";

export const T = {
  ground: "#030303",
  pane: "#0E0E10",
  raised: "#18181A",
  edge: "rgba(255,255,255,0.07)",
  rule: "rgba(255,255,255,0.06)",
  fg: "#EDEDEB",
  fg2: "#D9D8D3",
  soft: "#A9A8A2",
  muted: "#8F8F8A",
  faint: "#7A7A74",
  up: "#8CC59A",
  down: "#E5876B",
  danger: "#C4574F",
} as const;

/** One thing on the page: a calm pane with a hairline edge. */
export function Pane({ children, className = "", style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <section className={`rounded-[20px] border border-white/[0.07] bg-[#0E0E10] ${className}`} style={style}>
      {children}
    </section>
  );
}

/** A pane's title line: the title, a quiet line under it, and something small at the right. */
export function Head({ title, sub, right, className = "" }: { title: ReactNode; sub?: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold leading-[20px] tracking-[-0.2px] text-[#EDEDEB]">{title}</h2>
        {sub ? <p className="mt-1 text-[13px] leading-[18px] text-[#8F8F8A]">{sub}</p> : null}
      </div>
      {right ? <div className="shrink-0 pt-0.5">{right}</div> : null}
    </div>
  );
}

/** A number that rolls to its new value and glows once when it goes up. */
export function Ticker({ value, format = (v) => Math.round(v).toLocaleString("en-US") }: { value: number; format?: (v: number) => string }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(value);
  const [bump, setBump] = useState(false);
  const from = useRef(value);
  const bumpTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(bumpTimer.current), []);
  useEffect(() => {
    const a = from.current;
    const b = value;
    if (a === b) return;
    if (b > a) {
      setBump(true);
      clearTimeout(bumpTimer.current);
      bumpTimer.current = setTimeout(() => setBump(false), 1400);
    }
    if (reduced) {
      from.current = b;
      setShown(b);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / 750);
      setShown(a + (b - a) * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(step);
      else from.current = b;
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      from.current = b;
    };
  }, [value, reduced]);
  return <span className={bump ? "team-bump" : undefined}>{format(shown)}</span>;
}

/**
 * The page's opening line, big and light: "3 people used Krovvi today".
 * The number and its noun in ivory, the rest a step back.
 */
export function Statement({ figure, noun, rest, under }: { figure: ReactNode; noun: string; rest: string; under?: ReactNode }) {
  return (
    <div>
      <h1 className="text-[34px] font-light leading-[40px] tracking-[-1.2px] text-[#EDEDEB] sm:text-[44px] sm:leading-[50px] sm:tracking-[-1.6px]">
        <span className="tabular-nums">{figure}</span> {noun} <span className="text-[#8F8F8A]">{rest}</span>
      </h1>
      {under ? <div className="mt-3 text-[14px] leading-[20px] text-[#A9A8A2]">{under}</div> : null}
    </div>
  );
}

export interface Metric {
  label: string;
  value: number;
  format?: (v: number) => string;
  /** A short line under the figure. */
  note?: ReactNode;
  onClick?: () => void;
}

/**
 * Several figures in one pane, side by side with hairlines between them
 * (two by two on a phone): the way a big product shows its key numbers,
 * not a box for each.
 */
export function Metrics({ items }: { items: Metric[] }) {
  const cols = items.length >= 4 ? "md:grid-cols-4" : items.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2";
  return (
    <Pane className="overflow-hidden">
      <div className={`grid grid-cols-2 ${cols}`}>
        {items.map((m, i) => {
          const Tag = m.onClick ? "button" : "div";
          const edges = [i % 2 === 1 ? "border-l" : "", i >= 2 ? "border-t md:border-t-0" : "", i % 4 !== 0 ? "md:border-l" : "md:border-l-0"].join(" ");
          return (
            <Tag
              key={m.label}
              onClick={m.onClick}
              className={`min-w-0 border-white/[0.06] px-5 py-[18px] text-left ${edges} ${m.onClick ? "transition-colors duration-150 hover:bg-white/[0.02]" : ""}`}
            >
              <div className="text-[13px] font-medium leading-[18px] text-[#8F8F8A]">{m.label}</div>
              <div className="mt-2 text-[34px] font-light leading-[38px] tracking-[-1.2px] tabular-nums text-[#EDEDEB]">
                <Ticker value={m.value} format={m.format} />
              </div>
              {m.note ? <div className="mt-1.5 truncate text-[12.5px] leading-[17px] text-[#7A7A74]">{m.note}</div> : null}
            </Tag>
          );
        })}
      </div>
    </Pane>
  );
}

/** "4 more than this time yesterday": a change in words, with the app's up and down inks on the number only. */
export function Change({ now, then, when }: { now: number; then: number; when: string }) {
  const diff = now - then;
  if (!now && !then) return <span>none {when} either</span>;
  if (diff === 0) return <span>same as {when}</span>;
  return (
    <span>
      <span style={{ color: diff > 0 ? T.up : T.down }}>
        {Math.abs(diff).toLocaleString("en-US")} {diff > 0 ? "more" : "fewer"}
      </span>{" "}
      than {when}
    </span>
  );
}

/** A person: their first letter in Krovvi's dots, in their own ink, as the app draws them. */
export function Face({ person, id, size = 32, live = false }: { person: Pick<Person, "id" | "name" | "tag"> | undefined; id?: string; size?: number; live?: boolean }) {
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <DeepFace name={nameOf(person, id)} size={size} ground={T.raised} />
      {live ? <span className="team-live absolute -bottom-[1px] -right-[1px] h-[10px] w-[10px] rounded-full border-2 border-[#0E0E10] bg-[#EDEDEB]" /> : null}
    </span>
  );
}

export function Tag({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "new" | "bad" }) {
  const styles: Record<string, string> = {
    plain: "text-[#8F8F8A] bg-white/[0.06]",
    new: "text-[#030303] bg-[#EDEDEB]",
    bad: "text-[#E5876B] bg-[#E5876B]/[0.12]",
  };
  return <span className={`inline-flex items-center rounded-full px-[7px] py-[1px] text-[11px] font-medium leading-[16px] ${styles[tone]}`}>{children}</span>;
}

/** One choice of a few, on a quiet track; the chosen one in ivory, as the app chooses. */
export function Segmented<V extends string>({ value, options, onChange, label, size = "md" }: { value: V; options: Array<{ id: V; label: string }>; onChange: (v: V) => void; label: string; size?: "sm" | "md" }) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex max-w-full overflow-x-auto rounded-full border border-white/[0.07] bg-[#0E0E10] p-[3px] [scrollbar-width:none]">
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.id)}
            className={`shrink-0 whitespace-nowrap rounded-full font-medium transition-colors duration-150 ${size === "sm" ? "px-3 py-[5px] text-[12.5px]" : "px-3.5 py-1.5 text-[13px]"} ${on ? "bg-[#EDEDEB] text-[#030303]" : "text-[#A9A8A2] hover:text-[#EDEDEB]"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Quiet({ children }: { children: ReactNode }) {
  return <p className="py-8 text-center text-[13.5px] text-[#7A7A74]">{children}</p>;
}

/** A key for a chart, small and quiet, beside its title. */
export function Key({ items }: { items: Array<{ color: string; label: string; line?: "solid" | "dotted" }> }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[12px] text-[#8F8F8A]">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          {i.line ? (
            <span className="w-3.5" style={{ borderTop: `${i.line === "dotted" ? "1.5px dotted" : "2px solid"} ${i.color}` }} />
          ) : (
            <span className="h-[7px] w-[7px] rounded-full" style={{ background: i.color }} />
          )}
          {i.label}
        </span>
      ))}
    </div>
  );
}

/** Ticks every few seconds so "3 min ago" stays true. */
export function useNow(everyMs = 15_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(t);
  }, [everyMs]);
  return now;
}
