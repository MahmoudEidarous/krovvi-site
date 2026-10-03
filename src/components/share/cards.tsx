"use client";

/**
 * The cards a shared answer shows, from the copy's own data (never read
 * again from the owner's account): the weather as it was then, clocks,
 * places, and a live object frozen at how it stood when it was shared, drawn
 * by that kind's own view on the page (components/objects/kinds), read only.
 */

import { INK, STEP } from "@/components/objects/kit";
import { KIND_PAGES } from "@/components/objects/kinds";
import { KindMark } from "@/components/objects/mark";
import type { PagePayload } from "@/lib/objects";

export interface ShareCard {
  kind: string;
  data: unknown;
}

const CARD = { background: INK.surface, borderRadius: 17, overflow: "hidden" } as const;

function tempColor(c: number): string {
  if (c <= 12) return INK.cold;
  if (c >= 32) return INK.warm;
  return INK.fg;
}

function Weather({ data, lang }: { data: any; lang: "en" | "ar" }) {
  const hours = (data.hours ?? []).slice(0, 12) as Array<{ at: number; temp: number; rain: number }>;
  const days = (data.days ?? []).slice(0, 7) as Array<{ date: string; high: number; low: number; rain: number }>;
  const fmtHour = (at: number) => new Intl.DateTimeFormat(lang === "ar" ? "ar-EG-u-nu-latn" : "en-GB", { hour: "numeric", timeZone: data.timeZone }).format(new Date(at));
  const fmtDay = (d: string) => new Intl.DateTimeFormat(lang === "ar" ? "ar-EG-u-nu-latn" : "en-GB", { weekday: "short", timeZone: "UTC" }).format(new Date(`${d}T12:00:00Z`));
  return (
    <div className="mb-3" style={CARD}>
      <div style={{ padding: "14px 16px" }}>
        <div dir="auto" style={{ ...STEP.label, color: INK.muted }}>{data.place}</div>
        <div style={{ fontSize: 52, lineHeight: "58px", fontWeight: 500, color: tempColor(data.now?.temp ?? 20) }}>{Math.round(data.now?.temp ?? 0)}°</div>
        {data.now?.feels != null ? <div style={{ ...STEP.meta, color: INK.muted }}>{lang === "ar" ? `الإحساس ${Math.round(data.now.feels)}°` : `Feels like ${Math.round(data.now.feels)}°`}</div> : null}
      </div>
      {hours.length ? (
        <div className="flex overflow-x-auto" style={{ gap: 14, padding: "4px 16px 12px", borderTop: `0.5px solid ${INK.line}` }}>
          {hours.map((h, n) => (
            <div key={n} className="flex shrink-0 flex-col items-center" style={{ gap: 4, paddingTop: 8 }}>
              <span style={{ ...STEP.meta, color: INK.muted }}>{fmtHour(h.at)}</span>
              <span className="rounded-full" style={{ width: 7, height: 7, background: tempColor(h.temp) }} />
              <span style={{ ...STEP.label, color: INK.fg }}>{Math.round(h.temp)}°</span>
            </div>
          ))}
        </div>
      ) : null}
      {days.map((d, n) => (
        <div key={n} className="flex items-center justify-between" style={{ padding: "9px 16px", borderTop: `0.5px solid ${INK.line}` }}>
          <span style={{ ...STEP.body }}>{fmtDay(d.date)}</span>
          <span style={{ ...STEP.body, fontVariantNumeric: "tabular-nums" }}>
            <span style={{ color: INK.muted }}>{Math.round(d.low)}°</span> <span style={{ color: tempColor(d.high) }}>{Math.round(d.high)}°</span>
          </span>
        </div>
      ))}
      <div style={{ ...STEP.meta, color: INK.muted, padding: "8px 16px", borderTop: `0.5px solid ${INK.line}` }}>MET Norway</div>
    </div>
  );
}

