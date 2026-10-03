/**
 * Letters drawn in dots, for a person's mark (components/person-face.tsx).
 *
 * Every letter is drawn once on a small grid and kept here; the mark draws
 * a dot wherever a row says '#'. Nothing is guessed while the app runs, so
 * a letter looks the same everywhere and at every size (tested in
 * letter-dots.test.ts; the sheet that shows them all is
 * design/people-and-days-2026-09-23.html in catch8-1).
 *
 *   English  the classic dot-matrix capitals, five dots wide and seven tall,
 *            the letters of signs and clocks.
 *   Arabic   Kufi, the old Arabic hand that was itself built on a grid,
 *            on the same seven rows. A first draft came from an Arabic font
 *            thinned to one line of dots; the wide letters (س ش ص ض), ع and
 *            ي were fixed by hand.
 *
 * Forms that share a letter's shape use it (أ إ آ are ا, ة is ه, ى is ي),
 * accents are dropped (É is E), and a name in any other alphabet keeps its
 * plain first letter. A letter that looks wrong is fixed in one line here.
 */

export const LATIN: Record<string, string[]> = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  D: ['###..', '#..#.', '#...#', '#...#', '#...#', '#..#.', '###..'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.####'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '#.#.#', '.#.#.'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
};

export const ARABIC: Record<string, string[]> = {
  'ا': ['#', '#', '#', '#', '#', '#', '#'],
  'ب': ['......#', '#.....#', '#######', '.......', '...#...'],
  'ت': ['..#.#..', '......#', '#.....#', '#######'],
  'ث': ['...#...', '..#.#..', '......#', '#.....#', '#######'],
  'ج': ['..###..', '.....#.', '.....#.', '..###..', '.#.....', '.#..#..', '..####.'],
  'ح': ['..###..', '.....#.', '.....#.', '..###..', '.#.....', '.#.....', '..####.'],
  'خ': ['...#...', '.......', '..###..', '.....#.', '..###..', '.#.....', '..####.'],
  'د': ['.###.', '....#', '....#', '....#', '#####'],
  'ذ': ['..#..', '.....', '.###.', '....#', '....#', '#####'],
  'ر': ['...#', '...#', '...#', '...#', '..#.', '##..'],
  'ز': ['...#', '....', '...#', '...#', '..#.', '##..'],
  'س': ['...#.#.#', '#..#####', '#..#....', '####....'],
  'ش': ['.....#..', '....#.#.', '........', '...#.#.#', '#..#####', '#..#....', '####....'],
  'ص': ['....####', '#...#..#', '#..#####', '####....'],
  'ض': ['......#.', '........', '....####', '#...#..#', '#..#####', '####....'],
  'ط': ['.#.....', '.#.....', '.#####.', '.#....#', '.#....#', '#######'],
  'ظ': ['.#..#..', '.#.....', '.#####.', '.#....#', '.#....#', '#######'],
  'ع': ['..###', '.#...', '..###', '.#...', '#....', '#....', '.####'],
  'غ': ['...#.', '..###', '.#...', '..###', '.#...', '#....', '.####'],
  'ف': ['.....#.', '.......', '....###', '#...#.#', '#######'],
  'ق': ['...#.#', '......', '...###', '#..#.#', '#..###', '#....#', '.####.'],
  'ك': ['......#', '......#', '..##..#', '......#', '#.....#', '#######'],
  'ل': ['.....#', '.....#', '.....#', '.....#', '#....#', '#....#', '.####.'],
  'م': ['.###', '.#.#', '####', '#...', '#...', '#...'],
  'ن': ['...#...', '.......', '#.....#', '#.....#', '.#...#.', '..###..'],
  'ه': ['.###.', '#...#', '#.#.#', '#...#', '#####'],
  'و': ['.###', '.#.#', '.###', '...#', '..#.', '##..'],
  'ي': ['.....##', '....#..', '.....#.', '#.....#', '.#####.', '.......', '..#.#..'],
};

/** Letters that wear another letter's shape. */
const SAME: Record<string, string> = {
  'أ': 'ا',
  'إ': 'ا',
  'آ': 'ا',
  'ٱ': 'ا',
  'ؤ': 'و',
  'ئ': 'ي',
  'ى': 'ي',
  'ة': 'ه',
  'پ': 'ب',
  'چ': 'ج',
  'ژ': 'ز',
  'ک': 'ك',
  'گ': 'ك',
  'ی': 'ي',
};

export type Initial =
  /** A drawn letter: its key (for caching) and its dots, trimmed to the ink. */
  | { key: string; dots: Array<[number, number]>; cols: number; rows: number }
  /** Any other alphabet: the plain letter. */
  | { text: string };

const cache = new Map<string, Initial>();

function trimmed(key: string, rows: string[]): Initial {
  const dots: Array<[number, number]> = [];
  rows.forEach((line, y) => [...line].forEach((cell, x) => cell === '#' && dots.push([x, y])));
  const xs = dots.map((d) => d[0]);
  const ys = dots.map((d) => d[1]);
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  return {
    key,
    dots: dots.map(([x, y]) => [x - x0, y - y0]),
    cols: Math.max(...xs) - x0 + 1,
    rows: Math.max(...ys) - y0 + 1,
  };
}

/** The first letter of a name, as dots when it has a drawing. */
export function initialOf(name: string): Initial {
  for (const ch of name.trim()) {
    const hit = cache.get(ch);
    if (hit) return hit;
    const bare = ch.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
    const arabic = SAME[ch] ?? ch;
    const drawn = LATIN[bare] ? trimmed(bare, LATIN[bare]) : ARABIC[arabic] ? trimmed(arabic, ARABIC[arabic]) : null;
    if (drawn) {
      cache.set(ch, drawn);
      return drawn;
    }
    // Skip what is not a letter (a quote, a dot, a digit) and try the next one.
    if (/\p{L}/u.test(ch)) return { text: ch.toUpperCase() };
  }
  return { text: '?' };
}
