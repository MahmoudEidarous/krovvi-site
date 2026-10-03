"use client";

/**
 * Workout on the page, drawn as the app draws its screen (catch8
 * src/components/objects/kinds/workout): the latest session as rows with a
 * dot per set (bone where a line holds a best), or the latest run as its
 * route of dots; the week; the bests, one row per exercise; and Send kudos,
 * the one button a buddy has, once per session or run.
 */

import { say, type Lang, type Words } from "@/lib/objects";
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
  dayWords: Words;
  lines: Line[];
  volume: number;
  kudos: Array<{ id: string; name: string }>;
}
interface Run {
  type: "run";
  id: string;
  metres: number | null;
  secs: number | null;
  words: Words;
  pace: Words | null;
  dayWords: Words;
  best: boolean;
  kudos: Array<{ id: string; name: string }>;
}
interface WorkoutView {
  units: { weight: "kg" | "lb"; distance: "km" | "mi" };
  week: { days: Array<{ day: string; label: Words; trained: boolean; today: boolean }>; trained: number; goal: number | null };
  latest: Session | Run | null;
  recent: Array<Session | Run>;
  bests: Array<{ key: string; name: string; words: Words; fresh: boolean }>;
  kudosFor: { id: string; sent: boolean } | null;
}

const C = {
  setDot: { en: "Each dot is a set. A bone dot is a line that holds a best.", ar: "كل نقطة مجموعة. النقطة البيج سطر فيه رقم قياسي." },
  kmDot: { en: "Each dot is a kilometre.", ar: "كل نقطة كيلومتر." },
  miDot: { en: "Each dot is a mile.", ar: "كل نقطة ميل." },
  week: { en: "Last 7 days", ar: "آخر 7 أيام" },
  bests: { en: "Bests", ar: "الأرقام القياسية" },
  recent: { en: "Recent", ar: "اللي فات" },
  kudos: { en: "Send kudos", ar: "ابعت تحية" },
  sent: { en: "You sent kudos", ar: "بعتّ تحية" },
  nothing: { en: "Nothing logged yet", ar: "لسه مفيش تمرين متسجل" },
} satisfies Record<string, Words>;

const sep = (lang: Lang) => (lang === "ar" ? "، " : ", ");

function clock(secs: number): string {
  const s = Math.round(secs);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
}

function SessionHero({ s, v, lang }: { s: Session; v: WorkoutView; lang: Lang }) {
  return (
    <div className="flex flex-col" style={{ gap: 16 }}>
      <div className="flex flex-col items-center" style={{ gap: 2 }}>
        <bdi style={{ ...STEP.title }} dir="auto">
          {s.name}
        </bdi>
        <span style={{ ...STEP.meta, color: INK.muted }}>{say(s.dayWords, lang)}</span>
        {s.volume ? (
          <>
            <span style={{ ...STEP.display, fontSize: 44, lineHeight: "50px", marginTop: 8 }}>{s.volume.toLocaleString("en-US")}</span>
            <span style={{ ...STEP.meta, color: INK.muted }}>{v.units.weight === "kg" ? (lang === "ar" ? "كجم اترفعوا" : "kg lifted") : lang === "ar" ? "رطل اترفعوا" : "lb lifted"}</span>
          </>
        ) : null}
      </div>
      <div className="flex flex-col" style={{ gap: 8 }}>
        {s.lines.map((l) => (
          <div key={l.id} className="flex items-center" style={{ gap: 12 }} aria-label={`${l.exercise}, ${say(l.words, lang)}`}>
            <span className="min-w-0 flex-1">
              <span className="block" style={{ ...STEP.body }}>
                <bdi dir="auto">{l.exercise}</bdi>
              </span>
              <span className="block" style={{ ...STEP.meta, color: INK.muted }}>
                {say(l.words, lang)}
              </span>
            </span>
            <DotLine dots={Array.from({ length: Math.min(l.sets, 12) }, () => ({ on: true, tint: l.best ? INK.pick : INK.fg }))} dot={10} gap={6} />
          </div>
        ))}
      </div>
      <span className="text-center" style={{ ...STEP.meta, color: INK.muted }}>
        {say(C.setDot, lang)}
      </span>
    </div>
  );
}

