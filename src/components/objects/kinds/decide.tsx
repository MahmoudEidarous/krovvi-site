"use client";

/**
 * Decide on the page, drawn as the app draws its screen (catch8
 * src/components/objects/kinds/decide): the balance as the hero (a beam that
 * leans toward the heavier pan, each pan holding one dot per point of weight
 * in the tint of whoever made the point), the seal and any reason that
 * cracked since, the options' facts side by side, and each option's points.
 * Nobody seals or cracks from the page; a partner's points arrive in their
 * own color.
 */

import { useEffect, useRef, useState } from "react";

import { say, type Words } from "@/lib/objects";
import { DotLine, EASE, Face, INK, Section, STEP, dirOf, tintOf, type Dot } from "../kit";
import { listOf } from "./meals";
import type { KindPage } from "../types";

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
} satisfies Record<string, Words>;

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

export const Page: KindPage = ({ page, view, lang }) => {
  const v = view as DecideView;
  const rtl = lang === "ar";
  const b = v.balance;
  const nameOf = (id: string | null) => (id ? (page.members.find((m) => m.id === id)?.name ?? "") : "");
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
    const dots: Dot[] = p.dots.map((d) => ({ on: d.cracked ? 0.22 : true, tint: d.by ? tintOf(nameOf(d.by)) : INK.fg }));
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
          <bdi dir={dirOf(stateWords(v, lang))}>{stateWords(v, lang)}</bdi>
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
                <span style={{ ...STEP.meta, color: INK.muted }}>{label}</span>
                <div className="flex" style={{ gap: 12 }}>
                  {v.options.map((o) => (
                    <span key={o.id} className="flex-1" style={{ ...STEP.body, fontWeight: 500 }}>
                      {o.facts.find((f) => f.label.toLowerCase() === label.toLowerCase())?.value ?? ""}
                    </span>
                  ))}
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
                        <DotLine dots={weight} dot={6} gap={3} label={`${p.weight}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </Section>
      ))}
      <style>{`@keyframes beamShake { 0% { translate: 0 0; } 25% { rotate: 2deg; } 50% { rotate: -2deg; } 75% { rotate: 2deg; } 100% { rotate: 0deg; } } @media (prefers-reduced-motion: reduce) { div { animation: none !important; transition: none !important; } }`}</style>
    </div>
  );
};
