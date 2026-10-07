"use client";

/**
 * The three sheets Kitchen opens over its page: one thing on the list (how
 * much, a note, its aisle, its store, whether it is always bought), a day of
 * the week (what is on it, and a recipe or a plain name to put there), and a
 * recipe whole (its ingredients and steps, and a day to cook it on). Each
 * closes before its change is sent, so the page under it is in view when the
 * answer lands.
 */

import { useState } from "react";

import { say, type Lang } from "@/lib/objects";
import { EASE, INK, STEP, dirOf } from "../../kit";
import { Mark } from "../../mark";
import { Box, Chevron, Chip, Head, Sheet, SheetRow, Wide, over, type Call } from "../sheet";
import { dayLabel, western } from "../when";
import { AISLES, C, CALLS, DOT, SLOT_NAMES, cookedTimes, dayWords, findRecipes, fromWords, lastCooked, minsWords, readsAsRecipe, recipeLine, servesWords, type Item, type ItemChange, type KitchenView, type Meal, type Recipe, type Slot } from "./parts";

/** Kitchen's one colour (catch8 supabase/functions/_shared/objects/apps.ts): what is chosen and what was cooked, never a button. */
export const TINT = "#C3CF73";

/** The pot on its tile: what a recipe wears in a row. */
export function Pot({ size = 44 }: { size?: number }) {
  return (
    <span className="flex shrink-0 items-center justify-center" style={{ width: size, height: size, borderRadius: Math.round(size * 0.3), background: over(TINT, INK.surfaceHi, 0.16) }} aria-hidden>
      <Mark name="pot" size={Math.round(size * 0.46)} color={TINT} />
    </span>
  );
}

