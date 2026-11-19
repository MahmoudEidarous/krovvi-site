import type { ThreadMessageLike } from '@assistant-ui/react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { LabChat, type LabStep } from '@/app/agent';
import { celebrate } from '@/components/celebration';
import { ChatSky } from '@/components/chat-sky';
import { replayOpening } from '@/components/first-meeting/opening';
import { foodBench } from '@/components/objects/kinds/food/bench';
import { goalBench } from '@/components/objects/kinds/goal/bench';
import { habitsBench } from '@/components/objects/kinds/habits/bench';
import { healthBench } from '@/components/objects/kinds/health/bench';
import { moneyBench } from '@/components/objects/kinds/spending/bench';
import { studyBench } from '@/components/objects/kinds/study/bench';
import { fitnessBench } from '@/components/objects/kinds/workout/bench';
import { ObjectScreen } from '@/components/objects/screen';
import { openOnPart } from '@/components/objects/shell';
import { krovviFirstOf } from '@/lib/agent/krovvi-first';
import { dayShown } from '@/lib/agent/lab-day';
import { useBenchLanguage } from '@/lib/bench-language';
import { noteBetter } from '@/lib/better-you';
import { today as dayNow } from '@/lib/day-now';
import { setDaysBench } from '@/lib/days';
import { benchPictureRoads } from '@/lib/days-bench-pictures';
import { daysFixture, loopSheetFixture } from '@/lib/days-fixtures';
import { setDayPicturesBench } from '@/lib/days-pictures';
import { welcomeAnswer, WELCOME_VERSION } from '@/lib/first-meeting/lines';
import { WELCOME_LOCAL_ID } from '@/lib/first-meeting/rules';
import { benchMeeting, forgetOpeningPlayed } from '@/lib/first-meeting/store';
import { benchLoop, benchTellLands } from '@/lib/loop/bench';
import type { Fixture, Kind } from '@/lib/objects/core';
import { FIXTURES, FIX_NOW } from '@/lib/objects/fixtures';
import { primeFixture } from '@/lib/objects/store';
import { phoneWeekFirst, weekStartOf } from '@/lib/week-start';
import { look } from '@/theme/look';
import { color } from '@/theme/tokens';

/**
 * The website's bench (krovvi.com; first 2 November 2026, grown on 19 November 2026 for the site that shows today's
 * app): the real chat (app/agent.tsx LabChat) holding the conversations the site shows, so every phone on the site is
 * a screen of the app itself, filmed on the simulator by the site's capture script (krovvi-site scripts/app-shots).
 * Made-up people and general things only, Krovvi's own voice (lowercase, short), no emoji. Development only, like
 * every lab-* page; kept in the site's repository and copied into an app worktree for a capture, never committed there.
 *
 *   krovvi:///lab-site?scene=hero&pick=great|okay|low&run=N   Krovvi checks in after the interview, three one-tap answers
 *   krovvi:///lab-site?scene=vent                              a bad day, said, and Krovvi on their side
 *   krovvi:///lab-site?scene=checkin&run=N                     Krovvi asks how they are holding up after a long week
 *   krovvi:///lab-site?scene=memory                            something said once in June, brought back today
 *   krovvi:///lab-site?scene=news                              their big news, and Krovvi the first to celebrate it
 *   krovvi:///lab-site?scene=hello                             the first chat's opening, from its first moment
 *   krovvi:///lab-site?scene=card&card=<name>                  one thing said, and its own card under Krovvi's reply:
 *       water, skin, focus, sleep, reading, day, habit, meal, weight, dose, fitness, money, study, goal
 *   krovvi:///lab-site?scene=thread&cards=water,skin,focus     several of those in one chat, one after another
 *   krovvi:///lab-site?scene=day                               the day the bank says yes: told, answered, and Home's flame
 *                                                              lights for the day (11 becomes 12) once the reply is written
 *   krovvi:///lab-site?scene=page&kind=spending&state=rich-en  an app's own page, the fixture one person's alone, on a
 *                                                              day near today (`&back=3` weeks earlier, `&tab=` its part)
 *
 * `run` makes a fresh message each time, so a one-tap answer is never one already answered.
 * `clock=18:12` sets the app's own clock to today at that time while the bench is open (and puts the real one back as
 * it closes), so a film shot at four in the morning still reads as an evening check-in. A card's scene takes its clock
 * from the card's own fixture, so "now" on the card is true. Either way the bench says its clock in a label nobody sees
 * ("site-clock 18:12"), which the capture script reads to set the status bar to the same time.
 * `&home=0` draws the chat without Home's top; left out, the chat stands as Home does for someone signed in, with
 * their streak's flame at the top (`&streak=12`).
 */

