"use client";

/**
 * Fitness on the page for a buddy, as the ten apps keep it (catch8
 * supabase/functions/_shared/objects/kinds/workout.ts, 7 October 2026). A
 * buddy's copy holds one total a day (sessions, runs, minutes, what was
 * lifted, metres, steps) and the kudos, and never a session, a set or a run
 * (the core's shareSnap), so that is all there is to draw: the days trained
 * against the aim, the week's steps as a bar a day with its number over it,
 * this week's sums beside last week's, and Send kudos, the one thing a buddy
 * does. Every number is in the units the person trains in.
 */

import { useEffect, useState } from "react";

import { say, type Lang, type Words, iso } from "@/lib/objects";
import { FaceStack, INK, Section, STEP } from "../../kit";
import type { KindPage } from "../../types";
import { DayBars, Legend, Pairs, Stat, Stats, type Pair } from "../chart";
import { Wide } from "../sheet";
import { figure } from "../when";

/** Fitness's one colour (catch8 supabase/functions/_shared/objects/apps.ts): its bars, never its button. */
const TINT = "#EE9068";

/** A stretch of days added up, loads in the person's own unit. */
interface Sums {
  workouts: number;
  days: number;
  mins: number;
  volume: number;
  metres: number;
  steps: number;
}

/** The view as the core sends it to a buddy (WorkoutView with full false), the parts the page draws. */
export interface TotalsView {
  today: string;
  units: { weight: "kg" | "lb"; distance: "km" | "mi" };
  goals: { days: number | null; steps: number | null; far: number | null };
  steps: { count: number; goal: number | null } | null;
  week: { days: Array<{ day: string; label: Words; trained: boolean; today: boolean; steps: number }>; trained: number; goal: number | null };
  totals: { now: Sums; before: Sums };
  kudosFor: { id: string; day: string; sent: boolean; from: Array<{ id: string; name: string; you: boolean }> } | null;
}

/** The one change this page makes: kudos on the latest day trained (catch8 kinds/workout.ts kudos, which reads `day`). */
export const kudosCall = (day: string) => ({ op: "kudos", args: { day } });

/** Whether a view is the buddy's totals: the kind before the ten apps sent sessions and no sums. */
export function isTotals(view: unknown): view is TotalsView {
  const v = view as { totals?: { now?: unknown; before?: unknown }; week?: { days?: unknown } } | null;
  return !!v && !!v.totals && !!v.totals.now && !!v.totals.before && Array.isArray(v.week?.days);
}

/** The app's own words (catch8 src/components/objects/kinds/workout/copy.ts), so the page and the app say the same; the Arabic of totalsOnly alone is said in a way that fits anyone. */
const C = {
  daysTrained: { en: "Days trained", ar: "أيام تمرين" },
  thisWeekShort: { en: "this week", ar: "الأسبوع ده" },
  aimReached: { en: "this week, aim reached", ar: "الأسبوع ده، الهدف اتحقق" },
  stepsToday: { en: "Steps today", ar: "خطوات النهارده" },
  thisWeek: { en: "This week", ar: "الأسبوع ده" },
  workouts: { en: "Workouts", ar: "تمارين" },
  minutes: { en: "Minutes", ar: "دقايق" },
  lifted: { en: "Lifted", ar: "اترفع" },
  distance: { en: "Distance", ar: "المسافة" },
  steps: { en: "Steps", ar: "الخطوات" },
  stepsADay: { en: "Steps a day", ar: "خطوات كل يوم" },
  goal: { en: "Goal", ar: "الهدف" },
  dayTrained: { en: "A day trained", ar: "يوم تمرين" },
  totalsOnly: { en: "You see each day’s totals, not the sessions.", ar: "اللي بيظهر هنا مجموع كل يوم بس، مش التمارين نفسها." },
  sendKudos: { en: "Send kudos", ar: "ابعت تحية" },
  sentKudos: { en: "You sent kudos", ar: "بعتّ تحية" },
  nothingYet: { en: "No training yet", ar: "لسه مفيش تمرين" },
  nothingYetLine: { en: "The week shows here once there is a workout, a run or steps.", ar: "الأسبوع هيظهر هنا أول ما يبقى فيه تمرين أو جري أو خطوات." },
} satisfies Record<string, Words>;

