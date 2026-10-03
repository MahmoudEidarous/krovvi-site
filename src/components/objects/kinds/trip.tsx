"use client";

/**
 * Trip on the page: the people going see the route and the plan, add ideas
 * and like them, and tick their own packing here with no app. Drawn as the
 * app draws its screen (catch8 src/components/objects/kinds/trip): the days
 * to go as the point, the route as a rail (a dot under each place for every
 * day there, a dot on the way for every hour), the next thing up, the trip
 * day by day, the ideas and the packing. Booking codes are only in the copy
 * of whoever added the booking.
 *
 * A tap answers at once: a like or a tick shows before the server says yes,
 * and goes back if it did not go through.
 */

import { useEffect, useState } from "react";

import { say, type Words } from "@/lib/objects";
import { EASE, FaceStack, INK, Pill, Row, Section, STEP, Tick, dirOf } from "../kit";
import type { KindPage } from "../types";

/** The view as the core sends it (catch8 supabase/functions/_shared/objects/kinds/trip.ts TripView). */
interface Stop {
  place: string;
  kind: "home" | "stay";
  days: Array<{ day: string; past: boolean; today: boolean }>;
}
interface Leg {
  from: string;
  to: string;
  kind: string;
  booking: string | null;
  hours: number;
  past: boolean;
}
interface Booking {
  id: string;
  emoji: string;
  title: string;
  whenWords: Words;
  code: string | null;
}
interface Idea {
  id: string;
  text: string;
  emoji: string | null;
  votes: Array<{ id: string; name: string }>;
  youVoted: boolean;
}
interface Pack {
  id: string;
  text: string;
  one: boolean;
  packedBy: Array<{ id: string; name: string }>;
  youPacked: boolean;
  done: boolean;
}
interface TripView {
  phase: "planning" | "before" | "during" | "after";
  daysToGo: number | null;
  datesWords: Words | null;
  leftWords: Words;
  route: { stops: Stop[]; legs: Leg[] };
  next: { id: string; title: string; emoji: string; whenWords: Words; inWords: Words } | null;
  bookings: Booking[];
  plan: Array<{ day: string; label: Words; today: boolean; things: Array<{ id: string; text: string; emoji: string; timeWords: Words | null }> }>;
  ideas: Idea[];
  packing: { items: Pack[]; you: { left: number; total: number } | null };
}

const C = {
  daysToGo: { en: "days to go", ar: "يوم فاضل" },
  daysToGoFew: { en: "days to go", ar: "أيام فاضلة" },
  legend: { en: "Each dot under a place is a day there; each dot on the way is an hour", ar: "كل نقطة تحت المكان يوم فيه، وكل نقطة في الطريق ساعة" },
  hours: { en: "h", ar: "س" },
  nextUp: { en: "Next up", ar: "اللي جاي" },
  code: { en: "Code", ar: "الكود" },
  plan: { en: "Day by day", ar: "يوم بيوم" },
  free: { en: "Free day", ar: "يوم فاضي" },
  ideas: { en: "Ideas", ar: "أفكار" },
  like: { en: "Like", ar: "عاجبني" },
  liked: { en: "Liked", ar: "عجبتك" },
  addIdea: { en: "Add an idea", ar: "ضيف فكرة" },
  add: { en: "Add", ar: "ضيف" },
  placeholder: { en: "Something to do or see", ar: "حاجة نعملها أو نشوفها" },
  yours: { en: "Your things to pack", ar: "حاجتك في الشنطة" },
  forAll: { en: "One of you brings", ar: "حد فيكم يجيب" },
  packedBy: { en: "packed by", ar: "جابها" },
  everyone: { en: "everyone packed", ar: "الكل حطها" },
  votes: { en: "votes", ar: "أصوات" },
  vote: { en: "vote", ar: "صوت" },
} satisfies Record<string, Words>;

const MARKS: Record<string, string> = { flight: "✈️", train: "🚆", bus: "🚌", ferry: "⛴️" };

