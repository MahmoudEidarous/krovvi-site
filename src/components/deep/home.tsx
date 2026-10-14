/**
 * The home behind the chat in the night look (catch8
 * src/components/apps/apps-screen.tsx and src/components/krovvi-dock.tsx at
 * 272d7cc5): the day large at the top, the thirteen apps in rows of four on
 * tiles washed in each app's colour with its mark in dots, the way to
 * Settings as a tile with the person's dotted letter, and Krovvi's bar where
 * a phone keeps its dock. Drawn without the weather line. Transparent: the
 * star sky goes behind it (the `sky` slot). Server renderable.
 */

import "./deep.css";

import type { CSSProperties, ReactNode } from "react";

import { StatusBar, type Piece } from "./chat";
import { DeepFace } from "./face";
import { KrovviK, Mic } from "./glyphs";
import { DottedMark, type MarkName } from "./marks";
import { C, HAIR, SCREEN, personTint, tileWash } from "./tokens";

const cx = (...names: Array<string | false | null | undefined>) => names.filter(Boolean).join(" ") || undefined;

export type AppId = "library" | "recording" | "meetings" | "nutrition" | "money" | "todo" | "fitness" | "habits" | "kitchen" | "health" | "plans" | "trips" | "watch";

/**
 * The thirteen, in the order they stand (lib/apps.ts:45, 67-71; the core's
 * apps.ts:27 APPS and 69-189 APP): Krovvi's own three, then the ten. Each
 * with its name, its colour and its mark.
 */
export const APPS: ReadonlyArray<{ id: AppId; name: string; tint: string; mark: MarkName | "mic" }> = [
  { id: "library", name: "Library", tint: "#A58CFF", mark: "library" },
  { id: "recording", name: "Recording", tint: "#FF6B5E", mark: "mic" },
  { id: "meetings", name: "Meetings", tint: "#5E9BFF", mark: "meetings" },
  { id: "nutrition", name: "Nutrition", tint: "#8CC59A", mark: "utensils" },
  { id: "money", name: "Money", tint: "#E3B062", mark: "wallet" },
  { id: "todo", name: "To-do", tint: "#E6DCC8", mark: "checklist" },
  { id: "fitness", name: "Fitness", tint: "#EE9068", mark: "dumbbell" },
  { id: "habits", name: "Habits", tint: "#B7A6EC", mark: "checkCircle" },
  { id: "kitchen", name: "Kitchen", tint: "#C3CF73", mark: "pot" },
  { id: "health", name: "Health", tint: "#EC8FA3", mark: "heart" },
  { id: "plans", name: "Plans", tint: "#86B9E0", mark: "calendar" },
  { id: "trips", name: "Trips", tint: "#6FC9B9", mark: "map" },
  { id: "watch", name: "Watch", tint: "#D796D6", mark: "show" },
];

/** apps-screen.tsx:85-89, 593-627 */
const TILE = 60;
const TILE_RADIUS = 15;
const GUTTER = 24;
const DOT_MARK = 36;

/** Words over the stars keep a soft shadow (components/sky/on.ts:22). */
const OVER_STARS: CSSProperties = { textShadow: "0 0.5px 3.5px rgba(0,0,0,0.7)" };

/**
 * One app on the home: its 60 point tile washed in its colour, edged in it at
 * 0.34, its mark in dots three fifths of the tile, its name under it
 * (apps-screen.tsx:438-509, 535-555, 603-626, 651-665). `line`: what it holds,
 * under its name ("1 of 5 today"). `lit`: something new inside, the ivory dot
 * at the tile's corner (apps-screen.tsx:502, 616). `pressed`: the tile as a
 * finger holds it, at 0.95 (apps-screen.tsx:472). Its cell is `width` wide.
 */
