/* Copied from catch8 src/lib/answer/blocks.ts (pure): the app's own readers for the native blocks, so a shared answer reads its blocks exactly as the app does. Keep in step by copying again. */
/**
 * The native blocks an answer can hold, read from plain lines.
 *
 * Five fences the worker writes: stats, steps, checklist, links and facts.
 * Each is one item per line with fields split on " | ", so an app that does
 * not know the fence still shows readable lines, and a model writes them
 * without learning a schema. Everything here is pure: it turns the fence's
 * text into data the components draw, and it reads a table's cells to say
 * which columns are numbers, which row is a total, and how wide each column
 * wants to be.
 */

import { cellNumber, type TableData } from './table';

/** The fence languages that draw as blocks. */
export const BLOCK_FENCES = ['stats', 'steps', 'checklist', 'links', 'facts', 'options', 'flow'] as const;
export type BlockFence = (typeof BLOCK_FENCES)[number];

export function isBlockFence(language: string): language is BlockFence {
  return (BLOCK_FENCES as readonly string[]).includes(language);
}

/** The lines of a fence: blank ones dropped, a leading "title:" line and a "note:" line set aside. */
function lines(content: string): { title: string | null; note: string | null; items: string[] } {
  const all = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  let title: string | null = null;
  let note: string | null = null;
  const items: string[] = [];
  for (const line of all) {
    const m = /^(?:title|caption)\s*:\s*(.+)$/i.exec(line);
    const n = /^(?:note|footnote|caveat)\s*:\s*(.+)$/i.exec(line);
    if (m && title === null && !items.length) title = m[1].trim();
    else if (n && note === null) note = n[1].trim();
    else items.push(line);
  }
  return { title, note, items };
}

/** A line's fields, split on a pipe with space around it (a bare | inside a URL survives). A leading pipe is a table habit and is dropped. */
function fields(line: string): string[] {
  return line
    .replace(/^\|\s*/, '')
    .split(/\s+\|\s+|\s*\|\s*$/)
    .map((f) => f.trim())
    .filter((f, i, arr) => f || i < arr.length - 1);
}

/** A leading list marker ("1.", "-", "•", "١.") removed. */
function unmarked(line: string): string {
  return line.replace(/^(?:[\d٠-٩]+[.)]|[-*•])\s+/, '');
}

/* ------------------------------------------------------------------ */
/* Stats                                                               */
/* ------------------------------------------------------------------ */

export interface Stat {
  label: string;
  value: string;
  note: string | null;
  /** Read from the note's first word or sign: a rise, a fall, or neither. */
  trend: 'up' | 'down' | null;
}

const UP = /^(\+|▲|↑|up\b|higher|faster|more|grew|rose|increase|ارتفع|زاد|أعلى|أسرع|أكتر)/i;
const DOWN = /^(-|−|▼|↓|down\b|lower|slower|less|fewer|fell|dropped|decrease|انخفض|قل|أقل|أبطأ)/i;

export function parseStats(content: string): { title: string | null; stats: Stat[] } {
  const { title, items } = lines(content);
  const stats: Stat[] = [];
  for (const line of items) {
    const f = fields(unmarked(line));
    if (f.length < 2) continue;
    const note = f[2] || null;
    stats.push({ label: f[0], value: f[1], note, trend: note ? (UP.test(note) ? 'up' : DOWN.test(note) ? 'down' : null) : null });
    if (stats.length >= 6) break;
  }
  return { title, stats };
}

/* ------------------------------------------------------------------ */
/* Steps                                                               */
/* ------------------------------------------------------------------ */

export interface Step {
  title: string;
  detail: string | null;
  when: string | null;
}

