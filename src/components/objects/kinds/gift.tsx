"use client";

/**
 * Gift on the page: friends chip in here with no app. Drawn as the app draws
 * its screen (catch8 src/components/objects/kinds/gift): the secret first,
 * the box of dots filling with what is pledged (paid parts solid, promised
 * parts rings), the reader's own part, who is in (no one's amount but their
 * own), and the ideas with a like each.
 *
 * A pledge answers at once: the reader's part shows and the box fills before
 * the server says yes; the server's page takes over when it comes, and a
 * pledge that did not go through is put back.
 */

import { useEffect, useState } from "react";

import { say, type Words } from "@/lib/objects";
import { EASE, Face, INK, Money, Pill, Row, Section, STEP, Tick, dirOf, moneyParts } from "../kit";
import type { KindPage } from "../types";

/** Phrases said as one line in the reader's language: "a, b" in English, "a، b" in Arabic. */
const list = (parts: Array<string | null | undefined | false>, lang: "en" | "ar"): string => parts.filter(Boolean).join(lang === "ar" ? "، " : ", ");

/** The view as the core sends it (catch8 supabase/functions/_shared/objects/kinds/gift.ts GiftView). */
interface Pledge {
  id: string;
  by: string;
  name: string;
  you: boolean;
  amount: number | null;
  paid: boolean;
  yours: boolean;
}
interface Idea {
  id: string;
  text: string;
  priceWords: Words | null;
  why: string | null;
  memory: boolean;
  votes: Array<{ id: string; name: string }>;
  youVoted: boolean;
  picked: boolean;
}
interface GiftView {
  for: string;
  currency: string;
  goal: number | null;
  goalWords: Words | null;
  pledged: number;
  paid: number;
  count: number;
  box: { unit: number; dots: number; filled: number; solid: number; legend: Words };
  open: boolean;
  pledges: Pledge[];
  ideas: Idea[];
  occasion: string | null;
  dayWords: Words | null;
  leftWords: Words | null;
  secret: Words;
  alert: Words | null;
}

const C = {
  of: { en: "of", ar: "من" },
  soFar: { en: "so far", ar: "لحد دلوقتي" },
  in: { en: "chipping in", ar: "داخلين" },
  paid: { en: "paid", ar: "دفعوا" },
  likes: { en: "like it", ar: "عاجبهم" },
  nobody: { en: "Nobody in yet", ar: "لسه محدش دخل" },
  yourPart: { en: "Your part", ar: "نصيبك" },
  imIn: { en: "I’m in for", ar: "هدخل بـ" },
  other: { en: "Another amount", ar: "مبلغ تاني" },
  set: { en: "Set", ar: "تمام" },
  sent: { en: "I sent it", ar: "بعته" },
  sentLabel: { en: "Mark your part sent", ar: "علّم إن نصيبك وصل" },
  whoIsIn: { en: "Who’s in", ar: "مين معاكم" },
  hidden: { en: "Each amount stays between the giver and the organizer.", ar: "كل مبلغ بين صاحبه واللي بيجمع بس." },
  ideas: { en: "Ideas", ar: "أفكار" },
  like: { en: "Like", ar: "عاجبني" },
  liked: { en: "Liked", ar: "عجبتك" },
  picked: { en: "the pick", ar: "اللي اخترناها" },
  memory: { en: "from what Krovvi knows", ar: "من اللي كروفي يعرفه" },
  addIdea: { en: "Add an idea", ar: "ضيف فكرة" },
  add: { en: "Add", ar: "ضيف" },
  placeholder: { en: "A present idea", ar: "فكرة هدية" },
  you: { en: "you", ar: "إنت" },
} satisfies Record<string, Words>;

const DECIMALS: Record<string, number> = { JPY: 0, KRW: 0, KWD: 3, BHD: 3, OMR: 3, JOD: 3, TND: 3 };
const decimalsOf = (code: string) => DECIMALS[code] ?? 2;
const text = (minor: number, currency: string, lang: "en" | "ar") => {
  const p = moneyParts(minor, currency, lang);
  return p.before ? `${p.mark}${p.figure}` : `${p.figure} ${p.mark}`;
};

