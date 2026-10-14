/**
 * The night look's sheets (catch8 src/components/sheet.tsx,
 * src/components/plus-sheet.tsx and src/components/share/share-sheet.tsx at
 * 272d7cc5): held off the screen's sides and foot by 8, its corners round all
 * the way (40), almost opaque, edged with one hairline, the grabber on top,
 * and the screen behind dimmed to 0.6 black. Lay one over DeepChat or
 * AppsHome (as their last child, or in the same box). `rise` plays the
 * sheet's arrival: up from below its place in 240 ms, the scrim with it.
 */

import "./deep.css";

import type { ReactNode } from "react";

import { emo, KrovviText, MyBubble, type Piece } from "./chat";
import { Icon, Mic } from "./glyphs";
import { ANSWER, C, HAIR, SCREEN } from "./tokens";

const cx = (...names: Array<string | false | null | undefined>) => names.filter(Boolean).join(" ") || undefined;

/** sheet.tsx:599-602 */
const FLOAT_GAP = 8;
const FLOAT_RADIUS = 40;

/**
 * A floating sheet and its scrim (sheet.tsx:205-290, 607-663): the panel 8
 * in from the sides and foot, 14 inside at the sides, 8 over the grabber's 20
 * point strip, and the home bar's room less the gap under its content.
 */
