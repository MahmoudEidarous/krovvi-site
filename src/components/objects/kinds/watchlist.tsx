"use client";

/**
 * The watchlist on the page, drawn as the app draws its screen (catch8
 * src/components/objects/kinds/watchlist): tonight's pick raised when there
 * is one, the reader's deck as the hero, then what everyone wants, what is
 * still to watch with who said it and where, and what has been watched. A
 * title draws its own tile (its initials in dots on its own tint): there is
 * no poster service in this build. Who passed is never shown.
 */

import { say, type Words } from "@/lib/objects";
import { FaceStack, INK, Pill, Row, Section, STEP, Tick, dirOf } from "../kit";
import type { KindPage } from "../types";
import { Deck } from "./meals/deck";
import { NameTile } from "./name-tile";
import { YesDots } from "./meals";

/** The view as the core sends it (catch8 kinds/watchlist.ts WatchView), the fields drawn here. */
interface Person {
  id: string;
  name: string;
  you: boolean;
}
interface WatchTitle {
  id: string;
  name: string;
  type: "movie" | "show" | null;
  year: number | null;
  from: Array<{ name: string; id: string | null }>;
  where: string | null;
  initials: string;
  tint: number;
  watched: { at: number; by: Person | null } | null;
  mine: "yes" | "no" | null;
  yes: number;
  of: number;
  waiting: Person[];
  match: boolean;
  out: boolean;
  faces: Person[];
}
interface WatchView {
  solo: boolean;
  canSwipe: boolean;
  deck: WatchTitle[];
  matches: WatchTitle[];
  tonight: WatchTitle | null;
  list: WatchTitle[];
  watched: WatchTitle[];
  counts: { list: number; watched: number; toSwipe: number };
}

const C = {
  yes: { en: "Yes", ar: "آه" },
  no: { en: "No", ar: "لأ" },
  tonight: { en: "Tonight", ar: "النهارده" },
  everyoneWants: { en: "Everyone wants", ar: "الكل عايز" },
  toWatch: { en: "To watch", ar: "نتفرج عليه" },
  watched: { en: "Watched", ar: "اتشاف" },
  markWatched: { en: "Watched", ar: "اتفرجنا" },
  notWatched: { en: "Not watched", ar: "لسه" },
  swipedAll: { en: "Nothing left to swipe", ar: "مفيش حاجة تانية" },
  movie: { en: "Film", ar: "فيلم" },
  show: { en: "Show", ar: "مسلسل" },
  everyoneSaidYes: { en: "Everyone said yes", ar: "الكل قال آه" },
  yourPick: { en: "Your pick", ar: "اختيارك" },
  notForAll: { en: "Not for everyone", ar: "مش للكل" },
  youSaidYes: { en: "You said yes", ar: "قلت آه" },
  youPassed: { en: "You passed", ar: "عدّيته" },
  yesLegend: { en: "Each dot is a yes", ar: "كل نقطة آه" },
  notYet: { en: "Not swiped yet", ar: "لسه محدش قال رأيه" },
} satisfies Record<string, Words>;

const saidBy = (names: string[]): Words => ({ en: `${names.join(" and ")} said`, ar: `${names.join(" و")} رشّح` });
const yesOf = (yes: number, of: number): Words => ({ en: `${yes} of ${of} said yes`, ar: `${yes} من ${of} قالوا آه` });

function aboutOf(t: WatchTitle, lang: "en" | "ar"): string {
  return [t.from.length ? say(saidBy(t.from.map((f) => f.name)), lang) : null, t.where, t.type ? say(t.type === "movie" ? C.movie : C.show, lang) : null, t.year ? String(t.year) : null].filter(Boolean).join(" · ");
}

function standing(t: WatchTitle, solo: boolean, lang: "en" | "ar"): string {
  const parts: string[] = [];
  if (t.match) parts.push(say(solo ? C.yourPick : C.everyoneSaidYes, lang));
  else if (!solo) parts.push(t.out ? say(C.notForAll, lang) : !t.yes && t.waiting.length === t.of ? say(C.notYet, lang) : say(yesOf(t.yes, t.of), lang));
  if (t.mine && !t.match) parts.push(say(t.mine === "yes" ? C.youSaidYes : C.youPassed, lang));
  return parts.join(" · ");
}