export function parseSteps(content: string): { title: string | null; steps: Step[]; totalMinutes: number | null } {
  const { title, items } = lines(content);
  const steps: Step[] = [];
  for (const line of items) {
    const f = fields(unmarked(line));
    if (!f[0]) continue;
    // Two fields where the second reads as a duration: it is the time, not the detail.
    const last = f.length >= 2 ? f[f.length - 1] : '';
    const when = f.length >= 3 ? f[2] || null : f.length === 2 && durationMinutes(last) !== null ? last : null;
    const detail = f.length >= 3 ? f[1] || null : f.length === 2 && when === null ? f[1] : null;
    steps.push({ title: f[0], detail, when });
    if (steps.length >= 20) break;
  }
  const minutes = steps.map((s) => (s.when ? durationMinutes(s.when) : null));
  const known = minutes.filter((m): m is number => m !== null);
  return { title, steps, totalMinutes: known.length && known.length === steps.length ? known.reduce((a, b) => a + b, 0) : known.length ? known.reduce((a, b) => a + b, 0) : null };
}

/* ------------------------------------------------------------------ */
/* Checklist                                                           */
/* ------------------------------------------------------------------ */

export interface CheckItem {
  text: string;
  done: boolean;
}

export function parseChecklist(content: string): { title: string | null; items: CheckItem[] } {
  const { title, items } = lines(content);
  const out: CheckItem[] = [];
  for (const line of items) {
    const m = /^(?:[-*•]\s+)?\[([ xX✓✔])\]\s*(.+)$/.exec(line);
    if (m) out.push({ text: m[2].trim(), done: m[1] !== ' ' });
    else out.push({ text: unmarked(line), done: false });
    if (out.length >= 30) break;
  }
  return { title, items: out };
}

/* ------------------------------------------------------------------ */
/* Links                                                               */
/* ------------------------------------------------------------------ */

export interface LinkItem {
  url: string;
  title: string;
  /** Where it is from and how long or when: "YouTube · Lenny's Podcast · 18:42". */
  meta: string | null;
  why: string | null;
  /** A YouTube video id, when the address is one: its frame needs no fetch. */
  youtube: string | null;
  /** Minutes, when the meta carries a length. */
  minutes: number | null;
  /** A document rather than a page: pdf, doc, sheet, slides. */
  doc: string | null;
}

const URL_RE = /^(https?:\/\/\S+)/i;

export function youtubeId(url: string): string | null {
  const m =
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i.exec(url) ??
    null;
  return m ? m[1] : null;
}

