"use client";

/**
 * A shared chat on its page, kept to the point (the owner, 9 October 2026, of
 * sharing a chat: "it should simple and jsut soo god at what it is do ... see
 * what cahtgpt does make something simialr easy good and to the point"): the
 * title, when it was shared, every message as the app draws it, and one way
 * on at the foot. On an iPhone that is Continue in Krovvi (the app copies
 * the chat into their own account, where their Krovvi answers from their own
 * memory), and Get Krovvi is offered only when the app did not open. Anywhere
 * else it is Get Krovvi. Nothing else asks for the app: the pill that stood
 * in the top corner and the line under the button are gone. A link made with
 * its sharer's name, which the app no longer offers, still says it. An open
 * is counted only once the page has really been seen for a few seconds.
 *
 * A long chat opens at once (the owner, 16 November 2026: "should not take
 * forever to load with long chats ... and should be much more realibale"):
 * the first part (about a screen or two) is drawn as soon as it comes, and
 * the rest follows a part at a time behind it, each part drawn without
 * holding the page (a transition, React's own way to keep a page answering
 * while it draws). A part that does not come is asked again by itself, and
 * again when the phone is back online; only then does the page say so, at
 * the end of what it has, with Try again. The mark is the app's own icon.
 */

import { startTransition, useCallback, useEffect, useRef, useState, type MouseEvent } from "react";

import { AppIcon } from "@/components/look/app-icon";
import { INK, STEP } from "@/components/objects/kit";
import { browserLang, say, type Lang, type Words } from "@/lib/objects";
import { readPart, readShare, report, sayOpened, type MediaLink, type ShareRead } from "@/lib/share";
import { JOIN_URL } from "@/lib/site";
import { ChatView, mediaOfTurn, PhotoAgain, type MediaUrls, type SnapTurn, type TurnItem } from "./chat-view";

const C = {
  sharedBy: { en: "Shared by", ar: "شاركه" },
  off: { en: "This link was turned off", ar: "اللينك ده اتقفل" },
  offLine: { en: "Whoever shared it stopped sharing it.", ar: "اللي شاركه وقف المشاركة." },
  gone: { en: "This link doesn’t work", ar: "اللينك ده مش شغال" },
  goneLine: { en: "Check it was copied whole.", ar: "اتأكد إنه اتنسخ كامل." },
  cont: { en: "Continue in Krovvi", ar: "كمّل في كروفي" },
  get: { en: "Get Krovvi", ar: "حمّل كروفي" },
  report: { en: "Report this page", ar: "بلّغ عن الصفحة دي" },
  // Only what is true: the report is kept; nobody is promised to read it.
  reported: { en: "Thanks. It was reported.", ar: "شكرا. البلاغ اتسجل." },
  offline: { en: "Can’t reach this chat right now", ar: "مش قادر أوصل للشات ده دلوقتي" },
  offlineLine: { en: "Check your connection, then try again.", ar: "اتأكد من النت وجرب تاني." },
  again: { en: "Try again", ar: "جرب تاني" },
  noApp: { en: "Didn’t open? Krovvi isn’t on this phone yet.", ar: "ما فتحش؟ كروفي مش على الموبايل ده لسه." },
  notIphone: { en: "Krovvi is on iPhone.", ar: "كروفي على الآيفون." },
  // The rest of a long chat, after its first part.
  restComing: { en: "Loading the rest of the chat", ar: "باقي المحادثة بيتحمّل" },
  restFailed: { en: "The rest of the chat didn’t load.", ar: "باقي المحادثة ماتحمّلش." },
} satisfies Record<string, Words>;

/** How many turns the first draw holds when a door from before parts sends the whole chat at once: the rest is drawn behind it. */
const FIRST_DRAW = 12;

function mediaMap(links: MediaLink[]): MediaUrls {
  const out: MediaUrls = {};
  for (const m of links) out[m.id] = { url: m.url, mime: m.mime };
  return out;
}

/** Turns and the links for each one's own photos and files. */
function itemsOf(turns: SnapTurn[], links: MediaLink[]): TurnItem[] {
  const all = mediaMap(links);
  return turns.map((turn) => ({ turn, media: mediaOfTurn(turn, all) }));
}

