"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * A conversation that plays itself, beat by beat, the way the app's chat
 * moves: each new piece grows in at the foot of the thread and rises into
 * place, so everything above it slides up, and the oldest turns leave over
 * the top. A beat can also change an earlier piece (a choice being tapped)
 * or close it (the choices folding away once the answer is sent).
 *
 * It plays on a clock when `playing` (and rests, then starts over, when
 * `loop`), or shows exactly `at` beats when it is driven from outside (the
 * scroll). It never plays while nobody is looking: the caller says.
 */

export type Beat = {
  id: string;
  /** Ms after the beat before it. */
  wait: number;
  /** What it adds to the thread; none for a beat that only changes another one. */
  show?: (has: (id: string) => boolean) => ReactNode;
  /** This piece folds away once that beat has happened. */
  until?: string;
  /** Room above it in points: 4 between bubbles of one turn, 16 between turns (the app's spacing). 10 if not said. */
  gap?: number;
};

export function useBeats(
  beats: Beat[],
  { playing, loop = true, rest = 3600, holdAt, release = true }: {
    playing: boolean;
    loop?: boolean;
    rest?: number;
    /** After this many beats the film waits until `release` (a part the reader has not scrolled to yet). */
    holdAt?: number;
    release?: boolean;
  }
) {
  const [n, setN] = useState(0);
  const [fading, setFading] = useState(false);
  // Only the beat it waits at listens to `release`, so a part coming and going elsewhere never restarts a beat's clock.
  const open = holdAt === undefined || n !== holdAt || release;
  useEffect(() => {
    if (!playing || !open) return;
    if (n >= beats.length) {
      if (!loop) return;
      const a = window.setTimeout(() => setFading(true), rest);
      const b = window.setTimeout(() => {
        setN(0);
        setFading(false);
      }, rest + 650);
      return () => {
        window.clearTimeout(a);
        window.clearTimeout(b);
      };
    }
    const id = window.setTimeout(() => setN((v) => v + 1), beats[n].wait);
    return () => window.clearTimeout(id);
  }, [n, playing, open, loop, rest, beats]);
  return { n, fading };
}

export function Thread({ beats, at }: { beats: Beat[]; at: number }) {
  const done = beats.slice(0, at);
  const ids = new Set(done.map((b) => b.id));
  const has = (id: string) => ids.has(id);
  return (
    <>
      {done.map((b) =>
        b.show ? (
          <div key={b.id} className={b.until && has(b.until) ? "film-gone" : "film-in"}>
            <div className="film-inner flex min-h-0 flex-col" style={{ paddingTop: b.gap ?? 10 }}>
              {b.show(has)}
            </div>
          </div>
        ) : null
      )}
    </>
  );
}
