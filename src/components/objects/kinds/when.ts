/**
 * Days and times in the page's words, as the app says them (catch8
 * supabase/functions/_shared/objects/core.ts weekdayName, dayLabel, timeLabel;
 * kept in step by hand). A day is "YYYY-MM-DD" on the object's own calendar,
 * so nothing here reads a clock or a time zone: the server and the browser
 * write the same words.
 */

import type { Lang } from "@/lib/objects";

const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_EN_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** The app's own Egyptian day and month words. */
const WEEKDAYS_AR = ["الحد", "الاتنين", "التلات", "الأربع", "الخميس", "الجمعة", "السبت"];
const MONTHS_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
/** A weekday in one letter, as the Arabic calendar heads its columns. */
const DAY_LETTERS_AR = ["ح", "ن", "ث", "ر", "خ", "ج", "س"];

const ms = (day: string) => Date.UTC(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10)));

/** 0 Sunday to 6 Saturday. */
export function weekdayOf(day: string): number {
  return new Date(ms(day)).getUTCDay();
}

export function addDays(day: string, n: number): string {
  return new Date(ms(day) + n * 86_400_000).toISOString().slice(0, 10);
}

/** Whole days from one day to another: 1 from today to tomorrow. */
export function daysBetween(from: string, to: string): number {
  return Math.round((ms(to) - ms(from)) / 86_400_000);
}

export function weekdayName(day: string, lang: Lang, long = false): string {
  const i = weekdayOf(day);
  return lang === "ar" ? WEEKDAYS_AR[i] : long ? WEEKDAYS_EN_LONG[i] : WEEKDAYS_EN[i];
}

/** "M", or the Arabic calendar's own letter. */
export function dayLetter(day: string, lang: Lang): string {
  return lang === "ar" ? DAY_LETTERS_AR[weekdayOf(day)] : WEEKDAYS_EN[weekdayOf(day)].slice(0, 1);
}

/** "Fri 16 Oct" or "الجمعة 16 أكتوبر"; the year only when it is not `thisYear`'s. */
export function dayLabel(day: string, lang: Lang, opts: { weekday?: boolean; thisYear?: string } = {}): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return day;
  const month = Number(day.slice(5, 7)) - 1;
  const date = Number(day.slice(8, 10));
  const year = opts.thisYear && opts.thisYear.slice(0, 4) !== day.slice(0, 4) ? ` ${day.slice(0, 4)}` : "";
  const weekday = opts.weekday === false ? "" : `${weekdayName(day, lang)} `;
  return lang === "ar" ? `${weekday}${date} ${MONTHS_AR[month]}${year}` : `${weekday}${date} ${MONTHS_EN[month]}${year}`;
}

/** "9:30 AM" or "9:30 ص" from "09:30". */
export function timeLabel(time: string, lang: Lang): string {
  const [hh, mm] = time.split(":").map(Number);
  const pm = hh >= 12;
  const h = hh % 12 === 0 ? 12 : hh % 12;
  return `${h}:${String(mm || 0).padStart(2, "0")} ${lang === "ar" ? (pm ? "م" : "ص") : pm ? "PM" : "AM"}`;
}

/** "1,234" and "12.5", with the digits and the comma the rest of the page uses in both languages. */
export function figure(value: number, places = 0): string {
  return value.toLocaleString("en-US", { minimumFractionDigits: places, maximumFractionDigits: places });
}

/** Digits typed on an Arabic or a Persian keyboard, as the digits the page writes everywhere. */
export function western(text: string): string {
  return text.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
}
