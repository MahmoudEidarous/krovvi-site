/**
 * The team board (krovvi.com/team/<key>): who used Krovvi, when and how much,
 * for the founders, live. The page reads two database functions (catch8
 * supabase/migrations team_board), which answer only to a key on their list
 * and send names, counts and times, never anything anyone wrote or said.
 *
 * The board is asked again every few seconds while it is open. Each ask
 * carries the stamp of the board the page already has, so when nothing
 * changed the answer is a few bytes ({"same": true}) instead of the board.
 */

export const TEAM_API = process.env.NEXT_PUBLIC_TEAM_API ?? "https://eybepawprfhrvcnpggwk.supabase.co/rest/v1/rpc";

/** The project's publishable key: public by design (the app carries it too); the functions check the board's own key. */
const PUBLISHABLE = "sb_publishable_N__JVBTpkId9g_y1WF7dGA_dkvHmJy9";

/** Who someone is to the board. Test accounts never reach it. */
export type Tag = "outside" | "guest" | "team";

export interface Person {
  /** The first 8 characters of their account. */
  id: string;
  name: string | null;
  tag: Tag;
  /** apple, google, email or guest. */
  via: string;
  joined: number;
  /** The last thing they did themselves (ms), if any in the last 35 days. */
  last: number | null;
}

/** One person's day (a Cairo day). */
export interface DayRow {
  d: string;
  p: string;
  /** They did something themselves that day. */
  act: boolean;
  opens: number;
  msgs: number;
  failed: number;
  krovviFirst: number;
  notes: number;
  voice: number;
  voiceMs: number;
  games: number;
  cards: number;
  appChanges: number;
  krovviChanges: number;
  appsMade: number;
  shares: number;
  problems: number;
  pushes: number;
  /** Files and notes Krovvi made for them in the chat. */
  krovviMade: number;
}

export type SpeedGroup = "all" | "out" | "team";

export interface SpeedRow {
  d: string;
  g: SpeedGroup;
  msgs: number;
  answered: number;
  failed: number;
  stopped: number;
  /** Median and 90th percentile answer time in ms, when any answer was timed. */
  med: number | null;
  p90: number | null;
}

export type Kind = "msg" | "kfirst" | "note" | "kmade" | "card" | "app" | "kapp" | "share" | "land" | "join" | "open" | "buzz" | "fail";

/** What happened, never its words: x holds a few facts about it (see the migration). */
export interface Happening {
  at: number;
  p: string;
  k: Kind;
  x: Facts;
}

export interface Facts {
  /** msg: the answer's status, its ms, the game and that game's id, 1 in a shared chat. */
  s?: string;
  a?: number;
  g?: string;
  gi?: string;
  sh?: number;
  /** note: kind and a recording's ms. open: opens that day. */
  n?: string | number;
  ms?: number;
  /** open: the first open that day. fail: which problem. */
  f?: number | string;
  /** card: its kind and what they did. */
  c?: string;
  e?: string;
  /** app and kapp: the app's kind, 1 when it made one. */
  o?: string;
  new?: number;
  /** join: how they came in. buzz: the notification's kind. */
  via?: string;
  b?: string;
}

export interface Accounts {
  named: number;
  guests: number;
  team: number;
  namedBefore: number;
  guestsBefore: number;
}

export interface Board {
  stamp: string;
  at: number;
  today: string;
  from: string;
  people: Person[];
  days: DayRow[];
  speed: SpeedRow[];
  /** Things done by outside people and guests over 35 days, by Cairo hour. */
  hours: Array<{ h: number; n: number; p: number }>;
  /** Everything since yesterday 00:00 Cairo, newest first. */
  feed: Happening[];
  accounts: Accounts;
}

export interface PersonTotals {
  opens: number;
  msgs: number;
  failed: number;
  krovviFirst: number;
  notes: number;
  voice: number;
  voiceMs: number;
  games: number;
  cards: number;
  appChanges: number;
  krovviChanges: number;
  appsMade: number;
  shares: number;
  problems: number;
  pushes: number;
  krovviMade: number;
  /** Their typical answer time (ms), all time. */
  med: number | null;
}

export interface PersonDetail {
  id: string;
  /** The first thing they ever did themselves. */
  first: number | null;
  /** How many days they used Krovvi. */
  days: number;
  totals: PersonTotals;
  /** Their latest 2,000 things, newest first. */
  events: Array<{ at: number; k: Kind; x: Facts }>;
}

/* The functions send compact rows; these turn them into the shapes above. */

type RawBoard = {
  stamp: string;
  at: number;
  today: string;
  from: string;
  people: Array<{ id: string; n?: string; t: Tag; via: string; j: number; l?: number }>;
  days: Array<[string, string, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number]>;
  speed: Array<[string, SpeedGroup, number, number, number, number, number | null, number | null]>;
  hours: Array<[number, number, number]>;
  feed: Array<[number, string, Kind, Facts | null]>;
  accounts: { named: number; guests: number; team: number; named_before: number; guests_before: number };
};

