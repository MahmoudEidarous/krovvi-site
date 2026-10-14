/**
 * Krovvi's questions as cards in the chat, as the newest app build draws
 * them (catch8 6edb7fca, store build 20): the stack under the message that
 * asks them (components/krovvi-stack.tsx), the deck that deals it one card
 * at a time (components/deck.tsx), and each question's card
 * (components/krovvi-asks.tsx ContractCard, components/answer-bar.tsx).
 *
 * The words above the stack are an ordinary reply of Krovvi's ("Got a few
 * quick ones for you 🙂", KrovviBubbles). The stack goes in the same Turn
 * under them (app/agent.tsx:7160): the Turn's 8 and the stack's own 12 put
 * its head 20 under the bubble.
 *
 * Every piece takes its words and its moment by props, plus className and
 * style, and renders on the server. Motion is CSS (asks.css), the app's own
 * timings and springs; each piece's resting style is its end.
 */

import "./asks.css";

import type { CSSProperties, ReactNode } from "react";

import { emo, type Piece } from "./chat";
import { DeepFace } from "./face";
import { edge } from "./games";
import { ArrowUp, Check, Icon, Mic } from "./glyphs";
import { C, HAIR } from "./tokens";

const cx = (...names: Array<string | false | null | undefined>) => names.filter(Boolean).join(" ") || undefined;
const vars = (o: Record<string, string | number>) => o as CSSProperties;

/** A text of at most `n` lines, cut with an ellipsis (React Native's numberOfLines). */
const lines = (n: number): CSSProperties =>
  n === 1
    ? { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }
    : { display: "-webkit-box", WebkitLineClamp: n, WebkitBoxOrient: "vertical", overflow: "hidden" };

/* ------------------------------------------------------------------ */
/* One question (components/krovvi-asks.tsx, components/answer-bar.tsx) */
/* ------------------------------------------------------------------ */

/** The answer bar's 34 point rounds (answer-bar.tsx:149-151). */
const ROUND: CSSProperties = { width: 34, height: 34, borderRadius: 17, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };

/**
 * The bar under every question (answer-bar.tsx:25-153): always open, a well
 * of the night in the card's glass, 48 tall and round at its ends, 16 in on
 * the words' side. Empty, the placeholder in faint and the mic in a round
 * tile; with words, the words, the way to more room and the ivory send.
 */
