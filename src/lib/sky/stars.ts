/* A copy of the app's sky (catch8 src/lib/sky/stars.ts at main 272d7cc5), kept word for word so the
 site's stars are the stars a person sees behind the app's home and chat. Change the app's first, then this. */

/**
 * The quiet stars behind the home (the owner, 9 October 2026, of six skies
 * drawn on quiet stars: "work more on depth i need an iconic combo", and of
 * the one worked further, "i like deep a lot"). Pure black, small ivory
 * stars at three distances: hundreds faint and far, many in the middle, and
 * a few near and bright with a soft glow. Every star breathes a little, the
 * middle ones the most. Each distance drifts upward, the near ones fastest,
 * all of them so slowly that no one sees a star move: a few points a
 * minute. And the whole sky can lean a few points with the phone, the near
 * stars the most. That is what reads as depth.
 *
 * The numbers are the ones of the page he chose from
 * (design/krovvi-iconic-2026-10-09.html, the sky called deep).
 *
 * This file is the stars themselves, worked out once for a screen: where
 * each one is, how large and how bright, and which ones breathe together.
 * components/sky/stars.tsx draws them, each distance as a few batches of
 * points on one canvas, and moves the batches; no star is ever a view.
 *
 * A field is as wide as the screen and exactly one screen tall, and it
 * repeats: drawn twice, one under the other, a window one screen tall slides
 * down it for ever with no seam. The same seed gives the same sky, so it is
 * the sky a person knows, never a new one each time the app opens.
 *
 * Pure: no imports, so it runs under node --test.
 */

export interface StarLayerSpec {
  /** What it is called, for the drawing's keys. */
  name: 'far' | 'mid' | 'near';
  /** Stars for every 100,000 square points of screen. */
  density: number;
  /** Their radius in points, smallest and largest. */
  radius: [number, number];
  /** How bright, dimmest and brightest, 0 to 1. */
  alpha: [number, number];
  /** How fast it drifts upward, in points a minute. */
  speed: number;
  /** How many sets of its stars breathe, each on its own time, and how much of their light a breath takes away (0 to 1). */
  breathe: number;
  dim: number;
  /** A soft glow under each star, so wide (its radius times this). 0: none. */
  glow: number;
  /** No two of its stars are nearer than this, in points: bright stars never clump. */
  apart: number;
}

/**
 * The sky with depth. The far stars are counted by the hundred and can
 * hardly be told from the dark; the middle ones are the sky a glance sees,
 * and they breathe the most; the near ones are few enough to know one by
 * one.
 */
export const DEPTH: readonly StarLayerSpec[] = [
  { name: 'far', density: 143, radius: [0.35, 0.6], alpha: [0.07, 0.22], speed: 2.2, breathe: 4, dim: 0.25, glow: 0, apart: 0 },
  { name: 'mid', density: 38.5, radius: [0.6, 0.95], alpha: [0.22, 0.55], speed: 4, breathe: 6, dim: 0.55, glow: 0, apart: 7 },
  { name: 'near', density: 9.1, radius: [1, 1.55], alpha: [0.55, 0.9], speed: 7, breathe: 3, dim: 0.18, glow: 4.2, apart: 46 },
];

/** Stars drawn with one paint: the same size, the same light, breathing together. */
export interface StarBatch {
  /** Radius in points. */
  r: number;
  /** How bright at its brightest, 0 to 1. */
  a: number;
  /** Which of the layer's breathing sets it is in; -1 when its light holds still. */
  set: number;
  /** Where each one is. Every star is here twice, one screen apart, so the field repeats. */
  points: Array<{ x: number; y: number }>;
}

/** One set of stars that breathe together: down to `low` of their light and back, once every `seconds`, starting `phase` of the way in. */
export interface Breath {
  seconds: number;
  phase: number;
  low: number;
}

export interface StarLayer {
  spec: StarLayerSpec;
  batches: StarBatch[];
  breaths: Breath[];
  /** How many stars it holds (each once). */
  count: number;
}

/** A small generator of numbers from a seed, the same on every phone (mulberry32). */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** How many steps of size and of light a layer's stars are sorted into: each pair is one batch. */
const SIZES = 2;
const LIGHTS = 3;

