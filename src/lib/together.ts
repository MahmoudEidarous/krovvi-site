/**
 * Krovvi Together on the site (the owner, 1 November 2026: "build the best multiplayer experience ... so people can
 * share the app through word of mouth easily"): krovvi.com/e/<token> is a post someone sent (an episode, two Krovvis
 * talking, a plan, a character) and krovvi.com/k/<code> is an invite for two people's Krovvis to be friends.
 *
 * The shapes and the calls are the site part of catch8's one contract (server/src/together/contract.ts, "The site,
 * for anyone with a link"), copied here by hand: change them only when that file changes. The edge function
 * `together` needs no sign-in; the link's token is the key. Nothing with an account id, a handle, a thread or a turn
 * ever reaches this page: names, characters and the post itself.
 *
 * The edge function's address is set the way the share page sets its own (NEXT_PUBLIC_TOGETHER_API, else the live
 * project). The browser keeps a random visitor id (the server keeps only its salted hash) and the first name the
 * visitor gave once, both in localStorage behind try/catch, so a private window still works for the page's life.
 *
 * Self-contained on purpose (no "@/" imports): src/lib/together.test.mjs imports it straight into Node.
 */

export type Lang = "en" | "ar";

export const POST_KINDS = ["character", "episode", "talk", "plan"] as const;
export type PostKind = (typeof POST_KINDS)[number];

/** Drawn in the site's own line style (components/together/reaction-icons.tsx), never as emoji. */
export const REACTIONS = ["haha", "love", "wow", "dead"] as const;
export type Reaction = (typeof REACTIONS)[number];

export type PlanState = "in" | "maybe" | "cant";
export const PLAN_STATES: readonly PlanState[] = ["in", "maybe", "cant"];

export interface Picture {
  url: string;
  w: number;
  h: number;
}

export interface WebCharacter {
  name: string;
  lore: string;
  image: Picture | null;
}

export interface Panel {
  scene: string;
  lines: { who: string; says: string }[];
}

export interface PlanOption {
  id: string;
  label: string;
  /** Their local moment, "2026-11-05T20:00", when the option is a time. */
  at?: string;
  place?: string;
}

export interface WebPostView {
  token: string;
  kind: PostKind;
  title: string;
  cover: Picture | null;
  authorName: string;
  cast: { name: string; character: WebCharacter | null }[];
  episode?: { panels: Panel[]; cliffhanger: string; showTitle: string; episodeNo: number };
  talk?: { topic: string; a: string; b: string; lines: { side: "a" | "b"; text: string }[]; done: boolean };
  plan?: { what: string; options: PlanOption[]; answers: { name: string; state: PlanState; picks: string[] }[]; settled: string | null };
  character?: { name: string; lore: string };
  counts: { reactions: number; comments: number };
  reactions: { name: string; kind: Reaction }[];
  comments: { name: string; text: string; at: number }[];
  /** The visitor's own reaction and plan answer, when they sent their visitor id. */
  mine: { reaction: Reaction | null; answer: { state: PlanState; picks: string[] } | null };
  lang: Lang;
}

export interface WebInviteView {
  code: string;
  name: string;
  character: WebCharacter | null;
  valid: boolean;
}

/* ── The edge function ─────────────────────────────────────────────────── */

export const TOGETHER_API = (process.env.NEXT_PUBLIC_TOGETHER_API ?? "https://eybepawprfhrvcnpggwk.supabase.co/functions/v1/together").trim().replace(/\/+$/, "");

/** A share token or a visitor id: long, random, URL-safe (the contract's TOKEN_RE). */
export const TOKEN_RE = /^[A-Za-z0-9_-]{20,40}$/;
export const INVITE_RE = /^[A-Za-z0-9]{8,16}$/;

/** The contract's LIMITS the page enforces before it sends. */
export const LIMITS = { webNameMax: 30, commentMax: 500 } as const;

/**
 * The pictures for a link preview: stable addresses the edge function answers with a JPEG (at most 300 KB, at least
 * 600 px wide, so WhatsApp draws it) and caches for a day, never the signed URLs inside a read, which run out.
 */
export const coverUrl = (token: string): string => `${TOGETHER_API}?cover=${encodeURIComponent(token)}`;
export const inviteCoverUrl = (code: string): string => `${TOGETHER_API}?invite_cover=${encodeURIComponent(code)}`;

/** The app's own ways in (krovvi://), for someone who already has Krovvi on this phone. */
export const appPostUrl = (token: string): string => `krovvi://together/post?token=${encodeURIComponent(token)}`;
export const appJoinUrl = (code: string): string => `krovvi://together/join?code=${encodeURIComponent(code)}`;

