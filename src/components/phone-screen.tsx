"use client";

import { useLayoutEffect, useRef, useSyncExternalStore } from "react";

/** The width every screen is drawn at: an iPhone's 393 points. */
const SCREEN_W = 393;

/**
 * Sets the scale while the page is still loading, before the first paint and
 * before React starts, so a phone never shows at the wrong size.
 */
const FIT_NOW = `(function(){var s=document.currentScript,e=s&&s.parentNode,w=e&&parseFloat(getComputedStyle(e).width);if(w>0)e.style.setProperty("--k",w/${SCREEN_W})})()`;

const noChange = () => () => {};

/**
 * A phone's glass. What it shows is drawn at 393 points wide and scaled to
 * the glass by --k, the glass's own width over 393 (globals.css,
 * .phone-canvas). The width is measured: the CSS-only way,
 * tan(atan2(100cqw, 393px)), comes out wrong in Safari 26 (screens too
 * small, too big, or flipped to nothing). A script sets it as the page
 * loads, and a ResizeObserver keeps it right when the phone changes size.
 */
export function PhoneScreen({ children, className, style }: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // True for the server's HTML and while React takes it over; the loading script belongs to that first paint only.
  const fromServer = useSyncExternalStore(noChange, () => false, () => true);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = (w: number) => {
      if (w > 0) el.style.setProperty("--k", String(w / SCREEN_W));
    };
    fit(parseFloat(getComputedStyle(el).width));
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => fit(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    // The loading script adds --k to the style before React arrives.
    <div ref={ref} className={className} style={style} suppressHydrationWarning>
      {children}
      {fromServer && <script dangerouslySetInnerHTML={{ __html: FIT_NOW }} />}
    </div>
  );
}
