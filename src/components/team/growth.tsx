"use client";

/**
 * Growth: the last five weeks. This week against the one before, people and
 * messages day by day, who joined, how new people's first days went (did they
 * write to Krovvi, did they come back), when in the day people use it, and
 * what they use it for. Tap a day's bar to see who it was.
 */

import { useMemo, useState } from "react";

import type { Board, Person } from "@/lib/team";
import { Avatar, Card, Delta, Legend, Pill, Quiet, Segmented, Stat } from "./bits";
import { Bars, Breakdown, SHADE, Steps, TipRow, TipTitle } from "./charts";
import { daySeries, newcomers, peopleById, rollups, type DayPoint } from "./model";
import { addDays, axisDay, dayName, dayShort, firstName, minutes, nameOf, plural } from "./words";

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
  const today = board.today;

  const weeks = useMemo(() => {
    const sum = (from: string, to: string) => {
      const active = new Set<string>();
      let msgs = 0;
      for (const d of board.days) {
        if (d.d < from || d.d > to || people.get(d.p)?.tag === "team") continue;
        if (d.act) active.add(d.p);
        msgs += d.msgs;
      }
      let named = 0;
      let guests = 0;
      for (const pt of series) {
        if (pt.d < from || pt.d > to) continue;
        named += pt.joinedNamed;
        guests += pt.joinedGuests;
      }
      return { active: active.size, msgs, named, guests };
    };
    return { now: sum(addDays(today, -6), today), then: sum(addDays(today, -13), addDays(today, -7)) };
  }, [board, people, series, today]);

  const cameBack = fresh.filter((n) => n.cameBack).length;
  const last = series.length - 1;
  const every = (i: number) => (i === last || (last - i) % 7 === 0 ? axisDay(series[i].d) : "");

  return (
    <div className="grid grid-cols-1 gap-3 md:gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <Stat label="People this week" value={weeks.now.active} delta={<Delta now={weeks.now.active} then={weeks.then.active} label="against the week before" />} sub="outside the team" />
        <Stat label="Messages this week" value={weeks.now.msgs} delta={<Delta now={weeks.now.msgs} then={weeks.then.msgs} label="against the week before" />} sub="from outside people" />
        <Stat
          label="Joined this week"
          value={weeks.now.named + weeks.now.guests}
          delta={<Delta now={weeks.now.named + weeks.now.guests} then={weeks.then.named + weeks.then.guests} label="against the week before" />}
          sub={`${weeks.now.named} with an account, ${weeks.now.guests} as guests`}
        />
        <Stat
          label="Came back"
          value={withAccount.length ? Math.round((cameBackNamed / withAccount.length) * 100) : 0}
          format={(v) => `${Math.round(v)}%`}
          sub={`${cameBackNamed} of ${withAccount.length} new people with an account used it on a second day`}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-2">
        <DayChart
          title="People per day"
          sub="Everyone who did something in Krovvi that day. Tap a day to see who."
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
          names={["Outside people", "Team"]}
          label={every}
          people={people}
          onPerson={onPerson}
        />
      </div>

      <DayChart
        title="Who joined"
        sub={`${board.accounts.named.toLocaleString("en-US")} accounts and ${board.accounts.guests.toLocaleString("en-US")} guests in all (test accounts left out).`}
        series={series}
        values={(p) => [p.joinedNamed, p.joinedGuests]}
        colors={[SHADE.outside, SHADE.guests]}
        names={["With an account", "Guests"]}
        label={every}
        people={people}
        onPerson={onPerson}
        floor={3}
      />

      <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-[1fr_1.2fr]">
        <Card title="New people’s first days" sub="Everyone outside the team who joined in the last 30 days.">
          <div className="mb-3">
            <Segmented<"outside" | "guest" | "all">
              label="Who joined"
              value={joinedAs}
              onChange={setJoinedAs}
              options={[
                { id: "outside", label: `With an account ${withAccount.length}` },
                { id: "guest", label: `Guests ${newcomersAll.length - withAccount.length}` },
                { id: "all", label: "Both" },
              ]}
            />
          </div>
          {fresh.length ? (
            <Steps
              steps={[
                { label: "Joined", value: fresh.length },
                { label: "Did something", value: fresh.filter((n) => n.opened).length, note: "opened it, wrote, recorded or added something" },
                { label: "Wrote to Krovvi", value: fresh.filter((n) => n.messaged).length },
                { label: "Came back another day", value: cameBack },
                { label: "Used it on 3 days or more", value: fresh.filter((n) => n.activeDays >= 3).length },
              ]}
            />
          ) : (
            <Quiet>Nobody new in the last 30 days.</Quiet>
          )}
        </Card>
        <Card title="Each new person" sub="Newest first. Tap one to see their days." pad={false}>
          <ul className="max-h-[430px] divide-y divide-[#1F1F1E] overflow-y-auto pb-1.5">
            {fresh.map((n) => (
              <li key={n.person.id}>
                <button onClick={() => onPerson(n.person.id)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors duration-150 hover:bg-[#1B1B1A] sm:px-5">
                  <Avatar person={n.person} size={34} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-semibold">{nameOf(n.person)}</div>
                    <div className="truncate text-[12.5px] text-[#8F8F8A]">
                      Joined {joinedWord(n.joinedDay, today)}
                      {n.msgs ? ` · ${plural(n.msgs, "message")}` : " · no messages"}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {n.cameBack ? <Pill tone="new">Came back</Pill> : n.daysSince >= 1 ? <Pill>Not back yet</Pill> : <Pill>Today</Pill>}
                    <span className="w-14 text-right text-[12.5px] tabular-nums text-[#A9A8A2]">{plural(n.activeDays, "day")}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-2">
        <Card title="When people use Krovvi" sub="Things outside people did in each hour over five weeks, on Cairo’s clock.">
          <Bars
            points={Array.from({ length: 24 }, (_, h) => ({ key: String(h), values: [board.hours.find((x) => x.h === h)?.n ?? 0] }))}
            colors={[SHADE.outside]}
            label={(h) => (h % 3 === 0 ? pad2(h) : "")}
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
        </Card>
        <WhatTheyDo board={board} people={people} />
      </div>
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
  const total = series.reduce((n, p) => n + values(p).reduce((a, b) => a + b, 0), 0);
  const chosen = picked !== null ? series[picked] : null;
  return (
    <Card title={title} sub={sub} right={<span className="text-[12.5px] tabular-nums text-[#8F8F8A]">{total.toLocaleString("en-US")} in 35 days</span>}>
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
      <div className="mt-3">
        <Legend items={names.map((n, s) => ({ color: colors[s], label: n }))} />
      </div>
      {showWho && chosen ? (
        <div className="team-tab mt-4 border-t border-[#1F1F1E] pt-3">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-[13.5px] font-semibold">{dayShort(chosen.d)}</span>
            <span className="text-[12.5px] text-[#8F8F8A]">{plural(chosen.who.length, "person", "people")}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {chosen.who.map((id) => {
              const p = people.get(id);
              return (
                <button key={id} onClick={() => onPerson(id)} className="inline-flex items-center gap-1.5 rounded-full bg-[#1F1F1E] py-1 pl-1 pr-2.5 text-[12.5px] text-[#EDEDEB] transition-colors duration-150 hover:bg-[#2A2A28]">
                  <Avatar person={p} size={22} />
                  {firstName(p)}
                  {p?.tag === "team" ? <span className="text-[#7A7A74]">· team</span> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </Card>
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
    <Card title="What people did this week" sub="Outside people, the last 7 days.">
      <Breakdown
        rows={[
          { label: "Opened Krovvi", value: totals.opens },
          { label: "Messages to Krovvi", value: totals.msgs },
          { label: "Recordings", value: totals.voice, shown: totals.voice ? `${totals.voice} (${minutes(totals.voiceMs)})` : "0" },
          { label: "Notes, documents, photos and links", value: totals.notes },
          { label: "Answers to Krovvi’s cards", value: totals.cards },
          { label: "Changes in their apps", value: totals.appChanges },
          { label: "Files Krovvi made for them", value: totals.krovviMade },
          { label: "Changes Krovvi made in their apps", value: totals.krovviChanges },
          { label: "Games played", value: totals.games },
          { label: "Chats shared", value: totals.shares },
          { label: "Messages Krovvi started", value: totals.krovviFirst },
        ]}
      />
    </Card>
  );
}
