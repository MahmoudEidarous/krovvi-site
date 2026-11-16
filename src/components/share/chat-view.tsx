"use client";

/**
 * A shared chat on the page, drawn as the app draws it: the person's
 * messages on the right (several in a row as one group), Krovvi's texting
 * bubbles on the left with the full answer between them, Krovvi's reaction
 * on the message it answered, the person's own reactions on Krovvi's pieces,
 * a message heard while Krovvi worked in its place, the photos and files,
 * and a question card with what was picked. Read with the chat's own reader
 * (lib/answer/reply-format.ts, copied from the app).
 *
 * A long chat stays light (16 November 2026): a turn out of sight is not
 * laid out or painted until it comes near (content-visibility), and a photo
 * is fetched only as it nears the screen. A photo whose hour-long link has
 * run out asks the page once for a fresh one before it is left out.
 */

import { createContext, memo, useContext, useState } from "react";

import { INK, STEP } from "@/components/objects/kit";
import { BURST_SEP, replyParts, type ReplyPart } from "@/lib/answer/reply-format";
import { inline, Markdown, ShareMedia, type RenderEnv } from "./markdown";
import type { ShareCard } from "./cards";

/** A turn's photo that did not load: the page fetches fresh links for that turn's part once (share-page.tsx). */
export const PhotoAgain = createContext<((turn: number) => void) | null>(null);

export interface SnapTurn {
  at: number;
  q: string;
  photos: number[];
  a: string;
  style: "mixed" | "classic";
  reactions: Record<string, string>;
  heard: Record<string, string>;
  cards: Record<string, ShareCard>;
  files: Array<{ title: string; format: string; media: number }>;
  ask: { questions: Array<{ question: string; choices: string[] }>; answered: string | null } | null;
  stopped: boolean;
}

export interface ChatSnapshot {
  v: 1;
  kind: "chat";
  title: string;
  lang: "en" | "ar";
  dir: "ltr" | "rtl";
  made_at: number;
  name: string | null;
  turns: SnapTurn[];
}

export type MediaUrls = Record<number, { url: string; mime: string }>;

const BUBBLE = { fontSize: 16, lineHeight: "23px", letterSpacing: "-0.15px" } as const;

function Badge({ emoji, side }: { emoji: string; side: "start" | "end" }) {
  return (
    <span
      className="absolute flex items-center justify-center rounded-full"
      style={{ top: -13, [side === "start" ? "insetInlineStart" : "insetInlineEnd"]: -11, width: 28, height: 28, background: INK.surfaceHi, border: `2px solid ${INK.bg}`, fontSize: 15 }}
      aria-hidden
    >
      {emoji}
    </span>
  );
}

/**
 * The photos above a message. Fetched as they near the screen, never all at page load. One that does not load asks
 * once for a fresh link (an hour-long link runs out on a page left open), and a photo that still does not load leaves
 * no broken picture behind.
 */
function Photos({ photos, media, turn }: { photos: number[]; media: MediaUrls; turn: number }) {
  const again = useContext(PhotoAgain);
  // By photo, not by link: a photo that is gone from storage asks once, then is left out, however many links it gets.
  const [asked, setAsked] = useState<ReadonlySet<number>>(new Set());
  const [lost, setLost] = useState<ReadonlySet<number>>(new Set());
  const shown = photos.filter((p) => media[p] && !lost.has(p));
  if (!shown.length) return null;
  return (
    <div className="flex flex-wrap justify-end" style={{ gap: 4, maxWidth: "78%" }}>
      {shown.map((p) => (
        // A tap opens the photo whole, in its own tab.
        <a key={p} href={media[p].url} target="_blank" rel="noopener noreferrer" className="block active:opacity-80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={media[p].url}
            alt=""
            loading="lazy"
            decoding="async"
            width={photos.length === 1 ? 220 : 120}
            height={photos.length === 1 ? 220 : 120}
            className="object-cover"
            style={{ width: photos.length === 1 ? 220 : 120, height: photos.length === 1 ? 220 : 120, borderRadius: 13, background: INK.surface }}
            onError={() => {
              if (again && !asked.has(p)) {
                setAsked((s) => new Set(s).add(p));
                again(turn);
              } else setLost((s) => new Set(s).add(p));
            }}
          />
        </a>
      ))}
    </div>
  );
}

