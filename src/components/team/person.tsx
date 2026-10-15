"use client";

/**
 * One person's page, over the board: who they are and since when, their
 * numbers since they joined, their last five weeks, the hours they use
 * Krovvi, what they use it for, and everything they did, day by day (never
 * what they wrote). On a phone it rises from the bottom; on a wide screen it
 * stands at the right.
 */

import { useEffect, useMemo, useState, type ReactNode } from "react";

import type { Board, BoardSource, Happening, PersonDetail } from "@/lib/team";
import { Face, Key, Quiet, Tag } from "./bits";
import { Bars, Breakdown, FG, HourStrip, TipRow, TipTitle } from "./charts";
import { lineWords } from "./live";
import { feedLines, peopleById } from "./model";
import { TAG_WORD, addDays, axisDay, byThem, clock, dateShort, date, dayName, dayOf, dayShort, hourOf, minutes, nameOf, plural, seconds, viaWord, when } from "./words";

const OTHER = "rgba(237,237,235,0.32)";

export function PersonSheet({ id, board, source, now, onClose }: { id: string; board: Board; source: BoardSource; now: number; onClose: () => void }) {
  const people = useMemo(() => peopleById(board), [board]);
  const person = people.get(id);
  const [detail, setDetail] = useState<PersonDetail | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "none" | "offline">("loading");
  const [shownDays, setShownDays] = useState(4);

  // Read again whenever the board changed, so their page is live too.
  useEffect(() => {
    let alive = true;
    void source.person(id).then((a) => {
      if (!alive) return;
      if (a.kind === "person") {
        setDetail(a.person);
        setState("ready");
      } else if (a.kind === "offline") {
        setState((s) => (s === "ready" ? s : "offline"));
      } else {
        setState("none");
      }
    });
    return () => {
      alive = false;
    };
  }, [id, source, board.stamp]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = before;
    };
  }, [onClose]);

  const today = board.today;
  const series = useMemo(() => {
    const mine = new Map(board.days.filter((d) => d.p === id).map((d) => [d.d, d]));
    return Array.from({ length: 35 }, (_, i) => {
      const d = addDays(today, i - 34);
      const r = mine.get(d);
      return { d, msgs: r?.msgs ?? 0, other: r ? r.notes + r.cards + r.appChanges + r.shares : 0, opens: r?.opens ?? 0, act: !!r?.act, voiceMs: r?.voiceMs ?? 0 };
    });
  }, [board, id, today]);

  /** Their things: everything since they joined when the database answered, or else the board's last two days. */
  const events: Happening[] = useMemo(() => {
    if (detail) return detail.events.map((e) => ({ at: e.at, p: id, k: e.k, x: e.x }));
    return board.feed.filter((h) => h.p === id);
  }, [detail, board, id]);

  const hours = useMemo(() => {
    const out = new Array(24).fill(0);
    for (const e of events) if (byThem(e.k)) out[hourOf(e.at)] += 1;
    return out;
  }, [events]);

  const byDay = useMemo(() => {
    const groups: Array<{ d: string; items: Happening[] }> = [];
    for (const e of events) {
      const d = dayOf(e.at);
      const last = groups[groups.length - 1];
      if (last && last.d === d) last.items.push(e);
      else groups.push({ d, items: [e] });
    }
    return groups;
  }, [events]);

  const five = series.reduce((t, s) => ({ days: t.days + (s.act ? 1 : 0), msgs: t.msgs + s.msgs, opens: t.opens + s.opens, voiceMs: t.voiceMs + s.voiceMs }), { days: 0, msgs: 0, opens: 0, voiceMs: 0 });
  const t = detail?.totals;
  const live = !!person?.last && now - person.last < 10 * 60_000;
  const last = series.length - 1;
  const name = nameOf(person, id);

  const figures: Array<{ label: string; value: string; note?: string }> = [
    { label: "Days used", value: String(detail?.days ?? five.days), note: detail?.first ? `since ${dateShort(detail.first)}` : "last 5 weeks" },
    { label: "Messages", value: (t?.msgs ?? five.msgs).toLocaleString("en-US"), note: t?.failed ? `${t.failed} failed` : undefined },
    { label: "Opens", value: (t?.opens ?? five.opens).toLocaleString("en-US"), note: "since 25 Sep" },
    { label: "Recorded", value: minutes(t?.voiceMs ?? five.voiceMs), note: t ? plural(t.voice, "recording") : undefined },
    { label: "Notes", value: t ? String(t.notes - t.voice) : "–", note: "besides recordings" },
    { label: "Typical answer", value: t?.med ? seconds(t.med) : "–" },
  ];

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={name}>
      <button aria-label="Close" className="team-fade absolute inset-0 cursor-default bg-black/70 backdrop-blur-[3px]" onClick={onClose} />
      <div className="team-sheet absolute inset-x-0 bottom-0 top-[calc(env(safe-area-inset-top)+24px)] flex flex-col overflow-hidden rounded-t-[28px] border-t border-white/[0.08] bg-[#0B0B0D] shadow-[0_-24px_80px_rgba(0,0,0,0.7)] md:inset-y-0 md:left-auto md:right-0 md:top-0 md:w-[600px] md:rounded-none md:border-l md:border-t-0">
        <div className="relative flex h-14 shrink-0 items-center justify-end px-4">
          <span className="absolute left-1/2 top-2.5 h-1 w-9 -translate-x-1/2 rounded-full bg-white/[0.14] md:hidden" />
          <button onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-[#A9A8A2] transition-colors duration-150 hover:bg-white/[0.1] hover:text-[#EDEDEB]">
            <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-[calc(40px+env(safe-area-inset-bottom))] sm:px-8">
          <Face person={person} id={id} size={64} live={live} />
          <h2 className="mt-5 text-[32px] font-light leading-[38px] tracking-[-1px] text-[#EDEDEB]">{name}</h2>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[13.5px] text-[#8F8F8A]">
            {person ? <Tag>{TAG_WORD[person.tag]}</Tag> : null}
            {person ? <Tag>{viaWord(person.via)}</Tag> : null}
            {live ? <Tag tone="new">In Krovvi now</Tag> : null}
            <span className="ml-1">
              {person ? `Joined ${date(person.joined)}` : ""}
              {person?.last ? ` · last seen ${when(person.last, now, today)}` : ""}
            </span>
          </div>

          <div className="mt-7 grid grid-cols-3 border-y border-white/[0.07]">
            {figures.map((f, i) => (
              <div key={f.label} className={`py-4 ${i % 3 ? "border-l border-white/[0.07] pl-4" : "pr-4"} ${i >= 3 ? "border-t border-white/[0.07]" : ""}`}>
                <div className="text-[12px] font-medium text-[#7A7A74]">{f.label}</div>
                <div className="mt-1.5 text-[24px] font-light leading-[29px] tracking-[-0.8px] tabular-nums text-[#EDEDEB]">{f.value}</div>
                {f.note ? <div className="mt-1 truncate text-[11.5px] text-[#6A6A66]">{f.note}</div> : null}
              </div>
            ))}
          </div>
          {state === "loading" ? <p className="mt-2 text-[12px] text-[#6A6A66]">Reading everything since they joined…</p> : null}
          {state === "none" && !detail ? <p className="mt-2 text-[12px] text-[#6A6A66]">These numbers cover the last five weeks.</p> : null}

          <Section title="Last five weeks" right={<Key items={[{ color: FG, label: "Messages" }, { color: OTHER, label: "Everything else" }]} />}>
            <Bars
              points={series.map((s) => ({ key: s.d, values: [s.msgs, s.other] }))}
              colors={[FG, OTHER]}
              height={160}
              floor={3}
              now={last}
              label={(i) => (i === last || (last - i) % 7 === 0 ? axisDay(series[i].d) : "")}
              tip={(i) => (
                <>
                  <TipTitle>{dayShort(series[i].d)}</TipTitle>
                  <TipRow color={FG} label="Messages" value={series[i].msgs} />
                  <TipRow color={OTHER} label="Everything else" value={series[i].other} />
                  <TipRow label="Opens" value={series[i].opens} />
                </>
              )}
            />
          </Section>

          <Section title="When they use Krovvi" sub={detail ? "Every hour since they joined, on Cairo’s clock." : "Today and yesterday, on Cairo’s clock."}>
            <HourStrip
              values={hours}
              tip={(h) => (
                <>
                  <TipTitle>
                    {String(h).padStart(2, "0")}:00 to {String((h + 1) % 24).padStart(2, "0")}:00
                  </TipTitle>
                  <TipRow label="Things done" value={hours[h]} />
                </>
              )}
            />
          </Section>

          {t ? (
            <Section title="What they use">
              <Breakdown
                rows={[
                  { label: "Messages to Krovvi", value: t.msgs },
                  { label: "Recordings", value: t.voice, shown: t.voice ? `${t.voice} · ${minutes(t.voiceMs)}` : "0" },
                  { label: "Notes, documents, photos and links", value: t.notes - t.voice },
                  { label: "Answers to Krovvi’s cards", value: t.cards },
                  { label: "Files Krovvi made for them", value: t.krovviMade },
                  { label: "Changes in their apps", value: t.appChanges },
                  { label: "Games played", value: t.games },
                  { label: "Chats shared", value: t.shares },
                ]}
              />
            </Section>
          ) : null}

          <Section title="Day by day" sub="What they did, never what they wrote.">
            {byDay.length ? (
              <div className="flex flex-col gap-6">
                {byDay.slice(0, shownDays).map((g) => {
                  const lines = feedLines(g.items);
                  const did = g.items.filter((e) => byThem(e.k)).length;
                  return (
                    <div key={g.d}>
                      <div className="mb-1.5 flex items-baseline justify-between border-b border-white/[0.07] pb-2">
                        <span className="text-[13.5px] font-medium text-[#EDEDEB]">{dayName(g.d, today)}</span>
                        <span className="text-[12px] tabular-nums text-[#6A6A66]">{plural(did, "thing")}</span>
                      </div>
                      <ol>
                        {lines.map((l) => {
                          const w = lineWords(l, g.d === today);
                          return (
                            <li key={l.key} className="grid grid-cols-[46px_1fr] gap-x-2 py-1.5">
                              <span className="text-[12px] tabular-nums leading-[20px] text-[#6A6A66]">{clock(l.at)}</span>
                              <span className="min-w-0">
                                <span className="block text-[13.5px] leading-[20px]" style={{ color: w.bad ? "#E5876B" : w.quiet ? "#7A7A74" : "#D9D8D3" }}>
                                  {w.text.charAt(0).toUpperCase() + w.text.slice(1)}
                                </span>
                                {w.sub ? <span className="block text-[12px] tabular-nums leading-[17px] text-[#6A6A66]">{w.sub}</span> : null}
                              </span>
                            </li>
                          );
                        })}
                      </ol>
                    </div>
                  );
                })}
                {byDay.length > shownDays ? (
                  <button onClick={() => setShownDays((n) => n + 7)} className="rounded-full border border-white/[0.08] py-2.5 text-[13px] font-medium text-[#A9A8A2] transition-colors duration-150 hover:text-[#EDEDEB]">
                    Show earlier days ({byDay.length - shownDays} more)
                  </button>
                ) : null}
              </div>
            ) : (
              <Quiet>{state === "loading" ? "Reading…" : "Nothing in the last two days."}</Quiet>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, sub, right, children }: { title: string; sub?: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-10">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[15px] font-semibold tracking-[-0.2px] text-[#EDEDEB]">{title}</h3>
          {sub ? <p className="mt-1 text-[13px] text-[#7A7A74]">{sub}</p> : null}
        </div>
        {right ? <div className="shrink-0 pt-0.5">{right}</div> : null}
      </div>
      {children}
    </section>
  );
}
