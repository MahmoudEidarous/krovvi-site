/**
 * An app's mark in dots, as the home draws it (catch8 components/dotted.tsx
 * at 272d7cc5): every dot of the mark is a round dot 2.16 of the 24 unit
 * square across, a dot set by hand 1.18 times that (dotted.tsx:23-28,
 * 80-90). One <svg> with one path of circles per mark, never a node per dot.
 * The dots' places come worked out from mark-dots.ts.
 */

import type { CSSProperties } from "react";

import { MARK_DOTS, type MarkName } from "./mark-dots";

const DOT = 2.16;
const SET_DOT = 1.18;

const f = (n: number) => Math.round(n * 1000) / 1000;
const circle = (cx: number, cy: number, r: number) => `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(r * 2)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-r * 2)} 0Z`;

const paths = new Map<string, string>();
function pathOf(name: MarkName): string {
  const known = paths.get(name);
  if (known) return known;
  const mark = MARK_DOTS[name];
  const d = mark.dots.map(([x, y]) => circle(x, y, DOT / 2)).join("") + mark.set.map(([x, y]) => circle(x, y, (DOT * SET_DOT) / 2)).join("");
  paths.set(name, d);
  return d;
}

export function DottedMark({ name, size = 36, color, className, style }: { name: MarkName; size?: number; color: string; className?: string; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={{ display: "block", flexShrink: 0, overflow: "visible", ...style }} aria-hidden="true">
      <path d={pathOf(name)} fill={color} />
    </svg>
  );
}

export type { MarkName };
