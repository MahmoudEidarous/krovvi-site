/**
 * Krovvi outside the app, as the newest build draws it (catch8 store build 20,
 * 6edb7fca): the lock screen with Krovvi's message arriving as a message from
 * Krovvi (targets/notify: NotificationService.swift, KrovviFace.swift), the
 * "Krovvi" and "Message Krovvi" widgets in the night sky look
 * (targets/recording-activity: KrovviWidget.swift, MessageKrovviWidget.swift,
 * RecordButtonWidget.swift, KrovviKit.swift), and a home screen with them.
 *
 * Every number is the Swift code's, checked against the captures in
 * design/outside-2026-10-14 (home/*.png drawn on the Mac from the same
 * SwiftUI, live/notify-on-iphone-en.png from the iOS 26 simulator). SwiftUI
 * sets SF Pro on a line of 1.213 em plus its lineSpacing; the web sets the
 * same line, shifted so each baseline falls where SwiftUI puts it (swiftLine).
 * Server renderable; content through props; no outside pictures.
 */

import "./deep.css";
import "./friend.css";

import type { CSSProperties, ReactNode } from "react";

import { emo, StatusBar, type Piece } from "./chat";
import { K_DOTS } from "./glyphs";
import { C, SCREEN } from "./tokens";

const cx = (...names: Array<string | false | null | undefined>) => names.filter(Boolean).join(" ") || undefined;
const f = (n: number) => Math.round(n * 1000) / 1000;
const circle = (cx0: number, cy0: number, r: number) => `M${f(cx0 - r)} ${f(cy0)}a${f(r)} ${f(r)} 0 1 0 ${f(r * 2)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-r * 2)} 0Z`;

/** KrovviKit.swift Palette (mirrors src/theme/tokens.ts). */
const INK = {
  bg: "#030303",
  fg: "#EDEDEB",
  fg2: "#D9D8D3",
  soft: "#A9A8A2",
  muted: "#8F8F8A",
  faint: "#7A7A74",
  record: "#FF6B5E",
  /** The tile laid on the night as one solid colour (white 8% over #030303). */
  field: "#171717",
  tileEdge: "rgba(255,255,255,0.12)",
} as const;

/**
 * A SwiftUI text's line on the web: SwiftUI sets SF Pro on 1.213 em plus its
 * lineSpacing between lines (measured on krovvi-medium-en.png: 16.5 point
 * words 22.33 apart), with the first baseline 0.9594 em under its top. CSS
 * centres the same line, so the box is shifted to put the baseline there.
 */
function swiftLine(size: number, spacing = 0): { lineHeight: string; marginTop: number; marginBottom: number } {
  const line = 1.213 * size + spacing;
  const cssBaseline = (line - 1.193 * size) / 2 + 0.952 * size;
  const shift = 0.9594 * size - cssBaseline;
  return { lineHeight: `${f(line)}px`, marginTop: f(shift), marginBottom: f(-spacing - shift) };
}

/* ------------------------------------------------------------------ */
/* Marks                                                               */
/* ------------------------------------------------------------------ */

/**
 * The K as the widgets draw it (KrovviKit.swift KMark): the seven dots of the
 * small mark on its 120 square, `dot` units across (the brand's 16, the
 * widgets' 18 where it is small, the Live Activities' 20).
 */
export function KMark({ size = 18, dot = 18, color = INK.fg, className, style }: { size?: number; dot?: number; color?: string; className?: string; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={className} style={{ display: "block", flexShrink: 0, overflow: "visible", ...style }} aria-hidden="true">
      <path d={K_DOTS.map(([x, y]) => circle(x, y, dot / 2)).join("")} fill={color} />
    </svg>
  );
}

/** KrovviFace.swift: the still stars on Krovvi's picture, as shares of its side (across, down, size, light). */
const FACE_STARS = [
  [0.27, 0.24, 0.012, 0.5],
  [0.74, 0.2, 0.009, 0.34],
  [0.8, 0.66, 0.011, 0.4],
  [0.22, 0.72, 0.008, 0.28],
  [0.58, 0.85, 0.008, 0.24],
] as const;

/**
 * Krovvi's picture on its messages (targets/notify/KrovviFace.swift): the
 * seven-dot K in ivory on the night, 54 percent of the side, with five still
 * stars, shown by iOS in a circle. `size` in points.
 */
export function KrovviFace({ size = 38, className, style }: { size?: number; className?: string; style?: CSSProperties }) {
  const s = size;
  const unit = (s * 0.54) / 120;
  const ox = s / 2 - 61 * unit;
  const oy = s / 2 - 60 * unit;
  return (
    <span className={className} style={{ position: "relative", display: "block", width: s, height: s, borderRadius: "50%", overflow: "hidden", background: INK.bg, flexShrink: 0, ...style }} aria-hidden="true">
      {FACE_STARS.map(([x, y, size0, light], i) => {
        // A point of light fading into the night: its light, half of it at 35 percent of its reach, nothing at 2.4 times its size.
        const reach = Math.max(1 / 80, size0) * s * 2.4;
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              left: x * s - reach,
              top: y * s - reach,
              width: reach * 2,
              height: reach * 2,
              background: `radial-gradient(circle closest-side, rgba(237,237,235,${light}) 0%, rgba(237,237,235,${f(light * 0.55)}) 35%, rgba(237,237,235,0) 100%)`,
            }}
          />
        );
      })}
      <svg width={s} height={s} viewBox={`0 0 ${f(s)} ${f(s)}`} style={{ position: "absolute", inset: 0 }}>
        <path d={K_DOTS.map(([x, y]) => circle(ox + x * unit, oy + y * unit, 8 * unit)).join("")} fill="#EDEDEB" />
      </svg>
    </span>
  );
}

