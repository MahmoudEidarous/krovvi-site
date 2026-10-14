/**
 * A person's mark: the first letter of their name in Krovvi's dots, in their
 * own colour (catch8 components/person-face.tsx:23-71 at 272d7cc5), drawn
 * from the site's own letters (src/lib/letter-dots.ts, the app's five by
 * seven capitals and Kufi letters). One pitch at a given size: seven rows
 * fill a little over half the circle, and small faces get bigger dots. One
 * path of circles, never a node per dot. `ground: null` draws the letter
 * alone, as the home's way to Settings does.
 */

import type { CSSProperties } from "react";

import { initialOf } from "@/lib/letter-dots";

import { C, personTint } from "./tokens";

const f = (n: number) => Math.round(n * 1000) / 1000;

export function DeepFace({ name, size = 36, ground = C.surfaceHi, className, style }: { name: string; size?: number; ground?: string | null; className?: string; style?: CSSProperties }) {
  const tint = personTint(name);
  const initial = initialOf(name);
  if ("text" in initial) {
    return (
      <span
        className={className}
        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: size, height: size, borderRadius: size / 2, background: ground ?? "transparent", color: tint, fontSize: size * 0.44, fontWeight: 600, flexShrink: 0, ...style }}
        aria-hidden="true"
      >
        {initial.text}
      </span>
    );
  }
  const small = size < 30;
  const pitch = (size * (small ? 0.64 : 0.56)) / 6;
  const r = pitch * (small ? 0.42 : 0.37);
  const x0 = size / 2 - ((initial.cols - 1) * pitch) / 2;
  const y0 = size / 2 - ((initial.rows - 1) * pitch) / 2;
  const d = initial.dots.map(([x, y]) => `M${f(x0 + x * pitch - r)} ${f(y0 + y * pitch)}a${f(r)} ${f(r)} 0 1 0 ${f(r * 2)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-r * 2)} 0Z`).join("");
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className} style={{ display: "block", flexShrink: 0, ...style }} aria-hidden="true">
      {ground ? <circle cx={size / 2} cy={size / 2} r={size / 2} fill={ground} /> : null}
      <path d={d} fill={tint} />
    </svg>
  );
}
