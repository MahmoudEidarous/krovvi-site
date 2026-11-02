import type { ThreadMessageLike } from '@assistant-ui/react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { LabChat, type LabStep } from '@/app/agent';
import { ChatSky } from '@/components/chat-sky';
import { replayOpening } from '@/components/first-meeting/opening';
import { krovviFirstOf } from '@/lib/agent/krovvi-first';
import { benchReply, gameTurns } from '@/lib/agent/lab-games';
import { useBenchLanguage } from '@/lib/bench-language';
import { welcomeAnswer, WELCOME_VERSION } from '@/lib/first-meeting/lines';
import { WELCOME_LOCAL_ID } from '@/lib/first-meeting/rules';
import { forgetOpeningPlayed } from '@/lib/first-meeting/store';
import { FIXTURES, FIX_NOW } from '@/lib/objects/fixtures';
import { primeFixture } from '@/lib/objects/store';
import { look } from '@/theme/look';
import { color } from '@/theme/tokens';

/**
 * The website's bench (krovvi.com, 2 November 2026): the real chat (app/agent.tsx LabChat) holding the
 * conversations the site shows, so every phone on the site is a screen of the app itself, filmed on the
 * simulator by the site's capture script (krovvi-site scripts/app-shots). Made-up people and general things
 * only, Krovvi's own voice (lowercase, short), no emoji. Development only, like every lab-* page.
 *
 *   krovvi:///lab-site?scene=hero&pick=great|okay|low&run=N   Krovvi checks in after the interview, three one-tap answers
 *   krovvi:///lab-site?scene=vent                              a bad day, said, and Krovvi on their side
 *   krovvi:///lab-site?scene=checkin&run=N                     Krovvi asks how they are holding up after a long week
 *   krovvi:///lab-site?scene=play&run=N                        two truths and a lie, all about them
 *   krovvi:///lab-site?scene=memory                            something said once in June, brought back today
 *   krovvi:///lab-site?scene=friends                           game night with the group, the plan filling in
 *   krovvi:///lab-site?scene=help&task=split|meals|money|trip|gift|todo   the jobs it takes off their list
 *   krovvi:///lab-site?scene=hello                             the first chat's opening, from its first moment
 *
 * `run` makes a fresh message each time, so a one-tap answer or a game is never one already answered.
 * `clock=18:12` sets the app's own clock to today at that time while the bench is open (and puts the real one back as it
 * closes), so a film shot at four in the morning still reads as an evening check-in; the capture script sets the status
 * bar to the same time.
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

/** How far the scene's day at hh:mm is from now, in ms; 0 for no clock. */
function clockOffset(hhmm: string | undefined): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm ?? '');
  if (!m) return 0;
  const want = new RealDate(FIX_NOW + SHIFT);
  want.setHours(Number(m[1]), Number(m[2]), 0, 0);
  return want.getTime() - RealDate.now();
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** A date written as 2026-10-16 (or a moment written from one), or in words as Fri 9 Oct, moved by SHIFT. */
function movedDay(text: string): string {
  const said = text.replace(/\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun) (\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/g, (whole, _w: string, d: string, mo: string) => {
    const t = new RealDate(RealDate.UTC(2026, MONTHS.indexOf(mo), Number(d)) + SHIFT);
    return `${WEEKDAYS[t.getUTCDay()]} ${t.getUTCDate()} ${MONTHS[t.getUTCMonth()]}`;
  });
  return said.replace(/\b(\d{4})-(\d{2})-(\d{2})(T[0-9:.]+Z?)?\b/g, (whole, y: string, mo: string, d: string, rest: string | undefined) => {
    const t = RealDate.UTC(Number(y), Number(mo) - 1, Number(d)) + SHIFT;
    const day = new RealDate(t).toISOString().slice(0, 10);
    return rest ? `${day}${rest}` : day;
  });
}

/** A moment in ms near the fixtures' day (between 2025 and 2028), moved by SHIFT; any other number stays. */
const movedMoment = (n: number) => (n > 1_735_000_000_000 && n < 1_830_000_000_000 ? n + SHIFT : n);

