"use client";

import { useEffect, useState } from "react";

import { JOIN_URL } from "@/lib/site";

/**
 * The top bar: clear over the hero, a dark blurred strip once the page moves.
 * Dark enough that a white heading or button passing under it reads as a
 * faint shadow, not a bright smudge.
 */
export function SiteNav({ home = true }: { home?: boolean }) {
  const [moved, setMoved] = useState(false);
  useEffect(() => {
    const sync = () => setMoved(window.scrollY > 12);
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, []);
  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,box-shadow] duration-300 ${
        moved ? "bg-[rgba(10,10,10,0.9)] shadow-[0_1px_0_rgba(237,237,235,0.06)] backdrop-blur-xl" : ""
      }`}
    >
      <nav className="mx-auto flex h-[64px] max-w-[1200px] items-center justify-between px-[max(20px,env(safe-area-inset-left))] md:h-[72px] md:px-8">
        <a href="/" className="py-2 text-[18px] font-semibold tracking-[-0.02em] text-ink no-underline">
          krovvi
        </a>
        <div className="flex items-center gap-1 sm:gap-2">
          {home && (
            <a href="#how" className="hidden rounded-full px-3 py-2 text-[14px] text-muted no-underline transition-colors hover:text-ink sm:block">
              How it works
            </a>
          )}
          <a href="/privacy" className="hidden rounded-full px-3 py-2 text-[14px] text-muted no-underline transition-colors hover:text-ink sm:block">
            Privacy
          </a>
          <a
            href={JOIN_URL}
            className="ml-1 rounded-full bg-ink px-4 py-2 text-[14px] font-semibold text-ground no-underline transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]"
          >
            Join the beta
          </a>
        </div>
      </nav>
    </header>
  );
}
