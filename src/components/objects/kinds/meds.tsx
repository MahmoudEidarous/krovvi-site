"use client";

/**
 * Meds on the page, drawn as the app draws its screen (catch8
 * src/components/objects/kinds/meds): today's doses on a dial of the day,
 * each filled in the color of whoever gave it, then each dose as a row with a
 * tick for the family member reading (a dose already given shows who and
 * when, so nobody gives it twice), the medicines with their pills left, and
 * the as needed ones. Nothing here advises: it says what was given.
 */

import { say, type Lang, type Words } from "@/lib/objects";
import { EASE, Face, INK, Pill, Row, Section, STEP, Tick, tintOf } from "../kit";
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
  meds: Med[];
}

const C = {
  legend: { en: "Each dot is a dose, at its hour. Its color is who gave it.", ar: "كل نقطة جرعة في ساعتها. لونها هو اللي اداها." },
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

const HOURS = [
  { at: 0, en: "12 AM", ar: "12 ص" },
  { at: 6, en: "6 AM", ar: "6 ص" },
  { at: 12, en: "Noon", ar: "الضهر" },
  { at: 18, en: "6 PM", ar: "6 م" },
];

const sep = (lang: Lang) => (lang === "ar" ? "، " : ", ");
/** Positions rounded to a hundredth of a pixel, so the server's HTML and the browser's draw agree (no hydration mismatch). */
const px = (n: number) => Math.round(n * 100) / 100;
const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
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

/** The day's dial: midnight at the top, clockwise, each dose at its hour; the now mark inside. */
function Dial({ v, size, dot, lang }: { v: MedsView; size: number; dot: number; lang: Lang }) {
  const r0 = size / 2 - dot / 2 - 1;
  const seen = new Map<string, number>();
  // Now on the object's own calendar (the person cared for), not the reader's device.
  const nowMin = minutes(v.clock ?? "12:00");
  const na = (nowMin / 1440) * Math.PI * 2 - Math.PI / 2;
  const mr = r0 - dot * 1.9;
  return (
    <div style={{ position: "relative", width: size, height: size }} aria-hidden>
      <div style={{ position: "absolute", inset: dot / 2, borderRadius: "50%", border: `0.5px solid ${INK.line}` }} />
      {v.ring.map((s, i) => {
        const k = seen.get(s.time) ?? 0;
        seen.set(s.time, k + 1);
        const a = (minutes(s.time) / 1440) * Math.PI * 2 - Math.PI / 2;
        const r = r0 - k * (dot + 3);
        const given = s.state === "given";
        const skipped = s.state === "skipped";
        return (
          <span
            key={`${s.med}-${s.time}-${i}`}
            style={{
              position: "absolute",
              left: px(size / 2 + Math.cos(a) * r - dot / 2),
              top: px(size / 2 + Math.sin(a) * r - dot / 2),
              width: dot,
              height: dot,
              boxSizing: "border-box",
              borderRadius: "50%",
              background: given ? tintOf(s.byName ?? "") : skipped ? INK.track : INK.surface,
              border: given || skipped ? "none" : `1.5px solid ${s.state === "due" ? INK.fg : INK.faint}`,
              transform: `scale(${skipped ? 0.5 : 1})`,
              transition: `background-color 260ms ${EASE}, transform 260ms ${EASE}`,
            }}
          />
        );
      })}
      <span style={{ position: "absolute", left: px(size / 2 + Math.cos(na) * mr - 2.5), top: px(size / 2 + Math.sin(na) * mr - 2.5), width: 5, height: 5, borderRadius: "50%", background: INK.fg }} />
      {HOURS.map((h) => {
        const a = (h.at / 24) * Math.PI * 2 - Math.PI / 2;
        const r = r0 - dot * 2.6;
        return (
          <span key={h.at} className="absolute text-center" style={{ left: px(size / 2 + Math.cos(a) * r - 24), top: px(size / 2 + Math.sin(a) * r - 8), width: 48, fontSize: 10, lineHeight: "16px", color: INK.faint }}>
            {lang === "ar" ? h.ar : h.en}
          </span>
        );
      })}
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ gap: 2 }}>
        <span style={{ ...STEP.display }}>{lang === "ar" ? `${v.given} من ${v.total}` : `${v.given} of ${v.total}`}</span>
        <span style={{ ...STEP.meta, color: INK.muted }}>{say(C.doses, lang)}</span>
      </div>
    </div>
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
        <Dial v={v} size={240} dot={15} lang={lang} />
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
                lead={s.byName && (done || s.state === "skipped") ? <Face name={s.byName} size={28} /> : <span style={{ width: 28, height: 28, borderRadius: "50%", border: `1.5px solid ${INK.faint}`, display: "inline-block" }} />}
                title={`${clockWords(s.time, lang)}  ${s.name}${s.dose ? ` ${s.dose}` : ""}`}
                sub={stateWords(s, lang)}
                muted={s.state === "skipped"}
                value={
                  gives && s.state !== "skipped" ? (
                    <Tick
                      done={done}
                      by={s.byName}
                      size={28}
                      label={done ? (lang === "ar" ? `${what} اتاخدت` : `${what}, given`) : lang === "ar" ? `علّم إن ${what} اتاخدت` : `Mark ${what} given`}
                      onClick={busy ? undefined : () => void act(done ? "ungive" : "give", { med: s.med, time: s.time })}
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
