"use client";

/**
 * Health on the page, drawn as the app draws its screens (catch8
 * src/components/objects/kinds/health). Most often it is one kept for a
 * family member, opened by a son or a daughter who helps: the one thing that
 * matters now on top (a dose that waits, the next one, a visit today), then
 * today's doses down the day like a schedule, each with a tick for whoever
 * gave it and who that was, so nobody gives one twice; what is running low
 * with the way to say a new box came; every medicine with its last two
 * weeks; and then whatever else their copy holds (visits, readings, nights,
 * symptoms, results, the card), each part only when there is something in
 * it. Someone given a look at a person's own sees only what was shared.
 *
 * Nothing here advises: it says what was given and what is kept. A tick
 * answers at once and goes back if it did not go through; a dose still hours
 * away asks once before it is marked, since a mark tells the whole family.
 */

import { useEffect, useRef, useState } from "react";

import { say, type Lang } from "@/lib/objects";
import { INK, Pill, Section, STEP, dirOf } from "../kit";
import { Mark } from "../mark";
import type { KindPage } from "../types";
import { Squares, Stat, Stats } from "./chart";
import { Card, Coin, Cycle, Feels, Readings, Results, Sleep, TINT, Visits } from "./health/body";
import { C, CALLS, DOT, keptFor, list, ofDoses, pillsLeftWords, sharedBy, stillToCome, takenAt, takenToday, tickWords, type DoseSlot, type HealthView, type Med } from "./health/parts";
import { Box, Chevron, Head, Sheet, TickArea, Wide, useRun, wash, type Call } from "./sheet";
import { dayLetter, timeLabel, western } from "./when";

/** A dose's time at the head of its row: the hour, and AM or PM small under it, so a day's doses read down like a schedule. */
function TimeLead({ time, strong, lang }: { time: string; strong: boolean; lang: Lang }) {
  const [clock, half] = timeLabel(time, lang).split(" ");
  return (
    <span className="flex shrink-0 flex-col items-center" style={{ width: 46 }}>
      <span style={{ ...STEP.label, color: strong ? INK.fg : INK.soft, fontVariantNumeric: "tabular-nums" }}>{clock}</span>
      <span style={{ ...STEP.meta, color: INK.muted, marginTop: -2 }}>{half}</span>
    </span>
  );
}