type Turn = ThreadMessageLike;

/** The real clock, kept to put back. */
const RealDate = Date;

const DAY = 86_400_000;
/**
 * The shared fixtures were written on their own day (FIX_NOW, 3 October 2026), so their cards print dates around it. On
 * the site those cards sit in a chat happening now: every date in them moves forward by whole weeks (weekdays stay true,
 * so "friday at sam's" is still a Friday) to the first such day on or after today, and the scenes' clock stands on that
 * same day. The chat itself only ever says Today or Yesterday.
 */
const SHIFT = Math.max(0, Math.ceil((RealDate.now() - FIX_NOW) / (7 * DAY))) * 7 * DAY;
/** The shift in use: SHIFT, or fewer weeks for a fixture written on a later day of its own (Money's 19th of the month). */
let shiftNow = SHIFT;
function shifted<T>(weeksBack: number, make: () => T): T {
  const was = shiftNow;
  shiftNow = SHIFT - weeksBack * 7 * DAY;
  try {
    return make();
  } finally {
    shiftNow = was;
  }
}

/** The moment the scene's day stands at hh:mm; null for no clock. */
function clockMoment(hhmm: string | undefined): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm ?? '');
  if (!m) return null;
  const want = new RealDate(FIX_NOW + SHIFT);
  want.setHours(Number(m[1]), Number(m[2]), 0, 0);
  return want.getTime();
}

