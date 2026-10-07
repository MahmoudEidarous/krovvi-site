/**
 * Health on the page: the view as the core sends it, and the app's own words
 * for it (catch8 src/components/objects/kinds/health/copy.ts), so the page
 * and the app say the same thing the same way. Plain facts only: nothing
 * here advises, warns or praises, and the Arabic never guesses a gender for
 * the person it is kept for.
 */

import { iso, type Lang, type Words } from "@/lib/objects";
import type { Call } from "../sheet";

/* ------------------------------------------------------------------ */
/* The view (catch8 supabase/functions/_shared/objects/kinds/health.ts HealthView), the fields drawn here. */
/* ------------------------------------------------------------------ */

export interface DoseSlot {
  med: string;
  name: string;
  dose: string | null;
  /** "HH:mm". */
  time: string;
  label: Words;
  state: "given" | "skipped" | "due" | "later";
  byName: string | null;
  /** When it was given, "HH:mm". */
  at: string | null;
}

export interface Med {
  id: string;
  name: string;
  dose: string | null;
  left: number | null;
  daysLeft: number | null;
  low: boolean;
  asNeeded: boolean;
  note: string | null;
  /** Doses of an as needed medicine given today. */
  today: number;
  when: Words;
  /** The last 14 days, oldest first: 1 every dose given, 0.5 some, 0 none, null no dose that day. */
  days14: Array<number | null>;
}

export interface MedsPart {
  ring: DoseSlot[];
  given: number;
  total: number;
  meds: Med[];
  low: Array<{ id: string; name: string; daysLeft: number }>;
  week: Array<{ day: string; label: Words; given: number; total: number }>;
}

export interface CyclePart {
  phaseWords: Words;
  next: { words: Words } | null;
  cycleDay: number | null;
  lengths: { cycle: number; period: number; sure: "rough" | "fair" } | null;
  days: Array<{ day: string; kind: "period" | "estimate" | null; logged: boolean }> | null;
}

export interface SleepPart {
  last: { mins: number } | null;
  latest: { day: string; mins: number } | null;
  nights: Array<{ day: string; mins: number | null }>;
  avg7: number | null;
  need: number | null;
  short7: number | null;
  bedUsual: string | null;
  wakeUsual: string | null;
}

export interface FeelTrack {
  name: string;
  today: number | null;
  days: Array<number | null>;
  days30: number;
}

export interface MeasureRow {
  id: string;
  day: string;
  time: string;
  value: number;
  note: string | null;
  said: Words;
}

export interface MeasurePart {
  kind: "bp" | "hr" | "temp" | "glucose" | "spo2" | "weight";
  name: Words;
  latest: MeasureRow;
  series: MeasureRow[];
  avg30: Words | null;
}

export interface Visit {
  id: string;
  day: string;
  time: string | null;
  who: string;
  where: string | null;
  why: string | null;
  notes: string | null;
  changed: string | null;
  next: string | null;
}

export interface Result {
  id: string;
  test: string;
  value: number | null;
  words: string | null;
  unit: string | null;
  low: number | null;
  high: number | null;
  flag: "low" | "high" | "ok" | null;
}

export interface Report {
  key: string;
  day: string;
  title: string;
  lab: string | null;
  rows: Result[];
  out: number;
}

export type FactKind = "condition" | "allergy" | "vaccine" | "blood" | "contact";

export interface Fact {
  id: string;
  kind: FactKind;
  name: string;
  note: string | null;
  day: string | null;
}

export interface HealthView {
  today: string;
  /** A person's own (true), or kept for someone (false). */
  own: boolean;
  forName: string | null;
  /** The reader holds everything; someone given a look at a person's own holds only what was shared. */
  full: boolean;
  hero: { kind: "due" | "next" | "done" | "visit" | "period" | "cycle" | "sleep" | "empty"; big: Words; line: Words | null };
  meds: MedsPart;
  cycle: CyclePart | null;
  sleep: SleepPart;
  feels: { tracked: FeelTrack[] };
  measures: MeasurePart[];
  visits: { upcoming: Visit[]; past: Visit[] };
  results: { reports: Report[] };
  facts: Fact[];
  units: { temp: "c" | "f"; weight: "kg" | "lb"; glucose: "mgdl" | "mmol" };
  empty: boolean;
}

