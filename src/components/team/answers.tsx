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
import { Avatar, Card, Legend, Quiet, Segmented, Stat } from "./bits";
import { Bars, DANGER, FG, Lines, TipRow, TipTitle } from "./charts";
import { peopleById, problems, speedRows, timedMessages } from "./model";
import { addDays, axisDay, clock, dayName, dayOf, dayShort, line, nameOf, plural, seconds } from "./words";

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

  const issues = useMemo(
    () => problems(board.feed).filter((h) => inGroup(h.p)),
    [board, inGroup],
  );

  const todayTrouble = trouble.get(today) ?? { failed: 0, phone: 0 };
  const last = days.length - 1;
  const label = (i: number) => (i === last || (last - i) % 7 === 0 ? axisDay(days[i]) : "");

  return (
    <div className="grid grid-cols-1 gap-3 md:gap-4">
      <div className="flex items-center justify-between gap-3">
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

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <Stat label="Typical answer today" value={todayRow?.med ?? 0} format={(v) => (todayRow?.med ? seconds(v) : "–")} sub="half are faster than this" />
        <Stat label="Slow end today" value={todayRow?.p90 ?? 0} format={(v) => (todayRow?.p90 ? seconds(v) : "–")} sub="1 answer in 10 is slower" />
        <Stat label="Answered today" value={todayRow?.answered ?? 0} sub={todayRow ? `of ${plural(todayRow.msgs, "message")}${todayRow.stopped ? `, ${todayRow.stopped} stopped` : ""}` : "no messages yet"} />
        <Stat label="Problems today" value={todayTrouble.failed + todayTrouble.phone} sub={`${plural(todayTrouble.failed, "failed answer")}, ${plural(todayTrouble.phone, "phone problem")}`} />
      </div>

      <Card title="Answer time" sub="From the moment a message reaches Krovvi to the moment its answer is done, each day.">
        <Lines
          keys={days}
          series={[
            { values: days.map((d) => rows.get(d)?.p90 ?? null), color: "rgba(237,237,235,0.42)", width: 1.6, dash: "3 4" },
            { values: days.map((d) => rows.get(d)?.med ?? null), color: FG, width: 2.2, fill: true, dots: true },
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
                    <TipRow color="rgba(237,237,235,0.42)" label="Slow end" value={r.p90 ? seconds(r.p90) : "–"} />
                    <TipRow label="Messages" value={r.msgs} />
                    {r.failed ? <TipRow color={DANGER} label="Failed" value={r.failed} /> : null}
                  </>
                ) : (
                  <span className="text-[#8F8F8A]">No messages</span>
                )}
              </>
            );
          }}
        />
        <div className="mt-3">
          <Legend items={[{ color: FG, label: "Typical (half are faster)" }, { color: "rgba(237,237,235,0.55)", label: "Slow end (1 in 10 slower)", dashed: true }]} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-2">
        <Card title="Slowest answers today" sub="Which messages waited longest for their answer.">
          {slowest.length ? (
            <ul className="divide-y divide-[#1F1F1E]">
              {slowest.map((h) => (
                <PersonRow key={`${h.at}-${h.p}`} person={people.get(h.p)} id={h.p} onPerson={onPerson} text={`sent at ${clock(h.at)}`} right={<span className="text-[15px] font-semibold tabular-nums">{seconds(h.x.a ?? 0)}</span>} />
              ))}
            </ul>
          ) : (
            <Quiet>No answers yet today.</Quiet>
          )}
        </Card>
        <Card title="What went wrong" sub="Today and yesterday: answers that failed, and problems phones saw.">
          {issues.length ? (
            <ul className="divide-y divide-[#1F1F1E]">
              {issues.slice(0, 12).map((h) => (
                <PersonRow
                  key={`${h.at}-${h.p}-${h.k}`}
                  person={people.get(h.p)}
                  id={h.p}
                  onPerson={onPerson}
                  text={line(h.k, h.x).text}
                  bad
                  right={
                    <span className="text-right text-[12.5px] tabular-nums text-[#A9A8A2]">
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
        </Card>
      </div>

      <Card title="Problems per day" sub="Answers that failed, and problems people’s phones saw in a chat.">
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
        <div className="mt-3">
          <Legend items={[{ color: DANGER, label: "Failed answers" }, { color: "rgba(196,87,79,0.45)", label: "Phone problems" }]} />
        </div>
      </Card>
      <p className="px-1 text-[12px] leading-relaxed text-[#7A7A74]">Times are on Cairo’s clock.</p>
    </div>
  );
}

function PersonRow({ person, id, onPerson, text, right, bad = false }: { person: Person | undefined; id: string; onPerson: (id: string) => void; text: string; right: React.ReactNode; bad?: boolean }) {
  return (
    <li>
      <button onClick={() => onPerson(id)} className="flex w-full items-center gap-3 py-2.5 text-left">
        <Avatar person={person} size={32} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-semibold">{nameOf(person, id)}</span>
          <span className={`block truncate text-[12.5px] ${bad ? "text-[#E5876B]" : "text-[#8F8F8A]"}`}>{text}</span>
        </span>
        <span className="shrink-0">{right}</span>
      </button>
    </li>
  );
}