const ofGoal = (goal: string): Words => ({ en: `of ${goal}`, ar: `من ${goal}` });
const daysOf = (n: number, aim: number): Words => ({ en: `${n} of ${aim}`, ar: `${n} من ${aim}` });
const lastWeekWas = (value: string): Words => ({ en: `last week ${value}`, ar: `الأسبوع اللي فات ${value}` });
const weightWord = (unit: "kg" | "lb"): Words => (unit === "lb" ? { en: "lb", ar: "رطل" } : { en: "kg", ar: "كيلو" });
const distanceWord = (unit: "km" | "mi"): Words => (unit === "mi" ? { en: "mi", ar: "ميل" } : { en: "km", ar: "كم" });

/** "Kudos from Leo", "Kudos from Leo and Mia", "Kudos from Leo and 3 more". */
function kudosFrom(raw: string[], lang: Lang): string {
  const n = raw.map(iso);
  if (lang === "ar") return `تحية من ${n.length === 1 ? n[0] : n.length === 2 ? `${n[0]} و${n[1]}` : `${n[0]} و${n.length - 1} كمان`}`;
  return `Kudos from ${n.length === 1 ? n[0] : n.length === 2 ? `${n[0]} and ${n[1]}` : `${n[0]} and ${n.length - 1} more`}`;
}

/** "5.05", "12.4", "20": a distance in the person's unit, as the app writes it. */
function distanceFigure(metres: number, unit: "km" | "mi"): string {
  const value = metres / (unit === "km" ? 1000 : 1609.344);
  const places = value >= 10 ? 1 : 2;
  return figure(Number(value.toFixed(places)), places).replace(/\.?0+$/, "");
}