/** A recipe as a row that opens: its pot, its name, what it takes, and whether it is a favourite. */
export function RecipeRow({ r, lang, first, inset, onClick }: { r: Recipe; lang: Lang; first?: boolean; /** Drawn inside a sheet, on the raised ground. */ inset?: boolean; onClick: () => void }) {
  const line = recipeLine(r, lang);
  const under = r.fav ? say(C.favourite, lang) : r.want ? say(C.wantToCook, lang) : null;
  return (
    <div>
      {first ? null : <div style={{ height: 0.5, background: INK.line, marginInlineStart: inset ? 68 : 72 }} />}
      <button type="button" onClick={onClick} className="flex w-full items-center text-start active:opacity-70" style={{ gap: 12, padding: inset ? "9px 12px" : "10px 16px", minHeight: 60 }}>
        <Pot />
        <span className="min-w-0 flex-1">
          <span className="block" style={{ ...STEP.body, fontWeight: 500, textAlign: "start" }}>
            <bdi dir={dirOf(r.name)}>{r.name}</bdi>
          </span>
          {line ? (
            <span className="block" style={{ ...STEP.meta, color: INK.muted, textAlign: "start" }}>
              {line}
            </span>
          ) : null}
          {under ? (
            <span className="block" style={{ ...STEP.meta, color: INK.soft, textAlign: "start" }}>
              {under}
            </span>
          ) : null}
        </span>
        <Chevron lang={lang} />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* One thing on the list.                                               */
/* ------------------------------------------------------------------ */

/** A switch the size a thumb finds: its ground takes the app's colour when it is on. */
function Switch({ on, onChange, label }: { on: boolean; onChange: (on: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className="relative shrink-0 rounded-full" style={{ width: 50, height: 30, background: on ? TINT : INK.track, transition: `background-color 180ms ${EASE}` }}>
      <span className="absolute rounded-full" style={{ top: 3, insetInlineStart: on ? 23 : 3, width: 24, height: 24, background: on ? INK.bg : INK.soft, transition: `inset-inline-start 180ms ${EASE}, background-color 180ms ${EASE}` }} />
    </button>
  );
}

/**
 * One thing on the list, opened. Only what the person changed is sent, so a
 * sheet opened and closed on Save says nothing happened.
 */
export function ItemSheet({ item, lang, onClose, send }: { item: Item; lang: Lang; onClose: () => void; send: (call: Call) => void }) {
  const was = { qty: item.amount ? say(item.amount, lang) : "", note: item.note ?? "", store: item.store ?? "" };
  const [qty, setQty] = useState(was.qty);
  const [note, setNote] = useState(was.note);
  const [store, setStore] = useState(was.store);
  const [aisle, setAisle] = useState(item.aisle);
  const [staple, setStaple] = useState(item.staple);
  const save = () => {
    const changed: ItemChange = {};
    if (qty.trim() !== was.qty) changed.qty = qty.trim();
    if (note.trim() !== was.note) changed.note = note.trim();
    if (store.trim() !== was.store) changed.store = store.trim();
    if (aisle !== item.aisle) changed.aisle = aisle;
    if (staple !== item.staple) changed.staple = staple;
    onClose();
    if (Object.keys(changed).length) send(CALLS.edit(item, changed));
  };
  // The aisle it is in comes first, so it is in view without a swipe.
  const aisles = [...AISLES.filter(([key]) => key === item.aisle), ...AISLES.filter(([key]) => key !== item.aisle)];
  return (
    <Sheet title={item.name} lang={lang} onClose={onClose} foot={<Wide strong text={say(C.save, lang)} onClick={save} />}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <Head first text={say(C.amount, lang)} />
        <Box value={qty} onChange={(t) => setQty(western(t))} placeholder={say(C.amountHint, lang)} label={say(C.amount, lang)} lang={lang} max={24} />
        <Head text={say(C.itemNote, lang)} />
        <Box value={note} onChange={setNote} placeholder={say(C.itemNote, lang)} lang={lang} max={80} />
        <Head text={say(C.aisle, lang)} />
        <div className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ gap: 8, margin: "0 -16px", padding: "0 16px" }}>
          {aisles.map(([key, name]) => (
            <Chip key={key} text={say(name, lang)} on={aisle === key} onClick={() => setAisle(key)} tint={TINT} />
          ))}
        </div>
        <Head text={say(C.store, lang)} />
        <Box value={store} onChange={setStore} placeholder={say(C.storeHint, lang)} label={say(C.store, lang)} lang={lang} max={30} />
        <div className="flex items-center" style={{ gap: 12, marginTop: 18, padding: "12px 14px", borderRadius: 17, background: INK.surfaceHi }}>
          <span className="min-w-0 flex-1">
            <span className="block" style={{ ...STEP.body, textAlign: "start" }}>
              {say(C.staple, lang)}
            </span>
            <span className="block" style={{ ...STEP.meta, color: INK.muted, textAlign: "start" }}>
              {say(C.stapleSub, lang)}
            </span>
          </span>
          <Switch on={staple} onChange={setStaple} label={say(C.staple, lang)} />
        </div>
        {/* Return in a box saves, as the button does. */}
        <button type="submit" hidden />
      </form>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* A day of the week.                                                   */
/* ------------------------------------------------------------------ */

/**
 * A day of the plan, opened: what is on it with what can be done (see its
 * recipe, mark it cooked, free the day), and under that the way to put a
 * meal there: any kept recipe, found by a word, or a plain name.
 */
export function DaySheet({
  view,
  at,
  lang,
  may,
  onClose,
  send,
  onCooked,
  onRecipe,
}: {
  view: KitchenView;
  at: { day: string; slot: Slot };
  lang: Lang;
  may: { plan: boolean; unplan: boolean; cooked: boolean };
  onClose: () => void;
  send: (call: Call) => void;
  /** The page marks a meal cooked itself, so its row shows it at once. */
  onCooked: (meal: Meal) => void;
  onRecipe: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const meal = view.week.find((d) => d.day === at.day)?.meals.find((m) => m.slot === at.slot) ?? null;
  const slotName = meal ? meal.slotWords : SLOT_NAMES[at.slot];
  const title = `${dayWords(at.day, view.today, lang)}${at.slot !== "dinner" ? `${DOT}${say(slotName, lang)}` : ""}`;
  const typed = query.trim();
  const found = findRecipes(view.recipes, query);
  // Words a kept recipe answers to are planned by picking that recipe; anything else is a plain name for the meal.
  const plain = !!typed && !readsAsRecipe(view.recipes, typed);
  const rows: Array<{ key: string; text: string; away?: boolean; run: () => void }> = [];
  if (meal?.recipe) rows.push({ key: "recipe", text: say(C.openRecipe, lang), run: () => (onClose(), onRecipe(meal.recipe as string)) });
  if (meal && may.cooked && !meal.cooked && at.day <= view.today) rows.push({ key: "cooked", text: say(C.markCooked, lang), run: () => (onClose(), onCooked(meal)) });
  if (meal && may.unplan) rows.push({ key: "free", text: say(C.freeDay, lang), away: true, run: () => (onClose(), send(CALLS.unplan(at.day, at.slot))) });
  const plan = (call: Call) => {
    onClose();
    send(call);
  };
  return (
    <Sheet title={title} lang={lang} onClose={onClose} tall={may.plan && view.recipes.length > 3}>
      {meal ? (
        <div style={{ paddingTop: 4 }}>
          <div style={{ ...STEP.title, fontSize: 24, lineHeight: "30px", letterSpacing: "-0.5px", textAlign: "start", overflowWrap: "anywhere" }}>
            <bdi dir={dirOf(meal.name)}>{meal.name}</bdi>
          </div>
          {meal.mins || meal.cooked ? (
            <div style={{ ...STEP.meta, color: INK.muted, marginTop: 4, textAlign: "start" }}>{[meal.mins ? say(minsWords(meal.mins), lang) : null, meal.cooked ? say(C.cooked, lang) : null].filter(Boolean).join(DOT)}</div>
          ) : null}
          {rows.length ? (
            <div style={{ marginTop: 12, borderTop: `0.5px solid ${INK.line}` }}>
              {rows.map((r, i) => (
                <SheetRow key={r.key} first={i === 0} text={r.text} away={r.away} onClick={r.run} />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {may.plan ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            // Return plans what was typed when it is a plain name; a word that finds recipes waits for one to be picked.
            if (plain) plan(CALLS.planName(typed, at.day, at.slot));
          }}
        >
          <Head text={say(view.recipes.length ? C.pickRecipe : C.plan, lang)} />
          <Box value={query} onChange={setQuery} placeholder={say(view.recipes.length ? C.searchRecipes : C.plainHint, lang)} lang={lang} max={60} mode="search" enter="done" />
          {plain ? (
            <button type="submit" className="mt-3 flex w-full items-center text-start active:opacity-70" style={{ gap: 12, padding: "12px 14px", borderRadius: 17, background: INK.surfaceHi }}>
              <span className="min-w-0 flex-1" style={{ ...STEP.body, fontWeight: 500, textAlign: "start" }}>
                {`${say(C.plan, lang)}: `}
                <bdi dir={dirOf(typed)}>{typed}</bdi>
              </span>
              <Chevron lang={lang} />
            </button>
          ) : null}
          {found.length ? (
            <div className="mt-3 overflow-hidden" style={{ borderRadius: 17, background: INK.surfaceHi }}>
              {found.slice(0, 30).map((r, i) => (
                <RecipeRow key={r.id} r={r} lang={lang} first={i === 0} inset onClick={() => plan(CALLS.planRecipe(r, at.day, at.slot))} />
              ))}
            </div>
          ) : typed && !plain ? (
            <p className="mt-3 text-center" style={{ ...STEP.meta, color: INK.muted }}>
              {say(C.nothingFound, lang)}
            </p>
          ) : null}
          {!typed && view.recipes.length ? (
            <p className="mt-3 text-center" style={{ ...STEP.meta, color: INK.faint }}>
              {`${say(C.plainName, lang)}: ${say(C.plainHint, lang)}`}
            </p>
          ) : null}
        </form>
      ) : null}
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* A recipe, whole.                                                     */
/* ------------------------------------------------------------------ */

/**
 * A recipe opened: the time it takes and how many it serves, its ingredients
 * with their amounts set apart, its steps, the household's note, and a day
 * to cook it on. It is read as it was kept; the amounts for another number
 * of servings are worked out in the app.
 */
export function RecipeSheet({ recipe: r, view, lang, mayPlan, onClose, send }: { recipe: Recipe; view: KitchenView; lang: Lang; mayPlan: boolean; onClose: () => void; send: (call: Call) => void }) {
  const [picking, setPicking] = useState(false);
  const facts = [r.mins ? say(minsWords(r.mins), lang) : null, r.makes ?? say(servesWords(r.serves), lang), r.from ? say(fromWords(r.from), lang) : null, r.cooked ? say(cookedTimes(r.cooked), lang) : null].filter(Boolean).join(DOT);
  // The days of this week still to come, today first: what the page knows the dinners of.
  const days = view.week.filter((d) => d.day >= view.today);
  return (
    <Sheet title={r.name} lang={lang} onClose={onClose} tall>
      {picking ? (
        <div>
          <p style={{ ...STEP.body, color: INK.muted, textAlign: "start", margin: "2px 2px 12px" }}>{say(C.whichDay, lang)}</p>
          <div className="overflow-hidden" style={{ borderRadius: 17, background: INK.surfaceHi }}>
            {days.map((d, i) => {
              const there = d.meals.find((m) => m.slot === "dinner") ?? null;
              return (
                <div key={d.day}>
                  {i ? <div style={{ height: 0.5, background: INK.line, marginInlineStart: 14 }} /> : null}
                  <button
                    type="button"
                    className="flex w-full items-center text-start active:opacity-70"
                    style={{ gap: 12, padding: "13px 14px", minHeight: 50 }}
                    onClick={() => {
                      onClose();
                      send(CALLS.planRecipe(r, d.day));
                    }}
                  >
                    <span className="flex-1" style={{ ...STEP.body, fontWeight: 500, textAlign: "start" }}>
                      {dayWords(d.day, view.today, lang)}
                    </span>
                    {there ? (
                      <span className="min-w-0 truncate" style={{ ...STEP.meta, color: INK.muted, maxWidth: "55%" }}>
                        <bdi dir={dirOf(there.name)}>{there.name}</bdi>
                      </span>
                    ) : null}
                    <Chevron lang={lang} />
                  </button>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 14 }}>
            <Wide text={say(C.back, lang)} onClick={() => setPicking(false)} />
          </div>
        </div>
      ) : (
        <div>
          <p style={{ ...STEP.body, color: INK.muted, textAlign: "start", margin: "2px 2px 0" }}>{facts}</p>
          {r.last || r.fav || r.want ? (
            <p style={{ ...STEP.meta, color: INK.faint, textAlign: "start", margin: "6px 2px 0" }}>
              {[r.fav ? say(C.favourite, lang) : r.want ? say(C.wantToCook, lang) : null, r.last ? say(lastCooked(dayLabel(r.last, lang, { thisYear: view.today })), lang) : null].filter(Boolean).join(DOT)}
            </p>
          ) : null}
          {mayPlan && days.length ? (
            <div style={{ marginTop: 16 }}>
              <Wide text={say(C.plan, lang)} onClick={() => setPicking(true)} />
            </div>
          ) : null}

          <Head text={say(C.ingredients, lang)} />
          {r.ings.length ? (
            <div className="overflow-hidden" style={{ borderRadius: 17, background: INK.surfaceHi }}>
              {r.ings.map((ing, i) => {
                const head = !!ing.group && ing.group !== r.ings[i - 1]?.group;
                const amount = say(ing.amount, lang);
                return (
                  <div key={`${ing.name}-${i}`}>
                    {head ? (
                      <div style={{ ...STEP.meta, color: INK.muted, padding: "12px 14px 2px", textAlign: "start", borderTop: i ? `0.5px solid ${INK.line}` : undefined }}>
                        <bdi dir={dirOf(ing.group as string)}>{ing.group}</bdi>
                      </div>
                    ) : i ? (
                      <div style={{ height: 0.5, background: INK.line, marginInlineStart: 14 }} />
                    ) : null}
                    <div className="flex items-center" style={{ gap: 12, padding: "10px 14px", minHeight: 46 }}>
                      <span className="min-w-0 flex-1">
                        <span className="block" style={{ ...STEP.body, textAlign: "start" }}>
                          <bdi dir={dirOf(ing.name)}>{ing.name}</bdi>
                        </span>
                        {ing.note ? (
                          <span className="block" style={{ ...STEP.meta, color: INK.muted, textAlign: "start" }}>
                            <bdi dir={dirOf(ing.note)}>{ing.note}</bdi>
                          </span>
                        ) : null}
                      </span>
                      {/* Plain words, not a figure: "300 جرام" reads in the direction of its own letters. */}
                      {amount ? (
                        <span className="shrink-0" style={{ ...STEP.body, fontWeight: 500, color: INK.soft }}>
                          <bdi dir={dirOf(amount)}>{amount}</bdi>
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ ...STEP.body, color: INK.muted, textAlign: "start", margin: "0 2px" }}>{say(C.noIngredients, lang)}</p>
          )}

          <Head text={say(C.steps, lang)} />
          {r.steps.length ? (
            <ol className="flex flex-col" style={{ gap: 14 }}>
              {r.steps.map((step, i) => (
                <li key={i} className="flex items-start" style={{ gap: 12 }}>
                  <span className="flex shrink-0 items-center justify-center" style={{ ...STEP.label, color: INK.muted, width: 26, height: 26, borderRadius: 8, background: INK.surfaceHi, marginTop: 1, fontVariantNumeric: "tabular-nums" }} aria-hidden>
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1" style={{ ...STEP.body, lineHeight: "24px", textAlign: "start" }}>
                    <bdi dir={dirOf(step)}>{step}</bdi>
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p style={{ ...STEP.body, color: INK.muted, textAlign: "start", margin: "0 2px" }}>{say(C.noSteps, lang)}</p>
          )}

          {r.note ? (
            <>
              <Head text={say(C.note, lang)} />
              <p style={{ ...STEP.body, textAlign: "start", margin: "0 2px" }}>
                <bdi dir={dirOf(r.note)}>{r.note}</bdi>
              </p>
            </>
          ) : null}
          {r.tags.length ? (
            <p style={{ ...STEP.meta, color: INK.muted, textAlign: "start", margin: "18px 2px 0" }}>
              {r.tags.map((t, i) => (
                <span key={t}>
                  {i ? DOT : null}
                  <bdi dir={dirOf(t)}>{t}</bdi>
                </span>
              ))}
            </p>
          ) : null}
        </div>
      )}
    </Sheet>
  );
}
