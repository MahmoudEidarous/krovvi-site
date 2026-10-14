/**
 * What the person sends in the chat, on their side, as the newest app draws it
 * (catch8 store build 20, 6edb7fca): a voice message (components/voice-note.tsx
 * VoiceBubble), a link as a card under their words (components/sent-link.tsx),
 * photos in their small grid (app/agent.tsx UserPhoto, styles.photoGrid and
 * sentPhoto) and a file's card (agent.tsx styles.sentFile). While Krovvi reads
 * what was sent, a band of light crosses it (components/answer/reading-light.tsx):
 * `reading` turns it on.
 *
 * Every picture is drawn here, never loaded: a photo or a link's picture is a
 * soft gradient (PHOTO) or a drawn receipt (ReceiptArt). Put the pieces in
 * DeepChat's column; each stands on the person's side by itself. Server
 * renderable.
 */

import "./deep.css";
import "./friend.css";

import type { CSSProperties, ReactNode } from "react";

import { emo, type Piece } from "./chat";
import { Icon } from "./glyphs";
import { C, HAIR, SCREEN, THREAD_SIDE } from "./tokens";

const cx = (...names: Array<string | false | null | undefined>) => names.filter(Boolean).join(" ") || undefined;

/** The person's bubble (components/answer/reply.tsx person): white at a whisper, no edge, the corner toward them tucked. */
const MINE = "rgba(255,255,255,0.09)";

/**
 * A band of light crossing what was sent while Krovvi reads it
 * (components/answer/reading-light.tsx): 55 percent of the width (48 at
 * least), white at 0.3 in its middle, one pass in 1500 ms, resting a moment
 * before the next. Not drawn with motion reduced. Lay it inside a box that
 * stands `width` wide.
 */
export function ReadingLight({ width, radius = 0, delay = 0 }: { width: number; radius?: number; delay?: number }) {
  const band = Math.max(48, Math.round(width * 0.55));
  return (
    <span aria-hidden="true" style={{ position: "absolute", inset: 0, borderRadius: radius, overflow: "hidden", pointerEvents: "none" }}>
      <span
        className="dkx-read"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: band,
          background: "linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%)",
          ...({ "--dk-from": `${-band}px`, "--dk-to": `${width}px`, "--dk-delay": `${delay}ms` } as CSSProperties),
        }}
      />
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* A voice message                                                     */
/* ------------------------------------------------------------------ */

