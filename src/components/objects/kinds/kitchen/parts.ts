/**
 * Kitchen on the page: the view as the core sends it, the app's own words for
 * it, and the few things the page reads by itself (what was typed into the
 * add box, which recipes a word finds). The words are the app's (catch8
 * src/components/objects/kinds/kitchen/copy.ts), so the page and the app say
 * the same thing the same way. Three Arabic lines differ from it on purpose:
 * where the app's reads as said to a man ("اللي محتاجه", "ترجعها"), the page
 * says it in a way that fits anyone.
 */

import { bare, iso, type Lang, type Words } from "@/lib/objects";
import type { Call } from "../sheet";
import { addDays, dayLabel, weekdayName } from "../when";

/* ------------------------------------------------------------------ */
/* The view (catch8 supabase/functions/_shared/objects/kinds/kitchen.ts KitchenView), the fields drawn here. */
/* ------------------------------------------------------------------ */

export type Slot = "breakfast" | "lunch" | "dinner" | "other";

export interface Person {
  id: string;
  name: string;
  you: boolean;
}

export interface Ing {
  name: string;
  note: string | null;
  group: string | null;
  /** "300 g", "2", "1 1/2 cups"; empty with no amount. */
  amount: Words;
}

export interface Recipe {
  id: string;
  name: string;
  serves: number;
  makes: string | null;
  mins: number | null;
  ings: Ing[];
  steps: string[];
  tags: string[];
  from: string | null;
  note: string | null;
  fav: boolean;
  want: boolean;
  cooked: number;
  last: string | null;
}

export interface Meal {
  id: string;
  day: string;
  slot: Slot;
  slotWords: Words;
  recipe: string | null;
  name: string;
  mins: number | null;
  serves: number;
  cooked: boolean;
}

export interface Day {
  day: string;
  label: Words;
  today: boolean;
  meals: Meal[];
}

export interface Item {
  id: string;
  name: string;
  amount: Words | null;
  note: string | null;
  store: string | null;
  aisle: string;
  for: string[];
  staple: boolean;
  addedBy: Person | null;
  fresh: boolean;
  got: { at: number; by: Person | null } | null;
}

export interface KitchenView {
  today: string;
  slots: Slot[];
  tonight: Meal | null;
  week: Day[];
  list: {
    aisles: Array<{ aisle: string; words: Words; items: Item[] }>;
    cart: Item[];
    recent: Array<{ id: string; name: string }>;
    staples: Array<{ id: string; name: string }>;
    shopping: Array<Person & { since: number }>;
    stores: string[];
    counts: { open: number; cart: number; had: number };
    allGot: boolean;
    leftWords: Words;
  };
  recipes: Recipe[];
  cooking: { recipe: Recipe; step: number } | null;
  others: Array<{ who: Person; name: string }>;
  people: Person[];
}

/* ------------------------------------------------------------------ */
/* Words.                                                               */
/* ------------------------------------------------------------------ */

