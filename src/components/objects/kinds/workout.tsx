"use client";

/**
 * Workout on the page, drawn as the app draws its screen (catch8
 * src/components/objects/kinds/workout): the latest session (its name and
 * day, exercises, sets and what was lifted, a new best in bone, each
 * exercise once with everything done in it and a dot per set), or the latest
 * run (distance, time, pace, its route); the week against the aim; the
 * bests; and Send kudos, the one button a buddy has.
 */

import { say, type Lang, type Words, iso } from "@/lib/objects";
import { DotLine, FaceStack, INK, Pill, Row, Section, STEP, type Dot } from "../kit";
import type { KindPage } from "../types";

/** The view as the core sends it (catch8 supabase/functions/_shared/objects/kinds/workout.ts WorkoutView), the parts the page draws. */
interface Line {
  id: string;
  exercise: string;
  sets: number;
  words: Words;
  best: boolean;
}
interface Session {
  type: "session";
  id: string;
  name: string;
  day: string;
  time: string;
  dayWords: Words;
  lines: Line[];
  volume: number;
  kudos: Array<{ id: string; name: string }>;
}
interface Run {
  type: "run";
  id: string;
  sport: string;
  name: string | null;
  day: string;
  time: string;
  metres: number | null;
  secs: number | null;
  words: Words;
  pace: Words | null;
  dayWords: Words;
  best: boolean;
  kudos: Array<{ id: string; name: string }>;
}
interface WorkoutView {
  today: string;
  units: { weight: "kg" | "lb"; distance: "km" | "mi" };
  week: { days: Array<{ day: string; label: Words; trained: boolean; today: boolean }>; trained: number; goal: number | null };
  latest: Session | Run | null;
  recent: Array<Session | Run>;
  bests: Array<{ key: string; name: string; words: Words; fresh: boolean }>;
  kudosFor: { id: string; sent: boolean } | null;
}

const C = {
  week: { en: "Last 7 days", ar: "آخر 7 أيام" },
  bests: { en: "Bests", ar: "الأرقام القياسية" },
  recent: { en: "Before", ar: "اللي قبل كده" },
  kudos: { en: "Send kudos", ar: "ابعت تحية" },
  sent: { en: "You sent kudos", ar: "بعتّ تحية" },
  nothing: { en: "Nothing logged yet", ar: "لسه مفيش تمرين متسجل" },
  best: { en: "Best", ar: "رقم قياسي" },
  newBest: { en: "New best", ar: "رقم قياسي جديد" },
  fresh: { en: "New", ar: "جديد" },
  exercises: { en: "Exercises", ar: "تمارين" },
  sets: { en: "Sets", ar: "مجموعات" },
  time: { en: "Time", ar: "الوقت" },
  pace: { en: "Pace", ar: "السرعة" },
  then: { en: ", then ", ar: "، وبعدها " },
} satisfies Record<string, Words>;

const SPORT: Record<string, Words> = {
  run: { en: "Run", ar: "جري" },
  walk: { en: "Walk", ar: "مشي" },
  ride: { en: "Ride", ar: "عجلة" },
  swim: { en: "Swim", ar: "سباحة" },
  row: { en: "Row", ar: "تجديف" },
  hike: { en: "Hike", ar: "هايكنج" },
};

const sep = (lang: Lang) => (lang === "ar" ? "، " : ", ");
const fold = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

function clock(secs: number): string {
  const s = Math.round(secs);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
}