/** Read, off (removed, turned off or never a link), or not reached at all: only the last is worth trying again. */
export type PostRead = { ok: true; post: WebPostView } | { ok: false; off: true } | { ok: false; offline: true };
export type InviteRead = { ok: true; invite: WebInviteView } | { ok: false; off: true } | { ok: false; offline: true };

const str = (x: unknown, max = 2000): string => (typeof x === "string" ? x.slice(0, max) : "");
const num = (x: unknown): number => (typeof x === "number" && Number.isFinite(x) ? x : 0);
const list = (x: unknown): unknown[] => (Array.isArray(x) ? x : []);
const isReaction = (x: unknown): x is Reaction => typeof x === "string" && (REACTIONS as readonly string[]).includes(x);
const isState = (x: unknown): x is PlanState => x === "in" || x === "maybe" || x === "cant";

function picture(x: unknown): Picture | null {
  const p = x as Partial<Picture> | null;
  return p && typeof p.url === "string" && /^(https?:|data:image\/)/.test(p.url) ? { url: p.url, w: num(p.w) || 1024, h: num(p.h) || 1024 } : null;
}

function character(x: unknown): WebCharacter | null {
  const c = x as Partial<WebCharacter> | null;
  return c && typeof c.name === "string" && c.name.trim() ? { name: c.name.trim(), lore: str(c.lore, 400).trim(), image: picture(c.image) } : null;
}

/**
 * The post as the page draws it, or null when what came is not one. Every list is a list and every name a string, so
 * a field the server leaves out (or a newer server adds) never breaks the page.
 */
export function normalizePost(raw: unknown, token: string): WebPostView | null {
  const p = raw as Record<string, unknown> | null;
  if (!p || typeof p !== "object" || !(POST_KINDS as readonly string[]).includes(p.kind as string)) return null;
  const kind = p.kind as PostKind;
  const counts = (p.counts ?? {}) as Record<string, unknown>;
  const mine = (p.mine ?? {}) as Record<string, unknown>;
  const answer = mine.answer as { state?: unknown; picks?: unknown } | null | undefined;
  const ep = p.episode as Record<string, unknown> | undefined;
  const talk = p.talk as Record<string, unknown> | undefined;
  const plan = p.plan as Record<string, unknown> | undefined;
  const ch = p.character as Record<string, unknown> | undefined;
  const post: WebPostView = {
    token: str(p.token) || token,
    kind,
    title: str(p.title, 200).trim(),
    cover: picture(p.cover),
    authorName: str(p.authorName, 60).trim(),
    cast: list(p.cast)
      .map((m) => m as { name?: unknown; character?: unknown })
      .filter((m) => typeof m.name === "string" && m.name.trim())
      .map((m) => ({ name: (m.name as string).trim().slice(0, 40), character: character(m.character) })),
    counts: { reactions: num(counts.reactions), comments: num(counts.comments) },
    reactions: list(p.reactions)
      .map((r) => r as { name?: unknown; kind?: unknown })
      .filter((r) => typeof r.name === "string" && isReaction(r.kind))
      .map((r) => ({ name: (r.name as string).slice(0, 40), kind: r.kind as Reaction })),
    comments: list(p.comments)
      .map((c) => c as { name?: unknown; text?: unknown; at?: unknown })
      .filter((c) => typeof c.name === "string" && typeof c.text === "string" && (c.text as string).trim())
      .map((c) => ({ name: (c.name as string).slice(0, 40), text: (c.text as string).slice(0, LIMITS.commentMax), at: num(c.at) })),
    mine: {
      reaction: isReaction(mine.reaction) ? mine.reaction : null,
      answer: answer && isState(answer.state) ? { state: answer.state, picks: list(answer.picks).filter((x): x is string => typeof x === "string") } : null,
    },
    lang: p.lang === "ar" ? "ar" : "en",
  };
  if (ep) {
    post.episode = {
      panels: list(ep.panels).map((x) => {
        const panel = x as { scene?: unknown; lines?: unknown };
        return {
          scene: str(panel.scene, 600),
          lines: list(panel.lines)
            .map((l) => l as { who?: unknown; says?: unknown })
            .filter((l) => typeof l.says === "string" && (l.says as string).trim())
            .map((l) => ({ who: str(l.who, 60), says: str(l.says, 400) })),
        };
      }),
      cliffhanger: str(ep.cliffhanger, 400).trim(),
      showTitle: str(ep.showTitle, 120).trim(),
      episodeNo: Math.max(1, Math.round(num(ep.episodeNo)) || 1),
    };
  }
  if (talk) {
    post.talk = {
      topic: str(talk.topic, 300).trim(),
      a: str(talk.a, 60).trim(),
      b: str(talk.b, 60).trim(),
      lines: list(talk.lines)
        .map((l) => l as { side?: unknown; text?: unknown })
        .filter((l) => (l.side === "a" || l.side === "b") && typeof l.text === "string" && (l.text as string).trim())
        .map((l) => ({ side: l.side as "a" | "b", text: str(l.text, 400) })),
      done: talk.done === true,
    };
  }
  if (plan) {
    const options = list(plan.options)
      .map((o) => o as Partial<PlanOption>)
      .filter((o) => typeof o.id === "string" && typeof o.label === "string")
      .map((o) => ({ id: o.id as string, label: (o.label as string).slice(0, 120), ...(typeof o.at === "string" ? { at: o.at } : {}), ...(typeof o.place === "string" && o.place.trim() ? { place: o.place.slice(0, 120) } : {}) }));
    post.plan = {
      what: str(plan.what, 300).trim(),
      options,
      answers: list(plan.answers)
        .map((a) => a as { name?: unknown; state?: unknown; picks?: unknown })
        .filter((a) => typeof a.name === "string" && isState(a.state))
        .map((a) => ({ name: (a.name as string).slice(0, 40), state: a.state as PlanState, picks: list(a.picks).filter((x): x is string => typeof x === "string") })),
      settled: typeof plan.settled === "string" && options.some((o) => o.id === plan.settled) ? (plan.settled as string) : null,
    };
  }
  if (ch && typeof ch.name === "string") post.character = { name: ch.name.trim(), lore: str(ch.lore, 400).trim() };
  return post;
}

