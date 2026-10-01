"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Holds every .anim inside it still until it scrolls into view, then lets
 * them play once (globals.css pauses them while data-inview is 0). A screen
 * deep in the page then starts its little film when someone is looking.
 *
 * It also marks whether it is on screen right now (data-onscreen), and the
 * endless loops inside (voice bars, spinners, the strip) rest while it is
 * not, so a phone does no work for what nobody can see. With hold off it
 * only does that: nothing waits to be seen.
 */
export function InView({ children, className, margin = "0px 0px -18% 0px", style, hold = true }: {
  children: React.ReactNode;
  className?: string;
  margin?: string;
  style?: React.CSSProperties;
  hold?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const first = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setOn(true);
          first.disconnect();
        }
      },
      { rootMargin: margin }
    );
    if (hold) first.observe(el);
    // Set on the element directly: scrolling past never re-renders anything.
    const now = new IntersectionObserver(
      ([entry]) => {
        el.dataset.onscreen = entry.isIntersecting ? "1" : "0";
      },
      { rootMargin: "160px 0px" }
    );
    now.observe(el);
    return () => {
      first.disconnect();
      now.disconnect();
    };
  }, [margin, hold]);
  return (
    <div ref={ref} data-inview={hold ? (on ? "1" : "0") : undefined} className={className} style={style}>
      {children}
    </div>
  );
}
