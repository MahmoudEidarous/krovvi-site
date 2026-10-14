/**
 * The app's night look ("Deep") as numbers, read from the shipped app at
 * catch8-1 origin/main 272d7cc5. Every value names the file and line it came
 * from; docs/app-visual-spec-deep.md has the full table. Points in the app are
 * pixels on the phone canvas (393 x 852, components/phone.tsx), so every
 * number here is used as it is.
 */

/** theme/tokens.ts:17-65 */
export const C = {
  /** The apps' night, every page that is not the sky (tokens.ts:19). */
  bg: "#030303",
  /** The pane (tokens.ts:21). */
  surface: "#0E0E10",
  /** Raised inside a pane (tokens.ts:23). */
  surfaceHi: "#18181A",
  /** A hairline between rows (tokens.ts:25). */
  line: "#1C1C1E",
  fg: "#EDEDEB",
  fg2: "#D9D8D3",
  soft: "#A9A8A2",
  muted: "#8F8F8A",
  faint: "#7A7A74",
  danger: "#C4574F",
  /** The sky's black under the stars: the home and the chat (tokens.ts:43). */
  sky: "#010101",
  /** components/sky/stars.tsx:39, the black the stars stand on. */
  starGround: "#020202",
  edge: "rgba(255,255,255,0.07)",
  /** A pane over the stars (tokens.ts:52-53). */
  glass: "rgba(30,30,33,0.58)",
  glassEdge: "rgba(255,255,255,0.085)",
  glassSolid: "#121214",
  /** A sheet: solid in store build 20 (6edb7fca), where the chat no longer shows through it. */
  sheet: "#161619",
  sheetEdge: "rgba(255,255,255,0.12)",
  /** A tile inside a sheet (tokens.ts:62). */
  tile: "rgba(255,255,255,0.08)",
} as const;

/** The answer's inks (components/answer/look.ts:24-38). */
export const INK = {
  pick: "#E6DCC8",
  up: "#8CC59A",
  down: "#E5876B",
  warm: "#E3AE62",
  cold: "#8DB8D6",
  track: "rgba(237,237,235,0.12)",
} as const;

/** theme/tokens.ts:76-83, the speaker inks a person's letter is tinted with (components/person-face.tsx:23-27). */
export const VOICE = ["#E6DCC8", "#C98A62", "#B0A89D", "#C2A470", "#8F7864", "#D4B49A"] as const;

/**
 * StyleSheet.hairlineWidth on a 3x iPhone: one device pixel. Used for every
 * pane edge (theme/pane.ts:23,31,38,45).
 */
export const HAIR = 1 / 3;

/** theme/tokens.ts:85-94 */
export const RADIUS = { card: 20, control: 11, input: 16, composer: 26, sheet: 36, pill: 999 } as const;

/** theme/motion.ts:16 and tokens.ts:130, Emil's curve: the only easing in the app. */
export const EASE = "cubic-bezier(0.23, 1, 0.32, 1)";

/** theme/motion.ts:22-35 */
export const TIME = { press: 110, fade: 150, morph: 190, enter: 240, exit: 140, reflow: 200 } as const;

/** The type of the answer's pieces (components/answer/look.ts:45-58). */
export const FACE = {
  display: { fontSize: 40, lineHeight: "46px", fontWeight: 300, letterSpacing: "-1.4px", fontVariantNumeric: "tabular-nums" },
  figure: { fontSize: 24, lineHeight: "29px", fontWeight: 300, letterSpacing: "-0.8px", fontVariantNumeric: "tabular-nums" },
  title: { fontSize: 17, lineHeight: "22px", fontWeight: 600, letterSpacing: "-0.3px" },
  body: { fontSize: 15, lineHeight: "21px", fontWeight: 400, letterSpacing: "-0.15px" },
  label: { fontSize: 13, lineHeight: "18px", fontWeight: 500, letterSpacing: 0 },
  meta: { fontSize: 12, lineHeight: "16px", fontWeight: 400, letterSpacing: 0 },
} as const;

/**
 * The chat's words (components/answer/answer-style.ts:28-35): 17 on a 25
 * point line, tracked -0.2. Krovvi's answer, its bubbles and the person's
 * bubbles all wear it.
 */
export const ANSWER = { fontSize: 17, lineHeight: "25px", letterSpacing: "-0.2px", color: C.fg } as const;

/** The system font the app is set in (iOS draws SF Pro). */
export const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, sans-serif';

/** The phone canvas (components/phone.tsx): an iPhone's 393 x 852 points, with its safe areas. */
export const SCREEN = { width: 393, height: 852, top: 59, bottom: 34 } as const;

/** The chat's side margin (components/answer/answer-style.ts:52). */
export const THREAD_SIDE = 16;
/** Krovvi's turn stands this far in from its star (components/answer/reply.tsx:78). */
export const STAR_ROOM = 18;

/** A #RRGGBB colour at some alpha. */
export function alpha(hex: string, a: number): string {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  const [r, g, b] = m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [237, 237, 235];
  return `rgba(${r},${g},${b},${a})`;
}

/**
 * A home tile washed in its app's colour over the night, its edge in that
 * colour (components/apps/apps-screen.tsx:651-665 tileWash): the fill is the
 * colour at 16 percent over (8, 8, 9), the edge the colour at 0.34.
 */
export function tileWash(tint: string): { background: string; borderColor: string } {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(tint);
  const [r, g, b] = m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [237, 237, 235];
  return {
    background: `rgb(${Math.round(8 + r * 0.16)}, ${Math.round(8 + g * 0.16)}, ${Math.round(9 + b * 0.16)})`,
    borderColor: `rgba(${r}, ${g}, ${b}, 0.34)`,
  };
}

/** A person's tint, hashed from their name as the app does (components/person-face.tsx:23-27). */
export function personTint(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return VOICE[h % VOICE.length];
}
