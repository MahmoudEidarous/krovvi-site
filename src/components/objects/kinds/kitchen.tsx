"use client";

/**
 * Kitchen on the page, drawn as the app draws its screens (catch8
 * src/components/objects/kinds/kitchen): for someone of the house standing
 * in a shop or planning the week, with no app. First the grocery list: what
 * is left, aisle by aisle in the order the store is walked, each with a tick
 * a thumb can hit (a tick drops it in the cart); a box that adds what is
 * missing; who is at the store; the cart with the one tap that clears it;
 * and what is always bought or was bought before, a tap from the list again.
 * Then the week's meals day by day: tonight's with the way to mark it
 * cooked, and any day opened to plan it or free it. Then every recipe kept,
 * each opened whole to read.
 *
 * A tap answers at once: a tick shows before the server says yes and goes
 * back if it did not go through. Taps reach the server one after another in
 * the order they were made, so three things ticked in a hurry are three
 * things ticked.
 */

import { useEffect, useRef, useState } from "react";

import { iso, say, type Lang } from "@/lib/objects";
import { Count, FaceStack, INK, Pill, Section, STEP, dirOf, listOnly } from "../kit";
import type { KindPage } from "../types";
import { C, CALLS, DOT, SLOT_NAMES, SLOT_ORDER, atTheStore, dayWords, findRecipes, fold, forMeals, isCooking, minsWords, readThings, recipesCount, servesWords, tickLabel, youAtStore, type Day, type Item, type KitchenView, type Meal, type Slot } from "./kitchen/parts";
import { DaySheet, ItemSheet, RecipeRow, RecipeSheet, TINT } from "./kitchen/sheets";
import { Box, Chip, TickArea, Wide, useRun, wash } from "./sheet";
import { dayLetter } from "./when";

/** How many recipes show before "Show all". */
const FIRST_RECIPES = 6;

