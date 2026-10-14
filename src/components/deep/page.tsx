/**
 * An app's page in the night look, as To-do draws it (catch8
 * src/components/objects/shell.tsx, kit/blocks.tsx, kit/controls.tsx,
 * kit/tick.tsx and kinds/todo at 272d7cc5): the way back and the round
 * buttons at the top, the app's name large and light, its tabs with the
 * chosen one underlined in the app's colour, then groups of rows on panes of
 * the apps' night, and Krovvi's bar over the page. The page stands on the
 * apps' night (#030303); the stars along its top go in `sky`.
 */

import "./deep.css";

import type { ReactNode } from "react";

import { StatusBar, type Piece } from "./chat";
import { Check, Icon, More } from "./glyphs";
import { Dock } from "./home";
import { C, FACE, HAIR, INK, SCREEN } from "./tokens";

const cx = (...names: Array<string | false | null | undefined>) => names.filter(Boolean).join(" ") || undefined;

/** A round button of the page's nav: 34 across, surfaceHi with one hairline (components/nav-back.tsx:52-58). */
function NavButton({ children }: { children: ReactNode }) {
  return (
    <span style={{ width: 34, height: 34, borderRadius: 17, background: C.surfaceHi, border: `${HAIR}px solid ${C.edge}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {children}
    </span>
  );
}

/**
 * The page (objects/shell.tsx:305-372, 448-462): under the safe area a 48
 * point row with Back at its start and More and + at its end, 8 apart; the
 * name 20 in, 40 on 46, light; the tabs 20 in, 22 apart, 16 point semibold,
 * the chosen one in ivory with a 2.5 point line in the app's colour under
 * it, the others faint, a hairline under them all; the content 16 in and 14
 * under the tabs. Krovvi's bar stands over the page's foot, all but solid,
 * with the page going to black under it (krovvi-dock.tsx:63-83).
 */
export function AppPage({
  title,
  tabs = [],
  tab = 0,
  tint = "#E6DCC8",
  more = true,
  plus = true,
  sky,
  dock = true,
  statusBar = true,
  label,
  children,
  className,
  style,
}: Piece & {
  title: string;
  tabs?: string[];
  /** The chosen tab. */
  tab?: number;
  /** The app's colour, for the chosen tab's line (To-do's is #E6DCC8). */
  tint?: string;
  more?: boolean;
  plus?: boolean;
  /** The strip of stars along the top of the page. */
  sky?: ReactNode;
  dock?: boolean;
  statusBar?: boolean;
  label?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cx("dk", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      style={{ position: "relative", width: SCREEN.width, height: SCREEN.height, overflow: "hidden", background: C.bg, ...style }}
    >
      {sky ? <div style={{ position: "absolute", inset: 0 }}>{sky}</div> : null}
      {statusBar ? <StatusBar /> : null}
      <div style={{ position: "relative", paddingTop: SCREEN.top }}>
        <div style={{ height: 48, padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <NavButton>
            <Icon name="chevronLeft" size={11} color={C.fg} weight={1.6} />
          </NavButton>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {more ? (
              <NavButton>
                <More size={16} color={C.fg} />
              </NavButton>
            ) : null}
            {plus ? (
              <NavButton>
                <Icon name="plus" size={13} color={C.fg} weight={1.8} />
              </NavButton>
            ) : null}
          </span>
        </div>
        <div style={{ padding: "4px 20px 10px" }}>
          <div style={{ fontSize: 40, lineHeight: "46px", fontWeight: 300, letterSpacing: "-1.4px", color: C.fg, whiteSpace: "nowrap" }}>{title}</div>
        </div>
        {tabs.length > 1 ? (
          <div style={{ paddingTop: 2 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 22, padding: "0 20px" }}>
              {tabs.map((name, i) => (
                <div key={name} style={{ paddingTop: 4, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 16, lineHeight: "21px", letterSpacing: "-0.25px", fontWeight: 600, color: i === tab ? C.fg : C.faint }}>{name}</span>
                  <span style={{ height: 2.5, borderRadius: 1.25, alignSelf: "stretch", background: i === tab ? tint : "transparent" }} />
                </div>
              ))}
            </div>
            <div style={{ height: HAIR, background: C.line, marginTop: -HAIR }} />
          </div>
        ) : null}
        <div style={{ padding: "14px 16px 0" }}>{children}</div>
      </div>
      {dock ? (
        <>
          <div aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: SCREEN.bottom + 96 + 28, background: "linear-gradient(180deg, rgba(3,3,3,0) 0%, rgba(3,3,3,0.92) 55%, #030303 100%)", pointerEvents: "none" }} />
          <Dock overPage />
        </>
      ) : null}
    </div>
  );
}

/**
 * A group on a page (kit/blocks.tsx:41-80, 36-38, 554-591): its name 20 on
 * 25 semibold, 4 in, 12 over and 8 under it, a count or an action at its far
 * side; then its rows on one pane of the night (#0E0E10, corners 20, one
 * hairline), 12 under the pane.
 */
export function PageGroup({ title, value, action, go = true, children, className, style }: Piece & { title: string; value?: string; action?: string; /** The action opens a page (a chevron after it); false for one done in place ("Move to today"). */ go?: boolean; children?: ReactNode }) {
  return (
    <div className={className} style={style}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 4px 8px" }}>
        <span style={{ fontSize: 20, lineHeight: "25px", fontWeight: 600, letterSpacing: "-0.5px", color: C.fg }}>{title}</span>
        {action ? (
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ ...FACE.label, color: C.muted }}>{action}</span>
            {go ? <Icon name="chevronRight" size={9} color={C.faint} weight={1.7} /> : null}
          </span>
        ) : value ? (
          <span style={{ ...FACE.label, color: C.muted, fontVariantNumeric: "tabular-nums" }}>{value}</span>
        ) : null}
      </div>
      <div style={{ background: C.surface, borderRadius: 20, border: `${HAIR}px solid ${C.edge}`, overflow: "hidden", marginBottom: 12 }}>{children}</div>
    </div>
  );
}

/**
 * A task as To-do draws it (kinds/todo/task.tsx:92-102, kit/blocks.tsx:323-441,
 * kit/tick.tsx): a 26 point ring of 1.5 faint in a 44 point lead, filled ivory
 * with its tick when done; the words 15 on 21 medium, what it is about under
 * them 12 on 16 muted (Flagged in amber); its time across in 15 point medium
 * figures; at least 60 tall, 10 over and under, 16 at the sides; a hairline
 * between rows from 72 in.
 */
export function TaskItem({ text, sub, flagged = false, time, done = false, first = false, className, style }: Piece & { text: string; sub?: string; flagged?: boolean; /** Its time today, or the day it was for when it is late ("Thu 1 Oct"). */ time?: string; done?: boolean; first?: boolean }) {
  return (
    <div className={className} style={style}>
      {first ? null : <div style={{ height: HAIR, background: C.line, marginLeft: 72 }} />}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", minHeight: 60 }}>
        <span style={{ width: 44, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ position: "relative", width: 26, height: 26 }}>
            <span style={{ position: "absolute", inset: 0, borderRadius: 13, border: `1.5px solid ${C.faint}` }} />
            {done ? (
              <span style={{ position: "absolute", inset: 0, borderRadius: 13, background: C.fg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Check size={12} color={C.bg} weight={2} />
              </span>
            ) : null}
          </span>
        </span>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ ...FACE.body, fontWeight: 500, color: done ? C.muted : C.fg, textDecoration: done ? "line-through" : undefined }}>{text}</span>
          {flagged || sub ? (
            <span style={{ ...FACE.meta, color: C.muted }}>
              {flagged ? <span style={{ color: INK.warm }}>Flagged</span> : null}
              {flagged && sub ? " · " : null}
              {sub}
            </span>
          ) : null}
        </div>
        {time ? <span style={{ ...FACE.body, fontWeight: 500, color: C.fg, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{time}</span> : null}
      </div>
    </div>
  );
}

/** The quiet row that adds one (kit/blocks.tsx:446-470, 593-597): a 10 point muted plus in a 44 lead, the words in muted, 52 tall. */
export function AddItem({ text, first = false, className, style }: Piece & { text: string; first?: boolean }) {
  return (
    <div className={className} style={style}>
      {first ? null : <div style={{ height: HAIR, background: C.line, marginLeft: 72 }} />}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 16px", minHeight: 52 }}>
        <span style={{ width: 44, height: 26, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="plus" size={10} color={C.muted} weight={1.8} />
        </span>
        <span style={{ ...FACE.body, color: C.muted }}>{text}</span>
      </div>
    </div>
  );
}
