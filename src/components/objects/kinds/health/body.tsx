"use client";

/**
 * What a Health kept for someone holds beyond its medicines, as the app
 * draws it (catch8 src/components/objects/kinds/health/body.tsx and
 * records.tsx): visits to come and behind, the readings a doctor asks for
 * with their line over time, the nights, the symptoms kept an eye on, the
 * cycle, lab results against the range their own report printed, and the
 * short card. Each part is drawn only when the reader's copy holds something
 * for it. Nothing here says what a number means.
 */

import { useState } from "react";

import { say, type Lang } from "@/lib/objects";
import { INK, Section, STEP, dirOf } from "../../kit";
import { Mark, type MarkName } from "../../mark";
import { DayBars, LineChart, Squares, Stat, Stats } from "../chart";
import { over, wash } from "../sheet";
import { dayLabel, dayLetter, figure, timeLabel } from "../when";
import { C, DOT, FACT_NAMES, LEVEL_WORDS, feltDays, list, measureShown, outsideCount, sleepShort, sleepWords, type HealthView, type MeasurePart, type Result, type Visit } from "./parts";

/** Health's one colour (catch8 supabase/functions/_shared/objects/apps.ts): its lines, bars and squares, never a button. */
export const TINT = "#EC8FA3";

/** A mark on its tile, a row's lead: in Health's colour for what is live (a medicine with times, a visit to come), quiet otherwise. */
export function Coin({ mark, plain, size = 44 }: { mark: MarkName; plain?: boolean; size?: number }) {
  return (
    <span className="flex shrink-0 items-center justify-center" style={{ width: size, height: size, borderRadius: Math.round(size * 0.3), background: plain ? INK.surfaceHi : over(TINT, INK.surfaceHi, 0.16) }} aria-hidden>
      <Mark name={mark} size={Math.round(size * 0.46)} color={plain ? INK.soft : TINT} />
    </span>
  );
}