export const Totals: KindPage = ({ page, view, lang, act, can }) => {
  const v = view as TotalsView;
  // The tap answers at once: the button gives way to "You sent kudos" before the server says yes, and comes back if it did not go through.
  const [sent, setSent] = useState(false);
  useEffect(() => setSent(false), [page.version]);

  const now = v.totals.now;
  const before = v.totals.before;
  const aim = v.week.goal;
  const dist = v.units.distance;
  const anySteps = v.week.days.some((d) => d.steps > 0);
  const empty = !now.workouts && !before.workouts && !now.steps && !before.steps && !v.kudosFor;
  const me = page.members.find((m) => m.you) ?? null;
  const youSent = sent || !!v.kudosFor?.sent;
  const mayKudos = can("kudos") && page.state === "live" && !!v.kudosFor && !youSent;
  const from = v.kudosFor ? [...v.kudosFor.from.map((k) => k.name), ...(sent && me && !v.kudosFor.from.some((k) => k.id === me.id) ? [me.name] : [])] : [];

  const kudos = async () => {
    if (!v.kudosFor) return;
    setSent(true);
    const call = kudosCall(v.kudosFor.day);
    if (!(await act(call.op, call.args))) setSent(false);
  };

  if (empty) {
    return (
      <section className="mb-3 flex flex-col items-center text-center" style={{ background: INK.surface, borderRadius: 17, padding: "28px 20px", gap: 6 }}>
        <span style={STEP.title}>{say(C.nothingYet, lang)}</span>
        <span style={{ ...STEP.meta, color: INK.muted }}>{say(C.nothingYetLine, lang)}</span>
      </section>
    );
  }

  const was = (value: string) => say(lastWeekWas(value), lang);
  const all: Pair[] = [
    { key: "workouts", name: say(C.workouts, lang), value: figure(now.workouts), now: now.workouts, before: before.workouts, beforeText: was(figure(before.workouts)) },
    { key: "mins", name: say(C.minutes, lang), value: figure(now.mins), now: now.mins, before: before.mins, beforeText: was(figure(before.mins)) },
    { key: "volume", name: say(C.lifted, lang), value: figure(now.volume), after: say(weightWord(v.units.weight), lang), now: now.volume, before: before.volume, beforeText: was(figure(before.volume)) },
    {
      key: "metres",
      name: say(C.distance, lang),
      value: distanceFigure(now.metres, dist),
      // With an aim for the week the number is said against it: "8 of 10 km".
      after: v.goals.far ? `${say(ofGoal(distanceFigure(v.goals.far, dist)), lang)} ${say(distanceWord(dist), lang)}` : say(distanceWord(dist), lang),
      now: now.metres,
      before: before.metres,
      beforeText: was(distanceFigure(before.metres, dist)),
    },
    { key: "steps", name: say(C.steps, lang), value: figure(now.steps), now: now.steps, before: before.steps, beforeText: was(figure(before.steps)) },
  ];
  // A thing with nothing in either week is left out: a runner's page has no "Lifted 0".
  const sums = all.filter((s) => s.now > 0 || s.before > 0);
  const reached = !!aim && v.week.trained >= aim;

  return (
    <div>
      <section className="mb-3 flex flex-col" style={{ background: INK.surface, borderRadius: 17, padding: "18px 16px 16px", gap: 18 }}>
        <Stats>
          {/* Short of the aim the days are said against it; at or past it they stand alone ("6", never "6 of 5"), as the app says them. */}
          <Stat name={say(C.daysTrained, lang)} value={aim && !reached ? say(daysOf(v.week.trained, aim), lang) : String(v.week.trained)} sub={say(reached ? C.aimReached : C.thisWeekShort, lang)} />
          {v.steps && v.steps.count > 0 ? <Stat end name={say(C.stepsToday, lang)} value={figure(v.steps.count)} sub={v.steps.goal ? say(ofGoal(figure(v.steps.goal)), lang) : null} /> : null}
        </Stats>
        {anySteps ? (
          <DayBars
            tint={TINT}
            goal={v.goals.steps}
            label={say(C.stepsADay, lang)}
            bars={v.week.days.map((d) => ({
              key: d.day,
              label: say(d.label, lang),
              value: d.steps,
              text: d.steps > 0 ? figure(d.steps) : null,
              says: `${say(d.label, lang)}: ${figure(d.steps)}${d.trained ? `, ${say(C.dayTrained, lang)}` : ""}`,
              now: d.today,
              mark: d.trained,
            }))}
          />
        ) : (
          // No steps this week: the days alone, a filled dot for each one trained.
          <div className="flex justify-between" role="img" aria-label={`${say(C.daysTrained, lang)}: ${v.week.days.filter((d) => d.trained).map((d) => say(d.label, lang)).join(lang === "ar" ? "، " : ", ")}`}>
            {v.week.days.map((d) => (
              <div key={d.day} className="flex min-w-0 flex-1 flex-col items-center" style={{ gap: 8 }} aria-hidden>
                <span style={{ width: 12, height: 12, borderRadius: "50%", boxSizing: "border-box", background: d.trained ? INK.fg : "transparent", border: d.trained ? "none" : `1.5px solid ${d.today ? INK.soft : INK.faint}`, opacity: d.trained || d.today ? 1 : 0.55 }} />
                <span style={{ ...STEP.meta, color: d.today ? INK.fg : INK.muted }}>{say(d.label, lang)}</span>
              </div>
            ))}
          </div>
        )}
        <Legend
          tint={TINT}
          items={[
            ...(anySteps ? [{ sample: "bar" as const, text: say(C.stepsADay, lang) }] : []),
            ...(anySteps && v.goals.steps ? [{ sample: "dash" as const, text: `${say(C.goal, lang)} ${figure(v.goals.steps)}` }] : []),
            { sample: "dot" as const, text: say(C.dayTrained, lang) },
          ]}
        />
      </section>

      {mayKudos ? (
        <div className="mb-3">
          <Wide strong text={say(C.sendKudos, lang)} onClick={() => void kudos()} />
        </div>
      ) : null}
      {from.length || youSent ? (
        <p className="mb-3 flex items-center justify-center" style={{ ...STEP.meta, color: INK.muted, gap: 8, padding: "2px 0 4px" }}>
          {from.length ? <FaceStack names={from} size={22} max={5} /> : null}
          <span>{youSent ? say(C.sentKudos, lang) : kudosFrom(from, lang)}</span>
        </p>
      ) : null}

      {sums.length ? (
        <Section title={say(C.thisWeek, lang)}>
          <Pairs rows={sums} tint={TINT} />
        </Section>
      ) : null}

      <p className="text-center" style={{ ...STEP.meta, color: INK.faint, margin: "4px 16px 12px" }}>
        {say(C.totalsOnly, lang)}
      </p>
    </div>
  );
};
