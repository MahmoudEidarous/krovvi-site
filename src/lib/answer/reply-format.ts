/* Copied from catch8 src/lib/answer/reply-format.ts (pure): the chat's own reader of a mixed reply, so a shared chat draws its bubbles, reaction and answer parts exactly as the app does. Keep in step by copying again. */
/**
 * Krovvi's reply in parts: texting bubbles, a reaction, and the answer.
 *
 * The owner, 2 October: "can we mix between the two styles like the way it
 * answers now and the way like messages ... in the same response message",
 * and "add the reactions emojis ... krovvi can choose from them and apply
 * based on the talking". The phone asks for it with every question
 * (replyStyle 'mixed', lib/agent/ask-body.ts), and Krovvi then writes its
 * reply in a small format that the server (server/src/lib/reply-format.ts)
 * and the phone read the same way:
 *
 *   <react>😂</react>    Krovvi's reaction to the message this reply answers,
 *                        drawn as a badge on the person's bubble. At most
 *                        one, written first, one of REACTIONS.
 *   <say>Found it</say>  one texting bubble: a sentence or two in plain
 *                        words, links and pills allowed, never a list.
 *   everything else      the answer, drawn exactly as answers always were.
 *
 * A turn the phone did not ask that way (every turn from before, a reply
 * from a server that does not know the format) is 'classic': its whole text
 * is the answer, read exactly as before. Only a turn marked 'mixed' is read
 * here at all.
 *
 * The reading forgives what a model gets wrong, so a slip never shows as
 * machinery: blank lines and spaces around tags, a last bubble never closed
 * (closed), a stray </say> (dropped), a tag inside a tag (the inner one is
 * words), a reaction that is not one of the list (ignored). While the reply
 * streams, a tag cut in half at the very end ("<", "<sa", "</sa") waits
 * until the next words say what it is, and a bubble still open at the end is
 * a bubble still being written: the screen shows typing dots for it, never
 * its half sentence.
 *
 * Pure, with no imports: the tests run it under node (reply-format.test.ts),
 * and the chat's transport reads it too (lib/agent/wire.ts).
 */

/** How a turn was asked to be written: texting and the answer mixed, or the answer alone as before. */
export type ReplyStyle = 'mixed' | 'classic';

/** The style this phone asks for with every question (lib/agent/ask-body.ts). */
export const PHONE_REPLY_STYLE: ReplyStyle = 'mixed';

/**
 * The reactions Krovvi may choose from, in the server's order: the same
 * list, in the same order, as server/src/lib/reply-format.ts (a test reads
 * that file and fails when the two differ). Compared without the variation
 * selector U+FE0F, which models drop and add: '❤️' is U+2764 U+FE0F.
 */
export const REACTIONS = ['❤️', '😂', '🔥', '👏', '🎉', '👍', '🙏', '😮', '🥹', '😢', '🫂', '💪', '👀', '🤔', '😅', '🙌', '🫡', '🤝'] as const;

export type Reaction = (typeof REACTIONS)[number];

/**
 * What each reaction means, for VoiceOver ("Krovvi reacted: tell me more")
 * in both of the app's languages. The words are what Krovvi meant by it,
 * not the emoji's dictionary name ("face with tears of joy").
 */
export const REACTION_MEANINGS: Record<Reaction, { en: string; ar: string }> = {
  '❤️': { en: 'love', ar: 'حب' },
  '😂': { en: 'laughing', ar: 'ضحك' },
  '🔥': { en: "that's fire", ar: 'نار' },
  '👏': { en: 'well done', ar: 'برافو' },
  '🎉': { en: 'congrats', ar: 'مبروك' },
  '👍': { en: 'ok', ar: 'تمام' },
  '🙏': { en: 'thank you', ar: 'شكرًا' },
  '😮': { en: 'surprised', ar: 'مفاجأة' },
  '🥹': { en: 'touched', ar: 'متأثر' },
  '😢': { en: 'sad', ar: 'زعلان' },
  '🫂': { en: 'a hug', ar: 'حضن' },
  '💪': { en: "you've got this", ar: 'قدها' },
  '👀': { en: 'tell me more', ar: 'احكيلي' },
  '🤔': { en: 'thinking', ar: 'بيفكر' },
  '😅': { en: 'oops', ar: 'بتحصل' },
  '🙌': { en: 'finally', ar: 'أخيرًا' },
  '🫡': { en: 'on it', ar: 'حاضر' },
  '🤝': { en: 'deal', ar: 'اتفقنا' },
};

/** The variation selector, which models drop and add. */
const VS16 = /️/g;

