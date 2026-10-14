/**
 * The games Krovvi plays in the chat, as the newest app build draws them
 * (catch8 6edb7fca, store build 20: src/components/games/*.tsx), at the
 * app's own points on the site's 393 x 852 phone canvas.
 *
 * A game stands in Krovvi's column under the words that deal it
 * (app/agent.tsx:7163): put it in a Turn after KrovviBubbles. The Turn keeps
 * its pieces 8 apart (agent.tsx:8599 answerWrap) and each game adds its own
 * 12 on top (`game: { marginTop: space.md }` in every game's styles), so the
 * game's head stands 20 under Krovvi's last bubble.
 *
 * Every piece takes its words and its moment by props, plus className and
 * style, and renders on the server. Motion is CSS (games.css): the app's
 * springs as linear() curves, its timings as they are. Each piece's resting
 * style is its end, so with motion reduced it simply shows it.
 */

import "./games.css";

import type { CSSProperties, ReactNode } from "react";

import { emo, type Piece } from "./chat";
import { ArrowUp, Check, Icon, KrovviK, Mic } from "./glyphs";
import { Sheet } from "./sheets";
import { C, HAIR } from "./tokens";

const cx = (...names: Array<string | false | null | undefined>) => names.filter(Boolean).join(" ") || undefined;
const vars = (o: Record<string, string | number>) => o as CSSProperties;

/** A text of at most `n` lines, cut with an ellipsis (React Native's numberOfLines). */
const lines = (n: number): CSSProperties =>
  n === 1
    ? { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }
    : { display: "-webkit-box", WebkitLineClamp: n, WebkitBoxOrient: "vertical", overflow: "hidden" };

/**
 * One hairline round a pane, one device pixel on the 3x phone
 * (StyleSheet.hairlineWidth), drawn inside its edge as React Native draws a
 * border. An inset shadow, not a border: Chrome rounds any border thinner
 * than 1 CSS pixel up to a whole pixel (computed "1px"), three times the
 * app's line on a 3x screen, where a shadow stays one device pixel. The
 * border took HAIR of the box in the app, so paddings beside one add HAIR.
 */
export const edge = (color: string): CSSProperties => ({ boxShadow: `inset 0 0 0 ${HAIR}px ${color}` });

/** The deck's solid glass at the deck's corner, edged and clipped: the card every game is played on (games/parts.tsx:80-87). */
export const GAME_PANE: CSSProperties = { background: C.glassSolid, borderRadius: 25, ...edge(C.glassEdge), overflow: "hidden" };

/** A tile raised a step on the glass: an answer, a side, a statement (theme/tokens.ts tile). */
const TILE = C.tile;

/* ------------------------------------------------------------------ */
/* The parts every game is made of (games/parts.tsx)                   */
/* ------------------------------------------------------------------ */

/**
 * The quiet head over a game (parts.tsx:36-50, 239-241): its name on the
 * left and where they are in it on the right ("3 of 10", "Tap the lie",
 * "You caught it"), both faint, 4 in from the card's edge, 22 tall, 6 over
 * the card.
 */
