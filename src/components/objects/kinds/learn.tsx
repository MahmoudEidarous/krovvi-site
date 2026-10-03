"use client";

/**
 * Learn on the page, drawn as the app draws its screen (catch8
 * src/components/objects/kinds/learn): the round as dots, the question card
 * as the hero (a pick flips its row right or wrong, with the why and the
 * faces of who picked what), Next, and after the last one the podium. This
 * page is where classmates answer. Its payload never holds an answer the
 * reader has not given (the core's shareSnap), so the flip waits for the
 * server's word.
 */

import { useEffect, useState } from "react";

import { say, type Words } from "@/lib/objects";
import { DotLine, EASE, Face, FaceStack, INK, Pill, STEP, dirOf, type Dot } from "../kit";
import type { KindPage } from "../types";

/** The view as the core sends it (catch8 kinds/learn.ts LearnView), the fields drawn here. */
interface Person {
  id: string;
  name: string;
  you: boolean;
}
interface LearnQuestion {
  id: string;
  n: number;
  q: string;
  choices: string[];
  answer: number | null;
  why: string | null;
  mine: { pick: number; right: boolean | null } | null;
  answered: Person[];
  picks: Person[][] | null;
  rightCount: number | null;
}
interface LearnView {
  questions: LearnQuestion[];
  current: number | null;
  you: { right: number; answered: number; total: number; done: boolean };
  host: boolean;
  podium: Array<Person & { right: number | null; answered: number; done: boolean; place: number }>;
  podiumReady: boolean;
}

const C = {
  right: { en: "Right", ar: "صح" },
  wrong: { en: "Not quite", ar: "مش دي" },
  yours: { en: "Your answer", ar: "إجابتك" },
  checking: { en: "Checking", ar: "بنشوف" },
  next: { en: "Next", ar: "اللي بعده" },
  again: { en: "Again", ar: "تاني من الأول" },
  podium: { en: "The podium", ar: "المنصة" },
  legend: { en: "Each dot is a question: ivory right, coral wrong", ar: "كل نقطة سؤال: الفاتحة صح والمرجاني غلط" },
  none: { en: "No questions yet", ar: "لسه مفيش أسئلة" },
  you: { en: "You", ar: "إنت" },
} satisfies Record<string, Words>;

const nOf = (n: number, total: number): Words => ({ en: `Question ${n} of ${total}`, ar: `سؤال ${n} من ${total}` });
const score = (r: number, t: number): Words => ({ en: `${r} of ${t} right`, ar: `${r} من ${t} صح` });
const answered = (n: number, t: number): Words => ({ en: `${n} of ${t} answered`, ar: `جاوب ${n} من ${t}` });
const gotIt = (n: number, of: number): Words => ({ en: `${n} of ${of} got it`, ar: `${n} من ${of} جابوها` });
const LETTERS = { en: ["A", "B", "C", "D"], ar: ["أ", "ب", "ج", "د"] };

