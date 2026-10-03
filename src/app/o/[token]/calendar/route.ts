import { calendarFile, type ObjectEvent } from "@/lib/calendar-file";
import { OBJECTS_API } from "@/lib/objects";

/**
 * krovvi.com/o/<token>/calendar: the day a shared plan or countdown is about,
 * as a calendar file. The iPhone opens it straight in Calendar with an Add
 * button, and so do the Mac and Outlook. It is served inline, because Safari
 * keeps an attachment in Files instead. The event comes from the objects
 * function, read the way anyone holding the link reads the object; with no
 * day (still voting, or past) there is nothing to add.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{20,40}$/.test(token)) return new Response("Not found", { status: 404 });
  try {
    const res = await fetch(`${OBJECTS_API}?t=${encodeURIComponent(token)}&event=1`, { cache: "no-store", signal: AbortSignal.timeout(4000) });
    const body = (await res.json()) as { ok?: boolean; event?: ObjectEvent | null };
    if (!body.ok || !body.event) return new Response("Not found", { status: 404 });
    const event = body.event;
    const file = calendarFile(event, { uid: `${token}@krovvi.com`, url: `https://krovvi.com/o/${token}`, now: Date.now() });
    const name = event.title.replace(/[^\w -]+/g, "").trim() || "event";
    return new Response(file, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `inline; filename="${name}.ics"; filename*=UTF-8''${encodeURIComponent(event.title)}.ics`,
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