/** The inviter as a page names them: their name, or a friend when they have not given one yet. */
export function inviterName(name: string, lang: Lang, start = true): string {
  if (name.trim()) return name.trim();
  if (lang === "ar") return "صاحبك";
  return start ? "A friend" : "your friend";
}

export function normalizeInvite(raw: unknown, code: string): WebInviteView | null {
  const i = raw as Record<string, unknown> | null;
  // An inviter with no name yet still invites: the page says "a friend" (review, 2 November 2026: it said the link was off).
  if (!i || typeof i !== "object") return null;
  return { code: str(i.code) || code, name: typeof i.name === "string" ? i.name.trim().slice(0, 40) : "", character: character(i.character), valid: i.valid !== false };
}

/**
 * The post, as anyone with the link sees it. The visitor id, when the browser has one, fills `mine` (their reaction
 * and plan answer). A read never counts as an open: only sayOpened does, once the page has really been seen.
 */
export async function readPost(token: string, opts: { visitor?: string | null; init?: RequestInit } = {}): Promise<PostRead> {
  if (!TOKEN_RE.test(token)) return { ok: false, off: true };
  const params = new URLSearchParams({ post: token });
  if (opts.visitor && TOKEN_RE.test(opts.visitor)) params.set("visitor", opts.visitor);
  try {
    // A browser's read gives up after eight seconds and says it is offline, rather than waiting for ever.
    const res = await fetch(`${TOGETHER_API}?${params}`, { cache: "no-store", ...opts.init, signal: opts.init?.signal ?? AbortSignal.timeout(8000) });
    if (res.status === 404 || res.status === 410) return { ok: false, off: true };
    if (!res.ok) return { ok: false, offline: true };
    const body = (await res.json()) as { ok?: boolean; post?: unknown };
    const post = body.ok === true ? normalizePost(body.post, token) : null;
    return post ? { ok: true, post } : { ok: false, off: true };
  } catch {
    return { ok: false, offline: true };
  }
}

export async function readInvite(code: string, init: RequestInit = {}): Promise<InviteRead> {
  if (!INVITE_RE.test(code)) return { ok: false, off: true };
  try {
    const res = await fetch(`${TOGETHER_API}?invite=${encodeURIComponent(code)}`, { cache: "no-store", ...init, signal: init.signal ?? AbortSignal.timeout(8000) });
    if (res.status === 404 || res.status === 410) return { ok: false, off: true };
    if (!res.ok) return { ok: false, offline: true };
    const body = (await res.json()) as { ok?: boolean; invite?: unknown };
    const invite = body.ok === true ? normalizeInvite(body.invite, code) : null;
    return invite ? { ok: true, invite } : { ok: false, off: true };
  } catch {
    return { ok: false, offline: true };
  }
}