export const C = {
  // The list.
  toGet: { en: "to get", ar: "ناقصين" },
  atStore: { en: "I’m at the store", ar: "أنا في المحل" },
  addThings: { en: "Add things", ar: "ضيف حاجات" },
  addHint: { en: "Milk, eggs, bread", ar: "لبن، بيض، عيش" },
  add: { en: "Add", ar: "ضيف" },
  allGot: { en: "All got", ar: "جبنا كل حاجة" },
  nothing: { en: "Nothing on the list", ar: "القايمة فاضية" },
  addLine: { en: "Add what you need.", ar: "ضيف اللي البيت محتاجه." },
  emptyLine: { en: "Things to get show here when someone adds them.", ar: "الحاجات المطلوبة بتظهر هنا أول ما حد يضيفها." },
  all: { en: "All", ar: "الكل" },
  fresh: { en: "New", ar: "جديد" },
  inCart: { en: "In the cart", ar: "في العربية" },
  clearCart: { en: "Clear", ar: "فضّي" },
  theUsual: { en: "The usual", ar: "المعتاد" },
  boughtBefore: { en: "Bought before", ar: "اتجابوا قبل كده" },
  backHint: { en: "Tap one to put it back on the list.", ar: "دوس على أي واحدة عشان ترجع للقايمة." },
  addAgain: { en: "Add again", ar: "ضيفها تاني" },
  // One thing on the list, opened.
  amount: { en: "How much", ar: "قد إيه" },
  amountHint: { en: "2, 500 g, a big one", ar: "2، 500 جرام، واحدة كبيرة" },
  itemNote: { en: "Note", ar: "ملحوظة" },
  aisle: { en: "Aisle", ar: "القسم" },
  store: { en: "Store", ar: "المحل" },
  storeHint: { en: "Only when it is from one place", ar: "لو من مكان معين بس" },
  staple: { en: "We always buy this", ar: "بنجيبها دايمًا" },
  stapleSub: { en: "“The usual” puts it back on the list.", ar: "“المعتاد” بيرجعها للقايمة." },
  save: { en: "Save", ar: "احفظ" },
  // The week.
  thisWeek: { en: "This week", ar: "الأسبوع ده" },
  tonight: { en: "Tonight", ar: "النهارده" },
  nothingTonight: { en: "Nothing planned tonight", ar: "مفيش حاجة متخططة النهارده" },
  planTonight: { en: "Plan tonight’s dinner", ar: "خطّط عشا النهارده" },
  plan: { en: "Plan", ar: "خطّط" },
  cooked: { en: "Cooked", ar: "اتطبخت" },
  markCooked: { en: "Mark it cooked", ar: "علّم إنها اتطبخت" },
  openRecipe: { en: "See the recipe", ar: "افتح الوصفة" },
  freeDay: { en: "Free this day", ar: "فضّي اليوم ده" },
  pickRecipe: { en: "Pick a recipe", ar: "اختار وصفة" },
  searchRecipes: { en: "Search by name or ingredient", ar: "دوّر بالاسم أو بمكوّن" },
  plainName: { en: "Or just a name", ar: "أو اسم بس" },
  plainHint: { en: "Leftovers, eating out", ar: "بواقي، هناكل برة" },
  whichDay: { en: "Which day?", ar: "أنهي يوم؟" },
  back: { en: "Back", ar: "ارجع" },
  today: { en: "Today", ar: "النهارده" },
  tomorrow: { en: "Tomorrow", ar: "بكرة" },
  yesterday: { en: "Yesterday", ar: "امبارح" },
  // Recipes.
  recipes: { en: "Recipes", ar: "الوصفات" },
  ingredients: { en: "Ingredients", ar: "المكوّنات" },
  steps: { en: "Steps", ar: "الطريقة" },
  note: { en: "Note", ar: "ملحوظة" },
  favourite: { en: "A favourite", ar: "من المفضلة" },
  wantToCook: { en: "Want to cook", ar: "نفسنا نعملها" },
  noIngredients: { en: "No ingredients kept.", ar: "مفيش مكوّنات محفوظة." },
  noSteps: { en: "No steps kept.", ar: "مفيش خطوات محفوظة." },
  nothingFound: { en: "No recipe fits that.", ar: "مفيش وصفة كده." },
  showAll: { en: "Show all", ar: "اعرض الكل" },
  cookingNow: { en: "Cooking now", ar: "بيتطبخ دلوقتي" },
  free: { en: "Nothing planned", ar: "مفيش حاجة متخططة" },
} satisfies Record<string, Words>;

/** The aisles in the order of a store, each by its name (catch8 kinds/kitchen.items.ts AISLE_NAMES). */
export const AISLES: Array<[string, Words]> = [
  ["produce", { en: "Fruit and veg", ar: "خضار وفاكهة" }],
  ["bakery", { en: "Bakery", ar: "عيش ومخبوزات" }],
  ["meat", { en: "Meat and fish", ar: "لحمة وسمك" }],
  ["dairy", { en: "Dairy and eggs", ar: "ألبان وبيض" }],
  ["frozen", { en: "Frozen", ar: "مجمدات" }],
  ["pantry", { en: "Pantry", ar: "بقالة" }],
  ["snacks", { en: "Snacks", ar: "تسالي" }],
  ["drinks", { en: "Drinks", ar: "مشروبات" }],
  ["household", { en: "Household", ar: "مستلزمات البيت" }],
  ["care", { en: "Personal care", ar: "عناية شخصية" }],
  ["baby", { en: "Baby", ar: "أطفال" }],
  ["pets", { en: "Pets", ar: "حيوانات أليفة" }],
  ["other", { en: "Other", ar: "حاجات تانية" }],
];

