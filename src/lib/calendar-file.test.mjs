// The calendar file and Google Calendar link (calendar-file.ts), run with `npm test` (node --test; Node strips the
// types). Kept as .mjs so the site's type check and build leave it alone. Expected file text is written with
// String.raw, so a backslash in it is the backslash the file must hold: a slip in escaping cannot hide in both.
import assert from "node:assert/strict";
import { test } from "node:test";

import { calendarFile, googleLink } from "./calendar-file.ts";

const at = (h, m) => Date.UTC(2026, 9, 9, h, m);
const timed = { title: "Game night, at last; bring snacks", day: "2026-10-09", time: "20:00", start: at(17, 0), end: at(19, 0), allDay: false, tz: "Africa/Cairo", location: "Sam's place; 2nd floor, flat 4" };
const allDay = { ...timed, title: "رحلة لشبونة مع العيلة كلها والأصحاب اللي هييجوا معانا من القاهرة", time: null, allDay: true, day: "2026-12-31", location: null };
const file = (e) => calendarFile(e, { uid: "tok@krovvi.com", url: "https://krovvi.com/o/tok", now: Date.UTC(2026, 9, 4, 1, 0) });

test("escapes commas, semicolons, backslashes and line breaks in a title and a place, as RFC 5545 asks", () => {
  const f = file(timed);
  assert.ok(f.includes(String.raw`SUMMARY:Game night\, at last\; bring snacks` + "\r\n"), f);
  assert.ok(f.includes(String.raw`LOCATION:Sam's place\; 2nd floor\, flat 4` + "\r\n"), f);
  // No semicolon or comma in the text is left bare.
  const summary = f.split("\r\n").find((l) => l.startsWith("SUMMARY:")).slice("SUMMARY:".length);
  assert.equal(/(^|[^\\])[;,]/.test(summary), false, summary);
  const odd = file({ ...timed, title: String.raw`back\slash` + "\nnext line" });
  assert.ok(odd.includes(String.raw`SUMMARY:back\\slash\nnext line` + "\r\n"), odd);
});

test("a timed event is in UTC, every line ends in CRLF, and the stamp is when it was made", () => {
  const f = file(timed);
  assert.ok(f.includes("DTSTART:20261009T170000Z\r\n"));
  assert.ok(f.includes("DTEND:20261009T190000Z\r\n"));
  assert.ok(f.includes("DTSTAMP:20261004T010000Z\r\n"));
  assert.ok(f.endsWith("END:VCALENDAR\r\n"));
  assert.equal(/[^\r]\n/.test(f), false, "every line ends in CRLF");
});

test("a whole day runs to the next day across a year end, and a long Arabic title folds between letters", () => {
  const f = file(allDay);
  assert.ok(f.includes("DTSTART;VALUE=DATE:20261231\r\n"));
  assert.ok(f.includes("DTEND;VALUE=DATE:20270101\r\n"));
  for (const line of f.split("\r\n")) assert.ok(new TextEncoder().encode(line).length <= 75, `folded: ${line}`);
  assert.ok(f.replace(/\r\n /g, "").includes(`SUMMARY:${allDay.title}`), "unfolds back to the whole title");
  assert.equal(f.includes("�"), false);
});

test("Google Calendar gets the same times, and the place as it is", () => {
  const g = new URL(googleLink(timed, "https://krovvi.com/o/tok"));
  assert.equal(g.searchParams.get("dates"), "20261009T170000Z/20261009T190000Z");
  assert.equal(g.searchParams.get("location"), "Sam's place; 2nd floor, flat 4");
  assert.equal(new URL(googleLink(allDay, "u")).searchParams.get("dates"), "20261231/20270101");
});