export const Page: KindPage = ({ view, lang, act, can, busy }) => {
  const v = view as WatchView;
  const pick = v.tonight;
  const others = v.matches.filter((t) => t.id !== pick?.id);
  const rest = v.list.filter((t) => !t.match);
  const cards = v.deck.map((t) => ({
    id: t.id,
    label: [t.name, aboutOf(t, lang), v.solo ? null : say(yesOf(t.yes, t.of), lang)].filter(Boolean).join(". "),
    render: () => (
      <div className="flex h-full flex-col items-center justify-center text-center" style={{ padding: "0 20px", gap: 10 }}>
        <NameTile t={t} size={132} radius={17} fallback={t.type === "show" ? "show" : "film"} />
        <span style={{ ...STEP.display, fontSize: 28, lineHeight: "34px" }}>
          <bdi dir={dirOf(t.name)}>{t.name}</bdi>
        </span>
        <span style={{ ...STEP.body, color: INK.soft }}>{aboutOf(t, lang)}</span>
        {!v.solo ? <YesDots yes={t.yes} of={t.of} /> : null}
      </div>
    ),
  }));
  const row = (t: WatchTitle, i: number) => {
    const op = t.watched ? "unwatched" : "watched";
    return (
      <Row
        key={t.id}
        first={i === 0}
        lead={<NameTile t={t} size={40} fallback={t.type === "show" ? "show" : "film"} />}
        title={t.name}
        sub={t.watched ? aboutOf(t, lang) : [aboutOf(t, lang), standing(t, v.solo, lang)].filter(Boolean).join(" · ")}
        muted={!!t.watched}
        value={
          <span className="flex items-center" style={{ gap: 10 }}>
            {t.match && !t.watched ? <FaceStack names={t.faces.map((f) => f.name)} size={20} /> : null}
            <Tick done={!!t.watched} by={t.watched?.by?.name ?? null} size={24} onClick={can(op) && !busy ? () => void act(op, { title: t.id }) : undefined} label={`${say(t.watched ? C.notWatched : C.markWatched, lang)}: ${t.name}`} />
          </span>
        }
      />
    );
  };
  return (
    <div>
      {pick ? (
        <section className="mb-3 flex items-center" style={{ gap: 14, background: INK.surfaceHi, borderRadius: 17, padding: 16 }} aria-label={`${say(C.tonight, lang)}: ${pick.name}`}>
          <NameTile t={pick} size={88} fallback={pick.type === "show" ? "show" : "film"} />
          <div className="flex min-w-0 flex-1 flex-col" style={{ gap: 4 }}>
            <span style={{ ...STEP.label, color: INK.muted }}>{say(C.tonight, lang)}</span>
            <span style={STEP.title}>
              <bdi dir={dirOf(pick.name)}>{pick.name}</bdi>
            </span>
            <span style={{ ...STEP.meta, color: INK.soft }}>{aboutOf(pick, lang)}</span>
            {!v.solo ? <FaceStack names={pick.faces.map((f) => f.name)} size={22} /> : null}
          </div>
          {can("watched") ? <Pill text={say(C.markWatched, lang)} strong disabled={busy} onClick={() => void act("watched", { title: pick.id })} /> : null}
        </section>
      ) : null}
      {v.canSwipe && (cards.length || !pick) ? (
        <div className="mb-4">
          <Deck lang={lang}
            cards={cards}
            disabled={busy || !can("swipe")}
            onSwipe={(id, yes) => void act("swipe", { title: id, yes })}
            yesLabel={say(C.yes, lang)}
            noLabel={say(C.no, lang)}
            empty={
              <div className="flex h-full w-full items-center justify-center" style={{ background: INK.surface, borderRadius: 17 }}>
                <span style={STEP.title}>{say(C.swipedAll, lang)}</span>
              </div>
            }
          />
          {!v.solo && cards.length ? <p style={{ ...STEP.meta, color: INK.muted, textAlign: "center", marginTop: 8 }}>{say(C.yesLegend, lang)}</p> : null}
        </div>
      ) : null}
      {others.length ? <Section title={say(C.everyoneWants, lang)}>{others.map(row)}</Section> : null}
      {rest.length ? <Section title={`${say(C.toWatch, lang)} · ${rest.length}`}>{rest.map(row)}</Section> : null}
      {v.watched.length ? <Section title={`${say(C.watched, lang)} · ${v.counts.watched}`}>{v.watched.slice(0, 8).map(row)}</Section> : null}
    </div>
  );
};