/** A meal's slot by its name (catch8 kinds/kitchen.ts SLOT_NAMES). */
export const SLOT_NAMES: Record<Slot, Words> = {
  breakfast: { en: "Breakfast", ar: "الفطار" },
  lunch: { en: "Lunch", ar: "الغدا" },
  dinner: { en: "Dinner", ar: "العشا" },
  other: { en: "Other", ar: "حاجة تانية" },
};
export const SLOT_ORDER: Slot[] = ["breakfast", "lunch", "dinner", "other"];

export const DOT = " · ";

/** "30 min", "1 h 15 min". */
export function minsWords(mins: number): Words {
  if (mins < 60) return { en: `${mins} min`, ar: `${mins} دقيقة` };
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return { en: m ? `${h} h ${m} min` : `${h} h`, ar: m ? `${h} س ${m} د` : h === 1 ? "ساعة" : h === 2 ? "ساعتين" : `${h} ساعات` };
}

export const servesWords = (n: number): Words => ({ en: `Serves ${n}`, ar: `تكفي ${n}` });
export const cookedTimes = (n: number): Words => ({ en: n === 1 ? "Cooked once" : `Cooked ${n} times`, ar: n === 1 ? "اتطبخت مرة" : n === 2 ? "اتطبخت مرتين" : n <= 10 ? `اتطبخت ${n} مرات` : `اتطبخت ${n} مرة` });
export const lastCooked = (when: string): Words => ({ en: `Last cooked ${when}`, ar: `آخر مرة ${when}` });
export const fromWords = (who: string): Words => ({ en: `From ${iso(who)}`, ar: `من ${iso(who)}` });
export const forMeals = (meals: string[]): Words => ({ en: `For ${meals.map(iso).join(", ")}`, ar: `لـ ${meals.map(iso).join("، ")}` });
/** "Sam is cooking Lentil soup". The Arabic says what is being cooked and by whom, with no verb for the person, so it fits anyone. */
export const isCooking = (who: string, what: string): Words => ({ en: `${iso(who)} is cooking ${iso(what)}`, ar: `بيتطبخ دلوقتي: ${iso(what)}، ${iso(who)}` });
export const recipesCount = (n: number): Words => ({ en: n === 1 ? "1 recipe" : `${n} recipes`, ar: n === 1 ? "وصفة واحدة" : n === 2 ? "وصفتين" : n <= 10 ? `${n} وصفات` : `${n} وصفة` });
export const youAtStore: Words = { en: "You are at the store", ar: "إنت في المحل" };

/** "Sam is at the store", "Sam and Lina are at the store". */
export function atTheStore(names: string[]): Words {
  const n = names.map(iso);
  if (n.length === 1) return { en: `${n[0]} is at the store`, ar: `${n[0]} في المحل` };
  return { en: `${n.slice(0, -1).join(", ")} and ${n[n.length - 1]} are at the store`, ar: `${n.join(" و")} في المحل` };
}

/** What a tick on a thing does, for a screen reader: "Got milk", "Milk is in the cart. Tap to put it back". */
export const tickLabel = (name: string, got: boolean): Words => (got ? { en: `${name} is in the cart. Tap to put it back`, ar: `${name} في العربية. دوس عشان ترجع للقايمة` } : { en: `Got ${name}`, ar: `جبت ${name}` });