/** Where the rest of the chat stands: all here, on its way from a turn, or not come after asking again. */
type Rest = { kind: "done" } | { kind: "coming"; from: number } | { kind: "failed"; from: number };

/** How long the page waits for the app to take over before it says the app is not there. */
const APP_WAIT_MS = 1800;

/** Whether this is an iPhone or iPad, where Krovvi runs (an iPad says it is a Mac, with a touch screen). */
function onIos(): boolean {
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

/** The link goes with them: once Krovvi is installed it offers to open the link they copied. */
function keepLink(): void {
  try {
    void navigator.clipboard?.writeText(window.location.href);
  } catch {
    // Getting the app works the same without it.
  }
}

function day(at: number, lang: Lang): string {
  try {
    return new Intl.DateTimeFormat(lang === "ar" ? "ar-EG-u-nu-latn" : "en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(at));
  } catch {
    return "";
  }
}

export function SharePage({ token, fixture }: { token?: string; fixture?: ShareRead }) {
  const [state, setState] = useState<{ kind: "loading" } | { kind: "ready"; share: ShareRead } | { kind: "off" } | { kind: "gone" } | { kind: "offline" }>(
    fixture ? { kind: "ready", share: fixture } : { kind: "loading" }
  );
  const [items, setItems] = useState<TurnItem[]>(() => (fixture ? itemsOf(fixture.snapshot.turns, fixture.media) : []));
  const [rest, setRest] = useState<Rest>({ kind: "done" });
  const [lang, setLang] = useState<Lang>("en");
  const [reported, setReported] = useState(false);
  const [device, setDevice] = useState<"ios" | "other" | null>(null);
  const [noApp, setNoApp] = useState(false);
  const counted = useRef(false);
  /** Which reading of the page this is: a part asked for by an earlier one is dropped when it comes. */
  const reading = useRef(0);

  useEffect(() => {
    setLang(browserLang());
    setDevice(onIos() ? "ios" : "other");
  }, []);
  const load = useCallback(() => {
    if (!token) return;
    const mine = ++reading.current;
    setState({ kind: "loading" });
    setRest({ kind: "done" });
    void readShare(token).then((r) => {
      if (mine !== reading.current) return;
      if (!r.ok) return setState(r.off ? { kind: "off" } : r.offline ? { kind: "offline" } : { kind: "gone" });
      const all = itemsOf(r.share.snapshot.turns, r.share.media);
      // The first screen at once; a whole chat from a door before parts is drawn behind it.
      setItems(all.slice(0, FIRST_DRAW));
      setState({ kind: "ready", share: r.share });
      if (all.length > FIRST_DRAW) startTransition(() => setItems(all));
      setRest(r.share.more ? { kind: "coming", from: r.share.more.from } : { kind: "done" });
    });
  }, [token]);
  useEffect(() => load(), [load]);

  // The rest of the chat, a part at a time, each drawn as it comes without holding the page.
  const version = state.kind === "ready" ? state.share.version : 0;
  useEffect(() => {
    if (!token || rest.kind !== "coming" || !version) return;
    const mine = reading.current;
    let live = true;
    void readPart(token, rest.from, version).then((r) => {
      if (!live || mine !== reading.current) return;
      if (r.ok) {
        // Drawn behind what is on screen, while the next part is already on its way.
        startTransition(() => setItems((had) => [...had, ...itemsOf(r.turns, r.media)]));
        setRest(r.more && r.turns.length ? { kind: "coming", from: r.more.from } : { kind: "done" });
      } else if (r.changed) load();
      else if (r.off) setState({ kind: "off" });
      else if (r.gone) setState({ kind: "gone" });
      else setRest({ kind: "failed", from: rest.from });
    });
    return () => {
      live = false;
    };
  }, [token, rest, version, load]);

  // Back online: what did not come is asked again, by itself.
  useEffect(() => {
    const back = () => {
      if (state.kind === "offline") load();
      else if (rest.kind === "failed") setRest({ kind: "coming", from: rest.from });
    };
    window.addEventListener("online", back);
    return () => window.removeEventListener("online", back);
  }, [state.kind, rest, load]);

  // A photo that did not load (its hour-long link ran out on a page left open): fresh links for the part it is in.
  const photoAgain = useCallback(
    (turn: number) => {
      if (!token || !version || turn < 0) return;
      void readPart(token, turn, version).then((r) => {
        if (!r.ok) return;
        const fresh = mediaMap(r.media);
        setItems((had) => had.map((it, n) => (n < turn || n >= turn + Math.max(1, r.turns.length) ? it : { turn: it.turn, media: mediaOfTurn(it.turn, { ...it.media, ...fresh }) })));
      });
    },
    [token, version]
  );

  // Continue in Krovvi: the app takes over if it is on this phone. If the page is still in front a moment later,
  // it is not (Safari has said the address is invalid), so the page says so and offers the app instead.
  const deep = `krovvi://s/${token ?? ""}?do=continue`;
  const tryApp = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      setNoApp(false);
      let timer = 0;
      const stop = () => {
        window.clearTimeout(timer);
        document.removeEventListener("visibilitychange", hidden);
        window.removeEventListener("pagehide", stop);
      };
      const hidden = () => {
        if (document.visibilityState === "hidden") stop();
      };
      timer = window.setTimeout(() => {
        stop();
        if (document.visibilityState === "visible") setNoApp(true);
      }, APP_WAIT_MS);
      document.addEventListener("visibilitychange", hidden);
      window.addEventListener("pagehide", stop);
      window.location.href = deep;
    },
    [deep]
  );

  // An open counts after the page has been in view for five seconds, once.
  useEffect(() => {
    if (!token || state.kind !== "ready" || counted.current) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const arm = () => {
      if (timer || document.visibilityState !== "visible") return;
      timer = setTimeout(() => {
        if (document.visibilityState === "visible" && !counted.current) {
          counted.current = true;
          sayOpened(token);
        }
      }, 5_000);
    };
    const away = () => {
      if (document.visibilityState !== "visible" && timer) {
        clearTimeout(timer);
        timer = null;
      } else arm();
    };
    arm();
    document.addEventListener("visibilitychange", away);
    return () => {
      document.removeEventListener("visibilitychange", away);
      if (timer) clearTimeout(timer);
    };
  }, [token, state.kind]);

  const shellDir = lang === "ar" ? "rtl" : "ltr";
  // Whose page this is, and nothing to tap but the way home: the one way on is at the foot. The mark is the app's
  // own icon, as a home screen shows it.
  const head = (
    <div className="flex items-center" style={{ height: 56 }}>
      <a href="/" className="flex items-center gap-2" aria-label={lang === "ar" ? "كروفي" : "Krovvi"}>
        <AppIcon size={24} />
        {/* Its name in the page's own language: on an Arabic page it is كروفي, as the button at the foot says it. */}
        <span style={{ ...STEP.label, fontWeight: 600 }}>{lang === "ar" ? "كروفي" : "Krovvi"}</span>
      </a>
    </div>
  );

  if (state.kind !== "ready") {
    const words = state.kind === "off" ? [C.off, C.offLine] : state.kind === "gone" ? [C.gone, C.goneLine] : state.kind === "offline" ? [C.offline, C.offlineLine] : null;
    return (
      <main dir={shellDir} lang={lang} className="mx-auto min-h-dvh w-full max-w-[680px] px-4" style={{ background: INK.bg, color: INK.fg }}>
        {head}
        {words ? (
          <div className="py-20 text-center">
            <h1 style={{ ...STEP.title, fontSize: 22, lineHeight: "28px" }}>{say(words[0], lang)}</h1>
            <p className="mt-2" style={{ ...STEP.body, color: INK.muted }}>{say(words[1], lang)}</p>
            {state.kind === "offline" ? (
              <button type="button" onClick={load} className="mt-6 rounded-full active:scale-[0.98]" style={{ ...STEP.label, fontWeight: 600, padding: "10px 18px", background: INK.surfaceHi, color: INK.fg }}>
                {say(C.again, lang)}
              </button>
            ) : null}
          </div>
        ) : (
          <div className="flex justify-center py-24">
            <AppIcon size={28} className="animate-pulse" />
          </div>
        )}
      </main>
    );
  }

  const share = state.share;
  const contentDir = share.snapshot.dir;
  const restLang = share.snapshot.lang;
  return (
    <main dir={shellDir} lang={lang} className="mx-auto min-h-dvh w-full max-w-[680px] px-4 pb-40" style={{ background: INK.bg, color: INK.fg }}>
      {head}
      <header style={{ padding: "12px 0 8px" }}>
        <h1 style={{ ...STEP.title, fontSize: 24, lineHeight: "30px", letterSpacing: "-0.6px", textAlign: "start" }}>
          <bdi dir="auto">{share.title}</bdi>
        </h1>
        <p style={{ ...STEP.meta, color: INK.muted, marginTop: 4 }}>
          {share.name ? `${say(C.sharedBy, lang)} ${share.name} · ${day(share.made_at, lang)}` : day(share.made_at, lang)}
        </p>
      </header>
      <div dir={contentDir}>
        <PhotoAgain.Provider value={token ? photoAgain : null}>
          <ChatView items={items} lang={share.snapshot.lang} />
        </PhotoAgain.Provider>
      </div>
      {/* The end of what has come, while the rest is on its way, or when it did not come after asking again. In the
          chat's own language, under its last message. */}
      {rest.kind === "coming" ? (
        <p dir={contentDir} lang={restLang} role="status" className="mt-6 text-center" style={{ ...STEP.meta, color: INK.faint }}>
          {say(C.restComing, restLang)}
        </p>
      ) : rest.kind === "failed" ? (
        <div dir={contentDir} lang={restLang} role="status" className="mt-6 text-center">
          <p style={{ ...STEP.meta, color: INK.muted }}>{say(C.restFailed, restLang)}</p>
          <button
            type="button"
            onClick={() => setRest({ kind: "coming", from: rest.from })}
            className="mt-3 rounded-full active:scale-[0.98]"
            style={{ ...STEP.label, fontWeight: 600, padding: "10px 18px", background: INK.surfaceHi, color: INK.fg }}
          >
            {say(C.again, restLang)}
          </button>
        </div>
      ) : null}
      <footer className="mt-10 text-center">
        {!reported ? (
          <button
            type="button"
            className="underline decoration-dotted underline-offset-4"
            style={{ ...STEP.meta, color: INK.faint }}
            onClick={async () => {
              if (token && (await report(token, "reported from the page"))) setReported(true);
            }}
          >
            {say(C.report, lang)}
          </button>
        ) : (
          <span style={{ ...STEP.meta, color: INK.faint }}>{say(C.reported, lang)}</span>
        )}
      </footer>
      {/* Solid under the button, fading above it, so no words show through what it says. */}
      <div className="fixed inset-x-0 bottom-0 z-30" style={{ background: "linear-gradient(to bottom, rgba(10,10,10,0), #0A0A0A 26px)", paddingTop: 30 }}>
        <div className="mx-auto max-w-[680px] px-4 pb-5">
          {device === "other" ? (
            // Not an iPhone: there is no app here to continue in, so the way on is getting it.
            <>
              <a
                href={JOIN_URL}
                onClick={keepLink}
                className="flex h-[52px] items-center justify-center rounded-full transition-transform active:scale-[0.98]"
                style={{ ...STEP.body, fontWeight: 600, background: INK.fg, color: INK.bg }}
              >
                {say(C.get, lang)}
              </a>
              <p className="mt-2 text-center" style={{ ...STEP.meta, color: INK.muted }}>{say(C.notIphone, lang)}</p>
            </>
          ) : (
            <>
              <a
                href={deep}
                onClick={tryApp}
                className="flex h-[52px] items-center justify-center rounded-full transition-transform active:scale-[0.98]"
                style={{ ...STEP.body, fontWeight: 600, background: INK.fg, color: INK.bg }}
              >
                {say(C.cont, lang)}
              </a>
              {noApp ? (
                <div className="mt-2 flex items-center justify-center gap-3" role="status">
                  <span style={{ ...STEP.meta, color: INK.muted }}>{say(C.noApp, lang)}</span>
                  <a href={JOIN_URL} onClick={keepLink} className="shrink-0 rounded-full" style={{ ...STEP.label, fontWeight: 600, padding: "6px 12px", background: INK.surfaceHi, color: INK.fg }}>
                    {say(C.get, lang)}
                  </a>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
