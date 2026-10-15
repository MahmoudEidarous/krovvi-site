"use client";

/**
 * People: everyone who used Krovvi over a stretch of days, one line each,
 * with what they did and their last two weeks as tiny bars. Outside people
 * with an account first; guests (no sign-in, where our own test phones also
 * land) and the team each have their own filter. Tap a line for the person.
 */

import { useMemo, useState } from "react";

import type { Board, Person } from "@/lib/team";
import { Avatar, Card, Chips, Pill, Quiet, Segmented } from "./bits";
import { Spark } from "./charts";
import { RANGES, rangeSpan, rollups, things, type Range, type Rollup } from "./model";
import { addDays, ago, date, dayOf, minutes, nameOf, plural, viaWord } from "./words";

type Group = "outside" | "guest" | "team" | "all";
type Sort = "active" | "recent" | "new";

interface Row {
  p: Person;
  r: Rollup;
  isNew: boolean;
  spark: number[];
}

const EMPTY = (p: string): Rollup => ({ p, days: 0, opens: 0, msgs: 0, failed: 0, krovviFirst: 0, notes: 0, voice: 0, voiceMs: 0, games: 0, cards: 0, appChanges: 0, krovviChanges: 0, appsMade: 0, shares: 0, problems: 0, pushes: 0, krovviMade: 0 });

const RANGE_WORDS: Record<Range, string> = { today: "today", yesterday: "yesterday", "7d": "in the last 7 days", "30d": "in the last 30 days" };

export function PeopleTab({ board, now, onPerson }: { board: Board; now: number; onPerson: (id: string) => void }) {
  const [range, setRange] = useState<Range>("7d");
  const [group, setGroup] = useState<Group>("outside");
  const [sort, setSort] = useState<Sort>("active");
  const { from, to } = rangeSpan(range, board.today);

  const rows = useMemo(() => {
    const roll = rollups(board, from, to);
    const sparkFrom = addDays(board.today, -13);
    const sparks = new Map<string, number[]>();
    for (const d of board.days) {
      if (d.d < sparkFrom) continue;
      let s = sparks.get(d.p);
      if (!s) sparks.set(d.p, (s = new Array(14).fill(0)));
      const i = 13 - Math.round((Date.parse(board.today) - Date.parse(d.d)) / 86_400_000);
      if (i >= 0 && i < 14) s[i] = d.msgs + d.notes + d.cards + d.appChanges + d.shares + (d.act && d.opens ? 1 : 0);
    }
    const out: Row[] = [];
    for (const p of board.people) {
      const r = roll.get(p.id);
      const joinedDay = dayOf(p.joined);
      const isNew = joinedDay >= from && joinedDay <= to;
      if (!(r && r.days > 0) && !isNew) continue;
      out.push({ p, r: r ?? EMPTY(p.id), isNew, spark: sparks.get(p.id) ?? new Array(14).fill(0) });
    }
    return out;
  }, [board, from, to]);

  const counts = useMemo(() => {
    const c = { outside: 0, guest: 0, team: 0, all: rows.length };
    for (const row of rows) c[row.p.tag] += 1;
    return c;
  }, [rows]);

  const shown = useMemo(() => {
    const list = rows.filter((row) => group === "all" || row.p.tag === group);
    const score = (row: Row) => things(row.r) * 3 + row.r.opens + row.r.days * 2;
    if (sort === "active") list.sort((a, b) => score(b) - score(a) || (b.p.last ?? 0) - (a.p.last ?? 0));
    if (sort === "recent") list.sort((a, b) => (b.p.last ?? 0) - (a.p.last ?? 0));
    if (sort === "new") list.sort((a, b) => b.p.joined - a.p.joined);
    return list;
  }, [rows, group, sort]);

  const newCount = shown.filter((r) => r.isNew).length;

  return (
    <div className="grid grid-cols-1 gap-3 md:gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Segmented<Range> label="Days" value={range} onChange={setRange} options={RANGES} />
        <Segmented<Sort>
          label="Order"
          value={sort}
          onChange={setSort}
          options={[
            { id: "active", label: "Most active" },
            { id: "recent", label: "Last seen" },
            { id: "new", label: "Newest" },
          ]}
        />
      </div>
      <Chips<Group>
        label="Who"
        value={group}
        onChange={setGroup}
        options={[
          { id: "outside", label: "Outside", count: counts.outside },
          { id: "guest", label: "Guests", count: counts.guest },
          { id: "team", label: "Team", count: counts.team },
          { id: "all", label: "Everyone", count: counts.all },
        ]}
      />
      <Card pad={false} title={`${plural(shown.length, "person", "people")} ${RANGE_WORDS[range]}`} sub={newCount ? `${newCount} of them new` : group === "guest" ? "No sign-in. Our own test phones show up here too." : undefined}>
        {shown.length ? (
          <>
            <div className="hidden grid-cols-[minmax(230px,2.4fr)_repeat(6,minmax(64px,0.7fr))_96px] gap-3 border-b border-[#1F1F1E] px-5 pb-2.5 text-[11.5px] font-medium text-[#7A7A74] md:grid">
              <span>Person</span>
              <span className="text-right">Days</span>
              <span className="text-right">Opens</span>
              <span className="text-right">Messages</span>
              <span className="text-right">Notes</span>
              <span className="text-right">Recorded</span>
              <span className="text-right">Games</span>
              <span className="text-right">Last 14 days</span>
            </div>
            <ul className="divide-y divide-[#1F1F1E] pb-1.5">
              {shown.map((row) => (
                <li key={row.p.id}>
                  <PersonLine row={row} now={now} onPerson={onPerson} />
                </li>
              ))}
            </ul>
          </>
        ) : (
          <Quiet>Nobody here {RANGE_WORDS[range]}.</Quiet>
        )}
      </Card>
    </div>
  );
}

