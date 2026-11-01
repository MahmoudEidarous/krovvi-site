"use client";

/**
 * Two Krovvis talking (Krovvi Talks, catch8 docs/TOGETHER-2026-11-01.md): each Krovvi as its person's character, one
 * on each side, as a chat. The first time this browser sees it, it plays: line by line in the places they will
 * stand (so the page never jumps), paced by how long the line before was, starting once the talk is on screen. After
 * that it shows whole, with Replay. While the talk is still going (the server's `done` is false) new lines play as
 * they come and the other side is shown typing. With reduced motion, or no scripts, every line is simply there.
 */

import { useEffect, useRef, useState } from "react";

import { EASE, INK, STEP, tintOf } from "@/components/objects/kit";
import { say, type Lang, type Words } from "@/lib/objects";
import { markSeen, seenBefore, type WebCharacter, type WebPostView } from "@/lib/together";
import { CharacterPic } from "./bits";

const C = {
  krovvi: { en: "{name}’s Krovvi", ar: "كروفي {name}" },
  replay: { en: "Replay", ar: "شغّلها تاني" },
  all: { en: "Show it all", ar: "اعرضها كلها" },
  typing: { en: "{name} is typing", ar: "{name}، جاري الكتابة" },
} satisfies Record<string, Words>;

/** How long a line stays alone before the next one: long enough to read it, never long enough to wait. */
export function paceAfter(text: string): number {
  return Math.max(900, Math.min(2600, 650 + text.length * 24));
}

interface Side {
  name: string;
  label: string;
  character: WebCharacter | null;
}

function sideOf(person: string, post: WebPostView, lang: Lang): Side {
  const member = post.cast.find((m) => m.name === person) ?? null;
  const character = member?.character ?? null;
  return { name: person, label: character?.name ?? say(C.krovvi, lang).replace("{name}", person), character };
}

export function TalkBody({ post, lang, token }: { post: WebPostView; lang: Lang; token: string }) {
  const talk = post.talk!;
  const lines = talk.lines;
  const sides = { a: sideOf(talk.a, post, lang), b: sideOf(talk.b, post, lang) };
  // "wait" is the server's drawing and the first one in the browser: the lines hold their places, unseen, until the
  // browser knows whether this person has watched it before.
  const [mode, setMode] = useState<"wait" | "play" | "all">("wait");
  const [shown, setShown] = useState(lines.length);
  const [inView, setInView] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || seenBefore(token)) {
      setMode("all");
      setShown(lines.length);
    } else {
      setMode("play");
      setShown(0);
    }
    // Only the first drawing decides; new lines that come later play on their own (below).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    const el = box.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const seen = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setInView(true), { threshold: 0.2 });
    seen.observe(el);
    return () => seen.disconnect();
  }, []);

  // A live talk's new lines play as they come, whether this browser had seen the start or not.
  useEffect(() => {
    if (mode === "all" && lines.length > shown) setMode("play");
  }, [mode, lines.length, shown]);

  useEffect(() => {
    if (mode !== "play" || !inView) return;
    if (shown >= lines.length) {
      if (talk.done) {
        markSeen(token);
        setMode("all");
      }
      return;
    }
    const wait = shown === 0 ? 450 : paceAfter(lines[shown - 1].text);
    const t = window.setTimeout(() => setShown((s) => Math.min(lines.length, s + 1)), wait);
    return () => window.clearTimeout(t);
  }, [mode, inView, shown, lines, talk.done, token]);

  const visible = (i: number) => mode === "all" || (mode === "play" && i < shown);
  const caughtUp = mode !== "wait" && shown >= lines.length;
  const last = lines[lines.length - 1];
  const nextSide: "a" | "b" = last ? (last.side === "a" ? "b" : "a") : "a";

  return (
    <div ref={box}>
      <div className="flex flex-col" style={{ gap: 4 }}>
        {lines.map((line, i) => {
          const side = sides[line.side];
          const startRun = i === 0 || lines[i - 1].side !== line.side;
          const endRun = i === lines.length - 1 || lines[i + 1].side !== line.side;
          return <Line key={i} start={line.side === "a"} side={side} text={line.text} startRun={startRun} endRun={endRun} on={visible(i)} />;
        })}
        {!talk.done && caughtUp ? <Typing start={nextSide === "a"} side={sides[nextSide]} lang={lang} /> : null}
      </div>
      {mode === "play" && lines.length - shown >= 2 ? (
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={() => {
              setShown(lines.length);
              if (talk.done) markSeen(token);
              setMode("all");
            }}
            className="rounded-full"
            style={{ ...STEP.label, padding: "8px 14px", color: INK.soft, background: "transparent" }}
          >
            {say(C.all, lang)}
          </button>
        </div>
      ) : null}
      {talk.done && mode === "all" && lines.length > 1 ? (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => {
              setShown(0);
              setMode("play");
            }}
            className="flex items-center rounded-full transition-transform active:scale-[0.97]"
            style={{ ...STEP.label, fontWeight: 600, gap: 7, padding: "8px 14px 8px 12px", background: INK.surfaceHi, color: INK.fg }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v3.6h3.6" />
            </svg>
            {say(C.replay, lang)}
          </button>
        </div>
      ) : null}
      {/* Without scripts nothing would ever play: every line is simply there. */}
      <noscript>
        <style>{`.tg-line{opacity:1!important;transform:none!important}`}</style>
      </noscript>
    </div>
  );
}