const bare = (emoji: string) => emoji.replace(VS16, '').trim();

const BY_BARE = new Map<string, Reaction>(REACTIONS.map((emoji) => [bare(emoji), emoji]));

/** The reaction these words are, compared without the variation selector; null when they are not one of the list. */
export function reactionOf(words: string): Reaction | null {
  return BY_BARE.get(bare(words)) ?? null;
}

/** One reaction's meaning in the app's language, for VoiceOver. */
export function reactionMeaning(emoji: Reaction, lang: 'en' | 'ar'): string {
  return REACTION_MEANINGS[emoji][lang];
}

/** One part of a reply, in the order it was written. */
export type ReplyPart =
  | { kind: 'react'; emoji: Reaction }
  /** One bubble. `open`: still being written at the end of a streaming reply. */
  | { kind: 'say'; text: string; open?: true }
  | { kind: 'answer'; text: string }
  /**
   * Where Krovvi heard a message the person sent while it worked (a join,
   * BURSTS below): the person's bubble is drawn here, between what Krovvi
   * had written before it and what it wrote after. The words are that
   * message's own, read from its turn; the marker only names the turn.
   */
  | { kind: 'heard'; turnId: string };

/* ------------------------------------------------------------------ */
/* Bursts: several messages in a row                                    */
/* ------------------------------------------------------------------ */

/**
 * The owner, 3 October: "you can send more than message and krovvi knows and
 * waits etc or like what happen on whatsapp not one at a time". Messages sent
 * one after another are one thought, and the server answers them together
 * (Contract A, server/src/lib/reply-format.ts holds the same two shapes):
 *
 *   - a FOLD keeps the messages as one turn whose question is their words
 *     joined with BURST_SEP, the first message first; the phone draws it as
 *     one group of the person's bubbles, then one reply;
 *   - a JOIN hands a message to the turn already at work, and the server
 *     writes `<heard t="TURNID"/>` into that turn's answer where it heard
 *     it; the phone draws the joined message's bubble there, Krovvi's words
 *     before it above and after it below.
 *
 * Both are drawn the same way live and when a chat is opened again.
 */

/**
 * Between the messages of a fold turn's question: U+2063 INVISIBLE SEPARATOR
 * alone on its line, written exactly as the server's source line is (the
 * character itself between the two line breaks), so a test reads both.
 */
export const BURST_SEP = '\n⁣\n';

/** A turn's id as the door takes it (server/src/door/ask.ts ID). */
const TURN_ID = /^[\w-]{1,64}$/;

/** The heard marker, as the server writes it into an answer. */
const HEARD = /<heard\s+t="([\w-]{1,64})"\s*\/>/g;

/** The marker for one heard message, exactly as the server writes it. */
export function heardMarker(turnId: string): string {
  return `<heard t="${turnId}"/>`;
}

/** Whether a reply holds any heard marker. */
export function hasHeard(text: string): boolean {
  return text.includes('<heard') && new RegExp(HEARD.source).test(text);
}

/** The turns heard in a reply, in the order they were heard. */
export function heardTurns(text: string): string[] {
  if (!text.includes('<heard')) return [];
  return [...text.matchAll(new RegExp(HEARD.source, 'g'))].map((m) => m[1]);
}

