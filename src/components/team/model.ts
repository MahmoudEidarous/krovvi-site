/**
 * What the board's tabs show, worked out from what the database sent: totals
 * for a stretch of days, one line per person, the days in a row for the
 * charts, who is in Krovvi right now, and the feed folded into lines a person
 * can read (six messages in a row are one line, not six).
 */

import type { Board, DayRow, Facts, Happening, Kind, Person, SpeedGroup, SpeedRow } from "@/lib/team";
import { addDays, byKrovvi, byThem, dayOf, daysBetween, hourOf } from "./words";

export type Range = "today" | "yesterday" | "7d" | "30d";

export const RANGES: Array<{ id: Range; label: string }> = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
];

export function rangeSpan(range: Range, today: string): { from: string; to: string } {
  switch (range) {
    case "today":
      return { from: today, to: today };
    case "yesterday":
      return { from: addDays(today, -1), to: addDays(today, -1) };
    case "7d":
      return { from: addDays(today, -6), to: today };
    case "30d":
      return { from: addDays(today, -29), to: today };
  }
}

/** One thing's key in the feed: the same while it stays the same thing (an open moves on when they open again). */
export function feedKey(h: Pick<Happening, "at" | "p" | "k">): string {
  return `${h.at}-${h.p}-${h.k}`;
}

export function peopleById(board: Board): Map<string, Person> {
  return new Map(board.people.map((p) => [p.id, p]));
}

/** A person's numbers added up over some days. */
export interface Rollup {
  p: string;
  /** Days they did something themselves. */
  days: number;
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
}

function emptyRollup(p: string): Rollup {
  return { p, days: 0, opens: 0, msgs: 0, failed: 0, krovviFirst: 0, notes: 0, voice: 0, voiceMs: 0, games: 0, cards: 0, appChanges: 0, krovviChanges: 0, appsMade: 0, shares: 0, problems: 0, pushes: 0, krovviMade: 0 };
}

function add(r: Rollup, d: DayRow): void {
  if (d.act) r.days += 1;
  r.opens += d.opens;
  r.msgs += d.msgs;
  r.failed += d.failed;
  r.krovviFirst += d.krovviFirst;
  r.notes += d.notes;
  r.voice += d.voice;
  r.voiceMs += d.voiceMs;
  r.games += d.games;
  r.cards += d.cards;
  r.appChanges += d.appChanges;
  r.krovviChanges += d.krovviChanges;
  r.appsMade += d.appsMade;
  r.shares += d.shares;
  r.problems += d.problems;
  r.pushes += d.pushes;
  r.krovviMade += d.krovviMade;
}

/** Every person's numbers between two days (both included). */
export function rollups(board: Board, from: string, to: string): Map<string, Rollup> {
  const out = new Map<string, Rollup>();
  for (const d of board.days) {
    if (d.d < from || d.d > to) continue;
    let r = out.get(d.p);
    if (!r) out.set(d.p, (r = emptyRollup(d.p)));
    add(r, d);
  }
  return out;
}

/** The things they did themselves, the measure people are ranked by. */
export function things(r: Rollup): number {
  return r.msgs + r.notes + r.cards + r.appChanges + r.shares;
}

export function isOutside(p: Person | undefined): boolean {
  return !!p && p.tag !== "team";
}

/** One day for the charts: who used Krovvi, what they did, who joined. */
export interface DayPoint {
  d: string;
  outside: number;
  guests: number;
  team: number;
  msgsOut: number;
  msgsTeam: number;
  joinedNamed: number;
  joinedGuests: number;
  notes: number;
  voiceMs: number;
  games: number;
  cards: number;
  appChanges: number;
  /** Who used it that day, outside people first. */
  who: string[];
}