export const Page: KindPage = ({ view, lang, act, can, busy }) => {
  const v = view as LearnView;
  const [shown, setShown] = useState<number | null>(v.current);
  useEffect(() => {
    if (shown === null && v.current !== null) setShown(v.current);
  }, [shown, v.current]);
  if (!v.you.total) {
    return (
      <section className="mb-3 flex flex-col items-center" style={{ background: INK.surface, borderRadius: 17, padding: "28px 16px" }}>
        <span style={STEP.title}>{say(C.none, lang)}</span>
      </section>
    );
  }
  const q = shown !== null ? v.questions[shown] : null;
  const nextIndex = v.questions.findIndex((x, i) => !x.mine && i !== shown);
  const dots: Dot[] = v.questions.map((x, i) => ({ on: !!x.mine && x.mine.right !== null, tint: x.mine?.right === false ? INK.down : INK.fg, now: i === shown && !x.mine }));
  const top = v.podium.filter((p) => p.right !== null).slice(0, 3);
  const most = Math.max(1, ...top.map((p) => p.right ?? 0));
  return (
    <div>
      <div className="mb-3 flex flex-col items-center" style={{ gap: 8 }}>
        <DotLine dots={dots} dot={9} gap={7} label={say(answered(v.you.answered, v.you.total), lang)} />
        <span style={{ ...STEP.meta, color: INK.muted }}>{v.you.done ? say(score(v.you.right, v.you.total), lang) : say(answered(v.you.answered, v.you.total), lang)}</span>
      </div>
      {q && !v.host ? (
        <section className="mb-3 flex flex-col" style={{ background: INK.surface, borderRadius: 17, padding: 16, gap: 12 }}>
          <span style={{ ...STEP.label, color: INK.muted }}>{say(nOf(q.n, v.you.total), lang)}</span>
          <span style={STEP.title}>
            <bdi dir={dirOf(q.q)}>{q.q}</bdi>
          </span>
          <div className="flex flex-col" style={{ gap: 8 }}>
            {q.choices.map((text, i) => {
              const picked = q.mine?.pick === i;
              const right = q.answer !== null && q.answer === i;
              const wrong = q.answer !== null && picked && !right;
              const letters = dirOf(q.q) === "rtl" ? LETTERS.ar : LETTERS.en;
              const faces = (q.picks?.[i] ?? []).filter((p) => !p.you).map((p) => p.name);
              return (
                <button
                  key={`${q.id}-${i}-${right ? "r" : wrong ? "w" : picked ? "p" : ""}`}
                  type="button"
                  disabled={!!q.mine || !can("answer") || busy}
                  onClick={() => void act("answer", { question: q.id, pick: i })}
                  aria-label={`${letters[i]}. ${text}${right ? `. ${say(C.right, lang)}` : wrong ? `. ${say(C.yours, lang)}, ${say(C.wrong, lang)}` : ""}`}
                  className="flex items-center text-start"
                  style={{
                    gap: 12,
                    padding: "10px 12px",
                    minHeight: 48,
                    borderRadius: 11,
                    background: right ? "#2A2925" : INK.surfaceHi,
                    border: `1px solid ${right ? INK.fg : wrong ? INK.down : picked ? INK.soft : "transparent"}`,
                    animation: right || wrong || picked ? `learnFlip 280ms ${EASE}` : undefined,
                  }}
                >
                  <span className="flex shrink-0 items-center justify-center rounded-full" style={{ width: 26, height: 26, border: `1px solid ${right ? INK.fg : INK.line}`, background: right ? INK.fg : undefined, ...STEP.label, color: right ? INK.bg : wrong ? INK.down : INK.soft }}>
                    {right ? "✓" : wrong ? "✕" : letters[i]}
                  </span>
                  <span className="min-w-0 flex-1" style={{ ...STEP.body, color: q.answer !== null && !right && !picked ? INK.muted : INK.fg }}>
                    <bdi dir={dirOf(text)}>{text}</bdi>
                  </span>
                  {faces.length ? <FaceStack names={faces} size={20} max={3} /> : null}
                </button>
              );
            })}
          </div>
          {q.mine && q.answer === null ? <span style={{ ...STEP.meta, color: INK.muted }}>{say(C.checking, lang)}</span> : null}
          {q.mine && q.answer !== null ? (
            <div className="flex flex-col" style={{ gap: 6 }}>
              <span style={{ ...STEP.title, color: q.mine.right ? INK.fg : INK.down }}>{say(q.mine.right ? C.right : C.wrong, lang)}</span>
              {q.why ? (
                <span style={{ ...STEP.body, color: INK.soft }}>
                  <bdi dir={dirOf(q.why)}>{q.why}</bdi>
                </span>
              ) : null}
              <div className="flex items-center" style={{ gap: 10, marginTop: 4 }}>
                <span className="flex-1" style={{ ...STEP.meta, color: INK.muted }}>{q.rightCount !== null && q.answered.length > 1 ? say(gotIt(q.rightCount, q.answered.length), lang) : ""}</span>
                {nextIndex >= 0 ? <Pill text={say(C.next, lang)} strong onClick={() => setShown(nextIndex)} /> : null}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
      {(v.you.done || v.host) && v.podiumReady && top.length ? (
        <section className="mb-3 flex flex-col items-center" style={{ background: INK.surface, borderRadius: 17, padding: "20px 16px", gap: 12 }} aria-label={top.map((p) => `${p.place}. ${p.name}, ${p.right}`).join(". ")}>
          <span style={{ ...STEP.label, color: INK.muted }}>{say(C.podium, lang)}</span>
          <div className="flex items-end justify-center" style={{ gap: 18 }}>
            {/* A podium's own shape: the first in the middle, the second beside it, the third on the other side. */}
            {(top.length === 3 ? [top[1], top[0], top[2]] : top).map((p) => (
              <div key={p.id} className="flex flex-col items-center" style={{ gap: 6, width: 84 }}>
                <Face name={p.name} size={36} />
                <span style={{ ...STEP.label }}>{p.you ? say(C.you, lang) : <bdi dir={dirOf(p.name)}>{p.name}</bdi>}</span>
                <div className="flex flex-col-reverse items-center" style={{ gap: 4, height: 12 + most * 12 }}>
                  {Array.from({ length: p.right ?? 0 }, (_, k) => (
                    <span key={k} className="rounded-full" style={{ width: 8, height: 8, background: INK.fg }} />
                  ))}
                </div>
                <span style={STEP.figure}>{p.right ?? 0}</span>
                <span style={{ ...STEP.meta, color: INK.muted }}>#{p.place}</span>
              </div>
            ))}
          </div>
          {v.you.done && can("again") ? <Pill text={say(C.again, lang)} disabled={busy} onClick={() => void act("again").then(() => setShown(0))} /> : null}
        </section>
      ) : null}
      <p style={{ ...STEP.meta, color: INK.muted, textAlign: "center" }}>{say(C.legend, lang)}</p>
      <style>{`@keyframes learnFlip { 0% { transform: perspective(600px) rotateX(0deg); } 50% { transform: perspective(600px) rotateX(88deg); } 100% { transform: perspective(600px) rotateX(0deg); } } @media (prefers-reduced-motion: reduce) { button { animation: none !important; } }`}</style>
    </div>
  );
};
