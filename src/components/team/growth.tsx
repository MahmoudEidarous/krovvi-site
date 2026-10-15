"use client";

/**
 * Growth: the last five weeks. This week against the one before, people,
 * messages and sign-ups day by day, how new people's first days went (did
 * they write to Krovvi, did they come back), when in the day people use it,
 * and what they use it for. Tap a day's bar to see who it was.
 */

import { useMemo, useState } from "react";

import type { Board, Person } from "@/lib/team";
import { Change, Face, Head, Key, Metrics, Pane, Quiet, Segmented, Statement, Tag } from "./bits";
import { Bars, Breakdown, FG, Lines, SHADE, Steps, TipRow, TipTitle } from "./charts";
import { daySeries, newcomers, peopleById, rollups, type DayPoint } from "./model";
import { addDays, axisDay, dayName, dayShort, minutes, nameOf, plural, shortName } from "./words";

const pad2 = (n: number) => String(n).padStart(2, "0");

/** today, yesterday, or Mon 13 Oct. */
function joinedWord(d: string, today: string): string {
  const name = dayName(d, today);
  return name === "Today" || name === "Yesterday" ? name.toLowerCase() : name;
}

export function GrowthTab({ board, onPerson }: { board: Board; onPerson: (id: string) => void }) {
  const people = useMemo(() => peopleById(board), [board]);
  const series = useMemo(() => daySeries(board, 35), [board]);
  const newcomersAll = useMemo(() => newcomers(board, 30), [board]);
  // People with an account by default: our own test phones come in as guests.
  const [joinedAs, setJoinedAs] = useState<"outside" | "guest" | "all">("outside");
  const fresh = newcomersAll.filter((n) => joinedAs === "all" || n.person.tag === joinedAs);
  const withAccount = newcomersAll.filter((n) => n.person.tag === "outside");
  const cameBackNamed = withAccount.filter((n) => n.cameBack).length;
  const cameBack = fresh.filter((n) => n.cameBack).length;
  const today = board.today;

  const weeks = useMemo(() => {
    const sum = (from: string, to: string) => {
      const active = new Set<string>();
      let msgs = 0;
      let voiceMs = 0;
      for (const d of board.days) {
        if (d.d < from || d.d > to || people.get(d.p)?.tag === "team") continue;
        if (d.act) active.add(d.p);
        msgs += d.msgs;
        voiceMs += d.voiceMs;
      }
      let named = 0;
      let guests = 0;
      for (const pt of series) {
        if (pt.d < from || pt.d > to) continue;
        named += pt.joinedNamed;
        guests += pt.joinedGuests;
      }
      return { active: active.size, msgs, voiceMs, named, guests };
    };
    return { now: sum(addDays(today, -6), today), then: sum(addDays(today, -13), addDays(today, -7)) };
  }, [board, people, series, today]);

  const last = series.length - 1;
  const every = (i: number) => (i === last || (last - i) % 7 === 0 ? axisDay(series[i].d) : "");

  return (
    <div className="grid grid-cols-1 gap-6">
      <Statement
        figure={weeks.now.active}
        noun={weeks.now.active === 1 ? "person" : "people"}
        rest="used Krovvi this week"
        under={
          <>
            <Change now={weeks.now.active} then={weeks.then.active} when="the week before" />. Outside the team, the last 7 days.
          </>
        }
      />

      <Metrics
        items={[
          { label: "Messages", value: weeks.now.msgs, note: <Change now={weeks.now.msgs} then={weeks.then.msgs} when="the week before" /> },
          { label: "Joined", value: weeks.now.named + weeks.now.guests, note: `${weeks.now.named} with an account, ${weeks.now.guests} guests` },
          { label: "Came back", value: withAccount.length ? Math.round((cameBackNamed / withAccount.length) * 100) : 0, format: (v) => `${Math.round(v)}%`, note: `${cameBackNamed} of ${withAccount.length} new people with an account` },
          { label: "Recorded", value: weeks.now.voiceMs, format: (v) => (v ? minutes(v) : "0"), note: `${weeks.then.voiceMs ? minutes(weeks.then.voiceMs) : "none"} the week before` },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <DayChart
          title="People per day"
          sub="Everyone who did something in Krovvi. Tap a day to see who."
          series={series}
          values={(p) => [p.outside, p.guests, p.team]}
          colors={[SHADE.outside, SHADE.guests, SHADE.team]}
          names={["With an account", "Guests", "Team"]}
          label={every}
          people={people}
          onPerson={onPerson}
          showWho
        />
        <DayChart
          title="Messages per day"
          sub="Messages people wrote to Krovvi."
          series={series}
          values={(p) => [p.msgsOut, p.msgsTeam]}
          colors={[SHADE.outside, SHADE.team]}
          names={["Outside", "Team"]}
          label={every}
          people={people}
          onPerson={onPerson}
        />
        <DayChart
          title="Who joined"
          sub={`${board.accounts.named} accounts and ${board.accounts.guests} guests in all, test accounts left out.`}
          series={series}
          values={(p) => [p.joinedNamed, p.joinedGuests]}
          colors={[SHADE.outside, SHADE.guests]}
          names={["With an account", "Guests"]}
          label={every}
          people={people}
          onPerson={onPerson}
          floor={3}
        />
        <Pane className="p-5 sm:p-6">
          <Head title="When people use Krovvi" sub="Things outside people did in each hour over five weeks, on Cairo’s clock." />
          <div className="mt-5">
            <Lines
              height={190}
              series={[{ values: Array.from({ length: 24 }, (_, h) => board.hours.find((x) => x.h === h)?.n ?? 0), color: FG, width: 2, fill: true }]}
              label={(h) => (h % 6 === 0 ? pad2(h) : h === 23 ? "23" : "")}
              tip={(h) => {
                const row = board.hours.find((x) => x.h === h);
                return (
                  <>
                    <TipTitle>
                      {pad2(h)}:00 to {pad2((h + 1) % 24)}:00
                    </TipTitle>
                    <TipRow label="Things done" value={row?.n ?? 0} />
                    <TipRow label="People" value={row?.p ?? 0} />
                  </>
                );
              }}
            />
          </div>
        </Pane>
      </div>

      <Pane className="p-5 sm:p-6">
        <Head
          title="New people’s first days"
          sub="Everyone outside the team who joined in the last 30 days."
          right={
            <Segmented<"outside" | "guest" | "all">
              label="Who joined"
              size="sm"
              value={joinedAs}
              onChange={setJoinedAs}
              options={[
                { id: "outside", label: `Accounts ${withAccount.length}` },
                { id: "guest", label: `Guests ${newcomersAll.length - withAccount.length}` },
                { id: "all", label: "Both" },
              ]}
            />
          }
          className="flex-col sm:flex-row"
        />
        {fresh.length ? (
          <div className="mt-4 grid grid-cols-1 gap-x-10 gap-y-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <Steps
              steps={[
                { label: "Joined", value: fresh.length },
                { label: "Did something", value: fresh.filter((n) => n.opened).length },
                { label: "Wrote to Krovvi", value: fresh.filter((n) => n.messaged).length },
                { label: "Came back another day", value: cameBack },
                { label: "Used it on 3 days or more", value: fresh.filter((n) => n.activeDays >= 3).length },
              ]}
            />
            <ul className="max-h-[360px] overflow-y-auto pr-1 [scrollbar-width:thin]">
              {fresh.map((n, i) => (
                <li key={n.person.id}>
                  <button onClick={() => onPerson(n.person.id)} className="flex w-full items-center gap-3 text-left">
                    <Face person={n.person} size={30} />
                    <span className={`flex min-w-0 flex-1 items-center gap-3 py-2.5 ${i ? "border-t border-white/[0.06]" : ""}`}>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-medium text-[#EDEDEB]">{nameOf(n.person)}</span>
                        <span className="block truncate text-[12.5px] text-[#7A7A74]">
                          Joined {joinedWord(n.joinedDay, today)} · {n.msgs ? plural(n.msgs, "message") : "no messages"}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        {n.cameBack ? <Tag tone="new">Came back</Tag> : n.daysSince >= 1 ? <Tag>Not back</Tag> : <Tag>Today</Tag>}
                        <span className="w-12 text-right text-[12.5px] tabular-nums text-[#7A7A74]">{plural(n.activeDays, "day")}</span>
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <Quiet>No one new in the last 30 days.</Quiet>
        )}
      </Pane>

      <WhatTheyDo board={board} people={people} />
    </div>
  );
}

function DayChart({
  title,
  sub,
  series,
  values,
  colors,
  names,
  label,
  people,
  onPerson,
  showWho = false,
  floor,
}: {
  title: string;
  sub: string;
  series: DayPoint[];
  values: (p: DayPoint) => number[];
  colors: string[];
  names: string[];
  label: (i: number) => string;
  people: Map<string, Person>;
  onPerson: (id: string) => void;
  showWho?: boolean;
  floor?: number;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const chosen = picked !== null ? series[picked] : null;
  return (
    <Pane className="p-5 sm:p-6">
      <Head title={title} sub={sub} right={<Key items={names.map((n, s) => ({ color: colors[s], label: n }))} />} className="flex-col sm:flex-row" />
      <div className="mt-5">
        <Bars
          points={series.map((p) => ({ key: p.d, values: values(p) }))}
          colors={colors}
          label={label}
          now={series.length - 1}
          picked={showWho ? picked : null}
          onPick={showWho ? setPicked : undefined}
          floor={floor}
          tip={(i) => {
            const v = values(series[i]);
            return (
              <>
                <TipTitle>{dayShort(series[i].d)}</TipTitle>
                {v.map((n, s) => (
                  <TipRow key={names[s]} color={colors[s]} label={names[s]} value={n} />
                ))}
              </>
            );
          }}
        />
      </div>
      {showWho && chosen ? (
        <div className="team-tab mt-4 border-t border-white/[0.06] pt-4">
          <div className="mb-2.5 flex items-baseline justify-between">
            <span className="text-[13.5px] font-medium text-[#EDEDEB]">{dayShort(chosen.d)}</span>
            <span className="text-[12.5px] text-[#7A7A74]">{plural(chosen.who.length, "person", "people")}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {chosen.who.map((id) => {
              const p = people.get(id);
              return (
                <button key={id} onClick={() => onPerson(id)} className="inline-flex items-center gap-2 rounded-full border border-white/[0.07] py-1 pl-1 pr-3 text-[12.5px] text-[#D9D8D3] transition-colors duration-150 hover:bg-white/[0.04]">
                  <Face person={p} id={id} size={22} />
                  {shortName(p, id)}
                  {p?.tag === "team" ? <span className="text-[#5E5E5A]">team</span> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </Pane>
  );
}

function WhatTheyDo({ board, people }: { board: Board; people: Map<string, Person> }) {
  const totals = useMemo(() => {
    const roll = rollups(board, addDays(board.today, -6), board.today);
    const t = { msgs: 0, opens: 0, notes: 0, voice: 0, voiceMs: 0, games: 0, cards: 0, appChanges: 0, krovviChanges: 0, shares: 0, krovviFirst: 0, krovviMade: 0 };
    for (const r of roll.values()) {
      if (people.get(r.p)?.tag === "team") continue;
      t.msgs += r.msgs;
      t.opens += r.opens;
      t.notes += r.notes - r.voice;
      t.voice += r.voice;
      t.voiceMs += r.voiceMs;
      t.games += r.games;
      t.cards += r.cards;
      t.appChanges += r.appChanges;
      t.krovviChanges += r.krovviChanges;
      t.shares += r.shares;
      t.krovviFirst += r.krovviFirst;
      t.krovviMade += r.krovviMade;
    }
    return t;
  }, [board, people]);
  return (
    <Pane className="p-5 sm:p-6">
      <Head title="What people did this week" sub="Outside people, the last 7 days." />
      <div className="mt-5 grid grid-cols-1 gap-x-12 gap-y-3.5 md:grid-cols-2">
        <Breakdown
          rows={[
            { label: "Opened Krovvi", value: totals.opens },
            { label: "Messages to Krovvi", value: totals.msgs },
            { label: "Recordings", value: totals.voice, shown: totals.voice ? `${totals.voice} · ${minutes(totals.voiceMs)}` : "0" },
            { label: "Notes, documents, photos and links", value: totals.notes },
            { label: "Answers to Krovvi’s cards", value: totals.cards },
          ]}
        />
        <Breakdown
          rows={[
            { label: "Changes in their apps", value: totals.appChanges },
            { label: "Games played", value: totals.games },
            { label: "Chats shared", value: totals.shares },
            { label: "Files Krovvi made for them", value: totals.krovviMade },
            { label: "Messages Krovvi started", value: totals.krovviFirst },
          ]}
        />
      </div>
    </Pane>
  );
}