export function daySeries(board: Board, days = 35): DayPoint[] {
  const people = peopleById(board);
  const first = addDays(board.today, -(days - 1));
  const points = new Map<string, DayPoint>();
  for (let i = 0; i < days; i++) {
    const d = addDays(first, i);
    points.set(d, { d, outside: 0, guests: 0, team: 0, msgsOut: 0, msgsTeam: 0, joinedNamed: 0, joinedGuests: 0, notes: 0, voiceMs: 0, games: 0, cards: 0, appChanges: 0, who: [] });
  }
  for (const r of board.days) {
    const pt = points.get(r.d);
    if (!pt) continue;
    const p = people.get(r.p);
    const team = p?.tag === "team";
    if (r.act) {
      if (team) pt.team += 1;
      else if (p?.tag === "guest") pt.guests += 1;
      else pt.outside += 1;
      pt.who.push(r.p);
    }
    if (team) pt.msgsTeam += r.msgs;
    else pt.msgsOut += r.msgs;
    pt.notes += r.notes;
    pt.voiceMs += r.voiceMs;
    pt.games += r.games;
    pt.cards += r.cards;
    pt.appChanges += r.appChanges;
  }
  for (const p of board.people) {
    if (p.tag === "team") continue;
    const pt = points.get(dayOf(p.joined));
    if (!pt) continue;
    if (p.tag === "guest") pt.joinedGuests += 1;
    else pt.joinedNamed += 1;
  }
  for (const pt of points.values()) {
    pt.who.sort((a, b) => Number(people.get(a)?.tag === "team") - Number(people.get(b)?.tag === "team"));
  }
  return [...points.values()];
}

/** Things done in each Cairo hour of one day, from the feed (opens are left out: only the last one has a time). */
export function hourCounts(feed: Happening[], day: string, people: Map<string, Person>, until?: number): Array<{ out: number; team: number }> {
  const hours = Array.from({ length: 24 }, () => ({ out: 0, team: 0 }));
  for (const h of feed) {
    if (h.k === "open" || !byThem(h.k)) continue;
    if (until !== undefined && h.at > until) continue;
    if (dayOf(h.at) !== day) continue;
    const slot = hours[hourOf(h.at)];
    if (people.get(h.p)?.tag === "team") slot.team += 1;
    else slot.out += 1;
  }
  return hours;
}

/** Who did something themselves on a day before a moment (an open counts from the day's first open). */
export function activeBy(feed: Happening[], day: string, until: number): Set<string> {
  const out = new Set<string>();
  for (const h of feed) {
    if (!byThem(h.k)) continue;
    const at = h.k === "open" ? Number(h.x.f ?? h.at) : h.at;
    if (at > until || dayOf(at) !== day) continue;
    out.add(h.p);
  }
  return out;
}

export function countBy(feed: Happening[], day: string, until: number, test: (h: Happening) => boolean): number {
  let n = 0;
  for (const h of feed) if (h.at <= until && dayOf(h.at) === day && test(h)) n += 1;
  return n;
}

/** Someone in Krovvi lately: the last thing they did themselves and when. */
export interface Lately {
  p: string;
  at: number;
  k: Kind;
  x: Facts;
}

export function lately(feed: Happening[], now: number, withinMs: number): Lately[] {
  const seen = new Map<string, Lately>();
  for (const h of feed) {
    if (!byThem(h.k) || now - h.at > withinMs) continue;
    const had = seen.get(h.p);
    if (!had || h.at > had.at) seen.set(h.p, { p: h.p, at: h.at, k: h.k, x: h.x });
  }
  return [...seen.values()].sort((a, b) => b.at - a.at);
}

/** A line in the feed: one thing, or a run of the same thing by the same person. */
export interface FeedLine {
  key: string;
  p: string;
  k: Kind;
  x: Facts;
  /** Newest and oldest moment in the run. */
  at: number;
  from: number;
  count: number;
  /** For a run of messages: the answers' times. */
  answers: number[];
  /** For a run of recordings: their length. */
  ms: number;
  /** For a run of cards: how many of each thing they did (answered, skipped ...). */
  tally: Record<string, number>;
}

