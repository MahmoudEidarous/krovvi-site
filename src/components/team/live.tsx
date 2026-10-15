"use client";

/**
 * Live: how today is going, at a glance. One big line (how many people used
 * Krovvi today), who is in it right now, four numbers in one pane, today
 * through the hours against yesterday, who came today, and everything people
 * do as it happens. Numbers count people outside the team (guests
 * included); the team is said beside them, never mixed in.
 */

import { useMemo, useState } from "react";

import type { Board, Person } from "@/lib/team";
import type { Tab } from "./board";
import { Change, Face, Head, Key, Metrics, Pane, Quiet, Segmented, Statement, Tag, T } from "./bits";
import { FG, Lines, TipRow, TipTitle } from "./charts";
import { activeBy, countBy, feedLines, hourCounts, lately, median, peopleById, rollups, speedRows, type FeedLine, type Rollup } from "./model";
import { addDays, ago, appName, byKrovvi, clock, dayLong, dayOf, hourOf, line, minutes, nameOf, noteWords, plural, seconds, shortName, when } from "./words";

type Who = "all" | "outside" | "team";

const pad2 = (n: number) => String(n).padStart(2, "0");

export function LiveTab({ board, now, fresh, onPerson, go }: { board: Board; now: number; fresh: Set<string>; onPerson: (id: string) => void; go: (t: Tab) => void }) {
  const people = useMemo(() => peopleById(board), [board]);
  const today = board.today;
  const yday = addDays(today, -1);
  const sameTimeYesterday = now - 86_400_000;

  const day = useMemo(() => {
    const outside = (id: string) => people.get(id)?.tag !== "team";
    const roll = rollups(board, today, today);
    const t = { pOut: 0, pTeam: 0, msgsOut: 0, msgsTeam: 0, notes: 0, voice: 0, voiceMs: 0, games: 0, problems: 0, reached: 0, made: 0 };
    for (const r of roll.values()) {
      if (people.get(r.p)?.tag === "team") {
        if (r.days) t.pTeam += 1;
        t.msgsTeam += r.msgs;
        continue;
      }
      if (r.days) t.pOut += 1;
      t.msgsOut += r.msgs;
      t.notes += r.notes;
      t.voice += r.voice;
      t.voiceMs += r.voiceMs;
      t.games += r.games;
      t.problems += r.failed + r.problems;
      t.reached += r.krovviFirst + r.pushes;
      t.made += r.krovviMade;
    }
    const joined = board.people.filter((p) => p.tag !== "team" && dayOf(p.joined) === today).sort((a, b) => a.joined - b.joined);
    const activeY = [...activeBy(board.feed, yday, sameTimeYesterday)].filter(outside).length;
    const msgsY = countBy(board.feed, yday, sameTimeYesterday, (h) => h.k === "msg" && outside(h.p));
    const speed = speedRows(board, "out").get(today);
    return { ...t, roll, joined, activeY, msgsY, speed };
  }, [board, people, today, yday, sameTimeYesterday]);

  const inNow = useMemo(() => lately(board.feed, now, 10 * 60_000), [board, now]);
  const lastOne = useMemo(() => lately(board.feed, now, 3 * 86_400_000)[0], [board, now]);

  const also = [
    day.games ? plural(day.games, "game") + " played" : null,
    day.made ? `${plural(day.made, "file")} Krovvi made` : null,
    day.reached ? `Krovvi reached out ${plural(day.reached, "time")}` : null,
    day.problems ? plural(day.problems, "problem") : "nothing went wrong",
  ].filter(Boolean);

  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-6 lg:grid-cols-[minmax(0,1fr)_400px]">
      <div className="grid min-w-0 grid-cols-1 gap-6">
        <div>
          <p className="mb-3 text-[13px] text-[#8F8F8A]">
            {dayLong(today)} · {clock(now)} in Cairo
          </p>
          <Statement
            figure={day.pOut}
            noun={day.pOut === 1 ? "person" : "people"}
            rest="used Krovvi today"
            under={
              <>
                {day.pTeam ? `Plus ${plural(day.pTeam, "person", "people")} from the team. ` : ""}
                <Change now={day.pOut} then={day.activeY} when="this time yesterday" />.
              </>
            }
          />
          <NowLine inNow={inNow} lastOne={lastOne} people={people} now={now} today={today} onPerson={onPerson} />
        </div>

        <div>
          <Metrics
            items={[
              { label: "Messages", value: day.msgsOut, note: day.msgsTeam ? `and ${day.msgsTeam} from the team` : `${day.msgsY} by now yesterday` },
              {
                label: "New people",
                value: day.joined.length,
                note: day.joined.length ? day.joined.map((p) => shortName(p)).join(", ") : "none yet today",
              },
              { label: "Recorded", value: day.voiceMs, format: (v) => (v ? minutes(v) : "0"), note: day.voice ? plural(day.voice, "recording") : "no recordings yet" },
              {
                label: "Typical answer",
                value: day.speed?.med ?? 0,
                format: (v) => (day.speed?.med ? seconds(v) : "–"),
                note: day.speed ? `${day.speed.answered} of ${day.speed.msgs} answered` : "no messages yet",
                onClick: () => go("answers"),
              },
            ]}
          />
          <p className="mt-3 px-1 text-[13px] text-[#7A7A74]">Also today: {also.join(" · ")}.</p>
        </div>

        <TodayChart board={board} people={people} now={now} />
        <WhoCame board={board} roll={day.roll} people={people} now={now} onPerson={onPerson} />
      </div>

      <aside className="min-w-0 lg:sticky lg:top-[84px] lg:self-start">
        <Timeline board={board} people={people} now={now} fresh={fresh} onPerson={onPerson} />
      </aside>
    </div>
  );
}

