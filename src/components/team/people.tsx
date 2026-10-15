"use client";

/**
 * People: everyone who used Krovvi over a stretch of days, one line each:
 * what they did and their last two weeks as tiny bars. Outside people with
 * an account first; guests (no sign-in, where our own test phones also land)
 * and the team have their own choice. Tap a line for the person.
 */

import { useMemo, useState } from "react";

import type { Board, Person } from "@/lib/team";
import { Face, Pane, Quiet, Segmented, Statement, Tag } from "./bits";
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
const GROUP_WORDS: Record<Group, [string, string]> = { outside: ["person", "people"], guest: ["guest", "guests"], team: ["teammate", "teammates"], all: ["person", "people"] };

/** The table's columns on a wide screen. */
const COLS = "md:grid-cols-[minmax(0,1fr)_64px_64px_80px_64px_84px_56px_96px]";

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
  const [one, many] = GROUP_WORDS[group];

  return (
    <div className="grid grid-cols-1 gap-6">
      <Statement
        figure={shown.length}
        noun={shown.length === 1 ? one : many}
        rest={`used Krovvi ${RANGE_WORDS[range]}`}
        under={newCount ? `${newCount} of them new.` : group === "guest" ? "No sign-in. Our own test phones land here too." : undefined}
      />

      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
          <Segmented<Range> label="Days" value={range} onChange={setRange} options={RANGES} />
          <Segmented<Group>
            label="Who"
            value={group}
            onChange={setGroup}
            options={[
              { id: "outside", label: `Outside ${counts.outside}` },
              { id: "guest", label: `Guests ${counts.guest}` },
              { id: "team", label: `Team ${counts.team}` },
              { id: "all", label: `All ${counts.all}` },
            ]}
          />
        </div>
        <Segmented<Sort>
          label="Order"
          size="sm"
          value={sort}
          onChange={setSort}
          options={[
            { id: "active", label: "Most active" },
            { id: "recent", label: "Last seen" },
            { id: "new", label: "Newest" },
          ]}
        />
      </div>

      <Pane className="px-4 py-2 sm:px-6">
        {shown.length ? (
          <>
            <div className={`hidden gap-4 border-b border-white/[0.06] py-3 pl-[50px] text-[12px] font-medium text-[#7A7A74] md:grid ${COLS}`}>
              <span>Person</span>
              <span className="text-right">Days</span>
              <span className="text-right">Opens</span>
              <span className="text-right">Messages</span>
              <span className="text-right">Notes</span>
              <span className="text-right">Recorded</span>
              <span className="text-right">Games</span>
              <span className="text-right">14 days</span>
            </div>
            <ul>
              {shown.map((row, i) => (
                <li key={row.p.id}>
                  <PersonLine row={row} first={i === 0} now={now} onPerson={onPerson} />
                </li>
              ))}
            </ul>
          </>
        ) : (
          <Quiet>No one here {RANGE_WORDS[range]}.</Quiet>
        )}
      </Pane>
    </div>
  );
}

function PersonLine({ row, first, now, onPerson }: { row: Row; first: boolean; now: number; onPerson: (id: string) => void }) {
  const { p, r } = row;
  const seen = p.last ? (now - p.last < 60_000 ? "just now" : `${ago(p.last, now)} ago`) : "not yet";
  const live = !!p.last && now - p.last < 10 * 60_000;
  const stats = [
    r.msgs ? plural(r.msgs, "message") : null,
    r.opens ? plural(r.opens, "open") : null,
    r.notes - r.voice > 0 ? plural(r.notes - r.voice, "note") : null,
    r.voiceMs ? `${minutes(r.voiceMs)} recorded` : null,
    r.games ? plural(r.games, "game") : null,
  ].filter(Boolean);
  const cell = (v: number, shown?: string) => <span className={`hidden text-right text-[14px] tabular-nums md:block ${v ? "text-[#EDEDEB]" : "text-[#3E3E40]"}`}>{v ? (shown ?? v.toLocaleString("en-US")) : "0"}</span>;
  const tags = (
    <>
      {row.isNew ? <Tag tone="new">New</Tag> : null}
      {p.tag === "team" ? <Tag>Team</Tag> : null}
    </>
  );
  return (
    <button onClick={() => onPerson(p.id)} className="group flex w-full items-center gap-3.5 text-left">
      <Face person={p} size={36} live={live} />
      <span className={`grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3.5 ${COLS} ${first ? "" : "border-t border-white/[0.06]"}`}>
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span className="truncate text-[15px] font-medium text-[#EDEDEB] transition-colors duration-150 group-hover:text-white">{nameOf(p)}</span>
            {tags}
          </span>
          <span className="mt-0.5 block truncate text-[12.5px] text-[#7A7A74]">
            Last seen {seen} · {viaWord(p.via)}
            <span className="hidden md:inline"> · joined {date(p.joined)}</span>
          </span>
          <span className="mt-1 block truncate text-[13px] text-[#A9A8A2] md:hidden">{stats.length ? stats.join(" · ") : "Joined, nothing else yet"}</span>
        </span>
        <span className="md:hidden">
          <Spark values={row.spark} width={64} height={24} />
        </span>
        {cell(r.days)}
        {cell(r.opens)}
        {cell(r.msgs)}
        {cell(r.notes - r.voice)}
        {cell(r.voiceMs, minutes(r.voiceMs))}
        {cell(r.games)}
        <span className="hidden justify-end md:flex">
          <Spark values={row.spark} width={84} height={22} />
        </span>
      </span>
    </button>
  );
}
