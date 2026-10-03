"use client";

/**
 * Decide on the page, drawn as the app draws its screen (catch8
 * src/components/objects/kinds/decide): the balance as the hero (a beam that
 * leans toward the heavier pan, each pan holding one dot per point of weight
 * in the tint of whoever made the point), the seal and any reason that
 * cracked since, the options' facts side by side, and each option's points.
 * Nobody seals or cracks from the page. A partner adds their own points
 * here (an option, for or against, a few words, how much it matters) and
 * weighs their own again with its dots; their points arrive in their color.
 */

import { useEffect, useRef, useState, type FormEvent } from "react";

import { say, type Words } from "@/lib/objects";
import { DotLine, EASE, Face, INK, Pill, Section, STEP, dirOf, tintOf, type Dot } from "../kit";
import { listOf } from "./meals";
import type { KindPage, PageProps } from "../types";

/** The view as the core sends it (catch8 kinds/decide.ts DecideView), the fields drawn here. */
interface Person {
  id: string;
  name: string;
}
interface DecidePoint {
  id: string;
  side: "for" | "against";
  text: string;
  weight: 1 | 2 | 3;
  from: { label: string | null } | null;
  by: Person | null;
  cracked: { fact: string } | null;
}
interface DecideOption {
  id: string;
  name: string;
  facts: Array<{ label: string; value: string }>;
  for: DecidePoint[];
  against: DecidePoint[];
  forWeight: number;
  againstWeight: number;
  lead: boolean;
  sealed: boolean;
}
interface BalanceDot {
  point: string;
  by: string | null;
  cracked: boolean;
}
interface Pan {
  label: Words;
  weight: number;
  dots: BalanceDot[];
}
interface DecideView {
  options: DecideOption[];
  balance: { left: Pan; right: Pan; tilt: number; even: boolean } | null;
  state: "open" | "sealed" | "cracked";
  seal: { name: string; why: string | null; reasons: Array<{ text: string }>; leansAway: boolean } | null;
  cracks: Array<{ point: string; text: string; fact: string; from: { label: string | null } | null; at: number }>;
  factLabels: string[];
}

const C = {
  legend: { en: "Each dot is one point of weight", ar: "كل نقطة بوزن واحد" },
  even: { en: "Even so far", ar: "متعادلين لحد دلوقتي" },
  forSide: { en: "For", ar: "مع" },
  againstSide: { en: "Against", ar: "ضد" },
  reasonChanged: { en: "A reason changed", ar: "سبب اتغير" },
  leansAway: { en: "The balance leans away from it now", ar: "الميزان مايل بعيد عنه دلوقتي" },
  sideBySide: { en: "Side by side", ar: "جنب بعض" },
  none: { en: "Nothing to weigh yet", ar: "لسه مفيش حاجة تتوزن" },
  restingOn: { en: "Resting on", ar: "مبني على" },
  lead: { en: "Leads", ar: "متقدم" },
  chosen: { en: "Chosen", ar: "اتقرر" },
  why: { en: "Why", ar: "ليه" },
  yourPoint: { en: "Add your point", ar: "ضيف نقطتك" },
  on: { en: "Which option", ar: "أنهي اختيار" },
  side: { en: "For or against", ar: "مع ولا ضد" },
  placeholder: { en: "A reason, in a few words", ar: "سبب، في كلمتين" },
  matters: { en: "How much it matters", ar: "أهميتها" },
  add: { en: "Add", ar: "ضيف" },
} satisfies Record<string, Words>;

const weightWords = (n: number): Words => (n === 1 ? { en: "Matters a little", ar: "مهمة شوية" } : n === 2 ? { en: "Matters", ar: "مهمة" } : { en: "Matters a lot", ar: "مهمة جدا" });
const weightOf = (n: number): Words => ({ en: `Weight ${n} of 3`, ar: `الوزن ${n} من 3` });