/** A person's or a doctor's words on a line of their own, read in the direction of their own letters. */
function Said({ text, muted }: { text: string; muted?: boolean }) {
  return (
    <span className="block" style={{ ...(muted ? STEP.meta : STEP.body), color: muted ? INK.muted : INK.fg, textAlign: "start", overflowWrap: "anywhere" }}>
      <bdi dir={dirOf(text)}>{text}</bdi>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Visits.                                                              */
/* ------------------------------------------------------------------ */

/** Visits to come, then the ones behind. One with more to it (where, what was said, what changed, the follow up) opens in place. */
export function Visits({ v, lang }: { v: HealthView; lang: Lang }) {
  const [open, setOpen] = useState<string | null>(null);
  const { upcoming, past } = v.visits;
  if (!upcoming.length && !past.length) return null;
  const row = (x: Visit, first: boolean, behind: boolean) => {
    const more: Array<[string, string]> = [];
    if (x.where) more.push([say(C.place, lang), x.where]);
    if (x.notes) more.push([say(C.saidThere, lang), x.notes]);
    if (x.changed) more.push([say(C.changed, lang), x.changed]);
    if (x.next) more.push([say(C.followUp, lang), dayLabel(x.next, lang, { thisYear: v.today })]);
    const shown = open === x.id;
    const head = (
      <>
        <Coin mark="calendar" plain={behind} />
        <span className="min-w-0 flex-1">
          <Said text={x.who || say(C.aVisit, lang)} />
          <span className="block" style={{ ...STEP.meta, color: INK.muted, textAlign: "start" }}>
            {list([dayLabel(x.day, lang, { thisYear: v.today }), x.time ? timeLabel(x.time, lang) : null, x.why], lang)}
          </span>
        </span>
        {more.length ? (
          <svg width={14} height={8} viewBox="0 0 14 8" aria-hidden className="shrink-0" style={{ transform: shown ? "rotate(180deg)" : undefined, transition: "transform 180ms" }}>
            <path d="M1.5 1.5L7 6.5l5.5-5" fill="none" stroke={INK.faint} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </>
    );
    return (
      <div key={x.id}>
        {first ? null : <div style={{ height: 0.5, background: INK.line, marginInlineStart: 72 }} />}
        {more.length ? (
          <button type="button" aria-expanded={shown} onClick={() => setOpen(shown ? null : x.id)} className="flex w-full items-center text-start active:opacity-70" style={{ gap: 12, padding: "10px 16px", minHeight: 64 }}>
            {head}
          </button>
        ) : (
          <div className="flex items-center" style={{ gap: 12, padding: "10px 16px", minHeight: 64 }}>
            {head}
          </div>
        )}
        {shown ? (
          <div className="flex flex-col" style={{ gap: 10, padding: "2px 16px 14px", paddingInlineStart: 72 }}>
            {more.map(([name, text]) => (
              <div key={name}>
                <span className="block" style={{ ...STEP.meta, color: INK.muted, textAlign: "start" }}>
                  {name}
                </span>
                <Said text={text} />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  };
  return (
    <Section title={say(C.visits, lang)}>
      {upcoming.map((x, i) => row(x, i === 0, false))}
      {past.length ? (
        <>
          {upcoming.length ? <h4 style={{ ...STEP.label, color: INK.muted, padding: "14px 16px 2px", textAlign: "start" }}>{say(C.past, lang)}</h4> : null}
          {past.slice(0, 12).map((x, i) => row(x, i === 0, true))}
        </>
      ) : null}
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Readings.                                                            */
/* ------------------------------------------------------------------ */

/** One reading over time: the latest in large type, the thirty day average, the line, and the last three as they were said. */
function Reading({ m, v, lang }: { m: MeasurePart; v: HealthView; lang: Lang }) {
  const places = m.kind === "temp" || m.kind === "weight" || (m.kind === "glucose" && v.units.glucose === "mmol") ? 1 : 0;
  const first = m.series[0];
  const last = m.series[m.series.length - 1];
  return (
    <section className="mb-3" style={{ background: INK.surface, borderRadius: 17 }}>
      <div className="flex flex-col" style={{ gap: 14, padding: "14px 16px 12px" }}>
        <div className="flex items-start justify-between" style={{ gap: 12 }}>
          <div className="flex min-w-0 flex-col" style={{ gap: 2 }}>
            <h3 style={{ ...STEP.label, color: INK.muted, textAlign: "start" }}>{say(m.name, lang)}</h3>
            <span dir="ltr" style={{ ...STEP.display, fontSize: 34, lineHeight: "40px", alignSelf: "flex-start" }}>
              {say(m.latest.said, lang)}
            </span>
            <span style={{ ...STEP.meta, color: INK.muted, textAlign: "start" }}>{list([dayLabel(m.latest.day, lang, { thisYear: v.today }), timeLabel(m.latest.time, lang)], lang)}</span>
          </div>
          {m.avg30 ? (
            <div className="flex shrink-0 flex-col items-end" style={{ gap: 2 }}>
              <span style={{ ...STEP.meta, color: INK.muted }}>{say(C.avg30, lang)}</span>
              <span dir="ltr" style={STEP.title}>
                {say(m.avg30, lang)}
              </span>
            </div>
          ) : null}
        </div>
        {m.series.length >= 3 ? (
          <LineChart
            points={m.series.map((r) => measureShown(m.kind, r.value, v.units))}
            tint={TINT}
            format={(n) => figure(n, places)}
            ticks={[dayLabel(first.day, lang, { thisYear: v.today }), dayLabel(last.day, lang, { thisYear: v.today })]}
            label={`${say(m.name, lang)}: ${m.series.map((r) => `${dayLabel(r.day, lang, { thisYear: v.today })} ${say(r.said, lang)}`).join(", ")}`}
          />
        ) : null}
        {m.kind === "bp" && m.series.length >= 3 ? <span style={{ ...STEP.meta, color: INK.faint, textAlign: "start" }}>{say(C.upperLine, lang)}</span> : null}
      </div>
      {m.series
        .slice(-3)
        .reverse()
        .map((r) => (
          <div key={r.id}>
            <div style={{ height: 0.5, background: INK.line, marginInlineStart: 16 }} />
            <div className="flex items-center justify-between" style={{ gap: 12, padding: "10px 16px", minHeight: 48 }}>
              <span className="min-w-0">
                <span className="block" dir="ltr" style={{ ...STEP.body, fontWeight: 500, textAlign: lang === "ar" ? "right" : "left" }}>
                  {say(r.said, lang)}
                </span>
                {r.note ? <Said text={r.note} muted /> : null}
              </span>
              <span className="shrink-0" style={{ ...STEP.meta, color: INK.muted }}>
                {list([dayLabel(r.day, lang, { thisYear: v.today }), timeLabel(r.time, lang)], lang)}
              </span>
            </div>
          </div>
        ))}
    </section>
  );
}

export function Readings({ v, lang }: { v: HealthView; lang: Lang }) {
  return (
    <>
      {v.measures.map((m) => (
        <Reading key={m.kind} m={m} v={v} lang={lang} />
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Sleep.                                                               */
/* ------------------------------------------------------------------ */

/** The last seven nights as bars with their hours over them, against the hours the person says they need. */
export function Sleep({ v, lang }: { v: HealthView; lang: Lang }) {
  const s = v.sleep;
  if (!s.latest) return null;
  const nights = s.nights.slice(-7);
  return (
    <Section title={say(C.sleep, lang)}>
      <div className="flex flex-col" style={{ gap: 16, padding: "4px 16px 16px" }}>
        <div className="flex flex-col" style={{ gap: 2 }}>
          <span style={{ ...STEP.display, fontSize: 34, lineHeight: "40px", textAlign: "start" }}>{say(sleepWords(s.avg7 ?? s.latest.mins), lang)}</span>
          <span style={{ ...STEP.meta, color: INK.muted, textAlign: "start" }}>{s.avg7 !== null ? say(C.avg7, lang) : dayLabel(s.latest.day, lang, { thisYear: v.today })}</span>
        </div>
        <DayBars
          tint={TINT}
          height={84}
          goal={s.need !== null ? s.need / 60 : null}
          label={say(C.sleep, lang)}
          bars={nights.map((n) => ({
            key: n.day,
            label: dayLetter(n.day, lang),
            value: n.mins !== null ? n.mins / 60 : 0,
            // Hours and minutes in the least room ("7:27"): seven nights of near the same length would run into each other spelled out.
            text: n.mins !== null ? `${Math.floor(n.mins / 60)}:${String(Math.round(n.mins % 60)).padStart(2, "0")}` : null,
            says: `${dayLabel(n.day, lang)}: ${n.mins !== null ? say(sleepWords(n.mins), lang) : say(C.noNight, lang)}`,
            now: n.day === v.today,
          }))}
        />
        {s.bedUsual || s.wakeUsual || (s.short7 !== null && s.short7 > 0) ? (
          <Stats>
            {s.bedUsual ? <Stat name={say(C.usualBed, lang)} value={timeLabel(s.bedUsual, lang)} small /> : null}
            {s.wakeUsual ? <Stat name={say(C.usualWake, lang)} value={timeLabel(s.wakeUsual, lang)} small /> : null}
            {s.short7 !== null && s.short7 > 0 ? <Stat name={say(C.short, lang)} value={say(sleepShort(s.short7), lang)} small /> : null}
          </Stats>
        ) : null}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* How they feel.                                                       */
/* ------------------------------------------------------------------ */

/** Each symptom kept an eye on: today's level in words, the last two weeks as squares, and how many of the last thirty days it was felt. */
export function Feels({ v, lang }: { v: HealthView; lang: Lang }) {
  if (!v.feels.tracked.length) return null;
  return (
    <Section title={say(C.feelFor, lang)}>
      {v.feels.tracked.map((t, i) => (
        <div key={t.name}>
          {i ? <div style={{ height: 0.5, background: INK.line, marginInlineStart: 16 }} /> : null}
          <div className="flex flex-col" style={{ gap: 8, padding: "12px 16px" }}>
            <div className="flex items-baseline justify-between" style={{ gap: 10 }}>
              <span className="min-w-0" style={{ ...STEP.body, textAlign: "start" }}>
                <bdi dir={dirOf(t.name)}>{t.name}</bdi>
              </span>
              {t.today !== null ? <span style={{ ...STEP.meta, color: INK.muted }}>{say(LEVEL_WORDS[t.today] ?? LEVEL_WORDS[0], lang)}</span> : null}
            </div>
            <Squares days={t.days} tint={TINT} label={`${t.name}: ${say(feltDays(t.days30), lang)}`} level={(n) => 0.3 + n * 0.23} />
            <span style={{ ...STEP.meta, color: INK.faint, textAlign: "start" }}>{say(feltDays(t.days30), lang)}</span>
          </div>
        </div>
      ))}
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* The cycle.                                                           */
/* ------------------------------------------------------------------ */

/**
 * The cycle as the family's copy holds it: where it is, the next estimate in
 * the core's own words (always an estimate), the days as a strip (a logged
 * period solid, the next one's estimate outlined, today ringed), and the
 * lengths it is worked out from.
 */
export function Cycle({ v, lang }: { v: HealthView; lang: Lang }) {
  const c = v.cycle;
  if (!c) return null;
  return (
    <Section title={say(C.cycle, lang)}>
      <div className="flex flex-col" style={{ gap: 14, padding: "4px 16px 16px" }}>
        <div className="flex flex-col" style={{ gap: 2 }}>
          <span style={{ ...STEP.title, fontSize: 22, lineHeight: "28px", textAlign: "start" }}>{say(c.phaseWords, lang)}</span>
          {c.next ? <span style={{ ...STEP.body, color: INK.muted, textAlign: "start" }}>{say(c.next.words, lang)}</span> : null}
        </div>
        {c.days ? (
          <div className="flex items-start" style={{ gap: 2 }} role="img" aria-label={say(C.cycle, lang)}>
            {c.days.map((d) => (
              <span key={d.day} className="flex min-w-0 flex-1 flex-col items-center" style={{ gap: 3 }} aria-hidden>
                <span
                  className="block self-stretch"
                  style={{
                    height: 26,
                    borderRadius: 4,
                    boxSizing: "border-box",
                    background: d.kind === "period" ? TINT : d.kind === "estimate" ? wash(TINT, 0.16) : INK.track,
                    border: d.day === v.today ? `1.5px solid ${INK.fg}` : d.kind === "estimate" ? `1px solid ${wash(TINT, 0.6)}` : "none",
                  }}
                />
                <span className="block rounded-full" style={{ width: 3, height: 3, background: d.logged ? INK.soft : "transparent" }} />
              </span>
            ))}
          </div>
        ) : null}
        {c.lengths ? (
          <Stats>
            {c.cycleDay ? <Stat name={say(C.cycleDay, lang)} value={String(c.cycleDay)} small /> : null}
            <Stat name={say(C.cycleLength, lang)} value={String(c.lengths.cycle)} unit={say(C.days, lang)} small />
            <Stat name={say(C.periodLength, lang)} value={String(c.lengths.period)} unit={say(C.days, lang)} small />
          </Stats>
        ) : null}
        <span style={{ ...STEP.meta, color: INK.faint, textAlign: "start" }}>
          {c.lengths?.sure === "rough" ? `${say(C.rough, lang)} ` : ""}
          {say(C.estimateNote, lang)}
        </span>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Lab results.                                                         */
/* ------------------------------------------------------------------ */

const said = (n: number) => figure(n, Number.isInteger(n) ? 0 : n < 10 ? 2 : 1).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");

/** The range a report printed, in words: "12 to 16 g/dL", "under 200 mg/dL", "over 40". */
function rangeWords(x: Result, lang: Lang): string | null {
  if (x.low === null && x.high === null) return null;
  const unit = x.unit ? ` ${x.unit}` : "";
  if (x.low !== null && x.high !== null) return lang === "ar" ? `من ${said(x.low)} لـ ${said(x.high)}${unit}` : `${said(x.low)} to ${said(x.high)}${unit}`;
  if (x.high !== null) return lang === "ar" ? `أقل من ${said(x.high)}${unit}` : `under ${said(x.high)}${unit}`;
  return lang === "ar" ? `أكتر من ${said(x.low as number)}${unit}` : `over ${said(x.low as number)}${unit}`;
}

/**
 * One result: the test, its value with its unit, and where the value sits in
 * the range its own report printed: a small bar with a mark on it, in
 * Health's colour when the mark falls outside. No range, no bar.
 */
function ResultLine({ x, lang, first }: { x: Result; lang: Lang; first: boolean }) {
  const out = x.flag === "low" || x.flag === "high";
  // The printed range takes the middle half of the bar, so a value outside it still shows on the bar.
  let at: number | null = null;
  if (x.value !== null && (x.low !== null || x.high !== null)) {
    const low = x.low ?? (x.high as number) * 0.5;
    const high = x.high ?? (x.low as number) * 1.5;
    const span = Math.max(1e-9, high - low);
    at = Math.max(0.02, Math.min(0.98, 0.25 + ((x.value - low) / span) * 0.5));
  }
  const range = rangeWords(x, lang);
  return (
    <div>
      {first ? null : <div style={{ height: 0.5, background: INK.line, marginInlineStart: 16 }} />}
      <div className="flex items-center" style={{ gap: 12, padding: "10px 16px", minHeight: 52 }}>
        <span className="min-w-0 flex-1">
          <Said text={x.test} />
          {range || out ? (
            <span className="block" style={{ ...STEP.meta, color: INK.muted, textAlign: "start" }}>
              {/* The range is said in the page's words ("من 0.4 لـ 4 mIU/L"), so it reads the page's way whatever letters its unit has. */}
              {range ? <bdi dir={lang === "ar" ? "rtl" : "ltr"}>{range}</bdi> : null}
              {range && out ? DOT : null}
              {out ? say(C.outside, lang) : null}
            </span>
          ) : null}
        </span>
        <span className="flex shrink-0 flex-col items-end" style={{ gap: 6 }}>
          <span dir="auto" style={{ ...STEP.body, fontWeight: 500, color: out ? TINT : INK.fg, fontVariantNumeric: "tabular-nums" }}>
            {x.value !== null ? `${said(x.value)}${x.unit ? ` ${x.unit}` : ""}` : (x.words ?? "")}
          </span>
          {at !== null ? (
            <span dir="ltr" className="relative block" style={{ width: 96, height: 6, borderRadius: 3, background: INK.track }} aria-hidden>
              <span className="absolute" style={{ left: "25%", width: "50%", top: 0, bottom: 0, borderRadius: 3, background: INK.line }} />
              <span className="absolute" style={{ left: `${Math.round(at * 1000) / 10}%`, top: -3, width: 4, height: 12, borderRadius: 2, marginLeft: -2, background: out ? TINT : INK.fg }} />
            </span>
          ) : null}
        </span>
      </div>
    </div>
  );
}

export function Results({ v, lang }: { v: HealthView; lang: Lang }) {
  const reports = v.results.reports.slice(0, 6);
  if (!reports.length) return null;
  return (
    <>
      <Section title={say(C.results, lang)}>
        {reports.map((r, n) => {
          const day = dayLabel(r.day, lang, { thisYear: v.today });
          const under = list([r.title ? day : null, r.lab, r.out ? say(outsideCount(r.out), lang) : null], lang);
          return (
            <div key={r.key} style={{ borderTop: n ? `0.5px solid ${INK.line}` : undefined, marginTop: n ? 6 : 0 }}>
              <div style={{ padding: `${n ? 14 : 6}px 16px 4px` }}>
                <span className="block" style={{ ...STEP.title, textAlign: "start" }}>
                  <bdi dir={dirOf(r.title || day)}>{r.title || day}</bdi>
                </span>
                {under ? (
                  <span className="block" style={{ ...STEP.meta, color: r.out ? INK.soft : INK.muted, textAlign: "start" }}>
                    {under}
                  </span>
                ) : null}
              </div>
              {r.rows.map((x, i) => (
                <ResultLine key={x.id} x={x} lang={lang} first={i === 0} />
              ))}
            </div>
          );
        })}
      </Section>
      <p style={{ ...STEP.meta, color: INK.faint, textAlign: "center", margin: "-2px 16px 12px" }}>{say(C.rangeNote, lang)}</p>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* The card.                                                            */
/* ------------------------------------------------------------------ */

/** What a doctor asks first: conditions, allergies, vaccines, blood type, who to call. */
export function Card({ v, lang }: { v: HealthView; lang: Lang }) {
  const kinds = FACT_NAMES.filter(([kind]) => v.facts.some((f) => f.kind === kind));
  if (!kinds.length) return null;
  return (
    <Section title={say(C.cardFor, lang)}>
      {kinds.map(([kind, name], at) => (
        <div key={kind} style={{ borderTop: at ? `0.5px solid ${INK.line}` : undefined, padding: `${at ? 12 : 4}px 16px 12px` }}>
          <h4 style={{ ...STEP.meta, color: INK.muted, textAlign: "start", marginBottom: 4 }}>{say(name, lang)}</h4>
          <div className="flex flex-col" style={{ gap: 6 }}>
            {v.facts
              .filter((f) => f.kind === kind)
              .map((f) => {
                const under = list([f.note, f.day ? dayLabel(f.day, lang, { thisYear: v.today }) : null], lang);
                return (
                  <div key={f.id}>
                    <Said text={f.name} />
                    {under ? (
                      <span className="block" style={{ ...STEP.meta, color: INK.muted, textAlign: "start" }}>
                        {under}
                      </span>
                    ) : null}
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </Section>
  );
}
