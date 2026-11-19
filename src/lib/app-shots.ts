import shots from "../../public/app/shots.json";

/**
 * The app's own screens that krovvi.com shows: every phone on the page is a picture or a film of the real Krovvi app,
 * taken on the iOS simulator from the app's bench pages holding made-up chats (scripts/app-shots: take.sh takes them at
 * the phone's own 3x, cut.mjs sizes them and writes public/app/shots.json). Nothing here is drawn by the site.
 *
 * Files, per colour: /app/<theme>/<name>.webp (804 wide: a still, or a film's first frame) and <name>@3x.webp (1206
 * wide, for a phone drawn large or a real phone's sharp screen), <name>.mp4 (a film) and <name>-end.webp (a film's last
 * frame, sharper than the film's). x-<name> is one exchange cut out of a chat: what was said, Krovvi's reply and the
 * card under it.
 */

export type Theme = "purple" | "ocean" | "coral" | "mono";
export const THEMES: readonly Theme[] = ["purple", "ocean", "coral", "mono"];

/** Where a control sits on the screen, in the screen's points (from the simulator's own accessibility frames). */
export interface Frame {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Taken {
  stills?: string[];
  films?: Record<string, number>;
}

interface Shots {
  taken?: string;
  screen?: [number, number];
  themes?: Partial<Record<Theme, Taken>>;
  frames?: Record<string, Frame>;
  sizes?: Record<string, [number, number]>;
}

const S = shots as unknown as Shots;

/** The screen the pictures were taken on, in points: the phone drawn around them is sized to it. */
export const SCREEN = { w: S.screen?.[0] ?? 402, h: S.screen?.[1] ?? 874 };

/** Every colour's stills and films, as the page's script reads them to swap pictures when a colour is picked. */
export const TAKEN: Partial<Record<Theme, Taken>> = S.themes ?? {};

export function hasStill(name: string, theme: Theme = "purple"): boolean {
  return !!TAKEN[theme]?.stills?.includes(name);
}

export function hasFilm(name: string, theme: Theme = "purple"): boolean {
  return TAKEN[theme]?.films?.[name] !== undefined;
}

export function stillUrl(name: string, theme: Theme = "purple"): string {
  return `/app/${theme}/${name}.webp`;
}

/** Both sizes of a still, for the browser to choose from. */
export function stillSet(name: string, theme: Theme = "purple"): string {
  return `/app/${theme}/${name}.webp 804w, /app/${theme}/${name}@3x.webp 1206w`;
}

export function filmUrl(name: string, theme: Theme = "purple"): string {
  return `/app/${theme}/${name}.mp4`;
}

export function frameOf(name: string): Frame | null {
  return S.frames?.[name] ?? null;
}

/** A cut picture's own size in points (an exchange is as tall as what was said and its card). */
export function sizeOf(name: string): { w: number; h: number } | null {
  const s = S.sizes?.[name];
  return s ? { w: s[0], h: s[1] } : null;
}
