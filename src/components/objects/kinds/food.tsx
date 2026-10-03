"use client";

/**
 * Food on the page, drawn as the app draws its screen (catch8
 * src/components/objects/kinds/food): the plate as the hero, the last seven
 * days, and the cheers with the one button a buddy has. Whoever opens the
 * link is never the owner, so the view holds the day's totals and never a
 * meal (the core's shareSnap): there is nothing here that could draw one.
 */

import { say, type Lang, type Words } from "@/lib/objects";
import { EASE, Face, INK, Pill, Row, Section, STEP, type Dot } from "../kit";
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
  week: Array<{ day: string; label: Words; kcal: number; logged: boolean; today: boolean }>;
  cheers: Array<{ id: string; name: string; you: boolean }>;
  youCheered: boolean;
  words: { kcal: Words; protein: Words | null; left: Words | null };
}

const C = {
  kcal: { en: "kcal", ar: "سعرة" },
  noGoal: { en: "No goal set", ar: "من غير هدف" },
  week: { en: "Last 7 days", ar: "آخر 7 أيام" },
  cheers: { en: "Cheers", ar: "تشجيع" },
  cheered: { en: "You cheered today", ar: "بعتّ تشجيع النهارده" },
  nothing: { en: "Nothing yet today", ar: "لسه مفيش أكل النهارده" },
  totalsOnly: { en: "You see the day’s totals, never the meals.", ar: "بتشوف مجموع اليوم بس، مش الأكل نفسه." },
  you: { en: "you", ar: "إنت" },
} satisfies Record<string, Words>;

const fig = (n: number) => Math.round(n).toLocaleString("en-US");

function legend(kcal: number, protein: number | null): Words {
  return protein
    ? { en: `Each outer dot is ${kcal} kcal. Each inner dot is ${protein} g of protein.`, ar: `كل نقطة برا ${kcal} سعرة. كل نقطة جوا ${protein} جرام بروتين.` }
    : { en: `Each dot is ${kcal} kcal.`, ar: `كل نقطة ${kcal} سعرة.` };
}

/** Positions rounded to a hundredth of a pixel, so the server's HTML and the browser's draw agree to the digit (no hydration mismatch). */
const px = (n: number) => Math.round(n * 100) / 100;

/**
 * Dots around a circle, clockwise from twelve: the kit's DotRing drawn with
 * rounded positions. Each dot is its track and its fill, easing in once.
 */
function Ring({ size, dots, dot, inset = 0 }: { size: number; dots: Dot[]; dot: number; inset?: number }) {
  const n = Math.max(1, dots.length);
  const radius = size / 2 - inset - dot / 2 - 1;
  return (
    <div style={{ position: "relative", width: size, height: size }} aria-hidden>
      {dots.map((d, i) => {
        const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
        const fill = typeof d.on === "number" ? Math.max(0, Math.min(1, d.on)) : d.on ? 1 : 0;
        return (
          <span key={i} style={{ position: "absolute", left: px(size / 2 + Math.cos(a) * radius - dot / 2), top: px(size / 2 + Math.sin(a) * radius - dot / 2), width: dot, height: dot }}>
            <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: INK.track }} />
            <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: d.tint ?? INK.fg, opacity: fill, transform: `scale(${fill ? 1 : 0.4})`, transition: `opacity 260ms ${EASE}, transform 260ms ${EASE}` }} />
          </span>
        );
      })}
    </div>
  );
}

function ringDots(r: FoodRing, tint: string): Dot[] {
  const lit = Math.min(r.filled, r.dots);
  return Array.from({ length: r.dots }, (_, i) => ({ on: i < lit, tint }));
}

