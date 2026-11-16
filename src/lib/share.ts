/**
 * A shared chat's page (krovvi.com/s/<token>): what the share edge function
 * sends (catch8 supabase/functions/share), read in the browser only, so a
 * link preview never stands for a person opening it.
 *
 * Read in parts (the owner, 16 November 2026: a long chat "should not take
 * forever to load"): the first part is the head and the turns of about a
 * screen or two (part=head), and the rest follows a part at a time
 * (from=), each small enough that a dropped connection costs one part and
 * asks again. A door from before parts sends the whole chat to part=head,
 * with no `more`, and the page draws it the same.
 */

import type { ChatSnapshot, SnapTurn } from "@/components/share/chat-view";

export const SHARE_API = process.env.NEXT_PUBLIC_SHARE_API ?? "https://eybepawprfhrvcnpggwk.supabase.co/functions/v1/share";

export type MediaLink = { id: number; url: string; mime: string };

/** Where the next part starts, and how many turns the copy holds. */
export type More = { from: number; total: number } | null;

export interface ShareRead {
  ok: true;
  id: string;
  kind: "chat" | "note";
  title: string;
  lang: "en" | "ar" | null;
  dir: "ltr" | "rtl";
  name: string | null;
  made_at: number;
  version: number;
  snapshot: ChatSnapshot;
  media: MediaLink[];
  more?: More;
}

/** Read, turned off (410), not a link (404), or not reached at all (no network, or the door answered with a fault): only the last is worth trying again. */
export type ShareState = { ok: true; share: ShareRead } | { ok: false; off: boolean; offline?: boolean };

/** A part after the first, or why not: the copy was updated meanwhile (start again), turned off, gone, or not reached. */
export type PartState = { ok: true; turns: SnapTurn[]; media: MediaLink[]; more: More } | { ok: false; changed?: boolean; off?: boolean; gone?: boolean; offline?: boolean };

/** How long one read may take before it is given up and asked again: a part is small, so this is a dead connection, not a slow one. */
const READ_TIMEOUT_MS = 15_000;
/** The waits before each try again, when the door was not reached or hit a fault of its own. */
const BACKOFF_MS = [700, 2_000, 4_500];

type Got = { status: number; body: Record<string, unknown> | null };

/** One GET of the door, tried again on no answer or a 5xx (never on a 4xx, which is the door's answer). */
async function get(query: string): Promise<Got> {
  let last: Got = { status: 0, body: null };
  for (let attempt = 0; attempt <= BACKOFF_MS.length; attempt += 1) {
    if (attempt) await new Promise((r) => setTimeout(r, BACKOFF_MS[attempt - 1]));
    try {
      const res = await fetch(`${SHARE_API}?${query}`, { cache: "no-store", signal: AbortSignal.timeout(READ_TIMEOUT_MS) });
      if (res.status < 500) {
        let body: Record<string, unknown> | null = null;
        try {
          body = (await res.json()) as Record<string, unknown>;
        } catch {
          // A body that did not arrive whole: said as not reached, and asked again.
          last = { status: 0, body: null };
          continue;
        }
        return { status: res.status, body };
      }
      last = { status: res.status, body: null };
    } catch {
      last = { status: 0, body: null };
    }
  }
  return last;
}

export async function readShare(token: string): Promise<ShareState> {
  const { status, body } = await get(`t=${encodeURIComponent(token)}&part=head`);
  if (status === 410) return { ok: false, off: true };
  if (status === 0 || status >= 500 || !body) return { ok: false, off: false, offline: true };
  return body.ok ? { ok: true, share: body as unknown as ShareRead } : { ok: false, off: !!body.off };
}

/** The part of the copy that starts at `from`, of the version the page holds. */
export async function readPart(token: string, from: number, version: number): Promise<PartState> {
  const { status, body } = await get(`t=${encodeURIComponent(token)}&from=${from}&v=${version}`);
  if (status === 410) return { ok: false, off: true };
  if (status === 409 && body?.changed) return { ok: false, changed: true };
  if (status === 404) return { ok: false, gone: true };
  if (status === 0 || status >= 500 || !body?.ok) return { ok: false, offline: true };
  return { ok: true, turns: (body.turns ?? []) as SnapTurn[], media: (body.media ?? []) as MediaLink[], more: (body.more ?? null) as More };
}

const VISITOR = "krovvi.visitor";

/** This browser's own name for itself, so one person opening twice is one open. */
function visitor(): string {
  try {
    const known = window.localStorage.getItem(VISITOR);
    if (known) return known;
    const made = `v${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    window.localStorage.setItem(VISITOR, made);
    return made;
  } catch {
    return "anon";
  }
}

export function sayOpened(token: string): void {
  void fetch(SHARE_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ t: token, action: "opened", visitor: visitor() }) }).catch(() => {});
}

export async function report(token: string, why: string): Promise<boolean> {
  try {
    const res = await fetch(SHARE_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ t: token, action: "report", why }) });
    return res.ok;
  } catch {
    return false;
  }
}
