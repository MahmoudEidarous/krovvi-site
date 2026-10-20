"use client";

/**
 * A friend's page for one question (krovvi.com/a/<token>; the approved look is catch8
 * design/krovvi-whats-next-2026-10-19.html, "Bring a friend in", phone 2): the K and the name, "Mahmoud asks", the
 * question, the options (tap one, the picked one lit), their first name, Send, and under it "Your answer goes to
 * Mahmoud's chat. No app, no sign-up." After Send it says it went to Mahmoud's chat, with a quiet link to get Krovvi.
 * A friend who comes back sees what they answered and can change it: the door keeps one answer per browser.
 *
 * The page speaks the question's language (an Arabic question gets the whole page in Arabic, right to left), in the
 * site's night look. It needs nothing installed and works in iOS Safari as it is: plain fetches, a plain form.
 */

import { useCallback, useEffect, useState, type FormEvent } from "react";

import { Mark } from "@/components/mark";
import { EASE, INK, STEP } from "@/components/objects/kit";
import { cleanName, deviceId, keepAnswer, keptAnswer, lastName, readAsk, sendAnswer, type FriendAskRead } from "@/lib/friend-ask";
import { browserLang, say, type Lang, type Words } from "@/lib/objects";
import { JOIN_URL } from "@/lib/site";

const C = {
  asks: { en: "{name} asks", ar: "سؤال من {name}" },
  asksNobody: { en: "A question for you", ar: "سؤال ليك" },
  name: { en: "Your first name", ar: "اسمك الأول" },
  send: { en: "Send", ar: "ابعت" },
  sending: { en: "Sending", ar: "بيتبعت" },
  foot: { en: "Your answer goes to {name}’s chat.", ar: "ردك هيوصل لشات {name}." },
  footNobody: { en: "Your answer goes to the chat it was asked from.", ar: "ردك هيوصل للشات اللي اتسأل منه." },
  footFree: { en: "No app, no sign-up.", ar: "من غير أبلكيشن ولا تسجيل." },
  sent: { en: "Sent to {name}’s chat.", ar: "اتبعت لشات {name}." },
  sentNobody: { en: "Sent.", ar: "اتبعت." },
  yours: { en: "You said {option}.", ar: "قلت {option}." },
  change: { en: "Change my answer", ar: "غيّر ردي" },
  get: { en: "Get Krovvi", ar: "حمّل كروفي" },
  nameBad: { en: "Just your first name, please.", ar: "اسمك الأول بس." },
  busy: { en: "Too many at once. Try again in a minute.", ar: "كتير مرة واحدة. جرب كمان دقيقة." },
  failed: { en: "It didn’t send. Try again.", ar: "ما اتبعتش. جرب تاني." },
  closed: { en: "This question is closed.", ar: "السؤال ده اتقفل." },
  closedLine: { en: "It doesn’t take answers anymore.", ar: "مبقاش بياخد ردود." },
  gone: { en: "This link doesn’t work", ar: "اللينك ده مش شغال" },
  goneLine: { en: "Check it was copied whole.", ar: "اتأكد إنه اتنسخ كامل." },
  offline: { en: "Can’t reach this question right now", ar: "مش قادر أوصل للسؤال ده دلوقتي" },
  offlineLine: { en: "Check your connection, then try again.", ar: "اتأكد من النت وجرب تاني." },
  again: { en: "Try again", ar: "جرب تاني" },
} satisfies Record<string, Words>;

/** A line with the asker's name in it, or the line for when there is none. */
function withName(line: Words, nobody: Words, name: string | null, lang: Lang): string {
  return name ? say(line, lang).replace("{name}", name) : say(nobody, lang);
}

type View = { kind: "loading" } | { kind: "ready"; ask: FriendAskRead } | { kind: "gone" } | { kind: "offline" };