/** The app's clock reads today at hh:mm while this bench is open: Date.now() and new Date() move by the same amount. */
function useClock(hhmm: string | undefined) {
  useMemo(() => {
    const offset = clockOffset(hhmm);
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
  }, [hhmm]);
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

function krovvi(id: string, says: string[], when: Date): Turn {
  return {
    id: `${id}:a`,
    role: 'assistant',
    createdAt: when,
    content: [{ type: 'text', text: says.map((s) => `<say>${s}</say>`).join('\n') }],
    metadata: { custom: { style: 'mixed', turnId: id } },
  };
}

/** A message Krovvi starts itself with one-tap answers under it (lib/agent/krovvi-first.ts), as the server files one. */
function checkIn(id: string, why: string, says: string[], choices: string[], when: Date): Turn {
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
    content: [{ type: 'text', text: says.map((s) => `<say>${s}</say>`).join('\n') }],
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

const says = (lines: string[]) => lines.map((s) => `<say>${s}</say>`).join('\n');

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

/** A live object's card under Krovvi's words, primed from the shared fixtures as the lab's apps are. */
function card(kind: keyof typeof FIXTURES, name: string): string {
  const f = (FIXTURES[kind] ?? []).find((x) => x.name === name) ?? FIXTURES[kind]?.[0];
  if (!f) return '';
  const id = primeFixture(general(f)).id;
  return `\n\n\`\`\`card\n${id}\n\`\`\`\n`;
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
    krovvi('site-hero-1', ["you've practised all week. you're ready.", "get some sleep. i'll check in after."], at(23, 42, 1)),
    checkIn(`site-hero-2-${run}`, 'Your interview today', ['hey. you made it through.', 'how did the interview go?'], ['it went great', 'it was okay', 'not great, honestly'], ago(2)),
  ];
}

function checkin(run: string): Turn[] {
  return [checkIn(`site-check-2-${run}`, 'Your early starts this week', ["you've had a long week.", 'how are you holding up?'], ['honestly, tired', 'pretty good', 'talk later?'], ago(1))];
}

const CHECK_REPLY = says(["then tonight's a couch night.", "want me to move tomorrow's 7am run to saturday, so you can sleep in?"]);

/** Two truths and a lie, all about them: the game as the server deals it (lib/agent/lab-games.ts), in the site's words. */
function play(run: string): Turn[] {
  const turns = gameTurns('en', 'truths', '', run || 'site');
  return turns.map((t, i) => {
    if (i === 0) return { ...t, content: [{ type: 'text' as const, text: "i'm bored" }] };
    if (i === 1) return { ...t, content: [{ type: 'text' as const, text: says(['two truths and a lie. all about you.', 'one of these i made up.']) }] };
    return t;
  });
}

/** The game's own reply to a move, in the site's words (no emoji), and the scripted reply otherwise. */
function playMoved() {
  const own = benchReply('en');
  return (move: Parameters<ReturnType<typeof benchReply>>[0], text: string): readonly LabStep[] | null => {
    if (move && move.game === 'two_truths' && move.right) return [700, says(["you got me. you'd never wake up at 6.", 'noted: nothing before 8.'])];
    return own(move, text);
  };
}

const VENT_ASK = 'worst day. my manager just presented my idea to the whole team like it was his';
const VENT_REPLY = says(['wait, the one you stayed late for all last week?', "that's not okay. i'd be furious too.", 'do you want to vent, or do you want a distraction?']);

const MEMORY_ASK = 'what should i get sara for her birthday?';
const MEMORY_REPLY = [
  '<say>pottery!</say>',
  '<say>you told me in june:</say>',
  '',
  '> sara keeps saying she wants to try pottery',
  '',
  '<say>there’s a beginners class near her on saturday mornings. want the link?</say>',
].join('\n');

const FRIENDS_ASK = 'plan game night with everyone';
function friendsReply(): LabStep[] {
  return [{ tool: 'objectMake', ms: 1100 }, ...streamed(says(['done. i asked everyone for you.', "friday at sam's is winning so far."])), 200, card('plan', 'game-night-en'), 900];
}

/** The jobs it takes off their list: each asked, done, and its live card under the answer. */
const HELP: Record<string, { ask: string; tool: string; words: string[]; kind: keyof typeof FIXTURES; fixture: string }> = {
  split: { ask: 'split the lisbon trip with everyone', tool: 'objectMake', words: ['done. split by the nights each of you stayed.', 'two payments settle everything.'], kind: 'split', fixture: 'lisbon-en' },
  meals: { ask: "what's for dinner this week?", tool: 'objectMake', words: ['tacos tonight. everyone swiped yes.', 'veggie curry is next. swipe if you want it.'], kind: 'meals', fixture: 'dinners-en' },
  money: { ask: 'am i spending too much this month?', tool: 'calculate', words: ["you're on track.", 'eating out is the one creeping up.'], kind: 'spending', fixture: 'rich-en' },
  trip: { ask: "what's left to do for lisbon?", tool: 'objectMake', words: ['almost everything is booked.', 'one tour to confirm, and half the packing.'], kind: 'trip', fixture: 'rich-en' },
  gift: { ask: "let's all chip in for maya's birthday gift", tool: 'objectMake', words: ['done. four of you are in so far.', 'two have paid. 60 to go.'], kind: 'gift', fixture: 'maya-en' },
  todo: { ask: 'what do i have today?', tool: 'objectMake', words: ['six for today. two done already.', 'want a nudge about the dentist at 2?'], kind: 'todo', fixture: 'day-en' },
};

function helpReply(task: string): LabStep[] {
  const h = HELP[task] ?? HELP.split;
  return [{ tool: h.tool, ms: 1100 }, ...streamed(says(h.words)), 200, card(h.kind, h.fixture), 900];
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

export default function LabSiteRoute() {
  const p = useLocalSearchParams<{ scene?: string; pick?: string; task?: string; run?: string; clock?: string }>();
  // first, so every time the scene makes reads the scene's own clock
  useClock(p.clock);
  const scene = p.scene ?? 'hero';
  const run = p.run ?? '';
  useBenchLanguage('en');
  // The status bar as the chat has it over Home (app/index.tsx): dark words on the light look, light on the dark.
  useEffect(() => {
    setStatusBarStyle(look.statusBar, false);
  }, [scene]);
  const { turns, replies, ask, moved } = useMemo(() => {
    switch (scene) {
      case 'vent':
        return { turns: [] as Turn[], replies: [[900, ...streamed(VENT_REPLY)]], ask: VENT_ASK, moved: undefined };
      case 'checkin':
        return { turns: checkin(run), replies: [[800, ...streamed(CHECK_REPLY)]], ask: undefined, moved: undefined };
      case 'play':
        return { turns: play(run), replies: [[600, ...streamed(says(['ha. again?']))]], ask: undefined, moved: playMoved() };
      case 'memory':
        return { turns: [] as Turn[], replies: [[1000, ...streamed(MEMORY_REPLY)]], ask: MEMORY_ASK, moved: undefined };
      case 'friends':
        return { turns: [] as Turn[], replies: [friendsReply()], ask: FRIENDS_ASK, moved: undefined };
      case 'help': {
        const task = p.task ?? 'split';
        return { turns: [] as Turn[], replies: [helpReply(task)], ask: (HELP[task] ?? HELP.split).ask, moved: undefined };
      }
      case 'hello':
        return { turns: helloTurns(), replies: [[700, ...streamed(says(['good one. i ask that too.']))]], ask: undefined, moved: undefined };
      default: {
        const pick = HERO_PICKS[p.pick ?? 'great'] ?? HERO_PICKS.great;
        return { turns: hero(run), replies: [[900, ...streamed(says(pick))]], ask: undefined, moved: undefined };
      }
    }
  }, [scene, run, p.pick, p.task, p.clock]);
  if (!__DEV__) return <Redirect href="/agent" />;
  return (
    <View style={styles.screen}>
      <ChatSky />
      <LabChat key={`${scene}|${run}|${p.pick ?? ''}|${p.task ?? ''}|${p.clock ?? ''}`} turns={turns} replies={replies} ask={ask} moved={moved} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.sky },
});
