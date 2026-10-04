"use client";

/**
 * An object on its page, the same for all eighteen kinds: the header (the
 * object's mark, title, kind and people), the kind's own view, what happened,
 * and Krovvi's quiet foot. It reads the object in the browser, again every
 * five seconds while the page is in view, and whoever has the link acts as
 * the seat they picked ("Which one is you?"), asked the first time they try.
 * A real win plays its moment once; the last change offers Undo.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { Mark } from "@/components/mark";
import { JOIN_URL } from "@/lib/site";
import { act as actOn, browserLang, forgetSeat, readPage, say, seatOf, takeSeat, undo as undoOn, type Lang, type PagePayload, type Words, iso } from "@/lib/objects";
import { dirOf, Face, FaceStack, INK, Moment, Row, Section, STEP } from "./kit";
import { KindMark } from "./mark";
import { KIND_PAGES } from "./kinds";

const C = {
  gone: { en: "This link doesn’t work any more", ar: "اللينك ده مابقاش شغال" },
  goneLine: { en: "It was turned off, or the thing it opened was removed.", ar: "اتقفل، أو الحاجة اللي كان بيفتحها اتشالت." },
  offline: { en: "Can’t reach it right now. Trying again.", ar: "مش قادر أوصله دلوقتي. بحاول تاني." },
  happened: { en: "What happened", ar: "اللي حصل" },
  who: { en: "Which one is you?", ar: "إنت مين فيهم؟" },
  whoLine: { en: "Pick yourself once. This browser remembers it.", ar: "اختار نفسك مرة. المتصفح ده هيفتكرها." },
  someoneElse: { en: "Someone else", ar: "حد تاني" },
  yourName: { en: "Your first name", ar: "اسمك الأول" },
  go: { en: "That’s me", ar: "ده أنا" },
  cancel: { en: "Not now", ar: "مش دلوقتي" },
  taken: { en: "Someone already took that one. Pick another.", ar: "حد تاني اختاره. اختار غيره." },
  youAre: { en: "You’re", ar: "إنت" },
  notYou: { en: "Not you?", ar: "مش إنت؟" },
  failed: { en: "That didn’t go through. Try again.", ar: "ماوصلش. جرب تاني." },
  undo: { en: "Undo", ar: "رجوع" },
  made: { en: "Made with Krovvi", ar: "معمول بكروفي" },
  get: { en: "Get Krovvi", ar: "حمّل كروفي" },
  people: { en: "people", ar: "أشخاص" },
  justOne: { en: "Just one", ar: "شخص واحد" },
  look: { en: "You can look at it", ar: "تقدر تتفرج عليه" },
  soon: { en: "Coming soon", ar: "قريب" },
} satisfies Record<string, Words>;

function ago(at: number, now: number, lang: Lang): string {
  if (!now) return "";
  const m = Math.max(0, Math.round((now - at) / 60000));
  if (m < 1) return lang === "ar" ? "دلوقتي" : "now";
  if (m < 60) return lang === "ar" ? `${m} د` : `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return lang === "ar" ? `${h} س` : `${h}h`;
  const d = Math.round(h / 24);
  return lang === "ar" ? `${d} يوم` : `${d}d`;
}

type State<V> = { kind: "loading" } | { kind: "gone" } | { kind: "ready"; page: PagePayload<V> };

/**
 * `token` reads the live object; `fixture` draws a payload with no network
 * (dev mode: the core's own fixtures, src/components/objects/fixtures).
 */
/** Kinds that are one person's own (a food day, a cycle): the people in them only look. Kept with catch8's core (spec.personal). */
const PERSONAL = new Set(["food", "workout", "mood", "cycle"]);

/**
 * Under the title, as the app says it: the kind, then who it is with ("To-do ·
 * With Sam and Lina", past two names a count); a personal kind says whose it
 * is ("Shared by Alex"). The kind steps aside when the title is its own name.
 */