/** The app icon's eleven dots on its 1024 square (catch8 brand/icon-1024.svg). */
const ICON_DOTS = [
  [358, 268.8],
  [358, 390.4],
  [358, 512],
  [358, 633.6],
  [358, 755.2],
  [464.4, 436],
  [570.8, 360],
  [677.2, 284],
  [464.4, 588],
  [570.8, 664],
  [677.2, 740],
] as const;

/**
 * Krovvi's app icon (brand/icon-1024.svg): eleven ivory dots as a K on the
 * tile's near black, in the icon's own rounded square (iOS masks it to about
 * 22.4 percent of its side).
 */
export function KrovviIcon({ size = 62, className, style }: { size?: number; className?: string; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 1024 1024" className={className} style={{ display: "block", flexShrink: 0, borderRadius: size * 0.2237, ...style }} aria-hidden="true">
      <rect width="1024" height="1024" rx="229" fill="#0A0A0A" />
      <path d={ICON_DOTS.map(([x, y]) => circle(x, y, 49.4)).join("")} fill="#EDEDEB" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* A message from Krovvi, as iOS shows it                              */
/* ------------------------------------------------------------------ */

export interface KrovviNote {
  /** Krovvi's own words. */
  text: string;
  /** How long ago, as iOS says it: "now", "2m ago", "1h ago". */
  when?: string;
  /** The sender's name: "Krovvi" (NotificationService.swift INPerson displayName). */
  title?: string;
}

/**
 * Krovvi's message as a notification (targets/notify/NotificationService.swift):
 * a communication notification, so iOS draws it as a message from a person,
 * the sender's picture first (Krovvi's K on the night, KrovviFace) with the
 * app's icon at its corner, the sender's name, when, and the words.
 *
 * Measured on the iOS 26 simulator (live/notify-on-iphone-en.png): the
 * platter 8 in from the screen's sides with 24 point corners; the picture 38
 * across, 14 in, standing in the middle; the words from 65 in, 15 points on
 * lines 22 apart, the name semibold, "now" 13 points in iOS's secondary ink;
 * the app's icon 15.8 across over the picture's lower right, 3 points out.
 * `banner`: as it drops in over an app (iOS's darker banner, two lines);
 * otherwise as it rests on the lock screen (four lines, the mock's glass of
 * live/notification-from-krovvi.png). `rise` plays its arrival.
 */
export function Notification({
  text,
  when = "now",
  title = "Krovvi",
  banner = false,
  lines,
  rise = false,
  delay = 0,
  width = SCREEN.width - 16,
  className,
  style,
}: Piece &
  KrovviNote & {
    banner?: boolean;
    /** How many lines of its words show before "…": 2 on a banner, 4 on the lock screen. */
    lines?: number;
    rise?: boolean;
    /** When its arrival starts, in ms. */
    delay?: number;
    width?: number;
  }) {
  const shown = lines ?? (banner ? 2 : 4);
  const ground = banner ? "#1B1B1B" : "rgba(44,43,47,0.86)";
  return (
    <div
      className={cx("dk", rise && (banner ? "dkx-banner-in" : "dkx-note-in"), className)}
      role="group"
      aria-label={`${title}, ${when}: ${text}`}
      style={{
        position: "relative",
        width,
        borderRadius: 24,
        background: ground,
        boxShadow: "inset 0 0 0 0.5px rgba(255,255,255,0.13)",
        padding: "9.23px 17.7px 14.4px 64.1px",
        minHeight: 66.3,
        ...(rise ? ({ "--dk-delay": `${delay}ms` } as CSSProperties) : null),
        ...style,
      }}
    >
      <span style={{ position: "absolute", left: 14, top: "50%", width: 38, height: 38, marginTop: -19 }}>
        <KrovviFace size={38} />
        <span style={{ position: "absolute", left: 25.2, top: 25.2, width: 15.8, height: 15.8, borderRadius: 4.6, boxShadow: `0 0 0 1px ${banner ? "#1B1B1B" : "rgb(42,41,46)"}` }}>
          <KrovviIcon size={15.8} />
        </span>
      </span>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, lineHeight: "22px" }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 600, letterSpacing: "-0.04px", color: "rgba(255,255,255,0.92)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</span>
        <span style={{ fontSize: 13, letterSpacing: "-0.08px", color: "rgba(235,235,245,0.6)", whiteSpace: "nowrap" }}>{when}</span>
      </div>
      <div
        style={{
          marginTop: -1.33,
          fontSize: 15,
          lineHeight: "22px",
          letterSpacing: "-0.04px",
          color: "rgba(255,255,255,0.92)",
          display: "-webkit-box",
          WebkitLineClamp: shown,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          overflowWrap: "break-word",
        }}
      >
        {emo(text, 1.12)}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The lock screen                                                     */
/* ------------------------------------------------------------------ */

/**
 * The night wallpaper of the lock screen captures (home/lock-en.png, drawn on
 * the Mac): a deep violet at the top, lit a little toward the top right,
 * falling to near black at the foot. `dusk` is that; `night` is the app's own
 * sky black, for a `sky` of stars laid over it.
 */
export const WALLPAPER = {
  dusk:
    "radial-gradient(120% 34% at 76% -2%, rgba(84,66,124,0.85) 0%, rgba(84,66,124,0) 100%), linear-gradient(180deg, #3D3159 0%, #3A2E57 12%, #2C2547 25%, #221C38 38%, #17112A 58%, #0E0B1B 78%, #07060F 100%)",
  night: "#020202",
} as const;

/** What the lock screen's widgets show (KrovviWidget.swift KrovviRectFace and KrovviInlineFace): Krovvi's latest words, or the door. */
export interface LockWidgetsProps {
  /** Krovvi's latest words; none shows "Ask Krovvi". */
  text?: string;
  when?: string;
  /** A locked phone that keeps widgets private, or Always On: "Krovvi wrote to you" instead of the words. */
  hidden?: boolean;
}

/**
 * The row of lock screen widgets under the clock (home/lock-en.png): the K
 * in its circle (Message Krovvi, MessageCircleFace: the K 34 across on the
 * system's own disc), Record's ring and dot (RecordCircleFace: a 32 ring of
 * 2.5 and a 15 dot), and Krovvi's line (KrovviRectFace: the K 13, "Krovvi"
 * 13.5 semibold, when at 0.75, the words 14.5 on two lines). Monochrome, as
 * iOS paints the lock screen.
 */
export function LockWidgets({ text, when = "now", hidden = false, className, style }: Piece & LockWidgetsProps) {
  const disc: CSSProperties = { width: 72, height: 72, borderRadius: 36, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };
  return (
    <div className={className} style={{ display: "flex", alignItems: "flex-start", gap: 10, ...style }} aria-hidden="true">
      <span style={disc}>
        <KMark size={34} dot={17} color="#FFFFFF" />
      </span>
      <span style={disc}>
        <span style={{ position: "relative", width: 32, height: 32, borderRadius: 16, border: "2.5px solid #FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ width: 15, height: 15, borderRadius: 7.5, background: "#FFFFFF" }} />
        </span>
      </span>
      <div style={{ width: 160, height: 72, color: "#FFFFFF", display: "flex", flexDirection: "column", gap: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, height: 19 }}>
          <KMark size={13} dot={18} color="#FFFFFF" />
          <span style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap" }}>Krovvi</span>
          <span style={{ flex: 1 }} />
          {text ? <span style={{ fontSize: 12.5, opacity: 0.75, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{when}</span> : null}
        </div>
        <div style={{ fontSize: 14.5, lineHeight: "17.6px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {text && !hidden ? emo(text, 1.1) : text ? "Krovvi wrote to you" : "Ask Krovvi"}
        </div>
      </div>
    </div>
  );
}

/** The lock screen's flashlight and camera, at its foot corners. */
function LockButton({ side, children }: { side: "left" | "right"; children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      style={{
        position: "absolute",
        [side]: 25,
        bottom: 39,
        width: 50,
        height: 50,
        borderRadius: 25,
        background: "rgba(24,22,34,0.42)",
        boxShadow: "inset 0 0 0 0.5px rgba(255,255,255,0.14)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </span>
  );
}

/**
 * The lock screen at night, with Krovvi's messages on it: the night
 * wallpaper (`wallpaper`, or a `sky` of stars over the night), the date and
 * the large clock (measured on home/lock-en.png: the date 17 points
 * semibold, the clock 96 points bold, both in iOS's lock screen white), the
 * lock screen widgets if asked for, Krovvi's notifications resting over the
 * flashlight and the camera, newest on top. `inline`: the line iOS shows
 * after a shortened date ("Wed 14 Oct  Krovvi: How did the..."), the Krovvi
 * widget's inline face.
 */
export function LockScreen({
  time = "9:41",
  date = "Wednesday 14 October",
  shortDate = "Wed 14 Oct",
  inline,
  notes = [],
  wallpaper = "dusk",
  sky,
  widgets,
  buttons = true,
  rise = false,
  stagger = 700,
  delay = 0,
  label,
  children,
  className,
  style,
}: Piece & {
  time?: string;
  date?: string;
  /** The date as iOS shortens it beside an inline widget. */
  shortDate?: string;
  /** The inline widget's words after the date: "Krovvi: How did the Northline interview go?". */
  inline?: string;
  /** Krovvi's messages, newest first. */
  notes?: KrovviNote[];
  wallpaper?: keyof typeof WALLPAPER | (string & {});
  /** Stars over the wallpaper (PhoneSky). */
  sky?: ReactNode;
  /** The widgets under the clock; omitted for none. */
  widgets?: LockWidgetsProps;
  /** The flashlight and the camera at the foot. */
  buttons?: boolean;
  /** The notifications arrive, the newest last, `stagger` ms apart after `delay`. */
  rise?: boolean;
  stagger?: number;
  delay?: number;
  label?: string;
  children?: ReactNode;
}) {
  const ground = wallpaper in WALLPAPER ? WALLPAPER[wallpaper as keyof typeof WALLPAPER] : wallpaper;
  return (
    <div
      className={cx("dk", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      style={{ position: "relative", width: SCREEN.width, height: SCREEN.height, overflow: "hidden", background: ground, ...style }}
    >
      {sky ? <div style={{ position: "absolute", inset: 0 }}>{sky}</div> : null}
      <StatusBar time="" />
      {/* The date: 17 semibold, its baseline 81 from the top, the line held to 286 points as iOS holds it beside an inline widget;
          the clock's proportional digits 93 points bold, from 105 to their baseline at 172 (lock-en.png). */}
      <div style={{ position: "absolute", left: "50%", width: 286, marginLeft: -143, top: 64, textAlign: "center", fontSize: 17, lineHeight: "22px", fontWeight: 600, letterSpacing: "-0.1px", color: "rgba(239,238,241,0.96)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {inline ? (
          <>
            {shortDate}
            <span style={{ marginLeft: 7 }}>{inline}</span>
          </>
        ) : (
          date
        )}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 79.7,
          textAlign: "center",
          fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
          fontSize: 93,
          lineHeight: "114px",
          fontWeight: 700,
          letterSpacing: "0px",
          color: "#EFEEF1",
        }}
      >
        {time}
      </div>
      {widgets ? <LockWidgets {...widgets} style={{ position: "absolute", left: 34.5, top: 197 }} /> : null}
      {notes.length ? (
        <div style={{ position: "absolute", left: 8, right: 8, bottom: 118, display: "flex", flexDirection: "column", gap: 8 }}>
          {notes.map((note, i) => (
            <Notification key={i} {...note} width={SCREEN.width - 16} rise={rise} delay={delay + (notes.length - 1 - i) * stagger} />
          ))}
        </div>
      ) : null}
      {buttons ? (
        <>
          <LockButton side="left">
            {/* The flashlight: a lamp's head over its handle, with its switch. */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 2.8h10v3.4l-2.6 3.6v11a1.4 1.4 0 0 1-1.4 1.4h-2a1.4 1.4 0 0 1-1.4-1.4v-11L7 6.2Z" />
              <path d="M7 6.2h10" />
              <circle cx="12" cy="13.4" r="1.15" fill="#FFFFFF" stroke="none" />
            </svg>
          </LockButton>
          <LockButton side="right">
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <path d={CAMERA} fill="none" stroke="#FFFFFF" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </LockButton>
        </>
      ) : null}
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The widgets' night (KrovviKit.swift StarField, StarsView)            */
/* ------------------------------------------------------------------ */

interface Star {
  x: number;
  y: number;
  r: number;
  a: number;
  glow: boolean;
}

type Rect = readonly [number, number, number, number];

/** mulberry32, the app's own generator (KrovviKit.swift Seeded, src/lib/sky/stars.ts). */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1) >>> 0;
    t = (t ^ ((t + Math.imul(t ^ (t >>> 7), t | 61)) >>> 0)) >>> 0;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** StarField(far:seed:avoid:bright:): far stars from the seed, kept out of the marks and words; the bright ones laid by hand. */
function starField(far: number, seed: number, avoid: readonly Rect[], bright: ReadonlyArray<readonly [number, number, number, number, boolean?]>): Star[] {
  const next = seeded(seed);
  const inside = (x: number, y: number) => avoid.some(([rx, ry, rw, rh]) => x >= rx && x < rx + rw && y >= ry && y < ry + rh);
  const out: Star[] = [];
  for (let i = 0; i < far; i += 1) {
    let x = next();
    let y = next();
    let tries = 0;
    while (tries < 24 && inside(x, y)) {
      x = next();
      y = next();
      tries += 1;
    }
    const r = 0.35 + next() * 0.2;
    const a = 0.1 + next() * 0.12;
    if (inside(x, y)) continue;
    out.push({ x, y, r, a, glow: false });
  }
  return [...out, ...bright.map(([x, y, r, a, glow]) => ({ x, y, r, a, glow: !!glow }))];
}

/** Each face's own sky (KrovviKit.swift:279-321), the stars where its content never goes. */
export const SKIES = {
  messageSmall: starField(9, 11, [[0, 0, 0.32, 0.3], [0.66, 0, 0.34, 0.24]], [[0.52, 0.09, 0.95, 0.6, true], [0.9, 0.93, 0.6, 0.3], [0.08, 0.95, 0.55, 0.26]]),
  messageMedium: starField(
    16,
    23,
    [[0, 0, 0.32, 0.28], [0.82, 0, 0.18, 0.24], [0, 0.76, 0.36, 0.24], [0.64, 0.76, 0.36, 0.24]],
    [[0.56, 0.1, 1.0, 0.62, true], [0.47, 0.88, 0.65, 0.34], [0.58, 0.95, 0.55, 0.26], [0.97, 0.55, 0.6, 0.3]],
  ),
  doorSmall: starField(9, 31, [[0, 0, 0.42, 0.42], [0, 0.6, 1, 0.4]], [[0.8, 0.2, 1.0, 0.62, true], [0.6, 0.46, 0.65, 0.34], [0.92, 0.5, 0.55, 0.28], [0.26, 0.5, 0.55, 0.24]]),
  doorMedium: starField(16, 37, [[0, 0, 0.36, 0.36], [0, 0.56, 1, 0.44]], [[0.74, 0.2, 1.0, 0.62, true], [0.52, 0.4, 0.65, 0.34], [0.93, 0.42, 0.6, 0.3], [0.42, 0.12, 0.5, 0.24]]),
  askMedium: starField(12, 41, [[0, 0, 1, 0.42], [0.06, 0.5, 0.88, 0.5]], [[0.97, 0.66, 0.95, 0.6, true], [0.03, 0.62, 0.55, 0.28], [0.5, 0.465, 0.55, 0.26]]),
  record: starField(9, 53, [[0, 0, 0.24, 0.24], [0.14, 0.12, 0.72, 0.72], [0.26, 0.8, 0.48, 0.2]], [[0.84, 0.15, 1.0, 0.62, true], [0.1, 0.6, 0.6, 0.3], [0.9, 0.74, 0.6, 0.32]]),
  none: [] as Star[],
} as const;

export type SkyName = keyof typeof SKIES;

/** The stars, drawn (StarsView): still points at fixed shares of the ground, the near ones in a little light 4.2 times their size. */
function WidgetStars({ stars, width, height }: { stars: readonly Star[]; width: number; height: number }) {
  return (
    <>
      {stars
        .filter((s) => s.glow)
        .map((s, i) => (
          <span
            key={`g${i}`}
            style={{
              position: "absolute",
              left: s.x * width - s.r * 4.2,
              top: s.y * height - s.r * 4.2,
              width: s.r * 8.4,
              height: s.r * 8.4,
              background: `radial-gradient(circle closest-side, rgba(237,237,235,${f(0.32 * s.a)}) 0%, rgba(237,237,235,${f(0.1 * s.a)}) 50%, rgba(237,237,235,0) 100%)`,
            }}
          />
        ))}
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: "absolute", inset: 0 }} aria-hidden="true">
        {stars.map((s, i) => (
          <path key={i} d={circle(s.x * width, s.y * height, s.r)} fill="#EDEDEB" fillOpacity={f(s.a)} />
        ))}
      </svg>
    </>
  );
}

/** A widget's ground: the night (#030303) and its stars, in iOS's widget corner. */
function WidgetGround({ width, height, sky, children, label, className, style }: Piece & { width: number; height: number; sky: SkyName; children?: ReactNode; label?: string }) {
  return (
    <div
      className={cx("dk", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      style={{ position: "relative", width, height, borderRadius: 22, overflow: "hidden", background: INK.bg, flexShrink: 0, ...style }}
    >
      <WidgetStars stars={SKIES[sky]} width={width} height={height} />
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The widgets                                                         */
/* ------------------------------------------------------------------ */

/** A widget's size on the site's 393 point phone (Apple's sizes for a 393 x 852 screen); the captures' 402 point phone has 170 and 364. */
export const WIDGET = { small: 158, medium: 338, height: 158 } as const;

/**
 * The star before Krovvi's words (KrovviKit.swift KrovviStar): an ivory point
 * in its own soft light while new, the plain muted point once read.
 */
function WidgetStar({ dot, lit }: { dot: number; lit: boolean }) {
  const light = dot * 4;
  return (
    <span style={{ position: "relative", display: "block", width: dot, height: dot }}>
      {lit ? (
        <span
          style={{
            position: "absolute",
            left: (dot - light) / 2,
            top: (dot - light) / 2,
            width: light,
            height: light,
            // RadialGradient(stops 0.5, 0.16 at 0.45, 0 at 1; startRadius dot * 0.45, endRadius dot * 2).
            background: "radial-gradient(circle closest-side, rgba(237,237,235,0.5) 0%, rgba(237,237,235,0.5) 22.5%, rgba(237,237,235,0.16) 57.4%, rgba(237,237,235,0) 100%)",
          }}
        />
      ) : null}
      <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: lit ? INK.fg : INK.muted }} />
    </span>
  );
}

/**
 * Krovvi's words with the star before them (KrovviWidget.swift KrovviLine):
 * the star on the middle of the first line (its centre a third of the size
 * over the baseline), 9 from the words, which are `size` points tracked -0.2
 * with 0.14 of their size between lines, ivory while new and a step quieter
 * once read, cut after `lines` lines.
 */
function WidgetLine({ text, size, lines, lit }: { text: string; size: number; lines: number; lit: boolean }) {
  const dot = size >= 16 ? 6 : 5.5;
  const line = swiftLine(size, size * 0.14);
  const baseline = 0.9594 * size;
  return (
    <div style={{ position: "relative", display: "flex", paddingLeft: dot + 9 }}>
      <span style={{ position: "absolute", left: 0, top: baseline - size * 0.33 - dot / 2 }}>
        <WidgetStar dot={dot} lit={lit} />
      </span>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: size,
          letterSpacing: "-0.2px",
          color: lit ? INK.fg : INK.fg2,
          lineHeight: line.lineHeight,
          marginTop: line.marginTop,
          marginBottom: line.marginBottom,
          display: "-webkit-box",
          WebkitLineClamp: lines,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          overflowWrap: "break-word",
        }}
      >
        {emo(text, 1.12)}
      </div>
    </div>
  );
}

/**
 * The chat's text box at rest, as a door (KrovviKit.swift AskField): a long
 * round field, solid on the night (#171717) with a half point edge, its
 * words in soft ink, the K at its start when `mark`.
 */
function AskField({ text, height, size, mark = false }: { text: string; height: number; size: number; mark?: boolean }) {
  return (
    <div style={{ height, borderRadius: height / 2, background: INK.field, boxShadow: `inset 0 0 0 0.5px ${INK.tileEdge}`, display: "flex", alignItems: "center", gap: 10, padding: "0 16px", flexShrink: 0 }}>
      {mark ? <KMark size={16} dot={18} color={INK.muted} /> : null}
      <span style={{ flex: 1, minWidth: 0, fontSize: size, letterSpacing: "-0.15px", color: INK.soft, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{text}</span>
    </div>
  );
}

/**
 * "Krovvi": what Krovvi last said to you (KrovviWidget.swift KrovviHomeFace),
 * small or medium, on its own night sky: the K, "Krovvi" on the wide one and
 * how long ago; then its words with the star, lit while new; "Tap to reply"
 * at the foot of the wide one. With no `text`, the door: the K large and the
 * chat's field ("Ask Krovvi", "Ask, or give it a job"). Sizes are the 393
 * point phone's by default (`width`, `height` to change them).
 */
export function KrovviWidget({
  size = "medium",
  text,
  when = "now",
  unread = true,
  width,
  height = WIDGET.height,
  label,
  className,
  style,
}: Piece & {
  size?: "small" | "medium";
  /** Krovvi's latest words; none draws the door. */
  text?: string;
  /** "now", "2m", "3h", "Yesterday" (Clock.ago). */
  when?: string;
  /** New: the star lit and the words ivory; read: the plain point and the words a step quieter. */
  unread?: boolean;
  width?: number;
  height?: number;
  label?: string;
}) {
  const medium = size === "medium";
  const w = width ?? (medium ? WIDGET.medium : WIDGET.small);
  if (!text) return <DoorFace size={size} width={w} height={height} label={label ?? "Krovvi: Ask Krovvi"} className={className} style={style} />;
  const nameLine = swiftLine(13.5);
  const agoLine = swiftLine(12.5);
  const reply = swiftLine(12.5);
  return (
    <WidgetGround width={w} height={height} sky={medium ? "messageMedium" : "messageSmall"} label={label ?? `Krovvi, ${when}: ${text}`} className={className} style={style}>
      <div style={{ position: "absolute", inset: 0, padding: 16, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, height: 18, flexShrink: 0 }}>
          <KMark size={18} dot={18} />
          {medium ? <span style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: "-0.1px", color: INK.fg, lineHeight: nameLine.lineHeight, whiteSpace: "nowrap" }}>Krovvi</span> : null}
          <span style={{ flex: 1, minWidth: 4 }} />
          <span style={{ fontSize: 12.5, color: INK.muted, fontVariantNumeric: "tabular-nums", lineHeight: agoLine.lineHeight, whiteSpace: "nowrap" }}>{when}</span>
        </div>
        <div style={{ height: medium ? 12 : 13, flexShrink: 0 }} />
        <WidgetLine text={text} size={medium ? 16.5 : 16} lines={medium ? 3 : 5} lit={unread} />
        <div style={{ flex: 1 }} />
        {medium ? <div style={{ fontSize: 12.5, color: INK.muted, lineHeight: reply.lineHeight, marginBottom: reply.marginBottom, flexShrink: 0 }}>Tap to reply</div> : null}
      </div>
    </WidgetGround>
  );
}

/** No message yet (KrovviDoorFace): the K, large, and the chat's own field. The words are a label, never Krovvi's voice. */
function DoorFace({ size, width, height, label, className, style }: Piece & { size: "small" | "medium"; width: number; height: number; label: string }) {
  const small = size === "small";
  return (
    <WidgetGround width={width} height={height} sky={small ? "doorSmall" : "doorMedium"} label={label} className={className} style={style}>
      <div style={{ position: "absolute", inset: 0, padding: small ? 14 : 16, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <KMark size={small ? 44 : 30} dot={16} />
          {small ? null : <span style={{ fontSize: 15, fontWeight: 600, color: INK.fg }}>Krovvi</span>}
        </div>
        <div style={{ flex: 1 }} />
        <AskField text={small ? "Ask Krovvi" : "Ask, or give it a job"} height={small ? 42 : 46} size={small ? 15 : 16} />
      </div>
    </WidgetGround>
  );
}

/** KrovviKit.swift CameraGlyph on its 24 square: the body with its rounded foot, the viewfinder's bump, and the lens. */
const CAMERA =
  "M1.4 8A2.5 2.5 0 0 1 3.9 5.5L8.8 5.5L8.8 4.1A1.4 1.4 0 0 1 10.2 2.7L13.8 2.7A1.4 1.4 0 0 1 15.2 4.1L15.2 5.5L20.1 5.5A2.5 2.5 0 0 1 22.6 8L22.6 19.4A2.5 2.5 0 0 1 20.1 21.9L3.9 21.9A2.5 2.5 0 0 1 1.4 19.4Z" +
  "M16.4 13.2A4.4 4.4 0 1 1 7.6 13.2A4.4 4.4 0 1 1 16.4 13.2Z";
/** KrovviKit.swift PictureGlyph: a frame, two hills. */
const PICTURE = "M4.6 2.6L19.4 2.6A3.2 3.2 0 0 1 22.6 5.8L22.6 18.2A3.2 3.2 0 0 1 19.4 21.4L4.6 21.4A3.2 3.2 0 0 1 1.4 18.2L1.4 5.8A3.2 3.2 0 0 1 4.6 2.6Z" + "M2.2 18.2L8.3 12.1L13.5 17.3L16.4 14.4L21.8 19.8";

/** An icon of the + sheet as the widget strokes it (KrovviKit.swift PlusIcon): 1.9 of its 24 units, round ends, with its dot. */
function PlusIcon({ kind, size = 23, color = INK.fg }: { kind: "camera" | "picture"; size?: number; color?: string }) {
  const [dx, dy, dr] = kind === "camera" ? [12, 13.2, 1.4] : [16.4, 8.2, 1.8];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block", overflow: "visible" }} aria-hidden="true">
      <path d={kind === "camera" ? CAMERA : PICTURE} fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
      <path d={circle(dx, dy, dr)} fill={color} />
    </svg>
  );
}

/** The record dot (KrovviKit.swift RecordDot): recording's red, the one colour out here, in a little of its own light. */
export function RecordDot({ size = 15, light = true, className, style }: Piece & { size?: number; light?: boolean }) {
  const reach = size * 2.3;
  return (
    <span className={className} style={{ position: "relative", display: "block", width: size, height: size, flexShrink: 0, ...style }}>
      {light ? (
        <span
          style={{
            position: "absolute",
            left: (size - reach) / 2,
            top: (size - reach) / 2,
            width: reach,
            height: reach,
            // RadialGradient(record 0.42, 0.12, 0; startRadius size * 0.42, endRadius size * 1.15).
            background: "radial-gradient(circle closest-side, rgba(255,107,94,0.42) 0%, rgba(255,107,94,0.42) 36.5%, rgba(255,107,94,0.12) 68.3%, rgba(255,107,94,0) 100%)",
          }}
        />
      ) : null}
      <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: INK.record }} />
    </span>
  );
}

/** One of the + sheet's round glass buttons on a widget (KrovviKit.swift GlassRound), with its name under it 5 lower. */
function Way({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span style={{ width: 66, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
      <span style={{ width: 50, height: 50, borderRadius: 25, background: INK.field, boxShadow: `inset 0 0 0 0.5px ${INK.tileEdge}`, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</span>
      <span style={{ fontSize: 11.5, color: INK.muted, lineHeight: swiftLine(11.5).lineHeight, whiteSpace: "nowrap" }}>{label}</span>
    </span>
  );
}

/**
 * "Message Krovvi" (MessageKrovviWidget.swift): the chat's own text box on
 * the home screen. Small: the K and "Ask Krovvi" (the door). Medium: "Ask,
 * or give it a job" with the K at its start, and the + sheet's three ways in
 * under it, Camera, Photos and Record in its red.
 */
export function MessageWidget({ size = "medium", width, height = WIDGET.height, label, className, style }: Piece & { size?: "small" | "medium"; width?: number; height?: number; label?: string }) {
  const w = width ?? (size === "medium" ? WIDGET.medium : WIDGET.small);
  if (size === "small") return <DoorFace size="small" width={w} height={height} label={label ?? "Message Krovvi: Ask Krovvi"} className={className} style={style} />;
  return (
    <WidgetGround width={w} height={height} sky="askMedium" label={label ?? "Message Krovvi: Ask, or give it a job. Camera, Photos, Record."} className={className} style={style}>
      <div style={{ position: "absolute", inset: 0, padding: "16px 16px 14px", display: "flex", flexDirection: "column" }}>
        <AskField text="Ask, or give it a job" height={48} size={16} mark />
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", justifyContent: "space-between", padding: "0 26px" }}>
          <Way label="Camera">
            <PlusIcon kind="camera" />
          </Way>
          <Way label="Photos">
            <PlusIcon kind="picture" />
          </Way>
          <Way label="Record">
            <RecordDot size={15} />
          </Way>
        </div>
      </div>
    </WidgetGround>
  );
}

/** Record (RecordButtonWidget.swift RecordSmallFace): the K small and quiet, the red disc in its light, "Record" under it. */
export function RecordWidget({ width = WIDGET.small, height = WIDGET.height, label, className, style }: Piece & { width?: number; height?: number; label?: string }) {
  return (
    <WidgetGround width={width} height={height} sky="record" label={label ?? "Record"} className={className} style={style}>
      <div style={{ position: "absolute", inset: 0, padding: "16px 16px 14px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ alignSelf: "stretch" }}>
          <KMark size={15} dot={18} color={INK.muted} />
        </div>
        <div style={{ flex: 1 }} />
        <RecordDot size={58} />
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 14, fontWeight: 500, letterSpacing: "-0.1px", color: INK.fg2, lineHeight: swiftLine(14).lineHeight }}>Record</span>
      </div>
    </WidgetGround>
  );
}

/* ------------------------------------------------------------------ */
/* The home screen                                                     */
/* ------------------------------------------------------------------ */

/** The home screen's wallpaper: a calm deep blue, lighter at the top left (home/home-en.png's ground); no picture of anyone's. */
export const HOME_WALLPAPER =
  "radial-gradient(90% 55% at 12% 0%, rgba(70,104,160,0.55) 0%, rgba(70,104,160,0) 100%), linear-gradient(185deg, #2F4C78 0%, #2B4772 18%, #213A62 38%, #182C4D 58%, #10203A 78%, #0B1528 100%)";

/** A label under a widget or an app on the home screen: 12 points, white, in the soft shadow iOS gives words over a wallpaper. */
function HomeLabel({ text, width }: { text: string; width: number }) {
  return (
    <span style={{ display: "block", width, marginTop: 6, textAlign: "center", fontSize: 12, lineHeight: "16px", fontWeight: 500, letterSpacing: "-0.05px", color: "#FFFFFF", textShadow: "0 0.5px 2px rgba(0,0,0,0.35)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
      {text}
    </span>
  );
}

/** An app that is not Krovvi: a plain rounded square, no brand. */
function PlainApp({ tint }: { tint: string }) {
  return <span style={{ display: "block", width: 62, height: 62, borderRadius: 14, background: tint, boxShadow: "inset 0 0 0 0.5px rgba(255,255,255,0.14)" }} />;
}

/** Quiet tints for the other apps' squares: glass over the wallpaper, a few a shade warmer or cooler. */
const PLAIN = ["rgba(255,255,255,0.16)", "rgba(255,255,255,0.11)", "rgba(220,230,255,0.15)", "rgba(255,255,255,0.13)", "rgba(230,240,255,0.1)", "rgba(255,255,255,0.15)", "rgba(255,255,255,0.12)", "rgba(240,236,255,0.13)"];

/**
 * The home screen with Krovvi on it (as sim/home-screen-widgets.png): the
 * Krovvi widget with its latest words and Message Krovvi across the top, each
 * named under it; a row and a half of apps (plain squares for the others,
 * Krovvi's own icon among them); Search; and the dock. `layout="widgets"`
 * lays out the widgets alone, as home/home-en.png: Krovvi wide; Krovvi and
 * Message Krovvi small; Message Krovvi wide; Record and Krovvi read.
 */
export function HomeScreen({
  text = "How did the Northline interview go? 🙂",
  when = "now",
  unread = true,
  read = { text: "Sam said the contract would come by Monday. Want me to remind him?", when: "47m" },
  layout = "phone",
  wallpaper = HOME_WALLPAPER,
  sky,
  time = "9:41",
  label,
  children,
  className,
  style,
}: Piece & {
  /** Krovvi's latest words on the Krovvi widget; omitted for the door. */
  text?: string;
  when?: string;
  unread?: boolean;
  /** An older message, read, for the small Krovvi widget of the widgets layout. */
  read?: { text: string; when: string };
  layout?: "phone" | "widgets";
  wallpaper?: string;
  sky?: ReactNode;
  time?: string;
  label?: string;
  children?: ReactNode;
}) {
  const left = (SCREEN.width - WIDGET.medium) / 2;
  const pitch = WIDGET.height + 38;
  const top = 72;
  return (
    <div
      className={cx("dk", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      style={{ position: "relative", width: SCREEN.width, height: SCREEN.height, overflow: "hidden", background: wallpaper, ...style }}
    >
      {sky ? <div style={{ position: "absolute", inset: 0 }}>{sky}</div> : null}
      <StatusBar time={time} />
      {layout === "widgets" ? (
        <>
          <div style={{ position: "absolute", left, top }}>
            <KrovviWidget size="medium" text={text} when={when} unread={unread} />
            <HomeLabel text="Krovvi" width={WIDGET.medium} />
          </div>
          <div style={{ position: "absolute", left, top: top + pitch, display: "flex", gap: WIDGET.medium - 2 * WIDGET.small }}>
            <div>
              <KrovviWidget size="small" text={text} when={when} unread={unread} />
              <HomeLabel text="Krovvi" width={WIDGET.small} />
            </div>
            <div>
              <MessageWidget size="small" />
              <HomeLabel text="Message Krovvi" width={WIDGET.small} />
            </div>
          </div>
          <div style={{ position: "absolute", left, top: top + pitch * 2 }}>
            <MessageWidget size="medium" />
            <HomeLabel text="Message Krovvi" width={WIDGET.medium} />
          </div>
          <div style={{ position: "absolute", left, top: top + pitch * 3, display: "flex", gap: WIDGET.medium - 2 * WIDGET.small }}>
            <div>
              <RecordWidget />
              <HomeLabel text="Record" width={WIDGET.small} />
            </div>
            <div>
              <KrovviWidget size="small" text={read.text} when={read.when} unread={false} />
              <HomeLabel text="Krovvi" width={WIDGET.small} />
            </div>
          </div>
        </>
      ) : (
        <>
          <div style={{ position: "absolute", left, top }}>
            <KrovviWidget size="medium" text={text} when={when} unread={unread} />
            <HomeLabel text="Krovvi" width={WIDGET.medium} />
          </div>
          <div style={{ position: "absolute", left, top: top + pitch }}>
            <MessageWidget size="medium" />
            <HomeLabel text="Message Krovvi" width={WIDGET.medium} />
          </div>
          {/* Two rows of apps, 62 point squares 90 apart; Krovvi's own icon where the capture has it. */}
          {[0, 1].map((row) => (
            <div key={row} style={{ position: "absolute", left: 30.5, top: top + pitch * 2 + 4 + row * 98, display: "flex", gap: 28 }}>
              {(row === 0 ? [0, 1, 2, 3] : [4, 5, 6]).map((k) => (
                <div key={k} style={{ width: 62 }}>
                  {k === 6 ? <KrovviIcon size={62} /> : <PlainApp tint={PLAIN[k]} />}
                  {k === 6 ? <HomeLabel text="Krovvi" width={62} /> : null}
                </div>
              ))}
            </div>
          ))}
          {/* Search, over the dock. */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              bottom: 128,
              transform: "translateX(-50%)",
              height: 30,
              padding: "0 13px 0 11px",
              borderRadius: 15,
              background: "rgba(30,44,80,0.55)",
              boxShadow: "inset 0 0 0 0.5px rgba(255,255,255,0.18)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: "#FFFFFF",
              fontSize: 15,
              fontWeight: 500,
            }}
            aria-hidden="true"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round">
              <circle cx="10.5" cy="10.5" r="7" />
              <path d="M15.6 15.6 21 21" />
            </svg>
            Search
          </div>
          {/* The dock: four plain apps on its glass. */}
          <div
            style={{
              position: "absolute",
              left: 14,
              right: 14,
              bottom: 13,
              height: 95,
              borderRadius: 34,
              background: "rgba(150,170,210,0.16)",
              boxShadow: "inset 0 0 0 0.5px rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 16.5px",
            }}
            aria-hidden="true"
          >
            {[2, 0, 5, 3].map((k) => (
              <PlainApp key={k} tint={PLAIN[k]} />
            ))}
          </div>
        </>
      )}
      {children}
    </div>
  );
}
