"use client";

/**
 * Answers: how fast Krovvi answered and what went wrong. The typical answer
 * time and the slow end (the slowest one in ten) day by day, the slowest
 * answers today, and every problem of today and yesterday: answers that
 * failed, and problems people's phones saw in a chat. Outside people by
 * default: the team's own tests would hide what people really get.
 */

import { useCallback, useMemo, useState } from "react";

import type { Board, Person, SpeedGroup } from "@/lib/team";
import { Face, Head, Key, Metrics, Pane, Quiet, Segmented, Statement, T } from "./bits";
import { Bars, DANGER, FG, Lines, TipRow, TipTitle } from "./charts";
import { peopleById, problems, speedRows, timedMessages } from "./model";
import { addDays, axisDay, clock, dayName, dayOf, dayShort, line, nameOf, plural, seconds } from "./words";

const SLOW = "rgba(237,237,235,0.42)";

export function AnswersTab({ board, onPerson }: { board: Board; onPerson: (id: string) => void }) {
  const [group, setGroup] = useState<SpeedGroup>("out");
  const people = useMemo(() => peopleById(board), [board]);
  const today = board.today;
  const inGroup = useCallback(
    (id: string) => {
      const team = people.get(id)?.tag === "team";
      return group === "all" ? true : group === "team" ? team : !team;
    },
    [group, people],
  );

  const days = useMemo(() => Array.from({ length: 35 }, (_, i) => addDays(today, i - 34)), [today]);
  const rows = useMemo(() => speedRows(board, group), [board, group]);
  const todayRow = rows.get(today);

  const trouble = useMemo(() => {
    const perDay = new Map<string, { failed: number; phone: number }>();
    for (const d of board.days) {
      if (!inGroup(d.p)) continue;
      const t = perDay.get(d.d) ?? { failed: 0, phone: 0 };
      t.failed += d.failed;
      t.phone += d.problems;
      perDay.set(d.d, t);
    }
    return perDay;
  }, [board, inGroup]);

  const slowest = useMemo(
    () =>
      timedMessages(board.feed, today)
        .filter((h) => inGroup(h.p))
        .sort((a, b) => (b.x.a ?? 0) - (a.x.a ?? 0))
        .slice(0, 6),
    [board, today, inGroup],
  );
  const issues = useMemo(() => problems(board.feed).filter((h) => inGroup(h.p)), [board, inGroup]);

  const todayTrouble = trouble.get(today) ?? { failed: 0, phone: 0 };
  const last = days.length - 1;
  const label = (i: number) => (i === last || (last - i) % 7 === 0 ? axisDay(days[i]) : "");
  const whose = group === "out" ? "outside people" : group === "team" ? "the team" : "everyone";

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="flex flex-col gap-5">
        {todayRow?.med ? (
          <Statement
            figure={seconds(todayRow.med)}
            noun="is a typical answer"
            rest="today"
            under={`Half of today’s answers to ${whose} came faster than that. One in ten took longer than ${seconds(todayRow.p90 ?? todayRow.med)}.`}
          />
        ) : (
          <Statement figure="No" noun="answers yet" rest="today" under={`Nothing from ${whose} has been answered today.`} />
        )}
        <div>
          <Segmented<SpeedGroup>
            label="Whose messages"
            value={group}
            onChange={setGroup}
            options={[
              { id: "out", label: "Outside" },
              { id: "team", label: "Team" },
              { id: "all", label: "Everyone" },
            ]}
          />
        </div>
      </div>

      <Metrics
        items={[
          { label: "Answered today", value: todayRow?.answered ?? 0, note: todayRow ? `of ${plural(todayRow.msgs, "message")}` : "no messages yet" },
          { label: "Slow end", value: todayRow?.p90 ?? 0, format: (v) => (todayRow?.p90 ? seconds(v) : "–"), note: "1 answer in 10 is slower" },
          { label: "Failed answers", value: todayTrouble.failed, note: todayTrouble.failed ? "today" : "none today" },
          { label: "Phone problems", value: todayTrouble.phone, note: todayTrouble.phone ? "today" : "none today" },
        ]}
      />

      <Pane className="p-5 sm:p-6">
        <Head
          title="Answer time"
          sub="From a message reaching Krovvi to its answer being done, each day."
          right={
            <Key
              items={[
                { color: FG, label: "Typical", line: "solid" },
                { color: SLOW, label: "Slow end", line: "dotted" },
              ]}
            />
          }
          className="flex-col sm:flex-row"
        />
        <div className="mt-5">
          <Lines
            height={220}
            series={[
              { values: days.map((d) => rows.get(d)?.p90 ?? null), color: SLOW, width: 1.5, dotted: true, join: true },
              { values: days.map((d) => rows.get(d)?.med ?? null), color: FG, width: 2, fill: true, join: true },
            ]}
            unit={(v) => `${Math.round(v / 1000)}s`}
            floor={10_000}
            label={label}
            tip={(i) => {
              const r = rows.get(days[i]);
              return (
                <>
                  <TipTitle>{dayShort(days[i])}</TipTitle>
                  {r ? (
                    <>
                      <TipRow color={FG} label="Typical" value={r.med ? seconds(r.med) : "–"} />
                      <TipRow color={SLOW} dotted label="Slow end" value={r.p90 ? seconds(r.p90) : "–"} />
                      <TipRow label="Messages" value={r.msgs} />
                      {r.failed ? <TipRow color={DANGER} label="Failed" value={r.failed} /> : null}
                    </>
                  ) : (
                    <span className="text-[#7A7A74]">No messages</span>
                  )}
                </>
              );
            }}
          />
        </div>
      </Pane>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Pane className="p-5 sm:p-6">
          <Head title="Slowest today" sub="The messages that waited longest for their answer." />
          {slowest.length ? (
            <ul className="mt-2">
              {slowest.map((h, i) => (
                <PersonRow key={`${h.at}-${h.p}`} first={i === 0} person={people.get(h.p)} id={h.p} onPerson={onPerson} text={`sent at ${clock(h.at)}`} right={<span className="text-[17px] font-light tracking-[-0.4px] tabular-nums text-[#EDEDEB]">{seconds(h.x.a ?? 0)}</span>} />
              ))}
            </ul>
          ) : (
            <Quiet>No answers yet today.</Quiet>
          )}
        </Pane>
        <Pane className="p-5 sm:p-6">
          <Head title="What went wrong" sub="Today and yesterday: answers that failed, and problems phones saw." />
          {issues.length ? (
            <ul className="mt-2">
              {issues.slice(0, 12).map((h, i) => (
                <PersonRow
                  key={`${h.at}-${h.p}-${h.k}`}
                  first={i === 0}
                  person={people.get(h.p)}
                  id={h.p}
                  onPerson={onPerson}
                  text={line(h.k, h.x).text}
                  bad
                  right={
                    <span className="text-right text-[12.5px] tabular-nums text-[#7A7A74]">
                      {dayOf(h.at) === today ? "" : `${dayName(dayOf(h.at), today)} `}
                      {clock(h.at)}
                    </span>
                  }
                />
              ))}
            </ul>
          ) : (
            <Quiet>Nothing went wrong today or yesterday.</Quiet>
          )}
        </Pane>
      </div>

      <Pane className="p-5 sm:p-6">
        <Head
          title="Problems per day"
          sub="Answers that failed, and problems people’s phones saw in a chat."
          right={
            <Key
              items={[
                { color: DANGER, label: "Failed answers" },
                { color: "rgba(196,87,79,0.45)", label: "Phone problems" },
              ]}
            />
          }
          className="flex-col sm:flex-row"
        />
        <div className="mt-5">
          <Bars
            points={days.map((d) => {
              const t = trouble.get(d) ?? { failed: 0, phone: 0 };
              return { key: d, values: [t.failed, t.phone] };
            })}
            colors={[DANGER, "rgba(196,87,79,0.45)"]}
            label={label}
            now={last}
            floor={3}
            tip={(i) => {
              const t = trouble.get(days[i]) ?? { failed: 0, phone: 0 };
              return (
                <>
                  <TipTitle>{dayShort(days[i])}</TipTitle>
                  <TipRow color={DANGER} label="Failed answers" value={t.failed} />
                  <TipRow color="rgba(196,87,79,0.45)" label="Phone problems" value={t.phone} />
                </>
              );
            }}
          />
        </div>
      </Pane>
    </div>
  );
}

function PersonRow({ person, id, onPerson, text, right, bad = false, first }: { person: Person | undefined; id: string; onPerson: (id: string) => void; text: string; right: React.ReactNode; bad?: boolean; first: boolean }) {
  return (
    <li>
      <button onClick={() => onPerson(id)} className="flex w-full items-center gap-3 text-left">
        <Face person={person} id={id} size={30} />
        <span className={`flex min-w-0 flex-1 items-center gap-3 py-3 ${first ? "" : "border-t border-white/[0.06]"}`}>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-medium text-[#EDEDEB]">{nameOf(person, id)}</span>
            <span className="block truncate text-[12.5px]" style={{ color: bad ? T.down : T.faint }}>
              {text}
            </span>
          </span>
          <span className="shrink-0">{right}</span>
        </span>
      </button>
    </li>
  );
}