const two = (n: number) => String(n).padStart(2, '0');
const hhmmOf = (ms: number) => {
  const d = new RealDate(ms);
  return `${two(d.getHours())}:${two(d.getMinutes())}`;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** A date written as 2026-10-16 (or a moment written from one), or in words as Fri 9 Oct, moved by SHIFT. */
function movedDay(text: string): string {
  const said = text.replace(/\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun) (\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/g, (whole, _w: string, d: string, mo: string) => {
    const t = new RealDate(RealDate.UTC(2026, MONTHS.indexOf(mo), Number(d)) + shiftNow);
    return `${WEEKDAYS[t.getUTCDay()]} ${t.getUTCDate()} ${MONTHS[t.getUTCMonth()]}`;
  });
  return said.replace(/\b(\d{4})-(\d{2})-(\d{2})(T[0-9:.]+Z?)?\b/g, (whole, y: string, mo: string, d: string, rest: string | undefined) => {
    const t = RealDate.UTC(Number(y), Number(mo) - 1, Number(d)) + shiftNow;
    const day = new RealDate(t).toISOString().slice(0, 10);
    return rest ? `${day}${rest}` : day;
  });
}

/** A moment in ms near the fixtures' day (between 2025 and 2028), moved by SHIFT; any other number stays. */
const movedMoment = (n: number) => (n > 1_735_000_000_000 && n < 1_830_000_000_000 ? n + shiftNow : n);

/** The app's clock reads `moment` as the bench opens and runs on from there: Date.now() and new Date() move by the same amount. */
function useClock(moment: number | null) {
  useMemo(() => {
    const offset = moment === null ? 0 : moment - RealDate.now();
    const g = globalThis as unknown as { Date: DateConstructor };
    if (!offset) {
      g.Date = RealDate;
      return;
    }
    g.Date = new Proxy(RealDate, {
      construct(target, args) {
        return args.length ? Reflect.construct(target, args) : new target(target.now() + offset);
      },
      apply(target) {
        return new target(target.now() + offset).toString();
      },
      get(target, prop, receiver) {
        if (prop === 'now') return () => target.now() + offset;
        return Reflect.get(target, prop, receiver);
      },
    });
  }, [moment]);
  useEffect(
    () => () => {
      (globalThis as unknown as { Date: DateConstructor }).Date = RealDate;
    },
    []
  );
}

/** Today at a local hour and minute, or that many days before. */
function at(hour: number, minute: number, daysAgo = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d;
}

/** A few minutes before now: the status bar on the site's films reads the time they were filmed. */
function ago(minutes: number): Date {
  return new Date(Date.now() - minutes * 60_000);
}

function me(id: string, text: string, when: Date): Turn {
  return { id: `${id}:q`, role: 'user', createdAt: when, content: [{ type: 'text', text }] };
}

const says = (lines: string[]) => lines.map((s) => `<say>${s}</say>`).join('\n');

function krovvi(id: string, lines: string[], when: Date): Turn {
  return {
    id: `${id}:a`,
    role: 'assistant',
    createdAt: when,
    content: [{ type: 'text', text: says(lines) }],
    metadata: { custom: { style: 'mixed', turnId: id } },
  };
}

/** A message Krovvi starts itself with one-tap answers under it (lib/agent/krovvi-first.ts), as the server files one. */
function checkIn(id: string, why: string, lines: string[], choices: string[], when: Date): Turn {
  const first = krovviFirstOf({
    krovvi: {
      v: 1,
      kind: 'follow_up',
      lang: 'en',
      why: { text: why, source: { kind: 'thread', id: 'lab' } },
      actions: [],
      choices: choices.map((label, i) => ({ id: `c${i}`, label })),
    },
  });
  return {
    id: `${id}:a`,
    role: 'assistant',
    createdAt: when,
    content: [{ type: 'text', text: says(lines) }],
    metadata: { custom: { style: 'mixed', turnId: id, krovvi: first } },
  };
}

/** Words streamed the way the wire hands them: a few characters at a time. */
function streamed(text: string, piece = 16, ms = 45): LabStep[] {
  const steps: LabStep[] = [];
  for (let i = 0; i < text.length; i += piece) {
    steps.push(text.slice(i, i + piece));
    steps.push(ms);
  }
  return steps;
}

/**
 * The fixtures' own words, made general for a public page: the owner of every shared fixture is the founder by name,
 * so here they are Alex, and a flight from one country's capital leaves from London instead.
 */
const SWAPS: [RegExp, string][] = [
  [/Mahmoud/g, 'Alex'],
  [/محمود/g, 'أليكس'],
  [/Cairo/g, 'London'],
];

function general<T>(value: T): T {
  if (typeof value === 'string') return movedDay(SWAPS.reduce((s, [from, to]) => s.replace(from, to), value as string)) as T;
  if (typeof value === 'number') return movedMoment(value) as T;
  if (Array.isArray(value)) return value.map(general) as T;
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = general(v);
    return out as T;
  }
  return value;
}

/** A fixture kept by its owner alone: the site's cards are one person's own, so nobody else is named on them. */
function solo(f: Fixture): Fixture {
  const owner = f.snap.members.find((m) => m.role === 'owner');
  if (!owner) return f;
  return { ...f, viewer: owner.id, snap: { ...f.snap, members: [owner] } };
}

/** The kinds' benches beside the shared fixtures, as the objects bench reads them (app/lab-objects.tsx benchOf). */
function benchOf(kind: Kind): Fixture[] {
  if (!__DEV__) return [];
  return kind === 'goal' ? goalBench() : kind === 'workout' ? fitnessBench() : kind === 'spending' ? moneyBench() : kind === 'study' ? studyBench() : kind === 'food' ? foodBench() : kind === 'habits' ? habitsBench() : kind === 'health' ? healthBench() : [];
}

