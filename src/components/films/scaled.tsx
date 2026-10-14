"use client";

import { useLayoutEffect, useRef, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";

const noChange = () => () => {};

/**
 * Something drawn at the app's own points, `w` wide and `h` tall, scaled to
 * the width the page gives it, as a phone's glass scales its screen
 * (components/phone-screen.tsx): --k is measured, set by a script while the
 * page loads and kept by a ResizeObserver. The tiles' pictures use it, so a
 * piece of the app looks the same on a tile as in a phone.
 */
export function Scaled({ w, h, children, className, style, label }: { w: number; h: number; children: ReactNode; className?: string; style?: CSSProperties; label?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const fromServer = useSyncExternalStore(noChange, () => false, () => true);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = (width: number) => {
      if (width > 0) el.style.setProperty("--k", String(width / w));
    };
    fit(parseFloat(getComputedStyle(el).width));
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => fit(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [w]);

  const fitNow = `(function(){var s=document.currentScript,e=s&&s.parentNode,v=e&&parseFloat(getComputedStyle(e).width);if(v>0)e.style.setProperty("--k",v/${w})})()`;

  return (
    <div
      ref={ref}
      role={label ? "img" : undefined}
      aria-label={label}
      className={`relative w-full overflow-hidden ${className ?? ""}`}
      style={{ aspectRatio: `${w} / ${h}`, containerType: "inline-size", ...style, ...({ "--sw": `${w}px` } as CSSProperties) }}
      suppressHydrationWarning
    >
      <div className="scaled-canvas absolute left-0 top-0 text-left" style={{ width: w, height: h }}>
        {children}
      </div>
      {fromServer && <script dangerouslySetInnerHTML={{ __html: fitNow }} />}
    </div>
  );
}
