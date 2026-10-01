"use client";

import { useEffect, useState } from "react";

/**
 * Whether the reader asked for less motion, read only after the page has
 * hydrated. The server cannot know it, so the first render always assumes
 * motion is fine and the answer arrives a moment later; reading it during
 * the first render (as motion's own hook does) makes the browser's first
 * render differ from the server's, which React reports as a hydration error.
 * With motion reduced, the CSS already shows every end state from the start.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  return reduced;
}
