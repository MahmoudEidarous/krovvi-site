"use client";

/**
 * A tile drawn from a name, for things with no picture of their own (a film
 * or a show on a watchlist, a dish on the family's deck), as the app draws
 * it (catch8 src/components/objects/kinds/watchlist/parts.tsx TitleTile): its
 * initials in Krovvi's dots in its own tint, on a quiet wash of the tint; an
 * Arabic name's letters read from the right. A name with no letters to draw
 * ("1917") shows the mark for what it is.
 */

import { useMemo } from "react";

import { initialOf } from "@/lib/letter-dots";
import { dirOf, INK, STEP, VOICE } from "../kit";
import { Mark, type MarkName } from "../mark";

export function NameTile({ t, size, radius = 11, fallback = "film" }: { t: { name: string; initials?: string; tint?: number }; size: number; radius?: number; fallback?: MarkName }) {
  // A payload from a server older than this page (no initials yet) draws the mark rather than breaking.
  const initials = t.initials || "?";
  const tint = VOICE[(t.tint ?? 0) % VOICE.length];
  const dots = useMemo(() => {
    const letters = Array.from(initials).slice(0, 2).map((ch) => initialOf(ch));
    if (!letters.length || letters.some((l) => "text" in l)) return null;
    const drawn = letters as Array<{ dots: Array<[number, number]>; cols: number; rows: number }>;
    const order = dirOf(t.name) === "rtl" ? [...drawn].reverse() : drawn;
    const rows = Math.max(...order.map((l) => l.rows));
    const cols = order.reduce((a, l) => a + l.cols, 0) + (order.length - 1) * 1.5;
    const pitch = Math.min((size * 0.42) / Math.max(1, rows - 1), (size * 0.66) / Math.max(1, cols - 1));
    const x0 = size / 2 - ((cols - 1) * pitch) / 2;
    const y0 = size / 2 - ((rows - 1) * pitch) / 2;
    const out: Array<{ cx: number; cy: number }> = [];
    let at = 0;
    for (const l of order) {
      const dy = (rows - l.rows) / 2;
      for (const [x, y] of l.dots) out.push({ cx: x0 + (at + x) * pitch, cy: y0 + (dy + y) * pitch });
      at += l.cols + 1.5;
    }
    return { out, r: pitch * 0.36 };
  }, [initials, t.name, size]);
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center overflow-hidden" style={{ width: size, height: size, borderRadius: radius, background: INK.surfaceHi }} aria-hidden>
      <span className="absolute inset-0" style={{ background: tint, opacity: 0.16 }} />
      {dots ? (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="relative">
          {dots.out.map((d, i) => (
            <circle key={i} cx={d.cx} cy={d.cy} r={dots.r} fill={tint} />
          ))}
        </svg>
      ) : initials === "?" ? (
        <span className="relative inline-flex">
          <Mark name={fallback} size={Math.round(size * 0.42)} color={tint} />
        </span>
      ) : (
        <span className="relative" style={{ ...STEP.display, color: tint, fontSize: size * 0.36 }}>
          {initials}
        </span>
      )}
    </span>
  );
}
