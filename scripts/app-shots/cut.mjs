// Sizes and cuts the app's raw screens (take.sh) into what krovvi.com serves, and writes public/app/shots.json.
//
//   node scripts/app-shots/cut.mjs [--raw ~/.krovvi/site19/raw] [--theme purple] [--only name,name]
//
// For every raw picture <name>.png (the phone's own 3x, 1206 x 2622):
//   public/app/<theme>/<name>.webp      804 wide (2x of the 402 point screen)
//   public/app/<theme>/<name>@3x.webp   1206 wide, for a phone drawn large or seen on a phone
// For a card's scene (card-<name>.png): the exchange alone, what was said, Krovvi's reply and the card under it, cut out
// of the chat between the top bar and the row of small marks under the reply:
//   public/app/<theme>/x-<name>.webp and x-<name>@3x.webp, and its size in points in shots.json (so the page holds its room).
// An exchange taller than the screen is taken twice (take.sh tall: card-<name>.png on its start, card-<name>-b.png on its
// end) and joined here where the two show the same rows of the card.
// Purple is cut first: where its exchanges were cut is kept (shots.json cuts) and every other colour is cut in the very
// same places, so a picture, its film and the room the page holds for them agree in every colour.
// For every raw film <name>.mov: <name>.mp4 (804 wide, from just before the first move to just after the last),
// <name>.webp (its first moment) and, from <name>-end.png, <name>-end.webp (its last, sharper than the film's).
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = join(HERE, "..", "..");
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i < 0 ? fallback : args[i + 1];
};
const RAW = opt("raw", join(homedir(), ".krovvi/site19/raw"));
const THEME = opt("theme", "purple");
const ONLY = opt("only", "")
  .split(",")
  .filter(Boolean);
const OUT = join(SITE, "public/app", THEME);
mkdirSync(OUT, { recursive: true });

const POINTS = 402; // the phone's screen, in points
const W3 = 1206;
const W2 = 804;
const want = (name) => !ONLY.length || ONLY.includes(name);

async function webp(input, name) {
  await sharp(input).resize({ width: W2, kernel: "lanczos3" }).webp({ quality: 86, effort: 6 }).toFile(join(OUT, `${name}.webp`));
  await sharp(input).resize({ width: W3, kernel: "lanczos3" }).webp({ quality: 84, effort: 6 }).toFile(join(OUT, `${name}@3x.webp`));
}

/**
 * Where an exchange stands in a card's scene: from the top of what they said to the bottom of the card. Read off the
 * picture itself: a row belongs to a bubble or the card when a good part of it is far from the chat's ground at the
 * picture's left edge (the ground is a soft sky, so each row is compared with its own edge).
 */
async function exchangeBox(file) {
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const top0 = Math.round(height * 0.16); // under the top bar and the day's line
  const bottom0 = Math.round(height * 0.84); // over the text box
  const busy = [];
  for (let y = 0; y < height; y += 1) {
    const row = y * width * channels;
    const gr = data[row + 6 * channels];
    const gg = data[row + 6 * channels + 1];
    const gb = data[row + 6 * channels + 2];
    let far = 0;
    for (let x = 0; x < width; x += 2) {
      const p = row + x * channels;
      if (Math.abs(data[p] - gr) + Math.abs(data[p + 1] - gg) + Math.abs(data[p + 2] - gb) > 14) far += 2;
    }
    busy.push(far / width);
  }
  // the day's line ("Today 11:01") is small grey words: the exchange starts at the first row that is mostly a bubble
  let top = top0;
  while (top < bottom0 && busy[top] < 0.2) top += 1;
  // the card is the last wide block; the small marks under it are narrow, so the end is the last row wider than a third
  let bottom = bottom0;
  while (bottom > top && busy[bottom] < 0.5) bottom -= 1;
  return { top, bottom, height, width };
}