/** The reply with its heard markers taken out, the words around them kept apart by a blank line. */
export function withoutHeard(text: string): string {
  if (!text.includes('<heard')) return text;
  return text
    .replace(new RegExp(`[ \\t]*${HEARD.source}[ \\t]*`, 'g'), '\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** A fold turn's question, one text per message, in the order they were sent; one text for every other question. */
export function burstTexts(question: string): string[] {
  if (!question.includes('⁣')) return [question];
  const texts = question
    .split(/\r?\n⁣\r?\n/)
    .map((words) => words.trim())
    .filter(Boolean);
  return texts.length ? texts : [question];
}

/** Several messages as one fold question, the first message first. */
export function joinBurst(texts: readonly string[]): string {
  return texts
    .map((words) => words.trim())
    .filter(Boolean)
    .join(BURST_SEP);
}

/** Whether a turn id is one the door would take. */
export function turnIdOk(id: unknown): id is string {
  return typeof id === 'string' && TURN_ID.test(id);
}

const OPEN_SAY = '<say>';
const CLOSE_SAY = '</say>';
const OPEN_REACT = '<react>';
const CLOSE_REACT = '</react>';
const TAGS = [OPEN_SAY, CLOSE_SAY, OPEN_REACT, CLOSE_REACT] as const;

/**
 * How far a reaction's close may sit from its open: one emoji and a little
 * space. Past it the open tag was a slip, and the words after it are kept
 * as words; deciding at a fixed distance means a later close can never take
 * back words already on screen.
 */
const REACT_WINDOW = 24;

/**
 * A bubble longer than this was never a bubble: the model wrote its answer
 * inside one and forgot to close it. Drawn as the answer, as it streams.
 */
export const BUBBLE_MAX = 480;

/** The slip rule's reach (below): a reply with no tags this short, or shorter, may be texting that forgot its tags. */
export const SLIP_MAX = 320;
/** And at most this many bubbles of it. */
export const SLIP_BUBBLES = 3;

/** A line that starts a block: a heading, a quote, a list item, a table row, a fence, a formula, a fold. */
const BLOCK_LINE = /^\s{0,3}(?:#{1,6}\s|>|[-*+]\s|\d{1,9}[.)]\s|\||```|~~~|\$\$|\\\[|<\/?(?:details|summary)\b)/;
/** A rule: three or more of the same mark alone on a line. */
const RULE_LINE = /^\s{0,3}([-*_])(?:\s*\1){2,}\s*$/;
/** A table's delimiter row, with or without the outer pipes. */
const TABLE_RULE = /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/;
const IMAGE = /!\[[^\]]*\]\([^)]*\)/;

/** Whether these words hold anything a bubble cannot: a list, a heading, a table, a fence, a picture. */
export function blocky(words: string): boolean {
  if (IMAGE.test(words)) return true;
  return words.split('\n').some((line) => BLOCK_LINE.test(line) || RULE_LINE.test(line) || TABLE_RULE.test(line));
}

/** Whether the text holds any of the format's tags. */
export function hasReplyTag(text: string): boolean {
  return TAGS.some((tag) => text.includes(tag));
}

/**
 * Where a tag cut in half at the very end begins ("<", "<sa", "</re"), or
 * the text's length. Only the end can hold one: everything before it has
 * been read whole.
 */
function heldFrom(text: string): number {
  const at = text.lastIndexOf('<');
  if (at < 0) return text.length;
  const tail = text.slice(at);
  if (TAGS.some((tag) => tag.length > tail.length && tag.startsWith(tail))) return at;
  // A heard marker cut in half: the server writes them, never the model, but a slip is never drawn as words.
  return HEARD_OPEN.startsWith(tail) || HEARD_PART.test(tail) ? at : text.length;
}

/** The start of a heard marker, and one that has begun but not ended. */
const HEARD_OPEN = '<heard t="';
const HEARD_PART = /^<heard\s+t="[\w-]{0,64}(?:"\s*\/?)?$/;

/** The first tag at or after `from`. */
function nextTag(text: string, from: number): { at: number; tag: (typeof TAGS)[number] } | null {
  let best: { at: number; tag: (typeof TAGS)[number] } | null = null;
  for (const tag of TAGS) {
    const at = text.indexOf(tag, from);
    if (at >= 0 && (!best || at < best.at)) best = { at, tag };
  }
  return best;
}

/** A bubble's words on one line: a single line break inside a paragraph reads as a space, as markdown reads it. */
const oneLine = (words: string) => words.replace(/\s*\n\s*/g, ' ').trim();

/**
 * Answer words as the answer draws them: the blank lines and spaces left
 * around the tags go, the words themselves are untouched. Empty when there
 * is nothing but space.
 */
function tidy(words: string): string {
  if (!words.trim()) return '';
  return words
    .replace(/^(?:[ \t]*\r?\n)+/, '')
    .replace(/^[ \t]{1,3}(?=\S)/, '')
    .replace(/\s+$/, '');
}

/**
 * The slip rule. A finished reply that was asked for in the mixed style but
 * carries no tags at all, and is short and plain (no list, heading, table,
 * fence or picture, SLIP_MAX characters at most), is texting that forgot
 * its tags, most often a greeting: it is drawn as bubbles, one per
 * paragraph, at most SLIP_BUBBLES. Anything else is the answer.
 */
function slip(text: string): ReplyPart[] {
  const words = text.trim();
  if (!words) return [];
  if (words.length <= SLIP_MAX && !blocky(words)) {
    const pieces = words.split(/\n[ \t]*\n/).map(oneLine).filter(Boolean);
    if (pieces.length && pieces.length <= SLIP_BUBBLES) return pieces.map((piece) => ({ kind: 'say' as const, text: piece }));
  }
  return [{ kind: 'answer', text: tidy(text) }];
}

