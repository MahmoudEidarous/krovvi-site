"use client";

/**
 * Plan on the page, the heart of this kind: a WhatsApp group votes here with
 * no app. Drawn as the app draws its screen (catch8
 * src/components/objects/kinds/plan): the question, its options as big taps
 * the faces gather on (the one in the lead in bone), who has voted, and once
 * it is decided the winner and who is coming.
 *
 * A tap answers at once: the reader's own face lands on the option (or their
 * answer is chosen) before the server says yes, and the server's page takes
 * over when it comes; a tap that did not go through is put back. "If need
 * be" is a visible switch as well as a long press, since many people never
 * long press.
 */

import { useEffect, useRef, useState } from "react";

import { say, type Words } from "@/lib/objects";
import { EASE, FaceStack, INK, Pill, Section, STEP, dirOf } from "../kit";
import type { KindPage } from "../types";

/** Phrases said as one line in the reader's language: "a, b" in English, "a، b" in Arabic. */
const list = (parts: Array<string | null | undefined | false>, lang: "en" | "ar"): string => parts.filter(Boolean).join(lang === "ar" ? "، " : ", ");

/** The view as the core sends it (catch8 supabase/functions/_shared/objects/kinds/plan.ts PlanView). */
type Vote = "yes" | "maybe" | null;
type Answer = "yes" | "maybe" | "no";
interface Person {
  id: string;
  name: string;
}
interface Opt {
  id: string;
  group: "when" | "where" | "what";
  words: Words;
  emoji: string | null;
  yes: Person[];
  maybe: Person[];
  score: number;
  leading: boolean;
  won: boolean;
  youVote: Vote;
}
interface Group {
  group: "when" | "where" | "what";
  label: Words;
  options: Opt[];
  decided: string | null;
  tie: string[];
}
interface PlanView {
  note: string | null;
  phase: "open" | "decided";
  closed: boolean;
  closesWords: Words | null;
  groups: Group[];
  voted: number;
  people: number;
  rsvp: { yes: Array<Person & { plus: number }>; maybe: Array<Person & { plus: number }>; no: Person[]; headcount: number; you: Answer | null };
  when: { words: Words; leftWords: Words; daysLeft: number } | null;
  place: string | null;
  what: string | null;
}

const C = {
  leads: { en: "leads", ar: "متقدم" },
  tied: { en: "Tied at the top", ar: "متعادلين" },
  noVotes: { en: "No votes yet", ar: "لسه مفيش أصوات" },
  voted: { en: "voted", ar: "صوتوا" },
  of: { en: "of", ar: "من" },
  hint: { en: "Tap every one you can make", ar: "دوس على كل اللي ينفعك" },
  ifNeedBe: { en: "If need be", ar: "لو لزم" },
  yes: { en: "yes", ar: "أيوه" },
  maybeShort: { en: "if need be", ar: "لو لزم" },
  decided: { en: "Decided", ar: "اتحسمت" },
  going: { en: "Going", ar: "جايين" },
  maybe: { en: "Maybe", ar: "يمكن" },
  cant: { en: "Can’t", ar: "مش هينفع" },
  coming: { en: "coming", ar: "جايين" },
  whoComes: { en: "Who’s coming", ar: "مين جاي" },
  addOption: { en: "Add an option", ar: "ضيف اختيار" },
  add: { en: "Add", ar: "ضيف" },
  placeholderWhere: { en: "A place", ar: "مكان" },
  placeholderWhat: { en: "An idea", ar: "فكرة" },
  bring: { en: "Bringing", ar: "معاك" },
  closedNote: { en: "Voting has closed", ar: "التصويت قفل" },
} satisfies Record<string, Words>;

/** "Votes close Thu 8 Oct" inside a sentence: only the first letter drops. */
const lower = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

/** The reader's taps over the view, until the server's page has them. */
function withVotes(o: Opt, mine: Vote | undefined, me: Person | null): Opt {
  if (mine === undefined || !me) return o;
  const yes = o.yes.filter((p) => p.id !== me.id);
  const maybe = o.maybe.filter((p) => p.id !== me.id);
  if (mine === "yes") yes.push(me);
  if (mine === "maybe") maybe.push(me);
  return { ...o, yes, maybe, score: yes.length + maybe.length / 2, youVote: mine };
}

function withLead(g: Group): Group {
  if (g.decided) return g;
  const top = Math.max(...g.options.map((o) => o.score));
  const leaders = top > 0 ? g.options.filter((o) => o.score === top) : [];
  return { ...g, options: g.options.map((o) => ({ ...o, leading: leaders.length === 1 && leaders[0].id === o.id })) };
}

