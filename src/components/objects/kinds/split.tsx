"use client";

/**
 * Split on the page: friends add what they paid and mark a transfer done
 * here with no app. Drawn as the app draws its screen (catch8
 * src/components/objects/kinds/split): the reader's standing as the point,
 * the faces with dots flowing from whoever pays to whoever gets it (a dot for
 * every so many euros, the legend says how many), the transfers that settle
 * everyone, the balances and every cost. Krovvi never holds or moves money:
 * Paid records what someone says they sent.
 *
 * A tap answers at once: a transfer marked paid leaves the list before the
 * server says yes, and comes back if it did not go through.
 */

import { useEffect, useState } from "react";

import { say, type Words, iso } from "@/lib/objects";
import { EASE, Face, FaceStack, INK, Money, Pill, Row, Section, STEP, moneyParts, tintOf } from "../kit";
import type { KindPage } from "../types";

/** Phrases said as one line in the reader's language: "a, b" in English, "a، b" in Arabic. */
/** Parts joined in the page's language, each isolated so an Arabic name in an English list (or the reverse) keeps its place. */
const list = (parts: Array<string | null | undefined | false>, lang: "en" | "ar"): string => parts.filter((p): p is string => !!p).map(iso).join(lang === "ar" ? "، " : ", ");

/** The view as the core sends it (catch8 supabase/functions/_shared/objects/kinds/split.ts SplitView). */
interface Person {
  id: string;
  name: string;
  you: boolean;
  removed: boolean;
  net: number;
  words: Words;
}
interface Transfer {
  from: string;
  to: string;
  amount: number;
  dots: number;
  words: Words;
  yours: "pay" | "get" | null;
}
interface Expense {
  id: string;
  what: string;
  paidBy: string;
  amount: number;
  payer: Words;
  dayWords: Words;
  yourPart: number;
  original: { words: Words } | null;
}
interface Settlement {
  id: string;
  from: string;
  to: string;
  dayWords: Words;
  words: Words;
}
interface SplitView {
  currency: string;
  total: number;
  totalWords: Words;
  count: number;
  people: Person[];
  transfers: Transfer[];
  square: boolean;
  you: { net: number; words: Words } | null;
  expenses: Expense[];
  settlements: Settlement[];
  dot: { unit: number; words: Words };
}

const C = {
  youGetBack: { en: "You get back", ar: "ليك" },
  youOwe: { en: "You owe", ar: "عليك" },
  spentTotal: { en: "Spent together", ar: "اتصرف مع بعض" },
  square: { en: "All square", ar: "خالصين" },
  nothing: { en: "Nothing spent yet", ar: "لسه مفيش مصاريف" },
  settleOne: { en: "1 transfer settles everyone", ar: "تحويل واحد ويخلص الكل" },
  settleMany: { en: "transfers settle everyone", ar: "تحويلات وتخلصوا كلكم" },
  settleUp: { en: "Settle up", ar: "التسوية" },
  paid: { en: "Mark paid", ar: "اتدفع" },
  getsBack: { en: "Gets back", ar: "ليه" },
  owes: { en: "Owes", ar: "عليه" },
  even: { en: "Square", ar: "خالص" },
  balances: { en: "Balances", ar: "الحسابات" },
  costs: { en: "Expenses", ar: "المصاريف" },
  transfers: { en: "Transfers", ar: "التحويلات" },
  add: { en: "Add what you paid", ar: "ضيف اللي دفعته" },
  what: { en: "What was it?", ar: "دفعت إيه؟" },
  amount: { en: "Amount", ar: "المبلغ" },
  addButton: { en: "Add", ar: "ضيف" },
  forAll: { en: "Shared by everyone", ar: "على الكل بالتساوي" },
  paidBy: { en: "Paid by", ar: "دفع" },
  youPaid: { en: "You paid", ar: "إنت دفعت" },
  yourPart: { en: "your part", ar: "نصيبك" },
  was: { en: "was", ar: "كان" },
  you: { en: "you", ar: "إنت" },
} satisfies Record<string, Words>;

/** An amount in one string for a sub line: "€28" or "28 جنيه". */
const text = (minor: number, currency: string, lang: "en" | "ar") => {
  const p = moneyParts(minor, currency, lang);
  return p.before ? `${p.mark}${p.figure}` : `${p.figure} ${p.mark}`;
};

/** The faces on a circle, the reader at the bottom, and each transfer's dots along a curve from payer to receiver (the app's Flow). */
/** Two decimals: Safari's Math.cos and Math.hypot can differ from the server's in the last digit, so a longer number would not match the server's HTML once the page starts in the browser. */
const px = (n: number) => Math.round(n * 100) / 100;