/**
 * A reply, read into its parts in the order they were written.
 *
 * `mixed`: the turn was asked in the mixed style; a classic turn is one
 * answer part, its text exactly as written. `final`: the reply has finished
 * arriving; while it streams, a tag cut in half at the end waits and a
 * bubble still open is marked `open`, and once it has finished an open
 * bubble is closed and the slip rule may apply.
 */
export function replyParts(text: string, options: { mixed: boolean; final: boolean }): ReplyPart[] {
  if (!text.includes('<heard')) return segmentParts(text, options, true);
  const marks = [...text.matchAll(new RegExp(HEARD.source, 'g'))];
  if (!marks.length) return segmentParts(text, options, true);
  /**
   * A reply that heard the person mid-way: each stretch between markers is
   * read as a reply of its own (a stretch before a marker has ended, so a
   * bubble left open there is closed), with the person's bubble between.
   * The slip rule stays the whole reply's: a reply that used tags anywhere
   * never turns an untagged stretch into bubbles. One reaction at most, the
   * first, wherever it was written.
   */
  const slipOk = !hasReplyTag(text);
  const out: ReplyPart[] = [];
  let from = 0;
  for (const mark of marks) {
    out.push(...segmentParts(text.slice(from, mark.index), { mixed: options.mixed, final: true }, slipOk));
    out.push({ kind: 'heard', turnId: mark[1] });
    from = (mark.index ?? 0) + mark[0].length;
  }
  out.push(...segmentParts(text.slice(from), options, slipOk));
  let reacted = false;
  return out.filter((part) => {
    if (part.kind !== 'react') return true;
    if (reacted) return false;
    reacted = true;
    return true;
  });
}

/** One stretch of a reply with no heard marker in it, read by the rules above. */
function segmentParts(text: string, options: { mixed: boolean; final: boolean }, slipOk: boolean): ReplyPart[] {
  if (!options.mixed) return text.trim() ? [{ kind: 'answer', text }] : [];
  const { final } = options;
  const body = final ? text : text.slice(0, heldFrom(text));
  if (final && !hasReplyTag(body)) return slipOk ? slip(body) : body.trim() ? [{ kind: 'answer', text: tidy(body) }] : [];

  const out: ReplyPart[] = [];
  let reacted = false;
  /** Answer words read since the last part. */
  let answer = '';
  const flush = () => {
    const words = tidy(answer);
    if (words) out.push({ kind: 'answer', text: words });
    answer = '';
  };
  /**
   * A bubble's words. Too long, or holding a list or a heading, they were
   * never a bubble and join the answer around them; a blank line inside
   * them is two bubbles.
   */
  const say = (raw: string, open: boolean) => {
    const words = raw.trim();
    if (words.length > BUBBLE_MAX || (words && blocky(words))) {
      answer = `${answer.replace(/\s+$/, '')}${answer.trim() ? '\n\n' : ''}${words}${open ? '' : '\n\n'}`;
      return;
    }
    if (open) {
      flush();
      out.push({ kind: 'say', text: oneLine(words), open: true });
      return;
    }
    if (!words) return;
    flush();
    for (const piece of words.split(/\n[ \t]*\n/)) {
      const line = oneLine(piece);
      if (line) out.push({ kind: 'say', text: line });
    }
  };

  let at = 0;
  while (at < body.length) {
    const next = nextTag(body, at);
    if (!next) {
      answer += body.slice(at);
      break;
    }
    answer += body.slice(at, next.at);
    const after = next.at + next.tag.length;
    if (next.tag === OPEN_SAY) {
      // Inside a bubble only its own close counts: any other tag is words.
      const close = body.indexOf(CLOSE_SAY, after);
      if (close < 0) {
        // Still being written, or never closed: a finished reply closes it.
        say(body.slice(after), !final);
        at = body.length;
        break;
      }
      say(body.slice(after, close), false);
      at = close + CLOSE_SAY.length;
    } else if (next.tag === OPEN_REACT) {
      const close = body.indexOf(CLOSE_REACT, after);
      if (close >= 0 && close - after <= REACT_WINDOW) {
        // One of the list, and the first one: the reaction. Anything else is ignored, words and all.
        const emoji = reactionOf(body.slice(after, close));
        if (emoji && !reacted) {
          reacted = true;
          flush();
          out.push({ kind: 'react', emoji });
        }
        at = close + CLOSE_REACT.length;
      } else if (!final && body.length - after <= REACT_WINDOW) {
        // A reaction still being written: nothing after it is drawn until it closes.
        at = body.length;
        break;
      } else {
        // Never closed. A finished reply that ends on a reaction of the list
        // takes it; otherwise the open tag was a slip, and the words after it
        // are read as words.
        const emoji = final && body.length - after <= REACT_WINDOW ? reactionOf(body.slice(after)) : null;
        if (emoji) {
          if (!reacted) {
            reacted = true;
            flush();
            out.push({ kind: 'react', emoji });
          }
          at = body.length;
          break;
        }
        at = after;
      }
    } else {
      // A close with nothing open: dropped.
      at = after;
    }
  }
  flush();
  return out;
}