/**
 * Skies already placed, by size and seed: the home, the chat, History and
 * every app's strip draw the same few skies, so each is placed once and kept,
 * never again on every screen that opens (placing one is the costliest part
 * of a sky's first frame).
 */
const placedSkies = new Map<string, StarLayer[]>();

/**
 * The stars of a screen `width` by `height` points. Each layer's stars are
 * placed by its own run of the seed, so changing one layer never moves
 * another's stars. The same size and seed always give the same stars, so a
 * sky placed once is kept and handed out again.
 */
export function starLayers(width: number, height: number, seed = 11, specs: readonly StarLayerSpec[] = DEPTH): StarLayer[] {
  if (!(width > 0) || !(height > 0)) return [];
  const key = specs === DEPTH ? `${width}x${height}:${seed}` : null;
  const known = key ? placedSkies.get(key) : undefined;
  if (known) return known;
  const area = (width * height) / 100_000;
  const layers = specs.map((spec, index) => {
    const rnd = seeded(seed * 7919 + index * 104_729 + 1);
    const count = Math.max(1, Math.round(spec.density * area));
    const placed: Array<{ x: number; y: number }> = [];
    const far2 = spec.apart * spec.apart;
    // The field repeats down the screen, so two stars are also near each other across its top and bottom edge.
    const near = (x: number, y: number) =>
      placed.some((p) => {
        const dx = p.x - x;
        const dy = Math.min(Math.abs(p.y - y), height - Math.abs(p.y - y));
        return dx * dx + dy * dy < far2;
      });
    const batches = new Map<string, StarBatch>();
    for (let i = 0; i < count; i += 1) {
      let x = rnd() * width;
      let y = rnd() * height;
      // A few tries for a place of its own; after them it stands where it fell, so a crowded sky still has all its stars.
      for (let tries = 0; spec.apart > 0 && tries < 24 && near(x, y); tries += 1) {
        x = rnd() * width;
        y = rnd() * height;
      }
      placed.push({ x, y });
      const size = Math.min(SIZES - 1, Math.floor(rnd() * SIZES));
      const light = Math.min(LIGHTS - 1, Math.floor(rnd() * LIGHTS));
      const set = spec.breathe > 0 ? Math.min(spec.breathe - 1, Math.floor(rnd() * spec.breathe)) : -1;
      const key = `${size}|${light}|${set}`;
      let batch = batches.get(key);
      if (!batch) {
        batch = {
          r: spec.radius[0] + ((spec.radius[1] - spec.radius[0]) * size) / Math.max(1, SIZES - 1),
          a: spec.alpha[0] + ((spec.alpha[1] - spec.alpha[0]) * light) / Math.max(1, LIGHTS - 1),
          set,
          points: [],
        };
        batches.set(key, batch);
      }
      batch.points.push({ x, y }, { x, y: y + height });
    }
    const breaths: Breath[] = [];
    // Each set on a time of its own, between about four and sixteen seconds a breath, so no two keep step.
    for (let s = 0; s < spec.breathe; s += 1) breaths.push({ seconds: (2 * Math.PI) / (0.4 + rnd() * 1.2), phase: rnd(), low: 1 - spec.dim });
    return { spec, batches: [...batches.values()].sort((a, b) => a.set - b.set || a.r - b.r || a.a - b.a), breaths, count };
  });
  if (key) {
    if (placedSkies.size > 16) placedSkies.clear();
    placedSkies.set(key, layers);
  }
  return layers;
}

/**
 * How far up a layer has drifted after `seconds`, as the distance its field
 * is drawn above its place: from 0 up to one screen, then from 0 again.
 * `speed` is in points a minute.
 */
export function driftOf(seconds: number, speed: number, height: number): number {
  if (!(height > 0)) return 0;
  return ((Math.max(0, seconds) * speed) / 60) % height;
}

/** How much of its light a breathing set shows after `seconds`: between its `low` and 1, smoothly, for ever. */
export function breathOf(seconds: number, breath: Breath): number {
  const turn = seconds / breath.seconds + breath.phase;
  const wave = 0.5 - 0.5 * Math.cos(2 * Math.PI * turn);
  return breath.low + (1 - breath.low) * wave;
}
