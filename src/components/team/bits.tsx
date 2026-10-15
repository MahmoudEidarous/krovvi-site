"use client";

/**
 * The board's small pieces, in the app's own look: flat calm cards on black,
 * ivory type, ivory pills for the choice that is on, and a person's ink on
 * their initials (the voice inks tint people and nothing else).
 */

import { useEffect, useRef, useState, type ReactNode } from "react";

import { useReducedMotion } from "@/lib/use-reduced-motion";
import type { Person } from "@/lib/team";
import { initials, inkOf } from "./words";

export function Card({ title, sub, right, children, className = "", pad = true }: { title?: ReactNode; sub?: ReactNode; right?: ReactNode; children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={`rounded-[22px] bg-[#161615] ${pad ? "p-4 sm:p-5" : ""} ${className}`}>
      {title || right ? (
        <div className={`flex items-start justify-between gap-3 ${pad ? "" : "px-4 pt-4 sm:px-5 sm:pt-5"} mb-3.5`}>
          <div className="min-w-0">
            {title ? <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-[#EDEDEB]">{title}</h2> : null}
            {sub ? <p className="mt-0.5 text-[12.5px] leading-snug text-[#8F8F8A]">{sub}</p> : null}
          </div>
          {right ? <div className="shrink-0">{right}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/** A number that rolls to its new value, and glows once when it goes up. */
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
      const eased = 1 - Math.pow(1 - k, 3);
      setShown(a + (b - a) * eased);
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

export function Stat({ label, value, format, sub, delta, onClick }: { label: string; value: number; format?: (v: number) => string; sub?: ReactNode; delta?: ReactNode; onClick?: () => void }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag onClick={onClick} className={`flex min-w-0 flex-col rounded-[20px] bg-[#161615] p-4 text-left ${onClick ? "transition-colors duration-150 hover:bg-[#1B1B1A] active:bg-[#1F1F1E]" : ""}`}>
      <span className="text-[12.5px] text-[#8F8F8A]">{label}</span>
      <span className="mt-1.5 text-[30px] font-semibold leading-none tracking-[-0.03em] tabular-nums text-[#EDEDEB] sm:text-[34px]">
        <Ticker value={value} format={format} />
      </span>
      {sub || delta ? (
        <span className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] leading-snug text-[#A9A8A2]">
          {delta}
          {sub ? <span className="min-w-0">{sub}</span> : null}
        </span>
      ) : null}
    </Tag>
  );
}

/** Up or down against an earlier stretch, in the app's own up and down inks. */
export function Delta({ now, then, label }: { now: number; then: number; label?: string }) {
  const diff = now - then;
  if (!then && !now) return null;
  const up = diff > 0;
  const same = diff === 0;
  const color = same ? "#8F8F8A" : up ? "#8CC59A" : "#E5876B";
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-[1px] text-[11.5px] font-medium tabular-nums" style={{ color, background: same ? "#1F1F1E" : `${color}1A` }} title={label}>
      {same ? "same" : `${up ? "▲" : "▼"} ${Math.abs(diff).toLocaleString("en-US")}`}
    </span>
  );
}

export function Avatar({ person, size = 36, live = false }: { person: Pick<Person, "id" | "name" | "tag"> | undefined; size?: number; live?: boolean }) {
  const ink = inkOf(person?.id ?? "x");
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <span
        className="inline-flex h-full w-full items-center justify-center rounded-full font-semibold"
        style={{ background: `${ink}24`, color: ink, boxShadow: `inset 0 0 0 1px ${ink}40`, fontSize: Math.round(size * 0.36), letterSpacing: "0.02em" }}
        aria-hidden="true"
      >
        {initials(person)}
      </span>
      {live ? <span className="team-live absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0A0A0A] bg-[#EDEDEB]" /> : null}
    </span>
  );
}

export function Pill({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "new" | "team" | "bad" }) {
  const styles: Record<string, string> = {
    plain: "bg-[#1F1F1E] text-[#A9A8A2]",
    new: "bg-[#EDEDEB] text-[#0A0A0A]",
    team: "bg-[#1F1F1E] text-[#8F8F8A]",
    bad: "bg-[#C4574F1F] text-[#E5876B]",
  };
  return <span className={`inline-flex items-center rounded-full px-2 py-[2px] text-[11px] font-medium leading-[1.4] ${styles[tone]}`}>{children}</span>;
}

/** One choice of a few, the one that is on in ivory. */
export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: Array<{ id: T; label: string }>; onChange: (v: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex rounded-full bg-[#161615] p-[3px]">
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.id)}
            className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors duration-150 ${on ? "bg-[#EDEDEB] text-[#0A0A0A]" : "text-[#A9A8A2] hover:text-[#EDEDEB]"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Chips<T extends string>({ value, options, onChange, label }: { value: T; options: Array<{ id: T; label: string; count?: number }>; onChange: (v: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.id)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors duration-150 ${on ? "border-[#EDEDEB] bg-[#EDEDEB] text-[#0A0A0A]" : "border-[#262625] text-[#A9A8A2] hover:border-[#3A3A38] hover:text-[#EDEDEB]"}`}
          >
            {o.label}
            {o.count !== undefined ? <span className={`tabular-nums ${on ? "text-[#0A0A0A]/60" : "text-[#7A7A74]"}`}>{o.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

export function Quiet({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-[13.5px] text-[#8F8F8A]">{children}</p>;
}

/** A key for a chart's colors. */
export function Legend({ items }: { items: Array<{ color: string; label: string; dashed?: boolean; outline?: boolean }> }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[12px] text-[#8F8F8A]">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          {i.dashed ? (
            <span className="h-0 w-3.5 border-t-2 border-dotted" style={{ borderColor: i.color }} />
          ) : i.outline ? (
            <span className="h-2.5 w-2.5 rounded-[3px] border border-dashed" style={{ borderColor: i.color }} />
          ) : (
            <span className="h-2 w-2 rounded-[3px]" style={{ background: i.color }} />
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
