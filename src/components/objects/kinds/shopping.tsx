"use client";

/**
 * Shopping on the page, drawn as the app draws its screen (catch8
 * src/components/objects/kinds/shopping): who is at the store, what is
 * left aisle by aisle as rows a thumb can tick (a tick puts a thing in the
 * cart), the cart with who got what, and what was bought before, one tap
 * from the list again. For a partner without the app this page is the list.
 */

import { say, type Words, iso } from "@/lib/objects";
import { Face, INK, Pill, Row, Section, STEP, Tick, dirOf } from "../kit";
import type { KindPage } from "../types";

/** The view as the core sends it (catch8 kinds/shopping.ts ShoppingView), the fields drawn here. */
interface Person {
  id: string;
  name: string;
  you: boolean;
}
interface ShopTile {
  id: string;
  name: string;
  qty: string | null;
  note: string | null;
  addedBy: Person | null;
  for: string[];
  fresh: boolean;
  got: { at: number; by: Person | null } | null;
}
interface ShoppingView {
  aisles: Array<{ aisle: string; words: Words; tiles: ShopTile[] }>;
  cart: ShopTile[];
  recent: Array<{ id: string; name: string }>;
  shopping: Array<Person & { since: number }>;
  counts: { open: number; cart: number; had: number };
  allGot: boolean;
  leftWords: Words;
}

const C = {
  inCart: { en: "In the cart", ar: "في العربية" },
  atStore: { en: "I’m at the store", ar: "أنا في المحل" },
  youAtStore: { en: "You’re at the store", ar: "إنت في المحل" },
  before: { en: "Bought before", ar: "اتجاب قبل كده" },
  beforeHint: { en: "Tap one to put it back on the list.", ar: "دوس على أي واحدة ترجعها للقايمة." },
  emptyHint: { en: "Things to get show here when someone adds them.", ar: "الحاجات المطلوبة بتظهر هنا أول ما حد يضيفها." },
  got: { en: "Got it", ar: "جبتها" },
  putBack: { en: "Put back on the list", ar: "رجّعها للقايمة" },
  addAgain: { en: "Add again", ar: "ضيفها تاني" },
  isAt: { en: "is at the store", ar: "في المحل" },
  fresh: { en: "New", ar: "جديد" },
} satisfies Record<string, Words>;

const forMeals = (meals: string[]): Words => ({ en: `for ${meals.map(iso).join(", ")}`, ar: `لـ ${meals.map(iso).join("، ")}` });
const gotBy = (p: Person | null, lang: "en" | "ar") => (p?.you ? (lang === "ar" ? "إنت جبتها" : "You got it") : p ? (lang === "ar" ? `${iso(p.name)} جابها` : `${iso(p.name)} got it`) : lang === "ar" ? "اتجابت" : "Got");

/** Under a thing: how much, the note, the meals it is for, and who added it when someone else did. */
function subOf(t: ShopTile, lang: "en" | "ar"): string | null {
  const parts = [t.qty, t.note ? iso(t.note) : null, t.for.length ? say(forMeals(t.for), lang) : null, t.fresh && t.addedBy && !t.addedBy.you ? (lang === "ar" ? `ضافها ${iso(t.addedBy.name)}` : `Added by ${iso(t.addedBy.name)}`) : null].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

export const Page: KindPage = ({ view, lang, act, can, busy }) => {
  const v = view as ShoppingView;
  const shopper = v.shopping[0];
  const youShop = v.shopping.some((s) => s.you);
  return (
    <div>
      {shopper ? (
        <div className="mb-3 flex items-center" style={{ gap: 12, background: INK.surfaceHi, borderRadius: 17, padding: "12px 16px" }}>
          <Face name={shopper.name} size={28} />
          <span style={{ ...STEP.body, fontWeight: 500 }}>
            {shopper.you ? say(C.youAtStore, lang) : (
              <>
                <bdi dir={dirOf(shopper.name)}>{shopper.name}</bdi> {say(C.isAt, lang)}
              </>
            )}
          </span>
        </div>
      ) : null}
      {v.counts.open ? (
        <section className="mb-3" style={{ background: INK.surface, borderRadius: 17, paddingBottom: 4 }}>
          {v.aisles.map((a, n) => (
          <div key={a.aisle}>
            <h3 style={{ ...STEP.label, color: INK.muted, padding: `${n ? 18 : 12}px 16px 2px` }}>{say(a.words, lang)}</h3>
            {a.tiles.map((t, i) => (
              <Row
                key={t.id}
                first={i === 0}
                lead={<Tick done={false} label={`${say(C.got, lang)}: ${t.name}`} onClick={can("got") && !busy ? () => void act("got", { item: t.id }) : undefined} />}
                title={t.name}
                sub={subOf(t, lang)}
                value={t.fresh ? <span style={{ ...STEP.meta, color: INK.soft, fontWeight: 600 }}>{say(C.fresh, lang)}</span> : undefined}
              />
            ))}
          </div>
          ))}
        </section>
      ) : (
        <section className="mb-3 flex flex-col items-center" style={{ background: INK.surface, borderRadius: 17, padding: "28px 16px", gap: 10 }}>
          <span style={{ ...STEP.title, textAlign: "center" }}>{say(v.leftWords, lang)}</span>
          {!v.allGot ? <span style={{ ...STEP.meta, color: INK.muted }}>{say(C.emptyHint, lang)}</span> : null}
        </section>
      )}
      {!youShop && can("here") && v.counts.open ? (
        <div className="mb-3 flex justify-center">
          <Pill text={say(C.atStore, lang)} strong disabled={busy} onClick={() => void act("here")} />
        </div>
      ) : null}
      {v.counts.cart ? (
        <Section title={`${say(C.inCart, lang)} · ${v.counts.cart}`}>
          {v.cart.map((t, i) => (
            <Row
              key={t.id}
              first={i === 0}
              muted
              lead={<Tick done label={`${t.name}. ${say(C.putBack, lang)}`} onClick={can("ungot") && !busy ? () => void act("ungot", { item: t.id }) : undefined} />}
              title={t.name}
              sub={gotBy(t.got?.by ?? null, lang)}
            />
          ))}
        </Section>
      ) : null}
      {v.recent.length ? (
        <Section title={say(C.before, lang)}>
          <div className="flex flex-wrap" style={{ padding: "8px 16px 4px", gap: 6 }}>
            {v.recent.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={can("add") && !busy ? () => void act("add", { items: [{ name: r.name }] }) : undefined}
                disabled={!can("add") || busy}
                aria-label={`${r.name}. ${say(C.addAgain, lang)}`}
                className="inline-flex items-center rounded-full active:scale-[0.97]"
                style={{ padding: "0 12px", height: 32, background: INK.surfaceHi, transition: "transform 110ms" }}
              >
                <span style={{ ...STEP.label, color: INK.soft }}>
                  <bdi dir={dirOf(r.name)}>{r.name}</bdi>
                </span>
              </button>
            ))}
          </div>
          {can("add") ? <div style={{ ...STEP.meta, color: INK.muted, padding: "6px 16px 12px" }}>{say(C.beforeHint, lang)}</div> : <div style={{ height: 8 }} />}
        </Section>
      ) : null}
    </div>
  );
};
