"use client";

/**
 * Live: who is in Krovvi right now, today's numbers against the same time
 * yesterday, today hour by hour, and everything people did today as it
 * happens. The numbers count people outside the team (guests included); the
 * team's own use is said beside them, never mixed in.
 */

import { useMemo, useState } from "react";

import type { Board, Person } from "@/lib/team";
import type { Tab } from "./board";
import { Avatar, Card, Chips, Delta, Legend, Pill, Quiet, Stat } from "./bits";
import { Bars, SHADE, TipRow, TipTitle } from "./charts";
import { activeBy, countBy, feedLines, hourCounts, lately, median, peopleById, rollups, speedRows, type FeedLine } from "./model";
import { addDays, ago, appName, byKrovvi, clock, dayLong, dayOf, firstName, hourOf, line, minutes, nameOf, noteWords, plural, seconds, when } from "./words";

type Who = "all" | "outside" | "team";

const pad2 = (n: number) => String(n).padStart(2, "0");

export function LiveTab({ board, now, fresh, onPerson, go }: { board: Board; now: number; fresh: Set<string>; onPerson: (id: string) => void; go: (t: Tab) => void }) {
  const people = useMemo(() => peopleById(board), [board]);
  const today = board.today;
  const yday = addDays(today, -1);
  const sameTimeYesterday = now - 86_400_000;
  const numbers = useMemo(() => {
    const outside = (id: string) => people.get(id)?.tag !== "team";
    const roll = rollups(board, today, today);
    let pOut = 0;
    let pTeam = 0;
    let msgsOut = 0;
    let msgsTeam = 0;
    let notes = 0;
    let voice = 0;
    let voiceMs = 0;
    let games = 0;
    let problems = 0;
    let krovviFirst = 0;
    let pushes = 0;
    for (const r of roll.values()) {
      const team = people.get(r.p)?.tag === "team";
      if (team) {
        if (r.days) pTeam += 1;
        msgsTeam += r.msgs;
        continue;
      }
      if (r.days) pOut += 1;
      msgsOut += r.msgs;
      notes += r.notes;
      voice += r.voice;
      voiceMs += r.voiceMs;
      games += r.games;
      problems += r.failed + r.problems;
      krovviFirst += r.krovviFirst;
      pushes += r.pushes;
    }
    const joined = board.people.filter((p) => p.tag !== "team" && dayOf(p.joined) === today).sort((a, b) => a.joined - b.joined);
    const joinedY = board.people.filter((p) => p.tag !== "team" && dayOf(p.joined) === yday && p.joined <= sameTimeYesterday).length;
    const activeY = [...activeBy(board.feed, yday, sameTimeYesterday)].filter(outside).length;
    const msgsY = countBy(board.feed, yday, sameTimeYesterday, (h) => h.k === "msg" && outside(h.p));
    const notesY = countBy(board.feed, yday, sameTimeYesterday, (h) => h.k === "note" && outside(h.p));
    const gamesY = new Set(board.feed.filter((h) => h.k === "msg" && h.x.gi && h.at <= sameTimeYesterday && dayOf(h.at) === yday && outside(h.p)).map((h) => h.x.gi)).size;
    const speed = speedRows(board, "out").get(today);
    return { pOut, pTeam, msgsOut, msgsTeam, notes, voice, voiceMs, games, problems, krovviFirst, pushes, joined, joinedY, activeY, msgsY, notesY, gamesY, speed };
  }, [board, today, yday, sameTimeYesterday, people]);

  const recent = useMemo(() => lately(board.feed, now, 10 * 60_000), [board, now]);
  const hour = useMemo(() => lately(board.feed, now, 60 * 60_000), [board, now]);
  const lastOne = useMemo(() => lately(board.feed, now, 3 * 86_400_000)[0], [board, now]);

  return (
    <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-start">
      <div className="grid grid-cols-1 gap-3 md:gap-4">
        <RightNow recent={recent} hour={hour.length} lastOne={lastOne} people={people} now={now} today={today} onPerson={onPerson} />

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <Stat
            label="People today"
            value={numbers.pOut}
            delta={<Delta now={numbers.pOut} then={numbers.activeY} label="against this time yesterday" />}
            sub={numbers.pTeam ? `+ ${numbers.pTeam} from the team` : "outside the team"}
            onClick={() => go("people")}
          />
          <Stat
            label="Messages"
            value={numbers.msgsOut}
            delta={<Delta now={numbers.msgsOut} then={numbers.msgsY} label="against this time yesterday" />}
            sub={numbers.msgsTeam ? `+ ${numbers.msgsTeam} from the team` : undefined}
          />
          <Stat
            label="New people"
            value={numbers.joined.length}
            delta={<Delta now={numbers.joined.length} then={numbers.joinedY} label="against this time yesterday" />}
            sub={numbers.joined.length ? numbers.joined.slice(0, 2).map((p) => firstName(p)).join(", ") + (numbers.joined.length > 2 ? ` +${numbers.joined.length - 2}` : "") : "none yet today"}
          />
          <Stat
            label="Notes"
            value={numbers.notes}
            delta={<Delta now={numbers.notes} then={numbers.notesY} label="against this time yesterday" />}
            sub={numbers.voice ? `${plural(numbers.voice, "recording")}, ${minutes(numbers.voiceMs)}` : undefined}
          />
          <Stat label="Games played" value={numbers.games} delta={<Delta now={numbers.games} then={numbers.gamesY} label="against this time yesterday" />} />
          <Stat
            label="Typical answer"
            value={numbers.speed?.med ?? 0}
            format={(v) => (numbers.speed?.med ? seconds(v) : "–")}
            sub={numbers.speed ? `${numbers.speed.answered} of ${plural(numbers.speed.msgs, "message")} answered` : "no messages yet"}
            onClick={() => go("answers")}
          />
          <Stat label="Problems" value={numbers.problems} sub={numbers.problems ? "failed answers and phone problems" : "nothing went wrong"} onClick={() => go("answers")} />
          <Stat
            label="Krovvi reached out"
            value={numbers.krovviFirst + numbers.pushes}
            sub={numbers.krovviFirst + numbers.pushes ? `${plural(numbers.krovviFirst, "message")} it started, ${plural(numbers.pushes, "notification")}` : "not yet today"}
          />
        </div>

        <TodayByHour board={board} people={people} now={now} />
      </div>
      <div className="lg:sticky lg:top-[72px]">
        <Feed board={board} people={people} now={now} fresh={fresh} onPerson={onPerson} />
      </div>
    </div>
  );
}

