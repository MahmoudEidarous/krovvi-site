"use client";

/**
 * To-do on the page, drawn as the app draws its screen (catch8
 * src/components/objects/kinds/todo): the tally as the hero (what is left in
 * display type, one dot per task in the tint of whoever ticked it), then what
 * is left with a tick each, then what is done. A guest ticks with their own
 * face; nobody edits, moves or clears from the page.
 */

import { useState } from "react";

import { say, type Words } from "@/lib/objects";
import { DotLine, Face, INK, Pill, Row, Section, STEP, Tick, dirOf, tintOf, type Dot } from "../kit";
import type { KindPage } from "../types";

/** The view as the core sends it (catch8 supabase/functions/_shared/objects/kinds/todo.ts TodoView), the fields drawn here. */
interface Person {
  id: string;
  name: string;
  you: boolean;
}
interface TodoTask {
  id: string;
  text: string;
  when: "late" | "today" | "tomorrow" | "soon" | "later" | null;
  dueWords: Words | null;
  who: Person | null;
  done: { at: number; by: Person | null } | null;
  from: { label: string | null } | null;
}
interface TodoView {
  open: TodoTask[];
  done: TodoTask[];
  counts: { open: number; done: number; total: number };
  tally: { dots: Array<{ done: boolean; by: string | null }>; perDot: number };
  leftWords: Words;
  shared: boolean;
  people: Array<Person & { open: number; done: number }>;
}

const C = {
  toDo: { en: "To do", ar: "المطلوب" },
  done: { en: "Done", ar: "خلصانة" },
  legend: { en: "Each dot is a task, filled in the color of who did it", ar: "كل نقطة مهمة، ومليانة بلون اللي عملها" },
  late: { en: "Late", ar: "متأخرة" },
  yours: { en: "Yours", ar: "عليك" },
  you: { en: "You", ar: "إنت" },
  tick: { en: "Tick", ar: "خلّص" },
  untick: { en: "Not done", ar: "لسه" },
  showAll: { en: "Show all", ar: "اعرض الكل" },
  whoHas: { en: "Who has what", ar: "كل واحد عليه إيه" },
  empty: { en: "Nothing on it yet", ar: "لسه فاضية" },
} satisfies Record<string, Words>;

const lateOn = (due: Words): Words => ({ en: `Late, ${due.en}`, ar: `متأخرة، ${due.ar}` });
const personLine = (open: number, done: number): Words => ({ en: `${open} to do, ${done} done`, ar: `عليه ${open}، خلّص ${done}` });

function subOf(t: TodoTask, lang: "en" | "ar"): string {
  const parts: string[] = [];
  if (t.dueWords && !t.done) parts.push(say(t.when === "late" ? lateOn(t.dueWords) : t.dueWords, lang));
  if (t.who && !t.done) parts.push(t.who.you ? say(C.yours, lang) : t.who.name);
  if (t.done?.by) parts.push(t.done.by.you ? say(C.you, lang) : t.done.by.name);
  if (t.from?.label) parts.push(t.from.label);
  return parts.join(" · ");
}

export const Page: KindPage = ({ page, view, lang, act, can, busy }) => {
  const v = view as TodoView;
  const [allDone, setAllDone] = useState(false);
  // Who ticked each dot, by name for its tint: from the view's own people first, since a card frozen in a shared chat comes with no members.
  const names = new Map<string, string>();
  for (const t of [...v.open, ...v.done]) {
    if (t.who) names.set(t.who.id, t.who.name);
    if (t.done?.by) names.set(t.done.by.id, t.done.by.name);
  }
  for (const p of v.people) names.set(p.id, p.name);
  for (const m of page.members) names.set(m.id, m.name);
  const dots: Dot[] = v.tally.dots.map((d) => {
    const name = d.by ? names.get(d.by) : undefined;
    return { on: d.done, tint: name ? tintOf(name) : INK.fg };
  });
  const done = allDone ? v.done : v.done.slice(0, 6);
  const row = (t: TodoTask, i: number) => {
    const op = t.done ? "untick" : "tick";
    return (
      <Row
        key={t.id}
        first={i === 0}
        lead={<Tick done={!!t.done} by={t.done?.by?.name ?? null} onClick={can(op) && !busy ? () => void act(op, { task: t.id }) : undefined} label={`${say(t.done ? C.untick : C.tick, lang)}: ${t.text}`} />}
        title={t.text}
        sub={subOf(t, lang) || null}
        muted={!!t.done}
        value={t.who && !t.done && !t.who.you ? <Face name={t.who.name} size={24} /> : undefined}
      />
    );
  };
  return (
    <div>
      <section className="mb-3 flex flex-col items-center" style={{ background: INK.surface, borderRadius: 17, padding: "24px 16px", gap: 18 }}>
        <span style={{ ...STEP.display, textAlign: "center" }}>
          <bdi dir={dirOf(say(v.leftWords, lang))}>{say(v.leftWords, lang)}</bdi>
        </span>
        {v.counts.total ? (
          <div style={{ maxWidth: 10 * 14 + 9 * 8 }}>
            <DotLine dots={dots} dot={12} gap={8} label={`${v.counts.total}, ${v.counts.done}`} />
          </div>
        ) : null}
        <span style={{ ...STEP.meta, color: INK.muted, textAlign: "center" }}>{v.counts.total ? say(C.legend, lang) : say(C.empty, lang)}</span>
      </section>
      {v.open.length ? <Section title={`${say(C.toDo, lang)} · ${v.open.length}`}>{v.open.map(row)}</Section> : null}
      {v.done.length ? (
        <Section title={`${say(C.done, lang)} · ${v.done.length}`}>
          {done.map(row)}
          {!allDone && v.done.length > 6 ? (
            <div className="flex justify-center" style={{ padding: "10px 0" }}>
              <Pill text={`${say(C.showAll, lang)} (${v.done.length})`} onClick={() => setAllDone(true)} />
            </div>
          ) : null}
        </Section>
      ) : null}
      {v.shared ? (
        <Section title={say(C.whoHas, lang)}>
          {v.people.map((p, i) => (
            <Row key={p.id} first={i === 0} lead={<Face name={p.name} size={28} />} title={p.you ? `${p.name} (${say(C.you, lang)})` : p.name} sub={say(personLine(p.open, p.done), lang)} />
          ))}
        </Section>
      ) : null}
    </div>
  );
};
