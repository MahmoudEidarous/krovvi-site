/**
 * The chat as the app draws it in the night look (catch8 src/app/agent.tsx and
 * src/components/answer/reply.tsx at 272d7cc5, first moves from
 * src/components/krovvi-message.tsx at bc25b1a3), at the app's own points on
 * the site's 393 x 852 phone canvas. Content comes in through props, so any
 * conversation can be scripted; every piece takes className and style, so its
 * arrival can be animated. Nothing here touches the window: server renderable.
 *
 * The frame paints no background of its own: the live star sky goes in the
 * `sky` slot (or behind the frame), and the reading veil over it is
 * ReadingVeil. Numbers are documented in docs/app-visual-spec-deep.md.
 */

import "./deep.css";

import { Fragment, type CSSProperties, type ReactNode } from "react";

import { ArrowUp, Check, Icon, KrovviK, Mic, ReactGlyph, ThumbDown, type IconName } from "./glyphs";
import { ANSWER, C, HAIR, SCREEN, STAR_ROOM, THREAD_SIDE } from "./tokens";

export interface Piece {
  className?: string;
  style?: CSSProperties;
}

const cx = (...names: Array<string | false | null | undefined>) => names.filter(Boolean).join(" ") || undefined;

/* ------------------------------------------------------------------ */
/* The frame                                                            */
/* ------------------------------------------------------------------ */