/** The part of a card's scene that is its exchange, in the picture's own pixels: the same cut for its picture and its film. */
async function exchangeCut(file) {
  const box = await exchangeBox(file);
  // a little of the chat's ground over it, and room under it for the card's soft shadow (never the small marks below)
  const y = Math.max(0, box.top - 24);
  const h = Math.min(box.height - y, box.bottom - box.top + 24 + 36);
  return { y, h: h - (h % 2), width: box.width };
}

/**
 * An exchange taller than the screen, taken twice: `file` stands on its start, `fileB` on its end. How far the chat
 * moved between the two is read off the pictures (a band of the card in the first, found again in the second), and
 * the cut is the first from what they said down to a seam inside that band, then the second from the same row on.
 */
async function tallCut(file, fileB) {
  const a = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const b = await sharp(fileB).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, channels } = a.info;
  const k = width / POINTS;
  const y0 = Math.round(560 * k);
  const y1 = Math.round(640 * k);
  let best = null;
  for (let d = Math.round(40 * k); d <= Math.round(520 * k); d += 1) {
    if (y0 - d < Math.round(150 * k)) break; // the band stays under the app's top in the second picture
    let sum = 0;
    let n = 0;
    for (let y = y0; y < y1; y += 3) {
      const ra = y * width * channels;
      const rb = (y - d) * width * channels;
      for (let x = Math.round(width * 0.12); x < width * 0.88; x += 4) {
        const pa = ra + x * channels;
        const pb = rb + x * channels;
        sum += Math.abs(a.data[pa] - b.data[pb]) + Math.abs(a.data[pa + 1] - b.data[pb + 1]) + Math.abs(a.data[pa + 2] - b.data[pb + 2]);
        n += 1;
      }
    }
    const cost = sum / n;
    if (!best || cost < best.cost) best = { d, cost };
  }
  if (!best || best.cost > 6) throw new Error(`the two pictures of ${basename(file)} do not join (nearest ${best ? best.cost.toFixed(1) : "none"})`);
  const top = (await exchangeBox(file)).top;
  const bottom = (await exchangeBox(fileB)).bottom;
  const seam = Math.round(600 * k);
  const y = Math.max(0, top - 24);
  const h = seam - y + (bottom + 36 - (seam - best.d));
  return { y, h: h - (h % 2), width, seam, d: best.d };
}

/** Where a card's scene is cut: purple's own reading, and for every other colour the place purple was cut. */
async function cutOf(name, file) {
  if (THEME !== "purple" && cuts[name]) return cuts[name];
  const fileB = file.replace(/\.png$/, "-b.png");
  const cut = existsSync(fileB) ? await tallCut(file, fileB) : await exchangeCut(file);
  if (THEME === "purple") cuts[name] = cut;
  return cut;
}

async function exchange(file, name, at) {
  const { y, h, width } = at;
  let cut = sharp(file).extract({ left: 0, top: y, width, height: h });
  if (at.seam) {
    // the first picture down to the seam, the second from the same row of the card on
    const h1 = at.seam - y;
    const partA = await sharp(file).removeAlpha().extract({ left: 0, top: y, width, height: h1 }).png().toBuffer();
    const partB = await sharp(file.replace(/\.png$/, "-b.png")).removeAlpha().extract({ left: 0, top: at.seam - at.d, width, height: h - h1 }).png().toBuffer();
    const whole = await sharp({ create: { width, height: h, channels: 3, background: "#ffffff" } }).composite([{ input: partA, top: 0, left: 0 }, { input: partB, top: h1, left: 0 }]).png().toBuffer();
    cut = sharp(whole);
  }
  await cut.clone().resize({ width: W2, kernel: "lanczos3" }).webp({ quality: 88, effort: 6 }).toFile(join(OUT, `x-${name}.webp`));
  await cut.clone().webp({ quality: 86, effort: 6 }).toFile(join(OUT, `x-${name}@3x.webp`));
  return [POINTS, Math.round((h / width) * POINTS)];
}