function RightNow({ recent, hour, lastOne, people, now, today, onPerson }: { recent: ReturnType<typeof lately>; hour: number; lastOne: ReturnType<typeof lately>[number] | undefined; people: Map<string, Person>; now: number; today: string; onPerson: (id: string) => void }) {
  return (
    <Card
      title="Right now"
      sub={`${clock(now)} in Cairo, ${dayLong(today)}`}
      right={hour ? <span className="text-[12.5px] tabular-nums text-[#8F8F8A]">{plural(hour, "person", "people")} in the last hour</span> : undefined}
    >
      {recent.length ? (
        <>
          <div className="mb-3 flex items-baseline gap-2">
            <span className="text-[34px] font-semibold leading-none tracking-[-0.03em] tabular-nums">{recent.length}</span>
            <span className="text-[15px] text-[#A9A8A2]">{recent.length === 1 ? "person in Krovvi now" : "people in Krovvi now"}</span>
          </div>
          <ul className="grid gap-1 sm:grid-cols-2 sm:gap-x-4">
            {recent.map((r) => {
              const p = people.get(r.p);
              return (
                <li key={r.p}>
                  <button onClick={() => onPerson(r.p)} className="flex w-full items-center gap-3 rounded-2xl px-1 py-2 text-left transition-colors duration-150 hover:bg-[#1B1B1A]">
                    <Avatar person={p} size={38} live />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-[14.5px] font-semibold">{nameOf(p, r.p)}</span>
                        {p?.tag === "team" ? <Pill tone="team">Team</Pill> : null}
                      </span>
                      <span className="block truncate text-[13px] text-[#A9A8A2]">
                        {r.k === "open" ? "opened Krovvi" : line(r.k, r.x).text}, {ago(r.at, now) === "now" ? "just now" : `${ago(r.at, now)} ago`}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <div className="flex items-center gap-3 py-1">
          <span className="h-2.5 w-2.5 rounded-full bg-[#3A3A38]" />
          <div>
            <div className="text-[17px] font-semibold tracking-[-0.01em]">Quiet right now</div>
            {lastOne ? (
              <div className="mt-0.5 text-[13.5px] text-[#A9A8A2]">
                Last one in:{" "}
                <button className="font-medium text-[#EDEDEB] underline decoration-[#3A3A38] underline-offset-4" onClick={() => onPerson(lastOne.p)}>
                  {nameOf(people.get(lastOne.p), lastOne.p)}
                </button>
                , {when(lastOne.at, now, today)}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </Card>
  );
}

function TodayByHour({ board, people, now }: { board: Board; people: Map<string, Person>; now: number }) {
  const today = board.today;
  const yday = addDays(today, -1);
  const isToday = dayOf(now) === today;
  const nowHour = isToday ? hourOf(now) : 23;
  const data = useMemo(() => {
    const t = hourCounts(board.feed, today, people);
    const y = hourCounts(board.feed, yday, people);
    const who: string[][] = Array.from({ length: 24 }, () => []);
    for (const h of board.feed) {
      if (h.k === "open" || dayOf(h.at) !== today) continue;
      const list = who[hourOf(h.at)];
      if (!list.includes(h.p)) list.push(h.p);
    }
    return { t, y, who };
  }, [board, today, yday, people]);
  const total = data.t.reduce((n, h) => n + h.out + h.team, 0);
  return (
    <Card title="Today by hour" sub="What people did in each hour, on Cairo’s clock. The outline behind each bar is the same hour yesterday." right={<span className="text-[12.5px] tabular-nums text-[#8F8F8A]">{plural(total, "thing")}</span>}>
      <Bars
        points={data.t.map((h, i) => ({ key: String(i), values: i > nowHour ? [0, 0] : [h.out, h.team], ghost: data.y[i].out + data.y[i].team }))}
        colors={[SHADE.outside, SHADE.team]}
        now={nowHour}
        label={(i) => (i === nowHour || (i % 6 === 0 && Math.abs(i - nowHour) > 1) ? pad2(i) : "")}
        tip={(i) => {
          const names = data.who[i].map((id) => firstName(people.get(id)));
          return (
            <>
              <TipTitle>
                {pad2(i)}:00 to {pad2((i + 1) % 24)}:00
              </TipTitle>
              <TipRow color={SHADE.outside} label="Outside people" value={data.t[i].out} />
              <TipRow color={SHADE.team} label="Team" value={data.t[i].team} />
              <TipRow label="Same hour yesterday" value={data.y[i].out + data.y[i].team} />
              {names.length ? <div className="mt-1.5 border-t border-[#2C2C2A] pt-1.5 text-[12px] text-[#A9A8A2]">{names.slice(0, 4).join(", ") + (names.length > 4 ? ` +${names.length - 4}` : "")}</div> : null}
            </>
          );
        }}
      />
      <div className="mt-3">
        <Legend items={[{ color: SHADE.outside, label: "Outside people" }, { color: SHADE.team, label: "Team" }, { color: "rgba(237,237,235,0.4)", label: "Yesterday", outline: true }]} />
      </div>
    </Card>
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
        return { text: `sent ${l.count} messages`, sub: `${span}${m ? `, answers took ${seconds(m)} typically` : ""}` };
      }
      case "note": {
        const kind = String(l.x.n ?? "");
        if (kind === "voice") return { text: `made ${l.count} recordings${l.ms ? `, ${minutes(l.ms)} in all` : ""}`, sub: span };
        return { text: `added ${l.count} ${noteWords(kind)[1]}`, sub: span };
      }
      case "card": {
        const done = Object.entries(l.tally)
          .sort((a, b) => b[1] - a[1])
          .map(([e, n]) => `${n} ${CARD_DONE[e] ?? e}`)
          .join(", ");
        return { text: `went through ${l.count} of Krovvi’s cards`, sub: [done, span].filter(Boolean).join(" · ") };
      }
      case "kfirst":
        return { text: `got ${l.count} messages Krovvi started`, sub: span, quiet };
      case "kmade":
        return { text: `got ${l.count} files Krovvi made`, sub: span, quiet };
      case "app":
        return { text: `made ${l.count} changes in ${appName(l.x.o)}`, sub: span };
      case "kapp":
        return { text: `had ${l.count} changes made in ${appName(l.x.o)} by Krovvi`, sub: span, quiet };
      case "buzz":
        return { text: `got ${l.count} notifications from Krovvi`, sub: span, quiet };
    }
  }
  if (l.k === "open") {
    const n = Number(l.x.n ?? 1);
    return { text: n > 1 ? `opened Krovvi, ${n} times ${onToday ? "today" : "that day"}` : "opened Krovvi", sub: n > 1 && l.x.f ? `first at ${clock(Number(l.x.f))}` : undefined };
  }
  return { ...line(l.k, l.x), quiet };
}

function Feed({ board, people, now, fresh, onPerson }: { board: Board; people: Map<string, Person>; now: number; fresh: Set<string>; onPerson: (id: string) => void }) {
  const [who, setWho] = useState<Who>("all");
  const [showYesterday, setShowYesterday] = useState(false);
  const today = board.today;
  const lines = useMemo(() => {
    const keep = board.feed.filter((h) => {
      const tag = people.get(h.p)?.tag;
      return who === "all" ? true : who === "team" ? tag === "team" : tag !== "team";
    });
    return feedLines(keep);
  }, [board, people, who]);
  const todays = lines.filter((l) => dayOf(l.at) === today);
  const yesterdays = lines.filter((l) => dayOf(l.at) !== today);
  return (
    <Card title="As it happens" sub="Everything people did today, newest first. Tap a name to see that person.">
      <div className="mb-2">
        <Chips<Who>
          label="Who"
          value={who}
          onChange={setWho}
          options={[
            { id: "all", label: "Everyone" },
            { id: "outside", label: "Outside" },
            { id: "team", label: "Team" },
          ]}
        />
      </div>
      <div className="lg:-mr-2 lg:max-h-[calc(100dvh-250px)] lg:overflow-y-auto lg:overscroll-contain lg:pr-2">
        {todays.length ? (
          <ul className="divide-y divide-[#1F1F1E]">
            {todays.map((l) => (
              <FeedRow key={l.key} l={l} person={people.get(l.p)} now={now} onToday fresh={fresh.has(l.key)} onPerson={onPerson} />
            ))}
          </ul>
        ) : (
          <Quiet>Nothing yet today.</Quiet>
        )}
        {yesterdays.length ? (
          <div className="mt-2 border-t border-[#1F1F1E] pt-3">
            {showYesterday ? (
              <>
                <div className="pb-1 text-[12.5px] font-medium text-[#8F8F8A]">Yesterday</div>
                <ul className="divide-y divide-[#1F1F1E]">
                  {yesterdays.map((l) => (
                    <FeedRow key={l.key} l={l} person={people.get(l.p)} now={now} onToday={false} fresh={false} onPerson={onPerson} />
                  ))}
                </ul>
              </>
            ) : (
              <button onClick={() => setShowYesterday(true)} className="w-full rounded-2xl bg-[#1B1B1A] py-3 text-[13.5px] font-medium text-[#A9A8A2] transition-colors duration-150 hover:bg-[#1F1F1E] hover:text-[#EDEDEB]">
                Show yesterday ({yesterdays.length})
              </button>
            )}
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function FeedRow({ l, person, now, onToday, fresh, onPerson }: { l: FeedLine; person: Person | undefined; now: number; onToday: boolean; fresh: boolean; onPerson: (id: string) => void }) {
  const w = lineWords(l, onToday);
  const joined = l.k === "join";
  const sub = [person?.tag === "team" ? "Team" : person?.tag === "guest" && !joined ? "Guest" : null, w.sub].filter(Boolean).join(" · ");
  const recent = now - l.at < 3_600_000;
  return (
    <li className={`flex items-start gap-3 py-2.5 ${fresh ? "team-new" : ""}`}>
      <button onClick={() => onPerson(l.p)} aria-label={`Open ${nameOf(person, l.p)}`} className="mt-0.5">
        <Avatar person={person} size={32} />
      </button>
      <div className="min-w-0 flex-1">
        <div className={`text-[14px] leading-snug ${w.quiet ? "text-[#8F8F8A]" : "text-[#A9A8A2]"}`}>
          <button onClick={() => onPerson(l.p)} className={`mr-1 font-semibold ${w.quiet ? "text-[#A9A8A2]" : "text-[#EDEDEB]"} hover:underline hover:decoration-[#3A3A38] hover:underline-offset-4`}>
            {nameOf(person, l.p)}
          </button>
          <span className={w.bad ? "text-[#E5876B]" : undefined}>{w.text}</span>
          {joined ? (
            <span className="ml-1.5 align-[1px]">
              <Pill tone="new">New</Pill>
            </span>
          ) : null}
        </div>
        {sub ? <div className="mt-0.5 text-[12px] tabular-nums text-[#7A7A74]">{sub}</div> : null}
      </div>
      <div className="shrink-0 pt-0.5 text-right">
        <div className="text-[12.5px] font-medium tabular-nums text-[#A9A8A2]">{clock(l.at)}</div>
        {onToday && recent ? <div className="text-[11.5px] tabular-nums text-[#7A7A74]">{ago(l.at, now) === "now" ? "now" : ago(l.at, now)}</div> : null}
      </div>
    </li>
  );
}
