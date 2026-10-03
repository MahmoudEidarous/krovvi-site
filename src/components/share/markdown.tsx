"use client";

/**
 * A Krovvi answer drawn on the page the way the app draws it (catch8
 * theme/markdown.ts and components/answer): paragraphs, headings, lists,
 * quotes, tables with a steady first column, code, links, the native blocks
 * (stats, steps, checklist, links, facts, options, flow), the cards and the
 * receipts. The app reads answers with markdown-it; this reader covers the
 * same CommonMark subset Krovvi writes, so the page needs no parser library.
 * Anything it does not know is drawn as plain words, never as raw markup.
 */

import { createContext, Fragment, useContext, type ReactNode } from "react";

import { INK, STEP } from "@/components/objects/kit";
import { BlockView } from "./blocks";
import { CardView, type ShareCard } from "./cards";

const BODY = { fontSize: 16, lineHeight: "26px", letterSpacing: "-0.15px", color: INK.fg } as const;

export interface RenderEnv {
  cards: Record<string, ShareCard>;
  lang: "en" | "ar";
}

/* ------------------------------------------------------------------ */
/* Inline.                                                              */
/* ------------------------------------------------------------------ */

const INLINE = /(`[^`\n]+`)|(\*\*[^*\n]+\*\*|__[^_\n]+__)|(\*[^*\n]+\*|(?<![\w])_[^_\n]+_(?![\w]))|(\[[^\]\n]+\]\([^)\s]+\))|(https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"])/g;

/** The copy's photos and files, by the index its words name them by (share:file?m=). */
export const ShareMedia = createContext<Record<number, { url: string; mime: string }>>({});

const FORMAT_OF: Array<[RegExp, string, string]> = [
  [/pdf/, "PDF", "#E5484D"],
  [/wordprocessing|msword/, "DOC", "#3E7BFA"],
  [/spreadsheet|excel|csv/, "XLS", "#30A46C"],
  [/presentation|powerpoint/, "PPT", "#F76B15"],
];

/** A file Krovvi made in the chat: its name in the words, opening the file itself. */
function FileLink({ index, words }: { index: number; words: string }) {
  const file = useContext(ShareMedia)[index];
  if (!file) return <bdi>{words}</bdi>;
  const [, badge, tint] = FORMAT_OF.find(([rx]) => rx.test(file.mime)) ?? [null, "FILE", INK.surfaceHi];
  return (
    <a
      href={file.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center rounded-full align-baseline active:opacity-70"
      style={{ ...STEP.meta, fontWeight: 500, color: INK.fg, background: INK.surfaceHi, padding: "1px 8px 1px 3px", margin: "0 2px" }}
    >
      <span className="rounded-full" style={{ fontSize: 9, lineHeight: "16px", fontWeight: 700, color: "#fff", background: tint, padding: "0 5px", marginInlineEnd: 5 }}>
        {badge}
      </span>
      <bdi>{words}</bdi>
    </a>
  );
}

function Receipt({ href, words }: { href: string; words: string }) {
  const q = new URLSearchParams(href.slice(href.indexOf("?") + 1));
  const t = Number(q.get("t"));
  const at = Number.isFinite(t) && t > 0 ? `${Math.floor(t / 60000)}:${String(Math.floor((t % 60000) / 1000)).padStart(2, "0")}` : null;
  return (
    <span className="inline-flex items-center rounded-full align-baseline" style={{ ...STEP.meta, fontWeight: 500, color: INK.soft, background: INK.surfaceHi, padding: "1px 8px", margin: "0 2px" }} title={q.get("title") ?? words}>
      <span aria-hidden style={{ marginInlineEnd: 4 }}>
        ●
      </span>
      <bdi>{q.get("title") || words}</bdi>
      {at ? <span style={{ marginInlineStart: 4, color: INK.muted }}>{at}</span> : null}
    </span>
  );
}

export function inline(text: string, key = "i"): ReactNode[] {
  const out: ReactNode[] = [];
  let at = 0;
  let n = 0;
  for (const m of text.matchAll(INLINE)) {
    if ((m.index ?? 0) > at) out.push(text.slice(at, m.index));
    const [all, code, bold, italic, link, url] = m;
    const k = `${key}-${n++}`;
    if (code) out.push(<code key={k} style={{ fontFamily: "Menlo, monospace", fontSize: 14, background: INK.surfaceHi, borderRadius: 6, padding: "1px 5px" }}>{code.slice(1, -1)}</code>);
    else if (bold) out.push(<strong key={k} style={{ fontWeight: 600 }}>{inline(bold.slice(2, -2), k)}</strong>);
    else if (italic) out.push(<em key={k}>{inline(italic.slice(1, -1), k)}</em>);
    else if (link) {
      const lm = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(link)!;
      const [, words, href] = lm;
      const file = /^share:file\?m=(\d{1,4})$/.exec(href);
      if (href.startsWith("share:receipt")) out.push(<Receipt key={k} href={href} words={words} />);
      else if (file) out.push(<FileLink key={k} index={Number(file[1])} words={words} />);
      else if (/^(https?:|mailto:|tel:)/i.test(href))
        out.push(
          <a key={k} href={href} target="_blank" rel="noopener noreferrer nofollow" style={{ color: INK.soft, textDecoration: "underline", textDecorationColor: "rgba(169,168,162,0.4)", textUnderlineOffset: 3 }}>
            {inline(words, k)}
          </a>
        );
      else out.push(<Fragment key={k}>{inline(words, k)}</Fragment>);
    } else if (url)
      out.push(
        <a key={k} href={url} target="_blank" rel="noopener noreferrer nofollow" style={{ color: INK.soft, textDecoration: "underline", textUnderlineOffset: 3, wordBreak: "break-word" }}>
          {url.replace(/^https?:\/\/(www\.)?/, "")}
        </a>
      );
    else out.push(all);
    at = (m.index ?? 0) + all.length;
  }
  if (at < text.length) out.push(text.slice(at));
  return out;
}

/* ------------------------------------------------------------------ */
/* Blocks.                                                              */
/* ------------------------------------------------------------------ */

type Block =
  | { t: "p"; text: string }
  | { t: "h"; level: number; text: string }
  | { t: "hr" }
  | { t: "quote"; text: string }
  | { t: "list"; ordered: boolean; start: number; items: Array<{ text: string; children: Block[] }> }
  | { t: "table"; headers: string[]; rows: string[][]; align: Array<"left" | "right" | "center" | null> }
  | { t: "fence"; lang: string; content: string };

const LIST_ITEM = /^(\s*)([-*+]|\d{1,3}[.)])\s+(.*)$/;
const TABLE_SEP = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

function cellsOf(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, "|"));
}

export function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const out: Block[] = [];
  let i = 0;
  const para: string[] = [];
  const flush = () => {
    if (para.length) out.push({ t: "p", text: para.join(" ").trim() });
    para.length = 0;
  };
  while (i < lines.length) {
    const line = lines[i];
    const fence = /^\s*(```|~~~)\s*([\w-]*)\s*$/.exec(line);
    if (fence) {
      flush();
      const close = fence[1];
      const body: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith(close)) body.push(lines[i++]);
      i += 1;
      out.push({ t: "fence", lang: fence[2].toLowerCase(), content: body.join("\n") });
      continue;
    }
    if (!line.trim()) {
      flush();
      i += 1;
      continue;
    }
    const h = /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
    if (h) {
      flush();
      out.push({ t: "h", level: h[1].length, text: h[2] });
      i += 1;
      continue;
    }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      flush();
      out.push({ t: "hr" });
      i += 1;
      continue;
    }
    if (/^\s*>/.test(line)) {
      flush();
      const body: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) body.push(lines[i++].replace(/^\s*>\s?/, ""));
      out.push({ t: "quote", text: body.join("\n") });
      continue;
    }
    if (line.includes("|") && i + 1 < lines.length && TABLE_SEP.test(lines[i + 1])) {
      flush();
      const headers = cellsOf(line);
      const align = cellsOf(lines[i + 1]).map((c) => (c.startsWith(":") && c.endsWith(":") ? "center" : c.endsWith(":") ? "right" : c.startsWith(":") ? "left" : null));
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) rows.push(cellsOf(lines[i++]));
      out.push({ t: "table", headers, rows, align });
      continue;
    }
    const li = LIST_ITEM.exec(line);
    if (li && !para.length) {
      const base = li[1].length;
      const ordered = /\d/.test(li[2]);
      const items: Array<{ text: string; children: Block[] }> = [];
      while (i < lines.length) {
        const m = LIST_ITEM.exec(lines[i]);
        if (m && m[1].length === base && /\d/.test(m[2]) === ordered) {
          const body = [m[3]];
          i += 1;
          // The item's own wrapped lines and anything nested under it.
          while (i < lines.length && lines[i].trim() && (lines[i].length - lines[i].trimStart().length > base || (!LIST_ITEM.test(lines[i]) && !/^\s*(```|#|>)/.test(lines[i])))) {
            const sub = LIST_ITEM.exec(lines[i]);
            if (sub && sub[1].length <= base) break;
            body.push(lines[i].slice(Math.min(base + 2, lines[i].length - lines[i].trimStart().length)));
            i += 1;
          }
          const [first, ...rest] = body;
          items.push({ text: first, children: rest.length ? parseBlocks(rest.join("\n")) : [] });
          while (i < lines.length && !lines[i].trim() && i + 1 < lines.length && LIST_ITEM.exec(lines[i + 1])?.[1].length === base) i += 1;
          continue;
        }
        break;
      }
      out.push({ t: "list", ordered, start: ordered ? Number(/\d+/.exec(li[2])?.[0] ?? 1) : 1, items });
      continue;
    }
    para.push(line.trim());
    i += 1;
  }
  flush();
  return out;
}

const HEADING = {
  1: { fontSize: 22, lineHeight: "28px", fontWeight: 600, margin: "24px 0 6px" },
  2: { fontSize: 19, lineHeight: "25px", fontWeight: 600, margin: "24px 0 6px" },
  3: { fontSize: 17, lineHeight: "23px", fontWeight: 600, margin: "16px 0 6px" },
  4: { fontSize: 15, lineHeight: "21px", fontWeight: 600, margin: "16px 0 6px", color: INK.soft },
} as const;

function BlockNode({ block, env, k }: { block: Block; env: RenderEnv; k: string }) {
  switch (block.t) {
    case "p":
      return <p dir="auto" style={{ ...BODY, margin: "0 0 12px" }}>{inline(block.text, k)}</p>;
    case "h": {
      const style = HEADING[Math.min(4, block.level) as 1 | 2 | 3 | 4];
      return (
        <div dir="auto" role="heading" aria-level={block.level} style={{ color: INK.fg, letterSpacing: "-0.3px", ...style }}>
          {inline(block.text, k)}
        </div>
      );
    }
    case "hr":
      return <div style={{ height: 0.5, background: INK.line, margin: "16px 0" }} />;
    case "quote":
      return (
        <blockquote dir="auto" style={{ ...BODY, color: INK.soft, borderInlineStart: `2px solid ${INK.line}`, paddingInlineStart: 12, margin: "0 0 12px" }}>
          {parseBlocks(block.text).map((b, n) => (
            <BlockNode key={n} block={b} env={env} k={`${k}-${n}`} />
          ))}
        </blockquote>
      );
    case "list": {
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag dir="auto" start={block.start} style={{ ...BODY, margin: "0 0 12px", paddingInlineStart: 22, listStyleType: block.ordered ? "decimal" : "disc" }}>
          {block.items.map((item, n) => (
            <li key={n} style={{ margin: "2px 0" }}>
              {inline(item.text, `${k}-${n}`)}
              {item.children.map((c, m) => (
                <BlockNode key={m} block={c} env={env} k={`${k}-${n}-${m}`} />
              ))}
            </li>
          ))}
        </Tag>
      );
    }
    case "table":
      return (
        <div className="mb-3 overflow-x-auto" style={{ background: INK.surface, borderRadius: 17 }}>
          <table className="w-full" style={{ borderCollapse: "collapse", minWidth: "100%" }}>
            <thead>
              <tr>
                {block.headers.map((h, n) => (
                  <th key={n} dir="auto" style={{ ...STEP.meta, color: INK.muted, textAlign: block.align[n] ?? "start", padding: "10px 12px", whiteSpace: "nowrap", position: n === 0 ? "sticky" : undefined, insetInlineStart: 0, background: INK.surface }}>
                    {inline(h, `${k}-h${n}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r} style={{ borderTop: `0.5px solid ${INK.line}` }}>
                  {row.map((cell, n) => (
                    <td key={n} dir="auto" style={{ ...STEP.body, fontWeight: n === 0 ? 500 : 400, textAlign: block.align[n] ?? (n > 0 && /^[\s$€£\d.,%+-]+\w{0,4}$/.test(cell) ? "right" : "start"), fontVariantNumeric: "tabular-nums", padding: "10px 12px", whiteSpace: n === 0 ? "nowrap" : undefined, position: n === 0 ? "sticky" : undefined, insetInlineStart: 0, background: INK.surface }}>
                      {inline(cell, `${k}-${r}-${n}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "fence": {
      if (block.lang === "card") {
        const id = block.content.trim();
        const card = env.cards[id];
        return card ? <CardView card={card} lang={env.lang} /> : null;
      }
      const drawn = <BlockView lang={block.lang} content={block.content} env={env} />;
      if (drawn) return drawn;
      if (["mermaid", "diagram", "flowchart", "sequence", "graph"].includes(block.lang)) return null;
      return (
        <pre dir="ltr" className="mb-3 overflow-x-auto" style={{ fontFamily: "Menlo, monospace", fontSize: 13, lineHeight: "20px", background: INK.surface, borderRadius: 17, padding: "12px 16px", color: INK.fg }}>
          {block.content}
        </pre>
      );
    }
  }
}

/** One answer part's words, drawn. */
export function Markdown({ text, env }: { text: string; env: RenderEnv }) {
  const blocks = parseBlocks(text);
  return (
    <div>
      {blocks.map((b, n) => (
        <BlockNode key={n} block={b} env={env} k={`b${n}`} />
      ))}
    </div>
  );
}
