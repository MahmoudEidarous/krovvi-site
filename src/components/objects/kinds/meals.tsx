"use client";

/**
 * Meals on the page, drawn as the app draws its screen (catch8
 * src/components/objects/kinds/meals): the reader's deck as the hero (drag
 * or tap yes and no; the yes that makes everyone's is the match), then the
 * week and every idea with where it stands. Who passed is never shown: only
 * how many said yes and who has not swiped. This page is where a family with
 * no app swipes.
 */

import { say, type Words } from "@/lib/objects";
import { DotLine, INK, Row, Section, STEP, dirOf, type Dot } from "../kit";
import type { KindPage } from "../types";
import { Deck } from "./meals/deck";

/** The view as the core sends it (catch8 kinds/meals.ts MealsView), the fields drawn here. */
interface Person {
  id: string;
  name: string;
  you: boolean;
}
export interface MealIdea {
  id: string;
  name: string;
  emoji: string;
  ingredients: string[];
  minutes: number | null;
  suggested: boolean;
  mine: "yes" | "no" | null;
  yes: number;
  of: number;
  waiting: Person[];
  match: boolean;
  out: boolean;
  planned: string[];
}
interface MealsView {
  solo: boolean;
  canSwipe: boolean;
  deck: MealIdea[];
  matches: MealIdea[];
  ideas: MealIdea[];
  week: Array<{ day: string; words: Words; today: boolean; meal: { name: string; emoji: string } | null }>;
}

const C = {
  yes: { en: "Yes", ar: "آه" },
  no: { en: "No", ar: "لأ" },
  swipedAll: { en: "You’ve swiped them all", ar: "خلّصت كل الأفكار" },
  week: { en: "This week", ar: "الأسبوع ده" },
  tonight: { en: "Tonight", ar: "النهارده" },
  matches: { en: "Everyone said yes", ar: "الكل قال آه" },
  picks: { en: "Your picks", ar: "اختياراتك" },
  ideas: { en: "All ideas", ar: "كل الأفكار" },
  notForAll: { en: "Not for everyone", ar: "مش للكل" },
  youSaidYes: { en: "You said yes", ar: "قلت آه" },
  youPassed: { en: "You passed", ar: "عدّيتها" },
  krovviIdea: { en: "Krovvi’s idea", ar: "فكرة كروفي" },
  yesLegend: { en: "Each dot is a yes", ar: "كل نقطة آه" },
  free: { en: "free", ar: "فاضي" },
  notYet: { en: "Not swiped yet", ar: "لسه محدش قال رأيه" },
} satisfies Record<string, Words>;

/** A list in its own words' comma: Arabic words take the Arabic one. */
export function listOf(items: string[]): string {
  return items.join(items.some((x) => /[\u0600-\u06FF]/.test(x)) ? "، " : ", ");
}

const minutes = (n: number): Words => ({ en: `${n} min`, ar: `${n} دقيقة` });
const yesOf = (yes: number, of: number): Words => ({ en: `${yes} of ${of} said yes`, ar: `${yes} من ${of} قالوا آه` });
const waitingOn = (names: string[]): Words => ({ en: `waiting on ${names.join(", ")}`, ar: `مستنيين ${names.join("، ")}` });

export function YesDots({ yes, of }: { yes: number; of: number }) {
  const dots: Dot[] = Array.from({ length: of }, (_, i) => ({ on: i < yes }));
  return <DotLine dots={dots} dot={9} gap={6} />;
}

function standing(i: MealIdea, solo: boolean, lang: "en" | "ar"): string {
  if (i.match) return say(solo ? C.picks : C.matches, lang);
  const parts: string[] = [];
  if (!solo) {
    if (i.out) parts.push(say(C.notForAll, lang));
    else if (!i.yes && i.waiting.length === i.of) parts.push(say(C.notYet, lang));
    else {
      parts.push(say(yesOf(i.yes, i.of), lang));
      if (i.waiting.length) parts.push(say(waitingOn(i.waiting.map((p) => p.name)), lang));
    }
  }
  if (i.mine) parts.push(say(i.mine === "yes" ? C.youSaidYes : C.youPassed, lang));
  return parts.join(" · ");
}