function NowLine({ inNow, lastOne, people, now, today, onPerson }: { inNow: ReturnType<typeof lately>; lastOne: ReturnType<typeof lately>[number] | undefined; people: Map<string, Person>; now: number; today: string; onPerson: (id: string) => void }) {
  if (!inNow.length) {
    return (
      <div className="mt-5 inline-flex max-w-full items-start gap-2.5 rounded-[18px] border border-white/[0.07] bg-[#0E0E10] py-2 pl-3.5 pr-4 text-[13.5px] leading-[19px] text-[#A9A8A2]">
        <span className="mt-[6px] h-2 w-2 shrink-0 rounded-full bg-[#3A3A3C]" />
        <span>
          No one in Krovvi right now
          {lastOne ? (
            <>
              {" · "}
              <button className="text-[#D9D8D3] hover:text-[#EDEDEB]" onClick={() => onPerson(lastOne.p)}>
                {shortName(people.get(lastOne.p), lastOne.p)}
              </button>{" "}
              was last, {when(lastOne.at, now, today)}
            </>
          ) : null}
        </span>
      </div>
    );
  }
  const names = inNow.map((r) => shortName(people.get(r.p), r.p));
  const said = names.length === 1 ? `${names[0]} is in Krovvi now` : names.length === 2 ? `${names[0]} and ${names[1]} are in Krovvi now` : `${names.length} people are in Krovvi now`;
  return (
    <div className="mt-5 inline-flex max-w-full items-center gap-3 rounded-full border border-white/[0.07] bg-[#0E0E10] py-1.5 pl-1.5 pr-4">
      <span className="flex -space-x-2">
        {inNow.slice(0, 5).map((r) => (
          <button key={r.p} onClick={() => onPerson(r.p)} className="rounded-full ring-2 ring-[#0E0E10]" aria-label={`Open ${nameOf(people.get(r.p), r.p)}`}>
            <Face person={people.get(r.p)} id={r.p} size={28} />
          </button>
        ))}
      </span>
      <span className="team-live h-2 w-2 shrink-0 rounded-full bg-[#EDEDEB]" />
      <span className="truncate text-[13.5px] text-[#D9D8D3]">{said}</span>
    </div>
  );
}

