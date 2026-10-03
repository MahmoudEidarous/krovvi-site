"use client";

/**
 * Habits on the page, drawn as the app draws its screen (catch8
 * src/components/objects/kinds/habits): each habit as a block with every
 * person's chain of the last four weeks and a plain count, and a tick on
 * each habit for the person reading, who checks only their own (the page
 * asks who they are first). No streak words, flames, points or badges.
 */

import { say, type Lang, type Words } from "@/lib/objects";
import { EASE, Face, INK, Section, STEP, Tick, tintOf } from "../kit";
import type { KindPage } from "../types";

type HabitDot = "done" | "open" | "rest" | "today" | "before";

/** The view as the core sends it (catch8 supabase/functions/_shared/objects/kinds/habits.ts HabitsView), the parts the page draws. */
interface Person {
  id: string;
  name: string;
  you: boolean;
  dots: HabitDot[];
  doneToday: boolean;
  inRow: number;
  more: boolean;
  last30: number;
  week?: { done: number; of: number };
}
interface Habit {
  id: string;
  name: string;
  every: "day" | "days" | "week";
  remind: string | null;
  often: Words;
  dueToday: boolean;
  people: Person[];
}
interface HabitsView {
  habits: Habit[];
  people: Array<{ id: string; name: string; you: boolean }>;
  you: { due: number; done: number } | null;
}

const C = {
  dayDot: { en: "Each dot is a day.", ar: "كل نقطة يوم." },
  today: { en: "Today", ar: "النهارده" },
  allDone: { en: "All done today", ar: "كله تم النهارده" },
  nothingDue: { en: "Nothing due today", ar: "مفيش حاجة عليك النهارده" },
  nothing: { en: "No habits yet", ar: "لسه مفيش عادات" },
  inARow: { en: "In a row", ar: "ورا بعض" },
  rest: { en: "Not due today", ar: "مش عليها النهارده" },
} satisfies Record<string, Words>;

function daysAr(n: number): string {
  if (n === 1) return "يوم";
  if (n === 2) return "يومين";
  return n <= 10 ? `${n} أيام` : `${n} يوم`;
}
function weeksAr(n: number): string {
  if (n === 1) return "أسبوع";
  if (n === 2) return "أسبوعين";
  return n <= 10 ? `${n} أسابيع` : `${n} أسبوع`;
}
function count(p: Person, weeks: boolean, lang: Lang): string {
  const plus = p.more ? "+" : "";
  if (lang === "ar") return `${weeks ? weeksAr(p.inRow) : daysAr(p.inRow)}${plus}`;
  return `${p.inRow}${plus} ${weeks ? (p.inRow === 1 ? "week" : "weeks") : p.inRow === 1 ? "day" : "days"}`;
}

/** One day: done filled in the person's tint, open an empty faint ring, rest small and dim, today a brighter ring. */
function DayDot({ state, size, tint }: { state: HabitDot; size: number; tint: string }) {
  if (state === "before") return <span style={{ width: size, height: size }} />;
  const done = state === "done";
  const rest = state === "rest";
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        boxSizing: "border-box",
        background: done ? tint : rest ? INK.track : "transparent",
        border: done || rest ? "none" : `${state === "today" ? 1.5 : 1.2}px solid ${state === "today" ? INK.fg : INK.faint}`,
        transform: `scale(${rest ? 0.45 : 1})`,
        transition: `background-color 240ms ${EASE}, transform 240ms ${EASE}`,
      }}
    />
  );
}

function Chain({ dots, tint }: { dots: HabitDot[]; tint: string }) {
  const all: HabitDot[][] = [];
  for (let i = 0; i < dots.length; i += 7) all.push(dots.slice(i, i + 7));
  // Whole weeks before the habit began are left out, so a new habit's chain starts at the face.
  const first = all.findIndex((w) => w.some((d) => d !== "before"));
  const weeks = first > 0 ? all.slice(first) : all;
  return (
    <span className="flex items-center" style={{ gap: 6 }} aria-hidden>
      {weeks.map((w, i) => (
        <span key={i} className="flex items-center" style={{ gap: 3 }}>
          {w.map((d, j) => (
            <DayDot key={j} state={d} size={6} tint={tint} />
          ))}
        </span>
      ))}
    </span>
  );
}