export const Page: KindPage = ({ view, lang, act, can, busy }) => {
  const v = view as MealsView;
  const cards = v.deck.map((i) => ({
    id: i.id,
    label: [i.name, i.minutes ? say(minutes(i.minutes), lang) : null, v.solo ? null : say(yesOf(i.yes, i.of), lang)].filter(Boolean).join(". "),
    render: () => (
      <div className="flex h-full flex-col items-center justify-center text-center" style={{ padding: "0 20px", gap: 8 }}>
        <span aria-hidden style={{ fontSize: 84, lineHeight: "96px" }}>
          {i.emoji}
        </span>
        <span style={{ ...STEP.display, fontSize: 30, lineHeight: "36px" }}>
          <bdi dir={dirOf(i.name)}>{i.name}</bdi>
        </span>
        <span style={{ ...STEP.body, color: INK.soft }}>{[i.minutes ? say(minutes(i.minutes), lang) : null, listOf(i.ingredients.slice(0, 4)) || null].filter(Boolean).join(" · ")}</span>
        {i.suggested ? <span style={{ ...STEP.meta, color: INK.muted }}>{say(C.krovviIdea, lang)}</span> : null}
        {!v.solo ? (
          <span className="flex items-center" style={{ gap: 10, marginTop: 8 }}>
            <YesDots yes={i.yes} of={i.of} />
            <span style={{ ...STEP.meta, color: INK.muted }}>{say(yesOf(i.yes, i.of), lang)}</span>
          </span>
        ) : null}
      </div>
    ),
  }));
  return (
    <div>
      {v.canSwipe ? (
        <div className="mb-4">
          <Deck
            cards={cards}
            disabled={busy || !can("swipe")}
            onSwipe={(id, yes) => void act("swipe", { idea: id, yes })}
            yesLabel={say(C.yes, lang)}
            noLabel={say(C.no, lang)}
            height={340}
            empty={
              <div className="flex h-full w-full items-center justify-center" style={{ background: INK.surface, borderRadius: 17 }}>
                <span style={STEP.title}>{say(C.swipedAll, lang)}</span>
              </div>
            }
          />
          {!v.solo && cards.length ? <p style={{ ...STEP.meta, color: INK.muted, textAlign: "center", marginTop: 8 }}>{say(C.yesLegend, lang)}</p> : null}
        </div>
      ) : null}
      <Section title={say(C.week, lang)}>
        <div className="flex justify-between" style={{ padding: "12px 12px" }}>
          {v.week.map((d) => (
            <div key={d.day} className="flex flex-1 flex-col items-center" style={{ gap: 6, padding: "8px 0", borderRadius: 11, background: d.today ? INK.surfaceHi : undefined }} aria-label={`${say(d.words, lang)}: ${d.meal ? d.meal.name : say(C.free, lang)}`}>
              <span style={{ ...STEP.meta, color: d.today ? INK.fg : INK.muted }}>{d.today ? say(C.tonight, lang) : say(d.words, lang)}</span>
              {d.meal ? (
                <span aria-hidden style={{ fontSize: 22, lineHeight: "28px" }}>
                  {d.meal.emoji}
                </span>
              ) : (
                <span className="rounded-full" style={{ width: 18, height: 18, border: `1.5px solid ${INK.faint}`, margin: "5px 0" }} />
              )}
            </div>
          ))}
        </div>
      </Section>
      {v.matches.length ? (
        <Section title={say(v.solo ? C.picks : C.matches, lang)}>
          {v.matches.map((i, n) => (
            <Row key={i.id} first={n === 0} lead={<span aria-hidden style={STEP.title}>{i.emoji}</span>} title={i.name} sub={i.planned.length ? listOf(i.planned.map((d) => { const w = v.week.find((x) => x.day === d)!; return w.today ? say(C.tonight, lang) : say(w.words, lang); })) : null} />
          ))}
        </Section>
      ) : null}
      {v.ideas.length ? (
        <Section title={`${say(C.ideas, lang)} · ${v.ideas.length}`}>
          {v.ideas.map((i, n) => (
            <Row key={i.id} first={n === 0} lead={<span aria-hidden style={STEP.title}>{i.emoji}</span>} title={i.name} sub={standing(i, v.solo, lang)} muted={i.out && !i.match} />
          ))}
        </Section>
      ) : null}
    </div>
  );
};
