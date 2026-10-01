"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Holds every .anim inside it still until it scrolls into view, then lets
 * them play once (globals.css pauses them while data-inview is 0). A screen
 * deep in the page then starts its little film when someone is looking.
 */
export function InView({ children, className, margin = "0px 0px -18% 0px", style }: {
  children: React.ReactNode;
  className?: string;
  margin?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { rootMargin: margin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [margin]);
  return (
    <div ref={ref} data-inview={on ? "1" : "0"} className={className} style={style}>
      {children}
    </div>
  );
}
