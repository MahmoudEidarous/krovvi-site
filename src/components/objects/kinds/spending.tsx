"use client";

/**
 * Spending on the page: a partner adds what they spent and ticks a bill
 * here with no app. Drawn as the app draws its screen (catch8
 * src/components/objects/kinds/spending): what is really free as the point
 * (the bills still due are held back first), the month as one bar (spent,
 * held for bills, free) with its parts said under it, the bills, where it
 * went and every spend, each with its category's mark. Past the budget is
 * said plainly, never in red. Someone who only watches sees it all
 * without the words of anyone else's spends, and with no buttons.
 *
 * A tick answers at once: a bill ticked shows paid before the server says
 * yes, and goes back if it did not go through.
 */

import { useEffect, useState } from "react";

import { say, type Words } from "@/lib/objects";
import { EASE, Face, INK, Money, Pill, Row, Section, STEP, Tick } from "../kit";
import { Mark, isMark, type MarkName } from "../mark";
import type { KindPage } from "../types";

/** Phrases said as one line in the reader's language: "a, b" in English, "a، b" in Arabic. */
const list = (parts: Array<string | null | undefined | false>, lang: "en" | "ar"): string => parts.filter(Boolean).join(lang === "ar" ? "، " : ", ");

/** The view as the core sends it (catch8 supabase/functions/_shared/objects/kinds/spending.ts SpendingView). */
interface Bill {
  id: string;
  name: string;
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
  jar: { full: number; held: number; gone: number };
  spent: number;
  due: number;
  days: Array<{ day: string; spent: number; none: boolean; today: boolean; future: boolean }>;
  quiet: number;
  cats: Array<{ cat: string; mark: string; name: Words; amount: number }>;
  list: Array<{ id: string; what: string; amount: number; refund: boolean; mark: string; dayWords: Words; byName: Words }>;
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
  spent: { en: "Spent", ar: "اتصرف" },
  billsDue: { en: "Bills to pay", ar: "فواتير جاية" },
  budget: { en: "Budget", ar: "الميزانية" },
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

const CATS: Array<[string, MarkName, Words]> = [
  ["groceries", "cart", { en: "Groceries", ar: "بقالة" }],
  ["eating", "utensils", { en: "Eating out", ar: "أكل برا" }],
  ["transport", "car", { en: "Getting around", ar: "مواصلات" }],
  ["home", "house", { en: "Home", ar: "البيت" }],
  ["bills", "receipt", { en: "Bills", ar: "فواتير" }],
  ["shopping", "bag", { en: "Shopping", ar: "شوبينج" }],
  ["fun", "ticket", { en: "Going out", ar: "خروج" }],
  ["health", "heart", { en: "Health", ar: "صحة" }],
  ["travel", "plane", { en: "Travel", ar: "سفر" }],
  ["gifts", "gift", { en: "Gifts", ar: "هدايا" }],
  ["other", "tag", { en: "Other", ar: "حاجات تانية" }],
];

/** A category's mark in its coin: the lead of a spend or a category row. */
function Coin({ mark }: { mark: string }) {
  return (
    <span className="flex items-center justify-center" style={{ width: 30, height: 30, borderRadius: 9, background: INK.surfaceHi }} aria-hidden>
      <Mark name={isMark(mark) ? mark : "tag"} size={16} color={INK.soft} />
    </span>
  );
}

/** The month as one bar: spent fills it in ivory, what is held for bills follows in the soft ink, the free part is the track. */
function Bar({ v }: { v: SpendingView }) {
  const spent = Math.max(0, Math.min(100, v.jar.gone));
  const held = Math.max(0, Math.min(100 - spent, v.jar.held));
  return (
    <div className="flex overflow-hidden" style={{ height: 10, borderRadius: 5, background: INK.track }} aria-hidden>
      <span style={{ width: `${spent}%`, background: INK.fg, transition: `width 320ms ${EASE}` }} />
      {held ? <span style={{ width: `${held}%`, background: INK.soft, transition: `width 320ms ${EASE}` }} /> : null}
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
  return (
    <div>
      <section className="mb-3 flex flex-col items-center" style={{ background: INK.surface, borderRadius: 17, padding: "24px 16px 18px", gap: 6 }}>
        <span className="inline-flex items-baseline" dir="ltr" style={{ gap: 6 }}>
          <Money minor={Math.abs(v.left)} currency={v.currency} lang={lang} step="display" />
          <span style={{ ...STEP.title, color: INK.muted }}>{say(over ? C.past : C.left, lang)}</span>
        </span>
        {v.words.perDay ? <span style={{ ...STEP.title, color: INK.soft }}>{say(v.words.perDay, lang)}</span> : null}
        <span style={{ ...STEP.meta, color: INK.muted }}>{month}</span>
        <div className="flex flex-col self-stretch" style={{ gap: 14, paddingTop: 16 }}>
          <Bar v={v} />
          <div className="flex justify-between" style={{ gap: 12 }}>
            {[
              [INK.fg, say(C.spent, lang), v.spent, false],
              ...(v.due ? [[INK.soft, say(C.billsDue, lang), v.due, false]] : []),
              [INK.track, say(C.budget, lang), v.budget, true],
            ].map(([color, label, minor, ring]) => (
              <div key={label as string} className="flex items-start" style={{ gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: 4, marginTop: 4, background: ring ? "transparent" : (color as string), border: ring ? `1.5px solid ${INK.faint}` : "none", boxSizing: "border-box" }} />
                <span className="flex flex-col">
                  <span style={{ ...STEP.meta, color: INK.muted }}>{label as string}</span>
                  <Money minor={minor as number} currency={v.currency} lang={lang} step="body" />
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {v.bills.length ? (
        <Section title={say(C.bills, lang)}>
          {v.bills.map((b, i) => {
            const paid = ticked[b.id] ?? b.status === "paid";
            return (
              <Row
                key={b.id}
                first={i === 0}
                lead={<Tick done={paid} by={paid && ticked[b.id] ? me?.name : null} label={b.name} onClick={can("pay") && !busy ? () => void tick(b) : undefined} />}
                title={b.name}
                sub={paid && ticked[b.id] !== undefined ? say(C.paidWord, lang) : say(b.words, lang)}
                muted={paid}
                value={<Money minor={b.paid ? b.paid.amount : b.amount} currency={v.currency} lang={lang} step="body" color={paid ? INK.muted : b.status === "late" ? INK.warm : INK.fg} />}
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
            {CATS.map(([key, mark, name]) => (
              <button
                key={key}
                type="button"
                aria-pressed={cat === key}
                onClick={() => setCat(key)}
                className="rounded-full"
                style={{ ...STEP.meta, padding: "6px 10px", background: cat === key ? INK.fg : INK.surfaceHi, color: cat === key ? INK.bg : INK.fg, transition: `background-color 150ms ${EASE}, color 150ms ${EASE}` }}
              >
                <span className="inline-flex items-center" style={{ gap: 6 }}>
                  <Mark name={mark} size={14} color={cat === key ? INK.bg : INK.soft} />
                  {say(name, lang)}
                </span>
              </button>
            ))}
          </div>
        </Section>
      ) : null}

      {v.cats.length ? (
        <Section title={say(C.where, lang)}>
          {v.cats.map((c, i) => (
            <Row key={c.cat} first={i === 0} lead={<Coin mark={c.mark} />} title={say(c.name, lang)} sub={v.spent > 0 ? (Math.round((c.amount / v.spent) * 100) >= 1 ? `${Math.round((c.amount / v.spent) * 100)}%` : lang === "ar" ? "أقل من 1%" : "under 1%") : null} value={<Money minor={c.amount} currency={v.currency} lang={lang} step="body" />} />
          ))}
        </Section>
      ) : null}

      <Section title={say(C.spends, lang)}>
        {v.quiet > 0 || v.last ? (
          <p style={{ ...STEP.meta, color: INK.muted, padding: "0 16px 6px" }}>
            {list([v.quiet > 0 && (v.quiet === 1 ? say(C.quietOne, lang) : `${v.quiet} ${say(C.quietMany, lang)}`), v.last ? `${say(C.lastMonth, lang)}: ${say(v.last.words, lang)}` : null], lang)}
          </p>
        ) : null}
        {v.list.length ? (
          v.list.slice(0, 60).map((x, i) => (
            <Row
              key={x.id}
              first={i === 0}
              lead={<Coin mark={x.mark} />}
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