function fixtureOf(kind: Kind, state: string): Fixture | null {
  return [...(FIXTURES[kind] ?? []), ...benchOf(kind)].find((f) => f.name === state) ?? null;
}

/**
 * What a reply changed in the object, as the turn hands it (lib/answer/changes.ts): its n newest things, each by its own
 * clock reading, so the card under the reply stands as it does in a real chat (app/lab-objects.tsx saidChanges).
 */
function saidChanges(id: string, f: Fixture, n: number, skip = 0): Array<{ id: string; events: Array<{ event: number; at: number }> }> {
  if (!Number.isInteger(n) || n <= 0) return [];
  const anything = ['study', 'food', 'goal', 'habits', 'wardrobe', 'workout', 'health'].includes(f.snap.head.kind);
  const stamps = anything ? [...f.snap.items.flatMap((i) => [i.createdAt, i.updatedAt]), ...f.snap.activity.map((a) => a.at)] : f.snap.items.filter((i) => i.day !== null).map((i) => i.createdAt);
  const newest = [...new Set(stamps)].filter((when) => when <= f.now).sort((a, b) => b - a).slice(skip, skip + n);
  return newest.length ? [{ id, events: newest.map((when, i) => ({ event: f.snap.activity.find((a) => a.at === when)?.event ?? i + 1, at: when })) }] : [];
}

/* ---------- the scenes ---------- */

const HERO_PICKS: Record<string, string[]> = {
  great: ['knew it.', 'you walked in ready.', "dinner to celebrate tonight? i'll find a table."],
  okay: ['okay can still be a yes.', 'what part felt off?'],
  low: ["ugh. i'm sorry.", 'want to talk it through, or want a distraction?'],
};

function hero(run: string): Turn[] {
  return [
    me('site-hero-1', 'big interview tomorrow. kinda nervous', at(23, 42, 1)),
    krovvi('site-hero-1', ["you've practiced all week. you're ready.", "get some sleep. i'll check in after."], at(23, 42, 1)),
    checkIn(`site-hero-2-${run}`, 'Your interview today', ['hey. you made it through.', 'how did the interview go?'], ['it went great', 'it was okay', 'not great, honestly'], ago(2)),
  ];
}

function checkin(run: string): Turn[] {
  return [checkIn(`site-check-2-${run}`, 'Your early starts this week', ["you've had a long week.", 'how are you holding up?'], ['honestly, tired', 'pretty good', 'talk later?'], ago(1))];
}

const CHECK_REPLY = says(["then tonight's a couch night.", "want me to move tomorrow's 7am run to saturday, so you can sleep in?"]);

const VENT_ASK = 'worst day. my manager just presented my idea to the whole team like it was his';
const VENT_REPLY = says(['wait, the one you stayed late for all last week?', "that's not okay. i'd be furious too.", 'do you want to vent, or do you want a distraction?']);

const MEMORY_ASK = 'what should i get sara for her birthday?';
const MEMORY_REPLY = ['<say>pottery!</say>', '<say>you told me in june:</say>', '', '> sara keeps saying she wants to try pottery', '', '<say>there’s a beginners class near her on saturday mornings. want the link?</say>'].join('\n');

/** Their big news: Krovvi's cheer lands on it, confetti falls in the theme's colours (components/celebration.tsx, as the
 * server's celebrate command draws it), then its words. The end of the site's story: the interview it opens with. */
const NEWS_ASK = 'THEY CALLED. I GOT THE JOB';
const NEWS_REPLY = says(['no way. i knew it.', 'you walked in ready and they saw it.', 'when do you start?']);
const NEWS_PARTY_MS = 1500;

/**
 * One thing said, and its own card under Krovvi's reply: the kind's fixture as it stands under a reply that did that
 * (its bench's said-... states), what they said, and Krovvi's words, each true to what the card shows.
 */
interface CardScene {
  kind: Kind;
  state: string;
  said?: number;
  skip?: number;
  /** Weeks less than the fixtures' shift, for a fixture written on a later day of its own. */
  back?: number;
  ask: string;
  words: string[];
}

