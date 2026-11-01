"use client";

/**
 * A plan on its link, for friends without Krovvi (catch8 docs/TOGETHER-2026-11-01.md, Plans): the options as big
 * taps (every one that works, the faces of who can make it gathering on each), then in, maybe or can't, and Send.
 * The answer shows at once and goes to the plan's author; coming back shows it with a way to change it. Once the
 * author settles it, the settled option stands big, and the question is only whether they are in.
 *
 * Drawn as the site's own plan page draws its options (components/objects/kinds/plan.tsx): the ring that fills
 * ivory with a tick, the faces at the end, the reader's choice in ivory.
 */

import { useEffect, useRef, useState } from "react";

import { EASE, FaceStack, INK, STEP } from "@/components/objects/kit";
import { say, type Lang, type Words } from "@/lib/objects";
import { momentWords, namesWords, PLAN_STATES, type PlanState, type WebPostView } from "@/lib/together";

const C = {
  hint: { en: "Tap every one that works for you", ar: "دوس على كل اللي يناسبك" },
  in: { en: "I’m in", ar: "هاجي" },
  maybe: { en: "Maybe", ar: "يمكن" },
  cant: { en: "Can’t", ar: "مش هقدر" },
  send: { en: "Send", ar: "ابعت" },
  sending: { en: "Sending", ar: "بيتبعت" },
  sentIn: { en: "You’re in. {name} will see it.", ar: "قلت إنك هتيجي. ردك هيوصل لـ{name}." },
  sentMaybe: { en: "You said maybe. {name} will see it.", ar: "قلت يمكن. ردك هيوصل لـ{name}." },
  sentCant: { en: "You can’t make it. {name} will see it.", ar: "قلت مش هينفع. ردك هيوصل لـ{name}." },
  change: { en: "Change my answer", ar: "غيّر ردي" },
  settled: { en: "Settled", ar: "اتحسمت" },
  areYouIn: { en: "Are you in?", ar: "هتيجي؟" },
  answers: { en: "Who answered", ar: "مين رد" },
  whoIn: { en: "In", ar: "جايين" },
  whoMaybe: { en: "Maybe", ar: "يمكن" },
  whoCant: { en: "Can’t", ar: "مش هيقدروا" },
  nobody: { en: "Nobody has answered yet.", ar: "لسه محدش رد." },
  free: { en: "No app needed. Just your first name.", ar: "من غير أبلكيشن. اسمك الأول بس." },
} satisfies Record<string, Words>;

const STATE_WORDS: Record<PlanState, Words> = { in: C.in, maybe: C.maybe, cant: C.cant };
const SENT_WORDS: Record<PlanState, Words> = { in: C.sentIn, maybe: C.sentMaybe, cant: C.sentCant };
const WHO_WORDS: Record<PlanState, Words> = { in: C.whoIn, maybe: C.whoMaybe, cant: C.whoCant };