/** The last seven days of doses, a pillar a day: how many of the day's doses were given, and the count under it. */
function Week({ v, lang }: { v: HealthView; lang: Lang }) {
  return (
    <div className="flex" style={{ gap: 6 }} role="img" aria-label={`${say(C.last7, lang)}: ${v.meds.week.map((d) => `${say(d.label, lang)} ${say(ofDoses(d.given, d.total), lang)}`).join(", ")}`}>
      {v.meds.week.map((d) => {
        const share = d.total ? d.given / d.total : 0;
        const today = d.day === v.today;
        return (
          <div key={d.day} className="flex min-w-0 flex-1 flex-col items-center" style={{ gap: 5 }} aria-hidden>
            <span className="relative block overflow-hidden" style={{ width: 18, height: 58, borderRadius: 9, boxSizing: "border-box", background: d.total ? INK.track : "transparent", border: d.total ? "none" : `0.5px solid ${INK.line}` }}>
              {d.total && share > 0 ? <span className="absolute inset-x-0 bottom-0 block" style={{ height: `${Math.max(12, Math.round(share * 100))}%`, borderRadius: 9, background: share >= 1 ? TINT : wash(TINT, 0.5) }} /> : null}
            </span>
            <span dir="ltr" style={{ ...STEP.meta, fontSize: 11, lineHeight: "14px", color: today ? INK.fg : INK.soft, fontVariantNumeric: "tabular-nums" }}>
              {d.total ? `${d.given}/${d.total}` : " "}
            </span>
            <span style={{ ...STEP.meta, color: today ? INK.fg : INK.muted, marginTop: -3 }}>{dayLetter(d.day, lang)}</span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * One medicine, opened: when it is taken and what for, what is left, its
 * last two weeks, and the way to say a new box came (how many are in it).
 * No dose is ever suggested here: the number typed is a count of pills.
 */
function MedSheet({ med, lang, mayRefill, onClose, send }: { med: Med; lang: Lang; mayRefill: boolean; onClose: () => void; send: (call: Call) => void }) {
  const [box, setBox] = useState("");
  const n = /^\d{1,4}$/.test(box.trim()) ? Number(box.trim()) : 0;
  const save = () => {
    if (n < 1 || n > 5000) return;
    onClose();
    send(CALLS.refill(med, n));
  };
  const facts = list([say(med.when, lang), med.note], lang);
  return (
    <Sheet title={list([med.name, med.dose], lang)} lang={lang} onClose={onClose} foot={mayRefill ? <Wide strong text={say(C.save, lang)} disabled={n < 1 || n > 5000} onClick={save} /> : undefined}>
      <p style={{ ...STEP.body, color: INK.soft, textAlign: "start", margin: "2px 2px 0" }}>{facts}</p>
      {med.left !== null ? (
        <p style={{ ...STEP.body, color: med.low ? INK.fg : INK.muted, textAlign: "start", margin: "6px 2px 0" }}>{`${say(pillsLeftWords(med.left, med.asNeeded ? null : med.daysLeft), lang)}${med.low ? `${DOT}${say(C.low, lang)}` : ""}`}</p>
      ) : null}
      {med.asNeeded ? null : (
        <>
          <Head text={say(C.twoWeeks, lang)} />
          <Squares days={med.days14} tint={TINT} label={say(C.twoWeeks, lang)} />
        </>
      )}
      {mayRefill ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <Head text={say(C.refill, lang)} />
          <Box value={box} onChange={(t) => setBox(western(t).replace(/[^\d]/g, ""))} placeholder={say(C.refillLine, lang)} label={`${say(C.refill, lang)}: ${say(C.refillLine, lang)}`} lang={lang} max={4} mode="numeric" />
          <button type="submit" hidden />
        </form>
      ) : null}
    </Sheet>
  );
}

export const Page: KindPage = ({ page, view, lang, act, can }) => {
  const v = view as HealthView;
  const may = (op: string) => page.state === "live" && can(op);
  const run = useRun(act);
  const me = page.members.find((m) => m.you) ?? null;
  const owner = page.members.find((m) => m.role === "owner") ?? null;

  // What the reader just ticked and the server has not shown yet: a dose given (true) or taken back (false).
  const [marks, setMarks] = useState<Record<string, boolean>>({});
  const flying = useRef(new Set<string>());
  // A dose still hours away, waiting for a yes before it is marked.
  const [asking, setAsking] = useState<string | null>(null);
  const [medOpen, setMedOpen] = useState<string | null>(null);

  const keyOf = (x: DoseSlot) => `${x.med}:${x.time}`;
  const givenOf = (x: DoseSlot) => marks[keyOf(x)] ?? x.state === "given";

  // The server's page takes over as it comes: a mark it agrees with has done its work.
  useEffect(() => {
    const given = new Map(v.meds.ring.map((x) => [`${x.med}:${x.time}`, x.state === "given"]));
    setMarks((m) => {
      const kept = Object.entries(m).filter(([k, to]) => given.has(k) && given.get(k) !== to);
      return kept.length === Object.keys(m).length ? m : Object.fromEntries(kept);
    });
  }, [v]);

  const mark = (x: DoseSlot, to: boolean) => {
    const k = keyOf(x);
    if (flying.current.has(k)) return;
    const there = x.state === "given";
    setMarks((m) => {
      const next = { ...m };
      if (to === there) delete next[k];
      else next[k] = to;
      return next;
    });
    flying.current.add(k);
    void run(to ? CALLS.take(x) : CALLS.untake(x)).then((ok) => {
      flying.current.delete(k);
      if (!ok)
        setMarks((m) => {
          const next = { ...m };
          delete next[k];
          return next;
        });
    });
  };
  const tap = (x: DoseSlot) => {
    const done = givenOf(x);
    // Hours before its time, ask once: a stray tap must never tell the family a dose is given when it is not.
    if (!done && x.state === "later") return setAsking(keyOf(x));
    mark(x, !done);
  };

  const ring = v.meds.ring;
  const needed = v.meds.meds.filter((m) => m.asNeeded);
  const due = ring.filter((x) => x.state === "due" && !givenOf(x));
  const given = ring.filter((x) => givenOf(x)).length;
  const week = v.meds.week;
  const given7 = week.reduce((a, d) => a + d.given, 0);
  const total7 = week.reduce((a, d) => a + d.total, 0);
  const opened = medOpen ? (v.meds.meds.find((m) => m.id === medOpen) ?? null) : null;
  const label = v.hero.kind === "due" ? C.now : v.hero.kind === "next" ? C.next : v.hero.kind === "sleep" ? C.lastNight : v.hero.kind === "visit" ? C.nextVisit : null;
  const markWords = say(v.own ? C.markTaken : C.markGiven, lang);

  const doses =
    ring.length || needed.length ? (
      <Section title={say(C.dosesToday, lang)} action={ring.length ? <span style={{ ...STEP.label, color: INK.muted, fontVariantNumeric: "tabular-nums" }}>{say(ofDoses(given, ring.length), lang)}</span> : undefined}>
        {ring.map((x, i) => {
          const done = givenOf(x);
          const time = timeLabel(x.time, lang);
          const sub = x.state === "given" ? say(takenAt(x.at ? timeLabel(x.at, lang) : "", x.byName, v.own), lang) : x.state === "skipped" ? say(C.skipped, lang) : x.state === "due" ? say(C.due, lang) : say(C.later, lang);
          const by = v.own ? null : x.state === "given" ? x.byName : (me?.name ?? null);
          return (
            <div key={keyOf(x)}>
              {i ? <div style={{ height: 0.5, background: INK.line, marginInlineStart: 16 }} /> : null}
              <div className="flex items-center" style={{ gap: 12, padding: "0 16px", minHeight: 58 }}>
                <TimeLead time={x.time} strong={x.state === "due" && !done} lang={lang} />
                <span className="min-w-0 flex-1" style={{ padding: "9px 0" }}>
                  <span className="block" style={{ ...STEP.body, color: x.state === "skipped" ? INK.muted : INK.fg, textAlign: "start" }}>
                    {list([x.name, x.dose], lang)}
                  </span>
                  <span className="block" style={{ ...STEP.meta, color: INK.muted, textAlign: "start" }}>
                    {sub}
                  </span>
                </span>
                {/* A ring is drawn only for a reader who may tick it; a dose given shows its check to everyone. */}
                {x.state === "skipped" || (!done && !may("take")) ? null : <TickArea done={done} by={done ? by : null} size={30} label={say(tickWords(x.name, time, done, v.own), lang)} onClick={may(done ? "untake" : "take") ? () => tap(x) : undefined} />}
              </div>
              {asking === keyOf(x) ? (
                <div style={{ padding: "0 16px 14px", paddingInlineStart: 74 }}>
                  <p style={{ ...STEP.meta, color: INK.soft, textAlign: "start" }}>{say(stillToCome(time, x.name, v.own), lang)}</p>
                  <div className="flex flex-wrap" style={{ gap: 8, marginTop: 10 }}>
                    <Pill
                      strong
                      text={markWords}
                      onClick={() => {
                        setAsking(null);
                        mark(x, true);
                      }}
                    />
                    <Pill text={say(C.notNow, lang)} onClick={() => setAsking(null)} />
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
        {needed.map((m, i) => (
          <div key={m.id}>
            {i || ring.length ? <div style={{ height: 0.5, background: INK.line, marginInlineStart: 16 }} /> : null}
            <div className="flex items-center" style={{ gap: 12, padding: "9px 16px", minHeight: 58 }}>
              <span className="flex shrink-0 items-center justify-center" style={{ width: 46 }} aria-hidden>
                <Mark name="pill" size={20} color={INK.muted} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block" style={{ ...STEP.body, textAlign: "start" }}>
                  {list([m.name, m.dose], lang)}
                </span>
                <span className="block" style={{ ...STEP.meta, color: INK.muted, textAlign: "start" }}>
                  {`${say(C.asNeeded, lang)}${m.today ? `${DOT}${say(takenToday(m.today), lang)}` : ""}`}
                </span>
                {m.today > 0 && may("untake") ? (
                  <button type="button" className="mt-1 block underline decoration-dotted underline-offset-2 active:opacity-70" style={{ ...STEP.meta, color: INK.soft }} onClick={() => void run(CALLS.takeBack(m))}>
                    {say(C.takeBack, lang)}
                  </button>
                ) : null}
              </span>
              {may("take") ? <Pill text={say(v.own ? C.takeOne : C.giveOne, lang)} onClick={() => void run(CALLS.takeOne(m))} /> : null}
            </div>
          </div>
        ))}
      </Section>
    ) : null;

  const medicines = v.meds.meds.length ? (
    <Section title={say(C.medicines, lang)}>
      {total7 ? (
        <div className="flex flex-col" style={{ gap: 14, padding: "6px 16px 14px" }}>
          <Stats>
            <Stat small name={say(C.todayWord, lang)} value={ring.length ? say(ofDoses(given, ring.length), lang) : say(C.noDoses, lang)} />
            <Stat small end name={say(C.last7, lang)} value={say(ofDoses(given7, total7), lang)} />
          </Stats>
          <Week v={v} lang={lang} />
        </div>
      ) : null}
      {v.meds.meds.map((m, i) => {
        const facts = list([say(m.when, lang), m.note], lang);
        const left = m.left !== null ? `${say(pillsLeftWords(m.left, m.asNeeded ? null : m.daysLeft), lang)}${m.low ? `${DOT}${say(C.low, lang)}` : ""}` : null;
        return (
          <div key={m.id}>
            {i || total7 ? <div style={{ height: 0.5, background: INK.line, marginInlineStart: i ? 72 : 0 }} /> : null}
            <button type="button" onClick={() => setMedOpen(m.id)} className="flex w-full items-center text-start active:opacity-70" style={{ gap: 12, padding: "10px 16px", minHeight: 64 }}>
              <Coin mark="pill" plain={m.asNeeded} />
              <span className="min-w-0 flex-1">
                <span className="block" style={{ ...STEP.body, fontWeight: 500, textAlign: "start" }}>
                  {list([m.name, m.dose], lang)}
                </span>
                <span className="block" style={{ ...STEP.meta, color: INK.muted, textAlign: "start" }}>
                  {facts}
                </span>
                {left ? (
                  <span className="block" style={{ ...STEP.meta, color: m.low ? INK.soft : INK.muted, textAlign: "start" }}>
                    {left}
                  </span>
                ) : null}
              </span>
              <Chevron lang={lang} />
            </button>
            {m.asNeeded ? null : (
              <div style={{ padding: "0 16px 14px", paddingInlineStart: 72, marginTop: -2 }}>
                <Squares days={m.days14} tint={TINT} label={`${m.name}: ${say(C.twoWeeks, lang)}`} />
              </div>
            )}
          </div>
        );
      })}
    </Section>
  ) : null;

  const sheet = opened ? <MedSheet key={opened.id} med={opened} lang={lang} mayRefill={may("refill")} onClose={() => setMedOpen(null)} send={(call) => void run(call)} /> : null;

  // Someone given a look at a person's own: the cycle's two facts, the doses when they are shared, and a plain line saying that is all.
  if (!v.full) {
    return (
      <div>
        {v.cycle ? (
          <section className="mb-3 flex flex-col" style={{ background: INK.surface, borderRadius: 17, padding: "16px 16px 18px", gap: 4 }}>
            <span style={{ ...STEP.label, color: INK.muted, textAlign: "start" }}>{say(C.cycle, lang)}</span>
            <span style={{ ...STEP.display, fontSize: 30, lineHeight: "36px", textAlign: "start" }}>{say(v.cycle.phaseWords, lang)}</span>
            {v.cycle.next ? <span style={{ ...STEP.body, color: INK.muted, textAlign: "start" }}>{say(v.cycle.next.words, lang)}</span> : null}
          </section>
        ) : null}
        {doses}
        {medicines}
        {v.empty ? (
          <section className="mb-3 flex flex-col items-center text-center" style={{ background: INK.surface, borderRadius: 17, padding: "28px 20px", gap: 6 }}>
            <span style={STEP.title}>{say(C.nothingYet, lang)}</span>
            <span style={{ ...STEP.meta, color: INK.muted }}>{say(C.nothingShared, lang)}</span>
          </section>
        ) : owner && !owner.you ? (
          <p className="text-center" style={{ ...STEP.meta, color: INK.faint, margin: "4px 16px 12px" }}>
            {say(sharedBy(owner.name), lang)}
          </p>
        ) : null}
        {sheet}
      </div>
    );
  }

  return (
    <div>
      {v.empty ? (
        <section className="mb-3 flex flex-col items-center text-center" style={{ background: INK.surface, borderRadius: 17, padding: "28px 20px", gap: 6 }}>
          <span style={STEP.title}>{v.forName ? say(keptFor(v.forName), lang) : say(C.health, lang)}</span>
          <span style={{ ...STEP.meta, color: INK.muted }}>{say(C.nothingKept, lang)}</span>
        </section>
      ) : (
        <section className="mb-3 flex flex-col" style={{ background: INK.surface, borderRadius: 17, padding: "16px 16px 18px", gap: 4 }}>
          {label ? <span style={{ ...STEP.label, color: INK.muted, textAlign: "start" }}>{say(label, lang)}</span> : null}
          <span style={{ ...STEP.display, textAlign: "start", overflowWrap: "anywhere" }}>
            <bdi dir={dirOf(say(v.hero.big, lang))}>{say(v.hero.big, lang)}</bdi>
          </span>
          {v.hero.line ? <span style={{ ...STEP.body, color: INK.muted, textAlign: "start" }}>{say(v.hero.line, lang)}</span> : null}
          {due.length && may("take") ? (
            <div style={{ marginTop: 12 }}>
              <Wide strong text={markWords} onClick={() => due.forEach((x) => mark(x, true))} />
            </div>
          ) : null}
        </section>
      )}

      {doses}

      {v.meds.low.length ? (
        <Section title={say(C.lowHead, lang)}>
          {v.meds.low.map((l, i) => {
            const m = v.meds.meds.find((x) => x.id === l.id);
            return (
              <div key={l.id}>
                {i ? <div style={{ height: 0.5, background: INK.line, marginInlineStart: 16 }} /> : null}
                <div className="flex items-center" style={{ gap: 12, padding: "10px 16px", minHeight: 56 }}>
                  <span className="min-w-0 flex-1">
                    <span className="block" style={{ ...STEP.body, textAlign: "start" }}>
                      {list([l.name, m?.dose], lang)}
                    </span>
                    {m && m.left !== null ? (
                      <span className="block" style={{ ...STEP.meta, color: INK.muted, textAlign: "start" }}>
                        {say(pillsLeftWords(m.left, l.daysLeft), lang)}
                      </span>
                    ) : null}
                  </span>
                  {may("refill") ? <Pill text={say(C.refill, lang)} onClick={() => setMedOpen(l.id)} /> : null}
                </div>
              </div>
            );
          })}
        </Section>
      ) : null}

      {medicines}
      <Visits v={v} lang={lang} />
      <Readings v={v} lang={lang} />
      <Sleep v={v} lang={lang} />
      <Feels v={v} lang={lang} />
      <Cycle v={v} lang={lang} />
      <Results v={v} lang={lang} />
      <Card v={v} lang={lang} />
      {sheet}
    </div>
  );
};
