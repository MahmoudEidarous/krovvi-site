/**
 * One of Krovvi's live blocks, read for the shared page.
 *
 * In the app an answer can hold small programs between ```openui fences, which the app draws natively: a card of rows
 * with pictures, pictures side by side, a table, figures, steps. The shared page had no reader for them, so a shared
 * answer showed its program as code (16 November 2026). This reads a program into a plain tree the page can draw:
 * each part with its props by name, its children in place.
 *
 * The language, as Krovvi writes it: one statement a line, `name = Expression`; a part is `Name(arg, arg)` with its
 * props in a fixed order; a list is `[a, b]`; words are in double or single quotes; a name alone is another
 * statement; `$name` is a value a person can change in the app, read here as it was first set; `@Name(...)` is a
 * step or a sum the app works out, read here as nothing. What is not understood is nothing: a block never breaks the
 * page, it only shows less.
 *
 * The props' order is the app's own (src/lib/openui/schema.ts in the app's code), where a prop is only ever added at
 * the end: a prop added there and not yet here is simply not shown.
 */

/** Every part's props, in the order a program writes them. */
export const PROPS = {
  Card: ['children', 'title', 'note', 'badge'],
  Tabs: ['items'],
  Tab: ['label', 'content', 'icon'],
  Text: ['text', 'style'],
  Note: ['text', 'tone'],
  Stats: ['items'],
  Stat: ['label', 'value', 'unit', 'note', 'trend', 'better'],
  Progress: ['label', 'value', 'of', 'unit', 'better', 'pace', 'paceLabel', 'note'],
  Chart: ['kind', 'labels', 'series', 'unit', 'goal', 'goalLabel', 'title'],
  Series: ['name', 'values'],
  Table: ['columns', 'rows', 'caption'],
  Slider: ['name', 'label', 'min', 'max', 'step', 'value', 'unit'],
  Choice: ['name', 'label', 'options', 'value', 'style'],
  Opt: ['label', 'value'],
  Toggle: ['name', 'label', 'value'],
  Field: ['name', 'label', 'kind', 'value', 'placeholder'],
  Form: ['name', 'questions', 'submit'],
  Question: ['name', 'prompt', 'options', 'value'],
  Checklist: ['title', 'items', 'todo'],
  Check: ['text', 'hint', 'group', 'done'],
  Steps: ['items', 'walk'],
  Step: ['title', 'detail', 'minutes'],
  Timeline: ['items', 'todo'],
  Moment: ['when', 'title', 'detail'],
  Flow: ['boxes', 'direction', 'title'],
  Box: ['title', 'detail', 'icon', 'tone'],
  Diagram: ['source'],
  List: ['items', 'numbered'],
  Item: ['title', 'detail', 'icon', 'picture', 'badge'],
  Compare: ['items', 'focus', 'title'],
  Pick: ['name', 'points', 'picture', 'value', 'tag', 'link', 'scores'],
  Gallery: ['pictures', 'title'],
  Picture: ['src', 'caption', 'source', 'text'],
  Thing: ['id'],
  Buttons: ['items'],
  Button: ['label', 'action', 'style'],
  FollowUps: ['items'],
};

/** How deep a program's parts may nest before the rest is not read. */
const DEPTH = 40;
/** The longest program read: a block is a screen or two. */
const LONGEST = 60_000;

const isLetter = (c) => /[A-Za-z_]/.test(c);
const isWord = (c) => /[A-Za-z0-9_]/.test(c);