const CARDS: Record<string, CardScene> = {
  water: { kind: 'food', state: 'said-water-en', ask: 'just had a glass of water', words: ['1.5 litres so far.', 'one more and you hit today’s aim.'] },
  skin: { kind: 'habits', state: 'skin-en', ask: 'did my cleanser and vitamin c', words: ['two down.', 'moisturizer is next.'] },
  focus: { kind: 'habits', state: 'said-focus-start-en', ask: 'focus 25 minutes on my essay', words: ['go. i’ll keep the time.'] },
  focusrun: { kind: 'habits', state: 'focus-run-en', ask: 'focus 25 minutes on my essay', words: ['go. i’ll keep the time.'] },
  sleep: { kind: 'health', state: 'said-night-en', ask: 'slept at 11:40, up at 6:50', words: ['7 hours 10. that’s a good night.'] },
  reading: { kind: 'habits', state: 'said-read-en', ask: 'read 12 pages of dune', words: ['12 in.', '8 more and you hit today’s 20.'] },
  day: { kind: 'habits', state: 'said-grateful-en', ask: 'good day. slept well, long walk at lunch. my sister called too', words: ['that’s a good one.', 'kept it with your day.'] },
  habit: { kind: 'habits', state: 'said-check-en', ask: 'read my 20 pages', words: ['ticked.', 'that’s 42 days of reading.'] },
  meal: { kind: 'food', state: 'said-meal-en', ask: 'had a chicken wrap for lunch', words: ['about 430 calories, 32 g of protein.', '55 left for today.'] },
  weight: { kind: 'food', state: 'said-weight-en', ask: '76.8 this morning', words: ['half a kilo down this week.', 'you’re 0.8 from your aim.'] },
  dose: { kind: 'health', state: 'said-dose-en', ask: 'took my vitamin d', words: ['marked.', 'iron is next, at 9 tonight.'] },
  fitness: { kind: 'workout', state: 'said-session-en', ask: 'did 45 minutes of yoga', words: ['nice. that’s four days this week.', 'aim reached.'] },
  money: { kind: 'spending', state: 'mid-en', said: 2, back: 2, ask: 'cinema was 21.75, and 33.55 at zara', words: ['both in.', '$467 left, with 8 days to go.'] },
  study: { kind: 'study', state: 'said-cards-en', ask: 'make me flashcards for linkage', words: ['eight cards, ready.', 'want to try them now?'] },
  goal: { kind: 'goal', state: 'said-did-en', ask: 'did my session', words: ['marked.', 'that’s today’s part done.'] },
};

/** What they said and Krovvi's reply with the card under it, already in the chat; and the moment the card stands at. */
function exchange(key: string, when: (cardNow: number) => Date): { turns: Turn[]; now: number } | null {
  const c = CARDS[key];
  if (!c) return null;
  const found = fixtureOf(c.kind, c.state);
  if (!found) return null;
  const f = shifted(c.back ?? 0, () => general(solo(found)));
  const id = primeFixture(f).id;
  const changes = saidChanges(id, f, c.said ?? 1, c.skip ?? 0);
  const stamp = when(f.now);
  const turnId = `site-card-${key}`;
  return {
    now: f.now,
    turns: [
      me(turnId, c.ask, stamp),
      {
        id: `${turnId}:a`,
        role: 'assistant',
        createdAt: stamp,
        content: [{ type: 'text', text: `${says(c.words)}\n\n\`\`\`card\n${id}\n\`\`\`\n` }],
        metadata: { custom: { style: 'mixed', turnId, changes } },
      },
    ],
  };
}

/** The first chat's opening (components/first-meeting/opening.tsx), drawn from its first moment. */
function helloTurns(): Turn[] {
  forgetOpeningPlayed();
  replayOpening();
  const first = krovviFirstOf({ krovvi: { v: 1, kind: 'welcome', lang: 'en', why: null, actions: [] }, welcome: { v: WELCOME_VERSION } });
  return [
    {
      id: WELCOME_LOCAL_ID,
      role: 'assistant',
      createdAt: new Date(),
      content: [{ type: 'text', text: welcomeAnswer(WELCOME_VERSION, 'en') ?? '' }],
      metadata: { custom: { style: 'mixed', krovvi: first } },
    },
  ];
}

