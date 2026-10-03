"use client";

/**
 * Yes or no, one card at a time, for Meals and the Watchlist on the page (the
 * app's kit SwipeDeck, in the browser): drag right for yes and left for no,
 * or use the two buttons under it. The card follows the pointer and tilts a
 * little; past a third of the way, or flicked, it leaves on the app's
 * ease-out and the next one is already there. Every swipe goes through
 * `onSwipe`, which the kind sends through act; the deck keeps nothing.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";

import { EASE, INK, STEP } from "../../kit";

export interface DeckCard {
  id: string;
  label: string;
  render: () => ReactNode;
}

export function Deck({ cards, onSwipe, height = 360, empty, yesLabel, noLabel, disabled, lang = "en" }: { cards: DeckCard[]; onSwipe: (id: string, yes: boolean) => void; height?: number; empty: ReactNode; yesLabel: string; noLabel: string; disabled?: boolean; lang?: "en" | "ar" }) {
  const [gone, setGone] = useState<Set<string>>(new Set());
  const [x, setX] = useState(0);
  const [leaving, setLeaving] = useState<null | boolean>(null);
  const start = useRef<{ x: number; t: number } | null>(null);
  const width = useRef(360);
  const live = cards.filter((c) => !gone.has(c.id));
  const top = live[0];
  const next = live[1];

  // A card that left the deck on the server (someone else's swipe) leaves this set too.
  useEffect(() => {
    const ids = new Set(cards.map((c) => c.id));
    setGone((g) => new Set([...g].filter((id) => ids.has(id))));
  }, [cards]);

  const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const settle = (id: string, yes: boolean) => {
    setGone((g) => new Set(g).add(id));
    setX(0);
    setLeaving(null);
    onSwipe(id, yes);
  };

  const fling = (yes: boolean) => {
    if (!top || disabled) return;
    if (reduce) return settle(top.id, yes);
    setLeaving(yes);
    setX((yes ? 1 : -1) * width.current * 1.3);
    const id = top.id;
    setTimeout(() => settle(id, yes), 140);
  };

  if (!top) return <div style={{ height }} className="flex items-center justify-center">{empty}</div>;

  const tilt = (x / Math.max(1, width.current)) * 9;
  const far = Math.min(1, Math.abs(x) / (width.current * 0.4));
  return (
    <div>
      <div className="relative" style={{ height }} ref={(el) => void (el && (width.current = el.clientWidth))}>
        {next ? (
          <div className="absolute inset-0 overflow-hidden" style={{ background: INK.surface, borderRadius: 17, transform: `scale(${0.95 + 0.05 * far})`, opacity: 0.6 + 0.4 * far }} aria-hidden>
            {next.render()}
          </div>
        ) : null}
        <div
          key={top.id}
          role="group"
          aria-label={top.label}
          className="absolute inset-0 touch-none select-none overflow-hidden"
          style={{
            background: INK.surface,
            borderRadius: 17,
            transform: `translateX(${x}px) rotate(${tilt}deg)`,
            transition: start.current ? "none" : `transform ${leaving === null ? 240 : 140}ms ${EASE}`,
            cursor: disabled ? "default" : "grab",
          }}
          onPointerDown={(e) => {
            if (disabled) return;
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
            start.current = { x: e.clientX - x, t: performance.now() };
          }}
          onPointerMove={(e) => {
            if (!start.current) return;
            setX(e.clientX - start.current.x);
          }}
          onPointerUp={(e) => {
            if (!start.current) return;
            const dx = e.clientX - start.current.x;
            const speed = Math.abs(dx) / Math.max(1, performance.now() - start.current.t);
            start.current = null;
            if (Math.abs(dx) > width.current * 0.3 || speed > 0.9) fling(dx > 0);
            else setX(0);
          }}
          onPointerCancel={() => {
            start.current = null;
            setX(0);
          }}
        >
          {top.render()}
          <span className="pointer-events-none absolute flex items-center justify-center rounded-full" style={{ top: 16, insetInlineStart: 16, width: 36, height: 36, background: INK.fg, opacity: Math.max(0, Math.min(1, x / (width.current * 0.25))) }} aria-hidden>
            <Check color={INK.bg} />
          </span>
          <span className="pointer-events-none absolute flex items-center justify-center rounded-full" style={{ top: 16, insetInlineEnd: 16, width: 36, height: 36, background: INK.surfaceHi, opacity: Math.max(0, Math.min(1, -x / (width.current * 0.25))) }} aria-hidden>
            <Cross color={INK.fg} />
          </span>
        </div>
      </div>
      <div className="flex items-center justify-center" style={{ gap: 28, marginTop: 16 }}>
        <button type="button" onClick={() => fling(false)} disabled={disabled} aria-label={noLabel} className="flex items-center justify-center rounded-full active:scale-[0.96] disabled:opacity-40" style={{ width: 56, height: 56, background: INK.surfaceHi, transition: "transform 110ms" }}>
          <Cross color={INK.fg} />
        </button>
        {/* How many cards are left, said as such (the app's deck says the same). */}
        <span style={{ ...STEP.meta, color: INK.muted }}>{lang === "ar" ? `فاضل ${live.length}` : `${live.length} left`}</span>
        <button type="button" onClick={() => fling(true)} disabled={disabled} aria-label={yesLabel} className="flex items-center justify-center rounded-full active:scale-[0.96] disabled:opacity-40" style={{ width: 56, height: 56, background: INK.fg, transition: "transform 110ms" }}>
          <Check color={INK.bg} />
        </button>
      </div>
    </div>
  );
}

function Check({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Cross({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