/* ------------------------------------------------------------------ */
/* Words.                                                               */
/* ------------------------------------------------------------------ */

export const C = {
  // The one thing on top.
  now: { en: "Now", ar: "دلوقتي" },
  next: { en: "Next", ar: "الجاية" },
  lastNight: { en: "Last night", ar: "الليلة اللي فاتت" },
  nextVisit: { en: "Next visit", ar: "الزيارة الجاية" },
  markTaken: { en: "Mark as taken", ar: "علّم إنها اتاخدت" },
  markGiven: { en: "Mark as given", ar: "علّم إنها اتاخدت" },
  // Today's doses.
  dosesToday: { en: "Doses today", ar: "جرعات النهارده" },
  due: { en: "Due now", ar: "مستنية دلوقتي" },
  later: { en: "Later today", ar: "بعدين النهارده" },
  skipped: { en: "Skipped", ar: "اتسابت" },
  asNeeded: { en: "As needed", ar: "عند اللزوم" },
  giveOne: { en: "Give one", ar: "ادّي جرعة" },
  takeOne: { en: "Take one", ar: "خد جرعة" },
  takeBack: { en: "Take the last one back", ar: "الغي آخر جرعة" },
  notNow: { en: "Not now", ar: "مش دلوقتي" },
  // Medicines.
  medicines: { en: "Medicines", ar: "الأدوية" },
  lowHead: { en: "Running low", ar: "قرب يخلص" },
  low: { en: "running low", ar: "قرب يخلص" },
  refill: { en: "New box", ar: "علبة جديدة" },
  refillLine: { en: "How many are in it", ar: "فيها كام" },
  save: { en: "Save", ar: "احفظ" },
  todayWord: { en: "Today", ar: "النهارده" },
  last7: { en: "Last 7 days", ar: "آخر 7 أيام" },
  noDoses: { en: "no doses", ar: "مفيش جرعات" },
  twoWeeks: { en: "The last two weeks", ar: "آخر أسبوعين" },
  // Sleep.
  sleep: { en: "Sleep", ar: "النوم" },
  avg7: { en: "average, last 7 nights", ar: "المتوسط، آخر 7 ليالي" },
  // Names that fit anyone: the app's own ("بتنام", "بتصحى") read as "she" about a person the page is kept for.
  usualBed: { en: "Usual bed", ar: "ميعاد النوم" },
  usualWake: { en: "Usual wake", ar: "ميعاد الصحيان" },
  short: { en: "Short, 7 nights", ar: "ناقص، 7 ليالي" },
  noNight: { en: "no night logged", ar: "مفيش ليلة متسجلة" },
  // The cycle.
  cycle: { en: "Cycle", ar: "الدورة" },
  cycleDay: { en: "Cycle day", ar: "يوم الدورة" },
  cycleLength: { en: "Cycle", ar: "الدورة" },
  periodLength: { en: "Period", ar: "مدتها" },
  days: { en: "days", ar: "يوم" },
  rough: { en: "A rough estimate until three cycles are logged.", ar: "تقدير تقريبي لحد ما تتسجل تلات دورات." },
  estimateNote: { en: "Estimates from the cycles logged. Not for planning or preventing a pregnancy.", ar: "تقديرات من الدورات المتسجلة. مش للتخطيط لحمل أو منعه." },
  // How they feel.
  feelFor: { en: "How they feel", ar: "الإحساس" },
  // Readings.
  numbers: { en: "Readings", ar: "القراءات" },
  avg30: { en: "30 day average", ar: "متوسط 30 يوم" },
  upperLine: { en: "The line follows the upper number.", ar: "الخط ماشي مع الرقم العالي." },
  // Records.
  visits: { en: "Visits", ar: "الزيارات" },
  aVisit: { en: "A visit", ar: "زيارة" },
  past: { en: "Past", ar: "اللي فات" },
  place: { en: "Where", ar: "فين" },
  saidThere: { en: "What was said", ar: "اللي اتقال" },
  changed: { en: "What changed", ar: "اللي اتغير" },
  followUp: { en: "Follow up", ar: "المتابعة" },
  results: { en: "Lab results", ar: "التحاليل" },
  outside: { en: "outside its printed range", ar: "برّه المدى المكتوب" },
  rangeNote: { en: "A value is only compared with the range its own report printed. What it means is the doctor’s to say.", ar: "القيمة بتتقارن بس بالمدى المكتوب في تحليلها. معناها يقوله الدكتور." },
  cardFor: { en: "The card", ar: "البطاقة" },
  // Someone given a look, and a page with nothing on it.
  nothingYet: { en: "Nothing yet", ar: "لسه مفيش" },
  nothingShared: { en: "Nothing is shared with you here yet.", ar: "لسه مفيش حاجة متشاركة معاك هنا." },
  nothingKept: { en: "Medicines and their times show here once they are added in Krovvi.", ar: "الأدوية ومواعيدها هتظهر هنا أول ما تتضاف في كروفي." },
  health: { en: "Health", ar: "الصحة" },
} satisfies Record<string, Words>;