function docKind(url: string): string | null {
  const path = url.split(/[?#]/)[0].toLowerCase();
  const m = /\.(pdf|docx?|xlsx?|pptx?|csv|epub)$/.exec(path);
  if (m) return m[1].replace(/x$/, '').toUpperCase();
  if (/arxiv\.org\/(abs|pdf)\//.test(path)) return 'PDF';
  return null;
}

export function parseLinks(content: string): { title: string | null; links: LinkItem[]; totalMinutes: number | null; videos: number } {
  const { title, items } = lines(content);
  const links: LinkItem[] = [];
  for (const line of items) {
    const f = fields(unmarked(line));
    // The address may be in markdown link form: [title](url).
    const md = /^\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)$/.exec(f[0] ?? '');
    const url = md ? md[2] : (URL_RE.exec(f[0] ?? '')?.[1] ?? '');
    if (!url) continue;
    const titleField = md ? md[1] : f[1] ?? '';
    const rest = md ? f.slice(1) : f.slice(2);
    const meta = rest[0] || null;
    const why = rest[1] || null;
    const yt = youtubeId(url);
    links.push({ url, title: titleField, meta, why, youtube: yt, minutes: meta ? durationMinutes(lastDurationIn(meta) ?? '') : null, doc: yt ? null : docKind(url) });
    if (links.length >= 12) break;
  }
  // A length is a video's, unless the meta says it is a read ("6 min read",
  // "6 دقايق قراية"): three articles were summed up as "2 videos · 10 min".
  const watched = links.filter((l) => l.youtube || (l.minutes !== null && !READ_TIME.test(l.meta ?? '')));
  const timed = watched.filter((l) => l.minutes !== null);
  return {
    title,
    links,
    totalMinutes: timed.length ? timed.reduce((a, l) => a + (l.minutes ?? 0), 0) : null,
    videos: watched.length,
  };
}

/** A reading time, not a running time. */
const READ_TIME = /\bread\b|قراية|قراءة/i;

/** The last duration-looking token in a meta line: "18:42", "1 h 10 min", "24 min". */
function lastDurationIn(meta: string): string | null {
  const parts = meta.split(/\s*[·•,]\s*/);
  for (let i = parts.length - 1; i >= 0; i -= 1) if (durationMinutes(parts[i]) !== null) return parts[i];
  return null;
}

/* ------------------------------------------------------------------ */
/* Facts (key and value)                                               */
/* ------------------------------------------------------------------ */

export interface FactPair {
  label: string;
  value: string;
}

export function parseFacts(content: string): { title: string | null; pairs: FactPair[] } {
  const { title, items } = lines(content);
  const pairs: FactPair[] = [];
  for (const line of items) {
    const f = fields(unmarked(line));
    if (f.length >= 2 && f[0] && f[1]) pairs.push({ label: f[0], value: f.slice(1).join(' · ') });
    else {
      // "Label: value" is accepted too.
      const m = /^([^:]{1,40}):\s+(.+)$/.exec(unmarked(line));
      if (m) pairs.push({ label: m[1].trim(), value: m[2].trim() });
    }
    if (pairs.length >= 20) break;
  }
  return { title, pairs };
}

/* ------------------------------------------------------------------ */
/* Durations                                                           */
/* ------------------------------------------------------------------ */

/** "18:42" → 19, "1:02:10" → 62, "24 min" → 24, "1 h 10 min" → 70, "~1 h" → 60, "2 days" → null (not a length). */
export function durationMinutes(text: string): number | null {
  const s = text.trim().replace(/^[~≈about\s]+/i, '').replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  if (!s) return null;
  const clock = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(s);
  if (clock) {
    const a = Number(clock[1]);
    const b = Number(clock[2]);
    const c = clock[3] === undefined ? null : Number(clock[3]);
    // h:mm:ss or mm:ss; mm:ss rounds seconds up to the next minute.
    return c === null ? a + (b > 0 ? 1 : 0) : a * 60 + b + (c > 0 ? 1 : 0);
  }
  let minutes = 0;
  let found = false;
  // A unit ends where its letters end: \b only knows Latin letters, and an
  // Arabic unit ("15 دقيقة") never matched it, so Arabic steps had no time.
  const h = /(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours|ساعة|ساعات|س)(?![a-zA-Z\u0600-\u06FF])/i.exec(s);
  if (h) {
    minutes += Math.round(Number(h[1]) * 60);
    found = true;
  }
  const m = /(\d+)\s*(?:m|min|mins|minute|minutes|دقيقة|دقايق|دقائق|د)(?![a-zA-Z\u0600-\u06FF])/i.exec(s);
  if (m) {
    minutes += Number(m[1]);
    found = true;
  }
  return found ? minutes : null;
}

/** Minutes as words: 42 → "42 min", 70 → "1 h 10 min", 120 → "2 h". */
export function minutesWords(total: number, lang: 'en' | 'ar' = 'en'): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (lang === 'ar') {
    if (!h) return `${m} د`;
    return m ? `${h} س ${m} د` : `${h} س`;
  }
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/* ------------------------------------------------------------------ */
/* Tables                                                              */
/* ------------------------------------------------------------------ */

// A word ends where its letters end: \b only knows Latin letters, and an Arabic
// "الإجمالي" never matched it, so an Arabic Total row was drawn as any other row.
const TOTAL_WORDS = /^(total|totals|sum|overall|average|avg|mean|median|cheapest|best|net|grand total|الإجمالي|الاجمالي|المجموع|المتوسط|الأرخص|الأفضل)(?![a-zA-Z\u0600-\u06FF])/i;

/** Which columns are numbers: every filled cell in the column reads as one. The first column never is. */
/* ------------------------------------------------------------------ */
/* Options: two to five things with a headline each                    */
/* ------------------------------------------------------------------ */

/** The marks an option or a stage may wear, from the app's own glyph set. */
export const GLYPH_NAMES = ['doc', 'search', 'table', 'calendar', 'mail', 'phone', 'globe', 'clock', 'folder', 'film', 'picture', 'link', 'place', 'camera', 'money'] as const;
export type GlyphName = (typeof GLYPH_NAMES)[number];

const GLYPH_ALIASES: Record<string, GlyphName> = {
  document: 'doc', documents: 'doc', pdf: 'doc', report: 'doc', file: 'doc', page: 'doc',
  research: 'search', find: 'search', lookup: 'search',
  data: 'table', spreadsheet: 'table', sheet: 'table', grid: 'table', analysis: 'table',
  date: 'calendar', event: 'calendar', schedule: 'calendar',
  email: 'mail', envelope: 'mail', message: 'mail',
  call: 'phone', tel: 'phone',
  web: 'globe', site: 'globe', world: 'globe', online: 'globe',
  time: 'clock', hours: 'clock', duration: 'clock',
  project: 'folder', files: 'folder',
  video: 'film', movie: 'film', youtube: 'film',
  photo: 'picture', image: 'picture',
  url: 'link', address: 'place', map: 'place', location: 'place',
  cost: 'money', price: 'money', budget: 'money', cash: 'money',
};

/** A glyph name from the model's word, or null when it names none. */
export function glyphName(raw: string | undefined): GlyphName | null {
  const key = (raw ?? '').trim().toLowerCase();
  if (!key) return null;
  if ((GLYPH_NAMES as readonly string[]).includes(key)) return key as GlyphName;
  return GLYPH_ALIASES[key] ?? null;
}

export interface Option {
  name: string;
  /** The figure or the one thing this option is known by; '' when it has none. */
  headline: string;
  /** One line of what it is. */
  what: string;
  /** The detail, in sentences. */
  detail: string;
  glyph: GlyphName | null;
  /** Set when the answer recommends this one; the words are its reason, or '' for a bare pick. */
  pick: string | null;
  /** Attributes as label and value, for a comparison drawn as options. */
  pairs: FactPair[];
}

/**
 * `Name | headline | what | detail | glyph | pick: reason`. After the
 * headline the order is free: a field that names a glyph is the glyph, one
 * that starts with "pick" is the recommendation, and the rest are the
 * option's words in order (the first line is what it is, the others its
 * detail). A line with no name is not an option.
 */
export function parseOptions(content: string): { title: string | null; note: string | null; options: Option[] } {
  const { title, note, items } = lines(content);
  const options: Option[] = [];
  for (const line of items) {
    const f = fields(unmarked(line));
    const name = (f[0] ?? '').trim();
    if (!name) continue;
    const headline = (f[1] ?? '').trim();
    let glyph: GlyphName | null = null;
    let pick: string | null = null;
    const words: string[] = [];
    for (const raw of f.slice(2)) {
      const field = raw.trim();
      if (!field) continue;
      const p = /^pick\s*:?\s*(.*)$/i.exec(field);
      if (p) {
        pick = p[1].trim();
        continue;
      }
      const g = glyphName(field);
      if (g && field.split(/\s+/).length === 1) {
        glyph = g;
        continue;
      }
      words.push(field);
    }
    options.push({ name, headline, what: words[0] ?? '', detail: words.slice(1).join(' '), glyph, pick, pairs: [] });
  }
  return { title, note, options: options.slice(0, 6) };
}

/**
 * A comparison table (an empty first header, options as columns) as the same
 * stack of options: the first row is the headline when its cells are figures,
 * every other row a label and value pair.
 */
export function optionsFromTable(data: TableData): Option[] {
  const names = data.headers.slice(1);
  const rows = data.rows;
  const firstIsFigure = rows.length > 0 && names.every((_, i) => cellNumber(rows[0][i + 1] ?? '') !== null);
  return names.map((name, i) => {
    const column = i + 1;
    const cells = rows.map((row) => ({ label: row[0] ?? '', value: row[column] ?? '' }));
    const headline = firstIsFigure ? (cells[0]?.value ?? '') : '';
    const pairs = (firstIsFigure ? cells.slice(1) : cells).filter((c) => c.label || c.value);
    return { name: name.trim(), headline, what: firstIsFigure ? (cells[0]?.label ?? '') : '', detail: '', glyph: null, pick: null, pairs };
  });
}

/* ------------------------------------------------------------------ */
/* Flow: a straight line of stages                                     */
/* ------------------------------------------------------------------ */

export interface Stage {
  title: string;
  detail: string;
  /** "new" for the stage the answer adds, "key" for the one that matters most. */
  mark: 'new' | 'key' | null;
}

const STAGE_MARK: Record<string, 'new' | 'key'> = { new: 'new', added: 'new', 'جديد': 'new', key: 'key', main: 'key', focus: 'key', important: 'key', 'المهم': 'key', 'الأهم': 'key' };

/** `Title | detail | new` per stage. A stage with no title is skipped. */
export function parseFlow(content: string): { title: string | null; note: string | null; stages: Stage[] } {
  const { title, note, items } = lines(content);
  const stages: Stage[] = [];
  for (const line of items) {
    const f = fields(unmarked(line));
    const head = (f[0] ?? '').trim();
    if (!head) continue;
    const rest = f.slice(1).map((x) => x.trim()).filter(Boolean);
    let mark: 'new' | 'key' | null = null;
    const last = rest[rest.length - 1]?.toLowerCase();
    if (last && STAGE_MARK[last]) {
      mark = STAGE_MARK[last];
      rest.pop();
    }
    stages.push({ title: head, detail: rest.join(' '), mark });
  }
  return { title, note, stages: stages.slice(0, 9) };
}

export function numericColumns(data: TableData): boolean[] {
  return data.headers.map((_, i) => {
    if (i === 0) return false;
    const filled = data.rows.map((r) => r[i] ?? '').filter((c) => c.trim());
    return filled.length > 0 && filled.every((c) => cellNumber(c) !== null);
  });
}

/** The last row is a total when its first cell says so. */
export function totalRowIndex(data: TableData): number | null {
  const last = data.rows.length - 1;
  if (last < 1) return null;
  return TOTAL_WORDS.test((data.rows[last][0] ?? '').trim()) ? last : null;
}

/**
 * About how wide a run of text sets at 14pt: digits and capitals are wider
 * than the average letter, separators far narrower. A column sized by
 * character count alone broke "266,400.00" over two lines.
 */
export function textWidth(text: string): number {
  let width = 0;
  for (const ch of text) {
    if (/[0-9٠-٩]/.test(ch)) width += 8.4;
    else if (/[.,:;'· ]/.test(ch)) width += 4.2;
    else if (/[A-Z]/.test(ch)) width += 9.4;
    else if (/[؀-ۿ]/.test(ch)) width += 7.2;
    else width += 7.6;
  }
  return width;
}

/** Each column's natural width in points, between a readable minimum and a cap that keeps long text wrapping. */
export function columnWidths(data: TableData, opts: { min?: number; max?: number; padding?: number } = {}): number[] {
  const min = opts.min ?? 64;
  const max = opts.max ?? 220;
  const pad = opts.padding ?? 28;
  return data.headers.map((h, i) => {
    const widest = Math.max(textWidth(h), ...data.rows.map((r) => textWidth(r[i] ?? '')));
    return Math.round(Math.max(min, Math.min(max, widest + pad)));
  });
}
