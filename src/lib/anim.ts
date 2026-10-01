import type { CSSProperties } from "react";

/** Style for an element with the .anim class: which keyframes, after how long, for how long. */
export function an(name: string, delay = 0, dur?: number, extra?: Record<string, string | number>): CSSProperties {
  return {
    "--a": name,
    "--delay": `${delay}ms`,
    ...(dur ? { "--dur": `${dur}ms` } : {}),
    ...(extra ?? {}),
  } as CSSProperties;
}
