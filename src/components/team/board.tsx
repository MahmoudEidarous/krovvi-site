"use client";

/**
 * The team board (the owner, 15 October 2026: "a great easy to see dashboard
 * where he can see everything with very good looking charts and same
 * identity like krovvi ... it should real people names usage it should be
 * very organized very easy to navigate and look good"). Four tabs: Live (who
 * is in Krovvi now and everything done today, as it happens), People (one
 * line per person over a stretch of days), Growth (the last five weeks, and
 * how new people's first days went) and Answers (how fast Krovvi answered and
 * what went wrong). Tapping anyone opens their own page.
 *
 * Live means: while the page is open and in front it asks again every 5
 * seconds, with the stamp of what it already has, so a quiet minute costs a
 * few bytes. It stops asking when the page is in the background and asks at
 * once when it comes back.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Mark } from "@/components/mark";
import { liveSource, snapshotSource, type Board, type BoardSource, type Snapshot } from "@/lib/team";
import { useNow } from "./bits";
import { AnswersTab } from "./answers";
import { GrowthTab } from "./growth";
import { LiveTab } from "./live";
import { feedKey } from "./model";
import { PeopleTab } from "./people";
import { PersonSheet } from "./person";

const POLL_MS = 5_000;
const OFFLINE_MS = 15_000;
/** How long a new line in the feed stays lit. */
const FRESH_MS = 6_000;

export type Tab = "live" | "people" | "growth" | "answers";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "live", label: "Live" },
  { id: "people", label: "People" },
  { id: "growth", label: "Growth" },
  { id: "answers", label: "Answers" },
];