function Flow({ view, size, hidden }: { view: SplitView; size: number; hidden: Set<string> }) {
  const me = view.people.findIndex((p) => p.you);
  const people = me > 0 ? [...view.people.slice(me), ...view.people.slice(0, me)] : view.people;
  const n = Math.max(1, people.length);
  const face = n > 8 ? 28 : 36;
  const c = size / 2;
  const radius = c - face / 2 - 2;
  const seat = new Map(people.map((p, k) => [p.id, { x: c + radius * Math.cos(Math.PI / 2 + (k * 2 * Math.PI) / n), y: c + radius * Math.sin(Math.PI / 2 + (k * 2 * Math.PI) / n) }]));
  const names = new Map(view.people.map((p) => [p.id, p.name]));
  const dots: Array<{ key: string; x: number; y: number; tint: string; o: number }> = [];
  for (const t of view.transfers) {
    if (hidden.has(`${t.from}>${t.to}`)) continue;
    const a = seat.get(t.from);
    const b = seat.get(t.to);
    if (!a || !b) continue;
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const toC = { x: c - mid.x, y: c - mid.y };
    const far = Math.hypot(toC.x, toC.y);
    const ctrl = far > 8 ? { x: mid.x + toC.x * 0.45, y: mid.y + toC.y * 0.45 } : { x: mid.x + ((b.y - a.y) / len) * len * 0.14, y: mid.y - ((b.x - a.x) / len) * len * 0.14 };
    const from = Math.min(0.45, (face / 2 + 6) / Math.max(1, len));
    for (let i = 0; i < t.dots; i += 1) {
      const s = from + ((1 - 2 * from) * (i + 0.5)) / t.dots;
      dots.push({
        key: `${t.from}>${t.to}:${i}`,
        x: (1 - s) * (1 - s) * a.x + 2 * (1 - s) * s * ctrl.x + s * s * b.x,
        y: (1 - s) * (1 - s) * a.y + 2 * (1 - s) * s * ctrl.y + s * s * b.y,
        tint: tintOf(names.get(t.from) ?? ""),
        o: 0.4 + 0.6 * s,
      });
    }
  }
  const ys = [...seat.values()].map((p) => p.y);
  const top = Math.max(0, Math.min(...ys) - face / 2 - 2);
  const bottom = Math.min(size, Math.max(...ys) + face / 2 + 2);
  return (
    <div dir="ltr" style={{ position: "relative", width: size, height: px(bottom - top) }} aria-hidden>
      {dots.map((d) => (
        <span key={d.key} style={{ position: "absolute", left: px(d.x - 3.5), top: px(d.y - 3.5 - top), width: 7, height: 7, borderRadius: "50%", background: d.tint, opacity: px(d.o), transition: `left 320ms ${EASE}, top 320ms ${EASE}, opacity 320ms ${EASE}` }} />
      ))}
      {people.map((p) => {
        const at = seat.get(p.id)!;
        return (
          <span key={p.id} style={{ position: "absolute", left: px(at.x - face / 2), top: px(at.y - face / 2 - top), opacity: p.removed ? 0.5 : 1, lineHeight: 0 }}>
            <Face name={p.name} size={face} />
          </span>
        );
      })}
    </div>
  );
}

