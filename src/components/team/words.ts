/**
 * The board's words and clocks: what each thing people did is called in
 * plain English, and every time and day on Cairo's clock, whatever the
 * phone reading the board is set to.
 */

import type { Facts, Kind, Person } from "@/lib/team";

export const TZ = "Africa/Cairo";

const CLOCK = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const DAY = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const HOUR = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", hourCycle: "h23" });
// Month and day names by hand: Intl's en-GB now writes September as "Sept".
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function parts(d: string): { y: number; m: number; day: number; w: number } {
  const [y, m, day] = d.split("-").map(Number);
  return { y, m, day, w: new Date(Date.UTC(y, m - 1, day)).getUTCDay() };
}

/** 21:04 on Cairo's clock. */
export function clock(ms: number): string {
  return CLOCK.format(ms);
}

/** The Cairo day of a moment, as 2026-10-15. */
export function dayOf(ms: number): string {
  return DAY.format(ms);
}

/** The Cairo hour of a moment, 0 to 23. */
export function hourOf(ms: number): number {
  return Number(HOUR.format(ms)) % 24;
}

function utc(d: string): number {
  const [y, m, day] = d.split("-").map(Number);
  return Date.UTC(y, m - 1, day);
}

export function addDays(d: string, n: number): string {
  return new Date(utc(d) + n * 86_400_000).toISOString().slice(0, 10);
}

/** Days from a to b (b later is positive). */
export function daysBetween(a: string, b: string): number {
  return Math.round((utc(b) - utc(a)) / 86_400_000);
}

/** Today, Yesterday, or Mon 13 Oct. */
export function dayName(d: string, today: string): string {
  if (d === today) return "Today";
  if (d === addDays(today, -1)) return "Yesterday";
  return dayShort(d);
}

/** Wednesday 15 October. */
export function dayLong(d: string): string {
  const p = parts(d);
  return `${WEEKDAYS_LONG[p.w]} ${p.day} ${MONTHS_LONG[p.m - 1]}`;
}

/** Mon 13 Oct, for a chart's tooltip. */
export function dayShort(d: string): string {
  const p = parts(d);
  return `${WEEKDAYS[p.w]} ${p.day} ${MONTHS[p.m - 1]}`;
}

/** 17 Sep 2026, on Cairo's calendar. */
export function date(ms: number): string {
  const p = parts(dayOf(ms));
  return `${p.day} ${MONTHS[p.m - 1]} ${p.y}`;
}

/** 17 Sep, on Cairo's calendar. */
export function dateShort(ms: number): string {
  const p = parts(dayOf(ms));
  return `${p.day} ${MONTHS[p.m - 1]}`;
}

/** The day of the month and, on the first of a month, the month: a chart's axis. */
export function axisDay(d: string): string {
  const p = parts(d);
  return p.day === 1 ? `1 ${MONTHS[p.m - 1]}` : String(p.day);
}

/** now, 3 min, 2 h, 4 d: how long ago, short. */
export function ago(ms: number, now: number): string {
  const s = Math.max(0, Math.round((now - ms) / 1000));
  if (s < 60) return "now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h`;
  return `${Math.round(h / 24)} d`;
}