/** A band of a screen, from one height to another in points: the app's top, its text box, a game without the phone's own bar. */
async function band(file, name, fromPt, toPt) {
  const meta = await sharp(file).metadata();
  const k = meta.width / POINTS;
  const cut = sharp(file).extract({ left: 0, top: Math.round(fromPt * k), width: meta.width, height: Math.round((toPt - fromPt) * k) });
  await cut.clone().resize({ width: W2, kernel: "lanczos3" }).webp({ quality: 88, effort: 6 }).toFile(join(OUT, `${name}.webp`));
  await cut.clone().webp({ quality: 86, effort: 6 }).toFile(join(OUT, `${name}@3x.webp`));
  return [POINTS, Math.round(toPt - fromPt)];
}

const ffmpeg = (a) => execFileSync("ffmpeg", ["-v", "error", "-y", ...a], { stdio: ["ignore", "pipe", "pipe"] });
const probe = (file) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString().trim());

/** When the picture first moves and when it last settles, from the film itself. */
function moves(file) {
  let log = "";
  try {
    execFileSync("ffmpeg", ["-hide_banner", "-i", file, "-vf", "freezedetect=n=0.0006:d=0.3", "-map", "0:v", "-f", "null", "-"], { stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) {
    log = String(e.stderr ?? "");
  }
  if (!log) {
    const r = execFileSync("sh", ["-c", `ffmpeg -hide_banner -i '${file}' -vf freezedetect=n=0.0006:d=0.3 -map 0:v -f null - 2>&1 || true`]).toString();
    log = r;
  }
  const ev = [...log.matchAll(/freeze_(start|end): ([0-9.]+)/g)].map((m) => [m[1], Number(m[2])]);
  const firstEnd = ev.find((e) => e[0] === "end")?.[1] ?? null;
  let lastStart = null;
  for (const [kind, t] of ev) lastStart = kind === "start" ? t : null;
  return { firstEnd, lastStart };
}

async function film(file, name, how, cut = null) {
  const dur = probe(file);
  const { firstEnd, lastStart } = moves(file);
  let start = 0;
  if (how === "tap" && firstEnd !== null) start = Math.max(0, firstEnd - (cut ? 0.6 : 0.35));
  if (how === "ask" && firstEnd !== null) start = firstEnd + 0.55;
  if (how === "run") start = 0.2;
  let end = Math.min(dur, (lastStart ?? dur) + (cut ? 0.9 : 0.6));
  if (end - start < 1) end = dur;
  // an exchange's film is the same cut as its picture, so the one lies exactly over the other
  const crop = cut ? `crop=${cut.width}:${cut.h}:0:${cut.y},` : "";
  ffmpeg(["-ss", String(start), "-to", String(end), "-i", file, "-vf", `${crop}fps=30,scale=${W2}:-2:flags=lanczos,format=yuv420p`, "-c:v", "libx264", "-preset", "slow", "-crf", cut ? "20" : "23", "-profile:v", "high", "-movflags", "+faststart", "-an", join(OUT, `${name}.mp4`)]);
  if (!cut) {
    const first = join(RAW, `_first-${name}.png`);
    ffmpeg(["-ss", String(start), "-i", file, "-frames:v", "1", first]);
    await webp(first, name);
  }
  return Number(probe(join(OUT, `${name}.mp4`)).toFixed(2));
}

const shotsPath = join(SITE, "public/app/shots.json");
const old = existsSync(shotsPath) ? JSON.parse(readFileSync(shotsPath, "utf8")) : {};
const themes = old.themes ?? {};
const mine = themes[THEME] ?? {};
const stills = new Set(ONLY.length ? (mine.stills ?? []) : []);
const films = ONLY.length ? { ...(mine.films ?? {}) } : {};
const sizes = { ...(old.sizes ?? {}) };
const cuts = { ...(old.cuts ?? {}) };
// How each film starts, by its name: a tap's film from just before the first move; a chat that types by itself from the open.
const HOW = { vent: "ask", memory: "ask", news: "ask", flame: "ask", "card-focus": "run" };
/** What the page shows today: only these are sized and served (the raw folder keeps everything that was taken). */
const USED = new Set([
  "hero", "hero-great", "hero-okay", "hero-low", "hero-great-end", "hero-okay-end", "hero-low-end",
  "vent", "vent-end", "checkin", "checkin-end", "news", "news-end", "memory", "memory-end", "days", "days-end", "flame", "flame-end",
  "card-water", "card-skin", "card-focus", "card-sleep", "card-meal", "card-fitness", "card-reading", "card-money", "card-study", "card-shop",
  "page-money", "page-study", "page-food", "page-health", "page-habits-own", "page-todo-own", "page-library", "page-shopping",
  "game-chess-mid", "game-four-mid", "game-five-mid", "game-sudoku-mid", "game-fleet-mid", "game-hunt-mid", "game-higher-mid", "game-groups-mid", "game-trivia-mid", "game-countries-mid",
]);

const files = readdirSync(RAW).filter((f) => USED.has(basename(basename(f, ".png"), ".mov")));
for (const f of files.filter((x) => x.endsWith(".png")).sort()) {
  const name = basename(f, ".png");
  if (!want(name)) continue;
  if (name.startsWith("card-")) {
    // a card's scene is served as its exchange alone
    const key = name.slice(5);
    sizes[`x-${key}`] = await exchange(join(RAW, f), key, await cutOf(name, join(RAW, f)));
    stills.add(`x-${key}`);
  } else if (name.startsWith("game-") || name.startsWith("page-")) {
    // a game or an app's page without the phone's own bar over it or its home line under it: the page as it is
    sizes[name] = await band(join(RAW, f), name, 52, 856);
    stills.add(name);
  } else {
    await webp(join(RAW, f), name);
    stills.add(name);
    if (name === "hero") {
      // the app's own top and its text box, for the phone the chat is scrolled in
      sizes["chrome-top"] = await band(join(RAW, f), "chrome-top", 0, 139);
      sizes["chrome-bot"] = await band(join(RAW, f), "chrome-bot", 748, 874);
      stills.add("chrome-top");
      stills.add("chrome-bot");
    }
  }
  console.log(`picture ${name}`);
}
for (const f of files.filter((x) => x.endsWith(".mov")).sort()) {
  const name = basename(f, ".mov");
  if (!want(name)) continue;
  if (name.startsWith("card-")) {
    // a card's film is served as its exchange alone, cut as its picture is (x-<name>.mp4 over x-<name>.webp)
    const key = name.slice(5);
    const cut = await cutOf(name, join(RAW, `${name}.png`));
    films[`x-${key}`] = await film(join(RAW, f), `x-${key}`, HOW[name] ?? "tap", cut);
    console.log(`film x-${key}: ${films[`x-${key}`]}s`);
    continue;
  }
  films[name] = await film(join(RAW, f), name, HOW[name] ?? "tap");
  stills.add(name);
  console.log(`film ${name}: ${films[name]}s`);
}
themes[THEME] = { stills: [...stills].sort(), films };
const framesPath = join(RAW, "frames.json");
const frames = { ...(old.frames ?? {}), ...(existsSync(framesPath) ? JSON.parse(readFileSync(framesPath, "utf8")) : {}) };
const stamp = new Date();
const pad = (n) => String(n).padStart(2, "0");
const taken = `${stamp.getFullYear()}-${pad(stamp.getMonth() + 1)}-${pad(stamp.getDate())} ${pad(stamp.getHours())}:${pad(stamp.getMinutes())}`;
writeFileSync(shotsPath, `${JSON.stringify({ taken, screen: [POINTS, 874], themes, frames, sizes, cuts }, null, 2)}\n`);
console.log(`shots.json: ${stills.size} pictures, ${Object.keys(films).length} films`);