function headLine(page: PagePayload, lang: Lang): string {
  const kind = say(page.kindName, lang);
  const owner = page.members.find((m) => m.role === "owner");
  const others = page.members.filter((m) => !m.you).map((m) => m.name);
  const two = (a: string, b: string) => (lang === "ar" ? `${a} و${b}` : `${a} and ${b}`);
  const names = others.length === 1 ? iso(others[0]) : others.length === 2 ? two(iso(others[0]), iso(others[1])) : lang === "ar" ? `${others.length} أشخاص` : `${others.length} people`;
  const people =
    PERSONAL.has(page.kind) && owner && !owner.you
      ? lang === "ar" ? `شاركه ${iso(owner.name)}` : `Shared by ${iso(owner.name)}`
      : !others.length
        ? lang === "ar" ? "شخص واحد" : "Just one"
        : lang === "ar" ? `مع ${names}` : `With ${names}`;
  const title = page.title.trim().toLowerCase();
  return title === page.kindName.en.toLowerCase() || title === page.kindName.ar ? people : `${kind} · ${people}`;
}

export function ObjectView<V>({ token, fixture }: { token?: string; fixture?: PagePayload<V> }) {
  const [state, setState] = useState<State<V>>(fixture ? { kind: "ready", page: fixture } : { kind: "loading" });
  const [lang, setLang] = useState<Lang>("en");
  // The clock starts in the browser: the server's minute would not match it, and the page would be redrawn.
  const [now, setNow] = useState(0);
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState<null | { op: string; args?: Record<string, unknown> }>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [moment, setMoment] = useState<{ line: string; play: number; burst: boolean }>({ line: "", play: 0, burst: true });
  const [lastEvent, setLastEvent] = useState<{ event: number; line: string } | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => setLang(browserLang()), []);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const refresh = useCallback(async (first = false) => {
    if (!token) return;
    const read = await readPage<V>(token, browserLang(), seatOf(token), first);
    if (read.ok) {
      setOffline(false);
      setState({ kind: "ready", page: read.page });
    } else if (read.gone) setState({ kind: "gone" });
    else setOffline(true);
  }, [token]);

  // Read now (the one read counted as an open of the link), then every five seconds while the page is in view.
  useEffect(() => {
    if (!token) return;
    void refresh(true);
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 5_000);
    const back = () => document.visibilityState === "visible" && void refresh();
    document.addEventListener("visibilitychange", back);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", back);
    };
  }, [token, refresh]);

  const playMoments = useCallback(
    (page: PagePayload<V>) => {
      const name = page.moments?.[0];
      const words = name ? page.momentWords[name] : null;
      if (words) setMoment((m) => ({ line: say(words, lang), play: m.play + 1, burst: page.momentFeel?.[name!]?.burst !== false }));
    },
    [lang]
  );

  const act = useCallback(
    async (op: string, args?: Record<string, unknown>): Promise<boolean> => {
      setProblem(null);
      if (fixture || !token) return true;
      if (!seatOf(token)) {
        setAsking({ op, args });
        return false;
      }
      setBusy(true);
      const done = await actOn<V>(token, browserLang(), op, args);
      setBusy(false);
      if (done.ok) {
        setState({ kind: "ready", page: done.page });
        playMoments(done.page);
        const line = done.page.activity[0]?.line;
        if (done.event !== null && line) setLastEvent({ event: done.event, line: say(line, lang) });
        return true;
      }
      if ("seat" in done && done.seat) {
        setAsking({ op, args });
        return false;
      }
      if ("gone" in done && done.gone) setState({ kind: "gone" });
      else setProblem(("problem" in done && done.problem) || say(C.failed, lang));
      return false;
    },
    [fixture, token, lang, playMoments]
  );

  // The Undo line stays five seconds.
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!lastEvent) return;
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setLastEvent(null), 5_000);
  }, [lastEvent]);

  if (state.kind === "loading") {
    return (
      <Shell lang={lang}>
        <div className="flex justify-center py-24">
          <Mark size={34} className="animate-pulse" />
        </div>
      </Shell>
    );
  }
  if (state.kind === "gone") {
    return (
      <Shell lang={lang}>
        <div className="py-20 text-center">
          <h1 style={{ ...STEP.title, fontSize: 22, lineHeight: "28px" }}>{say(C.gone, lang)}</h1>
          <p className="mt-2" style={{ ...STEP.body, color: INK.muted }}>
            {say(C.goneLine, lang)}
          </p>
        </div>
      </Shell>
    );
  }

  const page = state.page;
  const View = KIND_PAGES[page.kind];
  const you = page.members.find((m) => m.you) ?? null;
  const names = page.members.map((m) => m.name);
  return (
    <Shell lang={lang}>
      <header className="flex items-center gap-3" style={{ padding: "8px 0 16px" }}>
        <span className="flex shrink-0 items-center justify-center" style={{ width: 48, height: 48, borderRadius: 14, background: INK.surfaceHi }} aria-hidden>
          <KindMark kind={page.kind} size={26} />
        </span>
        <span className="min-w-0 flex-1">
          <h1 className="truncate" style={{ ...STEP.title, fontSize: 20, lineHeight: "25px", textAlign: "start" }}>
            <bdi dir={dirOf(page.title)}>{page.title}</bdi>
          </h1>
          <span className="block" style={{ ...STEP.meta, color: INK.muted }}>
            {headLine(page, lang)}
          </span>
        </span>
        {names.length > 1 ? <FaceStack names={names} size={26} /> : null}
      </header>

      {you ? (
        <p className="mb-3 flex items-center gap-2" style={{ ...STEP.meta, color: INK.muted }}>
          <Face name={you.name} size={20} />
          <span>{`${say(C.youAre, lang)} ${you.name}`}</span>
          <button
            type="button"
            className="underline decoration-dotted underline-offset-2"
            onClick={() => {
              if (token) forgetSeat(token);
              void refresh();
            }}
          >
            {say(C.notYou, lang)}
          </button>
        </p>
      ) : page.role === "viewer" ? (
        <p className="mb-3" style={{ ...STEP.meta, color: INK.muted }}>
          {say(C.look, lang)}
        </p>
      ) : null}

      {View ? (
        <View page={page} view={page.view} lang={lang} act={act} can={(op) => page.ops.includes(op)} busy={busy} now={now} token={token} />
      ) : (
        <Section>
          <p className="p-6 text-center" style={{ ...STEP.body, color: INK.muted }}>
            {say(C.soon, lang)}
          </p>
        </Section>
      )}

      {problem ? (
        <p className="mb-3" role="alert" style={{ ...STEP.meta, color: INK.down }}>
          {problem}
        </p>
      ) : null}
      {offline ? (
        <p className="mb-3" style={{ ...STEP.meta, color: INK.muted }}>
          {say(C.offline, lang)}
        </p>
      ) : null}

      {page.activity.length ? (
        <Section title={say(C.happened, lang)}>
          {page.activity.slice(0, 12).map((a, i) => (
            <Row
              key={`${a.at}-${i}`}
              first={i === 0}
              lead={a.name ? <Face name={a.name} size={26} /> : <span style={{ width: 26 }} />}
              ours
              title={say(a.line, lang)}
              value={<span style={{ ...STEP.meta, color: INK.muted }}>{ago(a.at, now, lang)}</span>}
            />
          ))}
        </Section>
      ) : null}

      {lastEvent && token ? (
        <div className="fixed inset-x-4 z-30 mx-auto flex max-w-[560px] items-center gap-3 rounded-full" style={{ bottom: 20, height: 48, padding: "0 16px", background: INK.surfaceHi }}>
          <span className="min-w-0 flex-1 truncate" style={{ ...STEP.body, textAlign: "start" }}>
            <bdi dir={dirOf(lastEvent.line)}>{lastEvent.line}</bdi>
          </span>
          <button
            type="button"
            style={{ ...STEP.label, fontWeight: 600 }}
            onClick={async () => {
              const event = lastEvent.event;
              setLastEvent(null);
              const back = await undoOn<V>(token, browserLang(), event);
              if (back.ok) setState({ kind: "ready", page: back.page });
            }}
          >
            {say(C.undo, lang)}
          </button>
        </div>
      ) : null}

      {asking && token ? (
        <SeatSheet
          page={page}
          lang={lang}
          onCancel={() => setAsking(null)}
          onPick={async (pick) => {
            const seated = await takeSeat<V>(token, browserLang(), pick);
            if (!seated.ok) return say(seated.taken ? C.taken : C.failed, lang);
            setState({ kind: "ready", page: seated.page });
            const pending = asking;
            setAsking(null);
            if (pending) await act(pending.op, pending.args);
            return null;
          }}
        />
      ) : null}

      <Moment line={moment.line} play={moment.play} burst={moment.burst} />
    </Shell>
  );
}