/** The day they tell their big news: the evening before, still waiting, already in the chat. */
function dayBefore(): Turn[] {
  return [
    me('site-day-1', 'still nothing from the bank. three weeks now', at(21, 14, 1)),
    krovvi('site-day-1', ['i know. the waiting is the worst part.', 'they’ll call. i’m here either way.'], at(21, 14, 1)),
  ];
}
const DAY_ASK = 'the bank just called. they said yes to the loan';
const DAY_REPLY = says(['wait. they said YES?', 'three weeks of waiting and the flat is yours. that is huge.', 'when do you sign?']);
/** How long after the scene opens the day's telling lands, and Home's flame lights: once Krovvi's words are written. */
const DAY_LANDS_MS = 5600;

export default function LabSiteRoute() {
  const p = useLocalSearchParams<{ scene?: string; pick?: string; card?: string; cards?: string; run?: string; clock?: string; home?: string; streak?: string; kind?: string; state?: string; back?: string; tab?: string; again?: string }>();
  const scene = p.scene ?? 'hero';
  const run = p.run ?? '';
  // A card's scene stands at its fixture's own moment (a little after it, as a reply lands); any other at `clock`.
  const cardKeys = useMemo(() => (scene === 'card' ? [p.card ?? 'water'] : scene === 'thread' ? (p.cards ?? 'water,skin,focus').split(',').filter((k) => CARDS[k]) : []), [scene, p.card, p.cards]);
  const cardMoment = useMemo(() => {
    const last = cardKeys[cardKeys.length - 1];
    const c = last ? CARDS[last] : null;
    const f = c ? fixtureOf(c.kind, c.state) : null;
    return f && c ? f.now + SHIFT - (c.back ?? 0) * 7 * DAY + 20_000 : null;
  }, [cardKeys]);
  // An app's own page (scene=page&kind=spending&state=rich-en): the fixture one person's alone, on a day near today
  // (`back` weeks less than the fixtures' shift), drawn by the object's own screen.
  const pageBack = Math.max(0, Math.floor(Number(p.back)) || 0);
  const page = useMemo(() => {
    if (scene !== 'page' || !p.kind) return null;
    const found = fixtureOf(p.kind as Kind, p.state ?? 'rich-en');
    if (!found) return null;
    const f = shifted(pageBack, () => general(solo(found)));
    return { id: primeFixture(f).id, now: f.now };
  }, [scene, p.kind, p.state, pageBack]);
  useEffect(() => {
    if (page && p.tab) openOnPart(page.id, p.tab);
  }, [page, p.tab]);
  const moment = page ? page.now + 20_000 : (cardMoment ?? clockMoment(p.clock));
  // first, so every time the scene makes reads the scene's own clock
  useClock(moment);
  useBenchLanguage('en');
  // The status bar as the chat has it over Home (app/index.tsx): dark words on the light look, light on the dark.
  useEffect(() => {
    setStatusBarStyle(look.statusBar, false);
  }, [scene]);
  // Better you's cards stand as the people it is on for see them (everyone, since 17 November 2026).
  useEffect(() => {
    if (__DEV__) noteBetter(true);
  }, []);
  // Home as someone signed in has it: their streak's flame at the top (app/lab-chat.tsx scene=day does the same).
  const home = p.home !== '0' && scene !== 'hello' && scene !== 'page';
  const streak = Math.max(1, Math.floor(Number(p.streak)) || 12);
  // The day scene: today is not told yet (the flame pale, the day before's count), and the telling lands once Krovvi's
  // reply is written, so Home's flame lights and its number steps up (app/lab-chat.tsx scene=day&run=live).
  const dayLive = scene === 'day';
  useEffect(() => {
    if (!__DEV__ || !home) return;
    const guestAgain = benchMeeting(false);
    const now = dayNow();
    const week = weekStartOf(now, phoneWeekFirst());
    benchLoop(loopSheetFixture(now, week, dayLive ? { told: false, streak: streak - 1 } : { told: true, streak }));
    const all = daysFixture(now, 'en');
    setDaysBench(all);
    setDayPicturesBench(benchPictureRoads(all, 'here'));
    const lands = dayLive ? setTimeout(() => benchTellLands(dayShown(streak, 'en'), loopSheetFixture(now, week, { told: true, streak })), DAY_LANDS_MS) : null;
    return () => {
      if (lands) clearTimeout(lands);
      setDaysBench(null);
      setDayPicturesBench(null);
      benchLoop(null);
      guestAgain();
    };
  }, [home, streak, moment, dayLive, p.again]);
  // The news scene's confetti, a moment after Krovvi's cheer lands on their message.
  useEffect(() => {
    if (scene !== 'news') return;
    const timer = setTimeout(() => celebrate('confetti'), NEWS_PARTY_MS);
    return () => clearTimeout(timer);
  }, [scene, run, p.clock]);
  const { turns, replies, ask } = useMemo(() => {
    switch (scene) {
      case 'vent':
        return { turns: [] as Turn[], replies: [[900, ...streamed(VENT_REPLY)]], ask: VENT_ASK };
      case 'checkin':
        return { turns: checkin(run), replies: [[800, ...streamed(CHECK_REPLY)]], ask: undefined };
      case 'memory':
        return { turns: [] as Turn[], replies: [[1000, ...streamed(MEMORY_REPLY)]], ask: MEMORY_ASK };
      case 'hello':
        return { turns: helloTurns(), replies: [[700, ...streamed(says(['good one. i ask that too.']))]], ask: undefined };
      case 'news':
        return { turns: [] as Turn[], replies: [[650, '<react>🎉</react>', 1500, ...streamed(NEWS_REPLY, 18, 50)]], ask: NEWS_ASK };
      case 'day':
        return { turns: dayBefore(), replies: [[900, ...streamed(DAY_REPLY, 16, 50)]], ask: DAY_ASK };
      case 'card':
      case 'thread': {
        // each exchange a few minutes after the one before, the last one a moment ago
        const made = cardKeys.map((key, i) => exchange(key, () => ago((cardKeys.length - 1 - i) * 7 + 1)));
        return { turns: made.flatMap((m) => m?.turns ?? []), replies: [[600, ...streamed(says(['kept.']))]], ask: undefined };
      }
      default: {
        const pick = HERO_PICKS[p.pick ?? 'great'] ?? HERO_PICKS.great;
        return { turns: hero(run), replies: [[900, ...streamed(says(pick))]], ask: undefined };
      }
    }
  }, [scene, run, p.pick, p.clock, cardKeys]);
  if (!__DEV__) return <Redirect href="/agent" />;
  if (scene === 'page')
    return (
      <View style={styles.screen}>
        {page ? <ObjectScreen key={`${page.id}|${p.tab ?? ''}`} id={page.id} /> : null}
        <View accessible accessibilityLabel={`site-clock ${moment === null ? 'none' : hhmmOf(moment)}`} pointerEvents="none" style={styles.clock} />
      </View>
    );
  return (
    <View style={styles.screen}>
      <ChatSky />
      <LabChat key={`${scene}|${run}|${p.pick ?? ''}|${cardKeys.join(',')}|${p.clock ?? ''}|${home ? 'h' : 'c'}|${p.again ?? ''}`} home={home} threadId={home ? 'home-site' : 'lab-chat'} turns={turns} replies={replies} ask={ask} />
      {/* The scene's clock, said for the capture script alone (it sets the status bar to the same time). */}
      <View accessible accessibilityLabel={`site-clock ${moment === null ? 'none' : hhmmOf(moment)}`} pointerEvents="none" style={styles.clock} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.sky },
  clock: { position: 'absolute', top: 0, left: 0, width: 2, height: 2, opacity: 0.01 },
});