function OptionButton({ o, g, lang, onVote, disabled }: { o: Opt; g: Group; lang: "en" | "ar"; onVote?: (o: Opt, maybe: boolean) => void; disabled: boolean }) {
  const decided = !!g.decided;
  const lead = o.won || (o.leading && !decided);
  const faded = decided && !o.won;
  const press = useRef<ReturnType<typeof setTimeout> | null>(null);
  const held = useRef(false);
  const words = say(o.words, lang);
  const count = o.yes.length + o.maybe.length;
  return (
    <button
      type="button"
      disabled={disabled || !onVote}
      onPointerDown={() => {
        held.current = false;
        if (!onVote) return;
        press.current = setTimeout(() => {
          held.current = true;
          onVote(o, true);
        }, 450);
      }}
      onPointerUp={() => press.current && clearTimeout(press.current)}
      onPointerLeave={() => press.current && clearTimeout(press.current)}
      onClick={() => {
        if (held.current || !onVote) return;
        onVote(o, false);
      }}
      onContextMenu={(e) => e.preventDefault()}
      aria-pressed={!!o.youVote}
      aria-label={`${words}: ${list([`${o.yes.length} ${say(C.yes, lang)}`, o.maybe.length > 0 && `${o.maybe.length} ${say(C.maybeShort, lang)}`], lang)}`}
      className="flex w-full items-center text-start active:scale-[0.99]"
      style={{
        gap: 12,
        minHeight: 58,
        padding: "10px 14px",
        borderRadius: 16,
        background: INK.surfaceHi,
        border: `1.5px solid ${lead ? INK.pick : "transparent"}`,
        opacity: faded ? 0.42 : 1,
        transform: faded ? "scale(0.98)" : undefined,
        transition: `opacity 280ms ${EASE}, transform 280ms ${EASE}, border-color 280ms ${EASE}`,
        userSelect: "none",
        WebkitTouchCallout: "none",
      }}
    >
      <span
        aria-hidden
        className="shrink-0 rounded-full"
        style={{
          width: 12,
          height: 12,
          border: `1.5px solid ${o.youVote ? INK.fg : INK.faint}`,
          background: o.youVote === "yes" ? INK.fg : o.youVote === "maybe" ? "rgba(237,237,235,0.4)" : "transparent",
          transition: `background-color 200ms ${EASE}, border-color 200ms ${EASE}`,
        }}
      />
      <span className="min-w-0 flex-1">
        <span className="block" style={{ ...(o.won ? STEP.title : STEP.body), color: lead ? INK.pick : INK.fg }}>
          <bdi dir={dirOf(words)}>{`${o.emoji ? `${o.emoji} ` : ""}${words}`}</bdi>
        </span>
        {count ? (
          <span className="block" style={{ ...STEP.meta, color: INK.muted }}>
            {list([`${o.yes.length} ${say(C.yes, lang)}`, o.maybe.length > 0 && `${o.maybe.length} ${say(C.maybeShort, lang)}`], lang)}
          </span>
        ) : null}
      </span>
      {/* The faces land as votes come in: the stack is drawn again with a short rise when it changes. */}
      <span key={`${o.yes.map((p) => p.id).join()}|${o.maybe.map((p) => p.id).join()}`} className="flex shrink-0 items-center" style={{ gap: 6, animation: `k-pop 240ms ${EASE} both` }}>
        {o.yes.length ? <FaceStack names={o.yes.map((p) => p.name)} size={26} max={4} /> : null}
        {o.maybe.length ? (
          <span style={{ opacity: 0.5, lineHeight: 0 }}>
            <FaceStack names={o.maybe.map((p) => p.name)} size={22} max={2} />
          </span>
        ) : null}
      </span>
    </button>
  );
}