/** What makes two things the same for folding: the same kind, and for notes and apps, the same sort. Cards fold whatever was done with them. */
function sameSort(a: Happening, b: Happening): boolean {
  if (a.k !== b.k || a.p !== b.p) return false;
  switch (a.k) {
    case "msg":
      return !a.x.g && !b.x.g && a.x.s === "done" && b.x.s === "done";
    case "note":
      return a.x.n === b.x.n;
    case "card":
    case "kfirst":
    case "kmade":
    case "buzz":
      return true;
    case "app":
    case "kapp":
      return a.x.o === b.x.o && !a.x.new && !b.x.new;
    default:
      return false;
  }
}

/** The feed, newest first, with runs folded: the same thing by the same person, each within 20 minutes of the next. */
export function feedLines(feed: Happening[]): FeedLine[] {
  const lines: FeedLine[] = [];
  let run: FeedLine | null = null;
  let last: Happening | null = null;
  for (const h of feed) {
    if (run && last && sameSort(last, h) && last.at - h.at <= 20 * 60_000) {
      run.count += 1;
      run.from = h.at;
      if (h.x.a) run.answers.push(h.x.a);
      if (h.x.ms) run.ms += h.x.ms;
      if (h.k === "card" && h.x.e) run.tally[h.x.e] = (run.tally[h.x.e] ?? 0) + 1;
    } else {
      run = { key: feedKey(h), p: h.p, k: h.k, x: h.x, at: h.at, from: h.at, count: 1, answers: h.x.a ? [h.x.a] : [], ms: h.x.ms ?? 0, tally: h.k === "card" && h.x.e ? { [h.x.e]: 1 } : {} };
      lines.push(run);
    }
    last = h;
  }
  return lines;
}

export function median(values: number[]): number | null {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** New people of the last N days and how their first days went. */
export interface Newcomer {
  person: Person;
  joinedDay: string;
  daysSince: number;
  activeDays: number;
  opened: boolean;
  messaged: boolean;
  msgs: number;
  cameBack: boolean;
}

export function newcomers(board: Board, days = 30): Newcomer[] {
  const since = addDays(board.today, -(days - 1));
  const byPerson = new Map<string, DayRow[]>();
  for (const r of board.days) {
    const list = byPerson.get(r.p);
    if (list) list.push(r);
    else byPerson.set(r.p, [r]);
  }
  const out: Newcomer[] = [];
  for (const p of board.people) {
    if (p.tag === "team") continue;
    const joinedDay = dayOf(p.joined);
    if (joinedDay < since) continue;
    const rows = byPerson.get(p.id) ?? [];
    const active = rows.filter((r) => r.act);
    const activeDays = new Set(active.map((r) => r.d)).size;
    const msgs = rows.reduce((n, r) => n + r.msgs, 0);
    out.push({
      person: p,
      joinedDay,
      daysSince: daysBetween(joinedDay, board.today),
      activeDays,
      opened: active.length > 0,
      messaged: msgs > 0,
      msgs,
      cameBack: activeDays >= 2,
    });
  }
  return out.sort((a, b) => b.person.joined - a.person.joined);
}

export function speedRows(board: Board, group: SpeedGroup): Map<string, SpeedRow> {
  return new Map(board.speed.filter((s) => s.g === group).map((s) => [s.d, s]));
}

/** Messages of a day with their answer time, from the feed (today and yesterday only). */
export function timedMessages(feed: Happening[], day: string): Happening[] {
  return feed.filter((h) => h.k === "msg" && dayOf(h.at) === day && typeof h.x.a === "number");
}

/** Problems of the last two days: answers that failed and problems phones saw. */
export function problems(feed: Happening[]): Happening[] {
  return feed.filter((h) => h.k === "fail" || (h.k === "msg" && h.x.s === "failed"));
}

export { byKrovvi };
