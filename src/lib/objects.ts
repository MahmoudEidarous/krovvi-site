/**
 * A Krovvi object on its page (krovvi.com/o/<token>): what the objects edge
 * function sends (catch8 supabase/functions/_shared/objects/store.ts
 * PagePayload, kept in step by hand), and the four things the page asks it.
 *
 * The page has no account. The link's token opens the object; a seat (who
 * this person is in it, picked once) is a secret this browser keeps, and only
 * its hash is kept on the server. Everything is read in the browser, never on
 * the site's server, so a link preview never stands for a person opening it.
 */

export type Lang = "en" | "ar";
export type Role = "owner" | "member" | "viewer";
export interface Words {
  en: string;
  ar: string;
}

export interface PagePayload<V = unknown> {
  ok: true;
  kind: string;
  title: string;
  emoji: string | null;
  lang: Lang;
  state: "live" | "done" | "archived";
  version: number;
  view: V;
  members: Array<{ id: string; name: string; role: Role; you: boolean; krovvi: boolean; joined: boolean }>;
  you: string | null;
  seats: Array<{ id: string; name: string }>;
  ops: string[];
  activity: Array<{ at: number; name: string | null; line: Words; moment: string | null }>;
  role: Role;
  moments?: string[];
  momentWords: Record<string, Words>;
  /** How a moment that is not a win feels: no dots for one whose burst is false. */
  momentFeel?: Record<string, { burst?: boolean; haptic?: "moment" | "crack" }>;
  kindName: Words;
  kindEmoji: string;
}

export const OBJECTS_API = process.env.NEXT_PUBLIC_OBJECTS_API ?? "https://eybepawprfhrvcnpggwk.supabase.co/functions/v1/objects";

const SEAT_KEY = (token: string) => `krovvi.seat.${token}`;

/** This browser's seat in one object, or null (private windows and blocked storage just mean "not picked yet"). */
export function seatOf(token: string): string | null {
  try {
    return window.localStorage.getItem(SEAT_KEY(token));
  } catch {
    return null;
  }
}

function keepSeat(token: string, secret: string): void {
  try {
    window.localStorage.setItem(SEAT_KEY(token), secret);
  } catch {
    // Kept for this visit only.
  }
}

export function forgetSeat(token: string): void {
  try {
    window.localStorage.removeItem(SEAT_KEY(token));
  } catch {
    // Nothing kept.
  }
}

export type Read<V = unknown> = { ok: true; page: PagePayload<V> } | { ok: false; gone: boolean };

export async function readPage<V>(token: string, lang: Lang, seat?: string | null): Promise<Read<V>> {
  const params = new URLSearchParams({ t: token, lang });
  if (seat) params.set("s", seat);
  try {
    const res = await fetch(`${OBJECTS_API}?${params}`, { cache: "no-store" });
    if (res.status === 404 || res.status === 410) return { ok: false, gone: true };
    const body = (await res.json()) as PagePayload<V> | { ok: false };
    return body.ok ? { ok: true, page: body as PagePayload<V> } : { ok: false, gone: true };
  } catch {
    return { ok: false, gone: false };
  }
}

async function post<T>(body: Record<string, unknown>): Promise<{ status: number; data: T | null }> {
  try {
    const res = await fetch(OBJECTS_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return { status: res.status, data: (await res.json()) as T };
  } catch {
    return { status: 0, data: null };
  }
}

/** Take a seat: a member the owner named, or someone new by first name. The secret stays in this browser. */
export async function takeSeat<V>(token: string, lang: Lang, pick: { member?: string; name?: string }): Promise<{ ok: true; page: PagePayload<V> } | { ok: false; taken?: boolean; full?: boolean }> {
  const { data } = await post<{ ok: boolean; secret?: string; page?: PagePayload<V>; taken?: boolean; full?: boolean }>({ t: token, action: "seat", lang, ...pick });
  if (!data?.ok || !data.secret || !data.page) return { ok: false, taken: !!data?.taken, full: !!data?.full };
  keepSeat(token, data.secret);
  return { ok: true, page: data.page };
}

export type Acted<V = unknown> = { ok: true; page: PagePayload<V>; event: number | null } | { ok: false; seat?: boolean; gone?: boolean; problem?: string };

function cid(): string {
  return `w${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

/** One op as this seat. */
export async function act<V>(token: string, lang: Lang, op: string, args?: Record<string, unknown>): Promise<Acted<V>> {
  const seat = seatOf(token);
  if (!seat) return { ok: false, seat: true };
  const { status, data } = await post<{ ok: boolean; page?: PagePayload<V>; event?: number; problems?: string[]; seat?: boolean; gone?: boolean; problem?: string }>({
    t: token,
    action: "do",
    s: seat,
    lang,
    ops: [{ op, args: args ?? {} }],
    cid: cid(),
  });
  if (status === 401 || data?.seat) {
    forgetSeat(token);
    return { ok: false, seat: true };
  }
  if (!data?.page) return { ok: false, gone: !!data?.gone, problem: data?.problem ?? undefined };
  if (!data.ok) return { ok: false, problem: data.problems?.[0] ?? data.problem ?? undefined };
  return { ok: true, page: data.page, event: data.event ?? null };
}

export async function undo<V>(token: string, lang: Lang, event: number): Promise<Acted<V>> {
  const seat = seatOf(token);
  if (!seat) return { ok: false, seat: true };
  const { data } = await post<{ ok: boolean; page?: PagePayload<V>; problem?: string }>({ t: token, action: "undo", s: seat, lang, event });
  if (!data?.ok || !data.page) return { ok: false, problem: data?.problem ?? undefined };
  return { ok: true, page: data.page, event: null };
}

/** The page's own words: the browser's language, Arabic or English. */
export function browserLang(): Lang {
  try {
    return (navigator.language || "").toLowerCase().startsWith("ar") ? "ar" : "en";
  } catch {
    return "en";
  }
}

export const say = (w: Words, lang: Lang) => (lang === "ar" ? w.ar : w.en);

/** Whether a text is mostly Arabic letters, for its own direction. */
export function isArabicText(text: string): boolean {
  let ar = 0;
  let la = 0;
  for (const ch of text) {
    if (/[؀-ۿ]/.test(ch)) ar += 1;
    else if (/[A-Za-z]/.test(ch)) la += 1;
  }
  return ar > la;
}