export function Sheet({ children, rise = false, scrim = true, className, style }: Piece & { children?: ReactNode; rise?: boolean; scrim?: boolean }) {
  return (
    <div className={cx("dk", className)} style={{ position: "absolute", inset: 0, zIndex: 30, display: "flex", flexDirection: "column", justifyContent: "flex-end", ...style }}>
      {scrim ? <div className={rise ? "dk-scrim" : undefined} style={{ position: "absolute", inset: 0, background: "#000", opacity: 0.6 }} /> : null}
      <div
        className={rise ? "dk-sheet-up" : undefined}
        style={{
          position: "relative",
          margin: `0 ${FLOAT_GAP}px ${FLOAT_GAP}px`,
          borderRadius: FLOAT_RADIUS,
          border: `${HAIR}px solid ${C.sheetEdge}`,
          background: C.sheet,
          overflow: "hidden",
          padding: `8px 14px ${Math.max(SCREEN.bottom - FLOAT_GAP, 16)}px`,
          maxHeight: Math.min(SCREEN.height * 0.76, SCREEN.height - SCREEN.top - 8 - FLOAT_GAP),
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
          <span style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)" }} />
        </div>
        {children}
      </div>
    </div>
  );
}

/** A sheet's title: 20 points, semibold, tight (sheet.tsx:334-342, 669-670). */
export function SheetTitle({ title, className, style }: Piece & { title: string }) {
  return (
    <div className={className} style={{ padding: "4px 4px 16px", ...style }}>
      <div style={{ color: C.fg, fontSize: 20, fontWeight: 600, letterSpacing: "-0.5px", lineHeight: "25px" }}>{title}</div>
    </div>
  );
}

/** components/plus-sheet.tsx:101-106 */
const ROUND = 60;
const ICON = 28;
const LINE = (1.9 * ICON) / 24;

function Round({ label, red = false, off = false, children }: { label: string; red?: boolean; off?: boolean; children: ReactNode }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: off ? 0.4 : 1 }}>
      <span
        style={{
          width: ROUND,
          height: ROUND,
          borderRadius: ROUND / 2,
          background: red ? "rgba(255, 107, 94, 0.12)" : C.tile,
          border: `${HAIR}px solid ${red ? "rgba(255, 107, 94, 0.35)" : C.sheetEdge}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </span>
      <span style={{ color: C.fg2, fontSize: 13, letterSpacing: "-0.1px", textAlign: "center" }}>{label}</span>
    </div>
  );
}

/**
 * What can be handed to Krovvi, behind the + by the text box: four round
 * glass buttons in a row with their names under them, Record in recording's
 * own red (components/plus-sheet.tsx:32-128). Record is there where the chat
 * is Home (`record`); elsewhere the three share the row. `recording`: a take
 * is already rolling, and Record says so, dimmed.
 */
export function PlusSheet({ record = true, recording = false, rise = false, scrim = true, className, style }: Piece & { record?: boolean; recording?: boolean; rise?: boolean; scrim?: boolean }) {
  return (
    <Sheet rise={rise} scrim={scrim} className={className} style={style}>
      <div style={{ display: "flex", gap: 8, padding: "4px 0" }}>
        <Round label="Camera">
          <Icon name="camera" size={ICON} color={C.fg} weight={LINE} />
        </Round>
        <Round label="Photos">
          <Icon name="picture" size={ICON} color={C.fg} weight={LINE} />
        </Round>
        <Round label="Files">
          <Icon name="fileIn" size={ICON} color={C.fg} weight={LINE} />
        </Round>
        {record ? (
          <Round label={recording ? "Recording now" : "Record"} red off={recording}>
            <Mic size={ICON} color="#FF6B5E" />
          </Round>
        ) : null}
      </div>
    </Sheet>
  );
}

/**
 * When something was said, as the shared chat sets it: centred, no rules
 * (components/share/chat-copy.tsx:348-349).
 */
export function ShareDate({ day = "Today", time, className, style }: Piece & { day?: string; time: string }) {
  return (
    <div className={className} style={{ textAlign: "center", color: C.faint, fontSize: 12, letterSpacing: "0.1px", marginBottom: 16, ...style }}>
      <span style={{ color: C.muted, fontWeight: 600 }}>{day}</span>
      {` ${time}`}
    </div>
  );
}

/**
 * One exchange in the shared chat's box (chat-copy.tsx:213-232, 346-353): the
 * person's words on the right, then Krovvi's answer 8 under them (its bubbles
 * or its words; in the box its words start at the box's edge), 16 under the
 * turn.
 */
export function ShareTurn({ date, asked, answer, bubbles, className, style }: Piece & { date?: { day?: string; time: string }; asked?: string; answer?: string; bubbles?: string[] }) {
  return (
    <div className={className} style={{ paddingBottom: 16, ...style }}>
      {date ? <ShareDate day={date.day} time={date.time} /> : null}
      {asked ? <MyBubble text={asked} /> : null}
      {bubbles?.length || answer ? (
        <div style={{ marginTop: asked ? 8 : 0 }}>
          {bubbles?.length ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
              {bubbles.map((b, i) => (
                <div key={i} style={{ ...ANSWER, background: C.glass, border: `${HAIR}px solid ${C.glassEdge}`, borderRadius: 20, maxWidth: "82%", padding: "7px 14px 8px" }}>
                  {emo(b)}
                </div>
              ))}
            </div>
          ) : null}
          {answer ? <KrovviText text={answer} star={false} style={{ marginTop: bubbles?.length ? 10 : 0 }} /> : null}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Share this chat (components/share/share-sheet.tsx:224-328): the title, the
 * chat as people will see it in a card of the sky's own black with a still
 * faint sky behind it (`cardSky`), its name over a box that scrolls and fades
 * at its foot, one quiet line, and Share link, the sheet's one bright thing.
 * `opened`: the link was shared, and the line says how often it was opened,
 * with Turn off link under the button.
 */
export function ShareSheet({
  title,
  children,
  cardSky,
  opened,
  scroll = 0,
  rise = false,
  scrim = true,
  className,
  style,
}: Piece & {
  /** The chat's name. */
  title: string;
  /** The chat inside the box: ShareTurn rows. */
  children?: ReactNode;
  cardSky?: ReactNode;
  /** "Shared · opened 3 times, last 6:14 pm", once there is a link. */
  opened?: string;
  /** How far the box's chat is scrolled, in points. */
  scroll?: number;
  rise?: boolean;
  scrim?: boolean;
}) {
  const boxHeight = Math.round(Math.min(340, SCREEN.height * 0.36));
  return (
    <Sheet rise={rise} scrim={scrim} className={className} style={style}>
      <div style={{ padding: "0 16px 4px", display: "flex", flexDirection: "column", gap: 12 }}>
        <SheetTitle title="Share this chat" />
        <div style={{ position: "relative", background: C.sky, borderRadius: 20, overflow: "hidden", border: `${HAIR}px solid ${C.glassEdge}`, padding: "14px 14px 0" }}>
          {cardSky ? <div style={{ position: "absolute", inset: 0, opacity: 0.75 }}>{cardSky}</div> : null}
          <div style={{ position: "relative", color: C.fg, fontSize: 17, fontWeight: 600, letterSpacing: "-0.4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
          <div style={{ position: "relative", marginTop: 12, height: boxHeight, overflow: "hidden" }}>
            <div style={{ paddingBottom: 48, transform: scroll ? `translateY(${-scroll}px)` : undefined, transition: "transform 600ms cubic-bezier(0.23, 1, 0.32, 1)" }}>{children}</div>
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 56, background: `linear-gradient(to bottom, ${C.sky}00, ${C.sky})` }} />
          </div>
        </div>
        <div style={{ color: C.muted, fontSize: 13, lineHeight: "18px", textAlign: "center" }}>{opened ?? "Anyone with the link can see this chat as it is now."}</div>
        <div style={{ minHeight: 52, borderRadius: 26, background: C.fg, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Icon name="shareOut" size={17} color={C.bg} weight={1.5} />
          <span style={{ color: C.bg, fontSize: 16, fontWeight: 600, letterSpacing: "-0.2px" }}>Share link</span>
        </div>
        {opened ? (
          <div style={{ alignSelf: "center", minHeight: 44, display: "flex", alignItems: "center", padding: "0 16px", marginTop: -4 }}>
            <span style={{ color: C.muted, fontSize: 14, fontWeight: 500 }}>Turn off link</span>
          </div>
        ) : null}
      </div>
    </Sheet>
  );
}