/** The program as tokens. A string keeps its words with its escapes read; anything unknown is one token of its own. */
function tokens(source) {
  const out = [];
  let i = 0;
  const n = source.length;
  while (i < n) {
    const c = source[i];
    if (c === '\n') {
      out.push({ t: 'nl' });
      i += 1;
    } else if (c === ' ' || c === '\t' || c === '\r') {
      i += 1;
    } else if (c === '/' && source[i + 1] === '/') {
      while (i < n && source[i] !== '\n') i += 1;
    } else if (c === '"' || c === "'") {
      let j = i + 1;
      let v = '';
      let closed = false;
      while (j < n) {
        const d = source[j];
        if (d === '\\' && j + 1 < n) {
          const e = source[j + 1];
          if (e === 'n') v += '\n';
          else if (e === 't') v += '\t';
          else if (e === 'u' && /^[0-9a-fA-F]{4}$/.test(source.slice(j + 2, j + 6))) {
            v += String.fromCharCode(parseInt(source.slice(j + 2, j + 6), 16));
            j += 4;
          } else v += e;
          j += 2;
        } else if (d === c) {
          closed = true;
          j += 1;
          break;
        } else {
          v += d;
          j += 1;
        }
      }
      // Words never closed (a block still being written when it was kept): the rest is not read.
      if (!closed) {
        out.push({ t: 'end' });
        return out;
      }
      out.push({ t: 'str', v });
      i = j;
    } else if (/[0-9]/.test(c) || (c === '-' && /[0-9]/.test(source[i + 1] ?? ''))) {
      let j = i + 1;
      while (j < n && /[0-9.]/.test(source[j])) j += 1;
      out.push({ t: 'num', v: Number(source.slice(i, j)) });
      i = j;
    } else if (c === '$' || c === '@' || isLetter(c)) {
      let j = i + 1;
      while (j < n && isWord(source[j])) j += 1;
      const word = source.slice(i, j);
      out.push(c === '$' ? { t: 'state', v: word.slice(1) } : c === '@' ? { t: 'fn', v: word.slice(1) } : { t: 'name', v: word });
      i = j;
    } else {
      out.push({ t: c });
      i += 1;
    }
  }
  out.push({ t: 'end' });
  return out;
}

/** A reader over the tokens: one expression at a time. New lines inside brackets are not ends of statements. */
function reader(toks) {
  let at = 0;
  const peek = () => toks[at];
  const next = () => toks[at++];
  const skipLines = () => {
    while (peek().t === 'nl') at += 1;
  };

  function list(close, depth) {
    const items = [];
    skipLines();
    while (peek().t !== close && peek().t !== 'end') {
      items.push(expression(depth + 1));
      skipLines();
      if (peek().t === ',') {
        next();
        skipLines();
      } else if (peek().t !== close) {
        // Something this reader does not know between two items (a sum, a choice): the item is not understood.
        items[items.length - 1] = { k: 'other' };
        while (![',', close, 'end'].includes(peek().t)) {
          if (peek().t === '(' || peek().t === '[' || peek().t === '{') skip();
          else next();
        }
        if (peek().t === ',') {
          next();
          skipLines();
        }
      }
    }
    if (peek().t === close) next();
    return items;
  }

  /** Past one bracketed stretch, whatever is in it. */
  function skip() {
    const open = next().t;
    const close = open === '(' ? ')' : open === '[' ? ']' : '}';
    let deep = 1;
    while (deep > 0 && peek().t !== 'end') {
      const t = next().t;
      if (t === open) deep += 1;
      else if (t === close) deep -= 1;
    }
  }

  function expression(depth) {
    if (depth > DEPTH) return { k: 'other' };
    const tok = next();
    if (tok.t === 'str') return { k: 'str', v: tok.v };
    if (tok.t === 'num') return { k: 'num', v: tok.v };
    if (tok.t === 'state') return { k: 'state', name: tok.v };
    if (tok.t === '[') return { k: 'list', items: list(']', depth) };
    if (tok.t === '{') {
      // An object written in place (a Pick's scores): not drawn on the page.
      at -= 1;
      skip();
      return { k: 'other' };
    }
    if (tok.t === 'fn') {
      if (peek().t === '(') skip();
      return { k: 'other' };
    }
    if (tok.t === 'name') {
      if (tok.v === 'true') return { k: 'bool', v: true };
      if (tok.v === 'false') return { k: 'bool', v: false };
      if (tok.v === 'null') return { k: 'null' };
      if (peek().t === '(') {
        next();
        return { k: 'call', name: tok.v, args: list(')', depth) };
      }
      return { k: 'ref', name: tok.v };
    }
    return { k: 'other' };
  }

  return { peek, next, skipLines, expression, skip };
}