export function AnswerBar({ value, placeholder = "Answer, or tell me what's wrong", className, style }: Piece & { value?: string; placeholder?: string }) {
  const has = !!value?.trim();
  return (
    <div className={className} style={{ background: C.bg, borderRadius: 24, ...edge(C.glassEdge), overflow: "hidden", minHeight: 48, display: "flex", flexDirection: "column", justifyContent: "center", padding: HAIR, ...style }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, padding: "6px 6px 6px 16px" }}>
        <span style={{ flex: 1, minWidth: 0, color: has ? C.fg : C.faint, fontSize: 15, lineHeight: "20px", padding: "7px 0", maxHeight: 110, overflow: "hidden", overflowWrap: "break-word" }}>{has ? value : placeholder}</span>
        {has ? (
          <>
            <span style={ROUND}>
              <Icon name="outward" size={13} color={C.muted} weight={1.6} />
            </span>
            <span style={{ ...ROUND, background: C.fg }}>
              <ArrowUp size={12} color={C.bg} weight={2} />
            </span>
          </>
        ) : (
          <span style={{ ...ROUND, background: C.tile }}>
            <Mic size={15} color={C.soft} />
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * One of Krovvi's questions as its card (krovvi-asks.tsx:104-776, styles
 * 834-963): the deck's solid glass at 25 corners, 18 in at the sides, 16 over
 * and 12 under, its parts 12 apart. On top, what it is about (the kind's dot,
 * or the person's face, and "Someone") and where it came from ("· Chat");
 * the question at 19 on 26; Krovvi's reason in muted; the sentence that
 * raised it in quotes, two lines at most; the one tap answers, 40 tall and
 * round, side by side; the answer bar; and Skip in faint at the foot.
 *
 * `picked`: that answer lit, the beat (160 ms) before the card goes
 * (krovvi-asks.tsx:281-299). `answer`: words typed in the bar. `tip`: the
 * line under the bar that shows on the first question a phone ever sees.
 */
export function AskCard({
  what,
  where,
  face,
  question,
  because,
  quote,
  options = [],
  picked = null,
  answer,
  tip = false,
  tipText = "You can say anything here, even that the question is wrong.",
  skip = "Skip",
  stop = null,
  placeholder,
  className,
  style,
}: Piece & {
  /** What it is about: "Someone", "Date", or the person's name with `face`. */
  what: string;
  /** Where it came from: "Chat", "Monday's call, 12 Oct". */
  where?: string;
  /** A person's name: their face heads the card in place of the kind's dot. */
  face?: string;
  question: string;
  because?: string;
  quote?: string;
  options?: string[];
  picked?: number | null;
  answer?: string;
  tip?: boolean;
  tipText?: string;
  skip?: string | null;
  /** Home's "Done for now", at the foot's start. */
  stop?: string | null;
  placeholder?: string;
}) {
  return (
    <div
      className={cx("dk", className)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        background: C.glassSolid,
        borderRadius: 25,
        ...edge(C.glassEdge),
        overflow: "hidden",
        padding: `${16 + HAIR}px ${18 + HAIR}px ${12 + HAIR}px`,
        ...style,
      }}
    >
      {/* What it is about, and where it came from (krovvi-asks.tsx:508-527, 859-862). */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 22 }}>
        {face ? <DeepFace name={face} size={20} /> : <span style={{ width: 6, height: 6, borderRadius: 3, background: C.muted, margin: "0 7px", flexShrink: 0 }} />}
        <span style={{ color: C.muted, fontSize: 12.5, fontWeight: 500, flexShrink: 0, maxWidth: "50%", ...lines(1) }}>{what}</span>
        {where ? <span style={{ color: C.faint, fontSize: 12.5, flexShrink: 1, minWidth: 0, ...lines(1) }}>{`· ${where}`}</span> : null}
      </div>
      <div style={{ color: C.fg, fontSize: 19, lineHeight: "26px", fontWeight: 500, letterSpacing: "-0.35px", marginTop: -4 }}>{question}</div>
      {because ? <div style={{ color: C.muted, fontSize: 13.5, lineHeight: "19px", marginTop: -6 }}>{because}</div> : null}
      {quote ? <div style={{ color: C.soft, fontSize: 14, lineHeight: "21px", marginTop: -4, ...lines(2) }}>{`“${quote}”`}</div> : null}
      {options.length ? (
        // Plain answers side by side, raised a step on the glass; the one tapped lit (krovvi-asks.tsx:667-685, 900-905).
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {options.map((label, i) => {
            const on = picked === i;
            return (
              <span key={i} style={{ minHeight: 40, borderRadius: 20, background: on ? C.fg : C.tile, padding: "0 16px", display: "flex", alignItems: "center", maxWidth: "100%" }}>
                <span style={{ color: on ? C.bg : C.fg, fontSize: 15, fontWeight: 500, letterSpacing: "-0.2px", ...lines(1) }}>{emo(label, 1.26)}</span>
              </span>
            );
          })}
        </div>
      ) : null}
      <AnswerBar value={answer} placeholder={placeholder} />
      {tip ? <div style={{ color: C.muted, fontSize: 12.5, lineHeight: "17px", marginTop: -4, padding: "0 4px" }}>{tipText}</div> : null}
      {/* The foot: Done for now on Home, Skip at the end (krovvi-asks.tsx:736-773, 961-962). */}
      {stop || skip ? (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2px 2px 0" }}>
          {stop ? <span style={{ color: C.faint, fontSize: 13 }}>{stop}</span> : <span />}
          {skip ? <span style={{ color: C.faint, fontSize: 13 }}>{skip}</span> : null}
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The stack (components/krovvi-stack.tsx, components/deck.tsx)          */
/* ------------------------------------------------------------------ */

/** deck.tsx:82-98: the head's room, how far each waiting card shows, how much narrower it is, its plate's colour. */
const HEAD = 26;
const PEEK = [0, 30, 10] as const;
const INSET = [0, 10, 20] as const;
/** plateOf(0.75) and plateOf(0.5): a step from the pane toward the night for each place deeper. */
const PLATE = ["", "#0B0B0D", "#09090A"] as const;

/**
 * The stack under Krovvi's message (krovvi-stack.tsx:139-265, deck.tsx:188-522):
 * where they are in the head ("1 of 3", faint, 4 in), the card on top whole,
 * the cards waiting under it with their edges showing (the next one 30 lower
 * and 10 narrower a side, carrying its question's line; the one after 10
 * lower again), and "Not now" 4 under the deck.
 *
 * `next`: the questions waiting, in order (two show). Give the same strings
 * from one step to the next and their plates slide up a place, as the app's
 * do. Motion for the lead: `rise` is the stack's first appearance (140 ms
 * after Krovvi's words, 240 ms, up 10); after an answer, pass the answered
 * card as `leaving` (lifted off the pile over the new one: words gone in 120
 * ms, up 30, to 0.95 and turned 2 degrees in 260 ms) and set `arrive` so the
 * new top card grows from its plate on the deck's spring while its "2 of 3"
 * fades in. AskCard's `picked` is the 160 ms the tapped answer is lit before.
 */
export function AskStack({
  label,
  next = [],
  children,
  leaving,
  arrive = false,
  later = "Not now",
  rise = false,
  delay = 0,
  className,
  style,
}: Piece & {
  /** "1 of 3"; one question alone says "Krovvi wants to know" in the app (t.people.qTitle). */
  label: string;
  next?: string[];
  /** The card on top: an AskCard. */
  children?: ReactNode;
  /** The card just answered, lifting off over the new top card. */
  leaving?: ReactNode;
  arrive?: boolean;
  /** The quiet way out under the stack; null for none. */
  later?: string | null;
  rise?: boolean;
  delay?: number;
}) {
  const waiting = next.slice(0, 2);
  const peek = waiting.reduce((sum, _, i) => sum + PEEK[i + 1], 0);
  return (
    <div className={cx("dk", rise && "dk-ask-rise", className)} style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 12, ...(rise ? vars({ "--dk-delay": `${delay}ms` }) : null), ...style }}>
      <div style={{ position: "relative", overflow: "hidden", paddingTop: HEAD, paddingBottom: peek + 4 }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: HEAD, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "0 4px" }}>
          <span key={label} className={arrive ? "dk-ask-in" : undefined} style={{ color: C.faint, fontSize: 13, fontWeight: 500, flexShrink: 1, minWidth: 0, ...lines(1) }}>
            {label}
          </span>
        </div>
        {/* The cards waiting, deepest first so the nearer plate covers it (deck.tsx:411-424, 449-482). */}
        {waiting
          .map((line, i) => ({ line, depth: (i + 1) as 1 | 2 }))
          .reverse()
          .map(({ line, depth }) => {
            const offset = waiting.slice(0, depth).reduce((sum, _, i) => sum + PEEK[i + 1], 0);
            return (
              <div
                key={line}
                className="dk-ask-plate"
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: HEAD + offset,
                  bottom: peek + 4 - offset,
                  left: INSET[depth],
                  right: INSET[depth],
                  borderRadius: 25,
                  background: PLATE[depth],
                  zIndex: 10 - depth,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  padding: "0 16px 8px",
                }}
              >
                {depth === 1 ? <span style={{ color: C.faint, fontSize: 12.5, ...lines(1) }}>{line}</span> : null}
              </div>
            );
          })}
        <div className={arrive ? "dk-ask-arrive" : undefined} style={{ position: "relative", zIndex: 100 }}>
          {children}
        </div>
        {leaving ? (
          <div className="dk-ask-away" style={{ position: "absolute", top: HEAD, left: 0, right: 0, zIndex: 101, pointerEvents: "none" }} aria-hidden="true">
            {leaving}
          </div>
        ) : null}
      </div>
      {later ? <span style={{ alignSelf: "flex-start", padding: "4px 0", color: C.muted, fontSize: 13, fontWeight: 500 }}>{later}</span> : null}
    </div>
  );
}

/**
 * What the stack folds into (krovvi-stack.tsx:207-229, 263-264): one quiet
 * line 12 under Krovvi's words. "Later 👌" after Not now; "All 3 answered"
 * (or "Answered" for one) with a muted check before it once the last card is
 * answered. `live`: folded on this screen just now, so the line fades in and
 * the check pops.
 */
export function AskFold({ text, check = false, live = false, className, style }: Piece & { text: string; check?: boolean; live?: boolean }) {
  return (
    <div className={cx("dk", live && "dk-ask-in", className)} style={{ display: "flex", alignItems: "center", alignSelf: "flex-start", gap: 6, marginTop: 12, padding: "2px 0", ...style }}>
      {check ? (
        <span className={live ? "dk-ask-check" : undefined} style={{ display: "flex" }}>
          <Check size={10} color={C.muted} weight={1.8} />
        </span>
      ) : null}
      <span style={{ color: C.muted, fontSize: 13 }}>{emo(text, 1.26)}</span>
    </div>
  );
}
