"use client";

/**
 * The pieces both Together pages are built from (krovvi.com/e/<token> a post, krovvi.com/k/<code> an invite), in the
 * site's night look and words: the page's words in English and Egyptian Arabic, the four reactions drawn as the
 * site draws its marks (an ivory line on a 24 grid, round caps and joins, never filled, never an emoji), the K at the
 * top, the calm page for a link that is off, a character's picture (or the person's letter in Krovvi's dots when
 * there is none), and the way on: Open in Krovvi on an iPhone that has it, Get Krovvi (src/lib/site.ts) for
 * everyone else.
 */

import { useCallback, useEffect, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";

import { Mark } from "@/components/mark";
import { Face, INK, STEP } from "@/components/objects/kit";
import { say, type Lang, type Words } from "@/lib/objects";
import { JOIN_URL } from "@/lib/site";
import type { Reaction, WebCharacter } from "@/lib/together";

export const C = {
  get: { en: "Get Krovvi", ar: "حمّل كروفي" },
  open: { en: "Open in Krovvi", ar: "افتح في كروفي" },
  haveIt: { en: "Have Krovvi? Open this in the app", ar: "عندك كروفي؟ افتحها في الأبلكيشن" },
  noApp: { en: "Didn’t open? Krovvi isn’t on this phone yet.", ar: "ما فتحش؟ كروفي مش على الموبايل ده لسه." },
  notIphone: { en: "Krovvi is on iPhone.", ar: "كروفي على الآيفون." },
  off: { en: "This link is off", ar: "اللينك ده مقفول" },
  offLine: { en: "Whoever sent it may have turned it off. Check it was copied whole.", ar: "يمكن اللي بعته قفله. اتأكد إنه اتنسخ كامل." },
  offline: { en: "Can’t reach this right now", ar: "مش قادر أوصل للصفحة دي دلوقتي" },
  offlineLine: { en: "Check your connection, then try again.", ar: "اتأكد من النت وجرب تاني." },
  again: { en: "Try again", ar: "جرب تاني" },
} satisfies Record<string, Words>;

/* ── Reactions ─────────────────────────────────────────────────────────── */

const FACE = "M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z";

/** Each reaction's line drawing, on the 24 grid the site's marks use (components/objects/mark.tsx). */
const REACTION_PATHS: Record<Reaction, string> = {
  // Laughing: eyes shut tight, the mouth wide open.
  haha: `${FACE} M7.4 10.6l1.5-1.7 1.5 1.7 M13.6 10.6l1.5-1.7 1.5 1.7 M7.8 13.6h8.4a4.2 4.2 0 0 1-8.4 0z`,
  love: "M12 20s-8-4.7-8-10.4A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8 2.6C20 15.3 12 20 12 20z",
  // Amazed: round eyes, a round mouth.
  wow: `${FACE} M9 9.4a.6.6 0 1 1 0 1.2.6.6 0 0 1 0-1.2z M15 9.4a.6.6 0 1 1 0 1.2.6.6 0 0 1 0-1.2z M12 13.3a2 2.4 0 1 1 0 4.8 2 2.4 0 0 1 0-4.8z`,
  // "I'm dead": crossed eyes and the tongue out.
  dead: `${FACE} M7.5 8.6l2.6 2.6 M10.1 8.6l-2.6 2.6 M13.9 8.6l2.6 2.6 M16.5 8.6l-2.6 2.6 M8.4 15h7.2 M13.8 15v1.6a1.45 1.45 0 0 1-2.9 0V15`,
};

export const REACTION_WORDS: Record<Reaction, Words> = {
  haha: { en: "Haha", ar: "هههه" },
  love: { en: "Love", ar: "حبيته" },
  wow: { en: "Wow", ar: "واو" },
  dead: { en: "Dead", ar: "موّتني" },
};

export function ReactionIcon({ kind, size = 22, color = "currentColor", weight = 1.7 }: { kind: Reaction; size?: number; color?: string; weight?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: "block", flex: "none" }}>
      <path d={REACTION_PATHS[kind]} />
    </svg>
  );
}