function PersonLine({ row, now, onPerson }: { row: Row; now: number; onPerson: (id: string) => void }) {
  const { p, r } = row;
  const seen = p.last ? (now - p.last < 60_000 ? "just now" : `${ago(p.last, now)} ago`) : "nothing yet";
  const stats = [
    r.msgs ? plural(r.msgs, "message") : null,
    r.opens ? plural(r.opens, "open") : null,
    r.notes ? plural(r.notes, "note") : null,
    r.voiceMs ? `${minutes(r.voiceMs)} recorded` : null,
    r.games ? plural(r.games, "game") : null,
    r.krovviMade ? `${plural(r.krovviMade, "file")} Krovvi made` : null,
  ].filter(Boolean);
  const num = (v: number) => <span className={`text-right tabular-nums ${v ? "text-[#EDEDEB]" : "text-[#3A3A38]"}`}>{v ? v.toLocaleString("en-US") : "0"}</span>;
  return (
    <button onClick={() => onPerson(p.id)} className="block w-full text-left transition-colors duration-150 hover:bg-[#1B1B1A] active:bg-[#1F1F1E]">
      <div className="flex items-center gap-3 px-4 py-3 md:hidden">
        <Avatar person={p} size={40} live={!!p.last && now - p.last < 10 * 60_000} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[15px] font-semibold">{nameOf(p)}</span>
            {row.isNew ? <Pill tone="new">New</Pill> : null}
            {p.tag === "team" ? <Pill tone="team">Team</Pill> : null}
          </div>
          <div className="mt-0.5 truncate text-[12.5px] text-[#8F8F8A]">
            Last seen {seen} · {viaWord(p.via)}
          </div>
          <div className="mt-1 truncate text-[13px] text-[#A9A8A2]">{stats.length ? stats.join(" · ") : "Signed up, nothing else yet"}</div>
        </div>
        <Spark values={row.spark} width={64} height={26} />
      </div>
      <div className="hidden grid-cols-[minmax(230px,2.4fr)_repeat(6,minmax(64px,0.7fr))_96px] items-center gap-3 px-5 py-3 text-[14px] md:grid">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar person={p} size={36} live={!!p.last && now - p.last < 10 * 60_000} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-semibold">{nameOf(p)}</span>
              {row.isNew ? <Pill tone="new">New</Pill> : null}
              {p.tag === "team" ? <Pill tone="team">Team</Pill> : null}
            </div>
            <div className="truncate text-[12.5px] text-[#8F8F8A]">
              Last seen {seen} · joined {date(p.joined)} · {viaWord(p.via)}
            </div>
          </div>
        </div>
        {num(r.days)}
        {num(r.opens)}
        {num(r.msgs)}
        {num(r.notes)}
        <span className={`text-right tabular-nums ${r.voiceMs ? "text-[#EDEDEB]" : "text-[#3A3A38]"}`}>{r.voiceMs ? minutes(r.voiceMs) : "0"}</span>
        {num(r.games)}
        <span className="flex justify-end">
          <Spark values={row.spark} width={84} height={24} />
        </span>
      </div>
    </button>
  );
}
