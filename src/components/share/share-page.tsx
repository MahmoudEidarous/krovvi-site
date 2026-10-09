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
 */

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";

import { Mark } from "@/components/mark";
import { INK, STEP } from "@/components/objects/kit";
import { browserLang, say, type Lang, type Words } from "@/lib/objects";
import { readShare, report, sayOpened, type ShareRead } from "@/lib/share";
import { JOIN_URL } from "@/lib/site";
import { ChatView, type MediaUrls } from "./chat-view";

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
} satisfies Record<string, Words>;

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
  const [lang, setLang] = useState<Lang>("en");
  const [reported, setReported] = useState(false);
  const [device, setDevice] = useState<"ios" | "other" | null>(null);
  const [noApp, setNoApp] = useState(false);
  const counted = useRef(false);

  useEffect(() => {
    setLang(browserLang());
    setDevice(onIos() ? "ios" : "other");
  }, []);
  const load = useCallback(() => {
    if (!token) return;
    setState({ kind: "loading" });
    void readShare(token).then((r) => setState(r.ok ? { kind: "ready", share: r.share } : r.off ? { kind: "off" } : r.offline ? { kind: "offline" } : { kind: "gone" }));
  }, [token]);
  useEffect(() => load(), [load]);

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

  const media = useMemo<MediaUrls>(() => {
    if (state.kind !== "ready") return {};
    const out: MediaUrls = {};
    for (const m of state.share.media) out[m.id] = { url: m.url, mime: m.mime };
    return out;
  }, [state]);

  const shellDir = lang === "ar" ? "rtl" : "ltr";
  // Whose page this is, and nothing to tap but the way home: the one way on is at the foot.
  const head = (
    <div className="flex items-center" style={{ height: 56 }}>
      <a href="/" className="flex items-center gap-2" aria-label="Krovvi">
        <Mark size={22} />
        <span style={{ ...STEP.label, fontWeight: 600 }}>Krovvi</span>
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
            <Mark size={34} className="animate-pulse" />
          </div>
        )}
      </main>
    );
  }

  const share = state.share;
  const contentDir = share.snapshot.dir;
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
        <ChatView snapshot={share.snapshot} media={media} lang={share.snapshot.lang} />
      </div>
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
