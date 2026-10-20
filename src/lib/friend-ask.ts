/**
 * A question someone's Krovvi made for their friends (krovvi.com/a/<token>; catch8 src/lib/agent/friend-ask.ts says
 * what the feature is). The page reads the question and sends a friend's answer straight to Krovvi's door
 * (catch8 server/src/door/friend-ask.ts), from the browser, so a link preview never stands for a friend answering.
 * The token is the only key: no account, no sign-up, and nothing of the asker's but their first name and the
 * question ever reaches this page.
 *
 * The door's address is the one the phone uses (EXPO_PUBLIC_DOOR_URL in the app); NEXT_PUBLIC_DOOR_URL sets it here.
 */

export const DOOR = (process.env.NEXT_PUBLIC_DOOR_URL ?? "https://kr-58cc7a7744a64d8ba9846c6398639fff.ecs.eu-central-1.on.aws").trim().replace(/\/+$/, "");

/** A link's token, as the database makes it. */
export const TOKEN = /^[A-Za-z0-9_-]{20,40}$/;

export interface FriendAskRead {
  ok: true;
  asker: string | null;
  question: string;
  options: string[];
  lang: "en" | "ar";
  closed: boolean;
}

/** Read, not a link (404), or not reached at all: only the last is worth trying again. */
export type FriendAskState = { ok: true; ask: FriendAskRead } | { ok: false; gone: true } | { ok: false; offline: true };

export async function readAsk(token: string, init: RequestInit = {}): Promise<FriendAskState> {
  if (!TOKEN.test(token)) return { ok: false, gone: true };
  try {
    const res = await fetch(`${DOOR}/v1/friend-ask/${encodeURIComponent(token)}`, { cache: "no-store", ...init });
    if (res.status === 404) return { ok: false, gone: true };
    if (!res.ok) return { ok: false, offline: true };
    const body = (await res.json()) as Partial<FriendAskRead>;
    if (body.ok !== true || typeof body.question !== "string" || !Array.isArray(body.options)) return { ok: false, gone: true };
    return {
      ok: true,
      ask: {
        ok: true,
        asker: typeof body.asker === "string" && body.asker.trim() ? body.asker.trim() : null,
        question: body.question,
        options: body.options.filter((o): o is string => typeof o === "string"),
        lang: body.lang === "ar" ? "ar" : "en",
        closed: body.closed === true,
      },
    };
  } catch {
    return { ok: false, offline: true };
  }
}

/** What the door said to an answer. */
export type Sent = "sent" | "name" | "closed" | "gone" | "busy" | "failed";

export async function sendAnswer(token: string, answer: { name: string; option: number; device: string }): Promise<Sent> {
  try {
    const res = await fetch(`${DOOR}/v1/friend-ask/${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(answer),
      cache: "no-store",
    });
    if (res.ok) return "sent";
    if (res.status === 429) return "busy";
    if (res.status === 404) return "gone";
    const body = (await res.json().catch(() => ({}))) as { closed?: boolean; full?: boolean; problem?: string };
    if (res.status === 409) return body.closed ? "closed" : "failed";
    if (res.status === 400 && body.problem === "name") return "name";
    return "failed";
  } catch {
    return "failed";
  }
}

/* ── What this browser keeps, for this browser only ─────────────────────── */

const DEVICE = "krovvi.device";
const NAME = "krovvi.name";
const answerKey = (token: string) => `krovvi.a.${token}`;

/** A random id, 24 letters and digits. */
function made(): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

let fallback: string | null = null;

/**
 * This browser's own id for the door, so answering again changes the answer instead of adding one. Kept in the
 * browser; a private window that cannot keep it gets one for the page's life.
 */
export function deviceId(): string {
  try {
    const known = window.localStorage.getItem(DEVICE);
    if (known && /^[A-Za-z0-9_-]{8,64}$/.test(known)) return known;
    const fresh = made();
    window.localStorage.setItem(DEVICE, fresh);
    return fresh;
  } catch {
    fallback ??= made();
    return fallback;
  }
}

/** The name this browser answered with last time, to fill the field again. */
export function lastName(): string {
  try {
    return (window.localStorage.getItem(NAME) ?? "").slice(0, 30);
  } catch {
    return "";
  }
}

/** What this browser answered on this question, to show it and let it be changed. */
export function keptAnswer(token: string): { name: string; option: number } | null {
  try {
    const raw = JSON.parse(window.localStorage.getItem(answerKey(token)) ?? "null") as { name?: unknown; option?: unknown } | null;
    return raw && typeof raw.name === "string" && typeof raw.option === "number" ? { name: raw.name, option: raw.option } : null;
  } catch {
    return null;
  }
}

export function keepAnswer(token: string, answer: { name: string; option: number }): void {
  try {
    window.localStorage.setItem(answerKey(token), JSON.stringify(answer));
    window.localStorage.setItem(NAME, answer.name);
  } catch {
    // The answer is sent all the same; only this browser's memory of it is lost.
  }
}

/** The name as it is sent: one space between words, trimmed, at most 30 characters. Empty when there is none. */
export function cleanName(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, 30);
}