/**
 * What the edge function said to a write: the post as it now stands, or why not. A refusal carries the function's
 * reason (its `why`), so the page answers in its own words: the name, the comment's words, a plan already settled or
 * full; anything else is "failed".
 */
export type WroteWhy = "off" | "busy" | "failed" | "name" | "text" | "settled" | "full";
export type Wrote = { ok: true; post: WebPostView } | { ok: false; why: WroteWhy };

const REASONS: Partial<Record<string, WroteWhy>> = { name: "name", text: "text", settled: "settled", full: "full" };

async function write(token: string, body: Record<string, unknown>): Promise<Wrote> {
  try {
    const res = await fetch(TOGETHER_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, ...body }), cache: "no-store" });
    if (res.status === 429) return { ok: false, why: "busy" };
    if (res.status === 404 || res.status === 410) return { ok: false, why: "off" };
    if (res.status === 400 || res.status === 409) {
      const said = (await res.json().catch(() => null)) as { why?: unknown } | null;
      return { ok: false, why: (typeof said?.why === "string" && REASONS[said.why]) || "failed" };
    }
    if (!res.ok) return { ok: false, why: "failed" };
    const data = (await res.json()) as { ok?: boolean; post?: unknown };
    const post = data.ok === true ? normalizePost(data.post, token) : null;
    return post ? { ok: true, post } : { ok: false, why: "failed" };
  } catch {
    return { ok: false, why: "failed" };
  }
}

/** Who is writing: this browser's visitor id and the first name they gave. */
export interface Who {
  visitor: string;
  name: string;
}

/** A reaction, or null to take theirs back. */
export const sendReaction = (token: string, kind: Reaction | null, who: Who): Promise<Wrote> => write(token, { do: "react", kind, visitor: who.visitor, name: who.name });
export const sendComment = (token: string, text: string, who: Who): Promise<Wrote> => write(token, { do: "comment", text, visitor: who.visitor, name: who.name });
export const sendAnswer = (token: string, state: PlanState, picks: string[], who: Who): Promise<Wrote> => write(token, { do: "answer", state, picks, visitor: who.visitor, name: who.name });

/** One open of the link, said once the page has been in view for a few seconds. */
export function sayOpened(token: string, visitor: string): void {
  void fetch(TOGETHER_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ do: "opened", token, visitor }), keepalive: true }).catch(() => {});
}

export async function sendReport(token: string, reason: string, visitor: string): Promise<boolean> {
  try {
    const res = await fetch(TOGETHER_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ do: "report", token, reason, visitor }) });
    return res.ok;
  } catch {
    return false;
  }
}

/* ── The page's own copy, before the server's comes back ───────────────── */

/**
 * The post with this visitor's reaction set (or taken back, for null): drawn at once on a tap, and replaced by the
 * server's post when it answers, or put back as it was if the write did not go through.
 */
export function withReaction(post: WebPostView, kind: Reaction | null, name: string): WebPostView {
  const before = post.mine.reaction;
  let reactions = post.reactions;
  if (before) {
    const at = reactions.findIndex((r) => r.name === name && r.kind === before);
    if (at >= 0) reactions = [...reactions.slice(0, at), ...reactions.slice(at + 1)];
  }
  if (kind) reactions = [{ name, kind }, ...reactions];
  const delta = (kind ? 1 : 0) - (before ? 1 : 0);
  return { ...post, reactions, counts: { ...post.counts, reactions: Math.max(0, post.counts.reactions + delta) }, mine: { ...post.mine, reaction: kind } };
}

export function withComment(post: WebPostView, name: string, text: string, at: number): WebPostView {
  return { ...post, comments: [...post.comments, { name, text, at }], counts: { ...post.counts, comments: post.counts.comments + 1 } };
}

/** The plan with this visitor's answer in it, in place of the one they gave before. */
export function withAnswer(post: WebPostView, name: string, state: PlanState, picks: string[]): WebPostView {
  if (!post.plan) return post;
  const before = post.mine.answer;
  let answers = post.plan.answers;
  if (before) {
    const at = answers.findIndex((a) => a.name === name && a.state === before.state);
    if (at >= 0) answers = [...answers.slice(0, at), ...answers.slice(at + 1)];
  }
  const kept = state === "cant" ? [] : picks.filter((id) => post.plan!.options.some((o) => o.id === id));
  return { ...post, plan: { ...post.plan, answers: [...answers, { name, state, picks: kept }] }, mine: { ...post.mine, answer: { state, picks: kept } } };
}

/* ── What this browser keeps, for this browser only ─────────────────────── */

