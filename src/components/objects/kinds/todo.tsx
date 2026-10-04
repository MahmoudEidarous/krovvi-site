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
  counts: { open: number; done: number; late: number; total: number };
  allClear: boolean;
  tally: { dots: Array<{ done: boolean; by: string | null }>; perDot: number };
  leftWords: Words;
  shared: boolean;
  people: Array<Person & { open: number; done: number }>;
}

const C = {
  toDo: { en: "To do", ar: "المطلوب" },
  done: { en: "Done", ar: "خلصانة" },
  allClear: { en: "All clear", ar: "كله خلص" },
  yours: { en: "Yours", ar: "عليك" },
  you: { en: "You", ar: "إنت" },
  tick: { en: "Tick", ar: "خلّص" },
  untick: { en: "Not done", ar: "لسه" },
  showAll: { en: "Show all", ar: "اعرض الكل" },
  whoHas: { en: "Who has what", ar: "كل واحد عليه إيه" },
  empty: { en: "Nothing on it yet", ar: "لسه فاضية" },
} satisfies Record<string, Words>;

const lateOn = (due: Words): Words => ({ en: `Due ${/^(Yesterday|Today|Tomorrow|Tonight)\b/.test(due.en) ? `${due.en.charAt(0).toLowerCase()}${due.en.slice(1)}` : due.en}`, ar: `كانت ${due.ar}` });
const lateCount = (n: number, lang: "en" | "ar") => (lang === "ar" ? (n === 1 ? "واحدة متأخرة" : `${n} متأخرين`) : n === 1 ? "1 is late" : `${n} are late`);
const leftAndDone = (open: number, done: number, lang: "en" | "ar") =>
  lang === "ar" ? (done ? `${open} مطلوب · ${done} خلصانة` : `${open} مطلوب`) : done ? `${open} to do · ${done} done` : `${open} to do`;
const personLine = (open: number, done: number): Words => ({ en: `${open} to do, ${done} done`, ar: `عليه ${open}، خلّص ${done}` });

/** Under a task: who did it (ticked), else who it is for, and where it came from. Its day is across from it. */
function subOf(t: TodoTask, lang: "en" | "ar"): string {
  const parts: string[] = [];
  if (t.done) parts.push(t.done.by?.you ? (lang === "ar" ? "إنت عملتها" : "Done by you") : lang === "ar" ? `عملها ${t.done.by?.name ?? ""}` : `Done by ${t.done.by?.name ?? ""}`);
  else if (t.who) parts.push(t.who.you ? say(C.yours, lang) : t.who.name);
  if (t.from?.label) parts.push(lang === "ar" ? `من ${t.from.label}` : `From ${t.from.label}`);
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
        lead={<Tick done={!!t.done} onClick={can(op) && !busy ? () => void act(op, { task: t.id }) : undefined} label={`${say(t.done ? C.untick : C.tick, lang)}: ${t.text}`} />}
        title={t.text}
        sub={subOf(t, lang) || null}
        muted={!!t.done}
        value={
          t.dueWords && !t.done ? (
            <span style={{ ...STEP.meta, color: t.when === "late" ? INK.warm : t.when === "today" ? INK.soft : INK.muted, whiteSpace: "nowrap" }}>{say(t.when === "late" ? lateOn(t.dueWords) : t.dueWords, lang)}</span>
          ) : undefined
        }
      />
    );
  };
  return (
    <div>
      <section className="mb-3 flex items-center" style={{ background: INK.surface, borderRadius: 17, padding: "16px", gap: 16 }}>
        <span className="min-w-0 flex-1">
          <span className="block" style={STEP.title}>
            {v.allClear ? say(C.allClear, lang) : v.counts.total ? leftAndDone(v.counts.open, v.counts.done, lang) : say(C.empty, lang)}
          </span>
          {v.counts.late ? <span className="block" style={{ ...STEP.meta, color: INK.warm }}>{lateCount(v.counts.late, lang)}</span> : null}
        </span>
        {v.counts.total ? (
          <div style={{ maxWidth: 12 * 10 + 11 * 5 }}>
            <DotLine dots={dots} dot={8} gap={5} label={`${v.counts.total}, ${v.counts.done}`} />
          </div>
        ) : null}
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