/** One thing on the list or in the cart: its tick, its name, what is known about it, and who added it when someone else did. */
function ThingRow({ item, done, by, first, lang, who, onTick, onOpen }: { item: Item; done: boolean; by?: string | null; first: boolean; lang: Lang; /** Who added it, when it was not the reader. */ who: string | null; onTick?: () => void; onOpen?: () => void }) {
  const sub = [item.amount ? say(item.amount, lang) : null, item.note, item.store, item.for.length ? say(forMeals(item.for), lang) : null].filter(Boolean).join(DOT);
  const words = (
    <>
      <span className="block" style={{ ...STEP.body, color: done ? INK.muted : INK.fg, textAlign: "start" }}>
        <bdi dir={dirOf(item.name)}>{item.name}</bdi>
      </span>
      {sub ? (
        <span className="block" style={{ ...STEP.meta, color: INK.muted, textAlign: "start" }}>
          {listOnly(sub) ? <span>{sub}</span> : <bdi dir={dirOf(sub)}>{sub}</bdi>}
        </span>
      ) : null}
    </>
  );
  return (
    <div>
      {first ? null : <div style={{ height: 0.5, background: INK.line, marginInlineStart: 16 }} />}
      <div className="flex items-center" style={{ gap: 12, padding: "0 16px", minHeight: 52 }}>
        {/* A ring is drawn only for a reader who may tick it; a thing in the cart shows its check to everyone. */}
        {onTick || done ? <TickArea done={done} by={by} label={say(tickLabel(item.name, done), lang)} onClick={onTick} /> : null}
        {onOpen ? (
          <button type="button" onClick={onOpen} className="min-w-0 flex-1 self-stretch text-start active:opacity-70" style={{ padding: "9px 0" }}>
            {words}
          </button>
        ) : (
          <span className="min-w-0 flex-1" style={{ padding: "9px 0" }}>
            {words}
          </span>
        )}
        {item.fresh || who ? (
          <span className="shrink-0" style={{ ...STEP.meta, color: item.fresh ? INK.soft : INK.muted, fontWeight: item.fresh ? 600 : 400, maxWidth: "36%", textAlign: "end" }}>
            {item.fresh ? say(C.fresh, lang) : null}
            {item.fresh && who ? DOT : null}
            {who ? <bdi dir={dirOf(who)}>{who}</bdi> : null}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** Things to put back on the list in one tap each (what is always bought, what was bought before). */
function Again({ title, things, lang, first, onAdd }: { title: string; things: Array<{ id: string; name: string }>; lang: Lang; first: boolean; onAdd: (thing: { id: string; name: string }) => void }) {
  return (
    <div>
      <h3 style={{ ...STEP.label, color: INK.muted, padding: `${first ? 12 : 14}px 16px 4px`, textAlign: "start" }}>{title}</h3>
      <div className="flex flex-wrap" style={{ padding: "4px 16px 2px", gap: 6 }}>
        {things.map((x) => (
          <button key={x.id} type="button" onClick={() => onAdd(x)} aria-label={`${x.name}. ${say(C.addAgain, lang)}`} className="inline-flex items-center rounded-full active:scale-[0.97]" style={{ padding: "0 12px", height: 34, background: INK.surfaceHi, transition: "transform 110ms" }}>
            <span style={{ ...STEP.label, color: INK.soft }}>
              <bdi dir={dirOf(x.name)}>{x.name}</bdi>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** A meal that was cooked: the app's small check, in Kitchen's colour. */
function CookedMark() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" aria-hidden className="shrink-0">
      <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={TINT} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const Page: KindPage = ({ page, view, lang, act, can }) => {
  const v = view as KitchenView;
  const may = (op: string) => page.state === "live" && can(op);
  const me = page.members.find((m) => m.you) ?? null;
  const several = v.people.length > 1;

  const [openItem, setOpenItem] = useState<string | null>(null);
  const [planning, setPlanning] = useState<{ day: string; slot: Slot } | null>(null);
  const [recipe, setRecipe] = useState<string | null>(null);
  const [store, setStore] = useState("all");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  // What the reader just did and the server has not shown yet: a thing ticked into the cart (true) or back out (false), things sent back to the list, a meal cooked.
  const [marks, setMarks] = useState<Record<string, boolean>>({});
  const [back, setBack] = useState<Record<string, true>>({});
  const [cookedNow, setCookedNow] = useState<Record<string, true>>({});
  const [cleared, setCleared] = useState<Record<string, true>>({});
  const [hereNow, setHereNow] = useState(false);
  const [allRecipes, setAllRecipes] = useState(false);
  const [query, setQuery] = useState("");

  const run = useRun(act);
  const flying = useRef(new Set<string>());
  // What was typed when the page had to ask who the reader is first: the box empties once it shows on the list.
  const asked = useRef<string[] | null>(null);

  const open = v.list.aisles.flatMap((a) => a.items);
  const cartIds = new Set(v.list.cart.map((i) => i.id));
  const inCart = (i: Item) => marks[i.id] ?? cartIds.has(i.id);

  // The server's page takes over as it comes: a mark it agrees with has done its work.
  useEffect(() => {
    const openNow = new Set(v.list.aisles.flatMap((a) => a.items).map((i) => i.id));
    const cartNow = new Set(v.list.cart.map((i) => i.id));
    setMarks((m) => {
      const kept = Object.entries(m).filter(([id, got]) => (got ? openNow.has(id) : cartNow.has(id)));
      return kept.length === Object.keys(m).length ? m : Object.fromEntries(kept);
    });
    setBack((b) => {
      const waiting = new Set([...v.list.staples, ...v.list.recent].map((x) => x.id));
      const kept = Object.keys(b).filter((id) => waiting.has(id));
      return kept.length === Object.keys(b).length ? b : Object.fromEntries(kept.map((id) => [id, true as const]));
    });
    setCookedNow((c) => {
      const still = new Set(v.week.flatMap((d) => d.meals).filter((m) => !m.cooked).map((m) => m.id));
      const kept = Object.keys(c).filter((id) => still.has(id));
      return kept.length === Object.keys(c).length ? c : Object.fromEntries(kept.map((id) => [id, true as const]));
    });
    setCleared((c) => {
      const kept = Object.keys(c).filter((id) => cartNow.has(id));
      return kept.length === Object.keys(c).length ? c : Object.fromEntries(kept.map((id) => [id, true as const]));
    });
    if (v.list.shopping.some((p) => p.you)) setHereNow(false);
    if (asked.current) {
      const names = new Set([...v.list.aisles.flatMap((a) => a.items), ...v.list.cart].map((i) => fold(i.name)));
      if (asked.current.every((name) => names.has(name))) {
        asked.current = null;
        setText("");
      }
    }
  }, [v]);

  const tick = (item: Item) => {
    if (flying.current.has(item.id)) return;
    const there = cartIds.has(item.id);
    const to = !inCart(item);
    setMarks((m) => {
      const next = { ...m };
      if (to === there) delete next[item.id];
      else next[item.id] = to;
      return next;
    });
    flying.current.add(item.id);
    void run(to ? CALLS.got(item) : CALLS.ungot(item)).then((ok) => {
      flying.current.delete(item.id);
      if (!ok)
        setMarks((m) => {
          const next = { ...m };
          delete next[item.id];
          return next;
        });
    });
  };

  const add = async () => {
    const things = readThings(text);
    if (!things.length || sending) return;
    setSending(true);
    const ok = await run(CALLS.add(things));
    setSending(false);
    if (ok) {
      asked.current = null;
      setText("");
    } else asked.current = things.map((t) => fold(t.name));
  };

  const again = (thing: { id: string; name: string }) => {
    setBack((b) => ({ ...b, [thing.id]: true }));
    void run(CALLS.again(thing.name)).then((ok) => {
      if (!ok)
        setBack((b) => {
          const next = { ...b };
          delete next[thing.id];
          return next;
        });
    });
  };

  const markCooked = (meal: Meal) => {
    setCookedNow((c) => ({ ...c, [meal.id]: true }));
    void run(CALLS.cooked(meal)).then((ok) => {
      if (!ok)
        setCookedNow((c) => {
          const next = { ...c };
          delete next[meal.id];
          return next;
        });
    });
  };

  const cookedOf = (meal: Meal) => meal.cooked || !!cookedNow[meal.id];
  const left = open.filter((i) => !inCart(i)).length + v.list.cart.filter((i) => !inCart(i)).length;
  const cart = v.list.cart.filter((i) => !cleared[i.id]);
  const inCartCount = open.filter((i) => inCart(i)).length + cart.filter((i) => inCart(i)).length;
  const at = store !== "all" && v.list.stores.some((x) => fold(x) === store) ? store : "all";
  const aisles = v.list.aisles.map((a) => ({ ...a, items: a.items.filter((i) => at === "all" || (i.store !== null && fold(i.store) === at)) })).filter((a) => a.items.length);
  const others = v.list.shopping.filter((p) => !p.you);
  const here = hereNow || v.list.shopping.some((p) => p.you);
  const shoppers = [...v.list.shopping.map((p) => p.name), ...(hereNow && me && !v.list.shopping.some((p) => p.you) ? [me.name] : [])];
  const staples = v.list.staples.filter((x) => !back[x.id]);
  const recent = v.list.recent.filter((x) => !back[x.id]).slice(0, 12);

  const t = v.tonight;
  const rows: Array<{ day: Day; slot: Slot; meal: Meal | null; lead: boolean }> = [];
  for (const day of v.week) {
    // The meals the household plans, and any other meal that day holds anyway.
    const slots = SLOT_ORDER.filter((s) => v.slots.includes(s) || day.meals.some((m) => m.slot === s));
    slots.forEach((slot, i) => rows.push({ day, slot, meal: day.meals.find((m) => m.slot === slot) ?? null, lead: i === 0 }));
  }
  const manySlots = v.slots.length > 1;
  const found = findRecipes(v.recipes, query);
  const shown = allRecipes || query.trim() ? found : found.slice(0, FIRST_RECIPES);

  const opened = openItem ? (open.find((i) => i.id === openItem) ?? null) : null;
  const reading = recipe ? (v.recipes.find((r) => r.id === recipe) ?? null) : null;

  return (
    <div>
      {/* The grocery list. */}
      <section className="mb-3" style={{ background: INK.surface, borderRadius: 17 }}>
        {shoppers.length ? (
          <div className="flex items-center" style={{ gap: 10, padding: "14px 16px 0" }}>
            <FaceStack names={shoppers} size={22} max={4} />
            <span className="min-w-0" style={{ ...STEP.label, color: INK.soft }}>
              {others.length ? say(atTheStore(others.map((p) => p.name)), lang) : say(youAtStore, lang)}
            </span>
          </div>
        ) : null}
        <div className="flex items-center justify-between" style={{ gap: 16, padding: "12px 16px 14px", minHeight: 74 }}>
          {left > 0 ? (
            <span className="flex items-baseline" style={{ gap: 8 }}>
              <Count value={left} step="display" />
              <span style={{ ...STEP.title, color: INK.muted }}>{say(C.toGet, lang)}</span>
            </span>
          ) : (
            <span className="min-w-0 flex-1">
              <span className="block" style={{ ...STEP.title, fontSize: 20, lineHeight: "26px", textAlign: "start" }}>
                {say(inCartCount ? C.allGot : C.nothing, lang)}
              </span>
              {inCartCount ? null : (
                <span className="block" style={{ ...STEP.meta, color: INK.muted, textAlign: "start", marginTop: 2 }}>
                  {say(may("add") ? C.addLine : C.emptyLine, lang)}
                </span>
              )}
            </span>
          )}
          {may("here") && !here && left > 0 ? (
            <Pill
              text={say(C.atStore, lang)}
              onClick={() => {
                setHereNow(true);
                void run(CALLS.here()).then((ok) => (ok ? null : setHereNow(false)));
              }}
            />
          ) : null}
        </div>
        {may("add") ? (
          <form
            className="flex items-center"
            style={{ gap: 8, padding: "0 12px 12px" }}
            onSubmit={(e) => {
              e.preventDefault();
              void add();
            }}
          >
            <Box value={text} onChange={setText} placeholder={say(C.addHint, lang)} label={say(C.addThings, lang)} lang={lang} max={120} enter="send" className="min-w-0 flex-1" />
            <Pill text={say(C.add, lang)} strong disabled={sending || !text.trim()} onClick={() => void add()} />
          </form>
        ) : null}
      </section>

      {v.list.stores.length && open.length ? (
        <div className="mb-3 flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ gap: 8 }}>
          <Chip text={say(C.all, lang)} on={at === "all"} onClick={() => setStore("all")} tint={TINT} />
          {v.list.stores.map((x) => (
            <Chip key={x} text={x} on={at === fold(x)} onClick={() => setStore(fold(x))} tint={TINT} />
          ))}
        </div>
      ) : null}

      {aisles.length ? (
        <section className="mb-3" style={{ background: INK.surface, borderRadius: 17, paddingBottom: 4 }}>
          {aisles.map((a, n) => (
            <div key={a.aisle}>
              <h3 style={{ ...STEP.label, color: INK.muted, padding: `${n ? 16 : 12}px 16px 2px`, textAlign: "start" }}>{say(a.words, lang)}</h3>
              {a.items.map((item, i) => {
                const done = inCart(item);
                return (
                  <ThingRow
                    key={item.id}
                    item={item}
                    done={done}
                    by={done && several ? me?.name : null}
                    first={i === 0}
                    lang={lang}
                    who={several && item.addedBy && !item.addedBy.you ? item.addedBy.name : null}
                    onTick={may(done ? "ungot" : "got") ? () => tick(item) : undefined}
                    onOpen={may("edit") ? () => setOpenItem(item.id) : undefined}
                  />
                );
              })}
            </div>
          ))}
        </section>
      ) : null}

      {cart.length ? (
        <Section
          title={`${say(C.inCart, lang)}${DOT}${cart.length}`}
          action={
            may("clear") ? (
              <button
                type="button"
                className="active:opacity-70"
                // Room around the word for a thumb, taken back from the header so nothing moves.
                style={{ ...STEP.label, fontWeight: 600, color: INK.fg, padding: "10px 10px", margin: "-10px -10px" }}
                onClick={() => {
                  // What is in the cart now leaves the screen at once, and comes back if the server did not take it.
                  setCleared(Object.fromEntries(cart.map((i) => [i.id, true as const])));
                  void run(CALLS.clear()).then((ok) => (ok ? null : setCleared({})));
                }}
              >
                {say(C.clearCart, lang)}
              </button>
            ) : undefined
          }
        >
          {cart.map((item, i) => {
            const done = inCart(item);
            return <ThingRow key={item.id} item={item} done={done} by={done && several ? (item.got?.by?.name ?? null) : null} first={i === 0} lang={lang} who={null} onTick={may(done ? "ungot" : "got") ? () => tick(item) : undefined} />;
          })}
        </Section>
      ) : null}

      {may("add") && (staples.length || recent.length) ? (
        <section className="mb-3" style={{ background: INK.surface, borderRadius: 17 }}>
          {staples.length ? <Again title={say(C.theUsual, lang)} things={staples} lang={lang} first onAdd={again} /> : null}
          {recent.length ? <Again title={say(C.boughtBefore, lang)} things={recent} lang={lang} first={!staples.length} onAdd={again} /> : null}
          <div style={{ ...STEP.meta, color: INK.muted, padding: "8px 16px 12px", textAlign: "start" }}>{say(C.backHint, lang)}</div>
        </section>
      ) : null}

      {/* The week. */}
      <Section title={say(C.thisWeek, lang)}>
        {v.cooking || v.others.length ? (
          <div className="flex flex-col" style={{ gap: 2, padding: "4px 16px 2px" }}>
            {v.cooking ? <span style={{ ...STEP.meta, color: INK.soft, textAlign: "start" }}>{`${say(C.cookingNow, lang)}: ${iso(v.cooking.recipe.name)}`}</span> : null}
            {v.others.map((o) => (
              <span key={o.who.id} style={{ ...STEP.meta, color: INK.soft, textAlign: "start" }}>
                {say(isCooking(o.who.name, o.name), lang)}
              </span>
            ))}
          </div>
        ) : null}
        <div style={{ padding: "8px 16px 16px" }}>
          <div style={{ ...STEP.label, color: INK.muted, textAlign: "start" }}>{say(C.tonight, lang)}</div>
          {t ? (
            <>
              {t.recipe ? (
                <button type="button" onClick={() => setRecipe(t.recipe)} className="block w-full text-start active:opacity-70" style={{ ...STEP.title, fontSize: 26, lineHeight: "32px", letterSpacing: "-0.7px", marginTop: 2, overflowWrap: "anywhere" }}>
                  <bdi dir={dirOf(t.name)}>{t.name}</bdi>
                </button>
              ) : (
                <div style={{ ...STEP.title, fontSize: 26, lineHeight: "32px", letterSpacing: "-0.7px", marginTop: 2, textAlign: "start", overflowWrap: "anywhere" }}>
                  <bdi dir={dirOf(t.name)}>{t.name}</bdi>
                </div>
              )}
              <div className="flex items-center" style={{ ...STEP.body, color: INK.muted, gap: 6, marginTop: 2 }}>
                {cookedOf(t) ? <CookedMark /> : null}
                <span>{[t.mins ? say(minsWords(t.mins), lang) : null, t.recipe ? say(servesWords(t.serves), lang) : null, cookedOf(t) ? say(C.cooked, lang) : null].filter(Boolean).join(DOT)}</span>
              </div>
              {may("cooked") && !cookedOf(t) ? (
                <div style={{ marginTop: 14 }}>
                  <Wide text={say(C.markCooked, lang)} onClick={() => markCooked(t)} />
                </div>
              ) : null}
            </>
          ) : (
            <>
              <div style={{ ...STEP.title, fontSize: 20, lineHeight: "26px", color: INK.soft, marginTop: 2, textAlign: "start" }}>{say(C.nothingTonight, lang)}</div>
              {may("plan") ? (
                <div style={{ marginTop: 14 }}>
                  <Wide text={say(C.planTonight, lang)} onClick={() => setPlanning({ day: v.today, slot: "dinner" })} />
                </div>
              ) : null}
            </>
          )}
        </div>
        {rows.map(({ day, slot, meal, lead }) => {
          const done = meal ? cookedOf(meal) : false;
          // A day opens when there is something to do on it (plan it, free it, mark its meal cooked); a meal nobody may change still opens its recipe.
          const acts = may("plan") || (!!meal && (may("unplan") || (may("cooked") && !done && day.day <= v.today)));
          const reads = !acts && !!meal?.recipe;
          const sub = [manySlots || slot !== "dinner" ? say(SLOT_NAMES[slot], lang) : null, meal?.mins ? say(minsWords(meal.mins), lang) : null].filter(Boolean).join(DOT);
          const said = `${dayWords(day.day, v.today, lang)}${manySlots || slot !== "dinner" ? `, ${say(SLOT_NAMES[slot], lang)}` : ""}: ${meal ? `${meal.name}${done ? `, ${say(C.cooked, lang)}` : ""}` : say(may("plan") ? C.plan : C.free, lang)}`;
          const body = (
            <>
              <span className="flex shrink-0 flex-col items-center justify-center" style={{ width: 44, height: 44, borderRadius: 13, background: lead ? (day.today ? wash(TINT, 0.18) : INK.surfaceHi) : "transparent" }} aria-hidden>
                {lead ? (
                  <>
                    <span style={{ fontSize: 10.5, lineHeight: "13px", color: day.today ? INK.fg : INK.muted }}>{dayLetter(day.day, lang)}</span>
                    <span style={{ fontSize: 16, lineHeight: "20px", fontWeight: 500, color: day.day < v.today ? INK.muted : INK.fg, fontVariantNumeric: "tabular-nums" }}>{Number(day.day.slice(8))}</span>
                  </>
                ) : null}
              </span>
              <span className="min-w-0 flex-1" aria-hidden>
                <span className="block truncate" style={{ ...STEP.body, fontWeight: meal ? 500 : 400, color: meal ? (done ? INK.soft : INK.fg) : INK.faint, textAlign: "start" }}>
                  {meal ? <bdi dir={dirOf(meal.name)}>{meal.name}</bdi> : say(may("plan") ? C.plan : C.free, lang)}
                </span>
                {sub ? (
                  <span className="block truncate" style={{ ...STEP.meta, color: INK.muted, textAlign: "start" }}>
                    {sub}
                  </span>
                ) : null}
              </span>
              {done ? <CookedMark /> : null}
            </>
          );
          return (
            <div key={`${day.day}-${slot}`}>
              <div style={{ height: 0.5, background: INK.line, marginInlineStart: lead ? 16 : 72 }} />
              {acts || reads ? (
                <button type="button" aria-label={said} onClick={() => (acts ? setPlanning({ day: day.day, slot }) : setRecipe(meal?.recipe ?? null))} className="flex w-full items-center text-start active:opacity-70" style={{ gap: 12, padding: "8px 16px", minHeight: 60 }}>
                  {body}
                </button>
              ) : (
                <div role="group" aria-label={said} className="flex items-center" style={{ gap: 12, padding: "8px 16px", minHeight: 60 }}>
                  {body}
                </div>
              )}
            </div>
          );
        })}
      </Section>

      {/* The recipes. */}
      {v.recipes.length ? (
        <Section title={`${say(C.recipes, lang)}${DOT}${v.recipes.length}`}>
          {v.recipes.length > FIRST_RECIPES ? (
            <div style={{ padding: "6px 12px 8px" }}>
              <Box value={query} onChange={setQuery} placeholder={say(C.searchRecipes, lang)} lang={lang} max={60} mode="search" enter="search" />
            </div>
          ) : null}
          {shown.map((r, i) => (
            <RecipeRow key={r.id} r={r} lang={lang} first={i === 0} onClick={() => setRecipe(r.id)} />
          ))}
          {!shown.length ? (
            <p className="text-center" style={{ ...STEP.body, color: INK.muted, padding: "18px 16px 22px" }}>
              {say(C.nothingFound, lang)}
            </p>
          ) : null}
          {shown.length < found.length ? (
            <div className="flex justify-center" style={{ padding: "8px 0 12px" }}>
              <Pill text={`${say(C.showAll, lang)} (${found.length})`} onClick={() => setAllRecipes(true)} />
            </div>
          ) : query.trim() && shown.length ? (
            <p className="text-center" style={{ ...STEP.meta, color: INK.faint, padding: "6px 16px 12px" }}>
              {say(recipesCount(shown.length), lang)}
            </p>
          ) : null}
        </Section>
      ) : null}

      {opened ? <ItemSheet key={opened.id} item={opened} lang={lang} onClose={() => setOpenItem(null)} send={(call) => void run(call)} /> : null}
      {planning ? (
        <DaySheet
          key={`${planning.day}-${planning.slot}`}
          view={v}
          at={planning}
          lang={lang}
          may={{ plan: may("plan"), unplan: may("unplan"), cooked: may("cooked") }}
          onClose={() => setPlanning(null)}
          send={(call) => void run(call)}
          onCooked={markCooked}
          onRecipe={setRecipe}
        />
      ) : null}
      {reading ? <RecipeSheet key={reading.id} recipe={reading} view={v} lang={lang} mayPlan={may("plan")} onClose={() => setRecipe(null)} send={(call) => void run(call)} /> : null}
    </div>
  );
};
