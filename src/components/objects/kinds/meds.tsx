"use client";

/**
 * Meds on the page, drawn as the app draws its screen (catch8
 * src/components/objects/kinds/meds): today's doses as one ring, each part
 * filled in the color of whoever gave it, then each dose as a row with a
 * tick for the family member reading (a dose already given shows who and
 * when, so nobody gives it twice), the medicines with their pills left, and
 * the as needed ones. Nothing here advises: it says what was given.
 */

import { say, type Lang, type Words } from "@/lib/objects";
import { EASE, INK, Pill, Row, Section, STEP, Tick, tintOf } from "../kit";
import type { KindPage } from "../types";

/** The view as the core sends it (catch8 supabase/functions/_shared/objects/kinds/meds.ts MedsView), the parts the page draws. */
interface Slot {
  med: string;
  name: string;
  dose: string | null;
  time: string;
  label: Words;
  state: "given" | "skipped" | "due" | "later";
  by: string | null;
  byName: string | null;
  at: string | null;
}
interface Med {
  id: string;
  name: string;
  dose: string | null;
  left: number | null;
  daysLeft: number | null;
  low: boolean;
  asNeeded: boolean;
  note: string | null;
  today: number;
  when: Words;
}
interface MedsView {
  today: string;
  /** The time now on the object's own calendar, "HH:mm". */
  clock: string;
  ring: Slot[];
  given: number;
  total: number;
  allGiven: boolean;
  next: { med: string; name: string; time: string; day: string } | null;
  meds: Med[];
}

const C = {
  legend: { en: "Each part of the ring is a dose. Its color is who gave it.", ar: "كل جزء من الدايرة جرعة. لونه هو اللي اداها." },
  allGiven: { en: "All given today", ar: "كله اتاخد النهارده" },
  next: { en: "Next", ar: "الجاية" },
  doses: { en: "doses today", ar: "جرعات النهارده" },
  today: { en: "Today", ar: "النهارده" },
  notYet: { en: "Not given yet", ar: "لسه ماتاخدتش" },
  later: { en: "Later today", ar: "بعدين النهارده" },
  medicines: { en: "Medicines", ar: "الأدوية" },
  asNeeded: { en: "As needed", ar: "عند اللزوم" },
  giveOne: { en: "Give one", ar: "ادّي جرعة" },
  refill: { en: "Time to refill", ar: "وقت علبة جديدة" },
  none: { en: "No doses due today", ar: "مفيش جرعات النهارده" },
} satisfies Record<string, Words>;