/** The four words for how strong a symptom was on a day, 0 to 3 (catch8 kinds/health.ts LEVEL_WORDS). */
export const LEVEL_WORDS: Words[] = [
  { en: "None", ar: "مفيش" },
  { en: "Mild", ar: "خفيف" },
  { en: "Moderate", ar: "متوسط" },
  { en: "Strong", ar: "شديد" },
];

/** What the card groups by (catch8 kinds/health.ts FACT_NAMES), in the card's own order. */
export const FACT_NAMES: Array<[FactKind, Words]> = [
  ["condition", { en: "Conditions", ar: "حالات صحية" }],
  ["allergy", { en: "Allergies", ar: "حساسية" }],
  ["vaccine", { en: "Vaccines", ar: "تطعيمات" }],
  ["blood", { en: "Blood type", ar: "فصيلة الدم" }],
  ["contact", { en: "Emergency contact", ar: "للطوارئ" }],
];

export const DOT = " · ";

/** "Taken 7:10 AM", "Given 8:05 AM by Lina". */
export const takenAt = (time: string, by: string | null, own: boolean): Words =>
  own || !by ? { en: `Taken ${time}`, ar: `اتاخدت ${time}` } : { en: `Given ${time} by ${iso(by)}`, ar: `اتاخدت ${time}، ${iso(by)}` };

/** "1 of 3", read as doses. */
export const ofDoses = (given: number, total: number): Words => ({ en: `${given} of ${total}`, ar: `${given} من ${total}` });

/** "6 pills left, about 6 days". */
export const pillsLeftWords = (left: number, days: number | null): Words => ({
  en: `${left} ${left === 1 ? "pill" : "pills"} left${days !== null ? `, about ${days} ${days === 1 ? "day" : "days"}` : ""}`,
  ar: `فاضل ${left} ${left >= 3 && left <= 10 ? "حبايات" : "حباية"}${days !== null ? `، حوالي ${days === 1 ? "يوم" : days === 2 ? "يومين" : days <= 10 ? `${days} أيام` : `${days} يوم`}` : ""}`,
});

/** "2 today" for a medicine taken only when needed. */
export const takenToday = (n: number): Words => ({ en: `${n} today`, ar: n === 1 ? "مرة النهارده" : n === 2 ? "مرتين النهارده" : `${n} مرات النهارده` });

/** "felt on 9 of the last 30 days". */
export const feltDays = (n: number): Words => ({ en: `felt on ${n} of the last 30 days`, ar: n === 1 ? "اتحس يوم واحد من آخر 30" : n === 2 ? "اتحس يومين من آخر 30" : `اتحس ${n} ${n <= 10 ? "أيام" : "يوم"} من آخر 30` });

/** "4 outside their printed range". */
export const outsideCount = (n: number): Words => ({ en: n === 1 ? "1 outside its printed range" : `${n} outside their printed range`, ar: n === 1 ? "واحد برّه المدى المكتوب" : n === 2 ? "اتنين برّه المدى المكتوب" : `${n} برّه المدى المكتوب` });