function TodayChart({ board, people, now }: { board: Board; people: Map<string, Person>; now: number }) {
  const today = board.today;
  const yday = addDays(today, -1);
  const nowHour = dayOf(now) === today ? hourOf(now) : 23;
  const data = useMemo(() => ({ t: hourCounts(board.feed, today, people), y: hourCounts(board.feed, yday, people) }), [board, today, yday, people]);
  const total = data.t.reduce((n, h) => n + h.out + h.team, 0);
  return (
    <Pane className="p-5 sm:p-6">
      <Head
        className="flex-col sm:flex-row"
        title="Today"
        sub={`${plural(total, "thing")} done in Krovvi so far, hour by hour on Cairo’s clock.`}
        right={
          <Key
            items={[
              { color: FG, label: "Today", line: "solid" },
              { color: "rgba(237,237,235,0.45)", label: "Yesterday", line: "dotted" },
            ]}
          />
        }
      />
      <div className="mt-5">
        <Lines
          height={210}
          series={[
            { values: data.y.map((h) => h.out + h.team), color: "rgba(237,237,235,0.38)", width: 1.5, dotted: true },
            { values: data.t.map((h, i) => (i <= nowHour ? h.out + h.team : null)), color: FG, width: 2, fill: true, live: dayOf(now) === today },
          ]}
          label={(i) => (i % 6 === 0 ? pad2(i) : i === 23 ? "23" : "")}
          tip={(i) => (
            <>
              <TipTitle>
                {pad2(i)}:00 to {pad2((i + 1) % 24)}:00
              </TipTitle>
              {i <= nowHour ? (
                <>
                  <TipRow color={FG} label="Today" value={data.t[i].out + data.t[i].team} />
                  <div className="mb-1 pl-[15px] text-[11.5px] text-[#7A7A74]">
                    {data.t[i].out} outside, {data.t[i].team} team
                  </div>
                </>
              ) : null}
              <TipRow color="rgba(237,237,235,0.5)" dotted label="Yesterday" value={data.y[i].out + data.y[i].team} />
            </>
          )}
        />
      </div>
    </Pane>
  );
}