const VISITOR = "krovvi.together.visitor";
const NAME = "krovvi.together.name";
/** The name a friend gave on krovvi.com/a/ (lib/friend-ask.ts): offered in the field, never sent without a tap. */
const SITE_NAME = "krovvi.name";
const seenKey = (token: string) => `krovvi.together.seen.${token}`;

/** A random id, 24 URL-safe letters and digits (it fits the contract's TOKEN_RE). */
export function madeId(): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

let fallbackVisitor: string | null = null;

/** This browser's visitor id, made on first use. A private window that cannot keep it gets one for the page's life. */
export function visitorId(): string {
  try {
    const known = window.localStorage.getItem(VISITOR);
    if (known && TOKEN_RE.test(known)) return known;
    const fresh = madeId();
    window.localStorage.setItem(VISITOR, fresh);
    return fresh;
  } catch {
    fallbackVisitor ??= madeId();
    return fallbackVisitor;
  }
}

/** The first name as it is sent: one space between words, trimmed, at most 30 characters. Empty when there is none. */
/**
 * A first name as the edge function keeps it, or "" for one it would refuse (a link, an address, an @), so the sheet
 * never keeps a name every write would fail on (review, 2 November 2026).
 */
export function cleanName(raw: string): string {
  const one = raw.replace(/\s+/g, " ").trim();
  if (/https?:|www\.|@|\.com\b/i.test(one)) return "";
  return one.slice(0, LIMITS.webNameMax).trim();
}

let fallbackName = "";

/** The first name this browser gave, or "" when it never has. */
export function keptName(): string {
  try {
    return cleanName(window.localStorage.getItem(NAME) ?? "") || fallbackName;
  } catch {
    return fallbackName;
  }
}

/** A name to offer in the field when none is kept yet: the one given on a friend's question, if any. */
export function offeredName(): string {
  try {
    return cleanName(window.localStorage.getItem(SITE_NAME) ?? "");
  } catch {
    return "";
  }
}

export function keepName(name: string): void {
  fallbackName = name;
  try {
    window.localStorage.setItem(NAME, name);
  } catch {
    // Kept for this visit only.
  }
}

/** Whether this browser has watched this talk play through once (it then shows whole). */
export function seenBefore(token: string): boolean {
  try {
    return window.localStorage.getItem(seenKey(token)) === "1";
  } catch {
    return false;
  }
}

export function markSeen(token: string): void {
  try {
    window.localStorage.setItem(seenKey(token), "1");
  } catch {
    // It plays again next time; nothing else changes.
  }
}

/* ── Small words the pages share ───────────────────────────────────────── */

/** "Sara", "Sara and Omar", "Sara, Omar and Lina" in the page's language (the contract's crewWords). */
export function namesWords(names: readonly string[], lang: Lang): string {
  const clean = names.map((n) => n.trim()).filter(Boolean);
  if (clean.length <= 1) return clean[0] ?? "";
  const and = lang === "ar" ? " و" : " and ";
  return `${clean.slice(0, -1).join(lang === "ar" ? "، " : ", ")}${and}${clean[clean.length - 1]}`;
}

/** "Thu 5 Nov, 8:00 PM" from a plan option's local moment, with the digits the rest of the site uses. Empty when it is not one. */
export function momentWords(at: string | undefined, lang: Lang): string {
  const m = at ? /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(at) : null;
  if (!m) return "";
  const [y, mo, d, h, mi] = [Number(m[1]), Number(m[2]), Number(m[3]), m[4] === undefined ? null : Number(m[4]), m[5] === undefined ? 0 : Number(m[5])];
  const when = new Date(y, mo - 1, d, h ?? 12, mi);
  if (Number.isNaN(when.getTime())) return "";
  const locale = lang === "ar" ? "ar-EG-u-nu-latn" : "en-GB";
  const day = new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short" }).format(when);
  if (h === null) return day;
  const time = new Intl.DateTimeFormat(lang === "ar" ? "ar-EG-u-nu-latn" : "en-US", { hour: "numeric", minute: "2-digit" }).format(when);
  return `${day}${lang === "ar" ? "، " : ", "}${time}`;
}

/** "now", "5m", "3h", "2d": how long ago, short. Empty before the browser's clock is known. */
export function agoWords(at: number, now: number, lang: Lang): string {
  if (!now || !at) return "";
  const m = Math.max(0, Math.round((now - at) / 60000));
  if (m < 1) return lang === "ar" ? "دلوقتي" : "now";
  if (m < 60) return lang === "ar" ? `${m} د` : `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return lang === "ar" ? `${h} س` : `${h}h`;
  const d = Math.round(h / 24);
  return lang === "ar" ? `${d} يوم` : `${d}d`;
}