/** The page around an object: Krovvi's mark, the object, and the way to get the app. */
function Shell({ children, lang }: { children: React.ReactNode; lang: Lang }) {
  return (
    <main dir={lang === "ar" ? "rtl" : "ltr"} lang={lang} className="mx-auto min-h-dvh w-full max-w-[600px] px-4 pb-28" style={{ background: INK.bg, color: INK.fg }}>
      <div className="flex items-center justify-between" style={{ height: 56 }}>
        <a href="/" className="flex items-center gap-2" aria-label="Krovvi">
          <Mark size={22} />
          <span style={{ ...STEP.label, fontWeight: 600 }}>Krovvi</span>
        </a>
        <a href={JOIN_URL} className="rounded-full" style={{ ...STEP.label, fontWeight: 600, padding: "6px 12px", background: INK.surfaceHi }}>
          {say(C.get, lang)}
        </a>
      </div>
      {children}
      <footer className="mt-10 text-center" style={{ ...STEP.meta, color: INK.faint }}>
        {say(C.made, lang)}
      </footer>
    </main>
  );
}

/** "Which one is you?": the people the owner named who have not come yet, or someone new by first name. */
function SeatSheet<V>({ page, lang, onPick, onCancel }: { page: PagePayload<V>; lang: Lang; onPick: (pick: { member?: string; name?: string }) => Promise<string | null>; onCancel: () => void }) {
  const [picked, setPicked] = useState<string | null>(page.seats[0]?.id ?? "new");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const ready = picked && (picked !== "new" || name.trim().length > 0);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={say(C.who, lang)}>
      <button type="button" className="absolute inset-0" style={{ background: "rgba(0,0,0,0.55)" }} onClick={onCancel} aria-label={say(C.cancel, lang)} />
      <div className="relative w-full max-w-[600px]" style={{ background: INK.surface, borderRadius: "22px 22px 0 0", padding: "20px 16px 28px" }}>
        <h2 style={{ ...STEP.title, fontSize: 20, lineHeight: "26px" }}>{say(C.who, lang)}</h2>
        <p className="mb-4 mt-1" style={{ ...STEP.body, color: INK.muted }}>
          {say(C.whoLine, lang)}
        </p>
        <div className="overflow-hidden" style={{ background: INK.bg, borderRadius: 17 }}>
          {[...page.seats, { id: "new", name: say(C.someoneElse, lang) }].map((s, i) => (
            <Row
              key={s.id}
              first={i === 0}
              lead={s.id === "new" ? <span className="block rounded-full" style={{ width: 30, height: 30, background: INK.surfaceHi }} /> : <Face name={s.name} size={30} />}
              title={s.name}
              value={<span className="block rounded-full" style={{ width: 22, height: 22, ...(picked === s.id ? { background: INK.fg } : { border: `1.5px solid ${INK.faint}` }) }} />}
              onClick={() => setPicked(s.id)}
            />
          ))}
        </div>
        {picked === "new" ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 40))}
            placeholder={say(C.yourName, lang)}
            dir="auto"
            className="mt-3 w-full rounded-[16px] outline-none"
            style={{ ...STEP.body, background: INK.surfaceHi, color: INK.fg, padding: "14px 16px" }}
          />
        ) : null}
        {problem ? (
          <p className="mt-3" role="alert" style={{ ...STEP.meta, color: INK.down }}>
            {problem}
          </p>
        ) : null}
        <div className="mt-4 flex gap-3">
          <button type="button" onClick={onCancel} className="h-[50px] flex-1 rounded-full" style={{ ...STEP.body, fontWeight: 600, background: INK.surfaceHi }}>
            {say(C.cancel, lang)}
          </button>
          <button
            type="button"
            disabled={!ready || busy}
            onClick={async () => {
              setBusy(true);
              const failed = await onPick(picked === "new" ? { name: name.trim() } : { member: picked! });
              setBusy(false);
              if (failed) setProblem(failed);
            }}
            className="h-[50px] flex-1 rounded-full disabled:opacity-40"
            style={{ ...STEP.body, fontWeight: 600, background: INK.fg, color: INK.bg }}
          >
            {say(C.go, lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
