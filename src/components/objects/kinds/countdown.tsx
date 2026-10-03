"use client";

/**
 * Countdown on the page: the reference for every kind's view here, drawn as
 * the app draws its screen (catch8 src/components/objects/kinds/countdown):
 * the count as the hero, the field of days with one row a week, what each
 * dot is, and who counts along, with Count along for whoever has the link.
 */

import { say, type Words } from "@/lib/objects";
import { DotField, Face, INK, Pill, Row, Section, STEP } from "../kit";
import type { KindPage } from "../types";

/** The view as the core sends it (catch8 supabase/functions/_shared/objects/kinds/countdown.ts CountdownView). */
interface CountdownView {
  title: string;
  emoji: string;
  day: string;
  time: string | null;
  daysLeft: number;
  phase: "counting" | "today" | "over";
  dots: { total: number; fallen: number; perDot: 1 | 7 };
  counting: Array<{ id: string; name: string; you: boolean }>;
  youCount: boolean;
  dayWords: Words;
  timeWords: Words | null;
  leftWords: Words;
}

const C = {
  dayDot: { en: "Each dot is a day", ar: "كل نقطة يوم" },
  weekDot: { en: "Each dot is a week", ar: "كل نقطة أسبوع" },
  counting: { en: "Counting along", ar: "بيعدوا معاك" },
  countAlong: { en: "Count along", ar: "عِد معاهم" },
  stop: { en: "Stop counting", ar: "بطّل عد" },
  today: { en: "Today", ar: "النهارده" },
  few: { en: "days to go", ar: "أيام فاضلة" },
  many: { en: "days to go", ar: "يوم فاضل" },
  you: { en: "you", ar: "إنت" },
} satisfies Record<string, Words>;

export const Page: KindPage = ({ view, lang, act, can, busy }) => {
  const v = view as CountdownView;
  const big = v.phase === "today" ? say(C.today, lang) : v.phase === "over" ? say(v.leftWords, lang) : String(v.daysLeft);
  const under = v.phase === "counting" ? (v.daysLeft === 1 ? say(v.leftWords, lang) : say(v.daysLeft <= 10 ? C.few : C.many, lang)) : "";
  const cols = Math.min(v.dots.perDot === 1 ? 7 : 10, v.dots.total);
  return (
    <div>
      <section className="mb-3 flex flex-col items-center" style={{ background: INK.surface, borderRadius: 17, padding: "28px 16px", gap: 22 }}>
        <div className="flex flex-col items-center" style={{ gap: 4 }} aria-label={`${say(v.leftWords, lang)}. ${say(v.dayWords, lang)}`}>
          <span style={{ ...STEP.display, fontSize: 72, lineHeight: "80px", letterSpacing: "-3px" }}>{v.phase === "counting" && v.daysLeft === 1 ? say(v.leftWords, lang) : big}</span>
          {under && v.daysLeft !== 1 ? <span style={{ ...STEP.title, color: INK.muted }}>{under}</span> : null}
          <span style={{ ...STEP.body, color: INK.soft }}>{`${say(v.dayWords, lang)}${v.timeWords ? ` · ${say(v.timeWords, lang)}` : ""}`}</span>
        </div>
        <DotField total={v.dots.total} left={v.dots.total - v.dots.fallen} cols={cols} dot={14} gap={10} label={`${v.dots.total - v.dots.fallen}`} />
        <span style={{ ...STEP.meta, color: INK.muted }}>{say(v.dots.perDot === 1 ? C.dayDot : C.weekDot, lang)}</span>
      </section>
      <Section
        title={say(C.counting, lang)}
        action={
          can("count") && !v.youCount ? (
            <Pill text={say(C.countAlong, lang)} strong disabled={busy} onClick={() => void act("count")} />
          ) : v.youCount && can("uncount") ? (
            <Pill text={say(C.stop, lang)} disabled={busy} onClick={() => void act("uncount")} />
          ) : undefined
        }
      >
        {v.counting.map((c, i) => (
          <Row key={c.id} first={i === 0} lead={<Face name={c.name} size={30} />} title={c.you ? `${c.name} (${say(C.you, lang)})` : c.name} />
        ))}
      </Section>
    </div>
  );
};