/** A clip's clock (lib/voice-note.ts clock): 0:07, 1:23, 10:00. */
export function voiceClock(ms: number): string {
  const total = Math.max(0, Math.round((Number.isFinite(ms) ? ms : 0) / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/** lib/voice-note.ts barsFor: the bars a bubble draws over `count` slots, each the loudest of its share. */
export function barsFor(peaks: readonly number[], count: number): number[] {
  if (count <= 0) return [];
  if (!peaks.length) return Array.from({ length: count }, () => 0);
  return Array.from({ length: count }, (_, i) => {
    const from = Math.floor((i * peaks.length) / count);
    const to = Math.max(from + 1, Math.floor(((i + 1) * peaks.length) / count));
    let most = 0;
    for (let j = from; j < to && j < peaks.length; j += 1) most = Math.max(most, peaks[j] ?? 0);
    return most;
  });
}

/** A voice as the server keeps it (64 bars, lib/voice-note.ts PEAK_BARS): a sentence, a breath, a longer one, a pause, a short last word. */
export const VOICE_PEAKS: readonly number[] = [
  0.12, 0.34, 0.58, 0.71, 0.52, 0.66, 0.83, 0.61, 0.45, 0.72, 0.9, 0.68, 0.4, 0.22, 0.08, 0.05, 0.31, 0.62, 0.78, 0.55, 0.69, 0.88, 0.74, 0.5, 0.63, 0.81,
  0.95, 0.7, 0.48, 0.66, 0.79, 0.57, 0.35, 0.18, 0.06, 0.04, 0.09, 0.28, 0.52, 0.67, 0.84, 0.62, 0.49, 0.71, 0.86, 0.64, 0.42, 0.58, 0.73, 0.51, 0.3, 0.12,
  0.05, 0.04, 0.2, 0.46, 0.69, 0.82, 0.6, 0.38, 0.24, 0.14, 0.07, 0.03,
];

/** components/glyph.tsx Play: a triangle 0.85 of its size wide, nudged right by a fifth. */
function PlayGlyph({ size = 12, color = C.bg }: { size?: number; color?: string }) {
  return <span style={{ width: 0, height: 0, borderTop: `${size / 2}px solid transparent`, borderBottom: `${size / 2}px solid transparent`, borderLeft: `${size * 0.85}px solid ${color}`, marginLeft: size * 0.2 }} />;
}

/** components/glyph.tsx Pause: two round bars, the player's own. */
function PauseGlyph({ size = 12, color = C.bg }: { size?: number; color?: string }) {
  const bar = Math.max(2.5, size * 0.21);
  return (
    <span style={{ display: "flex", gap: Math.max(3, size * 0.28), height: size, alignItems: "center" }}>
      <span style={{ width: bar, height: size, borderRadius: bar / 2, background: color }} />
      <span style={{ width: bar, height: size, borderRadius: bar / 2, background: color }} />
    </span>
  );
}

/** components/voice-note.tsx:347-374: the bubble 248 wide, 8 in and 14 at its end, the play disc 32, the parts 10 apart. */
const VOICE_WIDTH = 248;

/**
 * A voice message the person sent (components/voice-note.tsx VoiceBubble):
 * their own bubble holding a voice instead of words, the ivory play disc,
 * the voice's bars (2.5 wide, about one every 5 points, 4 to 26 tall), faint
 * until played and ivory as they play, its length (or the speed while it
 * plays), and under it one quiet line of what it was about, never the words
 * themselves. `played` (0 to 1) lights the bars that have played;
 * `reading` passes Krovvi's reading light over them while it listens.
 * `unheard`: Krovvi could not hear it, and the line says so.
 */
export function VoiceNote({
  ms = 12000,
  peaks = VOICE_PEAKS,
  playing = false,
  played = 0,
  rate = 1,
  about,
  unheard = false,
  reading = false,
  width = VOICE_WIDTH,
  className,
  style,
}: Piece & {
  /** The clip's length. */
  ms?: number;
  /** Its loudness, 0 to 1, as many bars as kept (64). */
  peaks?: readonly number[];
  playing?: boolean;
  /** How far it has played, 0 to 1. */
  played?: number;
  /** Its speed while it plays: 1, 1.5 or 2. */
  rate?: 1 | 1.5 | 2;
  /** One line of what it was about ("How the Northline interview went"). */
  about?: string;
  unheard?: boolean;
  reading?: boolean;
  width?: number;
}) {
  // The wave takes what the play disc, the gaps and the length leave (voice-note.tsx:257-258, styles.wave).
  const waveWidth = width - 8 - 14 - 32 - 10 - 10 - 30;
  const bars = barsFor(peaks, Math.max(12, Math.floor(waveWidth / 5)));
  const at = played * ms;
  const shown = playing || played > 0 ? voiceClock(at) : voiceClock(ms);
  return (
    <div
      className={cx("dk", className)}
      role="group"
      aria-label={`Voice message, ${voiceClock(ms)}${about ? `. ${about}` : ""}`}
      style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", alignSelf: "flex-end", maxWidth: "82%", ...style }}
    >
      <div style={{ width, maxWidth: "100%", display: "flex", alignItems: "center", gap: 10, background: MINE, borderRadius: 21, borderBottomRightRadius: 7, padding: "8px 14px 8px 8px" }}>
        <span style={{ width: 32, height: 32, borderRadius: 16, background: C.fg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {playing ? <PauseGlyph /> : <PlayGlyph />}
        </span>
        <span style={{ position: "relative", flex: 1, minWidth: 0, height: 28, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {bars.map((bar, i) => (
            <span key={i} style={{ width: 2.5, height: 4 + bar * 22, borderRadius: 2, background: played > 0 && i / bars.length <= played ? C.fg : C.faint, flexShrink: 0 }} />
          ))}
          {reading ? <ReadingLight width={waveWidth} radius={4} /> : null}
        </span>
        {playing ? (
          <span style={{ minWidth: 30, height: 20, borderRadius: 10, padding: "0 6px", background: C.tile, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: C.fg, fontSize: 11, fontWeight: 600 }}>{rate === 1 ? "1×" : rate === 1.5 ? "1.5×" : "2×"}</span>
          </span>
        ) : (
          <span style={{ minWidth: 30, textAlign: "right", color: C.muted, fontSize: 12, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{shown}</span>
        )}
      </div>
      {unheard ? (
        <span style={{ color: C.faint, fontSize: 12.5, padding: "6px 4px 0" }}>Couldn&apos;t hear this one</span>
      ) : about ? (
        <span style={{ alignSelf: "stretch", color: C.soft, fontSize: 13.5, lineHeight: "19px", padding: "6px 4px 0", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{about}</span>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pictures, drawn                                                     */
/* ------------------------------------------------------------------ */

/**
 * Photos drawn with CSS, for what people send (never an outside picture): a
 * river path at dusk, a city's roofs in the evening, a dinner table by
 * candlelight, the sea, a green park, and a page of notes.
 */
export const PHOTO = {
  river: "linear-gradient(180deg, #2a3854 0%, #5e5f84 34%, #c48d6c 49%, #e0b27d 51%, #435068 52%, #2c3a4f 70%, #1a2232 100%)",
  city: "linear-gradient(180deg, #f2c27e 0%, #e7955f 32%, #b9644a 52%, #6b3d38 53%, #8a5340 62%, #4a2c2a 80%, #251818 100%)",
  dinner: "radial-gradient(60% 50% at 38% 44%, #f4c27a 0%, #c87a44 32%, #6a3a24 64%, #24140e 100%)",
  sea: "linear-gradient(180deg, #a9cbe4 0%, #d8e6ee 40%, #5f8fb0 42%, #36678c 70%, #1f4561 100%)",
  park: "radial-gradient(80% 60% at 30% 20%, #cfe3a8 0%, #8fb56a 35%, #4f7a3f 70%, #2d4a26 100%)",
  notes: "linear-gradient(170deg, #ece6d6 0%, #e3dccb 100%)",
} as const;

export type PhotoName = keyof typeof PHOTO;

/** A receipt photographed on a table, drawn: a paper slip with its lines and total, a little turned. */
export function ReceiptArt({ className, style }: Piece) {
  const line = (w: number, strong = false) => <span style={{ display: "block", height: strong ? 3.4 : 2.4, width: `${w}%`, borderRadius: 2, background: strong ? "rgba(40,36,30,0.72)" : "rgba(60,54,46,0.42)", marginTop: strong ? 7 : 5 }} />;
  return (
    <span className={className} style={{ position: "absolute", inset: 0, background: "radial-gradient(90% 80% at 40% 30%, #5b4a3c 0%, #3a2e25 60%, #241c16 100%)", overflow: "hidden", ...style }} aria-hidden="true">
      <span
        style={{
          position: "absolute",
          left: "22%",
          top: "6%",
          width: "56%",
          height: "96%",
          background: "linear-gradient(180deg, #f7f3ea 0%, #ece6d8 100%)",
          transform: "rotate(-7deg)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
          padding: "12% 10% 0",
        }}
      >
        <span style={{ display: "block", height: 4, width: "50%", margin: "0 auto", borderRadius: 2, background: "rgba(40,36,30,0.65)" }} />
        {line(80)}
        {line(64)}
        {line(72)}
        {line(54)}
        {line(70)}
        {line(100, true)}
        {line(40)}
      </span>
    </span>
  );
}

/** A picture: a named drawing (PHOTO), "receipt", or any CSS background. */
function Picture({ art, radius = 0 }: { art: PhotoName | "receipt" | (string & {}); radius?: number }) {
  if (art === "receipt") return <ReceiptArt style={{ borderRadius: radius }} />;
  const ground = art in PHOTO ? PHOTO[art as PhotoName] : art;
  return <span aria-hidden="true" style={{ position: "absolute", inset: 0, background: ground, borderRadius: radius }} />;
}

/* ------------------------------------------------------------------ */
/* Photos                                                              */
/* ------------------------------------------------------------------ */

/** app/agent.tsx:8442 PHOTO_TILE: three to a row across the chat's column, 6 apart. */
export const PHOTO_TILE = Math.floor((SCREEN.width - THREAD_SIDE * 2 - 12) / 3);

/**
 * Photos the person sent with their words (app/agent.tsx UserPhoto and
 * styles.photoGrid): square tiles with 12 point corners, three to a row, 6
 * apart, packed to the person's side, no box round any of them. `reaction`:
 * Krovvi's emoji on the first one's corner, when the message is only photos.
 * `reading`: the reading light over them while Krovvi looks.
 */
export function SentPhotos({ photos, reaction, reading = false, tile = PHOTO_TILE, className, style }: Piece & { photos: Array<PhotoName | "receipt" | (string & {})>; reaction?: string; reading?: boolean; tile?: number }) {
  return (
    <div className={cx("dk", className)} style={{ alignSelf: "flex-end", width: tile * 3 + 12, maxWidth: "100%", display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: 6, ...style }}>
      {photos.map((art, i) => (
        <span key={i} role="img" aria-label="Photo you attached" style={{ position: "relative", width: tile, height: tile, borderRadius: 12, overflow: "visible", flexShrink: 0 }}>
          <span style={{ position: "absolute", inset: 0, borderRadius: 12, overflow: "hidden" }}>
            <Picture art={art} radius={12} />
          </span>
          {reading ? <ReadingLight width={tile} radius={12} delay={i * 120} /> : null}
          {i === 0 && reaction ? (
            <span
              aria-label={`Krovvi reacted ${reaction}`}
              style={{ position: "absolute", top: -13, left: -11, width: 28, height: 28, borderRadius: 14, border: `2px solid ${C.sky}`, background: C.surfaceHi, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, lineHeight: 1 }}
            >
              {reaction}
            </span>
          ) : null}
        </span>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* A link                                                              */
/* ------------------------------------------------------------------ */

/** components/sent-link.tsx:79: as wide as a sent photo grid at most. */
const CARD_MAX = 268;

/**
 * A link the person sent, as a card under their words (components/sent-link.tsx):
 * Krovvi's glass with 20 point corners and one hairline, the page's picture
 * across its whole width (1.91 to 1, drawn here, `picture`), then its title
 * 14.5 on 19 semibold on two lines at most, and the site with its small mark
 * (13 square, corners 3) in 12.5 muted. With no picture it is the words alone,
 * as narrow as they are.
 */
export function SentLink({
  title,
  site,
  picture,
  mark,
  reading = false,
  className,
  style,
}: Piece & {
  /** The page's title, from its preview tags. */
  title?: string;
  /** The site's name ("YouTube", or the address's host). */
  site: string;
  /** The page's picture: a drawing (PHOTO), "receipt", or a CSS background. None: the words alone. */
  picture?: PhotoName | "receipt" | (string & {});
  /** The site's small mark: a letter on a tile, or a node. */
  mark?: ReactNode;
  reading?: boolean;
}) {
  const wide = picture !== undefined;
  return (
    <div
      className={cx("dk", className)}
      role="link"
      aria-label={`Open link: ${title || site}`}
      style={{ position: "relative", alignSelf: "flex-end", width: wide ? CARD_MAX : undefined, maxWidth: CARD_MAX, background: C.glass, border: `${HAIR}px solid ${C.glassEdge}`, borderRadius: 20, overflow: "hidden", ...style }}
    >
      {wide ? (
        <span style={{ position: "relative", display: "block", width: "100%", aspectRatio: "1.91", background: C.tile }}>
          <Picture art={picture} />
        </span>
      ) : null}
      <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
        {title ? (
          <span style={{ color: C.fg, fontSize: 14.5, fontWeight: 600, letterSpacing: "-0.2px", lineHeight: "19px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{emo(title, 1.12)}</span>
        ) : null}
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {typeof mark === "string" || mark === undefined ? (
            <span style={{ width: 13, height: 13, borderRadius: 3, background: "rgba(237,237,235,0.16)", color: C.fg, fontSize: 8.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }} aria-hidden="true">
              {(typeof mark === "string" ? mark : site.trim().charAt(0)).toUpperCase()}
            </span>
          ) : (
            mark
          )}
          <span style={{ color: C.muted, fontSize: 12.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{site}</span>
        </span>
      </div>
      {reading ? <ReadingLight width={CARD_MAX} radius={20} /> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* A file                                                              */
/* ------------------------------------------------------------------ */

/** lib/file-face.ts:7-23: a file's word and colour by its kind. */
function fileFace(name: string): { word: string; tint: string } {
  const ext = (/\.([a-z0-9]+)$/i.exec(name)?.[1] ?? "").toUpperCase();
  const faces: Record<string, { word: string; tint: string }> = {
    PDF: { word: "PDF", tint: "#E5484D" },
    XLSX: { word: "Spreadsheet", tint: "#30A46C" },
    CSV: { word: "Spreadsheet", tint: "#30A46C" },
    DOCX: { word: "Word document", tint: "#3E7BFA" },
    PPTX: { word: "Presentation", tint: "#F76B15" },
    EML: { word: "Email", tint: "#F5B940" },
  };
  return faces[ext] ?? { word: ext || "File", tint: C.muted };
}

/**
 * A file the person sent (app/agent.tsx styles.sentFile): a card of Krovvi's
 * glass across the message column, a 34 point badge (corners 9) with the
 * page mark in the file's colour, its name 14.5 semibold, and what it is
 * under it, 11 points in faint ink.
 */
export function SentFile({ name, reading = false, className, style }: Piece & { name: string; reading?: boolean }) {
  const face = fileFace(name);
  return (
    <div
      className={cx("dk", className)}
      role="button"
      aria-label={`Open ${name}`}
      style={{ position: "relative", alignSelf: "stretch", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: C.glass, border: `${HAIR}px solid ${C.glassEdge}`, borderRadius: 20, overflow: "hidden", ...style }}
    >
      <span style={{ width: 34, height: 34, borderRadius: 9, background: C.tile, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon name="doc" size={16} color={face.tint} weight={1.6} />
      </span>
      <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ color: C.fg, fontSize: 14.5, fontWeight: 600, letterSpacing: "-0.15px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</span>
        <span style={{ color: C.faint, fontSize: 11, letterSpacing: "0.3px" }}>{face.word}</span>
      </span>
      {reading ? <ReadingLight width={SCREEN.width - THREAD_SIDE * 2} radius={20} /> : null}
    </div>
  );
}

/**
 * One message of the person's with its parts (app/agent.tsx styles.questionWrap):
 * photos, a file, their words and a link's card, 8 apart, on their side.
 * Put MyBubble, SentPhotos, SentFile and SentLink inside, in that order.
 */
export function Sent({ children, className, style }: Piece & { children?: ReactNode }) {
  return (
    <div className={className} style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, width: "100%", ...style }}>
      {children}
    </div>
  );
}
