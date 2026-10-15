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
    <div className="min-h-dvh bg-[#030303] text-[#EDEDEB] [font-feature-settings:'kern','ss01']">
      <Header tab={tab} go={go} checked={checked} offline={offline} snapshot={!!snapshot} />
      <main className="mx-auto w-full max-w-[1240px] px-4 pb-[calc(110px+env(safe-area-inset-bottom))] pt-6 sm:px-8 md:pb-24 md:pt-10">
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

function Brand() {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <Mark size={22} />
      <span className="text-[17px] font-semibold tracking-[-0.02em] text-[#EDEDEB]">krovvi</span>
      <span className="text-[17px] tracking-[-0.02em] text-[#5E5E5A]">team</span>
    </span>
  );
}

function Header({ tab, go, checked, offline, snapshot }: { tab: Tab; go: (t: Tab) => void; checked: number | null; offline: boolean; snapshot: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#030303]/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto grid h-14 w-full max-w-[1240px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-8">
        <Brand />
        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Board">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => go(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={`rounded-full px-4 py-1.5 text-[14px] font-medium transition-colors duration-150 ${tab === t.id ? "bg-white/[0.08] text-[#EDEDEB]" : "text-[#8F8F8A] hover:text-[#D9D8D3]"}`}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <span className="col-start-3 justify-self-end">
          <LiveMark checked={checked} offline={offline} snapshot={snapshot} />
        </span>
      </div>
    </header>
  );
}

/** Live and how fresh, in a few words; the dot breathes while the board is current. */
function LiveMark({ checked, offline, snapshot }: { checked: number | null; offline: boolean; snapshot: boolean }) {
  const now = useNow(1_000);
  if (snapshot) return <span className="text-[13px] font-medium text-[#8F8F8A]">Snapshot</span>;
  const late = !checked || now - checked > 20_000;
  const live = !offline && !late;
  const since = checked ? Math.max(0, Math.round((now - checked) / 1000)) : null;
  return (
    <span className="inline-flex items-center gap-2 text-[13px] font-medium" aria-live="polite">
      <span className={`h-[7px] w-[7px] rounded-full ${live ? "team-live bg-[#EDEDEB]" : "bg-[#5E5E5A]"}`} />
      <span className={live ? "text-[#EDEDEB]" : "text-[#8F8F8A]"}>{live ? "Live" : offline ? "Reconnecting" : "Catching up"}</span>
      {since !== null && live ? <span className="hidden tabular-nums text-[#5E5E5A] sm:inline">{since < 3 ? "now" : `${since}s`}</span> : null}
    </span>
  );
}

function TabIcon({ id, on }: { id: Tab; on: boolean }) {
  const stroke = on ? "#EDEDEB" : "#7A7A74";
  const common = { fill: "none", stroke, strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" aria-hidden="true">
      {id === "live" ? (
        <g {...common}>
          <circle cx={12} cy={12} r={2.1} fill={stroke} stroke="none" />
          <path d="M8 8a5.6 5.6 0 0 0 0 8M16 8a5.6 5.6 0 0 1 0 8" />
          <path d="M5.2 5.2a9.6 9.6 0 0 0 0 13.6M18.8 5.2a9.6 9.6 0 0 1 0 13.6" opacity={0.55} />
        </g>
      ) : id === "people" ? (
        <g {...common}>
          <circle cx={9.5} cy={8.5} r={3.2} />
          <path d="M3.8 19.2c.7-3.1 2.9-4.8 5.7-4.8s5 1.7 5.7 4.8" />
          <path d="M15.6 5.6a3 3 0 0 1 0 5.8M17.6 14.6c1.5.6 2.4 2 2.7 4.2" opacity={0.6} />
        </g>
      ) : id === "growth" ? (
        <g {...common}>
          <path d="M4 17.5l5-5 3.5 3.5L20 8.5" />
          <path d="M15.5 8.5H20V13" />
        </g>
      ) : (
        <g {...common}>
          <circle cx={12} cy={13.2} r={7} />
          <path d="M12 13.2V9.6M10 3.6h4" />
        </g>
      )}
    </svg>
  );
}

function TabBar({ tab, go }: { tab: Tab; go: (t: Tab) => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/[0.06] bg-[#030303]/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden" aria-label="Board">
      <div className="mx-auto grid h-[60px] max-w-[520px] grid-cols-4">
        {TABS.map((t) => {
          const on = tab === t.id;
          return (
            <button key={t.id} onClick={() => go(t.id)} aria-current={on ? "page" : undefined} className="flex flex-col items-center justify-center gap-[3px]">
              <TabIcon id={t.id} on={on} />
              <span className={`text-[10.5px] font-medium tracking-[0.01em] ${on ? "text-[#EDEDEB]" : "text-[#7A7A74]"}`}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function Notice({ title, line }: { title: string; line: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#030303] px-8 text-center text-[#EDEDEB]">
      <Mark size={48} />
      <h1 className="mt-7 text-[24px] font-light tracking-[-0.6px]">{title}</h1>
      <p className="mt-2 max-w-[300px] text-[14px] leading-relaxed text-[#8F8F8A]">{line}</p>
    </div>
  );
}

function Loading() {
  return (
    <div className="min-h-dvh bg-[#030303]">
      <div className="mx-auto flex h-14 max-w-[1240px] items-center px-4 pt-[env(safe-area-inset-top)] sm:px-8">
        <Brand />
      </div>
      <div className="mx-auto grid max-w-[1240px] gap-6 px-4 pt-10 sm:px-8">
        <div className="team-shimmer h-[44px] w-[min(520px,90%)] rounded-full" />
        <div className="team-shimmer h-[118px] rounded-[20px]" />
        <div className="team-shimmer h-[280px] rounded-[20px]" />
      </div>
    </div>
  );
}
