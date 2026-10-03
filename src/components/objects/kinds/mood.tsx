"use client";

/**
 * Mood on the page, drawn as the app draws its screen (catch8
 * src/components/objects/kinds/mood): today's word, the year as twelve
 * months of day dots colored on the scale (warm for good, mist for low, never
 * red) with the five colors named, and the week. Whoever opens the link holds
 * the colors only (the core's shareSnap): there is no note here to draw.
 */

import { say, type Words } from "@/lib/objects";
import { DotLine, INK, Section, STEP } from "../kit";
import type { KindPage } from "../types";

type Ink = "warm" | "warmSoft" | "soft" | "coldSoft" | "cold";

/** The view as the core sends it (catch8 supabase/functions/_shared/objects/kinds/mood.ts MoodView), the parts the page draws. */
interface MoodView {
  today: string;
  /** The first day it was kept: a day before it was never asked, so it stays blank. */
  since: string;
  year: number;
  logged: number;
  todayLevel: number | null;
  months: number[][];
  scale: Array<{ level: number; words: Words; ink: Ink }>;
  counts: number[];
  week: Array<{ day: string; label: Words; level: number | null }>;
}

const INKS: Record<Ink, string> = { warm: INK.warm, warmSoft: "#D8C49B", soft: INK.soft, coldSoft: "#AFC6D6", cold: INK.cold };
const MONTHS = { en: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"], ar: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"] };

const C = {
  nothing: { en: "Nothing said today yet", ar: "لسه مفيش حاجة النهارده" },
  nothingAtAll: { en: "Nothing said yet", ar: "لسه مفيش حاجة" },
  nothingYet: { en: "Each day said becomes a dot on the year.", ar: "كل يوم بيتقال بيبقى نقطة في السنة." },
  dayDot: { en: "Each dot is a day.", ar: "كل نقطة يوم." },
  week: { en: "Last 7 days", ar: "آخر 7 أيام" },
  colorsOnly: { en: "You see the colors, never the notes.", ar: "بتشوف الألوان بس، مش الملحوظات." },
} satisfies Record<string, Words>;

export const Page: KindPage = ({ view, lang }) => {
  const v = view as MoodView;
  const inkOf = (level: number) => INKS[v.scale.find((s) => s.level === level)?.ink ?? "soft"];
  const today = v.todayLevel ? v.scale.find((s) => s.level === v.todayLevel) : null;
  const m0 = Number(v.today.slice(5, 7)) - 1;
  const d0 = Number(v.today.slice(8, 10)) - 1;
  return (
    <div>
      <section className="mb-3 flex flex-col items-center" style={{ background: INK.surface, borderRadius: 17, padding: "22px 12px", gap: 16 }}>
        <div className="flex flex-col items-center" style={{ gap: 2 }}>
          {today ? (
            <span style={{ ...STEP.display, fontSize: 44, lineHeight: "50px", color: inkOf(today.level) }}>{say(today.words, lang)}</span>
          ) : (
            <span style={{ ...STEP.figure }}>{say(v.logged ? C.nothing : C.nothingAtAll, lang)}</span>
          )}
        </div>
        {v.logged === 0 && !today ? (
          <span className="text-center" style={{ ...STEP.body, color: INK.soft, padding: "6px 8px" }}>
            {say(C.nothingYet, lang)}
          </span>
        ) : (
        <>
        <div className="flex" style={{ gap: 6 }} role="img" aria-label={`${v.year}: ${v.scale.map((s) => `${say(s.words, lang)} ${v.counts[s.level - 1]}`).join(", ")}`}>
          <div className="flex flex-col" style={{ gap: 3 }} aria-hidden>
            {MONTHS[lang].map((m, i) => (
              <span key={i} style={{ height: 7, lineHeight: "7px", fontSize: 8, color: INK.muted, width: 14, textAlign: "center" }}>
                {m}
              </span>
            ))}
          </div>
          <div className="grid" style={{ gridTemplateColumns: "repeat(31, 7px)", gridAutoRows: "7px", gap: 3 }} aria-hidden>
            {v.months.flatMap((month, m) =>
              Array.from({ length: 31 }, (_, d) => {
                const level = month[d];
                const now = m === m0 && d === d0;
                if (level === undefined || level === -1) return <span key={`${m}-${d}`} />;
                return (
                  <span
                    key={`${m}-${d}`}
                    style={{
                      width: now ? 8 : 7,
                      height: now ? 8 : 7,
                      borderRadius: "50%",
                      background: level > 0 ? inkOf(level) : now ? INK.fg : INK.track,
                    }}
                  />
                );
              })
            )}
          </div>
        </div>
        <div className="flex flex-wrap justify-center" style={{ gap: 12 }}>
          {v.scale.map((s) => (
            <span key={s.level} className="inline-flex items-center" style={{ gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: INKS[s.ink] }} />
              <span style={{ ...STEP.meta, color: INK.muted }}>{say(s.words, lang)}</span>
            </span>
          ))}
        </div>
        <span style={{ ...STEP.meta, color: INK.muted }}>{say(C.dayDot, lang)}</span>
        </>
        )}
      </section>

      <div className="text-center" style={{ ...STEP.meta, color: INK.muted, margin: "0 0 12px" }}>
        {say(C.colorsOnly, lang)}
      </div>

      {v.logged ? (
        <Section title={say(C.week, lang)}>
          <div className="flex justify-between" style={{ padding: "6px 16px 14px" }}>
            {v.week.map((d) => (
              <span key={d.day} className="flex flex-col items-center" style={{ gap: 6, minWidth: 36 }}>
                {d.day < v.since ? (
                  <span style={{ width: 18, height: 18 }} />
                ) : (
                  <DotLine dots={[d.level ? { on: true, tint: inkOf(d.level) } : { on: false, now: d.day === v.today }]} dot={16} />
                )}
                <span style={{ ...STEP.meta, fontSize: 11, color: d.day === v.today ? INK.fg : INK.muted }}>{say(d.label, lang)}</span>
              </span>
            ))}
          </div>
        </Section>
      ) : null}
    </div>
  );
};