export function AskPage({ token, fixture }: { token: string; fixture?: FriendAskRead }) {
  const [view, setView] = useState<View>(fixture ? { kind: "ready", ask: fixture } : { kind: "loading" });
  const [shellLang, setShellLang] = useState<Lang>("en");
  const [pick, setPick] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [sending, setSending] = useState(false);
  const [problem, setProblem] = useState<keyof typeof C | null>(null);
  const [sent, setSent] = useState<{ name: string; option: number } | null>(null);
  const [closedNow, setClosedNow] = useState(false);

  useEffect(() => {
    setShellLang(browserLang());
    setName(lastName());
    const kept = keptAnswer(token);
    if (kept) setSent(kept);
  }, [token]);

  const load = useCallback(() => {
    if (fixture) return;
    setView({ kind: "loading" });
    void readAsk(token).then((r) => setView(r.ok ? { kind: "ready", ask: r.ask } : "gone" in r ? { kind: "gone" } : { kind: "offline" }));
  }, [token, fixture]);
  useEffect(() => load(), [load]);

  const lang: Lang = view.kind === "ready" ? view.ask.lang : shellLang;
  const dir = lang === "ar" ? "rtl" : "ltr";
  const head = (
    <div className="flex items-center" style={{ height: 56 }}>
      <a href="/" className="flex items-center gap-2" aria-label="Krovvi">
        <Mark size={22} />
        <span style={{ ...STEP.label, fontWeight: 600 }}>krovvi</span>
      </a>
    </div>
  );

  if (view.kind !== "ready") {
    const words = view.kind === "gone" ? [C.gone, C.goneLine] : view.kind === "offline" ? [C.offline, C.offlineLine] : null;
    return (
      <main dir={dir} lang={lang} className="mx-auto min-h-dvh w-full max-w-[520px] px-4" style={{ background: INK.bg, color: INK.fg }}>
        {head}
        {words ? (
          <div className="py-20 text-center">
            <h1 style={{ ...STEP.title, fontSize: 22, lineHeight: "28px" }}>{say(words[0], lang)}</h1>
            <p className="mt-2" style={{ ...STEP.body, color: INK.muted }}>{say(words[1], lang)}</p>
            {view.kind === "offline" ? (
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

  const ask = view.ask;
  const closed = ask.closed || closedNow;
  const typed = cleanName(name);
  const ready = pick !== null && typed.length > 0 && !sending && !closed;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!ready || pick === null) return;
    setSending(true);
    setProblem(null);
    const answer = { name: typed, option: pick };
    const said = fixture ? "sent" : await sendAnswer(token, { ...answer, device: deviceId() });
    setSending(false);
    if (said === "sent") {
      keepAnswer(token, answer);
      setSent(answer);
    } else if (said === "closed") setClosedNow(true);
    else if (said === "gone") setView({ kind: "gone" });
    else setProblem(said === "name" ? "nameBad" : said === "busy" ? "busy" : "failed");
  };

  // Krovvi's quiet way in, under what was sent or under a closed question: the one link the site already gives.
  const getKrovvi = (
    <a href={JOIN_URL} className="underline decoration-dotted underline-offset-4" style={{ ...STEP.meta, color: INK.faint }}>
      {say(C.get, lang)}
    </a>
  );

  return (
    <main dir={dir} lang={lang} className="mx-auto flex min-h-dvh w-full max-w-[520px] flex-col px-5" style={{ background: INK.bg, color: INK.fg, paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}>
      {head}
      <p className="mt-10" style={{ ...STEP.label, fontSize: 12, fontWeight: 600, letterSpacing: lang === "ar" ? 0 : "0.12em", textTransform: "uppercase", color: INK.muted }}>
        <bdi>{withName(C.asks, C.asksNobody, ask.asker, lang)}</bdi>
      </p>
      <h1 className="mt-2" style={{ fontSize: 30, lineHeight: "35px", fontWeight: 600, letterSpacing: lang === "ar" ? 0 : "-0.9px", textAlign: "start" }}>
        <bdi dir="auto">{ask.question}</bdi>
      </h1>

      {sent && !closed ? (
        // Sent: where it went, what they said, and a way to change it.
        <div className="mt-8" role="status" style={{ animation: `ask-rise 420ms ${EASE} both` }}>
          <p style={{ ...STEP.title, fontSize: 19, lineHeight: "25px" }}>{withName(C.sent, C.sentNobody, ask.asker, lang)}</p>
          <p className="mt-1" style={{ ...STEP.body, color: INK.muted }}>
            <bdi>{say(C.yours, lang).replace("{option}", ask.options[sent.option] ?? "")}</bdi>
          </p>
          <button
            type="button"
            onClick={() => {
              setPick(sent.option);
              setName(sent.name);
              setSent(null);
            }}
            className="mt-6 rounded-full transition-transform active:scale-[0.98]"
            style={{ ...STEP.label, fontWeight: 600, padding: "10px 18px", background: INK.surfaceHi, color: INK.fg }}
          >
            {say(C.change, lang)}
          </button>
          <div className="mt-10">{getKrovvi}</div>
        </div>
      ) : closed ? (
        <div className="mt-8">
          <p style={{ ...STEP.title, fontSize: 19, lineHeight: "25px" }}>{say(C.closed, lang)}</p>
          <p className="mt-1" style={{ ...STEP.body, color: INK.muted }}>{say(C.closedLine, lang)}</p>
          <div className="mt-10">{getKrovvi}</div>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-7 flex flex-1 flex-col">
          <div role="radiogroup" aria-label={ask.question} className="grid gap-2">
            {ask.options.map((option, i) => {
              const on = pick === i;
              return (
                <button
                  key={`${i}:${option}`}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setPick(i)}
                  className="w-full rounded-[16px] transition-[transform,background-color,color,border-color] duration-200 active:scale-[0.985]"
                  style={{
                    ...STEP.body,
                    fontSize: 16,
                    fontWeight: 600,
                    padding: "15px 16px",
                    textAlign: "start",
                    border: `1px solid ${on ? INK.fg : "rgba(255,255,255,0.16)"}`,
                    background: on ? INK.fg : "rgba(255,255,255,0.03)",
                    color: on ? INK.bg : INK.fg,
                  }}
                >
                  <bdi dir="auto">{option}</bdi>
                </button>
              );
            })}
          </div>
          <label className="mt-5 block">
            <span className="sr-only">{say(C.name, lang)}</span>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value.slice(0, 40));
                if (problem === "nameBad") setProblem(null);
              }}
              placeholder={say(C.name, lang)}
              autoComplete="given-name"
              autoCapitalize="words"
              enterKeyHint="send"
              maxLength={40}
              dir="auto"
              className="w-full rounded-[14px] outline-none placeholder:text-[#7A7A74]"
              // 16px: iOS Safari zooms the page into any field set smaller.
              style={{ ...STEP.body, fontSize: 16, padding: "14px 16px", background: "rgba(255,255,255,0.06)", color: INK.fg, border: "1px solid transparent" }}
            />
          </label>
          {problem ? (
            <p className="mt-2" role="alert" style={{ ...STEP.meta, color: INK.down }}>
              {say(C[problem], lang)}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={!ready}
            className="mt-3 w-full rounded-[16px] transition-[transform,opacity] duration-200 active:scale-[0.985]"
            style={{ ...STEP.body, fontSize: 16, fontWeight: 600, padding: "15px 0", background: INK.fg, color: INK.bg, opacity: ready || sending ? 1 : 0.35 }}
          >
            {say(sending ? C.sending : C.send, lang)}
          </button>
          <p className="mt-auto pt-12 text-center" style={{ ...STEP.meta, lineHeight: "18px", color: INK.muted }}>
            {withName(C.foot, C.footNobody, ask.asker, lang)}
            <br />
            {say(C.footFree, lang)}
          </p>
        </form>
      )}
      <style>{`@keyframes ask-rise{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}@media (prefers-reduced-motion:reduce){[role=status]{animation:none!important}}`}</style>
    </main>
  );
}