const leads = (name: string, l: number, r: number): Words => ({ en: `${name} leads ${l} to ${r}`, ar: `${name} متقدم ${l} لـ ${r}` });
const forAgainst = (l: number, r: number): Words => ({ en: `For ${l}, against ${r}`, ar: `مع ${l}، ضد ${r}` });
const decided = (name: string): Words => ({ en: `Decided: ${name}`, ar: `اتقرر: ${name}` });
const MAX_DEG = 12;

function stateWords(v: DecideView, lang: "en" | "ar"): string {
  const b = v.balance;
  if (!b) return say(C.none, lang);
  if (v.seal) return say(decided(v.seal.name), lang);
  if (v.options.length === 1) return say(forAgainst(b.left.weight, b.right.weight), lang);
  return b.even ? say(C.even, lang) : say(leads(say(b.left.label, lang), b.left.weight, b.right.weight), lang);
}

export const Page: KindPage = ({ page, view, lang, act, can, busy }) => {
  const v = view as DecideView;
  const rtl = lang === "ar";
  const b = v.balance;
  // Who made each point, by name for its dots' tint: from the view itself first, since a card frozen in a shared chat comes with no members.
  const names = new Map<string, string>();
  for (const o of v.options) for (const p of [...o.for, ...o.against]) if (p.by) names.set(p.by.id, p.by.name);
  for (const m of page.members) names.set(m.id, m.name);
  const nameOf = (id: string | null) => (id ? (names.get(id) ?? "") : "");
  // The leader stands on the reading side: the page mirrors in Arabic, so the left pan in code is the right one on screen.
  const deg = b ? (rtl ? 1 : -1) * b.tilt * MAX_DEG : 0;
  // A crack shakes the beam once, the first time this page sees it.
  const [shaking, setShaking] = useState(false);
  const seen = useRef<string | null>(null);
  const latest = v.state === "cracked" ? v.cracks[0] : null;
  useEffect(() => {
    if (!latest) return;
    const key = `${latest.point}:${latest.at}`;
    if (seen.current === key) return;
    seen.current = key;
    setShaking(true);
    const t = setTimeout(() => setShaking(false), 340);
    return () => clearTimeout(t);
  }, [latest]);
  const pan = (p: Pan) => {
    const dots: Dot[] = p.dots.map((d) => ({ on: d.cracked ? 0.22 : true, tint: nameOf(d.by) ? tintOf(nameOf(d.by)) : INK.fg }));
    return (
      <div className="flex flex-col items-center" style={{ width: "46%", gap: 10 }}>
        <div className="flex min-h-[44px] w-full max-w-[150px] items-center justify-center" style={{ padding: 8, borderRadius: 11, background: INK.surfaceHi }}>
          <DotLine dots={dots} dot={9} gap={5} />
        </div>
        <span style={STEP.figure}>{p.weight}</span>
        <span style={{ ...STEP.label, color: INK.soft, textAlign: "center" }}>
          <bdi dir={dirOf(say(p.label, lang))}>{say(p.label, lang)}</bdi>
        </span>
      </div>
    );
  };
  const half = 140;
  const lift = Math.sin((deg * Math.PI) / 180) * half;
  return (
    <div>
      <section className="mb-3 flex flex-col items-center" style={{ background: INK.surface, borderRadius: 17, padding: "20px 16px", gap: 14 }}>
        <span style={{ ...STEP.title, textAlign: "center" }}>
          {/* The page's own sentence around an option's name: it reads in the page's direction, the name in its own. */}
          <bdi dir={rtl ? "rtl" : "ltr"}>{stateWords(v, lang)}</bdi>
        </span>
        {b ? (
          <div className="w-full max-w-[340px]" role="img" aria-label={`${stateWords(v, lang)}. ${say(C.legend, lang)}`}>
            <div className="relative flex justify-center" style={{ height: 36 }}>
              <div style={{ position: "absolute", top: 14, width: "calc(100% - 32px)", height: 3, borderRadius: 2, background: INK.soft, transform: `rotate(${deg}deg)`, transition: `transform 240ms ${EASE}`, animation: shaking ? `beamShake 320ms ${EASE}` : undefined }} />
              <div style={{ position: "absolute", top: 16, width: 3, height: 20, borderRadius: 2, background: INK.faint }} />
            </div>
            <div className="flex justify-between" style={{ padding: "0 8px" }} dir="ltr">
              <div className="contents">
                <div style={{ width: "46%", transform: `translateY(${-lift}px)`, transition: `transform 240ms ${EASE}` }} className="flex justify-center">
                  {pan(rtl ? b.right : b.left)}
                </div>
                <div style={{ width: "46%", transform: `translateY(${lift}px)`, transition: `transform 240ms ${EASE}` }} className="flex justify-center">
                  {pan(rtl ? b.left : b.right)}
                </div>
              </div>
            </div>
          </div>
        ) : null}
        {latest ? <span style={{ ...STEP.label, color: INK.down }}>{say(C.reasonChanged, lang)}</span> : null}
        <span style={{ ...STEP.meta, color: INK.muted }}>{say(C.legend, lang)}</span>
      </section>

      {v.seal ? (
        <section className="mb-3 flex flex-col" style={{ background: INK.surfaceHi, borderRadius: 17, padding: 16, gap: 8 }}>
          <div className="flex items-center" style={{ gap: 12 }}>
            <span className="flex items-center justify-center rounded-full" style={{ width: 32, height: 32, background: v.state === "cracked" ? "transparent" : INK.pick, border: v.state === "cracked" ? `1.5px solid ${INK.down}` : undefined, color: v.state === "cracked" ? INK.down : INK.bg }} aria-hidden>
              ✓
            </span>
            <div className="flex flex-col" style={{ gap: 2 }}>
              <span style={{ ...STEP.label, color: INK.muted }}>{v.seal.why ? say(C.why, lang) : say(decided(v.seal.name), lang)}</span>
              {v.seal.why ? (
                <span style={STEP.title}>
                  <bdi dir={dirOf(v.seal.why)}>{v.seal.why}</bdi>
                </span>
              ) : null}
            </div>
          </div>
          {v.seal.reasons.length ? <span style={{ ...STEP.meta, color: INK.muted }}>{`${say(C.restingOn, lang)}: ${listOf(v.seal.reasons.map((r) => r.text))}`}</span> : null}
          {v.cracks.map((c) => (
            <div key={c.point} className="flex flex-col" style={{ gap: 2, paddingTop: 8, borderTop: `0.5px solid ${INK.line}` }}>
              <span style={{ ...STEP.label, color: INK.down }}>{`${say(C.reasonChanged, lang)}: ${c.text}`}</span>
              <span style={STEP.body}>
                <bdi dir={dirOf(c.fact)}>{c.fact}</bdi>
              </span>
              {c.from?.label ? <span style={{ ...STEP.meta, color: INK.muted }}>{c.from.label}</span> : null}
            </div>
          ))}
          {v.seal.leansAway ? <span style={{ ...STEP.meta, color: INK.muted }}>{say(C.leansAway, lang)}</span> : null}
        </section>
      ) : null}

      {v.factLabels.length ? (
        <Section title={say(C.sideBySide, lang)}>
          <div className="flex flex-col" style={{ padding: "0 16px 12px", gap: 8 }}>
            <div className="flex" style={{ gap: 12 }}>
              {v.options.map((o) => (
                <span key={o.id} className="flex-1" style={STEP.label}>
                  <bdi dir={dirOf(o.name)}>{o.name}</bdi>
                </span>
              ))}
            </div>
            {v.factLabels.map((label) => (
              <div key={label} className="flex flex-col" style={{ gap: 4, borderTop: `0.5px solid ${INK.line}`, paddingTop: 8 }}>
                <span style={{ ...STEP.meta, color: INK.muted }}>
                  <bdi dir={dirOf(label)}>{label}</bdi>
                </span>
                <div className="flex" style={{ gap: 12 }}>
                  {v.options.map((o) => {
                    const value = o.facts.find((f) => f.label.toLowerCase() === label.toLowerCase())?.value ?? "";
                    // A fact reads in its own letters' direction: "12 min" stays "12 min" on an Arabic page.
                    return (
                      <span key={o.id} className="flex-1" style={{ ...STEP.body, fontWeight: 500 }}>
                        <bdi dir={dirOf(value)}>{value}</bdi>
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {v.options.map((o) => (
        <Section key={o.id} title={`${o.name}${o.sealed ? ` · ${say(C.chosen, lang)}` : o.lead ? ` · ${say(C.lead, lang)}` : ""}`}>
          {(["for", "against"] as const).map((side) => {
            const list = side === "for" ? o.for : o.against;
            if (!list.length) return null;
            return (
              <div key={side}>
                <p style={{ ...STEP.meta, color: INK.muted, padding: "8px 16px 2px" }}>{`${say(side === "for" ? C.forSide : C.againstSide, lang)} · ${side === "for" ? o.forWeight : o.againstWeight}`}</p>
                {list.map((p, i) => {
                  const weight: Dot[] = [1, 2, 3].map((n) => ({ on: !p.cracked && n <= p.weight, tint: p.by ? tintOf(p.by.name) : INK.fg }));
                  return (
                    <div key={p.id}>
                      {i === 0 ? null : <div style={{ height: 0.5, background: INK.line, marginInlineStart: 16 }} />}
                      <div className="flex items-center" style={{ gap: 10, padding: "10px 16px", minHeight: 48 }}>
                        <div className="flex min-w-0 flex-1 flex-col" style={{ gap: 2 }}>
                          <span style={{ ...STEP.body, color: p.cracked ? INK.muted : INK.fg, textDecoration: p.cracked ? "line-through" : undefined }}>
                            <bdi dir={dirOf(p.text)}>{p.text}</bdi>
                          </span>
                          {p.cracked ? (
                            <span style={{ ...STEP.meta, color: INK.down }}>
                              <bdi dir={dirOf(p.cracked.fact)}>{p.cracked.fact}</bdi>
                            </span>
                          ) : null}
                          {p.from?.label || p.by ? <span style={{ ...STEP.meta, color: INK.muted }}>{[p.from?.label, p.by?.name].filter(Boolean).join(" · ")}</span> : null}
                        </div>
                        {p.by ? <Face name={p.by.name} size={22} /> : null}
                        {/* A partner weighs their own points again here; anyone else's weight is read only. */}
                        {p.by && p.by.id === page.you && !p.cracked && can("edit") ? (
                          <Weigh value={p.weight} tint={tintOf(p.by.name)} lang={lang} disabled={busy} onPick={(n) => void (n !== p.weight && act("edit", { point: p.id, weight: n }))} />
                        ) : (
                          <DotLine dots={weight} dot={6} gap={3} label={say(weightOf(p.weight), lang)} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </Section>
      ))}
      {can("point") && v.options.length ? <AddPoint v={v} lang={lang} act={act} busy={busy} /> : null}
      <style>{`@keyframes beamShake { 0% { translate: 0 0; } 25% { rotate: 2deg; } 50% { rotate: -2deg; } 75% { rotate: 2deg; } 100% { rotate: 0deg; } } @media (prefers-reduced-motion: reduce) { div { animation: none !important; transition: none !important; } }`}</style>
    </div>
  );
};

/** How much a point matters, as three dots to tap: the first n filled in its author's tint. */
function Weigh({ value, onPick, tint, lang, disabled }: { value: number; onPick: (n: 1 | 2 | 3) => void; tint: string; lang: "en" | "ar"; disabled?: boolean }) {
  return (
    <span className="flex items-center" role="radiogroup" aria-label={say(C.matters, lang)}>
      {([1, 2, 3] as const).map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={say(weightWords(n), lang)}
          disabled={disabled}
          onClick={() => onPick(n)}
          className="flex items-center justify-center"
          style={{ width: 24, height: 32 }}
        >
          <span className="rounded-full" style={{ width: 8, height: 8, background: n <= value ? tint : "transparent", border: `1.5px solid ${n <= value ? tint : INK.faint}`, transition: `background 150ms ${EASE}, border-color 150ms ${EASE}` }} />
        </button>
      ))}
    </span>
  );
}

/** A choice among a few, as the page's chips: the chosen one filled. */
function Chip({ on, text, onClick }: { on: boolean; text: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className="rounded-full transition-transform active:scale-[0.97]"
      style={{ ...STEP.label, fontWeight: 600, padding: "0 14px", height: 34, background: on ? INK.fg : INK.surfaceHi, color: on ? INK.bg : INK.fg, transition: `background 150ms ${EASE}, color 150ms ${EASE}` }}
    >
      <bdi dir={dirOf(text)}>{text}</bdi>
    </button>
  );
}

/**
 * A partner's own point, from the page: which option (when there is more
 * than one), for or against, a few words, and how much it matters (2 unless
 * they say). It goes in as theirs, in their color; the balance moves when it
 * lands.
 */
function AddPoint({ v, lang, act, busy }: { v: DecideView; lang: "en" | "ar"; act: PageProps["act"]; busy: boolean }) {
  const [option, setOption] = useState<string | null>(null);
  const [side, setSide] = useState<"for" | "against">("for");
  const [weight, setWeight] = useState<1 | 2 | 3>(2);
  const [text, setText] = useState("");
  const chosen = v.options.length === 1 ? v.options[0].id : v.options.some((o) => o.id === option) ? option : null;
  const ready = !!chosen && !!text.trim() && !busy;
  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!ready) return;
    if (await act("point", { option: chosen, side, text: text.trim(), weight })) {
      setText("");
      setWeight(2);
    }
  };
  return (
    <Section title={say(C.yourPoint, lang)}>
      <form onSubmit={(e) => void send(e)} className="flex flex-col" style={{ padding: "8px 16px 16px", gap: 12 }}>
        {v.options.length > 1 ? (
          <div className="flex flex-wrap" style={{ gap: 6 }} role="radiogroup" aria-label={say(C.on, lang)}>
            {v.options.map((o) => (
              <Chip key={o.id} on={chosen === o.id} text={o.name} onClick={() => setOption(o.id)} />
            ))}
          </div>
        ) : null}
        <div className="flex" style={{ gap: 6 }} role="radiogroup" aria-label={say(C.side, lang)}>
          <Chip on={side === "for"} text={say(C.forSide, lang)} onClick={() => setSide("for")} />
          <Chip on={side === "against"} text={say(C.againstSide, lang)} onClick={() => setSide("against")} />
        </div>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={140}
          dir="auto"
          enterKeyHint="send"
          placeholder={say(C.placeholder, lang)}
          aria-label={say(C.placeholder, lang)}
          className="w-full outline-none placeholder:opacity-60"
          style={{ ...STEP.body, height: 44, borderRadius: 11, padding: "0 12px", background: INK.surfaceHi, color: INK.fg, border: "none" }}
        />
        <div className="flex items-center justify-between" style={{ gap: 12 }}>
          <span className="flex items-center" style={{ gap: 8 }}>
            <span style={{ ...STEP.meta, color: INK.muted }}>{say(weightWords(weight), lang)}</span>
            <Weigh value={weight} onPick={setWeight} tint={INK.fg} lang={lang} />
          </span>
          <Pill text={say(C.add, lang)} strong disabled={!ready} onClick={() => void send()} />
        </div>
      </form>
    </Section>
  );
}