export function GameHead({ name, count, className, style }: Piece & { name: string; count?: string | null }) {
  return (
    <div className={className} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "0 4px", minHeight: 22, marginBottom: 6, ...style }}>
      <span style={{ color: C.faint, fontSize: 13, fontWeight: 500, flexShrink: 1, minWidth: 0, ...lines(1) }}>{name}</span>
      {count ? <span style={{ color: C.faint, fontSize: 12.5, fontWeight: 500, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", flexShrink: 0 }}>{count}</span> : null}
    </div>
  );
}

/**
 * A game in the chat: 12 under the Turn's own 8, so 20 under Krovvi's words.
 * `rise`: its first appearance, rising 14 points from 0.97 and fading in a
 * beat after Krovvi's words, on the deck's spring (parts.tsx:57-75).
 */
function Game({ rise, delay = 0, children, className, style }: Piece & { rise?: boolean; delay?: number; children?: ReactNode }) {
  return (
    <div className={cx("dk", rise && "dk-game-rise", className)} style={{ marginTop: 12, ...(rise ? vars({ "--dk-delay": `${delay}ms` }) : null), ...style }}>
      {children}
    </div>
  );
}

/**
 * A round that was played, folded into one line of how it went (parts.tsx:121-193,
 * 242-250): a 15 point muted disc with the check, the words in muted 13 on
 * 18, 7 apart, and a faint chevron when it opens to show the round (`open`
 * turns it a quarter and draws `children` 8 under it). `marks`: the round's
 * dots under the line, 6 across and 5 apart, lit ivory for each card Krovvi
 * called or they knew, the rest muted at a quarter. `live`: the dots light
 * one after another as the round folds, 70 ms each, 120 ms in.
 */
export function GameFolded({
  text,
  marks,
  chevron = true,
  open = false,
  live = false,
  children,
  className,
  style,
}: Piece & { text: string; marks?: boolean[]; chevron?: boolean; open?: boolean; live?: boolean; children?: ReactNode }) {
  return (
    <div className={cx("dk", className)} style={{ display: "flex", flexDirection: "column", marginTop: 12, ...style }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, alignSelf: "flex-start", padding: "3px 0", maxWidth: "100%" }}>
        <span style={{ width: 15, height: 15, borderRadius: 7.5, background: C.muted, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Check size={9} color={C.bg} weight={1.8} />
        </span>
        <span style={{ color: C.muted, fontSize: 13, lineHeight: "18px", flexShrink: 1, minWidth: 0, ...lines(2) }}>{emo(text, 1.26)}</span>
        {chevron ? (
          <span style={{ display: "flex", flexShrink: 0, transform: open ? "rotate(90deg)" : undefined, transition: "transform 190ms cubic-bezier(0.23, 1, 0.32, 1)" }}>
            <Icon name="chevronRight" size={8} color={C.faint} weight={1.7} />
          </span>
        ) : null}
      </div>
      {marks?.length ? (
        <div style={{ display: "flex", gap: 5, padding: "0 4px", marginTop: 6 }} aria-hidden="true">
          {marks.map((on, i) => (
            <span
              key={i}
              className={live && on ? "dk-dot-light" : undefined}
              style={{ width: 6, height: 6, borderRadius: 3, background: on ? C.fg : C.muted, opacity: on ? 1 : 0.25, ...(live && on ? vars({ "--dk-delay": `${i * 70}ms` }) : null) }}
            />
          ))}
        </div>
      ) : null}
      {open && children ? <div style={{ marginTop: 8 }}>{children}</div> : null}
    </div>
  );
}

/** A quiet word that is a button: Your turn, Hint, Give up (parts.tsx:215-233, 256-258). */
export function GameQuiet({ label, dim = false, className, style }: Piece & { label: string; dim?: boolean }) {
  return (
    <span className={className} style={{ display: "flex", alignSelf: "flex-start", padding: "4px 0", opacity: dim ? 0.4 : 1, ...style }}>
      <span style={{ color: C.muted, fontSize: 13.5, fontWeight: 500, whiteSpace: "nowrap" }}>{label}</span>
    </span>
  );
}

/** The one bright button of a moment: Send, Next, Done (parts.tsx:195-213, 251-255). `wide` runs it edge to edge. */
export function GameBright({ label, wide = false, dim = false, className, style }: Piece & { label: string; wide?: boolean; dim?: boolean }) {
  return (
    <span
      className={className}
      style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 44, borderRadius: 22, background: C.fg, padding: "0 24px", alignSelf: wide ? "stretch" : "flex-start", opacity: dim ? 0.35 : 1, ...style }}
    >
      <span style={{ color: C.bg, fontSize: 15, fontWeight: 600, letterSpacing: "-0.2px", whiteSpace: "nowrap" }}>{label}</span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Two truths and a lie (games/two-truths.tsx)                          */
/* ------------------------------------------------------------------ */

export interface Truth {
  text: string;
  /** This one is the made-up one. */
  lie?: boolean;
  /** Krovvi's line about it once the cards turn over ("She moved there in March."). */
  note?: string;
}

/**
 * Two truths and a lie, Krovvi's three about them (two-truths.tsx:45-139,
 * 147-253, styles 440-487). `pick`: three cards to tap, each a numbered line
 * on a tile of the glass. `revealed`: every card turned over, saying what it
 * was (the lie in the one bright tag, a truth quietly) with Krovvi's note,
 * and each truth asking Right or Not right; the line under the cards asks
 * "Were the other two right?" until both are marked.
 *
 * `picked` is the card they tapped as the lie: the head then says how it
 * went on the right ("You caught it", or the app's "Not the lie" when Krovvi
 * fooled them; `outcome` to say it otherwise), and in `pick` that card is
 * lit, the frame the finger lands. `marks[i]`: true lights Right, false
 * lights Not right. `flip` (with `revealed` and `picked`): play the turn
 * over, as the app does after the tap: each card folds to its edge and opens
 * again in 300 ms, 220 ms in and 90 ms later for each place away from the
 * card tapped, the lit front giving way to the back when it is edge on.
 */
export function TwoTruths({
  statements,
  stage = "pick",
  picked = null,
  marks,
  outcome,
  name = "Two truths and a lie",
  ask = "Were the other two right?",
  flip = false,
  rise = false,
  delay = 0,
  className,
  style,
}: Piece & {
  statements: Truth[];
  stage?: "pick" | "revealed";
  picked?: number | null;
  marks?: Array<boolean | null | undefined>;
  outcome?: string;
  name?: string;
  /** The line under the cards once they turn over; null for none. */
  ask?: string | null;
  flip?: boolean;
  rise?: boolean;
  /** ms before the rise starts (after its own 140). */
  delay?: number;
}) {
  const lieAt = statements.findIndex((s) => s.lie);
  const revealed = stage === "revealed";
  const verdict = picked === null ? null : (outcome ?? (picked === lieAt ? "You caught it" : "Not the lie"));
  const marked = statements.every((s, i) => s.lie || (marks?.[i] ?? null) !== null);
  return (
    <Game rise={rise} delay={delay} className={className} style={style}>
      <GameHead name={name} count={verdict ?? "Tap the lie"} />
      <div style={{ ...GAME_PANE, padding: 9 + HAIR, display: "flex", flexDirection: "column", gap: 8 }}>
        {statements.map((s, i) => (
          <TruthTile key={i} statement={s} at={i} picked={picked === i} revealed={revealed} flip={flip && revealed && picked !== null} delay={picked === null ? 0 : 90 * Math.abs(i - picked)} mark={marks?.[i] ?? null} />
        ))}
        {revealed && !marked && ask ? <div style={{ color: C.muted, fontSize: 13, lineHeight: "18px", padding: "2px 4px" }}>{ask}</div> : null}
      </div>
    </Game>
  );
}

/** One card's line: its number in a 22 point disc and the statement, 16 on 22, medium (two-truths.tsx:205-210, 446-452). */
function TruthLine({ at, text, lit }: { at: number; text: string; lit: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
      <span style={{ width: 22, height: 22, borderRadius: 11, background: lit ? "rgba(3,3,3,0.12)" : "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ color: lit ? C.bg : C.soft, fontSize: 12, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{at + 1}</span>
      </span>
      <span style={{ flex: 1, minWidth: 0, color: lit ? C.bg : C.fg, fontSize: 16, lineHeight: "22px", fontWeight: 500, letterSpacing: "-0.25px" }}>{text}</span>
    </div>
  );
}

function TruthTile({ statement, at, picked, revealed, flip, delay, mark }: { statement: Truth; at: number; picked: boolean; revealed: boolean; flip: boolean; delay: number; mark: boolean | null }) {
  const lit = picked && !revealed;
  const timing = flip ? vars({ "--dk-delay": `${delay}ms` }) : undefined;
  return (
    <div className={flip ? "dk-tt-turn" : undefined} style={timing}>
      <div style={{ position: "relative", borderRadius: 16, background: lit ? C.fg : TILE, padding: 12 }}>
        <TruthLine at={at} text={statement.text} lit={lit} />
        {revealed ? (
          <div className={flip ? "dk-tt-back" : undefined} style={{ overflow: "hidden", ...timing }}>
            {/* Under the words, past the number (two-truths.tsx:211-221, 453-469). */}
            <div style={{ paddingTop: 8, paddingLeft: 32, display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <span style={{ height: 22, padding: "0 9px", borderRadius: 11, background: statement.lie ? C.fg : "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", flexShrink: 0 }}>
                  <span style={{ color: statement.lie ? C.bg : C.soft, fontSize: 11.5, fontWeight: 600, whiteSpace: "nowrap" }}>{statement.lie ? "The lie" : "True"}</span>
                </span>
                {statement.note ? (
                  <span style={{ flex: 1, minWidth: 0, color: C.soft, fontSize: 13.5, lineHeight: "19px", marginTop: 1.5 }}>{statement.note}</span>
                ) : picked ? (
                  <span style={{ color: C.faint, fontSize: 12 }}>Your pick</span>
                ) : null}
              </div>
              {statement.lie ? null : (
                <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                  {([true, false] as const).map((value) => {
                    const on = mark === value;
                    return (
                      <span key={String(value)} style={{ height: 30, padding: "0 13px", borderRadius: 15, background: on ? C.fg : "rgba(255,255,255,0.08)", display: "flex", alignItems: "center" }}>
                        <span style={{ color: on ? C.bg : C.fg2, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>{value ? "Right" : "Not right"}</span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : null}
        {flip && picked ? (
          // The tapped card's lit front, until it is edge on.
          <div className="dk-tt-lit" style={{ position: "absolute", inset: 0, borderRadius: 16, background: C.fg, padding: 12, ...timing }} aria-hidden="true">
            <TruthLine at={at} text={statement.text} lit />
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* This or That (games/this-or-that.tsx)                                */
/* ------------------------------------------------------------------ */

export interface PairSide {
  emoji?: string;
  label: string;
}

export interface Pair {
  a: PairSide;
  b: PairSide;
  /** Krovvi's guess, made before they pick and shown once they do. */
  guess?: "a" | "b";
}

/** this-or-that.tsx:107-115: the card, how far each waiting one shows under it, how much narrower, its plate's colour. */
const CARD_H = 168;
const PEEK = [0, 10, 8] as const;
const INSET = [0, 10, 20] as const;
const PLATE = ["", "#0D0D0F", "#09090A"] as const;
const CHOOSE_AT = 84;
/** How far the leaving card travels: 0.95 of the window (this-or-that.tsx:332), the site's phone is 393 points wide. */
const AWAY = 393 * 0.95;

/** A side leaning toward the pull grows a hair, the other steps back (this-or-that.tsx:239-244). `toward` is 1 when a pull to the right is toward it. */
function lean(pull: number, toward: 1 | -1): CSSProperties {
  const p = Math.max(-1, Math.min(1, pull / CHOOSE_AT)) * toward;
  return { transform: p > 0 ? `scale(${1 + 0.035 * p})` : undefined, opacity: p < 0 ? 1 - 0.35 * -p : 1 };
}

/**
 * This or That (this-or-that.tsx:43-100, 117-375, styles 377-429): one card
 * whole on top of the deck with its two sides to tap or swipe toward, the
 * "or" between them, the next cards' edges under it, "1 of 10" in the head,
 * and Krovvi's line under the deck.
 *
 * `pull` is how far a finger has the card, in points (below 0 toward the
 * left side, over 0 toward the right): the card follows and turns pull / 22
 * degrees, the side it leans to grows a hair and the other steps back. Change
 * it over time to draw a swipe: frame by frame, or in steps with `glide` (ms),
 * which eases each change on the app's curve. `chosen`: that side lights, the other steps
 * back to 0.32, and Krovvi's guess shows on the side it guessed (`pop`: it
 * pops in, as at the tap). `leaving`: the card just chosen, drawn over this
 * one and lifting off toward its side (`from` is where it stood, 56 after a
 * swipe). `arrive`: this card grows from its plate, as each new card does.
 */
export function ThisOrThat({
  pair,
  at = 1,
  total = 10,
  pull = 0,
  glide = 0,
  chosen = null,
  pop = false,
  line,
  waiting,
  leaving,
  arrive = false,
  name = "This or That",
  rise = false,
  delay = 0,
  className,
  style,
}: Piece & {
  pair: Pair;
  /** Which card this is, from 1. */
  at?: number;
  total?: number;
  pull?: number;
  glide?: number;
  chosen?: "a" | "b" | null;
  pop?: boolean;
  /** Krovvi's line under the deck ("I already guessed each of yours 😏"). */
  line?: string;
  /** How many cards wait under this one (their edges show): 2 at most. By default what is left of the round. */
  waiting?: number;
  leaving?: { pair: Pair; chosen: "a" | "b"; from?: number };
  arrive?: boolean;
  name?: string;
  rise?: boolean;
  delay?: number;
}) {
  const under = Math.max(0, Math.min(2, waiting ?? total - at));
  return (
    <Game rise={rise} delay={delay} className={className} style={style}>
      <GameHead name={name} count={`${at} of ${total}`} />
      <div style={{ position: "relative", height: CARD_H + PEEK[1] + PEEK[2] }}>
        {[2, 1]
          .filter((depth) => depth <= under)
          .map((depth) => (
            <div
              key={depth}
              aria-hidden="true"
              style={{ position: "absolute", top: 0, left: INSET[depth], right: INSET[depth], height: CARD_H, borderRadius: 25, background: PLATE[depth], transform: `translateY(${depth === 1 ? PEEK[1] : PEEK[1] + PEEK[2]}px)`, zIndex: 10 - depth }}
            />
          ))}
        <PairCard key={`card${at}`} pair={pair} pull={pull} glide={glide} chosen={chosen} pop={pop} className={arrive ? "dk-tot-arrive" : undefined} />
        {leaving ? <LeavingCard key={`gone${at}`} {...leaving} /> : null}
      </div>
      {line ? <div style={{ color: C.muted, fontSize: 13, lineHeight: "18px", marginTop: 8, padding: "0 4px" }}>{emo(line, 1.26)}</div> : null}
    </Game>
  );
}

function PairCard({ pair, pull = 0, glide = 0, chosen, pop = false, className, style }: Piece & { pair: Pair; pull?: number; glide?: number; chosen: "a" | "b" | null; pop?: boolean }) {
  const label = `${pair.a.label} or ${pair.b.label}`;
  const ease = glide ? `transform ${glide}ms cubic-bezier(0.23, 1, 0.32, 1), opacity ${glide}ms cubic-bezier(0.23, 1, 0.32, 1)` : undefined;
  return (
    <div
      className={className}
      role="img"
      aria-label={label}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: CARD_H,
        padding: 9 + HAIR,
        zIndex: 20,
        ...GAME_PANE,
        transform: pull ? `translateX(${pull}px) rotate(${pull / 22}deg)` : undefined,
        transition: ease,
        ...style,
      }}
    >
      <div style={{ display: "flex", gap: 9, height: "100%" }}>
        <div style={{ flex: 1, minWidth: 0, ...lean(pull, -1), transition: ease }}>
          <SideTile side={pair.a} picked={chosen === "a"} aside={chosen === "b"} guessed={chosen ? pair.guess === "a" : false} pop={pop} />
        </div>
        <div style={{ flex: 1, minWidth: 0, ...lean(pull, 1), transition: ease }}>
          <SideTile side={pair.b} picked={chosen === "b"} aside={chosen === "a"} guessed={chosen ? pair.guess === "b" : false} pop={pop} />
        </div>
      </div>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
        <span style={{ width: 30, height: 30, borderRadius: 15, background: C.glassSolid, ...edge(C.glassEdge), display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: C.muted, fontSize: 11.5, fontWeight: 600 }}>or</span>
        </span>
      </div>
    </div>
  );
}

/** One side: its emoji at 38 on 46 and its words, 16.5 on 21 semibold; chosen it is the bright thing, the other side's words step back (this-or-that.tsx:250-303, 387-407). */
function SideTile({ side, picked, aside, guessed, pop }: { side: PairSide; picked: boolean; aside: boolean; guessed: boolean; pop: boolean }) {
  return (
    <div style={{ position: "relative", height: "100%", borderRadius: 18, background: picked ? C.fg : TILE, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 12px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, opacity: aside ? 0.32 : 1 }}>
        {side.emoji ? <span style={{ fontSize: 38, lineHeight: "46px" }}>{emo(side.emoji, 1)}</span> : null}
        <span style={{ color: picked ? C.bg : C.fg, fontSize: 16.5, lineHeight: "21px", fontWeight: 600, letterSpacing: "-0.3px", textAlign: "center", ...lines(2) }}>{side.label}</span>
      </div>
      {guessed ? (
        // Krovvi's guess, on the side it guessed: dark on the bright side, light on the other (this-or-that.tsx:293-300, 403-407).
        <span style={{ position: "absolute", top: 9, left: 0, right: 0, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
          <span className={pop ? "dk-tot-guess" : undefined} style={{ display: "flex", alignItems: "center", gap: 4, height: 20, padding: "0 7px", borderRadius: 10, background: picked ? "rgba(3,3,3,0.09)" : "rgba(255,255,255,0.12)" }}>
            <KrovviK size={9} color={picked ? C.bg : C.fg} />
            <span style={{ color: picked ? C.bg : C.fg, fontSize: 10.5, fontWeight: 600, letterSpacing: "0.1px", whiteSpace: "nowrap" }}>Krovvi&apos;s guess</span>
          </span>
        </span>
      ) : null}
    </div>
  );
}

/** The chosen card lifting off the deck toward the side chosen, turning as it goes (this-or-that.tsx:305-347). Its resting style is where it ends; games.css plays it from where it stood. */
function LeavingCard({ pair, chosen, from = 0 }: { pair: Pair; chosen: "a" | "b"; from?: number }) {
  const toward = chosen === "b" ? 1 : -1;
  const to = from + toward * AWAY;
  return (
    <PairCard
      pair={pair}
      chosen={chosen}
      className="dk-tot-leave"
      style={{
        zIndex: 30,
        opacity: 0,
        transform: `translate(${to}px, -14px) rotate(${from / 22 + toward * 12}deg)`,
        pointerEvents: "none",
        ...vars({ "--dk-from": `${from}px`, "--dk-from-turn": `${from / 22}deg` }),
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Guess what I'm thinking (games/guess.tsx)                            */
/* ------------------------------------------------------------------ */

/**
 * One question asked and answered, folded into a line so the game reads down
 * the chat (guess.tsx:106-116, 316-320): the count faint, the question muted
 * 13.5 on 19, their answer two spaces after it in fg2 semibold, all 4 in
 * from the column and 12 under what is above. "4 of 20  Is it taller than a
 * person?  Yes".
 */
export function GuessStep({ count, question, answer, className, style }: Piece & { count: string; question: string; answer?: string }) {
  return (
    <div className={cx("dk", className)} style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 12, padding: "0 4px", ...style }}>
      <span style={{ color: C.faint, fontSize: 12, fontWeight: 500, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{count}</span>
      <span style={{ flex: 1, minWidth: 0, color: C.muted, fontSize: 13.5, lineHeight: "19px", ...lines(2) }}>
        {question}
        {answer ? <span style={{ color: C.fg2, fontWeight: 600, whiteSpace: "pre-wrap" }}>{`  ${answer}`}</span> : null}
      </span>
    </div>
  );
}

/**
 * The end of a round Krovvi won (guess.tsx:215-231, 275-290, 295-326): the
 * game's name over the card, a check in a 46 point ivory disc, what it was
 * at 26 bold, and "Got it in 5" under it. `pop`: the disc pops in, 160 ms
 * after the card lands, as it does the first time.
 */
export function GuessWon({ word, steps = 5, line, name = "Guess what I'm thinking", pop = false, rise = false, delay = 0, className, style }: Piece & { word: string; steps?: number; line?: string; name?: string; pop?: boolean; rise?: boolean; delay?: number }) {
  return (
    <Game rise={rise} delay={delay} className={className} style={style}>
      <GameHead name={name} />
      <div style={{ ...GAME_PANE, padding: 16 + HAIR, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <span className={pop ? "dk-guess-found" : undefined} style={{ width: 46, height: 46, borderRadius: 23, background: C.fg, display: "flex", alignItems: "center", justifyContent: "center", ...(pop ? vars({ "--dk-delay": `${delay}ms` }) : null) }}>
          <Check size={20} color={C.bg} weight={2.4} />
        </span>
        <span style={{ color: C.fg, fontSize: 26, lineHeight: "33px", fontWeight: 700, letterSpacing: "-0.7px", textAlign: "center" }}>{word}</span>
        <span style={{ color: C.muted, fontSize: 13.5, lineHeight: "19px", textAlign: "center", marginTop: -6 }}>{line ?? `Got it in ${steps}`}</span>
      </div>
    </Game>
  );
}

/**
 * The start of a round (guess.tsx:48-76, 295-301): the ring with its
 * question mark, "Think of anything" at 20 semibold, the line under it, and
 * Got one, the bright thing; "20 questions" in the head. `ready`: Got one was
 * tapped and steps back to 0.35 while it goes. `live`: the ring breathes.
 */
export function GuessThink({
  of = 20,
  title = "Think of anything",
  line = "A person, an animal, a thing or a place. Keep it to yourself.",
  ready = false,
  live = false,
  breath = 1,
  name = "Guess what I'm thinking",
  rise = false,
  delay = 0,
  className,
  style,
}: Piece & { of?: number; title?: string; line?: string; ready?: boolean; live?: boolean; breath?: number; name?: string; rise?: boolean; delay?: number }) {
  return (
    <Game rise={rise} delay={delay} className={className} style={style}>
      <GameHead name={name} count={`${of} questions`} />
      <div style={{ ...GAME_PANE, padding: 16 + HAIR, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <ThinkingMark size={54} live={live} breath={breath} />
        <span style={{ color: C.fg, fontSize: 20, lineHeight: "26px", fontWeight: 600, letterSpacing: "-0.5px", textAlign: "center" }}>{title}</span>
        <span style={{ color: C.muted, fontSize: 13.5, lineHeight: "19px", textAlign: "center", marginTop: -6 }}>{line}</span>
        <div style={{ marginTop: 2, display: "flex" }}>
          <GameBright label="Got one" dim={ready} />
        </div>
      </div>
    </Game>
  );
}

/**
 * One of Krovvi's questions while it is theirs to answer (guess.tsx:97-183,
 * 295-315): the question at 21 on 28, Yes and No big, Not sure and Probably
 * quieter under them, the count in the head. `final` is Krovvi's guess
 * itself ("A giraffe"): "Krovvi's guess" over it, and only Yes! and No.
 * `chosen`: that answer lights and the others step back to 0.35.
 */
export function GuessQuestion({
  question,
  final,
  count,
  chosen = null,
  name = "Guess what I'm thinking",
  rise = false,
  delay = 0,
  className,
  style,
}: Piece & { question?: string; final?: string; count: string; chosen?: "yes" | "no" | "unsure" | "probably" | null; name?: string; rise?: boolean; delay?: number }) {
  const answer = (key: "yes" | "no" | "unsure" | "probably", label: string, big: boolean) => {
    const on = chosen === key;
    const off = chosen !== null && !on;
    return (
      <span
        key={key}
        style={{ flex: 1, height: big ? 52 : 40, borderRadius: 16, background: on ? C.fg : big ? TILE : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", opacity: off ? 0.35 : 1 }}
      >
        <span style={big ? { color: on ? C.bg : C.fg, fontSize: 17, fontWeight: 600, letterSpacing: "-0.3px" } : { color: on ? C.bg : C.fg2, fontSize: 14, fontWeight: 500 }}>{label}</span>
      </span>
    );
  };
  return (
    <Game rise={rise} delay={delay} className={className} style={style}>
      <GameHead name={name} count={count} />
      <div style={{ ...GAME_PANE, padding: 16 + HAIR, display: "flex", flexDirection: "column", gap: 12 }}>
        {final ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ color: C.muted, fontSize: 14, fontWeight: 500 }}>Krovvi&apos;s guess</span>
            <span style={{ color: C.fg, fontSize: 28, lineHeight: "36px", fontWeight: 700, letterSpacing: "-0.8px" }}>{`${final}?`}</span>
          </div>
        ) : (
          <span style={{ color: C.fg, fontSize: 21, lineHeight: "28px", fontWeight: 600, letterSpacing: "-0.5px" }}>{question}</span>
        )}
        <div style={{ display: "flex", gap: 9 }}>
          {answer("yes", final ? "Yes!" : "Yes", true)}
          {answer("no", "No", true)}
        </div>
        {final ? null : (
          <div style={{ display: "flex", gap: 9, marginTop: -3 }}>
            {answer("unsure", "Not sure", false)}
            {answer("probably", "Probably", false)}
          </div>
        )}
      </div>
    </Game>
  );
}

/* ------------------------------------------------------------------ */
/* Quick trivia (games/trivia.tsx)                                      */
/* ------------------------------------------------------------------ */

/** trivia.tsx:196-197, the warm red kept for the mark of a wrong answer. */
const WRONG = "#E07A70";

export interface TriviaQuestion {
  q: string;
  options: string[];
  /** Which option is right. */
  answer: number;
  /** Krovvi's one line of why, once answered. */
  why?: string;
}

/**
 * Quick trivia, one question (trivia.tsx:26-102, 110-194, styles 199-223):
 * the clock running down 20 seconds, the question at 18.5 on 25, three or
 * four answers 48 tall. `chosen` (an option, or -1 for out of time): the
 * right one lights with a check, a wrong pick turns warm red with a cross
 * and the right one keeps a check beside it, the rest step back to 0.4,
 * Krovvi's why comes under them and Next (or Done) is the bright thing.
 * `clock` is how much time is left (1 full); `running` lets it run down.
 */
export function Trivia({
  question,
  at = 1,
  total = 5,
  topic,
  chosen = null,
  clock,
  running = false,
  last = false,
  name = "Quick trivia",
  rise = false,
  delay = 0,
  className,
  style,
}: Piece & { question: TriviaQuestion; at?: number; total?: number; topic?: string; chosen?: number | null; clock?: number; running?: boolean; last?: boolean; name?: string; rise?: boolean; delay?: number }) {
  const left = clock ?? (chosen === null ? 1 : 0.8);
  const state = (i: number) => (chosen === null ? "open" : i === question.answer ? (chosen === i ? "right" : "shown") : chosen === i ? "wrong" : "aside");
  return (
    <Game rise={rise} delay={delay} className={className} style={style}>
      <GameHead name={topic ? `${name} · ${topic}` : name} count={`${at} of ${total}`} />
      <div style={{ ...GAME_PANE, padding: 12 + HAIR, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ position: "relative", height: 3, borderRadius: 1.5, background: "rgba(255,255,255,0.07)", overflow: "hidden" }} aria-hidden="true">
            <span
              className={running && chosen === null ? "dk-clock" : undefined}
              style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: "100%", borderRadius: 1.5, background: C.fg, transformOrigin: "left", transform: `scaleX(${running ? 0 : left})`, opacity: running ? 0.25 : 0.25 + 0.5 * left }}
            />
          </div>
          <span style={{ color: C.fg, fontSize: 18.5, lineHeight: "25px", fontWeight: 600, letterSpacing: "-0.4px" }}>{question.q}</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {question.options.map((option, i) => {
              const s = state(i);
              return (
                <span
                  key={i}
                  style={{
                    minHeight: 48,
                    borderRadius: 14,
                    background: s === "right" ? C.fg : s === "wrong" ? "rgba(196,87,79,0.24)" : s === "shown" ? "rgba(237,237,235,0.14)" : TILE,
                    opacity: s === "aside" ? 0.4 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 14px",
                  }}
                >
                  <span style={{ flex: 1, minWidth: 0, color: s === "right" ? C.bg : C.fg, fontSize: 15.5, fontWeight: 500, letterSpacing: "-0.2px", ...lines(2) }}>{option}</span>
                  {s === "right" ? <Check size={13} color={C.bg} weight={2.2} /> : s === "shown" ? <Check size={13} color={C.fg} weight={2.2} /> : s === "wrong" ? <Icon name="cross" size={12} color={WRONG} weight={2} /> : null}
                </span>
              );
            })}
          </div>
          {chosen === -1 ? <span style={{ color: C.muted, fontSize: 13, fontWeight: 600 }}>Time&apos;s up</span> : null}
          {chosen !== null && question.why ? <span style={{ color: C.soft, fontSize: 14, lineHeight: "20px" }}>{question.why}</span> : null}
        </div>
        {chosen !== null ? <GameBright label={last ? "Done" : "Next"} wide /> : null}
      </div>
    </Game>
  );
}

/* ------------------------------------------------------------------ */
/* Emoji riddles (games/emoji.tsx)                                      */
/* ------------------------------------------------------------------ */

/**
 * Letters spaced as iOS spaces them in the app: React Native's letterSpacing
 * lands once for every UTF-16 unit, so an emoji (two units, more for a joined
 * one) is followed by twice the space or more (measured on
 * games-2026-10-14/emoji-en-1-fresh.png: 12 points between the lion and the
 * crown at letterSpacing 4, where Chrome puts 8). Each character here carries
 * that much after it; the line's last one a unit less, which centres the
 * pair where the capture has it.
 */
function spaced(text: string, spacing: number): ReactNode {
  const parts = typeof Intl !== "undefined" && "Segmenter" in Intl ? [...new Intl.Segmenter("en", { granularity: "grapheme" }).segment(text)].map((p) => p.segment) : Array.from(text);
  return parts.map((part, i) => (
    <span key={i} style={{ letterSpacing: `${spacing * (i === parts.length - 1 ? part.length - 1 : part.length)}px` }}>
      {part}
    </span>
  ));
}

/**
 * Emoji riddles, one riddle (emoji.tsx:27-136, 144-220, styles 222-247): what
 * kind of thing it is, quietly, the emoji at 46 on 58, the field for their
 * guess with its round send, and Hint and Give up under it. `guess` is what
 * they typed (the send lights); `hint` shows Krovvi's hint under the emoji;
 * `miss` says "Not quite" under the field; `solved` lights the answer with a
 * check, `gave` shows "It was ...".
 */
export function EmojiRiddle({
  emoji,
  kind,
  at = 1,
  total = 5,
  guess,
  hint,
  miss = false,
  answer,
  solved = false,
  gave = false,
  name = "Emoji riddles",
  rise = false,
  delay = 0,
  className,
  style,
}: Piece & { emoji: string; kind?: string; at?: number; total?: number; guess?: string; hint?: string; miss?: boolean; answer?: string; solved?: boolean; gave?: boolean; name?: string; rise?: boolean; delay?: number }) {
  const ready = !!guess?.trim();
  const done = (solved || gave) && answer;
  return (
    <Game rise={rise} delay={delay} className={className} style={style}>
      <GameHead name={name} count={`${at} of ${total}`} />
      <div style={{ ...GAME_PANE, padding: 16 + HAIR, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, paddingTop: 2 }}>
          {kind ? <span style={{ color: C.muted, fontSize: 12.5, fontWeight: 600, letterSpacing: "0.2px" }}>{kind}</span> : null}
          <span style={{ fontSize: 46, lineHeight: "58px", textAlign: "center" }}>{spaced(emoji, 4)}</span>
        </div>
        {hint ? <span style={{ color: C.soft, fontSize: 14, lineHeight: "20px", textAlign: "center", marginTop: -4 }}>{hint}</span> : null}
        {done ? (
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 48, borderRadius: 24, padding: "0 16px", background: solved ? C.fg : "rgba(255,255,255,0.06)" }}>
            {solved ? <Check size={13} color={C.bg} weight={2.2} /> : null}
            <span style={{ color: solved ? C.bg : C.fg2, fontSize: 16, fontWeight: 600, letterSpacing: "-0.2px", textAlign: "center" }}>{solved ? answer : `It was: ${answer}`}</span>
          </span>
        ) : null}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: TILE, borderRadius: 24, paddingLeft: 16, paddingRight: 6, minHeight: 48 }}>
            <span style={{ flex: 1, minWidth: 0, padding: "12px 0", fontSize: 16, color: ready ? C.fg : C.faint, ...lines(1) }}>{ready ? guess : "Your guess"}</span>
            <span style={{ width: 36, height: 36, borderRadius: 18, background: ready ? C.fg : "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <ArrowUp size={14} color={ready ? C.bg : C.faint} weight={2} />
            </span>
          </div>
          {miss ? <span style={{ color: C.muted, fontSize: 12.5, padding: "0 8px" }}>Not quite</span> : null}
        </div>
        {done ? null : (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0 4px" }}>
            {hint === undefined ? <GameQuiet label="Hint" /> : <GameQuiet label="Hint" dim />}
            <GameQuiet label="Give up" />
          </div>
        )}
      </div>
    </Game>
  );
}

/* ------------------------------------------------------------------ */
/* The shelf (games/shelf.tsx)                                          */
/* ------------------------------------------------------------------ */

export type GameKind = "this_or_that" | "two_truths" | "guess" | "trivia" | "emoji";

/** lib/agent/game.ts GAME_NAMES and games/words.ts shelfLines, in English. */
const SHELF: Record<GameKind, { name: string; line: string }> = {
  this_or_that: { name: "This or That", line: "Pick one of two" },
  two_truths: { name: "Two truths and a lie", line: "Spot the made-up one" },
  guess: { name: "Guess what I'm thinking", line: "Krovvi guesses yours" },
  trivia: { name: "Quick trivia", line: "Five quick questions" },
  emoji: { name: "Emoji riddles", line: "Read the emoji" },
};

/**
 * The ring with its question mark (guess.tsx:78-95): a 1.5 line of ivory at
 * half its light round a semibold "?". `live`: it breathes, 1100 ms each
 * way, the ring swelling 6 percent into full light and the mark rocking 12
 * degrees. Still, `breath` says where in its breath it stands (0 to 1); every
 * capture shows it full (1: 57 points across a 54 ring, at full light).
 */
export function ThinkingMark({ size = 54, live = false, breath = 1 }: { size?: number; live?: boolean; breath?: number }) {
  return (
    <span style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span
        className={live ? "dk-think-ring" : undefined}
        style={{ position: "absolute", inset: 0, borderRadius: size / 2, boxShadow: "inset 0 0 0 1.5px rgba(237,237,235,0.5)", ...(live ? null : { opacity: 0.55 + 0.45 * breath, transform: `scale(${1 + 0.06 * breath})` }) }}
      />
      <span className={live ? "dk-think-mark" : undefined} style={{ color: C.fg, fontWeight: 600, fontSize: size * 0.48, lineHeight: `${size * 0.6}px`, transform: live ? undefined : `rotate(${-6 + 12 * breath}deg)` }}>
        ?
      </span>
    </span>
  );
}

/**
 * Each game's small mark in the night's ivory (shelf.tsx:107-162, 222-232):
 * two sides trading the light, three lines with the middle one turning over,
 * the breathing question, four answers lighting in turn, and two pictures
 * taking turns. Still, each stands where the captures show it (one beat in);
 * `live` runs the app's beat (games.css dk-mark-*).
 */
function ShelfMark({ kind, on, live = false }: { kind: GameKind; on: boolean; live?: boolean }) {
  const ink = on ? C.bg : C.fg;
  if (kind === "guess") return <ThinkingMark size={32} live={live} />;
  if (kind === "this_or_that") {
    return (
      <span style={{ display: "flex", gap: 4 }}>
        <span className={live ? "dk-mark-a" : undefined} style={{ width: 13, height: 20, borderRadius: 4, background: ink }} />
        <span className={live ? "dk-mark-b" : undefined} style={{ width: 13, height: 20, borderRadius: 4, background: ink, opacity: 0.3 }} />
      </span>
    );
  }
  if (kind === "two_truths") {
    return (
      <span style={{ display: "flex", flexDirection: "column", gap: 4, width: 26 }}>
        <span style={{ height: 4, borderRadius: 2, width: 26, background: ink, opacity: 0.45 }} />
        <span className={live ? "dk-mark-turn" : undefined} style={{ height: 4, borderRadius: 2, width: 19, background: ink }} />
        <span style={{ height: 4, borderRadius: 2, width: 26, background: ink, opacity: 0.45 }} />
      </span>
    );
  }
  if (kind === "trivia") {
    return (
      <span style={{ position: "relative", width: 25, height: 25, display: "flex", flexWrap: "wrap", gap: 3 }}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} style={{ width: 11, height: 11, borderRadius: 3, boxShadow: `inset 0 0 0 1.2px ${ink}`, opacity: 0.5 }} />
        ))}
        <span className={live ? "dk-mark-step" : undefined} style={{ position: "absolute", left: 0, top: 0, width: 11, height: 11, borderRadius: 3, background: ink, transform: "translate(0px, 13px)" }} />
      </span>
    );
  }
  return (
    <span style={{ position: "relative", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, lineHeight: "28px" }}>
      <span className={live ? "dk-mark-out" : undefined} style={{ position: "absolute", opacity: 0 }}>
        {emo("🦁", 1)}
      </span>
      <span className={live ? "dk-mark-in" : undefined}>{emo("🎬", 1)}</span>
    </span>
  );
}

function ShelfTile({ kind, wide = false, on = false, off = false, live = false }: { kind: GameKind; wide?: boolean; on?: boolean; off?: boolean; live?: boolean }) {
  const words = SHELF[kind];
  return (
    <span
      style={{
        flex: 1,
        minWidth: 0,
        minHeight: wide ? 84 : 112,
        borderRadius: 18,
        background: on ? C.fg : TILE,
        opacity: off ? 0.35 : 1,
        padding: 12,
        display: "flex",
        flexDirection: wide ? "row" : "column",
        alignItems: wide ? "center" : "stretch",
        justifyContent: "space-between",
        gap: wide ? 12 : 8,
      }}
    >
      <span style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <ShelfMark kind={kind} on={on} live={live} />
      </span>
      <span style={{ display: "flex", flexDirection: "column", gap: 2, flex: wide ? 1 : undefined, minWidth: 0 }}>
        <span style={{ color: on ? C.bg : C.fg, fontSize: 15, lineHeight: "19px", fontWeight: 600, letterSpacing: "-0.25px", ...lines(2) }}>{words.name}</span>
        <span style={{ color: on ? "rgba(3,3,3,0.6)" : C.muted, fontSize: 12.5, lineHeight: "16px", whiteSpace: "nowrap" }}>{words.line}</span>
      </span>
    </span>
  );
}

/**
 * The shelf (shelf.tsx:26-105, styles 202-235): the games as tiles in
 * Krovvi's order, the first wide and the rest two by two, under "Play
 * something". `picked` lights one and steps the others back; `live` runs
 * the marks' beat.
 */
export function GameShelf({
  offer = ["this_or_that", "two_truths", "guess", "trivia", "emoji"],
  picked = null,
  title = "Play something",
  live = false,
  rise = false,
  delay = 0,
  className,
  style,
}: Piece & { offer?: GameKind[]; picked?: GameKind | null; title?: string; live?: boolean; rise?: boolean; delay?: number }) {
  const [lead, ...rest] = offer;
  const rows: GameKind[][] = [];
  for (let i = 0; i < rest.length; i += 2) rows.push(rest.slice(i, i + 2));
  const tile = (kind: GameKind, wide = false) => <ShelfTile key={kind} kind={kind} wide={wide} on={picked === kind} off={!!picked && picked !== kind} live={live} />;
  return (
    <Game rise={rise} delay={delay} className={className} style={style}>
      <GameHead name={title} />
      <div style={{ ...GAME_PANE, padding: 9 + HAIR, display: "flex", flexDirection: "column", gap: 9 }}>
        {lead ? <div style={{ display: "flex" }}>{tile(lead, true)}</div> : null}
        {rows.map((row, i) => (
          <div key={i} style={{ display: "flex", gap: 9 }}>
            {row.map((kind) => tile(kind))}
            {row.length === 1 ? <span style={{ flex: 1 }} /> : null}
          </div>
        ))}
      </div>
    </Game>
  );
}

/* ------------------------------------------------------------------ */
/* Play, from the + sheet (games/shelf.tsx, plus-sheet.tsx)             */
/* ------------------------------------------------------------------ */

const f3 = (n: number) => Math.round(n * 1000) / 1000;

/**
 * Play's mark: a die showing one, in the icons' own line and dot, turned 8
 * degrees (shelf.tsx:189-200): a round box three quarters of the size, its
 * corners 0.28 of it, one dot of 0.15 (never under 3.2) in the middle.
 */
export function PlayMark({ size = 28, color = C.fg, weight = (1.9 * 28) / 24, className, style }: { size?: number; color?: string; weight?: number; className?: string; style?: CSSProperties }) {
  const box = size * 0.74;
  const dot = Math.max(3.2, size * 0.15);
  const at = (size - box) / 2 + weight / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className} style={{ display: "block", overflow: "visible", flexShrink: 0, ...style }} aria-hidden="true">
      <g transform={`rotate(-8 ${f3(size / 2)} ${f3(size / 2)})`}>
        <rect x={f3(at)} y={f3(at)} width={f3(box - weight)} height={f3(box - weight)} rx={f3(box * 0.28 - weight / 2)} fill="none" stroke={color} strokeWidth={weight} />
        <circle cx={f3(size / 2)} cy={f3(size / 2)} r={f3(dot / 2)} fill={color} />
      </g>
    </svg>
  );
}

/** One round of the + sheet (plus-sheet.tsx:98-157): glass 60 across (54 when five share the row), its name under it. */
function PlusRound({ label, small = false, red = false, off = false, children }: { label: string; small?: boolean; red?: boolean; off?: boolean; children: ReactNode }) {
  const d = small ? 54 : 60;
  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: off ? 0.4 : 1 }}>
      <span style={{ width: d, height: d, borderRadius: d / 2, background: red ? "rgba(255, 107, 94, 0.12)" : C.tile, ...edge(red ? "rgba(255, 107, 94, 0.35)" : C.sheetEdge), display: "flex", alignItems: "center", justifyContent: "center" }}>
        {children}
      </span>
      <span style={{ color: C.fg2, fontSize: 13, letterSpacing: "-0.1px", textAlign: "center", ...lines(2) }}>{label}</span>
    </div>
  );
}

/**
 * The + sheet as store build 20 draws it (plus-sheet.tsx:37-157): Camera,
 * Photos, Files, Record where the chat is Home (`record`), and Play last,
 * which opens the games' shelf. With five in the row the rounds are 54 and
 * their icons 25, 4 apart; with four, 60 and 28, 8 apart.
 */
export function PlusSheetWithPlay({ record = false, recording = false, rise = false, scrim = true, className, style }: Piece & { record?: boolean; recording?: boolean; rise?: boolean; scrim?: boolean }) {
  const five = record;
  const icon = five ? 25 : 28;
  const line = (1.9 * icon) / 24;
  return (
    <Sheet rise={rise} scrim={scrim} className={cx("dk-g-sheet", className)} style={style}>
      <div style={{ display: "flex", gap: five ? 4 : 8, padding: "4px 0" }}>
        <PlusRound label="Camera" small={five}>
          <Icon name="camera" size={icon} color={C.fg} weight={line} />
        </PlusRound>
        <PlusRound label="Photos" small={five}>
          <Icon name="picture" size={icon} color={C.fg} weight={line} />
        </PlusRound>
        <PlusRound label="Files" small={five}>
          <Icon name="fileIn" size={icon} color={C.fg} weight={line} />
        </PlusRound>
        {record ? (
          <PlusRound label={recording ? "Recording now" : "Record"} small red off={recording}>
            <Mic size={icon} color="#FF6B5E" />
          </PlusRound>
        ) : null}
        <PlusRound label="Play" small={five}>
          <PlayMark size={icon} color={C.fg} weight={line} />
        </PlusRound>
      </div>
    </Sheet>
  );
}

/**
 * Play's own sheet: the shelf at once, with no wait (shelf.tsx:164-187,
 * 233-234): "Play something" at 17 semibold, and the games as tiles under it,
 * 12 apart, straight on the sheet. `live` runs the marks' beat.
 */
export function GamesSheet({ picked = null, title = "Play something", live = false, rise = false, scrim = true, className, style }: Piece & { picked?: GameKind | null; title?: string; live?: boolean; rise?: boolean; scrim?: boolean }) {
  const offer: GameKind[] = ["this_or_that", "two_truths", "guess", "trivia", "emoji"];
  const [lead, ...rest] = offer;
  const tile = (kind: GameKind, wide = false) => <ShelfTile key={kind} kind={kind} wide={wide} on={picked === kind} off={!!picked && picked !== kind} live={live} />;
  return (
    <Sheet rise={rise} scrim={scrim} className={cx("dk-g-sheet", className)} style={style}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingBottom: 4 }}>
        <div style={{ color: C.fg, fontSize: 17, fontWeight: 600, letterSpacing: "-0.3px", padding: "0 2px" }}>{title}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <div style={{ display: "flex" }}>{tile(lead, true)}</div>
          {[rest.slice(0, 2), rest.slice(2, 4)].map((row, i) => (
            <div key={i} style={{ display: "flex", gap: 9 }}>
              {row.map((kind) => tile(kind))}
            </div>
          ))}
        </div>
      </div>
    </Sheet>
  );
}
