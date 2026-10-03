/**
 * The day an object is about, as a calendar takes it: a calendar file
 * (.ics, RFC 5545) that the iPhone's Calendar, Outlook and the Mac open with
 * an Add button, and Google Calendar's own add screen for Android. Pure: the
 * page and the route (app/o/[token]/calendar) build from the same event.
 */

/** The day an object is about, as the objects function sends it (the core's ObjectEvent, catch8 _shared/objects/types.ts). */
export interface ObjectEvent {
  title: string;
  /** "2026-10-09" on the object's calendar, and "20:00" when it has an hour. */
  day: string;
  time: string | null;
  /** When it starts and ends (ms). */
  start: number;
  end: number;
  allDay: boolean;
  tz: string;
  location: string | null;
}

/** An instant in UTC as calendars write it: "20261009T180000Z". The same moment for every reader, wherever they are. */
function utc(ms: number): string {
  return new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** A whole day: "20261009". */
function date(day: string): string {
  return day.replace(/-/g, "");
}

/** The day after, for a whole day's end (a calendar's end day is not part of the event). */
function dayAfter(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

/** Text in a calendar file: backslashes, semicolons, commas and line breaks are escaped. */
function text(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Lines past 75 bytes go on as indented lines, never splitting a letter: Arabic letters are two bytes each. */
function fold(line: string): string {
  const size = (s: string) => new TextEncoder().encode(s).length;
  if (size(line) <= 75) return line;
  const parts: string[] = [];
  let part = "";
  let room = 75;
  for (const ch of line) {
    if (size(part + ch) > room) {
      parts.push(part);
      part = ch;
      // A line that goes on starts with a space, which takes one byte of its 75.
      room = 74;
    } else part += ch;
  }
  parts.push(part);
  return parts.join("\r\n ");
}

/** The calendar file for one event. `uid` stays the same for the same object, so adding it again updates the one already there. */
export function calendarFile(event: ObjectEvent, opts: { uid: string; url: string; now: number }): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Krovvi//Objects//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${opts.uid}`,
    `DTSTAMP:${utc(opts.now)}`,
    ...(event.allDay ? [`DTSTART;VALUE=DATE:${date(event.day)}`, `DTEND;VALUE=DATE:${date(dayAfter(event.day))}`] : [`DTSTART:${utc(event.start)}`, `DTEND:${utc(event.end)}`]),
    `SUMMARY:${text(event.title)}`,
    ...(event.location ? [`LOCATION:${text(event.location)}`] : []),
    `DESCRIPTION:${text(opts.url)}`,
    `URL:${opts.url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `${lines.map(fold).join("\r\n")}\r\n`;
}

/** Google Calendar's own add screen, filled in: how a phone with Google Calendar adds it. */
export function googleLink(event: ObjectEvent, url: string): string {
  const dates = event.allDay ? `${date(event.day)}/${date(dayAfter(event.day))}` : `${utc(event.start)}/${utc(event.end)}`;
  const params = new URLSearchParams({ action: "TEMPLATE", text: event.title, dates, details: url });
  if (event.location) params.set("location", event.location);
  return `https://calendar.google.com/calendar/render?${params}`;
}
