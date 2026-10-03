"use client";

/**
 * The answer's native blocks on the page (catch8 components/answer/
 * native-blocks.tsx, read by the same parsers: lib/answer/blocks.ts, copied
 * from the app): stats with the one number that answers, steps on a rail, a
 * checklist (read only: it is someone else's), links, facts as aligned
 * pairs, options with Krovvi's pick raised, and a flow of stages.
 */

import { parseChecklist, parseFacts, parseFlow, parseLinks, parseOptions, parseStats, parseSteps } from "@/lib/answer/blocks";
import { INK, STEP } from "@/components/objects/kit";
import { inline, type RenderEnv } from "./markdown";

const CARD = { background: INK.surface, borderRadius: 17, overflow: "hidden" } as const;

function Head({ title }: { title: string | null }) {
  if (!title) return null;
  return (
    <div dir="auto" style={{ ...STEP.label, color: INK.muted, padding: "12px 16px 4px" }}>
      {title}
    </div>
  );
}

function Rule() {
  return <div style={{ height: 0.5, background: INK.line, marginInlineStart: 16 }} />;
}

/** The fences BlockView draws as Krovvi's own blocks; any other fence is code. */
export const BLOCK_LANGS: ReadonlySet<string> = new Set(["stats", "steps", "checklist", "links", "facts", "options", "flow", "math", "latex", "tex"]);