/* ── The page around everything ────────────────────────────────────────── */

/** The K and the name, home; and on a post, the quiet way to get the app (as the object pages have it). */
export function Head({ lang, get = false }: { lang: Lang; get?: boolean }) {
  return (
    <div className="flex items-center justify-between" style={{ height: 56 }}>
      <a href="/" className="flex items-center gap-2" aria-label="Krovvi">
        <Mark size={22} />
        <span style={{ ...STEP.label, fontWeight: 600 }}>Krovvi</span>
      </a>
      {get ? (
        <a href={JOIN_URL} onClick={keepLink} className="rounded-full transition-transform active:scale-[0.97]" style={{ ...STEP.label, fontWeight: 600, padding: "6px 12px", background: INK.surfaceHi, color: INK.fg }}>
          {say(C.get, lang)}
        </a>
      ) : null}
    </div>
  );
}

export function Shell({ lang, children, width = 600, get = false, style }: { lang: Lang; children: ReactNode; width?: number; get?: boolean; style?: CSSProperties }) {
  return (
    <main dir={lang === "ar" ? "rtl" : "ltr"} lang={lang} className="mx-auto min-h-dvh w-full px-4" style={{ maxWidth: width, background: INK.bg, color: INK.fg, paddingBottom: "max(32px, env(safe-area-inset-bottom))", ...style }}>
      <Head lang={lang} get={get} />
      {children}
    </main>
  );
}

/** A link that is off (removed, turned off, or never one), or one that cannot be reached right now. No picture, no blame. */
export function OffPage({ lang, offline = false, onAgain }: { lang: Lang; offline?: boolean; onAgain?: () => void }) {
  return (
    <Shell lang={lang} width={520}>
      <div className="py-24 text-center">
        <h1 style={{ ...STEP.title, fontSize: 22, lineHeight: "28px" }}>{say(offline ? C.offline : C.off, lang)}</h1>
        <p className="mx-auto mt-2 max-w-[340px]" style={{ ...STEP.body, color: INK.muted }}>
          {say(offline ? C.offlineLine : C.offLine, lang)}
        </p>
        {offline && onAgain ? (
          <button type="button" onClick={onAgain} className="mt-6 rounded-full active:scale-[0.98]" style={{ ...STEP.label, fontWeight: 600, padding: "10px 18px", background: INK.surfaceHi, color: INK.fg }}>
            {say(C.again, lang)}
          </button>
        ) : null}
        <div className="mt-12">
          <a href={JOIN_URL} className="underline decoration-dotted underline-offset-4" style={{ ...STEP.meta, color: INK.faint }}>
            {say(C.get, lang)}
          </a>
        </div>
      </div>
    </Shell>
  );
}

/** While the first read is still on its way in the browser (the server's read could not be had). */
export function Waiting({ lang }: { lang: Lang }) {
  return (
    <Shell lang={lang} width={520}>
      <div className="flex justify-center py-24" role="status" aria-label={lang === "ar" ? "بيحمّل" : "Loading"}>
        <Mark size={34} className="animate-pulse" />
      </div>
    </Shell>
  );
}

/* ── People ────────────────────────────────────────────────────────────── */

/** A character's picture, square with soft corners; the person's letter in Krovvi's dots when it has none. */
export function CharacterPic({ character, name, size, radius, priority = false }: { character: WebCharacter | null; name: string; size: number; radius?: number; priority?: boolean }) {
  const [broken, setBroken] = useState(false);
  const image = character?.image;
  if (!image || broken) {
    return (
      <span className="inline-flex shrink-0 items-center justify-center overflow-hidden" style={{ width: size, height: size, borderRadius: radius ?? size / 2, background: INK.surfaceHi }} aria-hidden>
        <Face name={name} size={Math.round(size * (radius === undefined ? 1 : 0.62))} />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image.url}
      alt=""
      width={size}
      height={size}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className="shrink-0 object-cover"
      style={{ width: size, height: size, borderRadius: radius ?? size / 2, background: INK.surfaceHi }}
      // A picture whose short-lived link ran out leaves the letter, never a broken picture.
      onError={() => setBroken(true)}
    />
  );
}

