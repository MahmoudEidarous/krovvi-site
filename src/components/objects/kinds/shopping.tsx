"use client";

/**
 * Shopping on the page, drawn as the app draws its screen (catch8
 * src/components/objects/kinds/shopping): who is at the store, the tiles by
 * aisle as the hero (a tap puts a thing in the cart), the cart as dots in the
 * tint of who got each thing, and what was bought before, one tap from the
 * list again. For a partner without the app this page is the list itself.
 */

import { say, type Words } from "@/lib/objects";
import { DotLine, Face, INK, Pill, Section, STEP, dirOf, tintOf, type Dot } from "../kit";
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
  emoji: string;
  qty: string | null;
  for: string[];
  fresh: boolean;
  got: { at: number; by: Person | null } | null;
}
interface ShoppingView {
  aisles: Array<{ aisle: string; words: Words; tiles: ShopTile[] }>;
  cart: ShopTile[];
  recent: Array<{ id: string; name: string; emoji: string }>;
  shopping: Array<Person & { since: number }>;
  counts: { open: number; cart: number; had: number };
  allGot: boolean;
  leftWords: Words;
}

const C = {
  inCart: { en: "In the cart", ar: "في العربية" },
  cartLegend: { en: "Each dot is a thing in the cart, in the color of who got it", ar: "كل نقطة حاجة في العربية، بلون اللي جابها" },
  atStore: { en: "I’m at the store", ar: "أنا في المحل" },
  youAtStore: { en: "You’re at the store", ar: "إنت في المحل" },
  before: { en: "Bought before", ar: "اتجاب قبل كده" },
  emptyHint: { en: "Nothing on the list", ar: "القايمة فاضية" },
  got: { en: "Got it", ar: "جبتها" },
  putBack: { en: "Put back on the list", ar: "رجّعها للقايمة" },
  addAgain: { en: "Add again", ar: "ضيفها تاني" },
  isAt: { en: "is at the store", ar: "في المحل" },
  fresh: { en: "New", ar: "جديد" },
} satisfies Record<string, Words>;

const forMeals = (meals: string[]): Words => ({ en: `for ${meals.join(", ")}`, ar: `لـ ${meals.join("، ")}` });

function Chip({ emoji, name, onClick, label, struck }: { emoji: string; name: string; onClick?: () => void; label: string; struck?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={!onClick} aria-label={label} className="inline-flex items-center rounded-full active:scale-[0.97]" style={{ gap: 6, padding: "0 10px", height: 32, background: INK.surfaceHi, transition: "transform 110ms" }}>
      <span aria-hidden>{emoji}</span>
      <span style={{ ...STEP.label, color: INK.soft, textDecoration: struck ? "line-through" : undefined }}>
        <bdi dir={dirOf(name)}>{name}</bdi>
      </span>
    </button>
  );
}

export const Page: KindPage = ({ view, lang, act, can, busy }) => {
  const v = view as ShoppingView;
  const shopper = v.shopping[0];
  const cartDots: Dot[] = v.cart.map((t) => ({ on: true, tint: t.got?.by ? tintOf(t.got.by.name) : INK.fg }));
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
        <section className="mb-3" style={{ background: INK.surface, borderRadius: 17, padding: "4px 12px 12px" }}>
          {v.aisles.map((a) => (
            <div key={a.aisle} style={{ paddingTop: 10 }}>
              <h3 style={{ ...STEP.label, color: INK.muted, padding: "0 4px 8px" }}>{say(a.words, lang)}</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4" style={{ gap: 8 }}>
                {a.tiles.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    disabled={!can("got") || busy}
                    onClick={() => void act("got", { item: t.id })}
                    aria-label={`${t.name}${t.qty ? `, ${t.qty}` : ""}. ${say(C.got, lang)}`}
                    className="relative flex flex-col items-center justify-center active:scale-[0.96]"
                    style={{ minHeight: 104, borderRadius: 11, background: INK.surfaceHi, padding: "10px 6px", gap: 4, transition: "transform 110ms" }}
                  >
                    <span aria-hidden style={{ fontSize: 32, lineHeight: "38px" }}>
                      {t.emoji}
                    </span>
                    <span style={{ ...STEP.label, fontWeight: 500, textAlign: "center" }}>
                      <bdi dir={dirOf(t.name)}>{t.name}</bdi>
                    </span>
                    {t.for.length ? <span style={{ ...STEP.meta, color: INK.muted }}>{say(forMeals(t.for), lang)}</span> : null}
                    {t.qty ? (
                      <span className="absolute" style={{ top: 6, insetInlineEnd: 6, ...STEP.meta, color: INK.soft, background: INK.surface, borderRadius: 9, padding: "1px 6px" }}>
                        <bdi dir={dirOf(t.qty)}>{t.qty}</bdi>
                      </span>
                    ) : null}
                    {t.fresh ? (
                      <span className="absolute" style={{ top: 6, insetInlineStart: 8, ...STEP.meta, fontWeight: 600, color: INK.soft }}>
                        {say(C.fresh, lang)}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>
      ) : (
        <section className="mb-3 flex flex-col items-center" style={{ background: INK.surface, borderRadius: 17, padding: "28px 16px", gap: 10 }}>
          <span style={{ ...STEP.display, textAlign: "center" }}>{say(v.leftWords, lang)}</span>
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
          <div className="flex flex-col" style={{ padding: "12px 16px", gap: 10 }}>
            <DotLine dots={cartDots} dot={10} gap={6} label={`${say(C.inCart, lang)}: ${v.counts.cart}`} />
            <div className="flex flex-wrap" style={{ gap: 6 }}>
              {v.cart.map((t) => (
                <Chip key={t.id} emoji={t.emoji} name={t.name} struck onClick={can("ungot") && !busy ? () => void act("ungot", { item: t.id }) : undefined} label={`${t.name}. ${say(C.putBack, lang)}`} />
              ))}
            </div>
            <span style={{ ...STEP.meta, color: INK.muted }}>{say(C.cartLegend, lang)}</span>
          </div>
        </Section>
      ) : null}
      {v.recent.length ? (
        <Section title={say(C.before, lang)}>
          <div className="flex flex-wrap" style={{ padding: "12px 16px", gap: 6 }}>
            {v.recent.map((r) => (
              <Chip key={r.id} emoji={r.emoji} name={r.name} onClick={can("add") && !busy ? () => void act("add", { items: [{ name: r.name }] }) : undefined} label={`${r.name}. ${say(C.addAgain, lang)}`} />
            ))}
          </div>
        </Section>
      ) : null}
    </div>
  );
};