const sep = (lang: Lang) => (lang === "ar" ? "، " : ", ");
/** Positions rounded to a hundredth of a pixel, so the server's HTML and the browser's draw agree (no hydration mismatch). */
const px = (n: number) => Math.round(n * 100) / 100;
function clockWords(t: string, lang: Lang): string {
  const h = Number(t.slice(0, 2));
  const m = t.slice(3, 5);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${lang === "ar" ? (h >= 12 ? "م" : "ص") : h >= 12 ? "PM" : "AM"}`;
}
function pills(left: number, days: number | null, lang: Lang): string {
  const n = Number.isInteger(left) ? String(left) : left.toFixed(1);
  if (lang === "ar") {
    const d = days === null ? "" : `، حوالي ${days === 1 ? "يوم" : days === 2 ? "يومين" : days <= 10 ? `${days} أيام` : `${days} يوم`}`;
    return `${n} ${left >= 3 && left <= 10 ? "حبايات" : "حباية"}${d}`;
  }
  return `${n} ${left === 1 ? "pill" : "pills"}${days === null ? "" : `, about ${days} ${days === 1 ? "day" : "days"}`}`;
}
function stateWords(s: Slot, lang: Lang): string {
  if (s.state === "given") return lang === "ar" ? `اداها ${s.byName ?? ""} الساعة ${s.at ? clockWords(s.at, lang) : ""}` : `Given by ${s.byName ?? ""} at ${s.at ? clockWords(s.at, lang) : ""}`;
  if (s.state === "skipped") return lang === "ar" ? `اتسابت، قال ${s.byName ?? ""}` : `Skipped, said by ${s.byName ?? ""}`;
  return say(s.state === "due" ? C.notYet : C.later, lang);
}

/** A stretch of circle as SVG path data, clockwise from `a0` to `a1` (radians, twelve o'clock is 0), positions rounded so the server's HTML and the browser's draw agree. */
function arc(c: number, r: number, a0: number, a1: number): string {
  if (a1 - a0 >= Math.PI * 2 - 1e-6) return `M ${c} ${px(c - r)} A ${px(r)} ${px(r)} 0 1 1 ${c} ${px(c + r)} A ${px(r)} ${px(r)} 0 1 1 ${c} ${px(c - r)}`;
  const x0 = px(c + Math.sin(a0) * r);
  const y0 = px(c - Math.cos(a0) * r);
  const x1 = px(c + Math.sin(a1) * r);
  const y1 = px(c - Math.cos(a1) * r);
  return `M ${x0} ${y0} A ${px(r)} ${px(r)} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1} ${y1}`;
}

/**
 * Today's doses as one ring, as the app draws it: one part per dose in the
 * order of the day, clockwise from the top, each filled in the color of
 * whoever gave it; a dose whose time has come is a brighter track, a skipped
 * one a thin dim line. The count stands in the middle.
 */
function DoseRing({ v, size, width, lang }: { v: MedsView; size: number; width: number; lang: Lang }) {
  const c = size / 2;
  const r = size / 2 - width / 2 - 1;
  const n = v.ring.length;
  const gapAngle = n > 1 ? (width + 5) / r : 0;
  const span = (Math.PI * 2) / Math.max(1, n);
  const nextToday = v.next && v.next.day === v.today ? v.next : null;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        {n === 0 ? <path d={arc(c, r, 0, Math.PI * 2)} fill="none" stroke={INK.track} strokeWidth={width} /> : null}
        {v.ring.map((s, i) => {
          const d = arc(c, r, i * span + gapAngle / 2, (i + 1) * span - gapAngle / 2);
          const skipped = s.state === "skipped";
          const given = s.state === "given";
          return (
            <path
              key={`${s.med}-${s.time}`}
              d={d}
              fill="none"
              strokeLinecap="round"
              strokeWidth={skipped ? width * 0.45 : width}
              stroke={given ? tintOf(s.byName ?? "") : s.state === "due" ? "rgba(237,237,235,0.32)" : INK.track}
              opacity={skipped ? 0.6 : 1}
              style={{ transition: `stroke 420ms ${EASE}` }}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ gap: 2 }}>
        <span style={{ ...STEP.display }}>{lang === "ar" ? `${v.given} من ${v.total}` : `${v.given} of ${v.total}`}</span>
        <span style={{ ...STEP.meta, color: INK.muted }}>{say(C.doses, lang)}</span>
        {v.total > 0 && v.allGiven ? (
          <span style={{ ...STEP.label, color: INK.pick, marginTop: 6 }}>{say(C.allGiven, lang)}</span>
        ) : nextToday ? (
          <span style={{ ...STEP.label, color: INK.soft, marginTop: 6 }}>{`${say(C.next, lang)} ${clockWords(nextToday.time, lang)}`}</span>
        ) : null}
      </div>
    </div>
  );
}

/** A dose's time at the head of its row: the hour, and AM or PM small under it, so a day's doses read down like a schedule. */
function TimeLead({ time, due, lang }: { time: string; due: boolean; lang: Lang }) {
  const [clock, half] = clockWords(time, lang).split(" ");
  return (
    <span className="flex flex-col items-center" style={{ width: 46 }}>
      <span style={{ ...STEP.label, color: due ? INK.fg : INK.soft, fontVariantNumeric: "tabular-nums" }}>{clock}</span>
      <span style={{ ...STEP.meta, color: INK.muted, marginTop: -2 }}>{half}</span>
    </span>
  );
}

export const Page: KindPage = ({ view, lang, act, can, busy }) => {
  const v = view as MedsView;
  const gives = can("give");
  const scheduled = v.meds.filter((m) => !m.asNeeded);
  const asNeeded = v.meds.filter((m) => m.asNeeded);
  return (
    <div>
      <section className="mb-3 flex flex-col items-center" style={{ background: INK.surface, borderRadius: 17, padding: "22px 16px", gap: 14 }} aria-label={`${v.given} / ${v.total} ${say(C.doses, lang)}`}>
        <DoseRing v={v} size={224} width={16} lang={lang} />
        <span className="text-center" style={{ ...STEP.meta, color: INK.muted }}>
          {say(C.legend, lang)}
        </span>
      </section>

      <Section title={say(C.today, lang)}>
        {v.ring.length ? (
          v.ring.map((s, i) => {
            const done = s.state === "given";
            const what = lang === "ar" ? `جرعة ${clockWords(s.time, lang)} من ${s.name}` : `the ${clockWords(s.time, lang)} ${s.name}`;
            return (
              <Row
                key={`${s.med}-${s.time}`}
                first={i === 0}
                lead={<TimeLead time={s.time} due={s.state === "due"} lang={lang} />}
                title={`${s.name}${s.dose ? ` ${s.dose}` : ""}`}
                sub={stateWords(s, lang)}
                muted={s.state === "skipped"}
                value={
                  gives && s.state !== "skipped" ? (
                    <Tick
                      done={done}
                      by={s.byName}
                      size={28}
                      label={done ? (lang === "ar" ? `${what} اتاخدت` : `${what}, given`) : lang === "ar" ? `علّم إن ${what} اتاخدت` : `Mark ${what} given`}
                      onClick={
                        busy
                          ? undefined
                          : () => {
                              // Hours before its time, ask once: a stray tap must never tell the family a dose is given when it is not.
                              if (!done && s.state === "later" && !window.confirm(lang === "ar" ? `جرعة ${clockWords(s.time, lang)} من ${s.name} لسه ميعادها مجاش. تعلّمها اتاخدت؟` : `The ${clockWords(s.time, lang)} ${s.name} is still to come. Mark it given now?`)) return;
                              void act(done ? "ungive" : "give", { med: s.med, time: s.time });
                            }
                      }
                    />
                  ) : undefined
                }
              />
            );
          })
        ) : (
          <Row first title={say(C.none, lang)} muted />
        )}
      </Section>

      {scheduled.length ? (
        <Section title={say(C.medicines, lang)}>
          {scheduled.map((m, i) => (
            <Row
              key={m.id}
              first={i === 0}
              title={`${m.name}${m.dose ? ` ${m.dose}` : ""}`}
              sub={`${say(m.when, lang)}${m.note ? `${sep(lang)}${m.note}` : ""}`}
              value={
                m.left !== null ? (
                  <span className="flex flex-col items-end" style={{ gap: 2 }}>
                    <span style={{ ...STEP.meta, color: m.low ? INK.pick : INK.muted }}>{pills(m.left, m.daysLeft, lang)}</span>
                    {m.low ? <span style={{ ...STEP.meta, color: INK.pick, fontWeight: 600 }}>{say(C.refill, lang)}</span> : null}
                  </span>
                ) : undefined
              }
            />
          ))}
        </Section>
      ) : null}

      {asNeeded.length ? (
        <Section title={say(C.asNeeded, lang)}>
          {asNeeded.map((m, i) => (
            <Row
              key={m.id}
              first={i === 0}
              title={`${m.name}${m.dose ? ` ${m.dose}` : ""}`}
              sub={lang === "ar" ? `${m.today} النهارده` : `${m.today} today`}
              value={gives ? <Pill text={say(C.giveOne, lang)} disabled={busy} onClick={() => void act("give", { med: m.id })} /> : undefined}
            />
          ))}
        </Section>
      ) : null}
    </div>
  );
};
