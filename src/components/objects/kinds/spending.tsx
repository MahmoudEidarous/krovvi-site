"use client";

/**
 * Spending on the page: a partner adds what they spent and ticks a bill
 * here with no app. Drawn as the app draws its screen (catch8
 * src/components/objects/kinds/spending): what is really free as the point
 * (the bills still due are held back first), the jar of a hundred dots (each
 * one percent of the budget: free filled, held for a bill a ring, spent
 * gone), the month's days, the bills, where it went and every spend. Past the
 * budget is said plainly, never in red. Someone who only watches sees it all
 * without the words of anyone else's spends, and with no buttons.
 *
 * A tick answers at once: a bill ticked shows paid before the server says
 * yes, and goes back if it did not go through.
 */

import { useEffect, useState } from "react";

import { say, type Words } from "@/lib/objects";
import { EASE, Face, INK, Money, Pill, Row, Section, STEP, Tick } from "../kit";
import type { KindPage } from "../types";

/** Phrases said as one line in the reader's language: "a, b" in English, "a، b" in Arabic. */
const list = (parts: Array<string | null | undefined | false>, lang: "en" | "ar"): string => parts.filter(Boolean).join(lang === "ar" ? "، " : ", ");

/** The view as the core sends it (catch8 supabase/functions/_shared/objects/kinds/spending.ts SpendingView). */
interface Bill {
  id: string;
  name: string;
  emoji: string;
  amount: number;
  status: "paid" | "due" | "late";
  words: Words;
  paid: { amount: number; byName: Words } | null;
}
interface SpendingView {
  currency: string;
  budget: number;
  period: { left: number; words: Words };
  left: number;
  pace: number;
  words: { left: Words; perDay: Words | null; spent: Words };
  jar: { full: number; held: number; legend: Words };
  days: Array<{ day: string; spent: number; none: boolean; today: boolean; future: boolean }>;
  quiet: number;
  cats: Array<{ cat: string; emoji: string; name: Words; amount: number }>;
  list: Array<{ id: string; what: string; amount: number; refund: boolean; emoji: string; dayWords: Words; byName: Words }>;
  bills: Bill[];
  people: Array<{ id: string; name: string; you: boolean; amount: number }>;
  last: { words: Words } | null;
}

const C = {
  left: { en: "left", ar: "فاضل" },
  past: { en: "past the budget", ar: "زيادة عن الميزانية" },
  daysLeft: { en: "days left", ar: "يوم فاضل" },
  daysLeftFew: { en: "days left", ar: "أيام فاضلة" },
  lastDay: { en: "Last day", ar: "آخر يوم" },
  thisMonth: { en: "This month", ar: "الشهر ده" },
  strip: { en: "Each dot is a day: brighter is more spent, a ring is a day with nothing spent", ar: "كل نقطة يوم: الأفتح صرف أكتر، والدايرة يوم من غير مصاريف" },
  quietOne: { en: "1 day with nothing spent", ar: "يوم واحد من غير مصاريف" },
  quietMany: { en: "days with nothing spent", ar: "أيام من غير مصاريف" },
  lastMonth: { en: "Last month", ar: "الشهر اللي فات" },
  bills: { en: "Bills", ar: "الفواتير" },
  paidWord: { en: "Paid", ar: "اتدفعت" },
  where: { en: "Where it went", ar: "راحت فين" },
  spends: { en: "Spends", ar: "المصاريف" },
  people: { en: "Who spent", ar: "مين صرف" },
  add: { en: "Add a spend", ar: "ضيف مصروف" },
  what: { en: "What was it?", ar: "صرفت على إيه؟" },
  amount: { en: "Amount", ar: "المبلغ" },
  addButton: { en: "Add", ar: "ضيف" },
  back: { en: "back", ar: "مرتجع" },
  nothing: { en: "Nothing spent yet", ar: "لسه مفيش مصاريف" },
  you: { en: "you", ar: "إنت" },
} satisfies Record<string, Words>;

const CATS: Array<[string, string, Words]> = [
  ["groceries", "🛒", { en: "Groceries", ar: "بقالة" }],
  ["eating", "🍽️", { en: "Eating out", ar: "أكل برا" }],
  ["transport", "🚕", { en: "Getting around", ar: "مواصلات" }],
  ["home", "🏠", { en: "Home", ar: "البيت" }],
  ["shopping", "🛍️", { en: "Shopping", ar: "شوبينج" }],
  ["fun", "🎟️", { en: "Going out", ar: "خروج" }],
  ["health", "💊", { en: "Health", ar: "صحة" }],
  ["other", "📦", { en: "Other", ar: "حاجات تانية" }],
];