/** The program's statements by name, each as it was written: `name = Expression`, and `$name = value`. */
function statements(source) {
  const toks = tokens(source.slice(0, LONGEST));
  const r = reader(toks);
  const named = new Map();
  const states = new Map();
  let order = [];
  for (;;) {
    r.skipLines();
    const head = r.peek();
    if (head.t === 'end') break;
    if ((head.t === 'name' || head.t === 'state') && toks[toks.indexOf(head) + 1]?.t === '=') {
      r.next();
      r.next();
      const value = r.expression(0);
      if (head.t === 'state') states.set(head.v, value);
      else {
        named.set(head.v, value);
        order.push(head.v);
      }
    } else {
      r.next();
    }
    // Whatever is left on the line was not understood: the statement keeps what was read.
    while (r.peek().t !== 'nl' && r.peek().t !== 'end') {
      const t = r.peek().t;
      if (t === '(' || t === '[' || t === '{') r.skip();
      else r.next();
    }
  }
  return { named, states, order };
}

/**
 * A program as a tree: `{ part, props }` for a part, with its props by name; words, numbers and yes or no as
 * themselves; a list as an array; what is not understood as null. Null when the program has no root.
 */
export function readProgram(source) {
  if (typeof source !== 'string' || !source.trim()) return null;
  let parsed;
  try {
    parsed = statements(source);
  } catch {
    return null;
  }
  const { named, states } = parsed;
  if (!named.has('root')) return null;
  const busy = new Set();
  const value = (node, depth) => {
    if (!node || depth > DEPTH) return null;
    if (node.k === 'str' || node.k === 'num' || node.k === 'bool') return node.v;
    if (node.k === 'list') return node.items.map((item) => value(item, depth + 1));
    if (node.k === 'state') return states.has(node.name) ? value(states.get(node.name), depth + 1) : null;
    if (node.k === 'ref') {
      // A name that points back at itself is read once and no further.
      if (!named.has(node.name) || busy.has(node.name)) return null;
      busy.add(node.name);
      const out = value(named.get(node.name), depth + 1);
      busy.delete(node.name);
      return out;
    }
    if (node.k === 'call') {
      const names = PROPS[node.name];
      if (!names) return null;
      const props = {};
      node.args.forEach((arg, i) => {
        if (i < names.length) props[names[i]] = value(arg, depth + 1);
      });
      return { part: node.name, props };
    }
    return null;
  };
  const root = value(named.get('root'), 0);
  return root && typeof root === 'object' && !Array.isArray(root) && root.part ? root : null;
}

/** Words as a part shows them: trimmed, or nothing; a number as its figure. */
export function wordsOf(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  return typeof value === 'string' ? value.trim() : '';
}

/** An address the page may load as a picture or open as a link: https only, of a sane length. */
export function addressOf(value) {
  if (typeof value !== 'string') return null;
  const url = value.trim();
  return /^https:\/\/[^\s"'<>]+$/i.test(url) && url.length <= 2048 ? url : null;
}

/** The parts in a list prop: the ones that were understood, in order. */
export function partsIn(value, name) {
  return (Array.isArray(value) ? value : []).filter((x) => x && typeof x === 'object' && !Array.isArray(x) && (!name || x.part === name));
}

/** The most pictures a set shows: the app's own limit (src/lib/openui/tiles.ts in the app's code). */
export const TILES_MOST = 8;

/**
 * How many pictures stand in each row, for two to eight: the app's own rule since 17 November 2026 (src/lib/openui/
 * tiles.ts in the app's code). Two side by side, always, so each thing has room for its name and a line or two on it;
 * an odd last one keeps its half of the row. Until then two to six stood two or three across.
 */
export function tileRows(count) {
  const n = Math.max(0, Math.min(TILES_MOST, Math.floor(count)));
  if (n < 2) return [];
  const rows = [];
  for (let left = n; left > 0; left -= 2) rows.push(Math.min(2, left));
  return rows;
}