export function TeamBoard({ boardKey, snapshot }: { boardKey?: string; snapshot?: Snapshot }) {
  const source: BoardSource = useMemo(() => (snapshot ? snapshotSource(snapshot) : liveSource(boardKey ?? "")), [boardKey, snapshot]);
  const [board, setBoard] = useState<Board | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "denied" | "offline">("loading");
  const [offline, setOffline] = useState(false);
  const [checked, setChecked] = useState<number | null>(null);
  const [fresh, setFresh] = useState<Set<string>>(() => new Set());
  const [tab, setTab] = useState<Tab>("live");
  const [personId, setPersonId] = useState<string | null>(null);
  const seen = useRef<string | null>(null);
  const known = useRef<Set<string> | null>(null);
  const liveNow = useNow(15_000);
  // A snapshot is read as of the moment it was taken.
  const now = snapshot && board ? board.at : liveNow;

  // The tab lives in the address (#people), so a reload or a saved link opens where it was.
  useEffect(() => {
    const read = () => {
      const fromHash = window.location.hash.slice(1) as Tab;
      if (TABS.some((t) => t.id === fromHash)) setTab(fromHash);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  const go = useCallback((next: Tab) => {
    setTab(next);
    try {
      window.history.replaceState(null, "", `#${next}`);
    } catch {
      // The tab still changes.
    }
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    let alive = true;
    let busy = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const run = async () => {
      if (!alive || busy) return;
      if (document.visibilityState === "hidden") return;
      busy = true;
      const answer = await source.board(seen.current);
      busy = false;
      if (!alive) return;
      if (answer.kind === "denied") {
        setState("denied");
        return;
      }
      if (answer.kind === "offline") {
        setOffline(true);
        setState((s) => (s === "loading" ? "offline" : s));
        timer = setTimeout(run, OFFLINE_MS);
        return;
      }
      setOffline(false);
      setChecked(Date.now());
      if (answer.kind === "board") {
        const keys = new Set(answer.board.feed.map(feedKey));
        if (known.current) {
          const before = known.current;
          const added = new Set([...keys].filter((k) => !before.has(k)));
          if (added.size) setFresh(added);
        }
        known.current = keys;
        seen.current = answer.board.stamp;
        setBoard(answer.board);
      }
      setState("ready");
      timer = setTimeout(run, POLL_MS);
    };
    const wake = () => {
      if (document.visibilityState !== "visible") return;
      clearTimeout(timer);
      void run();
    };
    void run();
    document.addEventListener("visibilitychange", wake);
    window.addEventListener("online", wake);
    window.addEventListener("focus", wake);
    return () => {
      alive = false;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("online", wake);
      window.removeEventListener("focus", wake);
    };
  }, [source]);

  useEffect(() => {
    if (!fresh.size) return;
    const t = setTimeout(() => setFresh(new Set()), FRESH_MS);
    return () => clearTimeout(t);
  }, [fresh]);

  if (state === "denied") return <Notice title="This link is off" line="Ask whoever sent it to you for a new one." />;
  if (!board) {
    return state === "offline" ? <Notice title="Can’t reach Krovvi right now" line="Trying again every few seconds." /> : <Loading />;
  }

  return (
    <div className="min-h-dvh bg-[#0A0A0A] text-[#EDEDEB]">
      <Header tab={tab} go={go} checked={checked} offline={offline} snapshot={!!snapshot} />
      <main className="mx-auto w-full max-w-[1180px] px-4 pb-[calc(104px+env(safe-area-inset-bottom))] pt-4 sm:px-6 md:pb-20 md:pt-6">
        <div key={tab} className="team-tab">
          {tab === "live" ? <LiveTab board={board} now={now} fresh={fresh} onPerson={setPersonId} go={go} /> : null}
          {tab === "people" ? <PeopleTab board={board} now={now} onPerson={setPersonId} /> : null}
          {tab === "growth" ? <GrowthTab board={board} onPerson={setPersonId} /> : null}
          {tab === "answers" ? <AnswersTab board={board} onPerson={setPersonId} /> : null}
        </div>
      </main>
      <TabBar tab={tab} go={go} />
      {personId ? <PersonSheet id={personId} board={board} source={source} now={now} onClose={() => setPersonId(null)} /> : null}
    </div>
  );
}

function Header({ tab, go, checked, offline, snapshot }: { tab: Tab; go: (t: Tab) => void; checked: number | null; offline: boolean; snapshot: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#1A1A19] bg-[#0A0A0A]/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-[1180px] items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <Mark size={26} />
          <span className="text-[17px] font-semibold tracking-[-0.01em]">Krovvi</span>
          <span className="text-[15px] text-[#8F8F8A]">Team</span>
        </div>
        <nav className="hidden items-center gap-1 rounded-full bg-[#161615] p-[3px] md:flex" aria-label="Board">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => go(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={`rounded-full px-4 py-1.5 text-[13.5px] font-medium transition-colors duration-150 ${tab === t.id ? "bg-[#EDEDEB] text-[#0A0A0A]" : "text-[#A9A8A2] hover:text-[#EDEDEB]"}`}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <LivePill checked={checked} offline={offline} snapshot={snapshot} />
      </div>
    </header>
  );
}

function LivePill({ checked, offline, snapshot }: { checked: number | null; offline: boolean; snapshot: boolean }) {
  const now = useNow(1_000);
  if (snapshot) {
    return <span className="rounded-full bg-[#161615] px-3 py-1.5 text-[12.5px] font-medium text-[#A9A8A2]">Snapshot</span>;
  }
  const late = !checked || now - checked > 20_000;
  const live = !offline && !late;
  const since = checked ? Math.max(0, Math.round((now - checked) / 1000)) : null;
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-[#161615] px-3 py-1.5 text-[12.5px] font-medium" aria-live="polite">
      <span className={`h-2 w-2 rounded-full ${live ? "team-live bg-[#EDEDEB]" : "bg-[#7A7A74]"}`} />
      <span className={live ? "text-[#EDEDEB]" : "text-[#A9A8A2]"}>{live ? "Live" : offline ? "Reconnecting" : "Catching up"}</span>
      {since !== null && live ? <span className="hidden tabular-nums text-[#7A7A74] sm:inline">{since < 3 ? "just now" : `${since}s ago`}</span> : null}
    </span>
  );
}

function TabIcon({ id, on }: { id: Tab; on: boolean }) {
  const stroke = on ? "#EDEDEB" : "#8F8F8A";
  const common = { fill: "none", stroke, strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" aria-hidden="true">
      {id === "live" ? (
        <g {...common}>
          <circle cx={12} cy={12} r={2.2} fill={stroke} stroke="none" />
          <path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4" />
          <path d="M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14" opacity={0.6} />
        </g>
      ) : id === "people" ? (
        <g {...common}>
          <circle cx={9} cy={9} r={3.2} />
          <path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" />
          <circle cx={16.5} cy={8.5} r={2.6} opacity={0.7} />
          <path d="M16 13.6c2.3 0 4 1.5 4.5 4.4" opacity={0.7} />
        </g>
      ) : id === "growth" ? (
        <g {...common}>
          <path d="M5 19v-4M10 19v-7M15 19v-5M20 19V6" />
        </g>
      ) : (
        <g {...common}>
          <circle cx={12} cy={13.5} r={7} />
          <path d="M12 13.5V10M10 3.5h4M18 7l1.4-1.4" />
        </g>
      )}
    </svg>
  );
}

function TabBar({ tab, go }: { tab: Tab; go: (t: Tab) => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[#1A1A19] bg-[#0A0A0A]/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden" aria-label="Board">
      <div className="mx-auto grid h-[62px] max-w-[520px] grid-cols-4">
        {TABS.map((t) => {
          const on = tab === t.id;
          return (
            <button key={t.id} onClick={() => go(t.id)} aria-current={on ? "page" : undefined} className="flex flex-col items-center justify-center gap-0.5">
              <TabIcon id={t.id} on={on} />
              <span className={`text-[10.5px] font-medium ${on ? "text-[#EDEDEB]" : "text-[#8F8F8A]"}`}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function Notice({ title, line }: { title: string; line: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#0A0A0A] px-8 text-center text-[#EDEDEB]">
      <Mark size={56} />
      <h1 className="mt-6 text-[22px] font-semibold tracking-[-0.02em]">{title}</h1>
      <p className="mt-2 max-w-[300px] text-[15px] leading-relaxed text-[#A9A8A2]">{line}</p>
    </div>
  );
}

function Loading() {
  return (
    <div className="min-h-dvh bg-[#0A0A0A]">
      <div className="mx-auto flex h-14 max-w-[1180px] items-center gap-2.5 px-4 pt-[env(safe-area-inset-top)] sm:px-6">
        <Mark size={26} />
        <span className="text-[17px] font-semibold text-[#EDEDEB]">Krovvi</span>
        <span className="text-[15px] text-[#8F8F8A]">Team</span>
      </div>
      <div className="mx-auto grid max-w-[1180px] gap-3 px-4 pt-4 sm:px-6">
        <div className="team-shimmer h-[132px] rounded-[22px]" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="team-shimmer h-[112px] rounded-[20px]" />
          ))}
        </div>
        <div className="team-shimmer h-[240px] rounded-[22px]" />
      </div>
    </div>
  );
}
