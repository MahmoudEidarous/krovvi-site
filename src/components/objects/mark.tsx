"use client";

/**
 * The marks, on the page: the same line drawings the app's objects wear in
 * place of emojis (catch8 supabase/functions/_shared/objects/marks.ts, which
 * this table copies by hand; keep the two the same). Ivory line on the dark,
 * stroked with round caps and joins on a 24 grid, never filled.
 */

import { INK } from "./kit";

export const MARKS = {
  // The kinds.
  utensils: "M6 3v5.5a2.5 2.5 0 0 0 5 0V3 M8.5 3v18 M18 21V3c-2.2 1.1-3.5 3.6-3.5 7v3.5H18",
  dumbbell:
    "M8.5 12h7 M5.5 7.5h1.5a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H5.5a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1z M17 7.5h1.5a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H17a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1z M2.5 10v4 M21.5 10v4",
  checkCircle: "M20.5 12a8.5 8.5 0 1 1-2.5-6 M8.5 11.5l2.6 2.6L20.5 5",
  checklist: "M3.5 6.5l1.8 1.8L8.8 4.8 M3.5 13.5l1.8 1.8 3.5-3.5 M12 6.5h8.5 M12 13.5h8.5 M4.5 20h.01 M12 20h8.5",
  cart: "M2.5 3.5h2.4l2.3 11.1a1.6 1.6 0 0 0 1.6 1.3h9.1a1.6 1.6 0 0 0 1.6-1.2L21 7.5H5.7 M9.5 20.2h.01 M17.5 20.2h.01",
  wallet:
    "M19.5 7.5V6a1.5 1.5 0 0 0-1.5-1.5H5.5a2.5 2.5 0 0 0 0 5h14a1.5 1.5 0 0 1 1.5 1.5v7.5a1.5 1.5 0 0 1-1.5 1.5H5.5A2.5 2.5 0 0 1 3 17.5V7 M16.5 14.5h.01",
  halves: "M10.8 3.1a9 9 0 0 0 0 17.8z M13.2 3.1a9 9 0 0 1 0 17.8z",
  suitcase: "M5.5 7.5h13a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z M9 7.5V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2.5 M8 7.5v13 M16 7.5v13",
  calendar: "M5.5 5h13a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z M3.5 10h17 M8 3v4 M16 3v4",
  pill: "M10.6 20a4.5 4.5 0 0 1-6.4-6.4l9.4-9.4a4.5 4.5 0 0 1 6.4 6.4z M8.9 8.9l6.2 6.2",
  face: "M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z M8.5 14.5c.9 1.2 2.1 1.9 3.5 1.9s2.6-.7 3.5-1.9 M9 9.8h.01 M15 9.8h.01",
  cap: "M12 4.5l9.5 4.7L12 14 2.5 9.2z M6.5 11.3v4.4c0 1.6 2.5 3 5.5 3s5.5-1.4 5.5-3v-4.4 M21.5 9.2v5.3",
  gift:
    "M4 8.5h16a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1z M5 12.5v6.5a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5v-6.5 M12 8.5v12 M12 8.5C10.6 5.6 7.3 4.4 7 6.3c-.3 1.6 2.4 2.2 5 2.2z M12 8.5c1.4-2.9 4.7-4.1 5-2.2.3 1.6-2.4 2.2-5 2.2z",
  scale: "M12 3.5v17 M7.5 20.5h9 M4 7h16 M4 7l-2.5 6.5a2.9 2.9 0 0 0 5 0z M20 7l-2.5 6.5a2.9 2.9 0 0 0 5 0z",
  moon: "M20 14.6A8.5 8.5 0 1 1 9.4 4a6.6 6.6 0 0 0 10.6 10.6z",
  pot: "M4.5 10.5h15v5.5a4 4 0 0 1-4 4h-7a4 4 0 0 1-4-4z M4.5 12.5h-2 M19.5 12.5h2 M6.5 10.5a5.5 3.2 0 0 1 11 0 M12 6.2v.6",
  show: "M4.5 5h15a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z M8.5 21h7 M10.5 9v5l4-2.5z",
  hourglass:
    "M6 3h12 M6 21h12 M7.5 3v2.6a4.6 4.6 0 0 0 2 3.8L12 12l2.5-2.6a4.6 4.6 0 0 0 2-3.8V3 M7.5 21v-2.6a4.6 4.6 0 0 1 2-3.8L12 12l2.5 2.6a4.6 4.6 0 0 1 2 3.8V21",
  // Things inside a kind.
  film: "M4 10.5h16v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z M4 10.5l-.6-2.3a1.5 1.5 0 0 1 1.1-1.8l12.6-3.2a1.5 1.5 0 0 1 1.8 1.1l.6 2.3z M8.3 5.4l2.4 3.4 M13.1 4.2l2.4 3.4",
  car: "M5 11l1.5-4.1A2 2 0 0 1 8.4 5.5h7.2a2 2 0 0 1 1.9 1.4L19 11 M5 11h14a2 2 0 0 1 2 2v3.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V13a2 2 0 0 1 2-2z M6 17.5v2 M18 17.5v2 M7 14.2h.01 M17 14.2h.01",
  house: "M3 10.8L12 3.5l9 7.3 M5.5 9v10a1.5 1.5 0 0 0 1.5 1.5h3v-5.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5.5h3a1.5 1.5 0 0 0 1.5-1.5V9",
  receipt: "M5.5 3.5h13v17l-2.2-1.4-2.1 1.4-2.2-1.4-2.2 1.4-2.1-1.4-2.2 1.4z M9 8h6 M9 11.5h6 M9 15h3.5",
  bag: "M5.2 8h13.6l-.9 11.6a1.5 1.5 0 0 1-1.5 1.4H7.6a1.5 1.5 0 0 1-1.5-1.4z M9 10V7a3 3 0 0 1 6 0v3",
  ticket:
    "M3 7.5A1.5 1.5 0 0 1 4.5 6h15A1.5 1.5 0 0 1 21 7.5v2.2a2.4 2.4 0 0 0 0 4.6v2.2a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 16.5v-2.2a2.4 2.4 0 0 0 0-4.6z M14.5 6v2 M14.5 11v2 M14.5 16v2",
  heart: "M12 20s-8-4.7-8-10.4A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8 2.6C20 15.3 12 20 12 20z",
  plane:
    "M12 2.8c.8 0 1.4 1 1.4 2.3v4.3l7.1 4.3v2l-7.1-2.3v4.4l2.2 1.7v1.6L12 20.4l-3.6.7v-1.6l2.2-1.7v-4.4l-7.1 2.3v-2l7.1-4.3V5.1c0-1.3.6-2.3 1.4-2.3z",
  bed: "M3 5.5v14 M3 15.5h18v4 M3 11.5h4.5A1.5 1.5 0 0 1 9 13v2.5 M9 11h9a3 3 0 0 1 3 3v1.5",
  train: "M8.5 3.5h7a3.5 3.5 0 0 1 3.5 3.5v7a3.5 3.5 0 0 1-3.5 3.5h-7A3.5 3.5 0 0 1 5 14V7a3.5 3.5 0 0 1 3.5-3.5z M5 10.5h14 M8.5 14h.01 M15.5 14h.01 M8.5 17.5L6.5 21 M15.5 17.5l2 3.5",
  bus: "M6.5 3.5h11a2.5 2.5 0 0 1 2.5 2.5v10.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5V6a2.5 2.5 0 0 1 2.5-2.5z M4 11h16 M4 7h16 M7.5 14.5h.01 M16.5 14.5h.01 M7 18v2.5 M17 18v2.5",
  boat: "M3 14.5l9-3.5 9 3.5-1.8 4.6a1.5 1.5 0 0 1-1.4.9H6.2a1.5 1.5 0 0 1-1.4-.9z M6.5 12.8V8.5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v4.3 M12 7.5V4 M12 11v9",
  pin: "M12 21s-6.5-5.4-6.5-10.8a6.5 6.5 0 0 1 13 0C18.5 15.6 12 21 12 21z M12 7.7a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z",
  tag: "M3.5 4.9v6.4a1.5 1.5 0 0 0 .4 1l8 8a1.5 1.5 0 0 0 2.1 0l6.3-6.3a1.5 1.5 0 0 0 0-2.1l-8-8a1.5 1.5 0 0 0-1-.4H4.9a1.4 1.4 0 0 0-1.4 1.4z M8 8h.01",
} as const;