/** The plate: kcal dots around (past the goal they go round again just inside, in soft ink), protein in bone inside. */
function Plate({ v, size, outer, inner, lang }: { v: FoodView; size: number; outer: number; inner: number; lang: Lang }) {
  const over = Math.max(0, v.ring.filled - v.ring.dots);
  const lapR = size / 2 - outer * 2.4;
  const insetInner = Math.round(outer * 2.4 + (over ? outer * 1.6 : 4));
  return (
    <div style={{ position: "relative", width: size, height: size }} role="img" aria-label={`${say(v.words.kcal, lang)}${v.words.protein ? `. ${say(v.words.protein, lang)}` : ""}`}>
      <Ring size={size} dots={ringDots(v.ring, INK.fg)} dot={outer} />
      {Array.from({ length: Math.min(over, v.ring.dots) }, (_, i) => {
        const a = -Math.PI / 2 + (i / v.ring.dots) * Math.PI * 2;
        const d = Math.max(3, outer - 2);
        return <span key={i} aria-hidden style={{ position: "absolute", left: px(size / 2 + Math.cos(a) * lapR - d / 2), top: px(size / 2 + Math.sin(a) * lapR - d / 2), width: d, height: d, borderRadius: "50%", background: INK.soft }} />;
      })}
      {v.inner ? (
        <div style={{ position: "absolute", inset: 0 }}>
          <Ring size={size} dots={ringDots(v.inner, INK.pick)} dot={inner} inset={insetInner} />
        </div>
      ) : null}
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ gap: 2 }} aria-hidden>
        <span style={{ ...STEP.display, fontSize: 44, lineHeight: "50px" }}>{fig(v.totals.kcal)}</span>
        <span style={{ ...STEP.meta, color: INK.muted }}>{v.goal.kcal !== null ? (lang === "ar" ? `من ${fig(v.goal.kcal)} سعرة` : `of ${fig(v.goal.kcal)} kcal`) : say(C.noGoal, lang)}</span>
        {v.words.left ? <span style={{ ...STEP.label, color: INK.soft }}>{say(v.words.left, lang)}</span> : null}
        {v.words.protein ? <span style={{ ...STEP.label, color: INK.pick, marginTop: 4 }}>{say(v.words.protein, lang)}</span> : null}
      </div>
    </div>
  );
}

export const Page: KindPage = ({ page, view, lang, act, can, busy }) => {
  const v = view as FoodView;
  const owner = page.members.find((m) => m.role === "owner")?.name ?? "";
  const mayCheer = can("cheer") && !v.youCheered;
  return (
    <div>
      <section className="mb-3 flex flex-col items-center" style={{ background: INK.surface, borderRadius: 17, padding: "24px 16px", gap: 14 }}>
        <Plate v={v} size={264} outer={9} inner={8} lang={lang} />
        <span className="text-center" style={{ ...STEP.meta, color: INK.muted }}>
          {say(legend(v.ring.perDot, v.inner?.perDot ?? null), lang)}
        </span>
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
                <Ring size={34} dots={Array.from({ length: 20 }, (_, i) => ({ on: i < lit, tint: d.today ? INK.fg : INK.soft }))} dot={3} />
                <span style={{ ...STEP.meta, color: d.today ? INK.fg : INK.muted }}>{say(d.label, lang)}</span>
              </div>
            );
          })}
        </div>
      </Section>

      <Section
        title={say(C.cheers, lang)}
        action={
          mayCheer ? (
            <Pill text={lang === "ar" ? `ابعت تشجيع لـ ${owner}` : `Cheer ${owner} on`} strong disabled={busy} onClick={() => void act("cheer")} />
          ) : v.youCheered ? (
            <span style={{ ...STEP.meta, color: INK.muted }}>{say(C.cheered, lang)}</span>
          ) : undefined
        }
      >
        {v.cheers.length ? (
          v.cheers.map((c, i) => <Row key={c.id} first={i === 0} lead={<Face name={c.name} size={28} />} title={c.you ? `${c.name} (${say(C.you, lang)})` : c.name} />)
        ) : (
          <div style={{ height: 8 }} />
        )}
      </Section>
    </div>
  );
};
