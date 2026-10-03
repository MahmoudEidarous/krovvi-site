"use client";

/**
 * A shared chat on its page: the title, who shared it (only if they chose to
 * say), when, every message as the app draws it, and two ways on: Continue in
 * Krovvi (the app copies it into their own account, where their Krovvi
 * answers from their own memory) or Get Krovvi. An open is counted only once
 * the page has really been seen for a few seconds; a report reaches a person.
 */

import { useEffect, useMemo, useRef, useState } from "react";

import { Mark } from "@/components/mark";
import { INK, STEP } from "@/components/objects/kit";
import { browserLang, say, type Lang, type Words } from "@/lib/objects";
import { readShare, report, sayOpened, type ShareRead } from "@/lib/share";
import { JOIN_URL } from "@/lib/site";
import { ChatView, type MediaUrls } from "./chat-view";

const C = {
  shared: { en: "Shared from Krovvi", ar: "متشارك من كروفي" },
  sharedBy: { en: "Shared by", ar: "شاركه" },
  off: { en: "This link was turned off", ar: "اللينك ده اتقفل" },
  offLine: { en: "Whoever shared it stopped sharing it.", ar: "اللي شاركه وقف المشاركة." },
  gone: { en: "This link doesn’t work", ar: "اللينك ده مش شغال" },
  goneLine: { en: "Check it was copied whole.", ar: "اتأكد إنه اتنسخ كامل." },
  cont: { en: "Continue in Krovvi", ar: "كمّل في كروفي" },
  contLine: { en: "Pick it up in your own Krovvi. Your Krovvi answers from what it knows about you.", ar: "كمّلها في كروفي بتاعك. كروفي بتاعك بيرد من اللي يعرفه عنك." },
  get: { en: "Get Krovvi", ar: "حمّل كروفي" },
  report: { en: "Report this page", ar: "بلّغ عن الصفحة دي" },
  reported: { en: "Thanks. A person will look at it.", ar: "شكرا. حد هيبص عليها." },
  offline: { en: "Can’t reach it right now. Try again in a moment.", ar: "مش قادر أوصله دلوقتي. جرب تاني بعد شوية." },
} satisfies Record<string, Words>;

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
  const counted = useRef(false);

  useEffect(() => setLang(browserLang()), []);
  useEffect(() => {
    if (!token) return;
    void readShare(token).then((r) => setState(r.ok ? { kind: "ready", share: r.share } : r.off ? { kind: "off" } : { kind: "gone" }));
  }, [token]);

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
  const head = (
    <div className="flex items-center justify-between" style={{ height: 56 }}>
      <a href="/" className="flex items-center gap-2" aria-label="Krovvi">
        <Mark size={22} />
        <span style={{ ...STEP.label, fontWeight: 600 }}>Krovvi</span>
      </a>
      <a
        href={JOIN_URL}
        // The link goes with them: once Krovvi is installed it offers to open the link they copied.
        onClick={() => {
          try {
            void navigator.clipboard?.writeText(window.location.href);
          } catch {
            // Getting the app works the same without it.
          }
        }}
        className="rounded-full"
        style={{ ...STEP.label, fontWeight: 600, padding: "6px 12px", background: INK.surfaceHi }}
      >
        {say(C.get, lang)}
      </a>
    </div>
  );

  if (state.kind !== "ready") {
    const words = state.kind === "off" ? [C.off, C.offLine] : state.kind === "gone" ? [C.gone, C.goneLine] : state.kind === "offline" ? [C.offline, C.offline] : null;
    return (
      <main dir={shellDir} lang={lang} className="mx-auto min-h-dvh w-full max-w-[680px] px-4" style={{ background: INK.bg, color: INK.fg }}>
        {head}
        {words ? (
          <div className="py-20 text-center">
            <h1 style={{ ...STEP.title, fontSize: 22, lineHeight: "28px" }}>{say(words[0], lang)}</h1>
            <p className="mt-2" style={{ ...STEP.body, color: INK.muted }}>{say(words[1], lang)}</p>
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
          {share.name ? `${say(C.sharedBy, lang)} ${share.name}` : say(C.shared, lang)} · {day(share.made_at, lang)}
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
          <a
            href={`krovvi://s/${token ?? ""}?do=continue`}
            className="flex h-[52px] items-center justify-center rounded-full transition-transform active:scale-[0.98]"
            style={{ ...STEP.body, fontWeight: 600, background: INK.fg, color: INK.bg }}
          >
            {say(C.cont, lang)}
          </a>
          <p className="mt-2 text-center" style={{ ...STEP.meta, color: INK.muted }}>{say(C.contLine, lang)}</p>
        </div>
      </div>
    </main>
  );
}
