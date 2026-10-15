"use client";

/**
 * One person's page, over the board: who they are and since when, their
 * numbers since they joined, their last five weeks, the hours they use
 * Krovvi, what they use it for, and everything they did, day by day (never
 * what they wrote). On a phone it rises from the bottom; on a wide screen it
 * stands at the right.
 */

import { useEffect, useMemo, useState } from "react";

import type { Board, BoardSource, Happening, PersonDetail } from "@/lib/team";
import { Avatar, Legend, Pill, Quiet } from "./bits";
import { Bars, Breakdown, FG, HourStrip, TipRow, TipTitle } from "./charts";
import { lineWords } from "./live";
import { feedLines, peopleById } from "./model";
import { TAG_WORD, addDays, axisDay, byThem, clock, date, dateShort, dayName, dayOf, dayShort, hourOf, minutes, nameOf, plural, seconds, viaWord, when } from "./words";

const OTHER = "rgba(237,237,235,0.38)";

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

  const fiveWeeks = series.reduce(
    (t, s) => ({ days: t.days + (s.act ? 1 : 0), msgs: t.msgs + s.msgs, opens: t.opens + s.opens, voiceMs: t.voiceMs + s.voiceMs }),
    { days: 0, msgs: 0, opens: 0, voiceMs: 0 },
  );
  const t = detail?.totals;
  const live = !!person?.last && now - person.last < 10 * 60_000;
  const last = series.length - 1;

  const tiles: Array<{ label: string; value: string; sub?: string }> = [
    { label: "Days used", value: String(detail?.days ?? fiveWeeks.days), sub: detail?.first ? `since ${dateShort(detail.first)}` : "last 5 weeks" },
    { label: "Messages", value: (t?.msgs ?? fiveWeeks.msgs).toLocaleString("en-US"), sub: t?.failed ? `${t.failed} failed` : undefined },
    { label: "Opens", value: (t?.opens ?? fiveWeeks.opens).toLocaleString("en-US"), sub: "since 25 Sep" },
    { label: "Recorded", value: minutes(t?.voiceMs ?? fiveWeeks.voiceMs), sub: t ? plural(t.voice, "recording") : undefined },
    { label: "Notes", value: String(t ? t.notes - t.voice : "–"), sub: "besides recordings" },
    { label: "Typical answer", value: t?.med ? seconds(t.med) : "–" },
    { label: "Files Krovvi made", value: String(t?.krovviMade ?? "–") },
    { label: "App changes", value: String(t?.appChanges ?? "–"), sub: t?.krovviChanges ? `+ ${t.krovviChanges} by Krovvi` : undefined },
    { label: "Games", value: String(t?.games ?? "–") },
  ];

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={nameOf(person, id)}>
      <button aria-label="Close" className="team-fade absolute inset-0 cursor-default bg-black/65 backdrop-blur-[2px]" onClick={onClose} />
      <div className="team-sheet absolute inset-x-0 bottom-0 top-[calc(env(safe-area-inset-top)+28px)] flex flex-col overflow-hidden rounded-t-[26px] bg-[#0E0E0D] shadow-[0_-20px_60px_rgba(0,0,0,0.6)] md:inset-y-0 md:left-auto md:right-0 md:top-0 md:w-[580px] md:rounded-none md:rounded-l-[26px] md:border-l md:border-[#1F1F1E]">
        <div className="relative flex h-12 shrink-0 items-center justify-end px-3">
          <span className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-[#2C2C2A] md:hidden" />
          <button onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1B1B1A] text-[#A9A8A2] transition-colors duration-150 hover:bg-[#262625] hover:text-[#EDEDEB]">
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(32px+env(safe-area-inset-bottom))] sm:px-6">
          <div className="flex items-center gap-4">
            <Avatar person={person} size={60} live={live} />
            <div className="min-w-0">
              <h2 className="truncate text-[23px] font-semibold tracking-[-0.02em]">{nameOf(person, id)}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                {person ? <Pill tone={person.tag === "team" ? "team" : "plain"}>{TAG_WORD[person.tag]}</Pill> : null}
                {person ? <Pill>{viaWord(person.via)}</Pill> : null}
                {live ? <Pill tone="new">In Krovvi now</Pill> : null}
              </div>
            </div>
          </div>
          <p className="mt-3 text-[13.5px] text-[#A9A8A2]">
            {person ? `Joined ${date(person.joined)}` : ""}
            {person?.last ? ` · last seen ${when(person.last, now, today)}` : ""}
          </p>

          <div className="mt-5 grid grid-cols-3 overflow-hidden rounded-[20px] bg-[#161615]">
            {tiles.map((tile, i) => (
              <div key={tile.label} className={`p-3.5 ${i % 3 ? "border-l border-[#0E0E0D]" : ""} ${i >= 3 ? "border-t border-[#0E0E0D]" : ""}`}>
                <div className="text-[11.5px] text-[#8F8F8A]">{tile.label}</div>
                <div className="mt-1 text-[20px] font-semibold leading-none tracking-[-0.02em] tabular-nums">{tile.value}</div>
                {tile.sub ? <div className="mt-1.5 truncate text-[11px] text-[#7A7A74]">{tile.sub}</div> : null}
              </div>
            ))}
          </div>
          {state === "loading" ? <p className="mt-2 text-[12px] text-[#7A7A74]">Reading everything since they joined…</p> : null}
          {state === "none" && !detail ? <p className="mt-2 text-[12px] text-[#7A7A74]">These numbers cover the last five weeks.</p> : null}

          <Section title="Last five weeks" sub="Messages, and everything else they did, each day.">
            <Bars
              points={series.map((s) => ({ key: s.d, values: [s.msgs, s.other] }))}
              colors={[FG, OTHER]}
              height={150}
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
            <div className="mt-3">
              <Legend items={[{ color: FG, label: "Messages" }, { color: OTHER, label: "Notes, cards, apps, shares" }]} />
            </div>
          </Section>

          <Section title="When they use Krovvi" sub={detail ? "Every hour of every day since they joined, on Cairo’s clock." : "Today and yesterday, on Cairo’s clock."}>
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
                  { label: "Recordings", value: t.voice, shown: t.voice ? `${t.voice} (${minutes(t.voiceMs)})` : "0" },
                  { label: "Notes, documents, photos and links", value: t.notes - t.voice },
                  { label: "Answers to Krovvi’s cards", value: t.cards },
                  { label: "Files Krovvi made for them", value: t.krovviMade },
                  { label: "Changes in their apps", value: t.appChanges },
                  { label: "Games played", value: t.games },
                  { label: "Chats shared", value: t.shares },
                  { label: "Messages Krovvi started", value: t.krovviFirst },
                  { label: "Notifications from Krovvi", value: t.pushes },
                ]}
              />
            </Section>
          ) : null}

          <Section title="Day by day" sub="What they did, never what they wrote.">
            {byDay.length ? (
              <div className="grid gap-4">
                {byDay.slice(0, shownDays).map((g) => {
                  const lines = feedLines(g.items);
                  const did = g.items.filter((e) => byThem(e.k)).length;
                  return (
                    <div key={g.d}>
                      <div className="mb-1 flex items-baseline justify-between">
                        <span className="text-[13.5px] font-semibold">{dayName(g.d, today)}</span>
                        <span className="text-[12px] tabular-nums text-[#7A7A74]">{plural(did, "thing")}</span>
                      </div>
                      <ul className="divide-y divide-[#1A1A19] rounded-2xl bg-[#141413] px-3.5">
                        {lines.map((l) => {
                          const w = lineWords(l, g.d === today);
                          return (
                            <li key={l.key} className="flex items-start gap-3 py-2.5">
                              <span className="w-11 shrink-0 pt-[1px] text-[12.5px] font-medium tabular-nums text-[#8F8F8A]">{clock(l.at)}</span>
                              <span className="min-w-0 flex-1">
                                <span className={`block text-[13.5px] leading-snug ${w.bad ? "text-[#E5876B]" : w.quiet ? "text-[#8F8F8A]" : "text-[#EDEDEB]"}`}>{w.text.charAt(0).toUpperCase() + w.text.slice(1)}</span>
                                {w.sub ? <span className="mt-0.5 block text-[12px] tabular-nums text-[#7A7A74]">{w.sub}</span> : null}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
                {byDay.length > shownDays ? (
                  <button onClick={() => setShownDays((n) => n + 7)} className="rounded-2xl bg-[#161615] py-3 text-[13.5px] font-medium text-[#A9A8A2] transition-colors duration-150 hover:bg-[#1B1B1A] hover:text-[#EDEDEB]">
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

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="mt-7">
      <h3 className="text-[15px] font-semibold tracking-[-0.01em]">{title}</h3>
      {sub ? <p className="mt-0.5 text-[12.5px] text-[#8F8F8A]">{sub}</p> : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}