export const Page: KindPage = ({ page, view, lang, act, can, busy }) => {
  const v = view as SplitView;
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [what, setWhat] = useState("");
  const [amount, setAmount] = useState("");
  useEffect(() => setHidden(new Set()), [page.version]);
  const names = new Map(v.people.map((p) => [p.id, p.name]));
  const transfers = v.transfers.filter((t) => !hidden.has(`${t.from}>${t.to}`));

  const settle = async (t: Transfer) => {
    const key = `${t.from}>${t.to}`;
    setHidden((s) => new Set(s).add(key));
    const ok = await act("settle", { from: t.from, to: t.to });
    if (!ok)
      setHidden((s) => {
        const copy = new Set(s);
        copy.delete(key);
        return copy;
      });
  };
  const add = async () => {
    const n = Number(amount.replace(",", "."));
    if (!what.trim() || !Number.isFinite(n) || n <= 0) return;
    if (await act("add", { what: what.trim(), amount: n })) {
      setWhat("");
      setAmount("");
    }
  };

  const net = v.you?.net ?? 0;
  const settleWords = transfers.length === 1 ? say(C.settleOne, lang) : `${transfers.length} ${say(C.settleMany, lang)}`;
  return (
    <div>
      <section className="mb-3 flex flex-col items-center" style={{ background: INK.surface, borderRadius: 17, padding: "24px 16px 18px", gap: 6 }}>
        {v.you && net ? (
          <>
            <span style={{ ...STEP.label, color: INK.muted }}>{say(net > 0 ? C.youGetBack : C.youOwe, lang)}</span>
            <Money minor={Math.abs(net)} currency={v.currency} lang={lang} step="display" />
          </>
        ) : !v.you && v.count && !v.square ? (
          <>
            <span style={{ ...STEP.label, color: INK.muted }}>{say(C.spentTotal, lang)}</span>
            <Money minor={v.total} currency={v.currency} lang={lang} step="display" />
          </>
        ) : (
          <span style={{ ...STEP.display }}>{say(v.count ? C.square : C.nothing, lang)}</span>
        )}
        <span style={{ ...STEP.label, color: INK.muted }}>{transfers.length ? settleWords : v.count ? `${say(v.totalWords, lang)}` : " "}</span>
        <div style={{ padding: "8px 0 4px" }}>
          <Flow view={v} size={276} hidden={hidden} />
        </div>
      </section>

      {transfers.length ? (
        <Section title={say(C.settleUp, lang)}>
          {transfers.map((t, i) => (
            <Row
              key={`${t.from}>${t.to}`}
              first={i === 0}
              lead={<FaceStack names={[names.get(t.from) ?? "", names.get(t.to) ?? ""]} size={24} max={2} />}
              title={say(t.words, lang)}
              value={can("settle") && t.yours ? <Pill text={say(C.paid, lang)} disabled={busy} onClick={() => void settle(t)} /> : undefined}
            />
          ))}
        </Section>
      ) : null}

      {can("add") ? (
        <Section title={say(C.add, lang)}>
          <form
            className="flex flex-wrap items-center"
            style={{ gap: 8, padding: "6px 12px 6px" }}
            onSubmit={(e) => {
              e.preventDefault();
              void add();
            }}
          >
            <input value={what} onChange={(e) => setWhat(e.target.value)} maxLength={60} placeholder={say(C.what, lang)} aria-label={say(C.what, lang)} className="min-w-0 flex-[2] rounded-2xl outline-none" style={{ ...STEP.body, background: INK.surfaceHi, color: INK.fg, padding: "12px 14px", minWidth: 140 }} />
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))}
              inputMode="decimal"
              placeholder={say(C.amount, lang)}
              aria-label={say(C.amount, lang)}
              className="min-w-0 flex-1 rounded-2xl outline-none"
              style={{ ...STEP.body, background: INK.surfaceHi, color: INK.fg, padding: "12px 14px", minWidth: 90 }}
            />
            <Pill text={say(C.addButton, lang)} strong disabled={busy || !what.trim() || !amount} onClick={() => void add()} />
          </form>
          <p style={{ ...STEP.meta, color: INK.muted, padding: "2px 16px 12px" }}>{say(C.forAll, lang)}</p>
        </Section>
      ) : null}

      {v.people.length ? (
        <Section title={say(C.balances, lang)}>
          {v.people.map((p, i) => (
            <Row
              key={p.id}
              first={i === 0}
              lead={<Face name={p.name} size={28} />}
              title={p.you ? `${iso(p.name)} (${say(C.you, lang)})` : p.name}
              sub={say(p.net > 0 ? C.getsBack : p.net < 0 ? C.owes : C.even, lang)}
              muted={p.removed}
              value={p.net ? <Money minor={Math.abs(p.net)} currency={v.currency} lang={lang} step="body" color={p.net > 0 ? INK.fg : INK.soft} /> : undefined}
            />
          ))}
        </Section>
      ) : null}

      {v.expenses.length ? (
        <Section title={say(C.costs, lang)}>
          {v.expenses.slice(0, 60).map((e, i) => {
            const who = e.payer.en === "You" ? say(C.youPaid, lang) : `${say(C.paidBy, lang)} ${say(e.payer, lang)}`;
            const part = e.yourPart ? `${say(C.yourPart, lang)} ${text(e.yourPart, v.currency, lang)}` : null;
            return (
              <Row
                key={e.id}
                first={i === 0}
                lead={<Face name={names.get(e.paidBy) ?? say(e.payer, lang)} size={28} />}
                title={e.what}
                sub={list([who, say(e.dayWords, lang), part, e.original && `${say(C.was, lang)} ${say(e.original.words, lang)}`], lang)}
                value={<Money minor={e.amount} currency={v.currency} lang={lang} step="body" />}
              />
            );
          })}
        </Section>
      ) : null}

      {v.settlements.length ? (
        <Section title={say(C.transfers, lang)}>
          {v.settlements.map((t, i) => (
            <Row key={t.id} first={i === 0} lead={<FaceStack names={[names.get(t.from) ?? "", names.get(t.to) ?? ""]} size={22} max={2} />} title={say(t.words, lang)} sub={say(t.dayWords, lang)} />
          ))}
        </Section>
      ) : null}
    </div>
  );
};
