"use client";

/**
 * Food on the page, drawn as the app draws its screen (catch8
 * src/components/objects/kinds/food): the plate as the hero, the last seven
 * days, and the cheers with the one button a buddy has. Whoever opens the
 * link is never the owner, so the view holds the day's totals and never a
 * meal (the core's shareSnap): there is nothing here that could draw one.
 */

import { say, type Lang, type Words, iso } from "@/lib/objects";
import { DotRing, FaceStack, INK, Pill, Row, Section, STEP, type Dot } from "../kit";
import type { KindPage } from "../types";

/** The view as the core sends it (catch8 supabase/functions/_shared/objects/kinds/food.ts FoodView), the parts the page draws. */
interface FoodRing {
  dots: number;
  filled: number;
  perDot: number;
}
interface FoodView {
  full: boolean;
  goal: { kcal: number | null; protein: number | null };
  totals: { kcal: number; protein: number };
  ring: FoodRing;
  inner: FoodRing | null;
  week: Array<{ day: string; label: Words; kcal: number; protein: number; logged: boolean; today: boolean }>;
  cheers: Array<{ id: string; name: string; you: boolean }>;
  youCheered: boolean;
  words: { kcal: Words; protein: Words | null; left: Words | null };
}

const C = {
  kcal: { en: "kcal", ar: "سعرة" },
  left: { en: "kcal left", ar: "سعرة فاضلة" },
  today: { en: "kcal today", ar: "سعرة النهارده" },
  eaten: { en: "Eaten", ar: "أكل" },
  goal: { en: "Goal", ar: "الهدف" },
  aDay: { en: "kcal a day", ar: "سعرة في اليوم" },
  protein: { en: "Protein", ar: "بروتين" },
  reached: { en: "Protein goal reached", ar: "هدف البروتين اتحقق" },
  g: { en: "g", ar: "جم" },
  week: { en: "Last 7 days", ar: "آخر 7 أيام" },
  cheers: { en: "Cheers", ar: "تشجيع" },
  cheered: { en: "You cheered today", ar: "بعتّ تشجيع النهارده" },
  nothing: { en: "Nothing yet today", ar: "لسه مفيش أكل النهارده" },
  totalsOnly: { en: "You see the day’s totals, not the meals.", ar: "بتشوف مجموع اليوم بس، مش الأكل نفسه." },
} satisfies Record<string, Words>;

const fig = (n: number) => Math.round(n).toLocaleString("en-US");

/** Positions rounded to a hundredth of a pixel, as the kit's rings are, so the page hydrates clean. */
const px = (n: number) => Math.round(n * 100) / 100;

function ringDots(r: FoodRing, tint: string): Dot[] {
  const lit = Math.min(r.filled, r.dots);
  return Array.from({ length: r.dots }, (_, i) => ({ on: i < lit, tint }));
}

/** The plate's one number: what is left of today's goal while there is some, else the day's total (never an "over"). */
function middleOf(v: FoodView): { value: number; caption: Words } {
  const goal = v.goal.kcal;
  if (goal !== null && v.totals.kcal < goal) return { value: goal - v.totals.kcal, caption: C.left };
  return { value: v.totals.kcal, caption: C.today };
}

/** "Cheered by Sam", "Cheered by Sam and Lina", "Cheered by Sam and 3 more". */
function cheeredBy(raw: string[], lang: Lang): string {
  const names = raw.map(iso);
  if (lang === "ar") return `اتشجّع من ${names.length === 1 ? names[0] : names.length === 2 ? `${names[0]} و${names[1]}` : `${names[0]} و${names.length - 1} كمان`}`;
  return `Cheered by ${names.length === 1 ? names[0] : names.length === 2 ? `${names[0]} and ${names[1]}` : `${names[0]} and ${names.length - 1} more`}`;
}

/** The plate: kcal dots around (past the goal they go round again just inside, in soft ink), protein in bone inside, the one number in the middle. */
function Plate({ v, size, outer, inner, lang }: { v: FoodView; size: number; outer: number; inner: number; lang: Lang }) {
  const over = Math.max(0, v.ring.filled - v.ring.dots);
  const lapR = size / 2 - outer * 2.4;
  const insetInner = Math.round(outer * 2.4 + (over ? outer * 1.6 : 4));
  const m = middleOf(v);
  return (
    <div style={{ position: "relative", width: size, height: size }} role="img" aria-label={`${say(v.words.kcal, lang)}${v.words.protein ? `. ${say(v.words.protein, lang)}` : ""}`}>
      <DotRing size={size} dots={ringDots(v.ring, INK.fg)} dot={outer} />
      {Array.from({ length: Math.min(over, v.ring.dots) }, (_, i) => {
        const a = -Math.PI / 2 + (i / v.ring.dots) * Math.PI * 2;
        const d = Math.max(3, outer - 2);
        return <span key={i} aria-hidden style={{ position: "absolute", left: px(size / 2 + Math.cos(a) * lapR - d / 2), top: px(size / 2 + Math.sin(a) * lapR - d / 2), width: d, height: d, borderRadius: "50%", background: INK.soft }} />;
      })}
      {v.inner ? (
        <div style={{ position: "absolute", inset: 0 }}>
          <DotRing size={size} dots={ringDots(v.inner, INK.pick)} dot={inner} inset={insetInner} />
        </div>
      ) : null}
      <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden>
        <span style={STEP.display}>{fig(m.value)}</span>
        <span style={{ ...STEP.label, color: INK.muted }}>{say(m.caption, lang)}</span>
      </div>
    </div>
  );
}