/** "Tonight", "Tomorrow", "Thursday", "Fri 16 Oct": a day said from today, as the app's plan says it. */
export function dayWords(day: string, today: string, lang: Lang): string {
  if (day === today) return lang === "ar" ? C.today.ar : C.today.en;
  if (day === addDays(today, 1)) return lang === "ar" ? C.tomorrow.ar : C.tomorrow.en;
  if (day === addDays(today, -1)) return lang === "ar" ? C.yesterday.ar : C.yesterday.en;
  if (day > today && day <= addDays(today, 6)) return weekdayName(day, lang, true);
  return dayLabel(day, lang, { thisYear: today });
}

/** "30 min · Serves 4 · Cooked 12 times": a recipe in one line. */
export function recipeLine(r: Recipe, lang: Lang): string {
  const say = (w: Words) => (lang === "ar" ? w.ar : w.en);
  return [r.mins ? say(minsWords(r.mins)) : null, r.makes ?? say(servesWords(r.serves)), r.cooked ? say(cookedTimes(r.cooked)) : null].filter(Boolean).join(DOT);
}

/* ------------------------------------------------------------------ */
/* What the page reads by itself.                                       */
/* ------------------------------------------------------------------ */

/**
 * A name folded for matching, as the core folds it (core.ts foldName): case,
 * accents and Arabic letter forms, so "Sam" and "sam" are one and "سارة" is
 * "ساره".
 */
