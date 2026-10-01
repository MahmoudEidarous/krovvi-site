"use client";

import { useEffect, useRef } from "react";

/**
 * A device you could pick up: the phone leans a few degrees toward the
 * pointer and settles back when it leaves. Eased every frame, so it never
 * snaps; off on touch screens and when motion is reduced, where it rests
 * at the pose it was given.
 */
export function Tilt({ children, className, max = 4, rest = { x: 0, y: 0 } }: {
  children: React.ReactNode;
  className?: string;
  /** The most it leans, in degrees. */
  max?: number;
  /** The pose at rest, in degrees: x leans back, y turns. */
  rest?: { x: number; y: number };
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce), (pointer: coarse)");
    if (still.matches) return;
    let goal = { x: rest.x, y: rest.y };
    let now = { ...goal };
    let frame = 0;
    const tick = () => {
      now = { x: now.x + (goal.x - now.x) * 0.08, y: now.y + (goal.y - now.y) * 0.08 };
      el.style.setProperty("--rx", `${now.x.toFixed(3)}deg`);
      el.style.setProperty("--ry", `${now.y.toFixed(3)}deg`);
      if (Math.abs(goal.x - now.x) > 0.01 || Math.abs(goal.y - now.y) > 0.01) frame = requestAnimationFrame(tick);
      else frame = 0;
    };
    const kick = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const move = (e: PointerEvent) => {
      // Measured against the window, so the lean follows the pointer anywhere on the hero.
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      goal = { x: rest.x - ny * max * 2, y: rest.y + nx * max * 2 };
      kick();
    };
    const leave = () => {
      goal = { x: rest.x, y: rest.y };
      kick();
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      cancelAnimationFrame(frame);
    };
  }, [max, rest.x, rest.y]);

  return (
    <div className={className} style={{ perspective: "1600px" }}>
      <div
        ref={ref}
        style={
          {
            "--rx": `${rest.x}deg`,
            "--ry": `${rest.y}deg`,
            transform: "rotateX(var(--rx)) rotateY(var(--ry))",
            transformStyle: "preserve-3d",
            willChange: "transform",
          } as React.CSSProperties
        }
      >
        {children}
      </div>
    </div>
  );
}
