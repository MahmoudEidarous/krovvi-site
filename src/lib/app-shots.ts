import shots from "../../public/app/shots.json";

/**
 * The app's own screens that krovvi.com shows: every phone on the page is a picture or a film of the real Krovvi app,
 * taken on the iOS simulator from the app's bench pages holding made-up chats (scripts/app-shots/capture.sh writes the
 * files and public/app/shots.json). Nothing here is drawn by the site.
 *
 * Files, per colour: /app/<theme>/<name>.webp (a still, or a film's first frame), <name>.mp4 (a film) and
 * <name>-end.webp (a film's last frame, sharper than the film's).
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
}

const S = shots as unknown as Shots;

/** The screen the pictures were taken on, in points: the phone drawn around them is sized to it. */
export const SCREEN = { w: S.screen?.[0] ?? 390, h: S.screen?.[1] ?? 844 };

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

export function filmUrl(name: string, theme: Theme = "purple"): string {
  return `/app/${theme}/${name}.mp4`;
}

export function frameOf(name: string): Frame | null {
  return S.frames?.[name] ?? null;
}