/** "7:40 AM", "7:40 م": a session's clock time. */
function timeLabel(time: string, lang: Lang): string {
  const [h, m] = time.split(":").map(Number);
  const twelve = ((h + 11) % 12) + 1;
  return lang === "ar" ? `${twelve}:${String(m).padStart(2, "0")} ${h < 12 ? "ص" : "م"}` : `${twelve}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

/** Inside the last week: a best set then is a new one. */
function fresh(day: string, today: string): boolean {
  const ms = (d: string) => Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, Number(d.slice(8, 10)));
  return ms(today) - ms(day) < 7 * 86_400_000;
}

/** Each exercise once, however many times it was said, with every line of it in order. */
function groupsOf(s: Session, lang: Lang) {
  const out: Array<{ key: string; exercise: string; lines: Line[]; sets: number; best: boolean; words: string }> = [];
  for (const l of s.lines) {
    const key = fold(l.exercise) || l.id;
    const g = out.find((x) => x.key === key);
    if (g) {
      g.lines.push(l);
      g.sets += l.sets;
      g.best = g.best || l.best;
    } else out.push({ key, exercise: l.exercise, lines: [l], sets: l.sets, best: l.best, words: "" });
  }
  for (const g of out) g.words = g.lines.map((l) => say(l.words, lang)).join(say(C.then, lang));
  return out;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center" style={{ minWidth: 72, gap: 1 }}>
      <span style={{ ...STEP.meta, color: INK.muted }}>{label}</span>
      <span style={STEP.title}>{value}</span>
    </div>
  );
}

function SessionHero({ s, v, lang }: { s: Session; v: WorkoutView; lang: Lang }) {
  const groups = groupsOf(s, lang);
  const sets = groups.reduce((n, g) => n + g.sets, 0);
  const isFresh = fresh(s.day, v.today);
  return (
    <div className="flex flex-col" style={{ gap: 18 }}>
      <div className="flex flex-col items-center" style={{ gap: 2 }}>
        <bdi style={{ ...STEP.title, fontSize: 22, lineHeight: "28px" }} dir="auto">
          {s.name}
        </bdi>
        <span style={{ ...STEP.meta, color: INK.muted }}>{`${say(s.dayWords, lang)}${sep(lang)}${timeLabel(s.time, lang)}`}</span>
      </div>
      <div className="flex justify-center" style={{ gap: 32 }}>
        <Stat label={say(C.exercises, lang)} value={String(groups.length)} />
        <Stat label={say(C.sets, lang)} value={String(sets)} />
        {s.volume ? <Stat label={v.units.weight === "kg" ? (lang === "ar" ? "كجم اترفعوا" : "kg lifted") : lang === "ar" ? "رطل اترفعوا" : "lb lifted"} value={s.volume.toLocaleString("en-US")} /> : null}
      </div>
      <div className="flex flex-col" style={{ gap: 12 }}>
        {groups.map((g) => (
          <div key={g.key} className="flex items-center" style={{ gap: 12 }} aria-label={`${g.exercise}, ${g.words}`}>
            <span className="min-w-0 flex-1">
              <span className="flex items-center" style={{ gap: 8 }}>
                <span style={STEP.body}>
                  <bdi dir="auto">{g.exercise}</bdi>
                </span>
                {g.best ? <span style={{ ...STEP.meta, color: INK.pick, fontWeight: 600 }}>{say(isFresh ? C.newBest : C.best, lang)}</span> : null}
              </span>
              <span className="block" style={{ ...STEP.meta, color: INK.muted }}>
                {g.words}
              </span>
            </span>
            <DotLine dots={Array.from({ length: Math.min(g.sets, 10) }, () => ({ on: true, tint: INK.fg }))} dot={9} gap={5} />
          </div>
        ))}
      </div>
    </div>
  );
}

function RunHero({ r, v, lang }: { r: Run; v: WorkoutView; lang: Lang }) {
  const per = v.units.distance === "km" ? 1000 : 1609.344;
  const units = r.metres ? r.metres / per : 0;
  const whole = Math.floor(units);
  const part = units - whole;
  const dots: Dot[] = [
    ...Array.from({ length: Math.min(whole, 42) }, () => ({ on: true, tint: INK.fg })),
    ...(part >= 0.1 && whole < 42 ? [{ on: Math.max(0.35, part), tint: INK.fg }] : []),
  ];
  const shown = units ? Number(units.toFixed(units >= 10 ? 1 : 2)).toString() : null;
  return (
    <div className="flex flex-col items-center" style={{ gap: 16 }} aria-label={`${say(r.words, lang)}${r.pace ? `, ${say(r.pace, lang)}` : ""}`}>
      <div className="flex flex-col items-center" style={{ gap: 2 }}>
        <span style={{ ...STEP.title, fontSize: 22, lineHeight: "28px" }}>{r.name ?? say(SPORT[r.sport] ?? SPORT.run, lang)}</span>
        <span style={{ ...STEP.meta, color: INK.muted }}>{`${say(r.dayWords, lang)}${sep(lang)}${timeLabel(r.time, lang)}`}</span>
        {shown ? (
          <span dir="ltr" className="inline-flex items-baseline" style={{ gap: 6, marginTop: 10 }}>
            <span style={{ ...STEP.display, fontSize: 48, lineHeight: "54px" }}>{shown}</span>
            <span style={{ ...STEP.title, color: INK.muted }}>{v.units.distance === "km" ? (lang === "ar" ? "كم" : "km") : lang === "ar" ? "ميل" : "mi"}</span>
          </span>
        ) : null}
        {r.best ? <span style={{ ...STEP.label, color: INK.pick }}>{say(C.newBest, lang)}</span> : null}
      </div>
      {r.secs || r.pace ? (
        <div className="flex justify-center" style={{ gap: 32 }}>
          {r.secs ? <Stat label={say(C.time, lang)} value={clock(r.secs)} /> : null}
          {r.pace ? <Stat label={say(C.pace, lang)} value={say(r.pace, lang)} /> : null}
        </div>
      ) : null}
      {dots.length ? <DotLine dots={dots} dot={11} gap={8} /> : null}
    </div>
  );
}

/** "Kudos from Leo", "Kudos from Leo and 3 more". */
function kudosFrom(raw: string[], lang: Lang): string {
  const names = raw.map(iso);
  const two = (a: string, b: string) => (lang === "ar" ? `${a} و${b}` : `${a} and ${b}`);
  const who = names.length === 1 ? names[0] : names.length === 2 ? two(names[0], names[1]) : lang === "ar" ? `${names[0]} و${names.length - 1} كمان` : `${names[0]} and ${names.length - 1} more`;
  return lang === "ar" ? `تحية من ${who}` : `Kudos from ${who}`;
}

/** "2 days trained, aiming for 4", "4 days trained, aim reached". */
function trained(n: number, aim: number | null, lang: Lang): string {
  if (lang === "ar") {
    const base = n === 1 ? "اتمرنت يوم" : n === 2 ? "اتمرنت يومين" : `اتمرنت ${n} أيام`;
    return aim ? (n >= aim ? `${base}، وصلت للهدف` : `${base}، الهدف ${aim}`) : base;
  }
  const base = `${n} ${n === 1 ? "day" : "days"} trained`;
  return aim ? (n >= aim ? `${base}, aim reached` : `${base}, aiming for ${aim}`) : base;
}

export const Page: KindPage = ({ view, lang, act, can, busy }) => {
  const v = view as WorkoutView;
  const latest = v.latest;
  const mayKudos = can("kudos") && v.kudosFor && !v.kudosFor.sent;
  const groups: Array<{ name: string; words: string[]; fresh: boolean }> = [];
  for (const b of v.bests) {
    const g = groups.find((x) => x.name === b.name);
    if (g) {
      g.words.push(say(b.words, lang));
      g.fresh = g.fresh || b.fresh;
    } else groups.push({ name: b.name, words: [say(b.words, lang)], fresh: b.fresh });
  }
  return (
    <div>
      <section className="mb-3 flex flex-col" style={{ background: INK.surface, borderRadius: 17, padding: "22px 16px 20px", gap: 18 }}>
        {latest ? latest.type === "session" ? <SessionHero s={latest} v={v} lang={lang} /> : <RunHero r={latest} v={v} lang={lang} /> : <span className="text-center" style={{ ...STEP.body, color: INK.muted }}>{say(C.nothing, lang)}</span>}
        {latest && (latest.kudos.length || mayKudos || v.kudosFor?.sent) ? (
          <div className="flex items-center justify-between">
            {latest.kudos.length ? (
              <span className="flex min-w-0 items-center" style={{ gap: 8 }}>
                <FaceStack names={latest.kudos.map((k) => k.name)} size={24} />
                <span className="truncate" style={{ ...STEP.meta, color: INK.muted }}>{kudosFrom(latest.kudos.map((k) => k.name), lang)}</span>
              </span>
            ) : (
              <span />
            )}
            {mayKudos ? <Pill text={say(C.kudos, lang)} strong disabled={busy} onClick={() => void act("kudos", { to: v.kudosFor!.id })} /> : v.kudosFor?.sent ? <span style={{ ...STEP.meta, color: INK.muted }}>{say(C.sent, lang)}</span> : null}
          </div>
        ) : null}
      </section>

      <Section title={say(C.week, lang)}>
        <div className="flex justify-between" style={{ padding: "6px 12px 6px" }}>
          {v.week.days.map((d) => (
            <div key={d.day} className="flex flex-col items-center" style={{ gap: 6, minWidth: 36 }}>
              <DotLine dots={[{ on: d.trained, tint: INK.fg, now: d.today && !d.trained }]} dot={12} />
              <span style={{ ...STEP.meta, color: d.today ? INK.fg : INK.muted }}>{say(d.label, lang)}</span>
            </div>
          ))}
        </div>
        <div style={{ ...STEP.meta, color: INK.muted, padding: "8px 16px 12px", borderTop: `0.5px solid ${INK.line}` }}>{trained(v.week.trained, v.week.goal, lang)}</div>
      </Section>

      {groups.length ? (
        <Section title={say(C.bests, lang)}>
          {groups.slice(0, 12).map((g, i) => (
            <Row key={g.name} first={i === 0} title={g.name} sub={g.words.join(sep(lang))} value={g.fresh ? <span style={{ ...STEP.meta, color: INK.pick, fontWeight: 600 }}>{say(C.fresh, lang)}</span> : undefined} />
          ))}
        </Section>
      ) : null}

      {v.recent.length > 1 ? (
        <Section title={say(C.recent, lang)}>
          {v.recent
            .filter((r) => r.id !== latest?.id)
            .slice(0, 10)
            .map((r, i) => (
              <Row
                key={r.id}
                first={i === 0}
                title={r.type === "session" ? r.name : say(r.words, lang)}
                sub={r.type === "session" ? groupsOf(r, lang).map((g) => g.exercise).join(sep(lang)) : r.pace ? say(r.pace, lang) : null}
                value={<span style={{ ...STEP.meta, color: INK.muted }}>{say(r.dayWords, lang)}</span>}
              />
            ))}
        </Section>
      ) : null}
    </div>
  );
};
