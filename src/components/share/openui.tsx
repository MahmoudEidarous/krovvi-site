"use client";

/**
 * One of Krovvi's live blocks on a shared page (16 November 2026).
 *
 * In the app an answer can hold a small program between ```openui fences, drawn natively: rows with a picture beside
 * each name, pictures side by side with their words, figures, a table, steps, things to tick. The page had no way to
 * draw one, so a shared answer showed its program as code. Here the program is read (lib/openui-program.mjs) and each
 * part is drawn in the page's own look, as it stood when the chat was shared: what a person could move or tap in the
 * app (a slider, a choice, a button) is shown as it was set, and nothing here can be changed. A part the page does not
 * draw, and a block it cannot read, is simply not there: never code, never a hole.
 *
 * Pictures load from where the answer found them, https only, lazily, and without telling that site which page asked.
 */

import type { CSSProperties, ReactNode } from "react";

import { INK, STEP } from "@/components/objects/kit";
import { addressOf, partsIn, readProgram, tileRows, wordsOf } from "@/lib/openui-program.mjs";

import { CardView } from "./cards";
import { Diagram } from "./diagram";
import { inline, type RenderEnv } from "./markdown";

interface Part {
  part: string;
  props: Record<string, unknown>;
}

const CARD: CSSProperties = { background: INK.surface, borderRadius: 17, overflow: "hidden" };
const PAD = 16;
const GAP = 14;

const isPart = (x: unknown): x is Part => !!x && typeof x === "object" && !Array.isArray(x) && typeof (x as Part).part === "string";
const parts = (value: unknown, name?: string): Part[] => partsIn(value, name) as Part[];

/** A picture from the web: lazily, with no word to its site of who asked, and gone without a hole when it does not load. */
function Pic({ src, alt, style }: { src: string; alt: string; style: CSSProperties }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      style={{ display: "block", objectFit: "cover", background: INK.surfaceHi, ...style }}
      onError={(e) => {
        e.currentTarget.style.visibility = "hidden";
      }}
    />
  );
}

function Pill({ words }: { words: string }) {
  return (
    <span dir="auto" style={{ ...STEP.meta, fontWeight: 600, color: INK.pick, background: "rgba(230,220,200,0.12)", borderRadius: 10, padding: "2px 8px", display: "inline-block" }}>
      {words}
    </span>
  );
}

function Rule({ from = 0 }: { from?: number }) {
  return <div style={{ height: 0.5, background: INK.line, marginInlineStart: from }} />;
}