export function BlockView({ lang, content, env }: { lang: string; content: string; env: RenderEnv }) {
  const k = lang;
  if (lang === "stats") {
    const { title, stats } = parseStats(content);
    if (!stats.length) return null;
    if (stats.length === 1) {
      const s = stats[0];
      return (
        <div className="mb-3" style={{ ...CARD, padding: "14px 16px" }}>
          <div dir="auto" style={{ ...STEP.label, color: INK.muted }}>{title ?? s.label}</div>
          <div style={{ ...STEP.display, margin: "2px 0" }}>{s.value}</div>
          {s.note ? (
            <div dir="auto" style={{ ...STEP.meta, color: s.trend === "up" ? INK.up : s.trend === "down" ? INK.down : INK.muted }}>
              {s.trend === "up" ? "▲ " : s.trend === "down" ? "▼ " : ""}
              {s.note}
            </div>
          ) : null}
        </div>
      );
    }
    return (
      <div className="mb-3" style={CARD}>
        <Head title={title} />
        <div className="grid" style={{ gridTemplateColumns: `repeat(${Math.min(3, stats.length)}, minmax(0, 1fr))` }}>
          {stats.map((s, n) => (
            <div key={n} style={{ padding: "12px 16px", borderTop: n >= 3 ? `0.5px solid ${INK.line}` : undefined }}>
              <div style={{ ...STEP.figure }}>{s.value}</div>
              <div dir="auto" style={{ ...STEP.meta, color: INK.muted }}>{s.label}</div>
              {s.note ? (
                <div dir="auto" style={{ ...STEP.meta, color: s.trend === "up" ? INK.up : s.trend === "down" ? INK.down : INK.muted }}>
                  {s.note}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (lang === "steps") {
    const { title, steps } = parseSteps(content);
    if (!steps.length) return null;
    return (
      <div className="mb-3">
        {title ? <div dir="auto" style={{ ...STEP.title, marginBottom: 8 }}>{title}</div> : null}
        <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {steps.map((s, n) => (
            <li key={n} className="flex" style={{ gap: 12, marginBottom: 12 }}>
              <span className="flex shrink-0 items-center justify-center rounded-full" style={{ width: 24, height: 24, background: INK.surfaceHi, ...STEP.meta, fontWeight: 600 }}>
                {n + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span dir="auto" className="block" style={{ ...STEP.body, fontWeight: 600 }}>{inline(s.title, `${k}${n}`)}</span>
                {s.detail ? <span dir="auto" className="block" style={{ ...STEP.body, color: INK.soft }}>{inline(s.detail, `${k}${n}d`)}</span> : null}
                {s.when ? <span dir="auto" className="block" style={{ ...STEP.meta, color: INK.muted }}>{s.when}</span> : null}
              </span>
            </li>
          ))}
        </ol>
      </div>
    );
  }
  if (lang === "checklist") {
    const { title, items } = parseChecklist(content);
    if (!items.length) return null;
    return (
      <div className="mb-3" style={CARD}>
        <Head title={title} />
        {items.map((it, n) => (
          <div key={n}>
            {n ? <Rule /> : null}
            <div className="flex items-center" style={{ gap: 12, padding: "11px 16px" }}>
              <span className="flex shrink-0 items-center justify-center rounded-full" style={{ width: 20, height: 20, ...(it.done ? { background: INK.fg } : { border: `1.5px solid ${INK.faint}` }) }}>
                {it.done ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" aria-hidden>
                    <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={INK.bg} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : null}
              </span>
              <span dir="auto" style={{ ...STEP.body, color: it.done ? INK.muted : INK.fg }}>{inline(it.text, `${k}${n}`)}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (lang === "links") {
    const { title, links } = parseLinks(content);
    if (!links.length) return null;
    return (
      <div className="mb-3" style={CARD}>
        <Head title={title} />
        {links.map((l, n) => (
          <div key={n}>
            {n ? <Rule /> : null}
            <a href={l.url} target="_blank" rel="noopener noreferrer nofollow" className="block active:opacity-70" style={{ padding: "11px 16px" }}>
              <span dir="auto" className="block" style={{ ...STEP.body, fontWeight: 500 }}>{l.title}</span>
              {l.meta ? <span dir="auto" className="block" style={{ ...STEP.meta, color: INK.muted }}>{l.meta}</span> : null}
              {l.why ? <span dir="auto" className="block" style={{ ...STEP.meta, color: INK.soft }}>{l.why}</span> : null}
            </a>
          </div>
        ))}
      </div>
    );
  }
  if (lang === "facts") {
    const { title, pairs } = parseFacts(content);
    if (!pairs.length) return null;
    return (
      <div className="mb-3" style={CARD}>
        <Head title={title} />
        {pairs.map((p, n) => (
          <div key={n}>
            {n ? <Rule /> : null}
            <div className="flex items-baseline justify-between" style={{ gap: 12, padding: "11px 16px" }}>
              <span dir="auto" style={{ ...STEP.body, color: INK.muted }}>{p.label}</span>
              <span dir="auto" style={{ ...STEP.body, fontWeight: 500, textAlign: "end" }}>{inline(p.value, `${k}${n}`)}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (lang === "options") {
    const { title, note, options } = parseOptions(content);
    if (!options.length) return null;
    return (
      <div className="mb-3" style={CARD}>
        <Head title={title} />
        {options.map((o, n) => (
          <div key={n} style={{ background: o.pick !== null ? INK.surfaceHi : undefined, borderTop: n ? `0.5px solid ${INK.line}` : undefined, padding: "12px 16px" }}>
            <div className="flex items-baseline justify-between" style={{ gap: 12 }}>
              <span dir="auto" style={{ ...STEP.title }}>{o.name}</span>
              {o.headline ? <span style={{ ...STEP.figure, fontSize: 18 }}>{o.headline}</span> : null}
            </div>
            {o.what ? <div dir="auto" style={{ ...STEP.body, color: INK.soft }}>{inline(o.what, `${k}${n}w`)}</div> : null}
            {o.detail ? <div dir="auto" style={{ ...STEP.body, color: INK.muted, marginTop: 2 }}>{inline(o.detail, `${k}${n}d`)}</div> : null}
            {o.pick !== null ? (
              <div dir="auto" style={{ ...STEP.meta, color: INK.pick, marginTop: 6 }}>
                ● {env.lang === "ar" ? "اختيار كروفي" : "Krovvi’s pick"}
                {o.pick ? `: ${o.pick}` : ""}
              </div>
            ) : null}
          </div>
        ))}
        {note ? <div dir="auto" style={{ ...STEP.meta, color: INK.muted, padding: "10px 16px", borderTop: `0.5px solid ${INK.line}` }}>{note}</div> : null}
      </div>
    );
  }
  if (lang === "flow") {
    const { title, note, stages } = parseFlow(content);
    if (!stages.length) return null;
    return (
      <div className="mb-3" style={{ ...CARD, padding: "12px 16px" }}>
        {title ? <div dir="auto" style={{ ...STEP.label, color: INK.muted, marginBottom: 8 }}>{title}</div> : null}
        {stages.map((s, n) => (
          <div key={n} className="flex" style={{ gap: 12 }}>
            <span className="flex flex-col items-center">
              <span className="rounded-full" style={{ width: 10, height: 10, marginTop: 6, background: s.mark ? INK.pick : INK.fg }} />
              {n < stages.length - 1 ? <span style={{ width: 1.5, flex: 1, background: INK.line, minHeight: 18 }} /> : null}
            </span>
            <span className="min-w-0 flex-1" style={{ paddingBottom: 10 }}>
              <span dir="auto" className="block" style={{ ...STEP.body, fontWeight: 600 }}>{s.title}</span>
              {s.detail ? <span dir="auto" className="block" style={{ ...STEP.meta, color: INK.muted }}>{s.detail}</span> : null}
            </span>
          </div>
        ))}
        {note ? <div dir="auto" style={{ ...STEP.meta, color: INK.muted }}>{note}</div> : null}
      </div>
    );
  }
  if (lang === "math" || lang === "latex" || lang === "tex") {
    return (
      <div dir="ltr" className="mb-3" style={{ ...STEP.body, fontFamily: "Menlo, monospace", background: INK.surface, borderRadius: 17, padding: "12px 16px" }}>
        {content}
      </div>
    );
  }
  return null;
}
