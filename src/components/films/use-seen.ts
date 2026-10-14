"use client";

import { useEffect, useState, type RefObject } from "react";

/** True from the first time the element comes into view (and stays true), so a film starts when someone is looking. */
export function useFirstSeen(ref: RefObject<Element | null>, margin = "0px 0px -25% 0px") {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setSeen(true);
        io.disconnect();
      }
    }, { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin]);
  return seen;
}

/** True while the element is on screen and the tab is in front: endless films rest otherwise. */
export function useOnScreen(ref: RefObject<Element | null>, margin = "0px") {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let inView = false;
    const sync = () => setOn(inView && document.visibilityState !== "hidden");
    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      sync();
    }, { rootMargin: margin });
    io.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [ref, margin]);
  return on;
}