function WhoCame({ board, roll, people, now, onPerson }: { board: Board; roll: Map<string, Rollup>; people: Map<string, Person>; now: number; onPerson: (id: string) => void }) {
  const rows = useMemo(() => {
    const list = [...roll.values()].filter((r) => r.days > 0).map((r) => ({ r, p: people.get(r.p) }));
    const at = (x: { p?: Person }) => x.p?.last ?? 0;
    return {
      out: list.filter((x) => x.p?.tag !== "team").sort((a, b) => at(b) - at(a)),
      team: list.filter((x) => x.p?.tag === "team").sort((a, b) => at(b) - at(a)),
    };
  }, [roll, people]);
  const newToday = (p?: Person) => !!p && p.tag !== "team" && dayOf(p.joined) === board.today;
  const lineFor = (r: Rollup) =>
    [
      r.msgs ? plural(r.msgs, "message") : null,
      r.opens ? plural(r.opens, "open") : null,
      r.voiceMs ? `${minutes(r.voiceMs)} recorded` : null,
      r.notes - r.voice > 0 ? plural(r.notes - r.voice, "note") : null,
      r.games ? plural(r.games, "game") : null,
      r.cards ? plural(r.cards, "card") : null,
    ]
      .filter(Boolean)
      .join(" · ") || "opened Krovvi";
  const list = (items: Array<{ r: Rollup; p?: Person }>) => (
    <ul>
      {items.map(({ r, p }, i) => (
        <li key={r.p}>
          <button onClick={() => onPerson(r.p)} className="flex w-full items-center gap-3.5 text-left">
            <Face person={p} id={r.p} size={34} live={!!p?.last && now - p.last < 10 * 60_000} />
            <span className={`flex min-w-0 flex-1 items-center gap-3 py-3 ${i ? "border-t border-white/[0.06]" : ""}`}>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-[14.5px] font-medium text-[#EDEDEB]">{nameOf(p, r.p)}</span>
                  {newToday(p) ? <Tag tone="new">New</Tag> : p?.tag === "guest" ? <Tag>Guest</Tag> : null}
                </span>
                <span className="mt-0.5 block truncate text-[13px] text-[#8F8F8A]">{lineFor(r)}</span>
              </span>
              <span className="shrink-0 text-right text-[12.5px] tabular-nums text-[#7A7A74]">{p?.last && dayOf(p.last) === board.today ? clock(p.last) : ""}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
  return (
    <Pane className="p-5 sm:p-6">
      <Head title="Who came today" sub="Tap anyone to see their day." right={<span className="text-[13px] tabular-nums text-[#7A7A74]">{rows.out.length + rows.team.length}</span>} />
      {rows.out.length + rows.team.length === 0 ? (
        <Quiet>No one yet today.</Quiet>
      ) : (
        <div className="mt-2">
          {rows.out.length ? list(rows.out) : <p className="py-3 text-[13.5px] text-[#7A7A74]">No one from outside the team yet.</p>}
          {rows.team.length ? (
            <>
              <div className="mb-0.5 mt-4 text-[12px] font-medium text-[#7A7A74]">Team</div>
              {list(rows.team)}
            </>
          ) : null}
        </div>
      )}
    </Pane>
  );
}

/** What was done with each card in a run, as counted: "3 answered, 2 skipped". */
const CARD_DONE: Record<string, string> = { answered: "answered", acted: "acted on", opened: "opened", passed: "skipped", played: "played", undid: "undone" };

/** A line of the feed in words: the thing, and under it when and how a run went. */
export function lineWords(l: FeedLine, onToday: boolean): { text: string; sub?: string; bad?: boolean; quiet?: boolean } {
  const quiet = byKrovvi(l.k);
  const span = l.count > 1 && clock(l.from) !== clock(l.at) ? `${clock(l.from)} to ${clock(l.at)}` : undefined;
  if (l.count > 1) {
    switch (l.k) {
      case "msg": {
        const m = median(l.answers);
        return { text: `Sent ${l.count} messages`, sub: [span, m ? `answers took ${seconds(m)} typically` : null].filter(Boolean).join(" · ") };
      }
      case "note": {
        const kind = String(l.x.n ?? "");
        if (kind === "voice") return { text: `Made ${l.count} recordings${l.ms ? `, ${minutes(l.ms)} in all` : ""}`, sub: span };
        return { text: `Added ${l.count} ${noteWords(kind)[1]}`, sub: span };
      }
      case "card": {
        const done = Object.entries(l.tally)
          .sort((a, b) => b[1] - a[1])
          .map(([e, n]) => `${n} ${CARD_DONE[e] ?? e}`)
          .join(", ");
        return { text: `Went through ${l.count} of Krovvi’s cards`, sub: [done, span].filter(Boolean).join(" · ") };
      }
      case "app":
        return { text: `Made ${l.count} changes in ${appName(l.x.o)}`, sub: span };
      case "kapp":
        return { text: `Krovvi made ${l.count} changes in ${appName(l.x.o)}`, sub: span, quiet };
      case "kfirst":
        return { text: `Krovvi wrote first, ${l.count} times`, sub: span, quiet };
      case "kmade":
        return { text: `Krovvi made ${l.count} files`, sub: span, quiet };
      case "buzz":
        return { text: `Krovvi sent ${l.count} notifications`, sub: span, quiet };
    }
  }
  if (l.k === "open") {
    const n = Number(l.x.n ?? 1);
    return { text: n > 1 ? `Opened Krovvi, ${n} times ${onToday ? "today" : "that day"}` : "Opened Krovvi", sub: n > 1 && l.x.f ? `first at ${clock(Number(l.x.f))}` : undefined };
  }
  if (l.k === "msg" && l.x.a && !l.x.g && l.x.s === "done") return { text: "Sent a message", sub: `answered in ${seconds(l.x.a)}` };
  return { ...line(l.k, l.x), quiet };
}

function Timeline({ board, people, now, fresh, onPerson }: { board: Board; people: Map<string, Person>; now: number; fresh: Set<string>; onPerson: (id: string) => void }) {
  const [who, setWho] = useState<Who>("all");
  const [all, setAll] = useState(false);
  const today = board.today;
  const lines = useMemo(() => {
    const keep = board.feed.filter((h) => {
      const tag = people.get(h.p)?.tag;
      return who === "all" ? true : who === "team" ? tag === "team" : tag !== "team";
    });
    return feedLines(keep);
  }, [board, people, who]);
  const todays = lines.filter((l) => dayOf(l.at) === today);
  const earlier = lines.filter((l) => dayOf(l.at) !== today);
  const shownToday = all ? todays : todays.slice(0, 14);
  const more = (text: string) => (
    <button onClick={() => setAll(true)} className="mt-3 w-full rounded-full border border-white/[0.07] py-2.5 text-[13px] font-medium text-[#A9A8A2] transition-colors duration-150 hover:text-[#EDEDEB]">
      {text}
    </button>
  );
  return (
    <Pane className="flex flex-col p-5 sm:p-6 lg:max-h-[calc(100dvh-108px)]">
      <Head title="As it happens" sub="Everything people did, newest first." />
      <div className="mt-4">
        <Segmented<Who>
          label="Whose"
          size="sm"
          value={who}
          onChange={setWho}
          options={[
            { id: "all", label: "Everyone" },
            { id: "outside", label: "Outside" },
            { id: "team", label: "Team" },
          ]}
        />
      </div>
      <div className="team-scroll -mx-1 mt-3 min-h-0 flex-1 px-1 lg:overflow-y-auto">
        {todays.length ? (
          <ol>
            {shownToday.map((l) => (
              <Event key={l.key} l={l} person={people.get(l.p)} now={now} onToday fresh={fresh.has(l.key)} onPerson={onPerson} />
            ))}
          </ol>
        ) : (
          <Quiet>Nothing yet today.</Quiet>
        )}
        {todays.length > shownToday.length ? more(`Show all of today (${todays.length})`) : null}
        {all && earlier.length ? (
          <>
            <div className="mb-1 mt-5 text-[12px] font-medium text-[#7A7A74]">Yesterday</div>
            <ol>
              {earlier.map((l) => (
                <Event key={l.key} l={l} person={people.get(l.p)} now={now} onToday={false} fresh={false} onPerson={onPerson} />
              ))}
            </ol>
          </>
        ) : null}
        {!all && todays.length <= shownToday.length && earlier.length ? more(`Show yesterday (${earlier.length})`) : null}
      </div>
    </Pane>
  );
}

function Event({ l, person, now, onToday, fresh, onPerson }: { l: FeedLine; person: Person | undefined; now: number; onToday: boolean; fresh: boolean; onPerson: (id: string) => void }) {
  const w = lineWords(l, onToday);
  const recent = onToday && now - l.at < 3_600_000;
  return (
    <li className={`grid grid-cols-[40px_1fr] gap-x-3 py-2.5 ${fresh ? "team-new" : ""}`}>
      <span className="pt-[3px] text-[12px] tabular-nums leading-[18px] text-[#6A6A66]" title={recent ? `${ago(l.at, now)} ago` : undefined}>
        {clock(l.at)}
      </span>
      <button onClick={() => onPerson(l.p)} className="group flex min-w-0 items-start gap-2.5 text-left" aria-label={`Open ${nameOf(person, l.p)}`}>
        <Face person={person} id={l.p} size={24} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-[13.5px] font-medium leading-[20px] text-[#EDEDEB] group-hover:text-white">{shortName(person, l.p)}</span>
            {person?.tag === "team" ? <span className="text-[11.5px] text-[#5E5E5A]">Team</span> : null}
            {l.k === "join" ? <Tag tone="new">New</Tag> : null}
          </span>
          <span className="block text-[13.5px] leading-[19px]" style={{ color: w.bad ? T.down : w.quiet ? "#7A7A74" : "#A9A8A2" }}>
            {w.text}
          </span>
          {w.sub ? <span className="mt-0.5 block text-[12px] tabular-nums leading-[17px] text-[#6A6A66]">{w.sub}</span> : null}
        </span>
      </button>
    </li>
  );
}