/** One line: the character's picture on the outside edge of the first line in a run, its name in its own ink. */
function Line({ start, side, text, startRun, endRun, on }: { start: boolean; side: Side; text: string; startRun: boolean; endRun: boolean; on: boolean }) {
  const tint = tintOf(side.name);
  const round = 18;
  const tight = 6;
  return (
    <div
      className="tg-line flex items-end"
      style={{
        flexDirection: start ? "row" : "row-reverse",
        gap: 8,
        marginTop: startRun ? 10 : 0,
        opacity: on ? 1 : 0,
        transform: on ? "none" : "translateY(6px)",
        transition: `opacity 320ms ${EASE}, transform 320ms ${EASE}`,
      }}
    >
      <span className="shrink-0" style={{ width: 32, height: 32 }} aria-hidden>
        {endRun ? <CharacterPic character={side.character} name={side.name} size={32} /> : null}
      </span>
      <div className="flex min-w-0 flex-col" style={{ alignItems: start ? "flex-start" : "flex-end", maxWidth: "78%" }}>
        {startRun ? (
          <span className="truncate" style={{ ...STEP.meta, fontWeight: 600, color: tint, margin: "0 4px 3px", maxWidth: "100%" }}>
            <bdi dir="auto">{side.label}</bdi>
          </span>
        ) : null}
        {/* The bubble keeps the page's direction (its corners face its own side); the words inside take their own. */}
        <div
          style={{
            fontSize: 16,
            lineHeight: "22px",
            letterSpacing: "-0.2px",
            background: INK.surfaceHi,
            color: INK.fg,
            padding: "8px 13px",
            borderRadius: round,
            // As a messaging app draws a run: the top of a run round, every corner on the speaker's side tight after it.
            ...(start ? { borderStartStartRadius: startRun ? round : tight, borderEndStartRadius: tight } : { borderStartEndRadius: startRun ? round : tight, borderEndEndRadius: tight }),
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          <div dir="auto" style={{ textAlign: "start" }}>
            {text}
          </div>
        </div>
      </div>
    </div>
  );
}

/** The other side, typing: three dots that breathe in turn, for a talk that is still going. */
function Typing({ start, side, lang }: { start: boolean; side: Side; lang: Lang }) {
  return (
    <div className="flex items-end" style={{ flexDirection: start ? "row" : "row-reverse", gap: 8, marginTop: 10 }} role="status" aria-label={say(C.typing, lang).replace("{name}", side.label)}>
      <span className="shrink-0" aria-hidden>
        <CharacterPic character={side.character} name={side.name} size={32} />
      </span>
      <div className="flex items-center" style={{ gap: 4, height: 38, padding: "0 14px", borderRadius: 18, background: INK.surfaceHi }} aria-hidden>
        {[0, 1, 2].map((i) => (
          <span key={i} className="tg-typing" style={{ width: 6, height: 6, borderRadius: 3, background: INK.soft, animationDelay: `${i * 160}ms` }} />
        ))}
      </div>
      <style>{`.tg-typing{animation:tg-typing 1200ms ${EASE} infinite;opacity:.35}@keyframes tg-typing{0%,60%,100%{opacity:.35}30%{opacity:1}}@media (prefers-reduced-motion:reduce){.tg-typing{animation:none;opacity:.7}}`}</style>
    </div>
  );
}