export const Page: KindPage = ({ page, view, lang, act, can, busy }) => {
  const v = view as PlanView;
  const me = page.members.find((m) => m.you) ?? null;
  const person = me ? { id: me.id, name: me.name } : null;
  const [mine, setMine] = useState<Record<string, Vote>>({});
  const [answer, setAnswer] = useState<{ answer: Answer; plus: number } | null>(null);
  const [maybeMode, setMaybeMode] = useState(false);
  const [draft, setDraft] = useState("");
  const [day, setDay] = useState("");
  const [time, setTime] = useState("");
  // The server's page has the taps in it: the overlay goes.
  useEffect(() => {
    setMine({});
    setAnswer(null);
  }, [page.version]);

  const groups = v.groups.map((g) => withLead({ ...g, options: g.options.map((o) => withVotes(o, mine[o.id], person)) }));
  const open = groups.find((g) => !g.decided) ?? groups[0] ?? null;
  const decided = v.phase === "decided";
  const mayVote = can("vote") && !decided && !v.closed;

  const vote = async (o: Opt, maybe: boolean) => {
    const current = mine[o.id] !== undefined ? mine[o.id] : o.youVote;
    const wantMaybe = maybe || maybeMode;
    const next: Vote = wantMaybe ? (current === "maybe" ? null : "maybe") : current === "yes" ? null : "yes";
    if (person) setMine((s) => ({ ...s, [o.id]: next }));
    const ok = await act("vote", { option: o.id, maybe: next === "maybe", off: next === null });
    if (!ok)
      setMine((s) => {
        const copy = { ...s };
        delete copy[o.id];
        return copy;
      });
  };

  const r = v.rsvp;
  const you = answer?.answer ?? r.you;
  const myPlus = answer?.plus ?? r.yes.find((p) => p.id === me?.id)?.plus ?? 0;
  const headcount = (() => {
    if (!answer || !person) return r.headcount;
    const before = r.yes.find((p) => p.id === person.id);
    const minus = before ? 1 + before.plus : 0;
    return r.headcount - minus + (answer.answer === "yes" ? 1 + answer.plus : 0);
  })();
  const listed = (a: Answer) => {
    const base = (a === "yes" ? r.yes : a === "maybe" ? r.maybe : r.no).filter((p) => !answer || p.id !== person?.id);
    return answer?.answer === a && person ? [...base, person] : base;
  };
  const rsvp = async (a: Answer, plus = 0) => {
    if (person) setAnswer({ answer: a, plus });
    const ok = await act("rsvp", { answer: a, plus });
    if (!ok) setAnswer(null);
  };

  const add = async () => {
    if (!open) return;
    const ok = open.group === "when" ? await act("option", { day, time: time || undefined }) : await act("option", { group: open.group, text: draft });
    if (ok) {
      setDraft("");
      setDay("");
      setTime("");
    }
  };

  const point = decided || !open ? null : open.tie.length ? say(C.tied, lang) : (() => {
    const lead = open.options.find((o) => o.leading);
    if (lead) return `${say(lead.words, lang)} ${say(C.leads, lang)}`;
    return open.options.some((o) => o.score > 0) ? say(C.tied, lang) : say(C.noVotes, lang);
  })();

  return (
    <div>
      <section className="mb-3 flex flex-col items-center" style={{ background: INK.surface, borderRadius: 17, padding: "22px 16px 18px", gap: 14 }}>
        {decided || !open ? (
          <div className="flex flex-col items-center text-center" style={{ gap: 4 }}>
            <span style={{ ...STEP.label, color: INK.muted }}>{say(C.decided, lang)}</span>
            <span style={{ ...STEP.display, fontSize: 34, lineHeight: "40px", animation: `k-pop 420ms ${EASE} both` }}>
              {v.when ? say(v.when.words, lang) : <bdi dir={dirOf(v.place ?? v.what ?? page.title)}>{v.place ?? v.what ?? page.title}</bdi>}
            </span>
            {v.when ? <span style={{ ...STEP.title, color: INK.soft }}>{say(v.when.leftWords, lang)}</span> : null}
            {v.when && (v.place || v.what) ? (
              <span style={{ ...STEP.body, color: INK.soft }}>
                <bdi dir={dirOf(v.place ?? v.what ?? "")}>{list([v.place, v.what], lang)}</bdi>
              </span>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col items-center text-center" style={{ gap: 4 }}>
            <span style={{ ...STEP.label, color: INK.muted }}>{`${say(open.label, lang)}${lang === "ar" ? "؟" : "?"}`}</span>
            <span style={{ ...STEP.figure }}>
              <bdi dir={dirOf(point ?? "")}>{point}</bdi>
            </span>
          </div>
        )}
        {v.note ? (
          <span className="text-center" style={{ ...STEP.meta, color: INK.soft }}>
            <bdi dir={dirOf(v.note)}>{v.note}</bdi>
          </span>
        ) : null}
        {open ? (
          <div className="flex w-full flex-col" style={{ gap: 8 }}>
            {open.options.map((o) => (
              <OptionButton key={o.id} o={o} g={open} lang={lang} disabled={!mayVote} onVote={mayVote ? vote : undefined} />
            ))}
          </div>
        ) : null}
        {!decided && open ? (
          <div className="flex w-full flex-wrap items-center justify-between" style={{ gap: 8 }}>
            <span style={{ ...STEP.meta, color: INK.muted }}>
              {list([`${v.voted} ${say(C.of, lang)} ${v.people} ${say(C.voted, lang)}`, v.closesWords && !v.closed && lower(say(v.closesWords, lang))], lang)}
              {v.closed ? `. ${say(C.closedNote, lang)}` : ""}
            </span>
            {mayVote ? (
              <button
                type="button"
                role="switch"
                aria-checked={maybeMode}
                onClick={() => setMaybeMode((m) => !m)}
                className="flex items-center rounded-full"
                style={{ ...STEP.label, gap: 8, padding: "6px 12px", background: maybeMode ? INK.fg : INK.surfaceHi, color: maybeMode ? INK.bg : INK.fg, transition: `background-color 150ms ${EASE}, color 150ms ${EASE}` }}
              >
                {say(C.ifNeedBe, lang)}
              </button>
            ) : null}
          </div>
        ) : null}
        {mayVote && open ? <span style={{ ...STEP.meta, color: INK.muted }}>{say(C.hint, lang)}</span> : null}
      </section>

      {groups
        .filter((g) => g !== open)
        .map((g) => (
          <Section key={g.group} title={`${say(g.label, lang)}${lang === "ar" ? "؟" : "?"}`}>
            <div className="flex flex-col" style={{ gap: 8, padding: "4px 12px 12px" }}>
              {g.options.map((o) => (
                <OptionButton key={o.id} o={o} g={g} lang={lang} disabled={!can("vote") || !!g.decided || v.closed} onVote={can("vote") && !g.decided && !v.closed ? vote : undefined} />
              ))}
            </div>
          </Section>
        ))}

      {can("option") && open && !decided && !v.closed ? (
        <Section title={say(C.addOption, lang)}>
          <form
            className="flex items-center"
            style={{ gap: 8, padding: "6px 12px 12px" }}
            onSubmit={(e) => {
              e.preventDefault();
              void add();
            }}
          >
            {open.group === "when" ? (
              <>
                <input type="date" value={day} onChange={(e) => setDay(e.target.value)} className="min-w-0 flex-1 rounded-2xl outline-none" style={{ ...STEP.body, background: INK.surfaceHi, color: INK.fg, padding: "12px 14px", colorScheme: "dark" }} aria-label={say(C.addOption, lang)} />
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-[110px] rounded-2xl outline-none" style={{ ...STEP.body, background: INK.surfaceHi, color: INK.fg, padding: "12px 14px", colorScheme: "dark" }} />
              </>
            ) : (
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={80}
                placeholder={say(open.group === "where" ? C.placeholderWhere : C.placeholderWhat, lang)}
                className="min-w-0 flex-1 rounded-2xl outline-none"
                style={{ ...STEP.body, background: INK.surfaceHi, color: INK.fg, padding: "12px 14px" }}
                aria-label={say(C.addOption, lang)}
              />
            )}
            <Pill text={say(C.add, lang)} strong disabled={busy || (open.group === "when" ? !day : !draft.trim())} onClick={() => void add()} />
          </form>
        </Section>
      ) : null}

      <Section title={headcount ? `${headcount} ${say(C.coming, lang)}` : say(C.whoComes, lang)}>
        <div className="flex" style={{ gap: 8, padding: "4px 12px 12px" }}>
          {(["yes", "maybe", "no"] as const).map((a) => {
            const chosen = you === a;
            const people = listed(a);
            const n = a === "yes" ? headcount : people.length;
            return (
              <button
                key={a}
                type="button"
                disabled={!can("rsvp")}
                aria-pressed={chosen}
                onClick={() => void rsvp(a, a === "yes" ? myPlus : 0)}
                className="flex flex-1 flex-col items-center rounded-2xl active:scale-[0.97] disabled:opacity-60"
                style={{ gap: 2, padding: "12px 6px", minHeight: 92, background: chosen ? INK.fg : INK.surfaceHi, color: chosen ? INK.bg : INK.fg, transition: `background-color 180ms ${EASE}, color 180ms ${EASE}, transform 110ms ${EASE}` }}
              >
                <span style={{ ...STEP.label, fontWeight: 600 }}>{say(a === "yes" ? C.going : a === "maybe" ? C.maybe : C.cant, lang)}</span>
                <span style={{ ...STEP.figure }}>{n}</span>
                <span style={{ height: 22 }} className="flex items-center">
                  {people.length ? <FaceStack names={people.map((p) => p.name)} size={18} max={3} /> : null}
                </span>
              </button>
            );
          })}
        </div>
        {you === "yes" && can("rsvp") ? (
          <div className="flex items-center justify-between" style={{ padding: "0 16px 14px" }}>
            <span style={{ ...STEP.label, color: INK.muted }}>{`${say(C.bring, lang)} +${myPlus}`}</span>
            <span className="flex" style={{ gap: 8 }}>
              <Pill text="−" disabled={busy || myPlus === 0} onClick={() => void rsvp("yes", Math.max(0, myPlus - 1))} />
              <Pill text="+" disabled={busy || myPlus >= 9} onClick={() => void rsvp("yes", Math.min(9, myPlus + 1))} />
            </span>
          </div>
        ) : null}
      </Section>
    </div>
  );
};
