"use client";

/**
 * What Kitchen, Health and Fitness share on the page beyond the kit: a sheet
 * that rises from the bottom edge (a recipe to read, a day to plan, one thing
 * on a list, a new box of pills), and the few controls those sheets and
 * pages are made of. Each is drawn with the kit's inks and type steps, so it
 * reads as the same hand.
 */

import { useCallback, useEffect, useRef, type CSSProperties, type ReactNode } from "react";

import { say, type Lang, type Words } from "@/lib/objects";
import { EASE, INK, STEP, Tick, dirOf } from "../kit";

const C = {
  close: { en: "Close", ar: "اقفل" },
} satisfies Record<string, Words>;

/** One change as the door takes it: the kind's op and the args it reads. */
export interface Call {
  op: string;
  args: Record<string, unknown>;
}

/** A change the server has not answered after this long is taken as not gone through, so the taps behind it are not held up. */
const GIVE_UP_MS = 15_000;

/**
 * The page's changes sent one after another, in the order they were made:
 * three things ticked in a hurry are three things ticked, and the server's
 * answers come back in that order too. What it hands back says whether the
 * change went through, so a tap shown at once can be put back when it did
 * not.
 */
export function useRun(act: (op: string, args?: Record<string, unknown>) => Promise<boolean>): (call: Call) => Promise<boolean> {
  const chain = useRef<Promise<unknown>>(Promise.resolve());
  const latest = useRef(act);
  useEffect(() => {
    latest.current = act;
  });
  return useCallback((call: Call) => {
    const go = () => Promise.race([latest.current(call.op, call.args), new Promise<boolean>((resolve) => setTimeout(() => resolve(false), GIVE_UP_MS))]).catch(() => false);
    const next = chain.current.then(go, go);
    chain.current = next;
    return next;
  }, []);
}

/** A colour let through at `a` (0 to 1): the wash behind a chosen chip, the dim half of a bar. */
export function wash(hex: string, a: number): string {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${Math.max(0, Math.min(1, a))})`;
}

/** `t` of a colour laid over another, as one solid colour: a bar's quiet days, which nothing behind may show through. */
export function over(hex: string, base: string, t: number): string {
  const read = (h: string) => {
    const n = parseInt(h.replace("#", "").slice(0, 6), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const a = read(hex);
  const b = read(base);
  return `#${a.map((v, i) => Math.round(b[i] + (v - b[i]) * Math.max(0, Math.min(1, t))).toString(16).padStart(2, "0")).join("")}`;
}

/**
 * The page held still while a sheet is over it. The body is pinned where it
 * was and put back at the same place after: "overflow: hidden" on the body
 * does nothing on this site, since html clips sideways (globals.css) and so
 * the scrolling is html's. Pinned, the page is also kept out of the strips
 * Safari on iOS 26 draws under its floating bar and under the clock, which a
 * sheet's shade cannot reach: without this the bright page shows under an
 * open sheet's bottom edge. Sheets are counted, so one opened from another
 * does not move the page. Both are exported for any other sheet on the page
 * (the shell's "Which one is you?" holds nothing yet).
 */
let held = 0;
let heldAt = 0;
let heldStyle: { position: string; top: string; left: string; right: string; width: string } | null = null;

export function holdPage() {
  held += 1;
  if (held > 1) return;
  const body = document.body.style;
  heldAt = window.scrollY;
  heldStyle = { position: body.position, top: body.top, left: body.left, right: body.right, width: body.width };
  body.position = "fixed";
  body.top = `${-heldAt}px`;
  body.left = "0";
  body.right = "0";
  body.width = "100%";
}

export function letPageGo() {
  if (held === 0) return;
  held -= 1;
  if (held > 0 || !heldStyle) return;
  Object.assign(document.body.style, heldStyle);
  heldStyle = null;
  // The site scrolls smoothly by rule (globals.css); going back to where the page was must not be seen.
  const root = document.documentElement.style;
  const smooth = root.scrollBehavior;
  root.scrollBehavior = "auto";
  window.scrollTo(0, heldAt);
  root.scrollBehavior = smooth;
}

/**
 * A sheet over the page. It closes on the shade, on its own button and on
 * Escape; the page behind stays where it was while it is open; and whatever
 * is in it scrolls inside it, never past it.
 */
