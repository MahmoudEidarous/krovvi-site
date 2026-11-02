"use client";

/**
 * The post's picture, big and first: an episode's four panels in one picture, or a character. A tap opens it on its
 * own over the page (the panels' speech bubbles are small on a phone), a second tap looks closer where it was
 * tapped, and Close, Escape or a tap outside it goes back. Episodes keep their words under the picture too: the hook
 * for next time, and the panels as text ("Read it"), for a screen reader, an Arabic reader, or a picture that did
 * not come (a failed picture leaves the words).
 */

import { useEffect, useRef, useState } from "react";

import { INK, STEP } from "@/components/objects/kit";
import { say, type Lang, type Words } from "@/lib/objects";
import type { Picture, WebPostView } from "@/lib/together";

const C = {
  zoom: { en: "Open the picture", ar: "افتح الصورة" },
  close: { en: "Close", ar: "اقفل" },
  closer: { en: "Tap to look closer", ar: "دوس عشان تقرّب" },
  next: { en: "Next time", ar: "المرة الجاية" },
  read: { en: "Read it", ar: "اقراها" },
  panel: { en: "Panel {n}", ar: "المشهد {n}" },
  episode: { en: "Episode {n}", ar: "الحلقة {n}" },
} satisfies Record<string, Words>;

/** The picture, sized before it loads so nothing jumps, and a button that opens it whole. */
export function BigPicture({ picture, alt, lang, square = false, priority = true }: { picture: Picture; alt: string; lang: Lang; square?: boolean; priority?: boolean }) {
  const [open, setOpen] = useState(false);
  const [broken, setBroken] = useState(false);
  if (broken) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={say(C.zoom, lang)}
        className="block w-full overflow-hidden transition-transform active:scale-[0.99]"
        style={{ borderRadius: 20, background: INK.surfaceHi, aspectRatio: square ? "1 / 1" : `${picture.w} / ${picture.h}`, cursor: "zoom-in" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={picture.url}
          alt={alt}
          width={picture.w}
          height={picture.h}
          fetchPriority={priority ? "high" : "auto"}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="block h-full w-full object-cover"
          onError={() => setBroken(true)}
        />
      </button>
      {open ? <Zoom picture={picture} alt={alt} lang={lang} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

/** The picture on its own, over the page. A tap looks closer where it landed; a tap outside or Close goes back. */
function Zoom({ picture, alt, lang, onClose }: { picture: Picture; alt: string; lang: Lang; onClose: () => void }) {
  const [closer, setCloser] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden";
    close.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
      root.style.overflow = overflow;
      before?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={alt.slice(0, 120)} style={{ background: "rgba(5,5,5,0.96)" }}>
      <div ref={box} className="absolute inset-0" style={{ overflow: closer ? "auto" : "hidden", display: "flex", alignItems: closer ? "flex-start" : "center", justifyContent: closer ? "flex-start" : "center" }} onClick={(e) => e.target === e.currentTarget && onClose()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={picture.url}
          alt={alt}
          width={picture.w}
          height={picture.h}
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const fx = (e.clientX - r.left) / r.width;
            const fy = (e.clientY - r.top) / r.height;
            const next = !closer;
            setCloser(next);
            // Looking closer keeps the tapped spot under the finger, as a photo app does.
            if (next)
              requestAnimationFrame(() => {
                const el = box.current;
                if (el) el.scrollTo({ left: el.scrollWidth * fx - el.clientWidth / 2, top: el.scrollHeight * fy - el.clientHeight / 2 });
              });
          }}
          style={
            closer
              ? { width: "min(220vw, 2400px)", maxWidth: "none", height: "auto", cursor: "zoom-out" }
              : { maxWidth: "100vw", maxHeight: "100dvh", width: "auto", height: "auto", objectFit: "contain", cursor: "zoom-in" }
          }
        />
      </div>
      <button
        ref={close}
        type="button"
        onClick={onClose}
        className="absolute flex items-center justify-center rounded-full active:scale-[0.96]"
        style={{ top: "max(12px, env(safe-area-inset-top))", insetInlineEnd: 12, width: 44, height: 44, background: "rgba(31,31,30,0.86)", color: INK.fg }}
        aria-label={say(C.close, lang)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
          <path d="M5 5l14 14M19 5L5 19" />
        </svg>
      </button>
      {!closer ? (
        <p className="pointer-events-none absolute inset-x-0 text-center" style={{ ...STEP.meta, color: INK.muted, bottom: "max(16px, env(safe-area-inset-bottom))" }}>
          {say(C.closer, lang)}
        </p>
      ) : null}
    </div>
  );
}

/** The episode's words as one line for a screen reader: the show, then every bubble in reading order. */
function episodeAlt(post: WebPostView, lang: Lang): string {
  const ep = post.episode;
  if (!ep) return post.title;
  const head = [ep.showTitle, say(C.episode, lang).replace("{n}", String(ep.episodeNo))].filter(Boolean).join(", ");
  const said = ep.panels.flatMap((p) => p.lines.map((l) => (l.who ? `${l.who}: ${l.says}` : l.says)));
  return `${head}. ${said.join(" ")}`.slice(0, 700);
}

/** An episode: the four panels in one picture, the hook for next time, and the panels as text. */
export function EpisodeBody({ post, lang }: { post: WebPostView; lang: Lang }) {
  const ep = post.episode;
  const picture = post.cover;
  return (
    <div>
      {picture ? <BigPicture picture={picture} alt={episodeAlt(post, lang)} lang={lang} /> : null}
      {ep?.cliffhanger ? (
        <div className="mt-5">
          <p style={{ ...STEP.label, fontSize: 12, fontWeight: 600, letterSpacing: lang === "ar" ? 0 : "0.12em", textTransform: "uppercase", color: INK.muted }}>{say(C.next, lang)}</p>
          <p className="mt-1" style={{ ...STEP.title, fontSize: 19, lineHeight: "26px", fontWeight: 500, textAlign: "start" }}>
            <bdi dir="auto">{ep.cliffhanger}</bdi>
          </p>
        </div>
      ) : null}
      {ep && ep.panels.some((p) => p.lines.length) ? (
        // Open when the picture did not come: then the words are the episode.
        <details className="tg-read mt-5" open={!picture} style={{ background: INK.surface, borderRadius: 17 }}>
          <summary className="flex cursor-pointer list-none items-center justify-between" style={{ ...STEP.label, fontWeight: 600, padding: "13px 16px", minHeight: 48 }}>
            <span>{say(C.read, lang)}</span>
            <svg className="tg-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={INK.muted} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </summary>
          <ol style={{ padding: "0 16px 14px" }}>
            {ep.panels.map((panel, i) => (
              <li key={i} style={{ paddingTop: i ? 12 : 2, borderTop: i ? `0.5px solid ${INK.line}` : "none", marginTop: i ? 12 : 0 }}>
                <p style={{ ...STEP.meta, color: INK.muted }}>{say(C.panel, lang).replace("{n}", String(i + 1))}</p>
                {panel.lines.map((l, j) => (
                  <p key={j} className="mt-1" style={{ ...STEP.body, textAlign: "start" }}>
                    {l.who ? (
                      <>
                        <bdi dir="auto" style={{ fontWeight: 600 }}>{l.who}</bdi>
                        {lang === "ar" ? ": " : ": "}
                      </>
                    ) : null}
                    <bdi dir="auto">{l.says}</bdi>
                  </p>
                ))}
              </li>
            ))}
          </ol>
        </details>
      ) : null}
      <style>{`.tg-read summary::-webkit-details-marker{display:none}.tg-read[open] .tg-chev{transform:rotate(180deg)}.tg-chev{transition:transform 200ms cubic-bezier(0.23,1,0.32,1)}`}</style>
    </div>
  );
}

/** A character: its picture big, and its line of lore under it. The name is the page's title, above. */
export function CharacterBody({ post, lang }: { post: WebPostView; lang: Lang }) {
  const own = post.cast[0]?.character ?? null;
  const picture = post.cover ?? own?.image ?? null;
  const name = post.character?.name ?? own?.name ?? post.title;
  const lore = post.character?.lore ?? own?.lore ?? "";
  return (
    <div className="mx-auto" style={{ maxWidth: 440 }}>
      {picture ? <BigPicture picture={picture} alt={lore ? `${name}: ${lore}` : name} lang={lang} square /> : null}
      {lore ? (
        <p className="mt-5 text-center" style={{ fontSize: 19, lineHeight: "27px", fontWeight: 400, letterSpacing: "-0.2px", color: INK.soft }}>
          <bdi dir="auto">{lore}</bdi>
        </p>
      ) : null}
    </div>
  );
}