/** Just now, 3 min ago, yesterday 21:04, or Mon 13 Oct 21:04. */
export function when(ms: number, now: number, today: string): string {
  const s = Math.round((now - ms) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  const d = dayOf(ms);
  if (d === today) return `today ${clock(ms)}`;
  return `${dayName(d, today).replace("Yesterday", "yesterday")} ${clock(ms)}`;
}

/** 12.4 s, or 1 min 5 s. */
export function seconds(ms: number): string {
  if (ms < 10_000) return `${(ms / 1000).toFixed(1)} s`;
  if (ms < 60_000) return `${Math.round(ms / 1000)} s`;
  const m = Math.floor(ms / 60_000);
  const s = Math.round((ms % 60_000) / 1000);
  return s ? `${m} min ${s} s` : `${m} min`;
}

/** 40 s, 91 min, or 2 h 5 min. */
export function minutes(ms: number): string {
  if (ms > 0 && ms < 60_000) return `${Math.max(1, Math.round(ms / 1000))} s`;
  const m = Math.round(ms / 60_000);
  if (m < 120) return `${m} min`;
  const h = Math.floor(m / 60);
  return m % 60 ? `${h} h ${m % 60} min` : `${h} h`;
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;
}

export function percent(part: number, whole: number): string {
  return whole ? `${Math.round((part / whole) * 100)}%` : "0%";
}

/* Who someone is. */

export function nameOf(p: Pick<Person, "id" | "name" | "tag"> | undefined, id?: string): string {
  if (!p) return `Someone ${id?.slice(0, 4) ?? ""}`.trim();
  if (p.name) return p.name;
  return p.tag === "guest" ? `Guest ${p.id.slice(0, 4)}` : `No name ${p.id.slice(0, 4)}`;
}

/** Moustafa E.: a first name and the last name's first letter, for tight lines. */
export function shortName(p: Pick<Person, "id" | "name" | "tag"> | undefined, id?: string): string {
  if (!p?.name) return nameOf(p, id);
  const parts = p.name.trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.` : parts[0];
}

export function firstName(p: Pick<Person, "id" | "name" | "tag"> | undefined): string {
  const n = nameOf(p);
  return p?.name ? n.split(/\s+/)[0] : n;
}

export function initials(p: Pick<Person, "id" | "name" | "tag"> | undefined): string {
  if (!p?.name) return p?.tag === "guest" ? "G" : "?";
  const parts = p.name.trim().split(/\s+/);
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export const TAG_WORD: Record<Person["tag"], string> = { outside: "Outside", guest: "Guest", team: "Team" };

export function viaWord(via: string): string {
  return ({ apple: "Apple", google: "Google", email: "Email", guest: "No sign-in" } as Record<string, string>)[via] ?? via;
}

/** The voice inks, which tint people and nothing else (the app's palette): each person keeps theirs. */
const INKS = ["#E6DCC8", "#C98A62", "#B0A89D", "#C2A470", "#8F7864", "#D4B49A"];

export function inkOf(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return INKS[h % INKS.length];
}

/* What things are called. */

const APPS: Record<string, string> = {
  food: "Nutrition",
  spending: "Money",
  split: "Money",
  todo: "To-do",
  workout: "Fitness",
  habits: "Habits",
  mood: "Habits",
  kitchen: "Kitchen",
  shopping: "Kitchen",
  meals: "Kitchen",
  health: "Health",
  meds: "Health",
  cycle: "Health",
  plan: "Plans",
  gift: "Plans",
  countdown: "Plans",
  trip: "Trips",
  watchlist: "Watch",
};

export function appName(kind: string | undefined): string {
  return (kind && APPS[kind]) || "an app";
}

const GAMES: Record<string, string> = {
  this_or_that: "This or That",
  two_truths: "Two truths and a lie",
  guess: "Guess what I’m thinking",
  trivia: "Quick trivia",
  emoji: "Emoji riddles",
};

export function gameName(id: string | undefined): string {
  return (id && GAMES[id]) || "a game";
}

const NOTES: Record<string, [string, string]> = {
  voice: ["recorded", "recordings"],
  doc: ["added a document", "documents"],
  photo: ["added a photo", "photos"],
  text: ["wrote a note", "notes"],
  link: ["saved a link", "links"],
  video: ["added a video", "videos"],
  chat: ["saved a chat", "chats"],
};

export function noteWords(kind: string): [string, string] {
  return NOTES[kind] ?? ["added a note", "notes"];
}

const CARD_KIND: Record<string, string> = {
  question: "Krovvi’s question",
  errand: "an errand card",
  promise: "a promise card",
  change: "a change card",
  insight: "an insight",
  nudge: "a nudge",
  answer: "an answer card",
  caught: "a catch card",
  day: "a day card",
  invite: "an invite card",
  conflict: "a conflict card",
  prepare: "a prep card",
  offer: "an offer card",
  reminder: "a reminder",
  noticed: "a notice card",
  made_file: "a file card",
  meeting: "a meeting card",
  meeting_bot: "a meeting card",
  before_meeting: "a meeting card",
  first_run: "a welcome card",
  connect_live: "a connect card",
};

export function cardWords(c: string | undefined, e: string | undefined): string {
  if (c === "recording" && e === "played") return "played a recording";
  const what = (c && CARD_KIND[c]) || "a card";
  switch (e) {
    case "answered":
      return `answered ${what}`;
    case "acted":
      return `did what ${what} asked`;
    case "played":
      return `played ${what}`;
    case "opened":
      return `opened ${what}`;
    case "passed":
      return `skipped ${what}`;
    case "undid":
      return `undid ${what}`;
    default:
      return `used ${what}`;
  }
}

const PROBLEMS: Record<string, string> = {
  failed: "A reply failed on their phone",
  workerProblem: "A reply hit a server problem",
  askNotSent: "A message didn’t send",
  emptyAnswer: "An answer came back empty",
  stoppedEmpty: "A reply stopped with nothing",
  openFailed: "A chat didn’t open",
  mic: "Voice typing didn’t start",
  micWords: "Voice typing heard nothing",
};

export function problemWords(f: string | number | undefined): string {
  return (typeof f === "string" && PROBLEMS[f]) || "A chat problem";
}

/** Krovvi did this, not them: drawn quieter in a list. */
export function byKrovvi(k: Kind): boolean {
  return k === "kfirst" || k === "kapp" || k === "buzz" || k === "kmade";
}

/** They did this themselves (a day with one of these is a day they used Krovvi). */
export function byThem(k: Kind): boolean {
  return k === "open" || k === "msg" || k === "note" || k === "card" || k === "app" || k === "share" || k === "land";
}

/**
 * One thing as a short sentence under the person's name: "Sent a message",
 * "Recorded 12 min", and when Krovvi did it, Krovvi says so: "Krovvi wrote first".
 */
export function line(k: Kind, x: Facts): { text: string; bad?: boolean } {
  switch (k) {
    case "msg":
      if (x.g) return { text: `Played ${gameName(x.g)}` };
      if (x.s === "failed") return { text: "Sent a message, and the answer failed", bad: true };
      if (x.s === "working" || x.s === "asked") return { text: "Sent a message, Krovvi is answering" };
      if (x.s === "stopped" || x.s === "cancelled") return { text: "Sent a message, then stopped the answer" };
      if (x.sh) return { text: "Carried on a shared chat" };
      return { text: "Sent a message" };
    case "kfirst":
      return { text: "Krovvi wrote first" };
    case "note": {
      const kind = String(x.n ?? "");
      if (kind === "voice") return { text: x.ms ? `Recorded ${minutes(x.ms)}` : "Made a recording" };
      const words = noteWords(kind)[0];
      return { text: words.charAt(0).toUpperCase() + words.slice(1) };
    }
    case "kmade":
      return { text: x.n === "doc" ? "Krovvi made a file" : "Krovvi wrote a note" };
    case "card": {
      const words = cardWords(x.c, x.e);
      return { text: words.charAt(0).toUpperCase() + words.slice(1) };
    }
    case "app":
      return { text: x.new ? `Made a new ${appName(x.o)} list` : `Changed something in ${appName(x.o)}` };
    case "kapp":
      return { text: x.new ? `Krovvi made a ${appName(x.o)} list` : `Krovvi changed something in ${appName(x.o)}` };
    case "share":
      return { text: "Shared a chat" };
    case "land":
      return { text: "Carried on a chat someone shared" };
    case "join":
      return { text: x.via === "guest" ? "Opened Krovvi for the first time, as a guest" : `Joined with ${viaWord(String(x.via ?? "email"))}` };
    case "open": {
      const n = Number(x.n ?? 1);
      return { text: n > 1 ? `Opened Krovvi, ${n} times that day` : "Opened Krovvi" };
    }
    case "buzz":
      return { text: "Krovvi sent a notification" };
    case "fail":
      return { text: problemWords(x.f), bad: true };
  }
}