export function fold(name: string): string {
  return bare(name)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** The words people write for the units the list knows (the core's UNITS): a number, then one of these, is an amount. */
const UNIT_WORDS = new Set(
  [
    ...["g", "gr", "gram", "grams", "gramme", "grammes", "جرام", "جم"],
    ...["kg", "kgs", "kilo", "kilos", "kilogram", "kilograms", "كيلو", "كجم"],
    ...["ml", "millilitre", "millilitres", "milliliter", "milliliters", "مل", "ملي"],
    ...["l", "litre", "litres", "liter", "liters", "لتر"],
    ...["tsp", "tsps", "teaspoon", "teaspoons"],
    ...["tbsp", "tbsps", "tbs", "tablespoon", "tablespoons", "معلقة"],
    ...["cup", "cups", "كوب", "كوباية", "كوبايه", "اكواب"],
    ...["oz", "ounce", "ounces", "اونصة"],
    ...["lb", "lbs", "pound", "pounds", "رطل"],
    "floz",
  ].map(fold)
);

const EASTERN = "٠١٢٣٤٥٦٧٨٩";
/** An amount at the front of what was typed: "2", "1.5", "1/2", "1 1/2", "2½". */
const AMOUNT = /^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?\s*[½¼¾⅓⅔]?|[½¼¾⅓⅔])\s*(.+)$/;

export interface Thing {
  name: string;
  qty?: string;
  unit?: string;
}

/**
 * What was typed into the add box, as the things it names: one thing, or
 * several with commas between them ("milk, eggs, bread"). A number in front
 * is its amount, with its unit when the next word is one ("2 kg rice" is
 * rice, 2 kg), as the app's own bar reads it (the kind's `quick`). The list
 * keeps a typed thing with its capital.
 */
export function readThings(raw: string): Thing[] {
  let line = "";
  for (const ch of raw) line += EASTERN.includes(ch) ? String(EASTERN.indexOf(ch)) : ch;
  const pieces = line
    .split(/\s*[,،\n]\s*/)
    .map((p) => p.trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .slice(0, 12);
  const out: Thing[] = [];
  for (const piece of pieces) {
    const m = AMOUNT.exec(piece);
    const words = m ? m[2].trim().split(" ") : [];
    const unit = m && words.length > 1 && UNIT_WORDS.has(fold(words[0]).replace(/\.$/, "")) ? words[0] : null;
    const name = m ? (unit ? words.slice(1) : words).join(" ") : piece;
    // A number with no thing after it ("2 kg") is kept as it was typed.
    const thing: Thing = m && /\p{L}/u.test(name) ? { name, qty: m[1].trim().replace(",", "."), ...(unit ? { unit } : {}) } : { name: piece };
    thing.name = Array.from(thing.name).slice(0, 60).join("");
    thing.name = thing.name.charAt(0).toUpperCase() + thing.name.slice(1);
    if (!out.some((t) => fold(t.name) === fold(thing.name))) out.push(thing);
  }
  return out;
}

/**
 * The recipes a typed word finds, as the app finds them (the kind's
 * findRecipes): by name first, then by a tag or where it came from, then by
 * an ingredient. Every word typed must be found somewhere in the recipe.
 */
export function findRecipes(recipes: readonly Recipe[], query: string): Recipe[] {
  const wants = fold(query).split(" ").filter(Boolean);
  if (!wants.length) return [...recipes];
  const scored: Array<{ r: Recipe; score: number }> = [];
  for (const r of recipes) {
    const name = fold(r.name);
    const tags = r.tags.map(fold);
    const ings = r.ings.map((i) => fold(i.name));
    let score = 0;
    let all = true;
    for (const want of wants) {
      if (name.includes(want)) score += name.startsWith(want) ? 6 : 4;
      else if (tags.some((t) => t.includes(want)) || (r.from && fold(r.from).includes(want))) score += 2;
      else if (ings.some((i) => i.includes(want))) score += 1;
      else all = false;
    }
    if (all) scored.push({ r, score });
  }
  return scored.sort((a, b) => b.score - a.score).map((x) => x.r);
}

/**
 * Whether a typed meal would be read as one of the kept recipes (the core's
 * looseItemArg: the same name, or one inside the other from three letters
 * up). Such words are planned by picking the recipe; only words no recipe
 * answers to are planned as a plain name.
 */
export function readsAsRecipe(recipes: readonly Recipe[], typed: string): boolean {
  const want = fold(typed);
  if (!want) return false;
  return recipes.some((r) => {
    const name = fold(r.name);
    if (name === want) return true;
    return Array.from(name).length >= 3 && Array.from(want).length >= 3 && (name.includes(want) || want.includes(name));
  });
}

/* ------------------------------------------------------------------ */
/* What the page asks the door for.                                     */
/* ------------------------------------------------------------------ */

/** What can change on one thing of the list from its sheet: only what the person changed is sent. */
export interface ItemChange {
  qty?: string;
  note?: string;
  store?: string;
  aisle?: string;
  staple?: boolean;
}

/**
 * Every change this page makes, each as the kind's op with the args that op
 * reads (catch8 supabase/functions/_shared/objects/kinds/kitchen.ts, the ops
 * a page may run). The page builds its calls here and nowhere else, so what
 * a button sends can be checked against the kind's own rules by itself.
 */
export const CALLS = {
  /** A thing ticked into the cart, or back out of it. */
  got: (item: { id: string }): Call => ({ op: "got", args: { item: item.id } }),
  ungot: (item: { id: string }): Call => ({ op: "ungot", args: { item: item.id } }),
  /** What was typed into the add box. */
  add: (things: Thing[]): Call => ({ op: "add", args: { items: things } }),
  /** One thing always bought or bought before, back on the list by its name. */
  again: (name: string): Call => ({ op: "add", args: { items: [{ name }] } }),
  clear: (): Call => ({ op: "clear", args: {} }),
  here: (): Call => ({ op: "here", args: {} }),
  edit: (item: { id: string }, changed: ItemChange): Call => ({ op: "edit", args: { item: item.id, ...changed } }),
  /** A planned meal was cooked: its day and slot, and its recipe when it is one that is kept. */
  cooked: (meal: Meal): Call => ({ op: "cooked", args: { day: meal.day, slot: meal.slot, ...(meal.recipe ? { recipe: meal.recipe } : {}) } }),
  unplan: (day: string, slot: Slot): Call => ({ op: "unplan", args: { day, slot } }),
  /** A kept recipe on a day: in the slot of the day that was opened, or dinner from the recipe's own sheet. */
  planRecipe: (recipe: { id: string }, day: string, slot?: Slot): Call => ({ op: "plan", args: { recipe: recipe.id, day, ...(slot ? { slot } : {}) } }),
  /** A plain name on a day ("Leftovers"), offered only for words no kept recipe answers to. */
  planName: (name: string, day: string, slot: Slot): Call => ({ op: "plan", args: { name, day, slot } }),
};