/** The jar's hundred dots: a body of eight rows of eleven under a neck of two rows of six, filled from the bottom (the app's Jar). */
function Jar({ full, held, pace, budget, dot = 14, gap = 8 }: { full: number; held: number; pace: number; budget: number; dot?: number; gap?: number }) {
  const pitch = dot + gap;
  const at: Array<{ x: number; y: number }> = [];
  for (let row = 0; row < 8; row += 1) for (let col = 0; col < 11; col += 1) at.push({ x: col * pitch, y: (9 - row) * pitch });
  const inset = ((11 - 6) / 2) * pitch;
  for (let row = 8; row < 10; row += 1) for (let col = 0; col < 6; col += 1) at.push({ x: inset + col * pitch, y: (9 - row) * pitch });
  const paceDots = Math.max(0, Math.min(100, Math.round((pace / budget) * 100)));
  const paceRow = paceDots >= 88 ? 8 + Math.floor((paceDots - 88) / 6) : Math.floor(paceDots / 11);
  return (
    <div dir="ltr" style={{ position: "relative", width: 11 * pitch - gap + 10, height: 10 * pitch - gap }} aria-hidden>
      {at.map((p, i) => {
        const state = i < full ? "full" : i < full + held ? "held" : "gone";
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              left: 10 + p.x,
              top: p.y,
              width: dot,
              height: dot,
              borderRadius: "50%",
              boxSizing: "border-box",
              background: state === "full" ? INK.fg : state === "gone" ? INK.track : "transparent",
              border: state === "held" ? `1.5px solid ${INK.soft}` : "none",
              opacity: state === "gone" ? 0.6 : 1,
              transform: `scale(${state === "gone" ? 0.7 : 1})`,
              transition: `background-color 260ms ${EASE} ${(99 - i) * 2}ms, opacity 260ms ${EASE}, transform 260ms ${EASE}`,
            }}
          />
        );
      })}
      <span style={{ position: "absolute", left: paceRow >= 8 ? inset : 0, top: (9 - Math.min(9, paceRow)) * pitch + dot / 2 - 1, width: 7, height: 2, borderRadius: 1, background: INK.pick }} />
    </div>
  );
}