/** Rows of things: with pictures each one large enough to see the thing, the word that marks it under its name. */
function ListView({ p, k }: { p: Part; k: string }) {
  const items = parts(p.props.items, "Item").filter((it) => wordsOf(it.props.title));
  if (!items.length) return null;
  const seen = items.some((it) => addressOf(it.props.picture));
  const numbered = p.props.numbered === true;
  return (
    <div>
      {items.map((it, n) => {
        const picture = addressOf(it.props.picture);
        const title = wordsOf(it.props.title);
        const detail = wordsOf(it.props.detail);
        const badge = wordsOf(it.props.badge);
        return (
          <div key={n}>
            {n ? <Rule from={(numbered ? 30 : 0) + (seen ? 84 : 0)} /> : null}
            <div className="flex" style={{ gap: 12, padding: seen ? "12px 0" : "10px 0", alignItems: seen ? "flex-start" : "center" }}>
              {numbered ? (
                <span className="shrink-0" style={{ ...STEP.title, color: INK.soft, width: 18, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
                  {n + 1}
                </span>
              ) : null}
              {seen ? (
                picture ? (
                  <a href={picture} target="_blank" rel="noopener noreferrer" className="shrink-0" aria-label={title}>
                    <Pic src={picture} alt={title} style={{ width: 72, height: 72, borderRadius: 14 }} />
                  </a>
                ) : (
                  <span className="shrink-0" style={{ width: 72 }} />
                )
              ) : null}
              <span className="min-w-0 flex-1">
                <span dir="auto" className="block" style={{ ...STEP.body, fontSize: seen ? 16 : 15, fontWeight: 600, color: INK.fg }}>
                  {inline(title, `${k}t${n}`)}
                </span>
                {seen && badge ? (
                  <span className="block" style={{ marginTop: 4 }}>
                    <Pill words={badge} />
                  </span>
                ) : null}
                {detail ? (
                  <span dir="auto" className="block" style={{ ...STEP.body, color: INK.soft, marginTop: seen ? 3 : 1 }}>
                    {inline(detail, `${k}d${n}`)}
                  </span>
                ) : null}
              </span>
              {!seen && badge ? <Pill words={badge} /> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** One picture large, or two to six side by side, every one on the page with its own words under it. */
export function Pictures({ pictures, rtl }: { pictures: Array<{ url: string; caption: string; source: string }>; rtl: boolean }) {
  if (!pictures.length) return null;
  if (pictures.length === 1) {
    const one = pictures[0];
    const words = [one.caption, one.source].filter(Boolean).join(" · ");
    return (
      <figure style={{ margin: 0 }}>
        <a href={one.url} target="_blank" rel="noopener noreferrer" aria-label={words || "Picture"}>
          <Pic src={one.url} alt={words} style={{ width: "100%", maxHeight: 360, borderRadius: 14 }} />
        </a>
        {words ? (
          <figcaption dir="auto" style={{ ...STEP.meta, color: INK.muted, marginTop: 8 }}>
            {words}
          </figcaption>
        ) : null}
      </figure>
    );
  }
  const shown = pictures.slice(0, 6);
  const rows: Array<typeof shown> = [];
  let at = 0;
  for (const n of tileRows(shown.length)) {
    rows.push(shown.slice(at, at + n));
    at += n;
  }
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {rows.map((row, r) => (
        <div key={r} style={{ display: "grid", gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))`, gap: 8, direction: rtl ? "rtl" : "ltr" }}>
          {row.map((p, n) => (
            <figure key={n} style={{ margin: 0, minWidth: 0 }}>
              <a href={p.url} target="_blank" rel="noopener noreferrer" aria-label={p.caption || "Picture"}>
                <Pic src={p.url} alt={p.caption} style={{ width: "100%", aspectRatio: row.length >= 3 ? "3 / 4" : "1 / 1", borderRadius: 14 }} />
              </a>
              {p.caption ? (
                <figcaption dir="auto" style={{ ...STEP.label, fontWeight: 600, color: INK.fg, marginTop: 6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                  {p.caption}
                </figcaption>
              ) : null}
              {p.source ? (
                <div dir="auto" style={{ ...STEP.meta, color: INK.muted, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {p.source}
                </div>
              ) : null}
            </figure>
          ))}
        </div>
      ))}
    </div>
  );
}

function StatsView({ list }: { list: Part[] }) {
  const stats = list.filter((s) => wordsOf(s.props.label) || wordsOf(s.props.value));
  if (!stats.length) return null;
  return (
    <div className="grid" style={{ gridTemplateColumns: `repeat(${Math.min(3, stats.length)}, minmax(0, 1fr))`, gap: 12 }}>
      {stats.map((s, n) => {
        const value = wordsOf(s.props.value);
        const unit = wordsOf(s.props.unit);
        const note = wordsOf(s.props.note);
        const trend = s.props.trend === "up" || s.props.trend === "down" ? s.props.trend : null;
        // A fall is good news when the part says so (a cost, a wait).
        const good = trend ? (s.props.better === "less" ? trend === "down" : trend === "up") : null;
        return (
          <div key={n} style={{ minWidth: 0 }}>
            <div dir="auto" style={{ ...STEP.label, color: INK.muted }}>{wordsOf(s.props.label)}</div>
            {value ? (
              <div style={{ ...STEP.figure, color: INK.fg, margin: "2px 0" }}>
                {value}
                {unit ? <span style={{ ...STEP.label, color: INK.muted, marginInlineStart: 4 }}>{unit}</span> : null}
              </div>
            ) : null}
            {note ? (
              <div dir="auto" style={{ ...STEP.meta, color: good === null ? INK.muted : good ? INK.up : INK.down }}>
                {trend === "up" ? "▲ " : trend === "down" ? "▼ " : ""}
                {note}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function TableView({ p, k }: { p: Part; k: string }) {
  const columns = (Array.isArray(p.props.columns) ? p.props.columns : []).map(wordsOf);
  const rows = (Array.isArray(p.props.rows) ? p.props.rows : []).filter(Array.isArray) as unknown[][];
  if (!columns.length || !rows.length) return null;
  const caption = wordsOf(p.props.caption);
  return (
    <div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              {columns.map((c, n) => (
                <th key={n} dir="auto" style={{ ...STEP.label, color: INK.muted, textAlign: "start", padding: "6px 10px 6px 0", borderBottom: `0.5px solid ${INK.line}`, whiteSpace: "nowrap" }}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 12).map((row, r) => (
              <tr key={r}>
                {columns.map((_, n) => (
                  <td key={n} dir="auto" style={{ ...STEP.body, color: n === 0 ? INK.fg : INK.soft, fontWeight: n === 0 ? 600 : 400, padding: "8px 10px 8px 0", borderBottom: r < rows.length - 1 ? `0.5px solid ${INK.line}` : undefined, verticalAlign: "top" }}>
                    {inline(wordsOf(row[n]), `${k}r${r}c${n}`)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {caption ? <div dir="auto" style={{ ...STEP.meta, color: INK.muted, marginTop: 8 }}>{caption}</div> : null}
    </div>
  );
}

function Tick({ done }: { done: boolean }) {
  return (
    <span className="flex shrink-0 items-center justify-center rounded-full" style={{ width: 20, height: 20, ...(done ? { background: INK.fg } : { border: `1.5px solid ${INK.faint}` }) }}>
      {done ? (
        <svg width="10" height="10" viewBox="0 0 24 24" aria-hidden>
          <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={INK.bg} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </span>
  );
}

/** A row with a leading mark and words under one another: the shape of steps, moments, ticks and stages. */
function Lined({ lead, title, detail, extra, k }: { lead: ReactNode; title: string; detail?: string; extra?: string; k: string }) {
  return (
    <div className="flex" style={{ gap: 12, padding: "6px 0" }}>
      {lead}
      <span className="min-w-0 flex-1">
        <span dir="auto" className="block" style={{ ...STEP.body, fontWeight: 600, color: INK.fg }}>{inline(title, `${k}t`)}</span>
        {detail ? <span dir="auto" className="block" style={{ ...STEP.body, color: INK.soft }}>{inline(detail, `${k}d`)}</span> : null}
        {extra ? <span dir="auto" className="block" style={{ ...STEP.meta, color: INK.muted }}>{extra}</span> : null}
      </span>
    </div>
  );
}

function Num({ n }: { n: number }) {
  return (
    <span className="flex shrink-0 items-center justify-center rounded-full" style={{ width: 24, height: 24, background: INK.surfaceHi, ...STEP.meta, fontWeight: 600, color: INK.fg }}>
      {n}
    </span>
  );
}

function Label({ words }: { words: string }) {
  return words ? <div dir="auto" style={{ ...STEP.label, color: INK.muted, marginBottom: 6 }}>{words}</div> : null;
}

/** What a person set on something they could move in the app: its name and where it stood when the chat was shared. */
function SetTo({ label, value }: { label: string; value: string }) {
  if (!label && !value) return null;
  return (
    <div className="flex items-baseline justify-between" style={{ gap: 12 }}>
      <span dir="auto" style={{ ...STEP.body, color: INK.soft }}>{label}</span>
      {value ? <span dir="auto" style={{ ...STEP.body, fontWeight: 600, color: INK.fg, fontVariantNumeric: "tabular-nums" }}>{value}</span> : null}
    </div>
  );
}

function optionLabel(options: unknown, value: unknown): string {
  const all = parts(options, "Opt");
  const chosen = all.find((o) => o.props.value === value);
  return wordsOf(chosen?.props.label ?? "");
}

/** One part, drawn; nothing for a part the page does not draw. */
function PartView({ p, env, k }: { p: Part; env: RenderEnv; k: string }): ReactNode {
  const rtl = env.lang === "ar";
  switch (p.part) {
    case "Text": {
      const text = wordsOf(p.props.text);
      if (!text) return null;
      const style = p.props.style === "lead" ? { ...STEP.title, color: INK.fg } : p.props.style === "note" ? { ...STEP.meta, color: INK.muted } : { ...STEP.body, color: INK.fg };
      return (
        <div dir="auto" style={style}>
          {text.split(/\n{2,}/).map((para, n) => (
            <p key={n} style={{ margin: n ? "8px 0 0" : 0 }}>{inline(para.replace(/\n/g, " "), `${k}p${n}`)}</p>
          ))}
        </div>
      );
    }
    case "Note": {
      const text = wordsOf(p.props.text);
      if (!text) return null;
      const warm = p.props.tone === "warning";
      const word = p.props.tone === "tip" ? (rtl ? "نصيحة" : "Tip") : p.props.tone === "important" ? (rtl ? "مهم" : "Important") : warm ? (rtl ? "تنبيه" : "Warning") : "";
      return (
        <div role="note" dir={rtl ? "rtl" : "ltr"} style={{ background: INK.surfaceHi, borderRadius: 14, padding: "10px 12px" }}>
          {word ? <div style={{ ...STEP.label, fontWeight: 600, color: warm ? INK.down : INK.pick, marginBottom: 2 }}>{word}</div> : null}
          <div dir="auto" style={{ ...STEP.body, color: INK.fg }}>{inline(text, `${k}n`)}</div>
        </div>
      );
    }
    case "Stats":
      return <StatsView list={parts(p.props.items, "Stat")} />;
    case "Stat":
      return <StatsView list={[p]} />;
    case "Progress": {
      const value = typeof p.props.value === "number" ? p.props.value : null;
      const of = typeof p.props.of === "number" && p.props.of > 0 ? p.props.of : null;
      if (value === null || of === null) return null;
      const unit = wordsOf(p.props.unit);
      const share = Math.max(0, Math.min(1, value / of));
      return (
        <div>
          <SetTo label={wordsOf(p.props.label)} value={`${value.toLocaleString("en-US")} / ${of.toLocaleString("en-US")}${unit ? ` ${unit}` : ""}`} />
          <div style={{ height: 6, borderRadius: 3, background: INK.track, marginTop: 8, overflow: "hidden" }}>
            <div style={{ height: 6, borderRadius: 3, background: INK.fg, width: `${share * 100}%`, marginInlineStart: 0 }} />
          </div>
          {wordsOf(p.props.note) ? <div dir="auto" style={{ ...STEP.meta, color: INK.muted, marginTop: 6 }}>{wordsOf(p.props.note)}</div> : null}
        </div>
      );
    }
    case "Table":
      return <TableView p={p} k={k} />;
    case "Checklist": {
      const items = parts(p.props.items, "Check").filter((c) => wordsOf(c.props.text));
      if (!items.length) return null;
      let group = "";
      return (
        <div>
          <Label words={wordsOf(p.props.title)} />
          {items.map((c, n) => {
            const g = wordsOf(c.props.group);
            const head = g && g !== group ? g : "";
            group = g || group;
            return (
              <div key={n}>
                {head ? <div dir="auto" style={{ ...STEP.meta, fontWeight: 600, color: INK.muted, margin: n ? "10px 0 2px" : "0 0 2px" }}>{head}</div> : null}
                <Lined lead={<Tick done={c.props.done === true} />} title={wordsOf(c.props.text)} detail={wordsOf(c.props.hint)} k={`${k}c${n}`} />
              </div>
            );
          })}
        </div>
      );
    }
    case "Steps": {
      const items = parts(p.props.items, "Step").filter((s) => wordsOf(s.props.title));
      if (!items.length) return null;
      return (
        <div>
          {items.map((s, n) => (
            <Lined key={n} lead={<Num n={n + 1} />} title={wordsOf(s.props.title)} detail={wordsOf(s.props.detail)} k={`${k}s${n}`} />
          ))}
        </div>
      );
    }
    case "Timeline": {
      const items = parts(p.props.items, "Moment").filter((m) => wordsOf(m.props.title));
      if (!items.length) return null;
      return (
        <div>
          {items.map((m, n) => (
            <Lined key={n} lead={<span className="shrink-0 rounded-full" style={{ width: 8, height: 8, background: INK.faint, marginTop: 7 }} />} title={wordsOf(m.props.title)} detail={wordsOf(m.props.detail)} extra={wordsOf(m.props.when)} k={`${k}m${n}`} />
          ))}
        </div>
      );
    }
    case "Flow": {
      const boxes = parts(p.props.boxes, "Box").filter((b) => wordsOf(b.props.title));
      if (!boxes.length) return null;
      return (
        <div>
          <Label words={wordsOf(p.props.title)} />
          {boxes.map((b, n) => (
            <div key={n}>
              {n ? <div aria-hidden style={{ ...STEP.meta, color: INK.faint, textAlign: "center", padding: "2px 0" }}>↓</div> : null}
              <div style={{ background: INK.surfaceHi, borderRadius: 12, padding: "10px 12px", textAlign: "center", border: b.props.tone === "accent" ? `1px solid ${INK.pick}` : undefined }}>
                <div dir="auto" style={{ ...STEP.body, fontWeight: 600, color: INK.fg }}>{wordsOf(b.props.title)}</div>
                {wordsOf(b.props.detail) ? <div dir="auto" style={{ ...STEP.body, color: INK.soft }}>{wordsOf(b.props.detail)}</div> : null}
              </div>
            </div>
          ))}
        </div>
      );
    }
    case "Diagram": {
      const source = wordsOf(p.props.source);
      return source ? <Diagram code={source} /> : null;
    }
    case "List":
      return <ListView p={p} k={k} />;
    case "Compare": {
      const picks = parts(p.props.items, "Pick").filter((x) => wordsOf(x.props.name));
      if (!picks.length) return null;
      return (
        <div style={{ display: "grid", gap: 10 }}>
          <Label words={wordsOf(p.props.title)} />
          {picks.map((x, n) => {
            const picture = addressOf(x.props.picture);
            const link = addressOf(x.props.link);
            const points = (Array.isArray(x.props.points) ? x.props.points : []).map(wordsOf).filter(Boolean);
            const tag = wordsOf(x.props.tag);
            const value = wordsOf(x.props.value);
            return (
              <div key={n} className="flex" style={{ gap: 12, background: INK.surfaceHi, borderRadius: 14, padding: 12, alignItems: "flex-start" }}>
                {picture ? <Pic src={picture} alt={wordsOf(x.props.name)} style={{ width: 72, height: 72, borderRadius: 12, flexShrink: 0 }} /> : null}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between" style={{ gap: 8 }}>
                    <span dir="auto" style={{ ...STEP.body, fontSize: 16, fontWeight: 600, color: INK.fg }}>{wordsOf(x.props.name)}</span>
                    {value ? <span dir="auto" className="shrink-0" style={{ ...STEP.body, fontWeight: 600, color: INK.fg, fontVariantNumeric: "tabular-nums" }}>{value}</span> : null}
                  </div>
                  {tag ? <div style={{ marginTop: 4 }}><Pill words={tag} /></div> : null}
                  {points.length ? (
                    <div dir="auto" style={{ ...STEP.body, color: INK.soft, marginTop: 4 }}>{points.join(" · ")}</div>
                  ) : null}
                  {link ? (
                    <a href={link} target="_blank" rel="noopener noreferrer" dir="auto" style={{ ...STEP.meta, color: INK.pick, display: "inline-block", marginTop: 6 }}>
                      {new URL(link).hostname.replace(/^www\./, "")} ↗
                    </a>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    case "Gallery": {
      const pictures = parts(p.props.pictures, "Picture")
        .map((x) => ({ url: addressOf(x.props.src), caption: wordsOf(x.props.caption), source: wordsOf(x.props.source) }))
        .filter((x): x is { url: string; caption: string; source: string } => !!x.url);
      return <Pictures pictures={pictures} rtl={rtl} />;
    }
    case "Thing": {
      const card = env.cards[wordsOf(p.props.id)];
      return card ? <CardView card={card} lang={env.lang} /> : null;
    }
    case "Slider": {
      const value = typeof p.props.value === "number" ? p.props.value.toLocaleString("en-US") : "";
      const unit = wordsOf(p.props.unit);
      return <SetTo label={wordsOf(p.props.label)} value={value ? `${value}${unit ? ` ${unit}` : ""}` : ""} />;
    }
    case "Choice":
      return <SetTo label={wordsOf(p.props.label)} value={optionLabel(p.props.options, p.props.value)} />;
    case "Toggle":
      return <SetTo label={wordsOf(p.props.label)} value={p.props.value === true ? (rtl ? "أيوه" : "Yes") : p.props.value === false ? (rtl ? "لأ" : "No") : ""} />;
    case "Field":
      return <SetTo label={wordsOf(p.props.label)} value={wordsOf(p.props.value)} />;
    case "Form": {
      const questions = parts(p.props.questions, "Question").filter((q) => wordsOf(q.props.prompt));
      if (!questions.length) return null;
      return (
        <div style={{ display: "grid", gap: 12 }}>
          {questions.map((q, n) => (
            <div key={n}>
              <div dir="auto" style={{ ...STEP.body, fontWeight: 600, color: INK.fg, marginBottom: 6 }}>{wordsOf(q.props.prompt)}</div>
              <div className="flex flex-wrap" style={{ gap: 6 }}>
                {parts(q.props.options, "Opt").map((o, m) => (
                  <span key={m} dir="auto" style={{ ...STEP.label, color: INK.soft, border: `1px solid ${INK.line}`, borderRadius: 14, padding: "5px 10px" }}>
                    {wordsOf(o.props.label)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }
    case "Tabs": {
      // Every view, one under another, each under its own name: a page has room, and nothing here can be tapped.
      const tabs = parts(p.props.items, "Tab");
      if (!tabs.length) return null;
      return (
        <div style={{ display: "grid", gap: GAP }}>
          {tabs.map((t, n) => (
            <div key={n}>
              <div dir="auto" style={{ ...STEP.title, color: INK.fg, marginBottom: 8 }}>{wordsOf(t.props.label)}</div>
              <Children list={t.props.content} env={env} k={`${k}tab${n}`} />
            </div>
          ))}
        </div>
      );
    }
    case "Card":
      return <CardBody p={p} env={env} k={k} />;
    default:
      // A chart needs the app's own drawing; buttons and next questions are for the person whose chat it is.
      return null;
  }
}

function Children({ list, env, k }: { list: unknown; env: RenderEnv; k: string }) {
  const drawn = (Array.isArray(list) ? list : [])
    .filter(isPart)
    .map((child, n) => <PartView key={n} p={child} env={env} k={`${k}-${n}`} />)
    .filter(Boolean);
  if (!drawn.length) return null;
  return <div style={{ display: "grid", gap: GAP }}>{drawn}</div>;
}

function CardBody({ p, env, k }: { p: Part; env: RenderEnv; k: string }) {
  const title = wordsOf(p.props.title);
  const note = wordsOf(p.props.note);
  const badge = wordsOf(p.props.badge);
  return (
    <div>
      {title || badge ? (
        <div className="flex items-start justify-between" style={{ gap: 12, marginBottom: note ? 2 : 10 }}>
          <span dir="auto" style={{ ...STEP.label, fontWeight: 600, color: INK.soft }}>{title}</span>
          {badge ? <Pill words={badge} /> : null}
        </div>
      ) : null}
      {note ? <div dir="auto" style={{ ...STEP.meta, color: INK.muted, marginBottom: 10 }}>{note}</div> : null}
      <Children list={p.props.children} env={env} k={k} />
    </div>
  );
}

/** A live block as the page draws it. Nothing when it cannot be read or holds nothing the page draws. */
export function OpenUIView({ program, env }: { program: string; env: RenderEnv }) {
  const root = readProgram(program) as Part | null;
  if (!root) return null;
  const body = <PartView p={root} env={env} k="ou" />;
  // A part alone that stands without a card in the app (a note, a thing) stands alone here too.
  if (root.part === "Note" || root.part === "Thing") return <div className="mb-3">{body}</div>;
  return (
    <div className="mb-3" style={{ ...CARD, padding: PAD }}>
      {body}
    </div>
  );
}