/** The person's messages: one group of bubbles on the right, Krovvi's reaction on the last one. */
function Person({ texts, photos, media, reaction, turn = -1 }: { texts: string[]; photos: number[]; media: MediaUrls; reaction: string | null; turn?: number }) {
  const shown = texts.map((t) => t.trim()).filter(Boolean);
  // A turn of Krovvi's own (a made file's receipt) has no message of theirs above it.
  if (!shown.length && !photos.length) return null;
  return (
    <div className="flex flex-col items-end" style={{ gap: 4, margin: "16px 0 4px" }}>
      {photos.length ? <Photos photos={photos} media={media} turn={turn} /> : null}
      {shown.map((t, n) => (
        <div key={n} className="relative" style={{ maxWidth: "78%" }}>
          <div dir="auto" style={{ ...BUBBLE, background: INK.surfaceHi, color: INK.fg, padding: "8px 13px", borderRadius: 17, borderEndEndRadius: n === shown.length - 1 ? 6 : 17, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {t}
          </div>
          {reaction && n === shown.length - 1 ? <Badge emoji={reaction} side="start" /> : null}
        </div>
      ))}
    </div>
  );
}

function Say({ text, reaction, last }: { text: string; reaction: string | null; last: boolean }) {
  return (
    <div className="relative" style={{ maxWidth: "78%", alignSelf: "flex-start" }}>
      {/* A bubble holds words, links and pills only: never a heading, a list or a fence (the reply contract). */}
      <div dir="auto" style={{ ...BUBBLE, background: INK.surface, color: INK.fg, padding: "8px 13px", borderRadius: 17, borderEndStartRadius: last ? 6 : 17 }}>
        {inline(text, "say")}
      </div>
      {reaction ? <Badge emoji={reaction} side="end" /> : null}
    </div>
  );
}

function Files({ files, media, lang }: { files: SnapTurn["files"]; media: MediaUrls; lang: "en" | "ar" }) {
  if (!files.length) return null;
  return (
    <div className="flex flex-col" style={{ gap: 6, marginTop: 4 }}>
      {files.map((f, n) => (
        <a key={n} href={media[f.media]?.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 active:opacity-70" style={{ background: INK.surface, borderRadius: 13, padding: "10px 12px", maxWidth: 360 }}>
          <span className="flex items-center justify-center" style={{ width: 34, height: 40, borderRadius: 6, background: f.format === "pdf" ? "#E5484D" : f.format === "xlsx" ? "#30A46C" : f.format === "docx" ? "#3E7BFA" : f.format === "pptx" ? "#F76B15" : INK.surfaceHi, ...STEP.meta, fontWeight: 700, color: "#fff" }}>
            {f.format.toUpperCase().slice(0, 4)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate" style={{ ...STEP.body, fontWeight: 500 }}>
              <bdi>{f.title}</bdi>
            </span>
            <span className="block" style={{ ...STEP.meta, color: INK.muted }}>{lang === "ar" ? "افتح الملف" : "Open the file"}</span>
          </span>
        </a>
      ))}
    </div>
  );
}

function Ask({ ask, lang }: { ask: NonNullable<SnapTurn["ask"]>; lang: "en" | "ar" }) {
  return (
    <div style={{ background: INK.surface, borderRadius: 17, padding: "12px 16px", marginTop: 4 }}>
      {ask.questions.map((q, n) => (
        <div key={n} style={{ marginBottom: n < ask.questions.length - 1 ? 10 : 0 }}>
          <div dir="auto" style={{ ...STEP.body, fontWeight: 600 }}>{q.question}</div>
          <div className="flex flex-wrap" style={{ gap: 6, marginTop: 6 }}>
            {q.choices.map((c, m) => {
              const picked = ask.answered && ask.answered.toLowerCase().includes(c.toLowerCase());
              return (
                <span key={m} dir="auto" className="rounded-full" style={{ ...STEP.label, padding: "5px 11px", background: picked ? INK.fg : INK.surfaceHi, color: picked ? INK.bg : INK.soft }}>
                  {c}
                </span>
              );
            })}
          </div>
        </div>
      ))}
      {ask.answered ? <div dir="auto" style={{ ...STEP.meta, color: INK.muted, marginTop: 8 }}>{lang === "ar" ? `اتجاوب: ${ask.answered}` : `Answered: ${ask.answered}`}</div> : null}
    </div>
  );
}

/**
 * A turn out of sight is kept, but not laid out or painted until it comes near: a chat of three hundred long answers
 * costs the browser what its screen shows. `auto` keeps a turn's real height once it has been drawn, so the page does
 * not jump when it is scrolled back.
 */
const OFFSCREEN = { contentVisibility: "auto", containIntrinsicSize: "auto 640px" } as const;

/** The photos and files one turn shows, as the copy names them (its photos, its files, the files its words link). */
export function mediaOfTurn(turn: SnapTurn, all: MediaUrls): MediaUrls {
  const ids = new Set<number>([...(turn.photos ?? []), ...(turn.files ?? []).map((f) => f.media)]);
  for (const m of (turn.a ?? "").matchAll(/\]\(share:file\?m=(\d{1,4})\)/g)) ids.add(Number(m[1]));
  const out: MediaUrls = {};
  for (const id of ids) if (all[id]) out[id] = all[id];
  return out;
}

/** A turn and the links for its own photos and files: a part that arrives later, with links for its own, never redraws this one. */
export type TurnItem = { turn: SnapTurn; media: MediaUrls };

/** One turn: the person's messages, then Krovvi's reply in its parts. Drawn once, unless its own links change. */
const Turn = memo(function Turn({ turn, media, lang, index }: { turn: SnapTurn; media: MediaUrls; lang: "en" | "ar"; index: number }) {
  const env: RenderEnv = { cards: turn.cards, lang };
  const parts = replyParts(turn.a, { mixed: turn.style === "mixed", final: true });
  const reaction = (parts.find((p) => p.kind === "react") as Extract<ReplyPart, { kind: "react" }> | undefined)?.emoji ?? null;
  let piece = -1;
  return (
    <div style={OFFSCREEN}>
      <ShareMedia.Provider value={media}>
      <Person texts={turn.q.split(BURST_SEP)} photos={turn.photos} media={media} reaction={reaction} turn={index} />
      <div className="flex flex-col" style={{ gap: 4, marginTop: 8 }}>
        {parts.map((p, n) => {
          if (p.kind === "react") return null;
          if (p.kind === "heard") {
            const words = turn.heard[p.turnId];
            return words ? <Person key={n} texts={[words]} photos={[]} media={media} reaction={null} /> : null;
          }
          piece += 1;
          const mine = turn.reactions[String(piece)] ?? null;
          if (p.kind === "say") {
            const next = parts.slice(n + 1).find((x) => x.kind !== "react");
            return <Say key={n} text={p.text} reaction={mine} last={!next || next.kind !== "say"} />;
          }
          return (
            <div key={n} className="relative" style={{ margin: "6px 0" }}>
              <Markdown text={p.text} env={env} />
              {mine ? (
                <span className="inline-flex items-center rounded-full" style={{ ...STEP.meta, background: INK.surfaceHi, padding: "2px 8px" }} aria-label={lang === "ar" ? "رد فعل" : "Reaction"}>
                  {mine}
                </span>
              ) : null}
            </div>
          );
        })}
        <Files files={turn.files} media={media} lang={lang} />
        {turn.ask ? <Ask ask={turn.ask} lang={lang} /> : null}
        {turn.stopped ? <div style={{ ...STEP.meta, color: INK.muted }}>{lang === "ar" ? "اتوقف" : "Stopped"}</div> : null}
      </div>
      </ShareMedia.Provider>
    </div>
  );
});

export function ChatView({ items, lang }: { items: TurnItem[]; lang: "en" | "ar" }) {
  return (
    <>
      {items.map((it, n) => (
        <Turn key={n} turn={it.turn} media={it.media} lang={lang} index={n} />
      ))}
    </>
  );
}