export const Page: KindPage = ({ page, view, lang, act, can, busy }) => {
  const v = view as SpendingView;
  const [ticked, setTicked] = useState<Record<string, boolean>>({});
  const [what, setWhat] = useState("");
  const [amount, setAmount] = useState("");
  const [cat, setCat] = useState("other");
  useEffect(() => setTicked({}), [page.version]);
  const me = page.members.find((m) => m.you) ?? null;

  const tick = async (b: Bill) => {
    const now = ticked[b.id] ?? b.status === "paid";
    setTicked((s) => ({ ...s, [b.id]: !now }));
    const ok = await act(now ? "unpay" : "pay", { bill: b.id });
    if (!ok)
      setTicked((s) => {
        const copy = { ...s };
        delete copy[b.id];
        return copy;
      });
  };
  const add = async () => {
    const n = Number(amount.replace(",", "."));
    if (!what.trim() || !Number.isFinite(n) || n <= 0) return;
    if (await act("spend", { what: what.trim(), amount: n, cat })) {
      setWhat("");
      setAmount("");
    }
  };

  const over = v.left < 0;
  const n = v.period.left;
  const month = list([say(v.period.words, lang), n === 1 ? say(C.lastDay, lang) : `${n} ${say(n <= 10 ? C.daysLeftFew : C.daysLeft, lang)}`], lang);
  const most = Math.max(1, ...v.days.map((d) => d.spent));
  return (
    <div>
      <section className="mb-3 flex flex-col items-center" style={{ background: INK.surface, borderRadius: 17, padding: "24px 16px 18px", gap: 6 }}>
        <span className="inline-flex items-baseline" dir="ltr" style={{ gap: 6 }}>
          <Money minor={Math.abs(v.left)} currency={v.currency} lang={lang} step="display" />
          <span style={{ ...STEP.title, color: INK.muted }}>{say(over ? C.past : C.left, lang)}</span>
        </span>
        {v.words.perDay ? <span style={{ ...STEP.title, color: INK.soft }}>{say(v.words.perDay, lang)}</span> : null}
        <span style={{ ...STEP.meta, color: INK.muted }}>{month}</span>
        <div style={{ padding: "14px 0" }}>
          <Jar full={v.jar.full} held={v.jar.held} pace={v.pace} budget={v.budget} />
        </div>
        <span style={{ ...STEP.meta, color: INK.muted }}>{say(v.jar.legend, lang)}</span>
      </section>

      <Section title={say(C.thisMonth, lang)}>
        <div className="flex flex-wrap" style={{ gap: 5, padding: "6px 16px 0" }} aria-label={`${v.quiet} ${say(v.quiet === 1 ? C.quietOne : C.quietMany, lang)}`}>
          {v.days.map((d) => {
            const s = d.today ? 11 : 9;
            return (
              <span key={d.day} className="flex items-center justify-center" style={{ width: 11, height: 11 }}>
                <span
                  style={{
                    width: s,
                    height: s,
                    borderRadius: "50%",
                    boxSizing: "border-box",
                    background: d.future ? INK.track : d.spent ? INK.fg : "transparent",
                    opacity: d.future ? 0.6 : d.spent ? 0.35 + 0.65 * (d.spent / most) : 1,
                    border: d.none || (d.today && !d.spent) ? `1.5px solid ${d.today ? INK.fg : INK.faint}` : "none",
                  }}
                />
              </span>
            );
          })}
        </div>
        <p style={{ ...STEP.meta, color: INK.muted, padding: "10px 16px 4px" }}>
          {`${list([say(v.words.spent, lang), v.quiet > 0 && (v.quiet === 1 ? say(C.quietOne, lang) : `${v.quiet} ${say(C.quietMany, lang)}`)], lang)}${v.last ? `. ${say(C.lastMonth, lang)}: ${say(v.last.words, lang)}` : ""}`}
        </p>
        <p style={{ ...STEP.meta, color: INK.muted, padding: "0 16px 12px" }}>{say(C.strip, lang)}</p>
      </Section>

      {v.bills.length ? (
        <Section title={say(C.bills, lang)}>
          {v.bills.map((b, i) => {
            const paid = ticked[b.id] ?? b.status === "paid";
            return (
              <Row
                key={b.id}
                first={i === 0}
                lead={<Tick done={paid} by={paid && ticked[b.id] ? me?.name : null} label={b.name} onClick={can("pay") && !busy ? () => void tick(b) : undefined} />}
                title={`${b.emoji} ${b.name}`}
                sub={paid && ticked[b.id] !== undefined ? say(C.paidWord, lang) : say(b.words, lang)}
                muted={paid}
                value={<Money minor={b.paid ? b.paid.amount : b.amount} currency={v.currency} lang={lang} step="body" color={paid ? INK.muted : INK.fg} />}
              />
            );
          })}
        </Section>
      ) : null}

      {can("spend") ? (
        <Section title={say(C.add, lang)}>
          <form
            className="flex flex-wrap items-center"
            style={{ gap: 8, padding: "6px 12px 8px" }}
            onSubmit={(e) => {
              e.preventDefault();
              void add();
            }}
          >
            <input value={what} onChange={(e) => setWhat(e.target.value)} maxLength={60} placeholder={say(C.what, lang)} aria-label={say(C.what, lang)} className="min-w-0 flex-[2] rounded-2xl outline-none" style={{ ...STEP.body, background: INK.surfaceHi, color: INK.fg, padding: "12px 14px", minWidth: 140 }} />
            <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))} inputMode="decimal" placeholder={say(C.amount, lang)} aria-label={say(C.amount, lang)} className="min-w-0 flex-1 rounded-2xl outline-none" style={{ ...STEP.body, background: INK.surfaceHi, color: INK.fg, padding: "12px 14px", minWidth: 90 }} />
            <Pill text={say(C.addButton, lang)} strong disabled={busy || !what.trim() || !amount} onClick={() => void add()} />
          </form>
          <div className="flex flex-wrap" style={{ gap: 6, padding: "0 12px 12px" }}>
            {CATS.map(([key, emoji, name]) => (
              <button
                key={key}
                type="button"
                aria-pressed={cat === key}
                onClick={() => setCat(key)}
                className="rounded-full"
                style={{ ...STEP.meta, padding: "6px 10px", background: cat === key ? INK.fg : INK.surfaceHi, color: cat === key ? INK.bg : INK.fg, transition: `background-color 150ms ${EASE}, color 150ms ${EASE}` }}
              >
                {`${emoji} ${say(name, lang)}`}
              </button>
            ))}
          </div>
        </Section>
      ) : null}

      {v.cats.length ? (
        <Section title={say(C.where, lang)}>
          {v.cats.map((c, i) => (
            <Row key={c.cat} first={i === 0} lead={<span style={{ fontSize: 20 }} aria-hidden>{c.emoji}</span>} title={say(c.name, lang)} value={<Money minor={c.amount} currency={v.currency} lang={lang} step="body" />} />
          ))}
        </Section>
      ) : null}

      <Section title={say(C.spends, lang)}>
        {v.list.length ? (
          v.list.slice(0, 60).map((x, i) => (
            <Row
              key={x.id}
              first={i === 0}
              lead={<span style={{ fontSize: 20 }} aria-hidden>{x.emoji}</span>}
              title={x.refund ? `${x.what} (${say(C.back, lang)})` : x.what}
              sub={list([say(x.byName, lang), say(x.dayWords, lang)], lang)}
              value={<Money minor={x.amount} currency={v.currency} lang={lang} step="body" color={x.refund ? INK.soft : INK.fg} sign={x.refund} />}
            />
          ))
        ) : (
          <Row first title={say(C.nothing, lang)} muted />
        )}
      </Section>

      {v.people.length > 1 ? (
        <Section title={say(C.people, lang)}>
          {v.people.map((p, i) => (
            <Row key={p.id} first={i === 0} lead={<Face name={p.name} size={28} />} title={p.you ? `${p.name} (${say(C.you, lang)})` : p.name} value={<Money minor={p.amount} currency={v.currency} lang={lang} step="body" />} />
          ))}
        </Section>
      ) : null}
    </div>
  );
};
