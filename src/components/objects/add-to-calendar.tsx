"use client";

import { useEffect, useState } from "react";

import { googleLink, type ObjectEvent } from "@/lib/calendar-file";
import { OBJECTS_API, say, type Lang, type Words } from "@/lib/objects";
import { INK, STEP } from "./kit";

const C = {
  add: { en: "Add to calendar", ar: "ضيفه للتقويم" },
  google: { en: "Google Calendar", ar: "تقويم جوجل" },
  other: { en: "Other calendars", ar: "تقويمات تانية" },
} satisfies Record<string, Words>;

/**
 * Add to calendar on the page, for a plan once its day is known and a
 * countdown's day. On an iPhone or a computer it is the calendar file
 * (app/o/[token]/calendar), which Calendar opens with an Add button; on
 * Android, Google Calendar's own add screen, since Android has no file
 * importer of its own. The other way sits under it, small. The day comes
 * from the objects function, read again as the object changes (`version`),
 * so a plan decided while the page is open gains the button; nothing shows
 * while there is no day.
 */
export function AddToCalendar({ token, lang, version }: { token: string; lang: Lang; version: number }) {
  const [event, setEvent] = useState<ObjectEvent | null>(null);
  const [android, setAndroid] = useState(false);
  useEffect(() => setAndroid(/android/i.test(navigator.userAgent)), []);
  useEffect(() => {
    let live = true;
    fetch(`${OBJECTS_API}?t=${encodeURIComponent(token)}&event=1`, { cache: "no-store" })
      .then((res) => res.json() as Promise<{ ok?: boolean; event?: ObjectEvent | null }>)
      .then((body) => live && setEvent(body.ok && body.event ? body.event : null))
      .catch(() => live && setEvent(null));
    return () => {
      live = false;
    };
  }, [token, version]);
  if (!event) return null;
  const file = { href: `/o/${token}/calendar`, blank: false };
  const google = { href: googleLink(event, `https://krovvi.com/o/${token}`), blank: true };
  const [main, other] = android ? [google, file] : [file, google];
  return (
    <div className="flex flex-col items-center" style={{ gap: 8, paddingTop: 6 }}>
      <a
        href={main.href}
        target={main.blank ? "_blank" : undefined}
        rel={main.blank ? "noopener noreferrer" : undefined}
        className="inline-flex items-center rounded-full transition-transform active:scale-[0.97]"
        style={{ ...STEP.label, fontWeight: 600, padding: "0 16px", height: 36, background: INK.surfaceHi, color: INK.fg }}
      >
        {say(C.add, lang)}
      </a>
      <a
        href={other.href}
        target={other.blank ? "_blank" : undefined}
        rel={other.blank ? "noopener noreferrer" : undefined}
        className="underline decoration-dotted underline-offset-2"
        style={{ ...STEP.meta, color: INK.muted }}
      >
        {say(android ? C.other : C.google, lang)}
      </a>
    </div>
  );
}