/* ── The way on ────────────────────────────────────────────────────────── */

/** Whether this is an iPhone or iPad, where Krovvi runs (an iPad says it is a Mac, with a touch screen). */
export function onIos(): boolean {
  try {
    return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  } catch {
    return false;
  }
}

/** The server's guess from the user agent, then the browser's own answer (it alone can tell an iPad). */
export function useIos(guess: boolean): boolean {
  const [ios, setIos] = useState(guess);
  useEffect(() => setIos(onIos()), []);
  return ios;
}

/** The link goes with them: once Krovvi is installed it can offer to open the link they copied. */
export function keepLink(): void {
  try {
    void navigator.clipboard?.writeText(window.location.href);
  } catch {
    // Getting the app works the same without it.
  }
}

/** How long the page waits for the app to take over before it says the app is not there. */
const APP_WAIT_MS = 1800;

/**
 * Open in Krovvi and Get Krovvi. `lead` says which one stands first on an iPhone: a post leads with Get Krovvi (most
 * people who open one do not have Krovvi yet), an invite with Open in Krovvi (only the app can say yes to it). If the
 * app does not take over, the page says so and offers it. Anywhere else there is no app to open: Get Krovvi, and
 * that Krovvi is on iPhone.
 */
export function WaysOn({ lang, deep, ios, lead }: { lang: Lang; deep: string; ios: boolean; lead: "get" | "open" }) {
  const [noApp, setNoApp] = useState(false);
  const tryApp = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      setNoApp(false);
      let timer = 0;
      const stop = () => {
        window.clearTimeout(timer);
        document.removeEventListener("visibilitychange", hidden);
        window.removeEventListener("pagehide", stop);
      };
      const hidden = () => {
        if (document.visibilityState === "hidden") stop();
      };
      timer = window.setTimeout(() => {
        stop();
        if (document.visibilityState === "visible") setNoApp(true);
      }, APP_WAIT_MS);
      document.addEventListener("visibilitychange", hidden);
      window.addEventListener("pagehide", stop);
      window.location.href = deep;
    },
    [deep]
  );

  const big = "flex h-[52px] w-full items-center justify-center rounded-full transition-transform active:scale-[0.98]";
  const strong: CSSProperties = { ...STEP.body, fontSize: 16, fontWeight: 600, background: INK.fg, color: INK.bg };
  const quiet: CSSProperties = { ...STEP.body, fontSize: 16, fontWeight: 600, background: INK.surfaceHi, color: INK.fg };
  const get = (style: CSSProperties) => (
    <a href={JOIN_URL} onClick={keepLink} className={big} style={style}>
      {say(C.get, lang)}
    </a>
  );

  if (!ios) {
    return (
      <div>
        {get(strong)}
        <p className="mt-2 text-center" style={{ ...STEP.meta, color: INK.muted }}>{say(C.notIphone, lang)}</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col" style={{ gap: 10 }}>
      {lead === "open" ? (
        <>
          <a href={deep} onClick={tryApp} className={big} style={strong}>
            {say(C.open, lang)}
          </a>
          {get(quiet)}
        </>
      ) : (
        <>
          {get(strong)}
          <a href={deep} onClick={tryApp} className="flex min-h-[44px] items-center justify-center text-center underline decoration-dotted underline-offset-4" style={{ ...STEP.label, color: INK.soft }}>
            {say(C.haveIt, lang)}
          </a>
        </>
      )}
      {noApp ? (
        <p className="text-center" role="status" style={{ ...STEP.meta, color: INK.muted }}>
          {say(C.noApp, lang)}
        </p>
      ) : null}
    </div>
  );
}
