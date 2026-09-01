"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

const EASE = [0.23, 1, 0.32, 1] as const;

/** True once mounted on a viewport at least `md` wide; false on phones and on the server. */
function useWide() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return wide;
}

/** Entrance: rises once on load. */
export function Rise({ children, delay = 0, className }: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 38 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Reveals once when scrolled into view. */
export function Reveal({ children, className }: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.9, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Scroll parallax: drifts against the scroll by ±amount px.
 * Desktop only. On a phone the scroll-linked transform fights the touch
 * scroll (jitter on iOS) and shoves each phone shot 70px off its seat as it
 * reveals; the page is calmer standing still.
 */
export function ParallaxY({ children, amount = 60, className }: {
  children: React.ReactNode;
  amount?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const wide = useWide();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [amount, -amount]);
  const active = wide && !reduced;
  return (
    <motion.div ref={ref} style={active ? { y } : undefined} className={className}>
      {children}
    </motion.div>
  );
}

/** The hero phone's slow breathing float. */
export function Drift({ children, className }: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -16, 0] }}
      transition={{ duration: 8, ease: "easeInOut", repeat: Infinity, delay: 1.6 }}
    >
      {children}
    </motion.div>
  );
}