export function AppTile({ app, line, lit = false, pressed = false, arrive, width = Math.floor((SCREEN.width - GUTTER * 2) / 4), className, style }: Piece & {
  app: AppId;
  line?: string;
  lit?: boolean;
  pressed?: boolean;
  /** The site's story only: something just went into this app, so after this many ms the tile takes it (a small lift and a glow in its colour), then its dot and its line arrive. Not an app behaviour. */
  arrive?: number;
  width?: number;
}) {
  const spec = APPS.find((a) => a.id === app) ?? APPS[0];
  const wash = tileWash(spec.tint);
  return (
    <div className={className} style={{ position: "relative", width, display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24, ...style }}>
      {arrive !== undefined ? (
        <span
          aria-hidden="true"
          className="dk-arrive-glow"
          style={{ position: "absolute", top: -14, left: (width - TILE) / 2 - 14, width: TILE + 28, height: TILE + 28, borderRadius: TILE_RADIUS + 14, background: `radial-gradient(closest-side, ${spec.tint}55, ${spec.tint}00)`, ...({ "--dk-delay": `${arrive}ms` } as CSSProperties) }}
        />
      ) : null}
      <div
        className={arrive !== undefined ? "dk-arrive" : undefined}
        style={{
          ...(arrive !== undefined ? ({ "--dk-delay": `${arrive}ms` } as CSSProperties) : null),
          width: TILE,
          height: TILE,
          borderRadius: TILE_RADIUS,
          background: wash.background,
          border: `${HAIR}px solid ${wash.borderColor}`,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: pressed ? "scale(0.95)" : undefined,
          transition: "transform 110ms cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      >
        {spec.mark === "mic" ? <Mic size={DOT_MARK} color={spec.tint} /> : <DottedMark name={spec.mark} size={DOT_MARK} color={spec.tint} />}
      </div>
      {lit ? (
        <span
          className="dk-fade"
          style={{ position: "absolute", top: -2.5, left: (width + TILE) / 2 - 6.5, width: 9, height: 9, borderRadius: 4.5, background: C.fg, ...(arrive !== undefined ? ({ "--dk-delay": `${arrive + 260}ms`, "--dk-dur": "360ms" } as CSSProperties) : null) }}
        />
      ) : null}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", maxWidth: TILE + 22 }}>
        <span style={{ marginTop: 7, fontSize: 12, letterSpacing: "-0.1px", color: "#F2F1EC", textAlign: "center", whiteSpace: "nowrap", ...OVER_STARS }}>{spec.name}</span>
        {line ? <span className={arrive !== undefined ? "dk-fade" : undefined} style={{ ...(arrive !== undefined ? ({ "--dk-delay": `${arrive + 300}ms`, "--dk-dur": "420ms" } as CSSProperties) : null), marginTop: 1, fontSize: 10.5, color: "rgba(228,226,218,0.84)", textAlign: "center", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: TILE + 22, ...OVER_STARS }}>{line}</span> : null}
      </div>
    </div>
  );
}

/**
 * The way to Settings, top right: a 44 point tile like the apps', its corner
 * theirs to scale (11), washed in the person's own colour with their first
 * letter in dots (apps-screen.tsx:209-222, 578-592).
 */
export function SettingsTile({ name, className, style }: Piece & { name: string }) {
  const wash = tileWash(personTint(name));
  return (
    <span className={className} style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", ...style }}>
      <span style={{ width: 44, height: 44, borderRadius: 11, background: wash.background, border: `${HAIR}px solid ${wash.borderColor}`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <DeepFace name={name} size={40} ground={null} />
      </span>
    </span>
  );
}

/**
 * Krovvi's bar, the same on the home and over every app (components/krovvi-dock.tsx:85-178):
 * dark glass 58 tall, round at its ends, 16 in from the sides and 28 over the
 * foot, Krovvi's K at its start, "Ask Krovvi", and the mic in the chat's
 * ivory disc at its far end. `said`: Krovvi's first words not seen yet, in
 * the words' ink, with a dot on the K. `overPage`: all but solid, as over an
 * app's page of words.
 */
export function Dock({ said, overPage = false, className, style }: Piece & { said?: string; overPage?: boolean }) {
  return (
    <div className={className} style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "0 16px 28px", ...style }}>
      <div
        style={{
          height: 58,
          borderRadius: 29,
          display: "flex",
          alignItems: "center",
          gap: 12,
          paddingLeft: 16,
          paddingRight: 18,
          background: overPage ? "rgba(18,18,20,0.94)" : "rgba(18,18,20,0.62)",
          border: `${HAIR}px solid rgba(255,255,255,0.09)`,
        }}
      >
        <span style={{ position: "relative", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <KrovviK size={26} color={C.fg} />
          {said ? <span style={{ position: "absolute", top: -1, right: -3, width: 9, height: 9, borderRadius: 4.5, background: C.fg, border: "2px solid #121214" }} /> : null}
        </span>
        <span style={{ flex: 1, minWidth: 0, fontSize: 16, letterSpacing: "-0.2px", color: said ? C.fg : C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{said ?? "Ask Krovvi"}</span>
        <span style={{ width: 40, height: 40, marginRight: -9, borderRadius: 20, background: C.fg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Mic size={20} color={C.bg} />
        </span>
      </div>
    </div>
  );
}

/**
 * The home: under the safe area a 48 point row with the way to Settings at its
 * right, then the day at 40 points light with the date under it, then the
 * apps in rows of four, 24 in from the sides (apps-screen.tsx:204-266,
 * 566-646). `apps` sets what an app says under its name and which are lit.
 */
export function AppsHome({
  day = "Saturday",
  date = "10 October",
  name = "Mona",
  apps,
  dock = true,
  said,
  sky,
  statusBar = true,
  time,
  label,
  children,
  className,
  style,
}: Piece & {
  day?: string;
  date?: string;
  /** The person, for the dotted letter on the way to Settings. */
  name?: string;
  apps?: Partial<Record<AppId, { line?: string; lit?: boolean; pressed?: boolean; arrive?: number }>>;
  dock?: boolean;
  said?: string;
  sky?: ReactNode;
  statusBar?: boolean;
  time?: string;
  label?: string;
  /** Laid over the home (a sheet, a card). */
  children?: ReactNode;
}) {
  const cell = Math.floor((SCREEN.width - GUTTER * 2) / 4);
  return (
    <div
      className={cx("dk", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      style={{ position: "relative", width: SCREEN.width, height: SCREEN.height, overflow: "hidden", ...style }}
    >
      {sky ? <div style={{ position: "absolute", inset: 0 }}>{sky}</div> : null}
      {statusBar ? <StatusBar time={time} /> : null}
      <div style={{ position: "relative", paddingTop: SCREEN.top }}>
        <div style={{ height: 48, padding: "0 16px", display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
          <SettingsTile name={name} />
        </div>
        <div style={{ padding: `4px ${GUTTER}px 0` }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 40, fontWeight: 300, letterSpacing: "-1.6px", color: C.fg }}>{day}</div>
            <div style={{ fontSize: 17, letterSpacing: "-0.2px", color: "rgba(237,237,235,0.80)", marginTop: 2 }}>{date}</div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {APPS.map((app) => (
              <AppTile key={app.id} app={app.id} width={cell} line={apps?.[app.id]?.line} lit={apps?.[app.id]?.lit} pressed={apps?.[app.id]?.pressed} arrive={apps?.[app.id]?.arrive} />
            ))}
          </div>
        </div>
      </div>
      {dock ? <Dock said={said} /> : null}
      {children}
    </div>
  );
}