/** "Maya shares only this with you." The Arabic says it without a verb for the person, so it fits anyone. */
export const sharedBy = (name: string): Words => ({ en: `${iso(name)} shares only this with you.`, ar: `ده بس اللي متشارك معاك من ${iso(name)}.` });

/** "Kept for Mom". */
export const keptFor = (name: string): Words => ({ en: `Kept for ${iso(name)}`, ar: `لـ ${iso(name)}` });

/** "The 8:00 PM Metformin is still to come. Mark it given now?": asked once before a dose is marked hours ahead of its time. */
export const stillToCome = (time: string, name: string, own: boolean): Words => ({ en: `The ${time} ${iso(name)} is still to come. Mark it ${own ? "taken" : "given"} now?`, ar: `جرعة ${time} من ${iso(name)} لسه ميعادها مجاش. نعلّم إنها اتاخدت دلوقتي؟` });

/** What a tick on a dose does, for a screen reader: someone who helps gives a dose, a person takes their own. */
export const tickWords = (name: string, time: string, done: boolean, own: boolean): Words =>
  done
    ? { en: `${own ? "Taken" : "Given"}: ${name}, ${time}. Tap to take the mark back`, ar: `اتاخدت: ${name}، ${time}. دوس عشان العلامة تتشال` }
    : { en: `Mark as ${own ? "taken" : "given"}: ${name}, ${time}`, ar: `علّم إنها اتاخدت: ${name}، ${time}` };

/** Minutes as a person says a night: "7 h 10 min", "8 h" (catch8 kinds/health.ts sleepWords). */
export function sleepWords(mins: number): Words {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins - h * 60);
  if (!h) return { en: `${m} min`, ar: `${m} دقيقة` };
  return m ? { en: `${h} h ${m} min`, ar: `${h} س ${m} د` } : { en: `${h} h`, ar: `${h} ساعات` };
}

/** A length of sleep in a small space: "4h 38m". */
export function sleepShort(mins: number): Words {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins - h * 60);
  return { en: h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`, ar: h ? (m ? `${h}س ${m}د` : `${h}س`) : `${m}د` };
}

/** Parts joined in the page's language, each isolated so an Arabic name in an English line (or the reverse) keeps its place. */
export const list = (parts: Array<string | null | undefined | false>, lang: Lang): string => parts.filter((p): p is string => !!p).map(iso).join(lang === "ar" ? "، " : ", ");

/** A kept reading in the object's own unit, as a plain number for a chart's side (catch8 kinds/health.ts measureShown). */
export function measureShown(kind: MeasurePart["kind"], value: number, units: HealthView["units"]): number {
  const round1 = (n: number) => Math.round(n * 10) / 10;
  if (kind === "temp" && units.temp === "f") return round1(value * 1.8 + 32);
  if (kind === "weight" && units.weight === "lb") return round1(value * 2.2046226218);
  if (kind === "glucose" && units.glucose === "mmol") return round1(value / 18.016);
  return kind === "temp" || kind === "weight" ? round1(value) : Math.round(value);
}

/* ------------------------------------------------------------------ */
/* What the page asks the door for.                                     */
/* ------------------------------------------------------------------ */

/**
 * Every change this page makes, each as the kind's op with the args that op
 * reads (catch8 supabase/functions/_shared/objects/kinds/health.ts: take,
 * untake and refill are the ops a page may run). The page builds its calls
 * here and nowhere else, so what a button sends can be checked against the
 * kind's own rules by itself.
 */
export const CALLS = {
  /** One of today's doses, by its medicine and its time. */
  take: (x: { med: string; time: string }): Call => ({ op: "take", args: { med: x.med, time: x.time } }),
  untake: (x: { med: string; time: string }): Call => ({ op: "untake", args: { med: x.med, time: x.time } }),
  /** One dose of a medicine taken only when needed, now; and the latest of today's taken back. */
  takeOne: (med: { id: string }): Call => ({ op: "take", args: { med: med.id } }),
  takeBack: (med: { id: string }): Call => ({ op: "untake", args: { med: med.id } }),
  /** A new box: the pills in it, added to what is left. */
  refill: (med: { id: string }, add: number): Call => ({ op: "refill", args: { med: med.id, add } }),
};