export type MarkName = keyof typeof MARKS;

/** Each kind's mark: what every object of that kind wears. */
export const KIND_MARK: Record<string, MarkName> = {
  food: "utensils",
  workout: "dumbbell",
  habits: "checkCircle",
  todo: "checklist",
  shopping: "cart",
  spending: "wallet",
  split: "halves",
  trip: "suitcase",
  plan: "calendar",
  meds: "pill",
  mood: "face",
  learn: "cap",
  gift: "gift",
  decide: "scale",
  cycle: "moon",
  meals: "pot",
  watchlist: "show",
  countdown: "hourglass",
};

export function isMark(value: unknown): value is MarkName {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(MARKS, value);
}

/** The line in px at a size: 1.5 at 20, never under 1.35, heavier as the mark grows. */
export function markWeight(size: number): number {
  return Math.max(1.35, size * 0.075);
}

export function Mark({ name, size = 20, color = INK.fg, weight }: { name: MarkName; size?: number; color?: string; weight?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={((weight ?? markWeight(size)) * 24) / size} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: "block", flex: "none" }}>
      <path d={MARKS[name]} />
    </svg>
  );
}

/** A kind's mark, or nothing for a kind this page does not know. */
export function KindMark({ kind, size = 20, color }: { kind: string; size?: number; color?: string }) {
  const name = KIND_MARK[kind];
  return name ? <Mark name={name} size={size} color={color} /> : null;
}