function Clocks({ data, lang }: { data: any; lang: "en" | "ar" }) {
  const at = typeof data.at === "number" ? data.at : Date.now();
  const rows = (data.rows ?? []) as Array<{ label: string; timeZone: string }>;
  return (
    <div className="mb-3" style={CARD}>
      {rows.map((r, n) => {
        let time = "";
        try {
          time = new Intl.DateTimeFormat(lang === "ar" ? "ar-EG-u-nu-latn" : "en-GB", { hour: "numeric", minute: "2-digit", hour12: true, weekday: "short", timeZone: r.timeZone }).format(new Date(at));
        } catch {
          time = "";
        }
        return (
          <div key={n} className="flex items-baseline justify-between" style={{ padding: "12px 16px", borderTop: n ? `0.5px solid ${INK.line}` : undefined }}>
            <span dir="auto" style={{ ...STEP.title }}>{r.label}</span>
            <span dir="ltr" style={{ ...STEP.figure, fontSize: 20 }}>{time}</span>
          </div>
        );
      })}
    </div>
  );
}

function Places({ data }: { data: any }) {
  const places = (data.places ?? []) as Array<{ name: string; address: string; rating: number | null; category: string | null; note: string | null; mapsUrl: string | null }>;
  return (
    <div className="mb-3" style={CARD}>
      {places.map((p, n) => (
        <a key={n} href={p.mapsUrl ?? `https://maps.google.com/?q=${encodeURIComponent(`${p.name} ${p.address}`)}`} target="_blank" rel="noopener noreferrer nofollow" className="block active:opacity-70" style={{ padding: "12px 16px", borderTop: n ? `0.5px solid ${INK.line}` : undefined }}>
          <span className="flex items-baseline justify-between" style={{ gap: 12 }}>
            <span dir="auto" style={{ ...STEP.title }}>{p.name}</span>
            {p.rating != null ? <span style={{ ...STEP.label, color: INK.pick }}>★ {p.rating.toFixed(1)}</span> : null}
          </span>
          <span dir="auto" className="block" style={{ ...STEP.meta, color: INK.muted }}>{[p.category, p.address].filter(Boolean).join(" · ")}</span>
          {p.note ? <span dir="auto" className="block" style={{ ...STEP.meta, color: INK.soft }}>{p.note}</span> : null}
        </a>
      ))}
    </div>
  );
}

/** A live object as it stood when the chat was shared: its own kind's view, read only. */
function FrozenObject({ data, lang }: { data: any; lang: "en" | "ar" }) {
  const View = KIND_PAGES[data.objectKind];
  const page = {
    ok: true,
    kind: data.objectKind,
    title: data.title,
    lang: data.lang ?? lang,
    state: "live",
    version: 0,
    view: data.view,
    members: [],
    you: null,
    seats: [],
    ops: [],
    activity: [],
    role: "viewer",
    momentWords: {},
    kindName: { en: data.objectKind, ar: data.objectKind },
  } as unknown as PagePayload;
  return (
    <div className="mb-3" style={{ ...CARD, padding: 12 }}>
      <div className="flex items-center gap-3" style={{ padding: "4px 4px 12px" }}>
        <span className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 11, background: INK.surfaceHi }} aria-hidden>
          <KindMark kind={data.objectKind} size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate" style={{ ...STEP.title, textAlign: "start" }}>
            <bdi>{data.title}</bdi>
          </span>
          <span className="block" style={{ ...STEP.meta, color: INK.muted }}>{lang === "ar" ? "زي ما كان وقت المشاركة" : "As it stood when this was shared"}</span>
        </span>
      </div>
      {View ? <View page={page} view={data.view} lang={lang} act={async () => false} can={() => false} busy={false} now={data.at ?? 0} /> : null}
    </div>
  );
}

export function CardView({ card, lang }: { card: ShareCard; lang: "en" | "ar" }) {
  const data = card.data as any;
  if (card.kind === "weather") return <Weather data={data} lang={lang} />;
  if (card.kind === "time") return <Clocks data={data} lang={lang} />;
  if (card.kind === "places") return <Places data={data} />;
  if (card.kind === "object") return <FrozenObject data={data} lang={lang} />;
  return null;
}