/** A part's words as plain markdown: a reaction has none, and a heard message is the person's, never Krovvi's. */
const wordsOf = (part: ReplyPart) => (part.kind === 'react' || part.kind === 'heard' ? '' : part.text);

/**
 * The words of a reply's parts, the bubbles' and the answer's, as one
 * markdown text with a blank line between parts and no tags: what Copy,
 * Share, the paragraph sheet and a correction read.
 */
export function replyWords(parts: readonly ReplyPart[]): string {
  return parts
    .map(wordsOf)
    .filter((words) => words.trim())
    .join('\n\n');
}

/**
 * A reply in plain words, the way the server's plainReply gives it: the
 * reaction dropped, each bubble its words, the parts joined with one blank
 * line. A reply with no tags comes back as it was written. For every place
 * a chat answer's words leave the chat's own drawing: the history's line,
 * a search hit, the kept list.
 */
export function plainReply(text: string): string {
  // A heard marker is never words: the server's plainReply drops it too.
  const words = withoutHeard(text);
  if (!hasReplyTag(words)) return words.trim();
  return replyWords(replyParts(words, { mixed: true, final: true }));
}

/** The reaction a reply carries, or null. */
export function replyReaction(parts: readonly ReplyPart[]): Reaction | null {
  for (const part of parts) if (part.kind === 'react') return part.emoji;
  return null;
}

/** The last few replies' reactions, by their text: the person's bubble asks on every paint. */
const reactionsSeen = new Map<string, Reaction | null>();

/**
 * The reaction in a reply's text, or null: what the person's bubble wears.
 * Cheap for the replies that have none, and kept for the last few that do.
 */
export function reactionIn(text: string, final: boolean): Reaction | null {
  if (!text.includes(OPEN_REACT)) return null;
  const key = `${final ? 'f' : 's'}${text}`;
  const known = reactionsSeen.get(key);
  if (known !== undefined) return known;
  // Only a reaction written before Krovvi heard anyone else answers this message;
  // one written after a heard marker sits on that heard message (reactionAfterHeard).
  const parts = replyParts(text, { mixed: true, final });
  const firstHeard = parts.findIndex((part) => part.kind === 'heard');
  const found = replyReaction(firstHeard < 0 ? parts : parts.slice(0, firstHeard));
  if (reactionsSeen.size >= 32) reactionsSeen.clear();
  reactionsSeen.set(key, found);
  return found;
}

/**
 * The heard message a reply's reaction sits on, when the reaction was
 * written after Krovvi heard it (rare: the reaction is written first), or
 * null. The person's bubble just above a reaction is the one it answers.
 */
export function reactionAfterHeard(parts: readonly ReplyPart[]): { turnId: string; emoji: Reaction } | null {
  let heard: string | null = null;
  for (const part of parts) {
    if (part.kind === 'heard') heard = part.turnId;
    else if (part.kind === 'react') return heard ? { turnId: heard, emoji: part.emoji } : null;
  }
  return null;
}

/**
 * Whether anything of a streaming reply shows besides its reaction: a
 * bubble, being written or done, or answer words. The working strip under
 * the reply gives way then, as it always gave way to the first word.
 */
export function replyBegun(text: string): boolean {
  return replyParts(text, { mixed: true, final: false }).some((part) => part.kind !== 'react' && part.kind !== 'heard');
}

/**
 * Whether a streaming reply's answer part has begun. Until it has, the
 * working strip comes back under the bubbles whenever a tool runs: a bubble
 * written before a tool call ("On it") is never the answer.
 */
export function answerBegun(text: string): boolean {
  return replyParts(text, { mixed: true, final: false }).some((part) => part.kind === 'answer');
}

/**
 * A step's words split at the end of its last tag: what the tags hold
 * (`kept`, never an opening line for the working strip) and the untagged
 * words after them (`tail`), the only words of a mixed step that may still
 * be one (lib/agent/wire.ts).
 */
export function taggedHead(words: string): { kept: string; tail: string } {
  let end = 0;
  for (const tag of [CLOSE_SAY, CLOSE_REACT]) {
    const at = words.lastIndexOf(tag);
    if (at >= 0) end = Math.max(end, at + tag.length);
  }
  return { kept: words.slice(0, end), tail: words.slice(end) };
}