function Route({ view, lang }: { view: TripView; lang: "en" | "ar" }) {
  const { stops, legs } = view.route;
  const next = view.next?.id ?? null;
  return (
    <div className="w-full" style={{ padding: "10px 0" }}>
      {stops.map((s, i) => {
        const leg = i < stops.length - 1 ? legs.find((l) => l.from === s.place && l.to === stops[i + 1].place) ?? null : null;
        const here = s.days.some((d) => d.today);
        return (
          <div key={`${s.place}-${i}`}>
            <div className="flex items-center" style={{ gap: 12, minHeight: 34 }}>
              <span className="flex shrink-0 justify-center" style={{ width: 16 }}>
                <span className="block rounded-full" style={s.kind === "home" ? { width: 10, height: 10, border: `1.5px solid ${INK.faint}` } : { width: here ? 14 : 12, height: here ? 14 : 12, background: here ? INK.pick : INK.fg }} />
              </span>
              <span className="min-w-0 flex-1" style={{ padding: "4px 0" }}>
                <span className="block" style={s.kind === "home" ? { ...STEP.meta, color: INK.muted } : { ...STEP.title }}>
                  <bdi dir={dirOf(s.place)}>{s.place}</bdi>
                </span>
                {s.days.length ? (
                  <span className="flex flex-wrap items-center" style={{ gap: 5, marginTop: 6 }}>
                    {s.days.map((d) => (
                      <span
                        key={d.day}
                        aria-hidden
                        className="block rounded-full"
                        style={{
                          width: d.today ? 12 : 9,
                          height: d.today ? 12 : 9,
                          boxSizing: "border-box",
                          background: d.past || d.today ? INK.fg : "transparent",
                          border: d.past || d.today ? "none" : `1.5px solid ${INK.faint}`,
                          opacity: d.past && !d.today ? 0.55 : 1,
                          transition: `background-color 260ms ${EASE}`,
                        }}
                      />
                    ))}
                  </span>
                ) : null}
              </span>
            </div>
            {i < stops.length - 1 ? (
              <div className="flex items-center" style={{ gap: 12, padding: "4px 0" }}>
                <span className="flex shrink-0 flex-col items-center" style={{ width: 16, gap: 3 }} aria-hidden>
                  {leg && leg.hours ? (
                    Array.from({ length: leg.hours }, (_, h) => <span key={h} className="block rounded-full" style={{ width: 3, height: 3, background: leg.booking === next ? INK.pick : leg.past ? INK.faint : INK.soft }} />)
                  ) : (
                    <span className="block" style={{ width: 1, height: 18, background: INK.line }} />
                  )}
                </span>
                {leg && MARKS[leg.kind] ? <span style={{ ...STEP.meta, color: leg.booking === next ? INK.pick : INK.muted }}>{`${MARKS[leg.kind]} ${leg.hours ? `${leg.hours} ${say(C.hours, lang)}` : ""}`}</span> : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export const Page: KindPage = ({ page, view, lang, act, can, busy }) => {
  const v = view as TripView;
  const me = page.members.find((m) => m.you) ?? null;
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [packed, setPacked] = useState<Record<string, boolean>>({});
  const [idea, setIdea] = useState("");
  useEffect(() => {
    setLiked({});
    setPacked({});
  }, [page.version]);

  const like = async (x: Idea) => {
    const now = liked[x.id] ?? x.youVoted;
    setLiked((s) => ({ ...s, [x.id]: !now }));
    if (!(await act("vote", { idea: x.id, off: now }))) setLiked((s) => ({ ...s, [x.id]: now }));
  };
  const pack = async (p: Pack) => {
    const now = packed[p.id] ?? p.youPacked;
    setPacked((s) => ({ ...s, [p.id]: !now }));
    if (!(await act("packed", { item: p.id, off: now }))) setPacked((s) => ({ ...s, [p.id]: now }));
  };
  const addIdea = async () => {
    if (idea.trim() && (await act("idea", { text: idea.trim() }))) setIdea("");
  };

  const counting = v.phase === "before" && v.daysToGo !== null && v.daysToGo > 1;
  const next = v.next ? v.bookings.find((b) => b.id === v.next!.id) ?? null : null;
  const own = v.packing.items.filter((p) => !p.one);
  const shared = v.packing.items.filter((p) => p.one);
  const packedBy = (p: Pack) => {
    const mine = packed[p.id] ?? p.youPacked;
    const others = p.packedBy.filter((x) => x.id !== me?.id).map((x) => x.name);
    return mine && me ? [...others, me.name] : others;
  };

  return (
    <div>
      <section className="mb-3 flex flex-col items-center" style={{ background: INK.surface, borderRadius: 17, padding: "24px 20px 18px", gap: 6 }}>
        <span style={counting ? { ...STEP.display, fontSize: 64, lineHeight: "72px", letterSpacing: "-2.5px" } : { ...STEP.display }}>{counting ? v.daysToGo : say(v.leftWords, lang)}</span>
        {counting ? <span style={{ ...STEP.title, color: INK.muted }}>{say(v.daysToGo! <= 10 ? C.daysToGoFew : C.daysToGo, lang)}</span> : null}
        {v.datesWords ? <span style={{ ...STEP.body, color: INK.soft }}>{say(v.datesWords, lang)}</span> : null}
        <Route view={v} lang={lang} />
        <span className="text-center" style={{ ...STEP.meta, color: INK.muted }}>
          {say(C.legend, lang)}
        </span>
      </section>

      {next ? (
        <Section title={say(C.nextUp, lang)}>
          <Row
            first
            lead={<span style={{ fontSize: 20 }} aria-hidden>{next.emoji}</span>}
            title={next.title}
            sub={`${say(next.whenWords, lang)}, ${say(v.next!.inWords, lang).toLowerCase()}`}
            value={next.code ? <span style={{ ...STEP.label, color: INK.pick }}>{`${say(C.code, lang)} ${next.code}`}</span> : undefined}
          />
        </Section>
      ) : null}

      {v.plan.length ? (
        <Section title={say(C.plan, lang)}>
          {v.plan.map((d, i) => (
            <Row
              key={d.day}
              first={i === 0}
              lead={<span style={{ ...STEP.label, color: d.today ? INK.pick : INK.muted }}>{i + 1}</span>}
              title={say(d.label, lang)}
              sub={d.things.length ? d.things.map((t) => `${t.timeWords ? `${say(t.timeWords, lang)} ` : ""}${t.emoji} ${t.text}`).join(", ") : say(C.free, lang)}
              muted={!d.things.length}
            />
          ))}
        </Section>
      ) : null}

      {v.ideas.length || can("idea") ? (
        <Section title={say(C.ideas, lang)}>
          {v.ideas.map((x, i) => {
            const youLike = liked[x.id] ?? x.youVoted;
            const names = [...x.votes.filter((p) => p.id !== me?.id).map((p) => p.name), ...(youLike && me ? [me.name] : [])];
            return (
              <Row
                key={x.id}
                first={i === 0}
                lead={names.length ? <FaceStack names={names} size={22} max={3} /> : <span style={{ fontSize: 20 }} aria-hidden>{x.emoji ?? "📍"}</span>}
                title={`${x.emoji ? `${x.emoji} ` : ""}${x.text}`}
                sub={names.length ? `${names.length} ${say(names.length === 1 ? C.vote : C.votes, lang)}: ${names.join(", ")}` : null}
                value={can("vote") ? <Pill text={say(youLike ? C.liked : C.like, lang)} strong={!youLike} disabled={busy} onClick={() => void like(x)} /> : undefined}
              />
            );
          })}
          {can("idea") ? (
            <form
              className="flex items-center"
              style={{ gap: 8, padding: "8px 12px 12px" }}
              onSubmit={(e) => {
                e.preventDefault();
                void addIdea();
              }}
            >
              <input value={idea} onChange={(e) => setIdea(e.target.value)} maxLength={80} placeholder={say(C.placeholder, lang)} aria-label={say(C.addIdea, lang)} className="min-w-0 flex-1 rounded-2xl outline-none" style={{ ...STEP.body, background: INK.surfaceHi, color: INK.fg, padding: "12px 14px" }} />
              <Pill text={say(C.add, lang)} strong disabled={busy || !idea.trim()} onClick={() => void addIdea()} />
            </form>
          ) : null}
        </Section>
      ) : null}

      {own.length ? (
        <Section title={say(C.yours, lang)}>
          {own.map((p, i) => {
            const mine = packed[p.id] ?? p.youPacked;
            const by = packedBy(p);
            return (
              <Row
                key={p.id}
                first={i === 0}
                lead={<Tick done={mine} by={mine ? me?.name : null} label={p.text} onClick={can("packed") && me && !busy ? () => void pack(p) : undefined} />}
                title={p.text}
                sub={p.done ? say(C.everyone, lang) : by.length ? `${say(C.packedBy, lang)} ${by.join(", ")}` : null}
                muted={mine}
              />
            );
          })}
        </Section>
      ) : null}

      {shared.length ? (
        <Section title={say(C.forAll, lang)}>
          {shared.map((p, i) => {
            const by = packedBy(p);
            return (
              <Row
                key={p.id}
                first={i === 0}
                lead={<Tick done={by.length > 0} by={by[0] ?? null} label={p.text} onClick={can("packed") && me && !busy ? () => void pack(p) : undefined} />}
                title={p.text}
                sub={by.length ? `${say(C.packedBy, lang)} ${by.join(", ")}` : null}
                muted={by.length > 0}
              />
            );
          })}
        </Section>
      ) : null}
    </div>
  );
};