export function readBoardRows(raw: RawBoard): Board {
  return {
    stamp: raw.stamp,
    at: raw.at,
    today: raw.today,
    from: raw.from,
    people: raw.people.map((p) => ({ id: p.id, name: p.n ?? null, tag: p.t, via: p.via, joined: p.j, last: p.l ?? null })),
    days: raw.days.map(([d, p, act, o, m, mf, kf, nt, nv, vms, g, c, ax, kx, an, s, f, b, km]) => ({
      d,
      p,
      act: act === 1,
      opens: o,
      msgs: m,
      failed: mf,
      krovviFirst: kf,
      notes: nt,
      voice: nv,
      voiceMs: vms,
      games: g,
      cards: c,
      appChanges: ax,
      krovviChanges: kx,
      appsMade: an,
      shares: s,
      problems: f,
      pushes: b,
      krovviMade: km ?? 0,
    })),
    speed: raw.speed.map(([d, g, n, ok, failed, stopped, med, p90]) => ({ d, g, msgs: n, answered: ok, failed, stopped, med, p90 })),
    hours: raw.hours.map(([h, n, p]) => ({ h, n, p })),
    feed: raw.feed.map(([at, p, k, x]) => ({ at, p, k, x: x ?? {} })),
    accounts: {
      named: raw.accounts.named,
      guests: raw.accounts.guests,
      team: raw.accounts.team,
      namedBefore: raw.accounts.named_before,
      guestsBefore: raw.accounts.guests_before,
    },
  };
}

type RawPerson = {
  id: string;
  first: number | null;
  days: number;
  totals: { o: number; m: number; mf: number; kf: number; nt: number; nv: number; vms: number; g: number; c: number; ax: number; kx: number; an: number; s: number; f: number; b: number; km?: number; med: number | null };
  events: Array<[number, Kind, Facts | null]>;
};

export function readPersonRows(raw: RawPerson): PersonDetail {
  const t = raw.totals;
  return {
    id: raw.id,
    first: raw.first,
    days: raw.days,
    totals: {
      opens: t.o,
      msgs: t.m,
      failed: t.mf,
      krovviFirst: t.kf,
      notes: t.nt,
      voice: t.nv,
      voiceMs: t.vms,
      games: t.g,
      cards: t.c,
      appChanges: t.ax,
      krovviChanges: t.kx,
      appsMade: t.an,
      shares: t.s,
      problems: t.f,
      pushes: t.b,
      krovviMade: t.km ?? 0,
      med: t.med ?? null,
    },
    events: raw.events.map(([at, k, x]) => ({ at, k, x: x ?? {} })),
  };
}

/** The board, the same board as before, a key that is not on (or no longer on) the list, or no answer at all. */
export type BoardAnswer = { kind: "board"; board: Board } | { kind: "same"; at: number } | { kind: "denied" } | { kind: "offline" };

export type PersonAnswer = { kind: "person"; person: PersonDetail } | { kind: "none" } | { kind: "denied" } | { kind: "offline" };

/** Where the board comes from: the database, or a snapshot while building (/team/dev). */
export interface BoardSource {
  board(seen: string | null): Promise<BoardAnswer>;
  person(id: string): Promise<PersonAnswer>;
}

async function call(fn: string, body: Record<string, string | null>): Promise<unknown> {
  const res = await fetch(`${TEAM_API}/${fn}`, {
    method: "POST",
    headers: { apikey: PUBLISHABLE, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) throw new Error(`${fn} ${res.status}`);
  return res.json();
}

export function liveSource(key: string): BoardSource {
  return {
    async board(seen) {
      try {
        const body = (await call("team_board", { p_key: key, p_seen: seen })) as (RawBoard & { denied?: boolean; same?: boolean }) | null;
        if (!body || body.denied) return { kind: "denied" };
        if (body.same) return { kind: "same", at: (body as unknown as { at: number }).at };
        return { kind: "board", board: readBoardRows(body) };
      } catch {
        return { kind: "offline" };
      }
    },
    async person(id) {
      try {
        const body = (await call("team_board_person", { p_key: key, p_id: id })) as (RawPerson & { denied?: boolean }) | null;
        if (!body) return { kind: "none" };
        if (body.denied) return { kind: "denied" };
        return { kind: "person", person: readPersonRows(body) };
      } catch {
        return { kind: "offline" };
      }
    },
  };
}

/** The snapshot the dev view reads: what the two functions answered, kept on the building machine only. */
export interface Snapshot {
  board: RawBoard;
  persons: Record<string, RawPerson>;
}

export function snapshotSource(snapshot: Snapshot): BoardSource {
  const board = readBoardRows(snapshot.board);
  return {
    async board(seen) {
      return seen === board.stamp ? { kind: "same", at: Date.now() } : { kind: "board", board };
    },
    async person(id) {
      const raw = snapshot.persons[id];
      return raw ? { kind: "person", person: readPersonRows(raw) } : { kind: "none" };
    },
  };
}

/** A link's key: what krovvi.com/team/<key> must look like before anything is asked. */
export function isBoardKey(key: string): boolean {
  return /^[A-Za-z0-9_-]{24,128}$/.test(key);
}