/** The iPhone's status bar: the time, signal, wifi and battery, in the app's ivory. */
export function StatusBar({ time = "9:41", className, style }: Piece & { time?: string }) {
  return (
    <div
      className={cx("dk", className)}
      style={{ position: "absolute", left: 0, right: 0, top: 0, height: 54, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 27px 0 31px", zIndex: 40, pointerEvents: "none", ...style }}
      aria-hidden="true"
    >
      <span style={{ width: 54, textAlign: "center", fontSize: 17, fontWeight: 600, letterSpacing: "-0.2px", fontVariantNumeric: "tabular-nums", color: C.fg }}>{time}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <svg width="18" height="12" viewBox="0 0 18 12" fill={C.fg}>
          <rect x="0" y="7.5" width="3.2" height="4.5" rx="1" />
          <rect x="4.9" y="5" width="3.2" height="7" rx="1" />
          <rect x="9.8" y="2.5" width="3.2" height="9.5" rx="1" />
          <rect x="14.7" y="0" width="3.2" height="12" rx="1" />
        </svg>
        <svg width="17" height="12" viewBox="0 0 17 12" fill={C.fg}>
          <path d="M8.5 2.3c2.5 0 4.8 1 6.5 2.6l1.3-1.3C14.2 1.6 11.5.5 8.5.5S2.8 1.6.7 3.6L2 4.9c1.7-1.6 4-2.6 6.5-2.6Z" />
          <path d="M8.5 5.8c1.6 0 3 .6 4 1.6l1.3-1.3c-1.4-1.3-3.3-2.1-5.3-2.1s-3.9.8-5.3 2.1l1.3 1.3c1-1 2.4-1.6 4-1.6Z" />
          <path d="M8.5 9.2c.6 0 1.2.2 1.6.6L8.5 11.5 6.9 9.8c.4-.4 1-.6 1.6-.6Z" />
        </svg>
        <svg width="27" height="13" viewBox="0 0 27 13">
          <rect x="0.5" y="0.5" width="23" height="12" rx="3.8" fill="none" stroke={C.fg} strokeOpacity="0.35" />
          <rect x="2" y="2" width="20" height="9" rx="2.4" fill={C.fg} />
          <path d="M25 4.6v3.8c.8-.3 1.3-1.1 1.3-1.9s-.5-1.6-1.3-1.9Z" fill={C.fg} fillOpacity="0.4" />
        </svg>
      </span>
    </div>
  );
}

/** A round of glass over the sky, 40 across: the bar's buttons (app/agent.tsx:7710 navBtn, theme/pane.ts:36-41). */
function Round({ children, size = 40 }: { children: ReactNode; size?: number }) {
  return (
    <span
      style={{ position: "relative", width: size, height: size, borderRadius: size / 2, background: C.glass, border: `${HAIR}px solid ${C.glassEdge}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
    >
      {children}
    </span>
  );
}

/**
 * The bar at the top of a chat (app/agent.tsx:4199-4268, styles 7683-7720):
 * Krovvi's K at the left, then Share, History and Close as rounds of glass,
 * 12 apart, at the chat's 16 point side margin. `news` puts the point of light
 * on History that says another chat has news (7699-7708).
 */
export function TopBar({ share = true, history = true, close = true, news = false, className, style }: Piece & { share?: boolean; history?: boolean; close?: boolean; news?: boolean }) {
  return (
    <div className={className} style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: `0 ${THREAD_SIDE}px 12px`, height: 52, flexShrink: 0, ...style }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ alignSelf: "flex-start", paddingTop: 2 }}>
          <KrovviK size={22} color={C.fg} />
        </div>
      </div>
      {share ? (
        <Round>
          <Icon name="shareOut" size={19} color={C.fg2} weight={1.5} />
        </Round>
      ) : null}
      {history ? (
        <Round>
          <span style={{ position: "relative", display: "block" }}>
            <Icon name="past" size={21} color={C.fg2} weight={1.5} />
            {news ? <span style={{ position: "absolute", top: -1, right: -3, width: 7, height: 7, borderRadius: 4, background: C.fg }} /> : null}
          </span>
        </Round>
      ) : null}
      {close ? (
        <Round>
          <Icon name="cross" size={14} color={C.fg2} weight={1.7} />
        </Round>
      ) : null}
    </div>
  );
}

/**
 * The band where words are read over the chat's sky: the stars keep a third
 * of their light from 24 to 80 percent of the screen's height, softened over
 * 6 percent at each edge (components/chat-sky.tsx:18, components/sky/stars.tsx:131-142).
 * Lay it over the sky and under the chat.
 */
export const READING_VEIL =
  "linear-gradient(180deg, rgba(2,2,2,0) 0%, rgba(2,2,2,0) 18%, rgba(2,2,2,0.667) 24%, rgba(2,2,2,0.667) 80%, rgba(2,2,2,0) 86%, rgba(2,2,2,0) 100%)";

export function ReadingVeil({ className, style }: Piece) {
  return <div aria-hidden="true" className={className} style={{ position: "absolute", inset: 0, background: READING_VEIL, pointerEvents: "none", ...style }} />;
}

/**
 * The chat screen: status bar, the top bar under the safe area (59), the
 * messages column, and the composer at the foot. The column stands at the top
 * while the conversation is short and holds its end over the composer once it
 * is longer than the screen, as the app opens a chat at its end. `scroll`
 * moves the column down by that many points to show what came before (a
 * transform, so it can be animated with a transition).
 */
export function DeepChat({
  children,
  sky,
  veil = false,
  statusBar = true,
  time,
  top,
  composer,
  scroll = 0,
  columnStyle,
  footer,
  over,
  label,
  className,
  style,
}: Piece & {
  children?: ReactNode;
  /** Laid over the whole screen, the bars too: PlusSheet, ShareSheet. */
  over?: ReactNode;
  /**
   * The foot of the conversation (app/agent.tsx:4381-4395, the runway): where
   * Krovvi's working dots stand, 16 under the last message. It is always
   * there, so the last message rests 16 + 24 over the composer.
   */
  footer?: ReactNode;
  /** Drawn behind everything: the live star sky. */
  sky?: ReactNode;
  /** Lay the reading veil over the sky. */
  veil?: boolean;
  statusBar?: boolean;
  time?: string;
  /** The bar at the top; null for none. TopBar by default. */
  top?: ReactNode;
  /** The composer at the foot; null for none. An empty Composer by default. */
  composer?: ReactNode;
  scroll?: number;
  /** Styles for the messages column (a transition for `scroll`, say). */
  columnStyle?: CSSProperties;
  /** What the screen shows, for screen readers. */
  label?: string;
}) {
  return (
    <div
      className={cx("dk", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      style={{ position: "relative", width: SCREEN.width, height: SCREEN.height, overflow: "hidden", display: "flex", flexDirection: "column", ...style }}
    >
      {sky ? <div style={{ position: "absolute", inset: 0 }}>{sky}</div> : null}
      {veil ? <ReadingVeil /> : null}
      {statusBar ? <StatusBar time={time} /> : null}
      <div style={{ height: SCREEN.top, flexShrink: 0 }} />
      {top === undefined ? <TopBar /> : top}
      <div style={{ position: "relative", flex: "1 1 0", minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column-reverse" }}>
        <div
          style={{
            marginBottom: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            padding: `14px ${THREAD_SIDE}px 24px`,
            transform: scroll ? `translateY(${scroll}px)` : undefined,
            ...columnStyle,
          }}
        >
          {children}
          <div>{footer}</div>
        </div>
      </div>
      {composer === undefined ? <Composer /> : composer}
      {over}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Krovvi's turn                                                        */
/* ------------------------------------------------------------------ */

/**
 * One reply of Krovvi's, as a row of the thread: held 18 off the side its star
 * stands on, its pieces 8 apart (app/agent.tsx:7795 answerWrap,
 * components/answer/reply.tsx:298-300, 948-949). Put KrovviText,
 * KrovviBubbles, a brick, ActionsRow, MoveHeader and Choices inside.
 */
export function Turn({ children, className, style }: Piece & { children?: ReactNode }) {
  return (
    <div className={className} style={{ position: "relative", display: "flex", flexDirection: "column", gap: 8, paddingLeft: STAR_ROOM, ...style }}>
      {children}
    </div>
  );
}

/** The star's light: a 5 point ivory dot solid to 24 percent of a 19 point light (reply.tsx:957-964). */
export const STAR_LIGHT =
  "radial-gradient(circle closest-side, rgba(237,237,235,1) 0%, rgba(237,237,235,1) 24%, rgba(237,237,235,0.5) 30%, rgba(237,237,235,0.16) 55%, rgba(237,237,235,0) 100%)";

/**
 * The star before Krovvi's plain words, on the middle of their first line, the
 * dot's edge on the turn's edge (reply.tsx:270-296, 955-966). `bloom`: it lands
 * from a point, past its size, then still, 420 ms (reply.tsx:95-96).
 */
export function KrovviStar({ bloom = false, line = 25, className, style }: Piece & { bloom?: boolean; line?: number }) {
  const top = Math.round((line - 5) / 2) - 7;
  return (
    <span
      aria-hidden="true"
      className={cx(bloom && "dk-bloom", className)}
      style={{ position: "absolute", left: -STAR_ROOM - 7, top, width: 19, height: 19, background: STAR_LIGHT, pointerEvents: "none", ...style }}
    />
  );
}

const PARA: CSSProperties = { ...ANSWER, margin: "0 0 16px", whiteSpace: "pre-wrap", overflowWrap: "break-word" };

/** A paragraph of Krovvi's answer: 17 on 25, 16 under it (theme/markdown.ts:541). */
export function P({ children, className, style }: Piece & { children?: ReactNode }) {
  return (
    <p className={className} style={{ ...PARA, ...style }}>
      {typeof children === "string" ? emo(children) : children}
    </p>
  );
}

/** Bold in an answer: the words' ink, semibold (theme/markdown.ts:542). */
export function B({ children }: { children?: ReactNode }) {
  return <strong style={{ fontWeight: 600, color: C.fg }}>{children}</strong>;
}

/** A bulleted list in an answer: a 5 point muted dot on the middle of the first line, 3 before it and 12 after (markdown.ts:548-588). */
export function Bullets({ items, className, style }: Piece & { items: ReactNode[] }) {
  return (
    <div className={className} style={{ marginBottom: 16, ...style }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", marginBottom: 10 }}>
          <span style={{ width: 5, height: 5, borderRadius: 2.5, background: C.muted, marginTop: 10, marginLeft: 3, marginRight: 12, flexShrink: 0 }} />
          <span style={{ ...ANSWER, flex: 1 }}>{item}</span>
        </div>
      ))}
    </div>
  );
}

/** An emoji and what joins it (skin tones, the joiner, the emoji style mark). */
const EMOJI = /(\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic}|[\u{1F3FB}-\u{1F3FF}])*)/gu;

/**
 * Words with their emoji drawn as iOS draws them. Apple Color Emoji stands
 * larger on the phone than in Chrome at the same size, more so for small
 * words, and a space before one is a little wider: measured on
 * design/krovvi-asks-first-2026-10-14 fm-first-en.png, the 🙂 after "How did
 * it go?" (17 point words) is 19 points against 16.3 in Chrome, the 🎉 in a
 * 14 point choice 18 against 14.3, and both stand 1.6 points further from the
 * word before them. `scale`: how much larger to set them (1.17 for the
 * chat's 17 point words, 1.26 for 14 point ones). Never taller lines. Safari
 * and every iPhone browser draw emoji with the app's own text engine, so
 * there the correction is off (deep.css .dk-emo).
 */
export function emo(text: string, scale = 1.17): ReactNode {
  if (!/\p{Extended_Pictographic}/u.test(text)) return text;
  const parts = text.split(EMOJI);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className={/\s$/.test(parts[i - 1] ?? "") ? "dk-emo dk-emo-gap" : "dk-emo"} style={{ "--dk-emo": `${scale}em` } as CSSProperties}>
        {part}
      </span>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

/** **bold** inside a line, as the answer's markdown sets it. */
function inline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, i) => (part.startsWith("**") && part.endsWith("**") ? <B key={i}>{emo(part.slice(2, -2))}</B> : <Fragment key={i}>{emo(part)}</Fragment>));
}

/** Plain text with blank lines between paragraphs, "- " lines as bullets and **bold**. */
function blocks(text: string): ReactNode {
  return text
    .trim()
    .split(/\n{2,}/)
    .map((block, i) => {
      const lines = block.split("\n");
      if (lines.every((l) => /^\s*[-*] /.test(l))) return <Bullets key={i} items={lines.map((l) => inline(l.replace(/^\s*[-*] /, "")))} />;
      return <P key={i}>{inline(block)}</P>;
    });
}

/**
 * Krovvi's plain answer: the star before the turn, then its words. Pass
 * `text` (paragraphs split by a blank line, "- " bullets, **bold**) or
 * children (P, B, Bullets, or bricks between paragraphs). `afterBubble`: it
 * follows Krovvi's bubbles in the same reply, 10 under them (reply.tsx:70).
 */
export function KrovviText({ text, children, star = true, bloom = false, afterBubble = false, className, style }: Piece & { text?: string; children?: ReactNode; star?: boolean; bloom?: boolean; afterBubble?: boolean }) {
  return (
    <div className={className} style={{ position: "relative", marginTop: afterBubble ? 2 : 0, ...style }}>
      {star ? <KrovviStar bloom={bloom} /> : null}
      {text !== undefined ? blocks(text) : children}
    </div>
  );
}

/** Krovvi's glass (theme/pane.ts:27-34): the bubbles', the cards', the typing dots'. */
const GLASS: CSSProperties = { background: C.glass, border: `${HAIR}px solid ${C.glassEdge}`, borderRadius: 20 };

/**
 * Krovvi's texting replies: glass bubbles on its side, at most 82 percent of
 * the column, 4 apart, 20 point corners and one hairline, its words at the
 * answer's size, 7 over and 8 under them, 14 at the sides (reply.tsx:69,
 * 918-922, 945-947). `rise`: each arrives with a 180 ms fade and a 6 point
 * rise, `stagger` ms after the one before.
 */
export function KrovviBubbles({ lines, rise = false, stagger = 0, delay = 0, className, style }: Piece & { lines: ReactNode[]; rise?: boolean; stagger?: number; delay?: number }) {
  return (
    <div className={className} style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4, ...style }}>
      {lines.map((line, i) => (
        <div
          key={i}
          className={rise ? "dk-rise" : undefined}
          style={{ ...GLASS, ...ANSWER, maxWidth: "82%", padding: "7px 14px 8px", overflowWrap: "break-word", ...(rise ? ({ "--dk-delay": `${delay + i * stagger}ms` } as CSSProperties) : null) }}
        >
          {typeof line === "string" ? inline(line) : line}
        </div>
      ))}
    </div>
  );
}

/**
 * Krovvi at work: the K's dots in a bubble exactly one line tall, where its
 * reply will land, each dot in its own light, lighting in turn
 * (reply.tsx:582-601, 937-944; components/k-thinking.tsx:70-108; app/agent.tsx:5964-5989).
 * Put it in DeepChat's `footer`, where the app draws it; it holds itself in
 * Krovvi's column.
 */
export function Working({ className, style, delay = 0 }: Piece & { delay?: number }) {
  return (
    <div style={{ paddingLeft: STAR_ROOM }}>
      <div
        className={cx("dk-fade", className)}
        role="img"
        aria-label="Krovvi is typing"
        style={{ ...GLASS, width: 58, height: 40, display: "flex", alignItems: "center", justifyContent: "center", ...({ "--dk-delay": `${delay}ms` } as CSSProperties), ...style }}
      >
        <KThinking size={22} glow />
      </div>
    </div>
  );
}

/** components/k-thinking.tsx:59-68, a dot's light: solid to 36 percent, then falling to nothing. */
function lightOf(tint: string): string {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(tint);
  const [r, g, b] = m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [237, 237, 235];
  const at = (a: number) => `rgba(${r},${g},${b},${a})`;
  return `radial-gradient(circle closest-side, ${at(1)} 0%, ${at(1)} 36%, ${at(0.42)} 44%, ${at(0.12)} 68%, ${at(0)} 100%)`;
}

/**
 * The K thinking (components/k-thinking.tsx): the mark's seven dots lighting
 * in the order a hand draws the K, 1400 ms a pass, 140 ms apart. `glow`: each
 * dot in its own light, swelling a little as it brightens (the chat's).
 */
export function KThinking({ size = 32, tint = C.fg, glow = false, className, style }: Piece & { size?: number; tint?: string; glow?: boolean }) {
  const u = size / 120;
  const d = 16 * u;
  const g = d * 2.6;
  const dots: Array<[number, number]> = [
    [40, 28],
    [40, 60],
    [40, 92],
    [61, 45],
    [82, 30],
    [61, 75],
    [82, 90],
  ];
  return (
    <span className={className} style={{ position: "relative", display: "block", width: size, height: size, flexShrink: 0, ...style }}>
      {dots.map(([x, y], i) => (
        <span
          key={i}
          className="dk-k-dot"
          style={{
            position: "absolute",
            left: x * u - (glow ? g : d) / 2,
            top: y * u - (glow ? g : d) / 2,
            width: glow ? g : d,
            height: glow ? g : d,
            borderRadius: glow ? undefined : "50%",
            background: glow ? lightOf(tint) : tint,
            opacity: glow ? 0.32 : 0.22,
            ...({ "--dk-delay": `${i * 140}ms`, "--dk-k": glow ? "dk-k-glow" : "dk-k-flat" } as CSSProperties),
          }}
        />
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* The person's side                                                    */
/* ------------------------------------------------------------------ */

/**
 * The person's words, on the right: white at a whisper, 21 point corners with
 * the one toward their side tucked to 7, the answer's size, at most 82
 * percent of the column (reply.tsx:968-977, 1008). `reaction`: Krovvi's
 * emoji on its corner, 28 across in a ring of the sky's black (reply.tsx:1010-1027).
 * Several in a row: pass `lines`, 4 apart, only the last one tucked (app/agent.tsx:7743).
 */
export function MyBubble({ text, lines, reaction, rise = false, className, style }: Piece & { text?: ReactNode; lines?: ReactNode[]; reaction?: string; rise?: boolean }) {
  const all = lines ?? [text];
  return (
    <div className={className} style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, ...style }}>
      {all.map((words, i) => {
        const last = i === all.length - 1;
        return (
          <div
            key={i}
            className={rise ? "dk-rise" : undefined}
            style={{
              position: "relative",
              ...ANSWER,
              background: "rgba(255,255,255,0.09)",
              borderRadius: 21,
              borderBottomRightRadius: last ? 7 : 21,
              padding: "7px 14px 8px",
              maxWidth: "82%",
              overflowWrap: "break-word",
            }}
          >
            {typeof words === "string" ? emo(words) : words}
            {last && reaction ? (
              <span
                aria-label={`Krovvi reacted ${reaction}`}
                style={{ position: "absolute", top: -13, left: -11, width: 28, height: 28, borderRadius: 14, border: `2px solid ${C.sky}`, background: C.surfaceHi, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, lineHeight: 1 }}
              >
                {reaction}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/**
 * When the person said this, over their message: the day a step brighter than
 * the hour, between two hairlines that run to the sides (components/chat-time.tsx:17-66).
 * As its own row it takes the thread's 16 as the room under it.
 */
export function DateLine({ day = "Today", time, className, style }: Piece & { day?: string; time: string }) {
  return (
    <div className={className} style={{ display: "flex", alignItems: "center", gap: 10, alignSelf: "stretch", ...style }}>
      <span style={{ flex: 1, height: HAIR, background: C.edge }} />
      <span style={{ textAlign: "center", color: C.faint, fontSize: 12, letterSpacing: "0.1px" }}>
        <span style={{ color: C.muted, fontWeight: 600 }}>{day}</span>
        {` ${time}`}
      </span>
      <span style={{ flex: 1, height: HAIR, background: C.edge }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Under an answer                                                      */
/* ------------------------------------------------------------------ */

export type Act = "copy" | "share" | "notRight" | "retry" | "react";

/**
 * The verbs under a finished answer, faint on purpose: each 16 point glyph in
 * a 32 by 28 box, 16 apart, the row reaching out 8 so the first glyph stands
 * on the words' edge (app/agent.tsx:6418-6489, 7651-7653, 7800-7803). The
 * newest answer carries all five; an earlier one has no Try again. `copied`
 * shows Copy's tick.
 */
export function ActionsRow({ items = ["copy", "share", "notRight", "retry", "react"], copied = false, fade = false, className, style }: Piece & { items?: Act[]; copied?: boolean; fade?: boolean }) {
  const glyph = (act: Act) => {
    switch (act) {
      case "copy":
        return copied ? <Check size={15} color={C.soft} weight={1.7} /> : <Icon name="copy" size={16} color={C.faint} weight={1.5} />;
      case "share":
        return <Icon name="shareOut" size={16} color={C.faint} weight={1.5} />;
      case "notRight":
        return <ThumbDown size={16} color={C.faint} weight={1.5} />;
      case "retry":
        return <Icon name="retry" size={16} color={C.faint} weight={1.5} />;
      case "react":
        return <ReactGlyph size={17} color={C.faint} weight={1.5} />;
    }
  };
  return (
    <div className={cx(fade && "dk-fade", className)} style={{ display: "flex", alignItems: "center", gap: 16, margin: "0 -8px", ...(fade ? ({ "--dk-dur": "240ms" } as CSSProperties) : null), ...style }}>
      {items.map((act) => (
        <span key={act} style={{ width: 32, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {glyph(act)}
        </span>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Krovvi talking first                                                 */
/* ------------------------------------------------------------------ */

export type MoveKind = "thread" | "event" | "person" | "mail" | "note" | "object" | "doc";

const MOVE_ICON: Record<Exclude<MoveKind, "note" | "object">, { name: IconName; weight: number }> = {
  thread: { name: "bubble", weight: 1.5 },
  event: { name: "calendar", weight: 1.4 },
  person: { name: "people", weight: 1.5 },
  mail: { name: "envelope", weight: 1.4 },
  doc: { name: "doc", weight: 1.5 },
};

/**
 * The small line over a message Krovvi wrote first, naming what it is about
 * in a few words, its glyph by the kind of thing (components/krovvi-message.tsx:39-84,
 * 221-222 at bc25b1a3): 13 point muted words, a 12 point faint glyph, 8 under it.
 */
export function MoveHeader({ text, kind = "thread", className, style }: Piece & { text: string; kind?: MoveKind }) {
  const glyph =
    kind === "note" ? <Mic size={12} color={C.faint} /> : kind === "object" ? <KrovviK size={12} color={C.faint} /> : <Icon name={MOVE_ICON[kind].name} size={12} color={C.faint} weight={MOVE_ICON[kind].weight} />;
  return (
    <div className={className} style={{ display: "flex", alignItems: "center", alignSelf: "flex-start", gap: 6, marginBottom: 8, padding: "2px 0", ...style }}>
      {glyph}
      <span style={{ color: C.muted, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{text}</span>
    </div>
  );
}

/**
 * One tap answers under what Krovvi asked first: pills of dark glass 34 tall,
 * 8 apart, 12 under its words, 14 point semibold (krovvi-message.tsx:181-218,
 * 225-243). `picked`: that one turns ivory, the rest step back to 0.4.
 */
export function Choices({ options, picked = null, className, style }: Piece & { options: string[]; picked?: number | null }) {
  return (
    <div className={className} style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12, ...style }}>
      {options.map((label, i) => {
        const on = picked === i;
        return (
          <span
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              height: 34,
              padding: "0 14px",
              borderRadius: 999,
              ...(on ? { background: C.fg } : { background: C.glass, border: `${HAIR}px solid ${C.glassEdge}` }),
              opacity: picked !== null && !on ? 0.4 : 1,
              color: on ? C.bg : C.fg,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "-0.2px",
              whiteSpace: "nowrap",
              transition: "opacity 140ms cubic-bezier(0.23, 1, 0.32, 1), background-color 140ms cubic-bezier(0.23, 1, 0.32, 1)",
            }}
          >
            <span>{emo(label, 1.26)}</span>
          </span>
        );
      })}
    </div>
  );
}

/**
 * What a set of Krovvi's questions folds into once it is put off or answered
 * ("Later 👌", "All 3 answered"): one quiet line 12 under Krovvi's words
 * (components/krovvi-stack.tsx:263-264 at bc25b1a3).
 */
export function StackLine({ text, className, style }: Piece & { text: string }) {
  return (
    <div className={className} style={{ display: "flex", alignItems: "center", alignSelf: "flex-start", gap: 6, marginTop: 12, padding: "2px 0", ...style }}>
      <span style={{ color: C.muted, fontSize: 13 }}>{emo(text, 1.26)}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The composer                                                         */
/* ------------------------------------------------------------------ */

export interface Attachment {
  kind: "photo" | "file";
  /** A photo's picture (any image URL or CSS background), or a file's name ("Lease.pdf"). */
  src?: string;
  name?: string;
  /** A file on its way: its ring and its line ("PDF · Ready. Ask about it"). */
  stage?: "uploading" | "reading" | "ready";
}

/** app/agent.tsx:7656, the text box's line, and how far it grows: six lines. */
const INPUT_LINE = 22;

/** lib/file-face.ts:7-23 */
function fileFace(name: string): { word: string; tint: string } {
  const ext = (/\.([a-z0-9]+)$/i.exec(name)?.[1] ?? "").toUpperCase();
  const faces: Record<string, { word: string; tint: string }> = {
    PDF: { word: "PDF", tint: "#E5484D" },
    XLSX: { word: "Spreadsheet", tint: "#30A46C" },
    CSV: { word: "Spreadsheet", tint: "#30A46C" },
    DOCX: { word: "Word document", tint: "#3E7BFA" },
    PPTX: { word: "Presentation", tint: "#F76B15" },
  };
  return faces[ext] ?? { word: ext || "File", tint: C.muted };
}

const STAGE_WORDS = { uploading: "Uploading…", reading: "Reading it…", ready: "Ready. Ask about it" } as const;

/**
 * The text box (app/agent.tsx:4547-4848, styles 7860-8105): dark glass 56
 * tall at one line, round at its ends, 16 in from the sides and 50 over the
 * foot; the + in its 40 point glass disc, the words at 17 on a 22 point line,
 * and the bar's one bright thing, the ivory 40 point disc: the three-dot mic
 * when empty, the arrow once there is something to send.
 *
 * States: `text` with `caret` is typing (the box grows a line at a time up to
 * six); `listening` is dictation, as components/dictation-bar.tsx draws it;
 * `attachments` sit in the box over the words (staged photos, 64 square,
 * and files with their ring and line, components/doc-chip.tsx).
 */
export function Composer({
  text,
  placeholder = "Ask, or give it a job",
  caret = false,
  listening = false,
  clock = "0:04",
  attachments,
  asking = false,
  className,
  style,
}: Piece & {
  text?: string;
  placeholder?: string;
  caret?: boolean;
  listening?: boolean;
  /** The dictation's clock while listening. */
  clock?: string;
  attachments?: Attachment[];
  /** Krovvi's last message asked something: the edge in warm brass and "Answer Krovvi" (app/agent.tsx:7903, 4770). */
  asking?: boolean;
}) {
  const loaded = !!text || !!attachments?.length;
  const photos = attachments?.filter((a) => a.kind === "photo") ?? [];
  const files = attachments?.filter((a) => a.kind === "file") ?? [];
  return (
    <div className={className} style={{ position: "relative", padding: `8px ${THREAD_SIDE}px 50px`, flexShrink: 0, ...style }}>
      <div
        style={{
          borderRadius: 28,
          overflow: "hidden",
          background: "rgba(26,26,29,0.62)",
          border: `${HAIR}px solid ${asking ? "rgba(194,164,112,0.5)" : "rgba(255,255,255,0.1)"}`,
          padding: 8,
        }}
      >
        {files.map((file, i) => (
          <DocChip key={`f${i}`} name={file.name ?? "File"} stage={file.stage ?? "ready"} />
        ))}
        {photos.length ? (
          <div style={{ display: "flex", gap: 8, padding: "8px 8px 4px", overflow: "hidden" }}>
            {photos.map((photo, i) => (
              <span key={i} style={{ position: "relative", width: 64, height: 64, borderRadius: 11, flexShrink: 0, overflow: "hidden", background: photo.src?.startsWith("url(") || photo.src?.includes("gradient") ? photo.src : photo.src ? `center / cover no-repeat url("${photo.src}")` : C.surfaceHi }}>
                <span style={{ position: "absolute", top: 4, right: 4, width: 18, height: 18, borderRadius: 9, background: "rgba(3,3,3,0.78)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="cross" size={7} color={C.fg} weight={1.8} />
                </span>
              </span>
            ))}
          </div>
        ) : null}
        {listening ? (
          <DictationRow clock={clock} />
        ) : (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
            <span style={{ width: 44, height: 44, margin: -2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ width: 40, height: 40, borderRadius: 20, background: "rgba(255,255,255,0.08)", border: `${HAIR}px solid rgba(255,255,255,0.12)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="plus" size={20} color={C.fg2} weight={(2 * 20) / 24} />
              </span>
            </span>
            <div
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: 17,
                letterSpacing: "-0.2px",
                lineHeight: `${INPUT_LINE}px`,
                maxHeight: INPUT_LINE * 6 + (40 - INPUT_LINE),
                padding: `${(40 - INPUT_LINE) / 2}px 8px`,
                color: text ? C.fg : C.faint,
                whiteSpace: "pre-wrap",
                overflowWrap: "break-word",
                overflow: "hidden",
              }}
            >
              {text ? text : null}
              {caret ? <span className="dk-caret" style={{ display: "inline-block", width: 2, height: 21, marginLeft: text ? 1 : 0, marginRight: text ? 0 : 1, borderRadius: 1, background: C.fg, verticalAlign: "-4px" }} /> : null}
              {text ? null : asking ? "Answer Krovvi" : placeholder}
            </div>
            <span style={{ position: "relative", width: 40, height: 40, borderRadius: 20, background: C.fg, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ position: "absolute", display: "flex", opacity: loaded ? 0 : 1, transform: loaded ? "scale(0.6)" : "none", transition: "opacity 150ms cubic-bezier(0.23, 1, 0.32, 1), transform 150ms cubic-bezier(0.23, 1, 0.32, 1)" }}>
                <Mic size={20} color={C.bg} />
              </span>
              <span style={{ position: "absolute", display: "flex", opacity: loaded ? 1 : 0, transform: loaded ? "none" : "scale(0.6)", transition: "opacity 150ms cubic-bezier(0.23, 1, 0.32, 1), transform 150ms cubic-bezier(0.23, 1, 0.32, 1)" }}>
                <ArrowUp size={16} color={C.bg} weight={2} />
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/** A file waiting in the box: its 24 point ring, its name and its stage, and a way out (components/doc-chip.tsx:81-125, 146-166). */
function DocChip({ name, stage }: { name: string; stage: "uploading" | "reading" | "ready" }) {
  const face = fileFace(name);
  const share = stage === "ready" ? 1 : stage === "reading" ? 0.7 : 0.3;
  const r = 11;
  const len = 2 * Math.PI * r;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 8px 0" }}>
      <span style={{ position: "relative", width: 24, height: 24, flexShrink: 0 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" style={{ position: "absolute", inset: 0 }} aria-hidden="true">
          <circle cx="12" cy="12" r={r} fill="none" stroke="rgba(237,237,235,0.18)" strokeWidth="2" />
          <circle cx="12" cy="12" r={r} fill="none" stroke={C.fg} strokeWidth="2" strokeDasharray={`${len * share} ${len}`} transform="rotate(-90 12 12)" />
        </svg>
        <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {stage === "ready" ? <Check size={10} color={C.fg} weight={1.9} /> : <Icon name="doc" size={11} color={face.tint} weight={1.5} />}
        </span>
      </span>
      <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
        <span style={{ color: C.fg, fontSize: 13, letterSpacing: "-0.1px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</span>
        <span style={{ color: C.muted, fontSize: 11 }}>{`${face.word} · ${STAGE_WORDS[stage]}`}</span>
      </span>
      <span style={{ width: 22, height: 22, borderRadius: 11, background: C.surfaceHi, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon name="cross" size={9} color={C.muted} weight={1.8} />
      </span>
    </div>
  );
}

/** A voice's bars as they were heard, newest on the right: 22 bars 2.5 wide, older ones fainter (components/waveform.tsx:38-69, dictation-bar.tsx:51-57). */
const HEARD = [0.08, 0.12, 0.1, 0.3, 0.55, 0.4, 0.18, 0.62, 0.85, 0.5, 0.25, 0.1, 0.35, 0.7, 0.95, 0.6, 0.3, 0.15, 0.45, 0.8, 0.55, 0.3];

/** Dictating: throw it away, the clock, the voice drawn, stop into the box, or send (components/dictation-bar.tsx:21-130). */
function DictationRow({ clock }: { clock: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, height: 40, padding: "0 4px" }}>
      <span style={{ width: 34, height: 34, borderRadius: 17, background: C.tile, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon name="cross" size={13} color={C.fg} weight={1.7} />
      </span>
      <span style={{ color: C.muted, fontSize: 12, fontVariantNumeric: "tabular-nums", minWidth: 30 }}>{clock}</span>
      <span style={{ flex: 1, height: 22, display: "flex", alignItems: "center", justifyContent: "space-between", overflow: "hidden" }} aria-hidden="true">
        {HEARD.map((level, i) => {
          const h = 2.5 + level * (22 - 2.5);
          return (
            <span
              key={i}
              className="dk-voice"
              style={{
                width: 2.5,
                height: h,
                borderRadius: 1.25,
                background: C.fg,
                opacity: 0.32 + (i / (HEARD.length - 1)) * 0.68,
                ...({ "--dk-delay": `${-((i * 137) % 900)}ms`, "--dk-lo": String(Math.max(0.2, 1 - level)), "--dk-dur": `${700 + ((i * 53) % 500)}ms` } as CSSProperties),
              }}
            />
          );
        })}
      </span>
      <span style={{ width: 34, height: 34, borderRadius: 17, background: C.tile, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ width: 13, height: 13, borderRadius: 3.5, background: C.fg }} />
      </span>
      <span style={{ width: 34, height: 34, borderRadius: 17, background: C.fg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <ArrowUp size={13} color={C.bg} weight={1.9} />
      </span>
    </div>
  );
}