export function Sheet({ title, lang, onClose, children, foot, tall }: { title: string; lang: Lang; onClose: () => void; children: ReactNode; /** Kept in view under what scrolls: the sheet's one button. */ foot?: ReactNode; /** Opens at its full height whatever it holds (a recipe), so it does not jump as it fills. */ tall?: boolean }) {
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });
  // Once, as it opens: a new onClose on every draw must not take the keys away from a box being typed in.
  useEffect(() => {
    const before = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panel.current?.focus({ preventScroll: true });
    holdPage();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      letPageGo();
      window.removeEventListener("keydown", onKey);
      before?.focus({ preventScroll: true });
    };
  }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="absolute inset-0 animate-[k-fade_220ms_ease-out] motion-reduce:animate-none" style={{ background: "rgba(0,0,0,0.55)", touchAction: "none" }} onClick={onClose} aria-label={say(C.close, lang)} />
      <div
        ref={panel}
        tabIndex={-1}
        className="relative flex w-full max-w-[600px] animate-[k-sheet-up_320ms_var(--ease)] flex-col outline-none motion-reduce:animate-none"
        style={{ background: INK.surface, borderRadius: "22px 22px 0 0", maxHeight: "88dvh", height: tall ? "88dvh" : undefined }}
      >
        <div className="flex shrink-0 items-start" style={{ gap: 12, padding: "18px 16px 10px" }}>
          <h2 className="min-w-0 flex-1" style={{ ...STEP.title, fontSize: 20, lineHeight: "26px", textAlign: "start", overflowWrap: "anywhere" }}>
            <bdi dir={dirOf(title)}>{title}</bdi>
          </h2>
          <button type="button" onClick={onClose} aria-label={say(C.close, lang)} className="flex shrink-0 items-center justify-center rounded-full active:opacity-70" style={{ width: 32, height: 32, background: INK.surfaceHi }}>
            <svg width={12} height={12} viewBox="0 0 12 12" aria-hidden>
              <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" fill="none" stroke={INK.soft} strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain" style={{ padding: foot ? "2px 16px 12px" : "2px 16px max(24px, env(safe-area-inset-bottom))", WebkitOverflowScrolling: "touch" }}>
          {children}
        </div>
        {foot ? (
          <div className="shrink-0" style={{ padding: "10px 16px max(20px, env(safe-area-inset-bottom))", borderTop: `0.5px solid ${INK.line}` }}>
            {foot}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * A text box. Its type is sixteen points on purpose: iOS zooms the whole page
 * into anything smaller the moment it is tapped, and leaves it zoomed. An
 * empty box, or one that holds only a number, lines up with the page; once
 * words are typed in it they take their own direction.
 */
export function Box({
  value,
  onChange,
  placeholder,
  label,
  lang,
  max = 80,
  mode,
  enter = "done",
  className = "w-full",
  style,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  label?: string;
  lang: Lang;
  max?: number;
  mode?: "text" | "decimal" | "numeric" | "search";
  enter?: "done" | "send" | "go" | "search";
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value.slice(0, max))}
      maxLength={max}
      placeholder={placeholder}
      aria-label={label ?? placeholder}
      dir={/\p{L}/u.test(value) ? "auto" : lang === "ar" ? "rtl" : "ltr"}
      inputMode={mode}
      enterKeyHint={enter}
      autoComplete="off"
      autoCorrect="off"
      className={`${className} rounded-2xl outline-none placeholder:opacity-70`}
      style={{ ...STEP.body, fontSize: 16, background: INK.surfaceHi, color: INK.fg, padding: "12px 14px", ...style }}
    />
  );
}

/**
 * The kit's tick with room around it for a thumb: in a shop a tap lands
 * beside the ring as often as on it, and both count. The ring stays the
 * button a screen reader and a keyboard find.
 */
export function TickArea({ done, by, label, size = 28, onClick }: { done: boolean; by?: string | null; label: string; size?: number; onClick?: () => void }) {
  // The ring's own tap stops here, so the room around it never counts the same tap twice.
  const onRing = onClick
    ? (((e?: { stopPropagation?: () => void }) => {
        e?.stopPropagation?.();
        onClick();
      }) as () => void)
    : undefined;
  return (
    <span className="flex shrink-0 items-center justify-center" style={{ margin: -9, padding: 9, cursor: onClick ? "pointer" : undefined }} onClick={onClick}>
      <Tick done={done} by={by} size={size} label={label} onClick={onRing} />
    </span>
  );
}

/** A chevron at the far edge of a row that opens something, pointing the way the page reads. */
export function Chevron({ lang }: { lang: Lang }) {
  return (
    <svg width={8} height={14} viewBox="0 0 8 14" aria-hidden className="shrink-0" style={{ transform: lang === "ar" ? "scaleX(-1)" : undefined }}>
      <path d="M1.5 1.5L6.5 7l-5 5.5" fill="none" stroke={INK.faint} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** One choice among a few (a store, an aisle): the chosen one wears the app's colour, quietly. */
export function Chip({ text, on, onClick, tint }: { text: string; on: boolean; onClick: () => void; tint: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className="shrink-0 rounded-full active:scale-[0.97]"
      style={{ ...STEP.label, height: 34, padding: "0 14px", whiteSpace: "nowrap", background: on ? wash(tint, 0.16) : INK.surfaceHi, color: on ? tint : INK.soft, boxShadow: on ? `inset 0 0 0 1px ${wash(tint, 0.4)}` : undefined, transition: `background-color 150ms ${EASE}, color 150ms ${EASE}, transform 110ms ${EASE}` }}
    >
      <bdi dir={dirOf(text)}>{text}</bdi>
    </button>
  );
}

/** A sheet's or a page's one clear button, the height a thumb finds: ivory when it is the next thing to do, quiet otherwise. */
export function Wide({ text, onClick, strong, disabled }: { text: string; onClick: () => void; strong?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="h-[50px] w-full rounded-full transition-transform active:scale-[0.985] disabled:opacity-40"
      style={{ ...STEP.body, fontWeight: 600, background: strong ? INK.fg : INK.surfaceHi, color: strong ? INK.bg : INK.fg }}
    >
      {text}
    </button>
  );
}

/** One thing to do in a sheet, as a row of its own under a hairline. */
export function SheetRow({ text, onClick, first, away }: { text: string; onClick: () => void; first?: boolean; /** Something that takes away (a day freed): in the ink the page keeps for that. */ away?: boolean }) {
  return (
    <button type="button" onClick={onClick} className="block w-full text-start active:opacity-70" style={{ ...STEP.body, fontWeight: 500, color: away ? INK.down : INK.fg, padding: "14px 2px", borderTop: first ? undefined : `0.5px solid ${INK.line}` }}>
      {text}
    </button>
  );
}

/** A quiet head over a part of a sheet; the first one sits close under the sheet's title. */
export function Head({ text, first }: { text: string; first?: boolean }) {
  return <h3 style={{ ...STEP.label, color: INK.muted, margin: first ? "4px 2px 8px" : "18px 2px 8px", textAlign: "start" }}>{text}</h3>;
}