export const Page: KindPage = ({ view, lang, act, can, busy }) => {
  const v = view as HabitsView;
  const pact = v.people.length > 1;
  const checks = can("check");
  const me = v.people.find((p) => p.you) ?? null;
  // Today's habits for the reader: due today, done today, or a week habit with times still to go.
  const today = me
    ? v.habits.filter((h) => {
        const row = h.people.find((p) => p.id === me.id);
        return !!row && (h.dueToday || row.doneToday || (h.every === "week" && !!row.week && row.week.done < row.week.of));
      })
    : [];
  const headline = v.you && v.you.due ? (v.you.done >= v.you.due ? say(C.allDone, lang) : lang === "ar" ? `${v.you.done} من ${v.you.due} اتعملوا` : `${v.you.done} of ${v.you.due} done`) : say(C.nothingDue, lang);
  return (
    <div>
      {me && v.habits.length ? (
        <section className="mb-3 flex flex-col items-center" style={{ background: INK.surface, borderRadius: 17, padding: "20px 12px 22px", gap: 18 }}>
          <span className="flex flex-col items-center" style={{ gap: 2 }}>
            <span style={{ ...STEP.label, color: INK.muted }}>{say(C.today, lang)}</span>
            <span style={STEP.title}>{headline}</span>
          </span>
          {today.length ? (
            <div className="flex flex-wrap justify-center" style={{ rowGap: 16, columnGap: 8 }}>
              {today.map((h) => {
                const row = h.people.find((p) => p.id === me.id)!;
                return (
                  <div key={h.id} className="flex flex-col items-center" style={{ width: 96, gap: 8 }}>
                    <Tick
                      done={row.doneToday}
                      size={58}
                      label={lang === "ar" ? `علّم إن ${h.name} اتعملت النهارده` : `Mark ${h.name} done today`}
                      onClick={checks && !busy ? () => void act(row.doneToday ? "uncheck" : "check", { habit: h.id }) : undefined}
                    />
                    <span className="text-center" style={{ ...STEP.meta, color: row.doneToday ? INK.fg : INK.soft, maxWidth: 96, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      <bdi dir="auto">{h.name}</bdi>
                    </span>
                  </div>
                );
              })}
            </div>
          ) : null}
        </section>
      ) : null}

      {v.habits.map((h) => {
        const mine = h.people.find((p) => p.you);
        const people = mine ? [mine, ...h.people.filter((p) => p.id !== mine.id)] : h.people;
        const often = [say(h.often, lang), !h.dueToday && h.every !== "week" ? say(C.rest, lang) : null].filter(Boolean).join(" · ");
        return (
          <Section key={h.id}>
            <div className="flex items-end" style={{ gap: 12, padding: "14px 16px 6px" }}>
              <span className="min-w-0 flex-1">
                <span className="block" style={{ ...STEP.title }}>
                  <bdi dir="auto">{h.name}</bdi>
                </span>
                <span className="block" style={{ ...STEP.meta, color: INK.muted }}>
                  {often}
                </span>
              </span>
              <span style={{ ...STEP.meta, color: INK.muted, paddingBottom: 1 }}>{say(C.inARow, lang)}</span>
            </div>
            {people.map((p) => (
              <div key={p.id} className="flex items-center" style={{ gap: 10, padding: "7px 16px" }} aria-label={`${p.name}, ${count(p, h.every === "week", lang)}, ${p.last30}/30`}>
                {pact ? <Face name={p.name} size={22} /> : null}
                <Chain dots={p.dots} tint={pact ? tintOf(p.name) : INK.fg} />
                <span className="min-w-0 flex-1" style={{ ...STEP.label, color: p.inRow ? INK.fg : INK.muted, textAlign: "end", whiteSpace: "nowrap" }}>
                  {count(p, h.every === "week", lang)}
                </span>
              </div>
            ))}
          </Section>
        );
      })}

      <div className="text-center" style={{ ...STEP.meta, color: INK.muted, margin: "4px 0 12px" }}>
        {say(v.habits.length ? C.dayDot : C.nothing, lang)}
      </div>
    </div>
  );
};