function RunHero({ r, v, lang }: { r: Run; v: WorkoutView; lang: Lang }) {
  const per = v.units.distance === "km" ? 1000 : 1609.344;
  const units = r.metres ? r.metres / per : 0;
  const whole = Math.floor(units);
  const part = units - whole;
  const dots: Dot[] = [
    ...Array.from({ length: Math.min(whole, 42) }, () => ({ on: true, tint: r.best ? INK.pick : INK.fg })),
    ...(part >= 0.1 && whole < 42 ? [{ on: Math.max(0.35, part), tint: r.best ? INK.pick : INK.fg }] : []),
  ];
  const shown = units ? Number(units.toFixed(units >= 10 ? 1 : 2)).toString() : null;
  return (
    <div className="flex flex-col items-center" style={{ gap: 14 }} aria-label={`${say(r.words, lang)}${r.pace ? `, ${say(r.pace, lang)}` : ""}`}>
      <span style={{ ...STEP.title }}>{say(r.dayWords, lang)}</span>
      {shown ? (
        <span dir="ltr" className="inline-flex items-baseline" style={{ gap: 6 }}>
          <span style={{ ...STEP.display, fontSize: 44, lineHeight: "50px" }}>{shown}</span>
          <span style={{ ...STEP.title, color: INK.muted }}>{v.units.distance === "km" ? (lang === "ar" ? "كم" : "km") : lang === "ar" ? "ميل" : "mi"}</span>
        </span>
      ) : null}
      <span style={{ ...STEP.body, color: INK.soft }}>{[r.secs ? clock(r.secs) : null, r.pace ? say(r.pace, lang) : null].filter(Boolean).join(sep(lang))}</span>
      <DotLine dots={dots} dot={12} gap={8} />
      <span style={{ ...STEP.meta, color: INK.muted }}>{say(v.units.distance === "km" ? C.kmDot : C.miDot, lang)}</span>
    </div>
  );
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
      <section className="mb-3 flex flex-col" style={{ background: INK.surface, borderRadius: 17, padding: "22px 16px", gap: 16 }}>
        {latest ? latest.type === "session" ? <SessionHero s={latest} v={v} lang={lang} /> : <RunHero r={latest} v={v} lang={lang} /> : <span className="text-center" style={{ ...STEP.body, color: INK.muted }}>{say(C.nothing, lang)}</span>}
        {latest && (latest.kudos.length || mayKudos || v.kudosFor?.sent) ? (
          <div className="flex items-center justify-between">
            {latest.kudos.length ? <FaceStack names={latest.kudos.map((k) => k.name)} size={24} /> : <span />}
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
        <div style={{ ...STEP.meta, color: INK.muted, padding: "8px 16px 12px", borderTop: `0.5px solid ${INK.line}` }}>
          {lang === "ar" ? `${v.week.trained} من 7 أيام${v.week.goal ? `، الهدف ${v.week.goal}` : ""}` : `${v.week.trained} of 7 days${v.week.goal ? `, aim ${v.week.goal}` : ""}`}
        </div>
      </Section>

      {groups.length ? (
        <Section title={say(C.bests, lang)}>
          {groups.slice(0, 12).map((g, i) => (
            <Row key={g.name} first={i === 0} title={g.name} sub={g.words.join(sep(lang))} value={g.fresh ? <DotLine dots={[{ on: true, tint: INK.pick }]} dot={8} /> : undefined} />
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
                sub={r.type === "session" ? r.lines.map((l) => l.exercise).join(sep(lang)) : r.pace ? say(r.pace, lang) : null}
                value={<span style={{ ...STEP.meta, color: INK.muted }}>{say(r.dayWords, lang)}</span>}
              />
            ))}
        </Section>
      ) : null}
    </div>
  );
};