/** Under the plate: eaten against the goal in the outer ring's ivory, protein in the inner ring's bone. */
function Stats({ v, lang }: { v: FoodView; lang: Lang }) {
  const g = v.goal;
  const showProtein = g.protein !== null || v.totals.protein > 0;
  const stat = (label: string, figure: string, under: string, color: string = INK.fg) => (
    <div className="flex flex-col items-center" style={{ minWidth: 96, gap: 1 }}>
      <span style={{ ...STEP.meta, color: INK.muted }}>{label}</span>
      <span style={{ ...STEP.title, color }}>{figure}</span>
      <span style={{ ...STEP.meta, color: INK.muted }}>{under}</span>
    </div>
  );
  if (g.kcal === null && !showProtein) return null;
  const reached = g.protein !== null && v.totals.protein >= g.protein;
  return (
    <div className="flex justify-center" style={{ gap: 40, alignSelf: "stretch" }}>
      {g.kcal !== null && v.totals.kcal < g.kcal
        ? stat(say(C.eaten, lang), fig(v.totals.kcal), lang === "ar" ? `من ${fig(g.kcal)} سعرة` : `of ${fig(g.kcal)} kcal`)
        : g.kcal !== null
          ? stat(say(C.goal, lang), fig(g.kcal), say(C.aDay, lang))
          : null}
      {showProtein
        ? stat(say(reached ? C.reached : C.protein, lang), `${fig(v.totals.protein)} ${say(C.g, lang)}`, g.protein !== null ? (lang === "ar" ? `من ${fig(g.protein)} جم` : `of ${fig(g.protein)} g`) : " ", INK.pick)
        : null}
    </div>
  );
}

export const Page: KindPage = ({ page, view, lang, act, can, busy }) => {
  const v = view as FoodView;
  const owner = page.members.find((m) => m.role === "owner")?.name ?? "";
  const mayCheer = can("cheer") && !v.youCheered;
  const past = v.week.filter((d) => d.logged && !d.today);
  const usual = past.length >= 3 ? Math.round(past.reduce((sum, d) => sum + d.kcal, 0) / past.length / 50) * 50 : null;
  return (
    <div>
      <section className="mb-3 flex flex-col items-center" style={{ background: INK.surface, borderRadius: 17, padding: "24px 16px 20px", gap: 18 }}>
        <Plate v={v} size={248} outer={9} inner={8} lang={lang} />
        <Stats v={v} lang={lang} />
      </section>

      <Section>
        <Row first title={say(v.week.at(-1)?.logged ? C.totalsOnly : C.nothing, lang)} muted />
      </Section>

      <Section title={say(C.week, lang)}>
        <div className="flex justify-between" style={{ padding: "6px 12px 14px" }}>
          {v.week.map((d) => {
            const round = v.goal.kcal ?? 2000;
            const lit = Math.min(20, Math.round((d.kcal / round) * 20));
            return (
              <div key={d.day} className="flex flex-col items-center" style={{ gap: 6, minWidth: 40 }} aria-label={`${say(d.label, lang)}: ${d.logged ? `${fig(d.kcal)} ${say(C.kcal, lang)}` : say(C.nothing, lang)}`}>
                <DotRing size={34} dots={Array.from({ length: 20 }, (_, i) => ({ on: i < lit, tint: d.today ? INK.fg : INK.soft }))} dot={3} />
                <span style={{ ...STEP.meta, color: d.today ? INK.fg : INK.muted }}>{say(d.label, lang)}</span>
              </div>
            );
          })}
        </div>
        {usual !== null ? (
          <div style={{ ...STEP.meta, color: INK.muted, padding: "10px 16px 12px", borderTop: `0.5px solid ${INK.line}` }}>
            {lang === "ar" ? `في الأيام المتسجلة: حوالي ${fig(usual)} سعرة` : `On days logged: about ${fig(usual)} kcal`}
          </div>
        ) : null}
      </Section>

      <Section
        title={say(C.cheers, lang)}
        action={mayCheer ? <Pill text={lang === "ar" ? `شجّع ${iso(owner)}` : `Cheer ${iso(owner)} on`} strong disabled={busy} onClick={() => void act("cheer")} /> : undefined}
      >
        {v.cheers.length ? (
          <Row first lead={<FaceStack names={v.cheers.map((c) => c.name)} size={26} max={5} />} title={v.youCheered ? say(C.cheered, lang) : cheeredBy(v.cheers.map((c) => c.name), lang)} />
        ) : (
          <div style={{ height: 8 }} />
        )}
      </Section>
    </div>
  );
};