export function PlanBody({ post, lang, onAnswer }: { post: WebPostView; lang: Lang; onAnswer: (state: PlanState, picks: string[]) => Promise<boolean> }) {
  const plan = post.plan!;
  const mine = post.mine.answer;
  const settled = plan.settled ? (plan.options.find((o) => o.id === plan.settled) ?? null) : null;
  const [picks, setPicks] = useState<string[]>(mine?.picks ?? []);
  const [state, setState] = useState<PlanState | null>(mine?.state ?? null);
  const [editing, setEditing] = useState(!mine);
  const [sending, setSending] = useState(false);

  // A send under way, or one that did not go through, keeps what they picked on the form (review, 2 November 2026:
  // the copy put back after a failed change wiped the new picks and closed the form).
  const holding = useRef(false);

  // This browser's answer came, changed, or was put back after a send that did not go through: the form follows it,
  // and comes back (keeping what they had picked) when there is no answer any more.
  const mineKey = mine ? `${mine.state}|${mine.picks.join(",")}` : "";
  useEffect(() => {
    if (holding.current) return;
    if (!mine) {
      setEditing(true);
      return;
    }
    setPicks(mine.picks);
    setState(mine.state);
    setEditing(false);
    // The answer's value, not the object it arrives in (every read brings a new one).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mineKey]);

  const toggle = (id: string) => setPicks((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const ready = state !== null && !sending;
  const send = async () => {
    if (!state) return;
    const tried = { state, picks };
    holding.current = true;
    setSending(true);
    const chosen = state === "cant" ? [] : settled ? [settled.id] : picks;
    const ok = await onAnswer(state, chosen);
    setSending(false);
    if (ok) {
      holding.current = false;
      setEditing(false);
      return;
    }
    // Not sent: the form stays open with what they picked, to send again (the next send or answer lets go).
    setState(tried.state);
    setPicks(tried.picks);
    setEditing(true);
    window.setTimeout(() => {
      holding.current = false;
    }, 0);
  };

  const pickedBy = (id: string) => plan.answers.filter((a) => a.state !== "cant" && a.picks.includes(id)).map((a) => a.name);
  const author = post.authorName || (lang === "ar" ? "صاحب الخطة" : "the planner");

  return (
    <div>
      {settled ? (
        <section className="flex flex-col items-center text-center" style={{ background: INK.surface, borderRadius: 17, padding: "22px 16px 20px", gap: 4 }}>
          <span style={{ ...STEP.label, color: INK.muted }}>{say(C.settled, lang)}</span>
          <span style={{ ...STEP.display, fontSize: 30, lineHeight: "36px", animation: `tg-pop 420ms ${EASE} both` }}>
            <bdi dir="auto">{settled.label}</bdi>
          </span>
          {momentWords(settled.at, lang) || settled.place ? (
            <span style={{ ...STEP.title, fontWeight: 500, color: INK.soft }}>
              {[momentWords(settled.at, lang), settled.place].filter(Boolean).map((part, i) => (
                <span key={i}>
                  {i ? (lang === "ar" ? "، " : ", ") : null}
                  <bdi dir="auto">{part}</bdi>
                </span>
              ))}
            </span>
          ) : null}
        </section>
      ) : (
        <section className="flex flex-col" style={{ gap: 8 }}>
          {plan.options.map((o) => {
            const on = picks.includes(o.id) && state !== "cant";
            const who = pickedBy(o.id);
            const sub = [momentWords(o.at, lang), o.place].filter(Boolean) as string[];
            return (
              <button
                key={o.id}
                type="button"
                disabled={!editing}
                aria-pressed={on}
                onClick={() => {
                  toggle(o.id);
                  if (state === "cant" || state === null) setState("in");
                }}
                className="flex w-full items-center text-start active:scale-[0.99]"
                style={{
                  gap: 12,
                  minHeight: 60,
                  padding: "10px 14px",
                  borderRadius: 16,
                  background: INK.surfaceHi,
                  border: `1.5px solid ${on ? INK.pick : "transparent"}`,
                  transition: `border-color 200ms ${EASE}, transform 120ms ${EASE}`,
                  cursor: editing ? "pointer" : "default",
                }}
              >
                <span aria-hidden className="flex shrink-0 items-center justify-center rounded-full" style={{ width: 24, height: 24, border: `1.5px solid ${on ? INK.fg : INK.faint}`, background: on ? INK.fg : "transparent", transition: `background-color 200ms ${EASE}, border-color 200ms ${EASE}` }}>
                  {on ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6.2l2.3 2.3L9.6 3.6" stroke={INK.bg} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block" style={{ ...STEP.body, fontSize: 16, fontWeight: 600, color: on ? INK.pick : INK.fg }}>
                    <bdi dir="auto">{o.label}</bdi>
                  </span>
                  {sub.length ? (
                    <span className="block" style={{ ...STEP.meta, color: INK.muted }}>
                      {sub.map((part, i) => (
                        <span key={i}>
                          {i ? (lang === "ar" ? "، " : ", ") : null}
                          <bdi dir="auto">{part}</bdi>
                        </span>
                      ))}
                    </span>
                  ) : null}
                </span>
                {who.length ? (
                  <span key={who.join()} className="shrink-0" style={{ animation: `tg-pop 240ms ${EASE} both` }}>
                    <FaceStack names={who} size={24} max={4} />
                  </span>
                ) : null}
              </button>
            );
          })}
          {editing && plan.options.length > 1 ? <p className="text-center" style={{ ...STEP.meta, color: INK.muted, marginTop: 2 }}>{say(C.hint, lang)}</p> : null}
        </section>
      )}

      {editing && !settled ? (
        <div className="mt-5">
          <div role="radiogroup" aria-label={say(C.areYouIn, lang)} className="grid grid-cols-3" style={{ gap: 8 }}>
            {PLAN_STATES.map((s) => {
              const on = state === s;
              return (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setState(s)}
                  className="rounded-[14px] transition-[transform,background-color,color] duration-200 active:scale-[0.97]"
                  style={{ ...STEP.body, fontWeight: 600, height: 48, background: on ? INK.fg : INK.surfaceHi, color: on ? INK.bg : INK.fg }}
                >
                  {say(STATE_WORDS[s], lang)}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            disabled={!ready}
            onClick={() => void send()}
            className="mt-3 w-full rounded-[16px] transition-[transform,opacity] duration-200 active:scale-[0.985]"
            style={{ ...STEP.body, fontSize: 16, fontWeight: 600, padding: "15px 0", background: INK.fg, color: INK.bg, opacity: ready || sending ? 1 : 0.35 }}
          >
            {say(sending ? C.sending : C.send, lang)}
          </button>
          <p className="mt-2 text-center" style={{ ...STEP.meta, color: INK.muted }}>{say(C.free, lang)}</p>
        </div>
      ) : mine ? (
        <div className="mt-5" role="status" style={{ animation: `tg-rise 420ms ${EASE} both` }}>
          <p style={{ ...STEP.title, fontSize: 18, lineHeight: "24px" }}>
            <bdi>{say(SENT_WORDS[mine.state], lang).replace("{name}", author)}</bdi>
          </p>
          {settled ? null : (
            <button type="button" onClick={() => setEditing(true)} className="mt-3 rounded-full transition-transform active:scale-[0.98]" style={{ ...STEP.label, fontWeight: 600, padding: "10px 18px", background: INK.surfaceHi, color: INK.fg }}>
              {say(C.change, lang)}
            </button>
          )}
        </div>
      ) : null}

      <section className="mt-6" style={{ background: INK.surface, borderRadius: 17, padding: "12px 16px 14px" }}>
        <h2 style={{ ...STEP.label, color: INK.muted }}>{say(C.answers, lang)}</h2>
        {plan.answers.length ? (
          PLAN_STATES.map((s) => {
            const names = plan.answers.filter((a) => a.state === s).map((a) => a.name);
            if (!names.length) return null;
            return (
              <div key={s} className="flex items-center" style={{ gap: 12, paddingTop: 10 }}>
                <span className="shrink-0" style={{ ...STEP.label, width: 64, color: s === "cant" ? INK.muted : INK.fg }}>{say(WHO_WORDS[s], lang)}</span>
                <span className="shrink-0" style={{ opacity: s === "cant" ? 0.5 : 1 }}>
                  <FaceStack names={names} size={24} max={5} />
                </span>
                <span className="min-w-0 flex-1 truncate" style={{ ...STEP.body, color: s === "cant" ? INK.muted : INK.soft }}>
                  {namesWords(names, lang)}
                </span>
              </div>
            );
          })
        ) : (
          <p className="pt-2" style={{ ...STEP.body, color: INK.muted }}>{say(C.nobody, lang)}</p>
        )}
      </section>
      <style>{`@keyframes tg-pop{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:none}}@keyframes tg-rise{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}@media (prefers-reduced-motion:reduce){[style*="tg-pop"],[style*="tg-rise"]{animation:none!important}}`}</style>
    </div>
  );
}
