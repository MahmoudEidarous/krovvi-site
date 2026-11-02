"use client";

import { useEffect, useRef } from "react";

import { startLook } from "./motion";

/** Sets the page moving once it is on screen (components/look/motion.ts), and stops it all when the page goes. */
export function LookMotion() {
  const here = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const root = here.current?.closest(".kl") as HTMLElement | null;
    if (!root) return;
    return startLook(root);
  }, []);
  return <span ref={here} hidden />;
}