/** The box's dots: a bow of two and a lid of ten over a body eight wide, filled from the bottom (the app's Box). */
function places(total: number, pitch: number): Array<{ x: number; y: number; lid: boolean }> {
  const crown = total >= 24 ? 12 : 0;
  const body = total - crown;
  const rows = Math.ceil(body / 8);
  const height = rows + (crown ? 2 : 0);
  const out: Array<{ x: number; y: number; lid: boolean }> = [];
  for (let i = 0; i < body; i += 1) {
    const row = Math.floor(i / 8);
    const inRow = Math.min(8, body - row * 8);
    const shift = ((8 - inRow) / 2) * pitch;
    out.push({ x: pitch + shift + (i % 8) * pitch, y: (height - 1 - row) * pitch, lid: false });
  }
  if (crown) {
    for (let col = 0; col < 10; col += 1) out.push({ x: col * pitch, y: pitch, lid: true });
    out.push({ x: 4 * pitch, y: 0, lid: true }, { x: 5 * pitch, y: 0, lid: true });
  }
  return out;
}

function Box({ total, filled, solid, open, dot = 12, gap = 7, label }: { total: number; filled: number; solid: number; open: boolean; dot?: number; gap?: number; label: string }) {
  const pitch = dot + gap;
  const at = places(total, pitch);
  const rows = Math.max(...at.map((p) => p.y)) / pitch + 1;
  return (
    <div role="img" aria-label={label} style={{ position: "relative", width: 10 * pitch - gap, height: rows * pitch - gap + 8 }}>
      {at.map((p, i) => {
        const state = i < solid ? "solid" : i < filled ? "ring" : "empty";
        return (
          <span
            key={i}
            aria-hidden
            style={{
              position: "absolute",
              left: p.x,
              top: p.y + 8,
              width: dot,
              height: dot,
              borderRadius: "50%",
              background: state === "solid" ? INK.fg : state === "empty" ? INK.track : "transparent",
              border: state === "ring" ? `1.5px solid ${INK.fg}` : "none",
              boxSizing: "border-box",
              transform: `translateY(${open && p.lid ? -8 : 0}px)`,
              transition: `background-color 300ms ${EASE} ${i * 12}ms, transform 300ms ${EASE}`,
            }}
          />
        );
      })}
    </div>
  );
}

export const Page: KindPage = ({ page, view, lang, act, can, busy }) => {
  const v = view as GiftView;
  const me = page.members.find((m) => m.you) ?? null;
  // The reader's own part, shown at once until the server's page has it.
  const [mine, setMine] = useState<{ amount: number; paid: boolean } | null>(null);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [other, setOther] = useState("");
  const [idea, setIdea] = useState("");
  useEffect(() => {
    setMine(null);
    setLiked({});
  }, [page.version]);

  const held = v.pledges.find((p) => p.you) ?? null;
  const part = mine ?? (held && held.amount !== null ? { amount: held.amount, paid: held.paid } : null);
  const delta = mine ? mine.amount - (held?.amount ?? 0) : 0;
  const pledged = v.pledged + delta;
  const paidDelta = mine ? (mine.paid ? mine.amount : 0) - (held?.paid ? (held.amount ?? 0) : 0) : 0;
  const filled = Math.min(v.box.dots, Math.floor(pledged / v.box.unit));
  const solid = Math.min(filled, Math.floor((v.paid + paidDelta) / v.box.unit));
  const open = v.open || (v.goal !== null && pledged >= v.goal);
  const count = v.count + (mine && !held ? 1 : 0);
  const paidCount = v.pledges.filter((p) => p.paid && !p.you).length + (part?.paid ? 1 : 0);

  // The even share of the goal, in whole units, with a round amount either side ($50, $67, $100 for $200 among three), as the app offers.
  const unit = 10 ** decimalsOf(v.currency);
  const NICE = [5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 150, 200, 250, 300, 400, 500, 750, 1000, 1500, 2000, 2500, 3000, 5000, 10000];
  const share = v.goal ? Math.max(1, Math.round(v.goal / Math.max(1, page.members.length, count + (part ? 0 : 1)) / unit)) : null;
  const quick = share === null
    ? [20, 50, 100].map((n) => n * unit)
    : [...new Set([[...NICE].reverse().find((n) => n <= share * 0.8) ?? null, share, NICE.find((n) => n >= share * 1.25) ?? null].filter((n): n is number => n !== null))].sort((a, b) => a - b).map((n) => n * unit);

  const pledge = async (amount: number) => {
    if (me) setMine({ amount, paid: part?.paid ?? false });
    const ok = await act("pledge", { amount: amount / 10 ** decimalsOf(v.currency) });
    if (!ok) setMine(null);
  };
  const pledgeOther = () => {
    const n = Number(other.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) return;
    void pledge(Math.round(n * 10 ** decimalsOf(v.currency)));
    setOther("");
  };
  const sent = async () => {
    if (!part) return;
    setMine({ amount: part.amount, paid: !part.paid });
    const ok = await act("paid", { off: part.paid });
    if (!ok) setMine(null);
  };

  return (
    <div>
      <p className="mb-3 text-center" style={{ ...STEP.label, color: v.alert ? INK.pick : INK.soft }}>
        <bdi dir={dirOf(say(v.secret, lang))}>{say(v.secret, lang)}</bdi>
      </p>
      {v.alert ? (
        <div role="alert" className="mb-3" style={{ background: INK.surfaceHi, borderRadius: 17, padding: "14px 16px", ...STEP.body, color: INK.pick }}>
          {say(v.alert, lang)}
        </div>
      ) : null}

      <section className="mb-3 flex flex-col items-center" style={{ background: INK.surface, borderRadius: 17, padding: "22px 16px 18px", gap: 6 }}>
        <span className="inline-flex flex-wrap items-baseline justify-center" dir="ltr" style={{ gap: 6 }}>
          <Money minor={pledged} currency={v.currency} lang={lang} step="display" />
          <span style={{ ...STEP.title, color: INK.muted }}>{v.goalWords ? `${say(C.of, lang)} ${say(v.goalWords, lang)}` : say(C.soFar, lang)}</span>
        </span>
        <span style={{ ...STEP.body, color: INK.soft }}>
          {count ? list([`${count} ${say(C.in, lang)}`, paidCount > 0 && `${paidCount} ${say(C.paid, lang)}`], lang) : say(C.nobody, lang)}
        </span>
        {v.occasion || v.dayWords ? (
          <span style={{ ...STEP.meta, color: INK.muted }}>
            {list([v.occasion && `${v.occasion.charAt(0).toUpperCase()}${v.occasion.slice(1)}`, v.dayWords && say(v.dayWords, lang), v.leftWords && say(v.leftWords, lang).toLowerCase()], lang)}
          </span>
        ) : null}
        <div style={{ padding: "12px 0" }}>
          <Box total={v.box.dots} filled={filled} solid={solid} open={open} label={`${text(pledged, v.currency, lang)}. ${say(v.box.legend, lang)}`} />
        </div>
        <span style={{ ...STEP.meta, color: INK.muted }}>{say(v.box.legend, lang)}</span>
      </section>

      {can("pledge") ? (
        <Section title={say(C.yourPart, lang)}>
          {part ? (
            <Row
              first
              lead={can("paid") ? <Tick done={part.paid} by={part.paid ? me?.name : null} label={say(C.sentLabel, lang)} onClick={busy ? undefined : () => void sent()} /> : undefined}
              title={say(part.paid ? C.sent : C.imIn, lang)}
              value={<Money minor={part.amount} currency={v.currency} lang={lang} step="title" />}
            />
          ) : null}
          <div className="flex flex-wrap items-center" style={{ gap: 8, padding: part ? "4px 16px 14px" : "6px 16px 14px" }}>
            {!part ? <span style={{ ...STEP.label, color: INK.muted }}>{say(C.imIn, lang)}</span> : null}
            {quick
              .filter((amount) => amount !== part?.amount)
              .map((amount) => (
                <Pill key={amount} text={text(amount, v.currency, lang)} strong={!part && share !== null && amount === share * unit} disabled={busy} onClick={() => void pledge(amount)} />
              ))}
            <form
              className="flex items-center"
              style={{ gap: 6 }}
              onSubmit={(e) => {
                e.preventDefault();
                pledgeOther();
              }}
            >
              <input
                inputMode="decimal"
                value={other}
                onChange={(e) => setOther(e.target.value.replace(/[^\d.,]/g, ""))}
                placeholder={say(C.other, lang)}
                aria-label={say(C.other, lang)}
                className="w-[130px] rounded-full outline-none"
                style={{ ...STEP.label, background: INK.surfaceHi, color: INK.fg, padding: "0 14px", height: 34 }}
              />
              {other ? <Pill text={say(C.set, lang)} disabled={busy} onClick={pledgeOther} /> : null}
            </form>
          </div>
        </Section>
      ) : null}

      {v.pledges.length || mine ? (
        <Section title={say(C.whoIsIn, lang)}>
          {v.pledges.map((p, i) => (
            <Row
              key={p.id}
              first={i === 0}
              lead={<Face name={p.name} size={28} />}
              title={p.you ? `${p.name} (${say(C.you, lang)})` : p.name}
              value={
                <span className="flex items-center" style={{ gap: 12 }}>
                  {p.you && part ? <Money minor={part.amount} currency={v.currency} lang={lang} step="body" /> : p.amount !== null ? <Money minor={p.amount} currency={v.currency} lang={lang} step="body" /> : null}
                  <Tick done={p.you && part ? part.paid : p.paid} size={22} label={p.name} />
                </span>
              }
            />
          ))}
          {mine && !held && me ? <Row lead={<Face name={me.name} size={28} />} title={`${me.name} (${say(C.you, lang)})`} value={<Money minor={mine.amount} currency={v.currency} lang={lang} step="body" />} /> : null}
          <p style={{ ...STEP.meta, color: INK.muted, padding: "8px 16px 12px" }}>{say(C.hidden, lang)}</p>
        </Section>
      ) : null}

      {v.ideas.length || can("idea") ? (
        <Section title={say(C.ideas, lang)}>
          {v.ideas.map((x, i) => {
            const youLike = liked[x.id] ?? x.youVoted;
            const votes = x.votes.length + (liked[x.id] === undefined ? 0 : liked[x.id] && !x.youVoted ? 1 : !liked[x.id] && x.youVoted ? -1 : 0);
            return (
              <Row
                key={x.id}
                first={i === 0}
                title={x.picked ? list([x.text, say(C.picked, lang)], lang) : x.text}
                sub={[list([x.priceWords && say(x.priceWords, lang), votes > 0 && `${votes} ${say(C.likes, lang)}`], lang), x.why ? `${x.why}${x.memory ? ` (${say(C.memory, lang)})` : ""}` : null].filter(Boolean).join(". ")}
                value={
                  can("vote") ? (
                    <Pill
                      text={say(youLike ? C.liked : C.like, lang)}
                      strong={!youLike}
                      disabled={busy}
                      onClick={async () => {
                        setLiked((s) => ({ ...s, [x.id]: !youLike }));
                        const ok = await act("vote", { idea: x.id, off: youLike });
                        if (!ok) setLiked((s) => ({ ...s, [x.id]: youLike }));
                      }}
                    />
                  ) : undefined
                }
              />
            );
          })}
          {can("idea") ? (
            <form
              className="flex items-center"
              style={{ gap: 8, padding: v.ideas.length ? "8px 12px 12px" : "6px 12px 12px" }}
              onSubmit={async (e) => {
                e.preventDefault();
                if (!idea.trim()) return;
                if (await act("idea", { text: idea.trim() })) setIdea("");
              }}
            >
              <input value={idea} onChange={(e) => setIdea(e.target.value)} maxLength={80} placeholder={say(C.placeholder, lang)} aria-label={say(C.addIdea, lang)} className="min-w-0 flex-1 rounded-2xl outline-none" style={{ ...STEP.body, background: INK.surfaceHi, color: INK.fg, padding: "12px 14px" }} />
              <Pill text={say(C.add, lang)} strong disabled={busy || !idea.trim()} onClick={async () => idea.trim() && (await act("idea", { text: idea.trim() })) && setIdea("")} />
            </form>
          ) : null}
        </Section>
      ) : null}
    </div>
  );
};
